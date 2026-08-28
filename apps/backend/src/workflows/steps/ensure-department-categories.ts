import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/framework/types"
import { ensureProductCategory } from "../../utils/ensure-product-category"
import {
  CATEGORY_KIND_DEPARTMENT,
  DEPARTMENT_CATEGORIES,
} from "../../utils/store-catalog"

type CategoryRecord = {
  id: string
  handle: string
}

export type EnsureDepartmentCategoriesResult = {
  categories: CategoryRecord[]
  created_ids: string[]
}

export const ensureDepartmentCategoriesStep = createStep(
  "ensure-department-categories",
  async (_, { container }) => {
    const productModule: IProductModuleService = container.resolve(
      Modules.PRODUCT
    )

    const createdIds: string[] = []
    const categories: CategoryRecord[] = []

    for (const department of DEPARTMENT_CATEGORIES) {
      const { category, created } = await ensureProductCategory(productModule, {
        name: department.name,
        handle: department.handle,
        description: department.description,
        parent_category_id: null,
        rank: department.rank,
        metadata: { kind: CATEGORY_KIND_DEPARTMENT },
      })

      if (created) {
        createdIds.push(category.id)
      }

      categories.push({ id: category.id, handle: category.handle })
    }

    return new StepResponse<EnsureDepartmentCategoriesResult, string[]>(
      { categories, created_ids: createdIds },
      createdIds
    )
  },
  async (createdIds, { container }) => {
    if (!createdIds?.length) {
      return
    }
    const productModule: IProductModuleService = container.resolve(
      Modules.PRODUCT
    )
    await productModule.deleteProductCategories(createdIds)
  }
)
