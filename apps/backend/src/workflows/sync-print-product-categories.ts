import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ensureDepartmentCategoriesStep } from "./steps/ensure-department-categories"
import { syncPrintProductCategoriesStep } from "./steps/sync-print-product-categories"

export type SyncPrintProductCategoriesWorkflowInput = {
  product_id: string
}

export const syncPrintProductCategoriesWorkflow = createWorkflow(
  "sync-print-product-categories",
  function (input: SyncPrintProductCategoriesWorkflowInput) {
    ensureDepartmentCategoriesStep()
    const result = syncPrintProductCategoriesStep(input)
    return new WorkflowResponse(result)
  }
)
