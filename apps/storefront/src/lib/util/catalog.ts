import { HttpTypes } from "@medusajs/types"

const DEPARTMENT_HANDLES = new Set([
  "prints",
  "board-games",
  "built-models",
  "3d-prints",
])

export function getDepartmentCategories(
  categories: HttpTypes.StoreProductCategory[] | null | undefined
): HttpTypes.StoreProductCategory[] {
  return (categories ?? [])
    .filter((category) => {
      const kind = category.metadata?.kind
      if (kind === "department") {
        return true
      }
      if (kind === "album") {
        return false
      }
      return (
        !category.parent_category && DEPARTMENT_HANDLES.has(category.handle)
      )
    })
    .sort((a, b) => categoryRank(a) - categoryRank(b))
}

function categoryRank(category: HttpTypes.StoreProductCategory): number {
  const rank = (category as HttpTypes.StoreProductCategory & { rank?: number | null })
    .rank
  return typeof rank === "number" ? rank : 0
}

export function categoryCoverUrl(
  category: HttpTypes.StoreProductCategory
): string | null {
  const cover = category.metadata?.cover_url
  return typeof cover === "string" && cover ? cover : null
}
