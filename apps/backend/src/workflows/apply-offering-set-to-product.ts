import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import type { LinkDefinition } from "@medusajs/framework/types"
import {
  createProductVariantsWorkflow,
  createRemoteLinkStep,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"
import { PRINT_CATALOG_MODULE } from "../modules/print-catalog"
import {
  DIGITAL_FORMAT_VALUE,
  DIGITAL_PAPER_VALUE,
  FORMAT_OPTION_TITLE,
  PAPER_OPTION_TITLE,
  prepareOfferingSetApplicationStep,
} from "./steps/prepare-offering-set-application"
import { normalizeProductOptionsStep } from "./steps/normalize-product-options"
import { ensurePrintOptionsStep } from "./steps/ensure-print-options"
import { buildVariantPrices } from "../utils/print-pricing"

export type ApplyOfferingSetToProductInput = {
  product_id: string
  offering_set_id: string
  sells_digital?: boolean
  digital_price?: number
  digital_price_currency?: string
}

export const applyOfferingSetToProductWorkflow = createWorkflow(
  "apply-offering-set-to-product",
  function (input: ApplyOfferingSetToProductInput) {
    normalizeProductOptionsStep({ product_id: input.product_id })

    const plan = prepareOfferingSetApplicationStep(input)

    ensurePrintOptionsStep(plan)

    const variantsInput = transform({ plan, input }, ({ plan, input }) => ({
      product_variants: [
        ...plan.variants_to_create.map((v) => ({
          product_id: plan.product_id,
          title: `${v.paper_name} · ${v.label}`,
          options: {
            [PAPER_OPTION_TITLE]: v.paper_name,
            [FORMAT_OPTION_TITLE]: v.label,
          },
          manage_inventory: false,
          prices: buildVariantPrices(v.retail_price, v.price_currency),
          sku: `${v.prodigi_sku}__${plan.product_id}`,
          metadata: {
            print_offering_id: v.offering_id,
            offering_set_id: plan.offering_set_id,
            prodigi_sku: v.prodigi_sku,
            print_category: v.category,
            width: v.width,
            height: v.height,
            substrate: v.substrate,
            fulfillment_type: "prodigi",
          },
        })),
        ...(plan.create_digital_variant
          ? [
              {
                product_id: plan.product_id,
                title: DIGITAL_FORMAT_VALUE,
                options: {
                  [PAPER_OPTION_TITLE]: DIGITAL_PAPER_VALUE,
                  [FORMAT_OPTION_TITLE]: DIGITAL_FORMAT_VALUE,
                },
                manage_inventory: false,
                prices: buildVariantPrices(
                  input.digital_price,
                  input.digital_price_currency
                ),
                metadata: {
                  fulfillment_type: "digital",
                },
              },
            ]
          : []),
      ],
    }))

    const hasVariantsToCreate = transform({ plan }, ({ plan }) =>
      plan.variants_to_create.length > 0 || plan.create_digital_variant
    )

    const createdVariants = when(
      hasVariantsToCreate,
      (shouldCreate) => shouldCreate
    ).then(() =>
      createProductVariantsWorkflow.runAsStep({
        input: variantsInput,
      })
    )

    const upgradeInput = transform({ plan }, ({ plan }) => ({
      product_variants: plan.variants_to_upgrade.map((variant) => ({
        id: variant.variant_id,
        title: `${variant.paper_name} · ${variant.format_label}`,
        options: {
          [PAPER_OPTION_TITLE]: variant.paper_name,
          [FORMAT_OPTION_TITLE]: variant.format_label,
        },
        metadata: {
          offering_set_id: plan.offering_set_id,
        },
      })),
    }))

    const hasVariantsToUpgrade = transform(
      { plan },
      ({ plan }) => plan.variants_to_upgrade.length > 0
    )

    when(hasVariantsToUpgrade, (shouldUpgrade) => shouldUpgrade).then(() =>
      updateProductVariantsWorkflow.runAsStep({
        input: upgradeInput,
      })
    )

    const variantLinks = transform(
      { createdVariants },
      ({ createdVariants }) =>
        (createdVariants ?? [])
          .filter(
            (v) =>
              !!(v.metadata as Record<string, unknown> | null)
                ?.print_offering_id
          )
          .map(
            (v) =>
              ({
                [Modules.PRODUCT]: { product_variant_id: v.id },
                [PRINT_CATALOG_MODULE]: {
                  print_offering_id: (
                    v.metadata as Record<string, unknown>
                  ).print_offering_id as string,
                },
              }) as LinkDefinition
          )
    )

    createRemoteLinkStep(variantLinks).config({
      name: "create-variant-offering-links",
    })

    const setLinks = transform({ plan }, ({ plan }) =>
      plan.already_linked
        ? []
        : [
            {
              [Modules.PRODUCT]: { product_id: plan.product_id },
              [PRINT_CATALOG_MODULE]: {
                offering_set_id: plan.offering_set_id,
              },
            } as LinkDefinition,
          ]
    )

    createRemoteLinkStep(setLinks).config({
      name: "create-product-set-link",
    })

    return new WorkflowResponse({
      plan,
      created_variants: createdVariants,
    })
  }
)
