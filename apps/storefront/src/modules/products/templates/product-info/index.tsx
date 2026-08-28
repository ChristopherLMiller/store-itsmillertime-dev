import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { productGalleryUrl } from "@lib/util/site"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

function categoryCrumbs(product: HttpTypes.StoreProduct) {
  const categories = product.categories ?? []
  if (!categories.length) {
    return []
  }

  const album = categories.find(
    (category) => category.parent_category?.handle === "prints"
  )
  const chosen = album ?? categories[0]
  const crumbs: { name: string; handle: string }[] = []

  if (chosen.parent_category) {
    crumbs.push({
      name: chosen.parent_category.name ?? chosen.parent_category.handle,
      handle: chosen.parent_category.handle,
    })
  }

  crumbs.push({ name: chosen.name, handle: chosen.handle })
  return crumbs
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const crumbs = categoryCrumbs(product)
  const galleryUrl = productGalleryUrl(product)

  return (
    <div id="product-info" className="flex flex-col gap-4">
      {crumbs.length > 0 ? (
        <div className="text-sm text-stone-500 flex flex-wrap gap-x-2">
          {crumbs.map((crumb, index) => (
            <span key={crumb.handle} className="flex gap-x-2">
              {index > 0 && <span>/</span>}
              <LocalizedClientLink
                href={`/categories/${crumb.handle}`}
                className="hover:text-stone-800"
              >
                {crumb.name}
              </LocalizedClientLink>
            </span>
          ))}
        </div>
      ) : product.collection ? (
        <LocalizedClientLink
          href={`/collections/${product.collection.handle}`}
          className="text-sm text-stone-500 hover:text-stone-800"
        >
          {product.collection.title}
        </LocalizedClientLink>
      ) : null}
      <Heading
        level="h1"
        className="text-2xl small:text-3xl font-normal leading-snug text-stone-900"
        data-testid="product-title"
      >
        {product.title}
      </Heading>

      {product.description && (
        <Text
          className="text-base-regular text-stone-600 whitespace-pre-line"
          data-testid="product-description"
        >
          {product.description}
        </Text>
      )}

      {galleryUrl && (
        <a
          href={galleryUrl}
          className="text-sm text-stone-700 underline underline-offset-4 hover:text-stone-900"
        >
          View on ItsMillerTime
        </a>
      )}
    </div>
  )
}

export default ProductInfo
