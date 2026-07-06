import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { fetchProdigiOrderStatusStep } from "./steps/fetch-prodigi-order-status"
import { processProdigiCallbackWorkflow } from "./process-prodigi-callback"

export type SyncProdigiOrderInput = {
  order_id: string
}

export const syncProdigiOrderWorkflow = createWorkflow(
  "sync-prodigi-order",
  function (input: SyncProdigiOrderInput) {
    const status = fetchProdigiOrderStatusStep(input)
    const target = processProdigiCallbackWorkflow.runAsStep({ input: status })

    return new WorkflowResponse({
      status,
      target,
    })
  }
)
