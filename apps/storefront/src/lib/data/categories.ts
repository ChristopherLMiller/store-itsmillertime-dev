import { sdk } from "@lib/config"
import { fetchCache } from "@lib/util/cache"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

export const listCategories = async (query?: Record<string, unknown>) => {
  const next = {
    ...(await getCacheOptions("categories")),
  }

  const limit = query?.limit || 100

  return sdk.client
    .fetch<{ product_categories: HttpTypes.StoreProductCategory[] }>(
      "/store/product-categories",
      {
        query: {
          fields:
            "*category_children, *parent_category, *parent_category.parent_category, +metadata, +category_children.metadata, +rank",
          include_descendants_tree: true,
          include_ancestors_tree: true,
          limit,
          ...query,
        },
        next,
        cache: fetchCache,
      }
    )
    .then(({ product_categories }) => product_categories)
}

export const getCategoryByHandle = async (categoryHandle: string[]) => {
  const handle = categoryHandle[categoryHandle.length - 1]

  const next = {
    ...(await getCacheOptions("categories")),
  }

  return sdk.client
    .fetch<HttpTypes.StoreProductCategoryListResponse>(
      `/store/product-categories`,
      {
        query: {
          fields:
            "*category_children, *parent_category, *parent_category.parent_category, +metadata, +category_children.metadata",
          handle,
          include_descendants_tree: true,
          include_ancestors_tree: true,
        },
        next,
        cache: fetchCache,
      }
    )
    .then(({ product_categories }) => product_categories[0])
}
