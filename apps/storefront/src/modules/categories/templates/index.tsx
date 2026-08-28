import { notFound } from "next/navigation"
import { Suspense } from "react"

import { categoryCoverUrl } from "@lib/util/catalog"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PhotoFrame from "@modules/common/components/photo-frame"
import { Text } from "@modules/common/components/ui"
import { HttpTypes } from "@medusajs/types"

export default function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!category || !countryCode) notFound()

  const parents = [] as HttpTypes.StoreProductCategory[]

  const getParents = (category: HttpTypes.StoreProductCategory) => {
    if (category.parent_category) {
      parents.push(category.parent_category)
      getParents(category.parent_category)
    }
  }

  getParents(category)

  const children = category.category_children ?? []
  const isParentLanding = children.length > 0

  return (
    <div
      className="content-container py-10 small:py-14"
      data-testid="category-container"
    >
      <div className="flex flex-col small:flex-row small:items-start small:gap-12">
        {!isParentLanding && (
          <RefinementList sortBy={sort} data-testid="sort-by-container" />
        )}
        <div className="w-full min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 mb-4 text-stone-500">
            {parents.map((parent) => (
              <span key={parent.id} className="text-sm">
                <LocalizedClientLink
                  className="hover:text-stone-900"
                  href={`/categories/${parent.handle}`}
                  data-testid="sort-by-link"
                >
                  {parent.name}
                </LocalizedClientLink>
                <span className="mx-2">/</span>
              </span>
            ))}
            <h1
              className="text-3xl font-normal text-stone-900"
              data-testid="category-page-title"
            >
              {category.name}
            </h1>
          </div>
          {category.description && (
            <p className="mb-10 text-stone-600 max-w-2xl">
              {category.description}
            </p>
          )}
          {isParentLanding ? (
            <ul className="grid grid-cols-1 small:grid-cols-2 medium:grid-cols-3 gap-x-8 gap-y-10">
              {children.map((child) => (
                <li key={child.id}>
                  <LocalizedClientLink
                    href={`/categories/${child.handle}`}
                    className="group block"
                  >
                    <PhotoFrame
                      src={categoryCoverUrl(child)}
                      alt={child.name}
                      aspect="sheet"
                    />
                    <Text className="text-stone-800 mt-3">{child.name}</Text>
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          ) : (
            <Suspense
              fallback={
                <SkeletonProductGrid
                  numberOfProducts={category.products?.length ?? 8}
                />
              }
            >
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                categoryId={category.id}
                countryCode={countryCode}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  )
}
