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

export function departmentCoverUrl(
  category: HttpTypes.StoreProductCategory
): string | null {
  const own = categoryCoverUrl(category)
  if (own) {
    return own
  }

  for (const child of category.category_children ?? []) {
    const childCover = categoryCoverUrl(child)
    if (childCover) {
      return childCover
    }
  }

  return null
}

export function isAlbumCategory(
  category: Pick<
    HttpTypes.StoreProductCategory,
    "handle" | "metadata" | "parent_category"
  >
): boolean {
  if (category.metadata?.kind === "album") {
    return true
  }

  return category.parent_category?.handle === "prints"
}

export const DEPARTMENT_INTROS: Record<string, string> = {
  prints: "Prints and digital downloads from the gallery.",
  "board-games": "Second-hand games, listed the way a shop should.",
  "built-models": "Finished scale models, ready for a shelf.",
  "3d-prints": "Printed pieces from the studio.",
}

export function departmentIntro(
  category: Pick<HttpTypes.StoreProductCategory, "handle" | "description">
): string | null {
  return DEPARTMENT_INTROS[category.handle] || category.description || null
}
