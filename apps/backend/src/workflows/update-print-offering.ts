import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import {
  updatePrintOfferingStep,
  type UpdatePrintOfferingStepInput,
} from "./steps/update-print-offering"

export const PRINT_OFFERING_UPDATED_EVENT = "print_offering.updated"

export const updatePrintOfferingWorkflow = createWorkflow(
  "update-print-offering",
  function (input: UpdatePrintOfferingStepInput) {
    const result = updatePrintOfferingStep(input)

    const eventData = transform({ result }, ({ result }) => ({
      id: result.offering.id,
      active: result.offering.active,
      previous_active: result.previous_active,
      previous_set_ids: result.previous_set_ids,
      new_set_ids: result.new_set_ids,
      specs_changed: result.specs_changed,
    }))

    emitEventStep({
      eventName: PRINT_OFFERING_UPDATED_EVENT,
      data: eventData,
    })

    return new WorkflowResponse(result)
  }
)
