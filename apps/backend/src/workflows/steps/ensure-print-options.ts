import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/framework/types"
import {
  FINISH_OPTION_TITLE,
  FORMAT_OPTION_TITLE,
  PAPER_OPTION_TITLE,
  type OfferingSetApplicationPlan,
} from "./prepare-offering-set-application"

type EnsurePrintOptionsCompensation = {
  created_paper_option_id?: string
  created_format_option_id?: string
  created_finish_option_id?: string
}

/**
 * Since Medusa 2.17 options are standalone entities attached to products.
 * Print options are product-specific, so create them as exclusive options
 * (matching pre-2.17 semantics) and attach them to the product.
 */
async function createExclusiveOption(
  productModule: IProductModuleService,
  productId: string,
  title: string,
  values: string[]
) {
  const option = await productModule.createProductOptions({
    title,
    values,
    is_exclusive: true,
  })
  await productModule.addProductOptionToProduct({
    product_id: productId,
    product_option_id: option.id,
  })
  return option
}

export const ensurePrintOptionsStep = createStep(
  "ensure-print-options",
  async (plan: OfferingSetApplicationPlan, { container }) => {
    const productModule = container.resolve<IProductModuleService>(
      Modules.PRODUCT
    )

    const compensation: EnsurePrintOptionsCompensation = {}
    let paperOptionId = plan.paper_option_id
    let formatOptionId = plan.format_option_id
    let finishOptionId = plan.finish_option_id

    const nextPaperValues = [
      ...plan.existing_paper_values,
      ...plan.paper_values_to_ensure,
    ]
    const nextFormatValues = [
      ...plan.existing_format_values,
      ...plan.format_values_to_ensure,
    ]
    const nextFinishValues = [
      ...plan.existing_finish_values,
      ...plan.finish_values_to_ensure,
    ]

    if (!paperOptionId && nextPaperValues.length) {
      const option = await createExclusiveOption(
        productModule,
        plan.product_id,
        PAPER_OPTION_TITLE,
        nextPaperValues
      )
      paperOptionId = option.id
      compensation.created_paper_option_id = option.id
    } else if (paperOptionId && plan.paper_values_to_ensure.length) {
      await productModule.updateProductOptions(paperOptionId, {
        values: nextPaperValues,
      })
    }

    if (!formatOptionId && nextFormatValues.length) {
      const option = await createExclusiveOption(
        productModule,
        plan.product_id,
        FORMAT_OPTION_TITLE,
        nextFormatValues
      )
      formatOptionId = option.id
      compensation.created_format_option_id = option.id
    } else if (formatOptionId && plan.format_values_to_ensure.length) {
      await productModule.updateProductOptions(formatOptionId, {
        values: nextFormatValues,
      })
    }

    if (plan.has_finish_option && !finishOptionId && nextFinishValues.length) {
      const option = await createExclusiveOption(
        productModule,
        plan.product_id,
        FINISH_OPTION_TITLE,
        nextFinishValues
      )
      finishOptionId = option.id
      compensation.created_finish_option_id = option.id
    } else if (
      plan.has_finish_option &&
      finishOptionId &&
      plan.finish_values_to_ensure.length
    ) {
      await productModule.updateProductOptions(finishOptionId, {
        values: nextFinishValues,
      })
    }

    return new StepResponse(
      {
        paper_option_id: paperOptionId,
        format_option_id: formatOptionId,
        finish_option_id: finishOptionId,
      },
      compensation
    )
  },
  async (compensation, { container }) => {
    if (!compensation) {
      return
    }

    const productModule = container.resolve<IProductModuleService>(
      Modules.PRODUCT
    )

    const optionIds = [
      compensation.created_paper_option_id,
      compensation.created_format_option_id,
      compensation.created_finish_option_id,
    ].filter((id): id is string => !!id)

    if (optionIds.length) {
      await productModule.deleteProductOptions(optionIds)
    }
  }
)
