import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  dismissOfferingSetLinksStep,
  prepareRemoveOfferingSetStep,
  removeOfferingSetVariantsStep,
} from "./steps/prepare-remove-offering-set"

export type RemoveOfferingSetFromProductInput = {
  product_id: string
  offering_set_id: string
}

export const removeOfferingSetFromProductWorkflow = createWorkflow(
  "remove-offering-set-from-product",
  function (input: RemoveOfferingSetFromProductInput) {
    const plan = prepareRemoveOfferingSetStep(input)

    removeOfferingSetVariantsStep(plan)
    dismissOfferingSetLinksStep(plan)

    return new WorkflowResponse(plan)
  }
)
