import {
  buildProdigiFulfillmentView,
  parseProdigiShipmentsFromMetadata,
  prodigiReportsShipped,
  type ProdigiShipmentSnapshot,
} from "./prodigi-fulfillment-status"

export type TrackingLine = {
  carrier_name?: string | null
  tracking_number?: string | null
  tracking_url?: string | null
}

export type ShipmentNotificationContext = {
  email: string | null
  order_display_id: number | null
  subject: string
  customer_name: string | null
  order_url: string | null
  tracking: TrackingLine[]
  store_name: string
}

export function buildTrackingLines(
  fulfillment: Record<string, any>
): TrackingLine[] {
  const fromLabels = (fulfillment.labels ?? [])
    .map((label: Record<string, unknown>) => ({
      tracking_number:
        typeof label.tracking_number === "string"
          ? label.tracking_number
          : null,
      tracking_url:
        typeof label.tracking_url === "string" ? label.tracking_url : null,
    }))
    .filter((line) => line.tracking_number || line.tracking_url)

  if (fromLabels.length) {
    return fromLabels
  }

  const prodigiShipments = parseProdigiShipmentsFromMetadata(
    fulfillment.metadata as Record<string, unknown> | null | undefined
  )

  return prodigiShipments
    .filter(
      (shipment: ProdigiShipmentSnapshot) =>
        shipment.tracking_number || shipment.tracking_url
    )
    .map((shipment) => ({
      carrier_name: shipment.carrier_name,
      tracking_number: shipment.tracking_number,
      tracking_url: shipment.tracking_url,
    }))
}

export function buildOrderUrl(order: Record<string, any>): string | null {
  const storefrontUrl = process.env.STOREFRONT_URL?.replace(/\/$/, "")
  if (!storefrontUrl) {
    return null
  }

  const countryCode =
    order.shipping_address?.country_code?.toLowerCase?.() ?? "us"

  return `${storefrontUrl}/${countryCode}/account/orders/details/${order.id}`
}

export function fulfillmentHasTracking(
  fulfillment: Record<string, unknown>
): boolean {
  const labels = fulfillment.labels
  if (Array.isArray(labels)) {
    const labelTracking = labels.some(
      (label) =>
        label &&
        typeof label === "object" &&
        ((label as Record<string, unknown>).tracking_number ||
          (label as Record<string, unknown>).tracking_url)
    )

    if (labelTracking) {
      return true
    }
  }

  const metadata =
    fulfillment.metadata && typeof fulfillment.metadata === "object"
      ? (fulfillment.metadata as Record<string, unknown>)
      : null

  return parseProdigiShipmentsFromMetadata(metadata).some(
    (shipment) => shipment.tracking_number || shipment.tracking_url
  )
}

export function canResendTrackingEmail(
  order: Record<string, unknown> | undefined,
  fulfillment: Record<string, unknown> | undefined
): boolean {
  if (
    !order?.email ||
    typeof order.email !== "string" ||
    !fulfillment ||
    typeof fulfillment !== "object"
  ) {
    return false
  }

  const view = buildProdigiFulfillmentView({
    id: String(fulfillment.id ?? ""),
    metadata:
      fulfillment.metadata && typeof fulfillment.metadata === "object"
        ? (fulfillment.metadata as Record<string, unknown>)
        : null,
    shipped_at:
      typeof fulfillment.shipped_at === "string"
        ? fulfillment.shipped_at
        : null,
    delivered_at:
      typeof fulfillment.delivered_at === "string"
        ? fulfillment.delivered_at
        : null,
  })

  return (
    !!fulfillment.shipped_at ||
    view.display_status === "Shipped" ||
    view.display_status === "Delivered" ||
    prodigiReportsShipped({
      stage: view.prodigi_stage ?? "",
      shipping_status: view.prodigi_shipping_status,
      shipments: view.prodigi_shipments,
    }) ||
    fulfillmentHasTracking(fulfillment)
  )
}
