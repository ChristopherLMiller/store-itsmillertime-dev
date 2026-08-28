import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ensureDepartmentCategoriesStep } from "./steps/ensure-department-categories"

export const ensureDepartmentCategoriesWorkflow = createWorkflow(
  "ensure-department-categories",
  function (_input: Record<string, unknown>) {
    const result = ensureDepartmentCategoriesStep()
    return new WorkflowResponse(result)
  }
)
