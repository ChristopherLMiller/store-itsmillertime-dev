import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows"
import type { IProductModuleService } from "@medusajs/framework/types"
import { buildVariantPrices } from "../utils/print-pricing"
import { findLinkedVariants } from "../utils/linked-variants"
import {
  FORMAT_OPTION_TITLE,
  PAPER_OPTION_TITLE,
} from "./steps/prepare-offering-set-application"

const CHUNK_SIZE = 50

type LinkedVariant = {
  id: string
  product_id: string
  metadata: Record<string, unknown> | null
  options?: ({
    option?: { title?: string | null } | null
    value?: string | null
  } | null)[] | null
}

function getOptionValueByTitle(
  variant: LinkedVariant,
  title: string
): string | undefined {
  return variant.options
    ?.find((entry) => entry?.option?.title === title)
    ?.value?.trim() || undefined
}

function buildVariantTitle(variant: LinkedVariant, offeringLabel: string) {
  const paper = getOptionValueByTitle(variant, PAPER_OPTION_TITLE)
  return paper ? `${paper} · ${offeringLabel}` : offeringLabel
}

type OfferingWithVariants = {
  id: string
  prodigi_sku: string
  label: string
  category: string
  width: number | null
  height: number | null
  substrate: string | null
  retail_price: number | null
  price_currency: string | null
  product_variants?: (LinkedVariant | null)[] | null
}

async function loadOfferingWithVariants(
  container: { resolve: (key: string) => unknown },
  offeringId: string
): Promise<OfferingWithVariants | undefined> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (config: Record<string, unknown>) => Promise<{ data: unknown[] }>
  }

  const { data } = await query.graph({
    entity: "print_offering",
    fields: [
      "id",
      "prodigi_sku",
      "label",
      "category",
      "width",
      "height",
      "substrate",
      "retail_price",
      "price_currency",
    ],
    filters: { id: offeringId },
  })

  const offering = data[0] as OfferingWithVariants | undefined
  if (!offering) {
    return undefined
  }

  const variants = await findLinkedVariants(container, offeringId)
  return { ...offering, product_variants: variants }
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

/**
 * Mirrors the offering's current label/specs/prices onto every linked variant.
 */
const updateLinkedVariantsStep = createStep(
  "update-linked-variants",
  async (input: { offering_id: string }, { container }) => {
    const offering = await loadOfferingWithVariants(
      container,
      input.offering_id
    )

    if (!offering) {
      return new StepResponse({ updated: 0 })
    }

    const variants = (offering.product_variants ?? []).filter(
      (v): v is LinkedVariant => !!v
    )

    const productModule = container.resolve<IProductModuleService>(
      Modules.PRODUCT
    )

    const prices = buildVariantPrices(
      offering.retail_price,
      offering.price_currency
    )

    let updated = 0
    for (const batch of chunk(variants, CHUNK_SIZE)) {
      await productModule.upsertProductVariants(
        batch.map((variant) => ({
          id: variant.id,
          title: buildVariantTitle(variant, offering.label),
          sku: `${offering.prodigi_sku}__${variant.product_id}`,
          metadata: {
            ...(variant.metadata ?? {}),
            prodigi_sku: offering.prodigi_sku,
            print_category: offering.category,
            width: offering.width,
            height: offering.height,
            substrate: offering.substrate,
          },
          ...(getOptionValueByTitle(variant, FORMAT_OPTION_TITLE)
            ? {
                options: {
                  [FORMAT_OPTION_TITLE]: offering.label,
                },
              }
            : {}),
        }))
      )

      if (prices?.length) {
        await updateProductVariantsWorkflow(container).run({
          input: {
            product_variants: batch.map((variant) => ({
              id: variant.id,
              prices,
            })),
          },
        })
      }

      updated += batch.length
    }

    return new StepResponse({ updated })
  }
)

export const propagateOfferingUpdateWorkflow = createWorkflow(
  "propagate-offering-update",
  function (input: { offering_id: string }) {
    const result = updateLinkedVariantsStep(input)
    return new WorkflowResponse(result)
  }
)

/**
 * Soft-deletes linked variants (preserves order history; restorable).
 * When `product_ids` is provided the deletion is scoped to those products
 * (used for "removed from a set" - only that set's subscribers are affected).
 */
const softDeleteLinkedVariantsStep = createStep(
  "soft-delete-linked-variants",
  async (
    input: { offering_id: string; product_ids?: string[] },
    { container }
  ) => {
    const offering = await loadOfferingWithVariants(
      container,
      input.offering_id
    )

    if (!offering) {
      return new StepResponse({ removed: 0 }, [])
    }

    const scope = input.product_ids ? new Set(input.product_ids) : null

    const variantIds = (offering.product_variants ?? [])
      .filter((v): v is LinkedVariant => !!v)
      .filter((v) => !scope || scope.has(v.product_id))
      .map((v) => v.id)

    if (!variantIds.length) {
      return new StepResponse({ removed: 0 }, [])
    }

    const productModule = container.resolve<IProductModuleService>(
      Modules.PRODUCT
    )

    for (const batch of chunk(variantIds, CHUNK_SIZE)) {
      await productModule.softDeleteProductVariants(batch)
    }

    return new StepResponse({ removed: variantIds.length }, variantIds)
  },
  async (variantIds, { container }) => {
    if (!variantIds?.length) {
      return
    }
    const productModule = container.resolve<IProductModuleService>(
      Modules.PRODUCT
    )
    await productModule.restoreProductVariants(variantIds)
  }
)

export const propagateOfferingDeactivationWorkflow = createWorkflow(
  "propagate-offering-deactivation",
  function (input: { offering_id: string }) {
    const result = softDeleteLinkedVariantsStep({
      offering_id: input.offering_id,
    })
    return new WorkflowResponse(result)
  }
)

export const propagateOfferingRemovalFromSetWorkflow = createWorkflow(
  "propagate-offering-removal-from-set",
  function (input: { offering_id: string; product_ids: string[] }) {
    const result = softDeleteLinkedVariantsStep(input)
    return new WorkflowResponse(result)
  }
)
