import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { clx } from "@modules/common/components/ui"
import Reveal from "@modules/common/components/reveal"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  listing = "shop",
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  listing?: "gallery" | "shop"
}) {
  const queryParams: PaginatedProductsParams = {
    limit: 12,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (sortBy === "created_at") {
    queryParams["order"] = "created_at"
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const {
    response: { products, count },
  } = await listProductsWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
  })

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  return (
    <>
      {products.length === 0 ? (
        <p className="text-ink-muted text-base-regular">
          {listing === "gallery"
            ? "No photos in this album yet."
            : "Nothing listed here yet. Check back soon."}
        </p>
      ) : (
        <ul
          className={clx(
            "grid grid-cols-1 w-full gap-x-6 gap-y-10",
            listing === "gallery"
              ? "small:grid-cols-2 medium:grid-cols-3 gap-y-6"
              : "small:grid-cols-2 medium:grid-cols-3 gap-y-10"
          )}
          data-testid="products-list"
        >
          {products.map((p, index) => {
            return (
              <li key={p.id}>
                <Reveal delay={Math.min(index, 5) * 70}>
                  <ProductPreview product={p} region={region} />
                </Reveal>
              </li>
            )
          })}
        </ul>
      )}
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
