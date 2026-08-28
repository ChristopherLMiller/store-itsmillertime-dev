import { MedusaError } from "@medusajs/framework/utils"
import type {
  IProductModuleService,
  ProductCategoryDTO,
} from "@medusajs/framework/types"

export type EnsureCategoryInput = {
  name: string
  handle: string
  description?: string
  parent_category_id?: string | null
  rank?: number
  metadata?: Record<string, unknown>
}

async function findCategoryByHandle(
  productModule: IProductModuleService,
  handle: string
): Promise<ProductCategoryDTO | null> {
  const [direct] = await productModule.listProductCategories(
    { handle },
    { take: 1 }
  )
  if (direct) {
    return direct
  }

  const listed = await productModule.listProductCategories(
    {},
    { take: 200 }
  )
  return listed.find((category) => category.handle === handle) ?? null
}

/**
 * Idempotent category upsert by handle. Creates one category at a time so
 * Medusa's nested-set tree can assign rank/mpath. Duplicate-handle races
 * re-read instead of swallowing the original error.
 */
export async function ensureProductCategory(
  productModule: IProductModuleService,
  input: EnsureCategoryInput
): Promise<{ category: ProductCategoryDTO; created: boolean }> {
  const existing = await findCategoryByHandle(productModule, input.handle)
  if (existing) {
    return { category: existing, created: false }
  }

  try {
    const createdList = await productModule.createProductCategories([
      {
        name: input.name,
        handle: input.handle,
        description: input.description,
        is_active: true,
        is_internal: false,
        parent_category_id: input.parent_category_id ?? null,
        ...(input.rank != null ? { rank: input.rank } : {}),
        metadata: input.metadata,
      },
    ])
    const created = createdList[0]
    if (!created) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to create category "${input.handle}": create returned no category`
      )
    }

    return { category: created, created: true }
  } catch (error) {
    const raced = await findCategoryByHandle(productModule, input.handle)
    if (raced) {
      return { category: raced, created: false }
    }

    const message = error instanceof Error ? error.message : String(error)
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Failed to create category "${input.handle}": ${message}`
    )
  }
}
