import { notFound } from "next/navigation"
import { Suspense } from "react"

import { categoryCoverUrl, departmentIntro, isAlbumCategory } from "@lib/util/catalog"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PhotoFrame from "@modules/common/components/photo-frame"
import Reveal from "@modules/common/components/reveal"
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
  const albumListing = isAlbumCategory(category) || category.handle === "prints"
  const listing = albumListing ? "gallery" : "shop"
  const intro = departmentIntro(category)

  return (
    <div
      className="content-container py-10 small:py-14"
      data-testid="category-container"
    >
      <div className="flex flex-col small:flex-row small:items-start small:gap-12">
        {!isParentLanding && listing === "shop" && (
          <RefinementList sortBy={sort} data-testid="sort-by-container" />
        )}
        <div className="w-full min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 mb-4 text-ink-muted">
            {parents.map((parent) => (
              <span key={parent.id} className="text-sm">
                <LocalizedClientLink
                className="hover:text-bronze"
                  href={`/categories/${parent.handle}`}
                  data-testid="sort-by-link"
                >
                  {parent.name}
                </LocalizedClientLink>
                <span className="mx-2 text-ink-muted">/</span>
              </span>
            ))}
            <h1
              className="font-display text-3xl small:text-4xl tracking-tight text-ink shop-fade-up"
              data-testid="category-page-title"
            >
              {category.name}
            </h1>
            <span className="hidden small:block w-10 h-px bg-bronze shop-rule" />
          </div>
          {intro && (
            <p className="mb-10 text-ink-muted max-w-2xl leading-relaxed shop-fade-up [animation-delay:80ms]">
              {intro}
            </p>
          )}
          {isParentLanding ? (
            <ul className="grid grid-cols-1 small:grid-cols-2 medium:grid-cols-3 gap-x-6 gap-y-6">
              {children.map((child, index) => (
                <li key={child.id}>
                  <Reveal delay={index * 80}>
                    <LocalizedClientLink
                      href={`/categories/${child.handle}`}
                      className="group block relative"
                    >
                      <PhotoFrame
                        src={categoryCoverUrl(child)}
                        alt={child.name}
                        aspect="sheet"
                        fit="cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-night/80 via-night/15 to-transparent transition-opacity duration-500" />
                      <div className="absolute inset-x-0 bottom-0 p-4 transition-transform duration-500 ease-out group-hover:-translate-y-0.5">
                        <Text className="font-display text-lg text-cream">
                          {child.name}
                        </Text>
                      </div>
                    </LocalizedClientLink>
                  </Reveal>
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
                listing={listing}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  )
}
