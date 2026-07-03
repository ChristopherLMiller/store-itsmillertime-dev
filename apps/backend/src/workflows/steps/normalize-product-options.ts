import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/framework/types"
import { FORMAT_OPTION_TITLE } from "./prepare-offering-set-application"

type NormalizeCompensation = {
  removed_variant_ids: string[]
}

// Photo products use a single "Format" option. Medusa's default product
// template adds an extra option + variant; remove those before we create print
// variants so Medusa receives one option value per variant.
export const normalizeProductOptionsStep = createStep(
  "normalize-product-options",
  async (input: { product_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const productModule = container.resolve<IProductModuleService>(
      Modules.PRODUCT
    )

    const { data: productData } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "options.id",
        "options.title",
        "variants.id",
        "variants.metadata",
        "variants.print_offering.id",
      ],
      filters: { id: input.product_id },
    })

    const product = productData[0]
    if (!product) {
      return new StepResponse(null, null)
    }

    const variants = (product.variants ?? []).filter(
      (v): v is NonNullable<typeof v> => !!v
    )
    const options = (product.options ?? []).filter(
      (o): o is NonNullable<typeof o> => !!o
    )

    const removedVariantIds = variants
      .filter((variant) => {
        const linkedOffering = (
          variant as { print_offering?: { id: string } | null }
        ).print_offering?.id
        const isDigital =
          (variant.metadata as Record<string, unknown> | null)
            ?.fulfillment_type === "digital"

        return !linkedOffering && !isDigital
      })
      .map((variant) => variant.id)

    const removedOptionIds = options
      .filter((option) => option.title !== FORMAT_OPTION_TITLE)
      .map((option) => option.id)

    if (removedVariantIds.length) {
      await productModule.softDeleteProductVariants(removedVariantIds)
    }

    if (removedOptionIds.length) {
      await productModule.deleteProductOptions(removedOptionIds)
    }

    const compensation: NormalizeCompensation | null =
      removedVariantIds.length
        ? { removed_variant_ids: removedVariantIds }
        : null

    return new StepResponse(
      {
        removed_variant_ids: removedVariantIds,
        removed_option_ids: removedOptionIds,
      },
      compensation
    )
  },
  async (compensation, { container }) => {
    if (!compensation?.removed_variant_ids.length) {
      return
    }

    const productModule = container.resolve<IProductModuleService>(
      Modules.PRODUCT
    )
    await productModule.restoreProductVariants(compensation.removed_variant_ids)
  }
)
