import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import Product from "../product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
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

  return (
    <div>
      <div className="flex flex-col mb-10">
        <span className="text-sm uppercase tracking-[0.18em] text-stone-500 mb-2">
          More like this
        </span>
      </div>

      <ul className="grid grid-cols-1 small:grid-cols-2 medium:grid-cols-3 gap-x-8 gap-y-10">
        {products.map((relatedProduct) => (
          <li key={relatedProduct.id}>
            <Product region={region} product={relatedProduct} />
          </li>
        ))}
      </ul>
    </div>
  )
}
