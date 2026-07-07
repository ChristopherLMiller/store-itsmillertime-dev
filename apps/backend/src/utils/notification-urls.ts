export function buildStorefrontOrderUrl(order: Record<string, any>): string | null {
  const storefrontUrl = process.env.STOREFRONT_URL?.replace(/\/$/, "")
  if (!storefrontUrl) {
    return null
  }

  const countryCode =
    order.shipping_address?.country_code?.toLowerCase?.() ?? "us"

  return `${storefrontUrl}/${countryCode}/account/orders/details/${order.id}`
}

export function buildAdminOrderUrl(orderId: string): string | null {
  const backendUrl = process.env.MEDUSA_BACKEND_URL?.replace(/\/$/, "")
  if (!backendUrl) {
    return null
  }

  return `${backendUrl}/app/orders/${orderId}`
}
