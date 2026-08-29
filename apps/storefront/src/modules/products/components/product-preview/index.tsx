import { Text } from "@modules/common/components/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import {
  getShopFacts,
  listingKindForProduct,
} from "@lib/util/listing"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

export default async function ProductPreview({
  product,
  isFeatured,
  region: _region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const listing = listingKindForProduct(product)
  const { cheapestPrice } = getProductPrice({
    product,
  })
  const facts = listing === "shop" ? getShopFacts(product) : null
  const metaBits = [facts?.condition, facts?.players, facts?.year].filter(
    Boolean
  )

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group"
      aria-label={product.title ?? undefined}
    >
      <div data-testid="product-wrapper">
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="full"
          listing={listing}
          isFeatured={isFeatured}
          alt={product.title ?? ""}
        />
        {listing === "print" ? (
          <span className="sr-only" data-testid="product-title">
            {product.title}
          </span>
        ) : (
          <div className="flex flex-col gap-1 mt-3">
            <Text
              className="text-base text-ink leading-snug line-clamp-2 group-hover:text-bronze-deep"
              data-testid="product-title"
            >
              {product.title}
            </Text>
            {metaBits.length > 0 && (
              <Text className="text-xs text-ink-muted">
                {metaBits.join(" · ")}
              </Text>
            )}
            {product.subtitle && (
              <Text className="text-sm text-ink-muted line-clamp-2">
                {product.subtitle}
              </Text>
            )}
            {!product.subtitle && product.description && (
              <Text className="text-sm text-ink-muted line-clamp-2">
                {product.description}
              </Text>
            )}
            {cheapestPrice && (
              <div className="mt-1 text-sm text-ink">
                <PreviewPrice price={cheapestPrice} />
              </div>
            )}
          </div>
        )}
      </div>
    </LocalizedClientLink>
  )
}
