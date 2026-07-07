import {
  buildProdigiFulfillmentView,
  parseProdigiShipmentsFromMetadata,
  prodigiReportsShipped,
  type ProdigiShipmentSnapshot,
} from "./prodigi-fulfillment-status"
import { buildStorefrontOrderUrl } from "./notification-urls"

export type TrackingLine = {
  carrier_name?: string | null
  tracking_number?: string | null
  tracking_url?: string | null
}

export type ShipmentItemLine = {
  title: string
  variant_title?: string | null
  thumbnail?: string | null
  quantity: number
}

export type ShipmentNotificationContext = {
  email: string | null
  order_display_id: number | null
  subject: string
  customer_name: string | null
  order_url: string | null
  tracking: TrackingLine[]
  store_name: string
  items: ShipmentItemLine[]
  shipping_method_name: string | null
  shipping_address_summary: string | null
  currency_code: string
  order_total: number | string | null
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
  return buildStorefrontOrderUrl(order)
}

export function buildShipmentItems(
  fulfillment: Record<string, any>,
  orderItems: Record<string, any>[] | undefined
): ShipmentItemLine[] {
  const shippedLineItemIds = new Set(
    (fulfillment.items ?? [])
      .map((item: Record<string, unknown>) => item?.line_item_id)
      .filter((id): id is string => typeof id === "string")
  )

  const relevantItems =
    shippedLineItemIds.size > 0
      ? (orderItems ?? []).filter((item) => shippedLineItemIds.has(item.id))
      : (orderItems ?? [])

  return relevantItems.map((item) => ({
    title: item.product_title || item.title || "Item",
    variant_title: item.variant_title ?? null,
    thumbnail: item.thumbnail ?? null,
    quantity: Number(item.quantity) || 1,
  }))
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
