import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { invalidateStorefrontCache } from "../utils/invalidate-storefront-cache"

export default async function storefrontCacheRevalidateHandler({
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  await invalidateStorefrontCache(logger, [
    "products",
    "collections",
    "categories",
  ])
}

export const config: SubscriberConfig = {
  event: [
    "product.created",
    "product.updated",
    "product.deleted",
    "product-variant.created",
    "product-variant.updated",
    "product-variant.deleted",
    "product-option.created",
    "product-option.updated",
    "product-option.deleted",
  ],
}
