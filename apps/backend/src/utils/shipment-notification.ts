import {
  buildProdigiFulfillmentView,
  parseProdigiShipmentsFromMetadata,
  prodigiReportsShipped,
} from "./prodigi-fulfillment-status"

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
