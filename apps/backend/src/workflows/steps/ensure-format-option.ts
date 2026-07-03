import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/framework/types"
import {
  FORMAT_OPTION_TITLE,
  type OfferingSetApplicationPlan,
} from "./prepare-offering-set-application"

// Ensures the product has a "Format" option containing every option value the
// planned variants need. Values are only ever added, never removed.
export const ensureFormatOptionStep = createStep(
  "ensure-format-option",
  async (plan: OfferingSetApplicationPlan, { container }) => {
    const productModule = container.resolve<IProductModuleService>(
      Modules.PRODUCT
    )

    const neededValues = [
      ...plan.existing_option_values,
      ...plan.values_to_ensure,
    ]

    if (!neededValues.length) {
      return new StepResponse(null, null)
    }

    if (!plan.format_option_id) {
      const [option] = await productModule.createProductOptions([
        {
          product_id: plan.product_id,
          title: FORMAT_OPTION_TITLE,
          values: neededValues,
        },
      ])
      return new StepResponse(option.id, { created_option_id: option.id })
    }

    if (plan.values_to_ensure.length) {
      await productModule.updateProductOptions(plan.format_option_id, {
        values: neededValues,
      })
    }

    return new StepResponse(plan.format_option_id, null)
  },
  async (compensation, { container }) => {
    if (!compensation?.created_option_id) {
      return
    }
    const productModule = container.resolve<IProductModuleService>(
      Modules.PRODUCT
    )
    await productModule.deleteProductOptions([compensation.created_option_id])
  }
)
