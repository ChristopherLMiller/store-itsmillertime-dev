import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/framework/types"
import {
  FORMAT_OPTION_TITLE,
  PAPER_OPTION_TITLE,
  type OfferingSetApplicationPlan,
} from "./prepare-offering-set-application"

type EnsurePrintOptionsCompensation = {
  created_paper_option_id?: string
  created_format_option_id?: string
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

    const nextPaperValues = [
      ...plan.existing_paper_values,
      ...plan.paper_values_to_ensure,
    ]
    const nextFormatValues = [
      ...plan.existing_format_values,
      ...plan.format_values_to_ensure,
    ]

    if (!paperOptionId && nextPaperValues.length) {
      const [option] = await productModule.createProductOptions([
        {
          product_id: plan.product_id,
          title: PAPER_OPTION_TITLE,
          values: nextPaperValues,
        },
      ])
      paperOptionId = option.id
      compensation.created_paper_option_id = option.id
    } else if (paperOptionId && plan.paper_values_to_ensure.length) {
      await productModule.updateProductOptions(paperOptionId, {
        values: nextPaperValues,
      })
    }

    if (!formatOptionId && nextFormatValues.length) {
      const [option] = await productModule.createProductOptions([
        {
          product_id: plan.product_id,
          title: FORMAT_OPTION_TITLE,
          values: nextFormatValues,
        },
      ])
      formatOptionId = option.id
      compensation.created_format_option_id = option.id
    } else if (formatOptionId && plan.format_values_to_ensure.length) {
      await productModule.updateProductOptions(formatOptionId, {
        values: nextFormatValues,
      })
    }

    return new StepResponse(
      {
        paper_option_id: paperOptionId,
        format_option_id: formatOptionId,
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
    ].filter((id): id is string => !!id)

    if (optionIds.length) {
      await productModule.deleteProductOptions(optionIds)
    }
  }
)
