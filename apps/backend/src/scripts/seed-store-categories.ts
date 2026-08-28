import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ensureDepartmentCategoriesWorkflow } from "../workflows/ensure-department-categories"

export default async function seedStoreCategories({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const { result } = await ensureDepartmentCategoriesWorkflow(container).run({
    input: {},
  })

  logger.info(
    `Store departments ready: ${result.categories
      .map((category) => category.handle)
      .join(", ")}${
      result.created_ids.length
        ? ` (created ${result.created_ids.length})`
        : " (already present)"
    }`
  )
}
