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
  dismissRemoteLinkStep,
} from "@medusajs/medusa/core-flows"
import { PRINT_CATALOG_MODULE } from "../modules/print-catalog"
import {
  DIGITAL_FORMAT_VALUE,
  FORMAT_OPTION_TITLE,
  prepareOfferingSetApplicationStep,
} from "./steps/prepare-offering-set-application"
import { normalizeProductOptionsStep } from "./steps/normalize-product-options"
import { ensureFormatOptionStep } from "./steps/ensure-format-option"
import { buildVariantPrices } from "../utils/print-pricing"

export type ApplyOfferingSetToProductInput = {
  product_id: string
  offering_set_id: string
  sells_digital?: boolean
}

export const applyOfferingSetToProductWorkflow = createWorkflow(
  "apply-offering-set-to-product",
  function (input: ApplyOfferingSetToProductInput) {
    normalizeProductOptionsStep({ product_id: input.product_id })

    const plan = prepareOfferingSetApplicationStep(input)

    ensureFormatOptionStep(plan)

    const variantsInput = transform({ plan }, ({ plan }) => ({
      product_variants: [
        ...plan.variants_to_create.map((v) => ({
          product_id: plan.product_id,
          title: v.label,
          options: { [FORMAT_OPTION_TITLE]: v.label },
          manage_inventory: false,
          prices: buildVariantPrices(v.retail_price, v.price_currency),
          // Parseable mirror of the Prodigi SKU; line items snapshot variant
          // sku, which is the only SKU-ish field available to the fulfillment
          // provider's calculatePrice. The module link stays authoritative.
          sku: `${v.prodigi_sku}__${plan.product_id}`,
          metadata: {
            print_offering_id: v.offering_id,
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
                options: { [FORMAT_OPTION_TITLE]: DIGITAL_FORMAT_VALUE },
                manage_inventory: false,
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

    // Authoritative ProductVariant <-> PrintOffering links, mapped back via the
    // print_offering_id mirrored into variant metadata.
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

    // If the product was subscribed to a different set, unlink it first.
    const staleSetLinks = transform({ plan }, ({ plan }) =>
      plan.previous_offering_set_id &&
      plan.previous_offering_set_id !== plan.offering_set_id
        ? [
            {
              [Modules.PRODUCT]: { product_id: plan.product_id },
              [PRINT_CATALOG_MODULE]: {
                offering_set_id: plan.previous_offering_set_id,
              },
            } as LinkDefinition,
          ]
        : []
    )

    dismissRemoteLinkStep(staleSetLinks)

    const setLinks = transform({ plan }, ({ plan }) =>
      plan.previous_offering_set_id === plan.offering_set_id
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
