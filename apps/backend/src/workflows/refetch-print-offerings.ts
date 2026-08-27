import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import {
  refetchPrintOfferingsStep,
  type RefetchPrintOfferingsResult,
} from "./steps/refetch-print-offerings"

export const refetchPrintOfferingsWorkflow = createWorkflow(
  "refetch-print-offerings",
  function (input: Record<string, unknown>) {
    const result = refetchPrintOfferingsStep(input)

    return new WorkflowResponse<RefetchPrintOfferingsResult>(result)
  }
)
