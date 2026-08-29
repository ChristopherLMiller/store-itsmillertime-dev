import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import Reveal from "@modules/common/components/reveal"
import Product from "../product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
  layout?: "grid" | "aside"
}

export default async function RelatedProducts({
  product,
  countryCode,
  layout = "grid",
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // edit this function to define your related products logic
  const queryParams: HttpTypes.StoreProductListParams = {}
  if (region?.id) {
    queryParams.region_id = region.id
  }
  if (product.categories?.length) {
    queryParams.category_id = product.categories
      .map((category) => category.id)
      .filter(Boolean) as string[]
  } else if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  }
  const tagIds = product.tags?.map((t) => t.id).filter(Boolean) as string[]
  if (tagIds?.length) {
    queryParams.tag_id = tagIds
  }
  queryParams.is_giftcard = false

  let products: HttpTypes.StoreProduct[] = []
  try {
    products = await listProducts({
      queryParams,
      countryCode,
    }).then(({ response }) => {
      return response.products.filter(
        (responseProduct) => responseProduct.id !== product.id
      )
    })
  } catch {
    return null
  }

  if (!products.length) {
    return null
  }

  const aside = layout === "aside"
  const shown = aside ? products.slice(0, 2) : products

  return (
    <div>
      <div className={aside ? "mb-4" : "flex flex-col mb-10"}>
        <span className="text-sm text-ink-muted">More like this</span>
      </div>

      <ul
        className={
          aside
            ? "grid grid-cols-1 gap-4"
            : "grid grid-cols-1 small:grid-cols-2 medium:grid-cols-3 gap-x-8 gap-y-6"
        }
      >
        {shown.map((relatedProduct, index) => (
          <li key={relatedProduct.id}>
            <Reveal delay={Math.min(index, 5) * 70}>
              <Product region={region} product={relatedProduct} />
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  )
}
