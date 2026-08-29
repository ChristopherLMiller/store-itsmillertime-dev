import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { shopFactList } from "@lib/util/listing"
import { productGalleryUrl } from "@lib/util/site"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
  printProduct?: boolean
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

const ProductInfo = ({ product, printProduct }: ProductInfoProps) => {
  const crumbs = categoryCrumbs(product)
  const galleryUrl = productGalleryUrl(product)
  const facts = printProduct ? [] : shopFactList(product)

  return (
    <div id="product-info" className="flex flex-col gap-4">
      {crumbs.length > 0 ? (
        <div className="text-sm text-ink-muted flex flex-wrap gap-x-2">
          {crumbs.map((crumb, index) => (
            <span key={crumb.handle} className="flex gap-x-2">
              {index > 0 && <span className="text-ink-muted">/</span>}
              <LocalizedClientLink
                href={`/categories/${crumb.handle}`}
                className="hover:text-bronze"
              >
                {crumb.name}
              </LocalizedClientLink>
            </span>
          ))}
        </div>
      ) : product.collection ? (
        <LocalizedClientLink
          href={`/collections/${product.collection.handle}`}
          className="text-sm text-ink-muted hover:text-bronze"
        >
          {product.collection.title}
        </LocalizedClientLink>
      ) : null}
      <Heading
        level="h1"
        className="font-display text-3xl small:text-4xl font-medium leading-snug tracking-tight text-ink"
        data-testid="product-title"
      >
        {product.title}
      </Heading>

      {product.subtitle && (
        <Text className="text-base text-ink-muted">{product.subtitle}</Text>
      )}

      {product.description && (
        <Text
          className="text-base-regular text-ink-soft whitespace-pre-line"
          data-testid="product-description"
        >
          {product.description}
        </Text>
      )}

      {facts.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-y border-bronze/20 py-4">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-xs text-ink-muted">{fact.label}</dt>
              <dd className="mt-1 text-sm text-ink">{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {galleryUrl && (
        <a
          href={galleryUrl}
          className="text-sm text-bronze underline underline-offset-4 hover:text-bronze-deep"
        >
          View on ItsMillerTime
        </a>
      )}
    </div>
  )
}

export default ProductInfo
