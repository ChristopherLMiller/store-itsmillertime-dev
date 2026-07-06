import { HttpTypes } from "@medusajs/types"

function variantMetadata(
  item: HttpTypes.StoreCartLineItem
): Record<string, unknown> | null {
  const metadata = item.variant?.metadata
  return metadata && typeof metadata === "object"
    ? (metadata as Record<string, unknown>)
    : null
}

export function isExplicitlyDigitalLineItem(
  item: HttpTypes.StoreCartLineItem
): boolean {
  if (variantMetadata(item)?.fulfillment_type === "digital") {
    return true
  }

  const labels = [item.title, item.variant?.title, item.product_title]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase())

  return labels.some(
    (label) =>
      label.includes("digital download") || label.trim() === "digital download"
  )
}

export function cartRequiresPhysicalShipping(
  cart: HttpTypes.StoreCart
): boolean {
  return (cart.items ?? []).some((item) => !isExplicitlyDigitalLineItem(item))
}

export function cartIsDigitalOnly(cart: HttpTypes.StoreCart): boolean {
  const items = cart.items ?? []
  return items.length > 0 && items.every(isExplicitlyDigitalLineItem)
}

function getProviderId(option: HttpTypes.StoreCartShippingOption): string {
  const extended = option as HttpTypes.StoreCartShippingOption & {
    provider_id?: string
    provider?: { id?: string | null }
  }

  return (extended.provider_id ?? extended.provider?.id ?? "").toLowerCase()
}

function isManualOrDigitalShippingOption(
  option: HttpTypes.StoreCartShippingOption
): boolean {
  const providerId = getProviderId(option)
  const name = option.name?.toLowerCase() ?? ""
  const profileName = (
    option as HttpTypes.StoreCartShippingOption & {
      shipping_profile?: { name?: string | null; type?: string | null }
    }
  ).shipping_profile?.name?.toLowerCase()
  const profileType = (
    option as HttpTypes.StoreCartShippingOption & {
      shipping_profile?: { name?: string | null; type?: string | null }
    }
  ).shipping_profile?.type?.toLowerCase()

  return (
    providerId.includes("manual") ||
    name.includes("digital") ||
    profileName === "digital" ||
    profileType === "digital"
  )
}

/**
 * Medusa lists every enabled option in the service zone. Hide manual/digital
 * options when the cart includes print items, and hide Prodigi when digital-only.
 */
export function filterShippingMethodsForCart(
  methods: HttpTypes.StoreCartShippingOption[] | null,
  cart: HttpTypes.StoreCart
): HttpTypes.StoreCartShippingOption[] | null {
  if (!methods?.length) {
    return methods
  }

  const requiresPhysical = cartRequiresPhysicalShipping(cart)
  const digitalOnly = cartIsDigitalOnly(cart)

  if (!requiresPhysical && !digitalOnly) {
    return methods
  }

  return methods.filter((method) => {
    const manualOrDigital = isManualOrDigitalShippingOption(method)
    const isProdigi = getProviderId(method).includes("prodigi")

    if (requiresPhysical && manualOrDigital) {
      return false
    }

    if (digitalOnly && isProdigi) {
      return false
    }

    return true
  })
}
