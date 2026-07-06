type CartLike = {
  items?: Array<{
    title?: string | null
    product_title?: string | null
    variant?: {
      title?: string | null
      sku?: string | null
      metadata?: unknown
    } | null
  } | null> | null
}

type ShippingOptionLike = {
  name?: string | null
  provider_id?: string | null
  provider?: { id?: string | null } | null
  shipping_profile?: { name?: string | null; type?: string | null } | null
  shipping_profile_id?: string | null
}

function variantMetadata(
  item: NonNullable<NonNullable<CartLike["items"]>[number]>
): Record<string, unknown> | null {
  const metadata = item.variant?.metadata
  return metadata && typeof metadata === "object"
    ? (metadata as Record<string, unknown>)
    : null
}

export function isExplicitlyDigitalLineItem(
  item: NonNullable<NonNullable<CartLike["items"]>[number]>
): boolean {
  if (variantMetadata(item)?.fulfillment_type === "digital") {
    return true
  }

  const labels = [
    item.title,
    item.variant?.title,
    item.product_title,
  ]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase())

  return labels.some(
    (label) =>
      label.includes("digital download") || label.trim() === "digital download"
  )
}

export function cartRequiresPhysicalShipping(cart: CartLike): boolean {
  const items = (cart.items ?? []).filter(
    (item): item is NonNullable<typeof item> => !!item
  )

  return items.some((item) => !isExplicitlyDigitalLineItem(item))
}

export function cartIsDigitalOnly(cart: CartLike): boolean {
  const items = (cart.items ?? []).filter(
    (item): item is NonNullable<typeof item> => !!item
  )

  return items.length > 0 && items.every(isExplicitlyDigitalLineItem)
}

function getProviderId(option: ShippingOptionLike): string {
  return (option.provider_id ?? option.provider?.id ?? "").toLowerCase()
}

export function isManualOrDigitalShippingOption(
  option: ShippingOptionLike
): boolean {
  const providerId = getProviderId(option)
  const name = option.name?.toLowerCase() ?? ""
  const profileName = option.shipping_profile?.name?.toLowerCase()
  const profileType = option.shipping_profile?.type?.toLowerCase()

  return (
    providerId.includes("manual") ||
    name.includes("digital") ||
    profileName === "digital" ||
    profileType === "digital"
  )
}

export function isProdigiShippingOption(option: ShippingOptionLike): boolean {
  return getProviderId(option).includes("prodigi")
}

export function filterShippingOptionsForCart<T extends ShippingOptionLike>(
  options: T[] | null | undefined,
  cart: CartLike
): T[] {
  if (!options?.length) {
    return []
  }

  const requiresPhysical = cartRequiresPhysicalShipping(cart)
  const digitalOnly = cartIsDigitalOnly(cart)

  if (!requiresPhysical && !digitalOnly) {
    return options
  }

  return options.filter((option) => {
    const manualOrDigital = isManualOrDigitalShippingOption(option)
    const prodigi = isProdigiShippingOption(option)

    if (requiresPhysical && manualOrDigital) {
      return false
    }

    if (digitalOnly && prodigi) {
      return false
    }

    return true
  })
}
