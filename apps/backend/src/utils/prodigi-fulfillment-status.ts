export type ProdigiShipmentSnapshot = {
  status: string | null
  carrier_name: string | null
  tracking_number: string | null
  tracking_url: string | null
}

export type ProdigiStatusUpdateInput = {
  prodigi_order_id: string
  medusa_order_id: string | null
  stage: string
  shipping_status: string | null
  shipments: ProdigiShipmentSnapshot[]
}

type ProdigiOrderLike = {
  id?: string
  merchantReference?: string | null
  status?: {
    stage?: string
    details?: {
      shipping?: string
    }
  }
  shipments?: {
    status?: string
    carrier?: { name?: string }
    tracking?: { number?: string; url?: string }
  }[]
}

export function parseProdigiOrderStatus(
  order: ProdigiOrderLike,
  medusaOrderId?: string | null
): ProdigiStatusUpdateInput {
  return {
    prodigi_order_id: order.id ?? "",
    medusa_order_id: medusaOrderId ?? order.merchantReference ?? null,
    stage: order.status?.stage ?? "Unknown",
    shipping_status: order.status?.details?.shipping ?? null,
    shipments: (order.shipments ?? []).map((shipment) => ({
      status: shipment.status ?? null,
      carrier_name: shipment.carrier?.name ?? null,
      tracking_number: shipment.tracking?.number ?? null,
      tracking_url: shipment.tracking?.url ?? null,
    })),
  }
}

export function prodigiReportsShipped(input: {
  stage: string
  shipping_status: string | null
  shipments: ProdigiShipmentSnapshot[]
}): boolean {
  return (
    input.stage === "Complete" ||
    input.shipping_status === "Complete" ||
    input.shipments.some((shipment) => shipment.status === "Shipped")
  )
}

export function resolveProdigiDisplayStatus(params: {
  prodigi_stage: string | null
  prodigi_shipping_status: string | null
  prodigi_shipments: ProdigiShipmentSnapshot[]
  shipped_at: string | null
  delivered_at: string | null
}): string {
  if (params.delivered_at) {
    return "Delivered"
  }

  if (params.shipped_at) {
    return "Shipped"
  }

  if (
    prodigiReportsShipped({
      stage: params.prodigi_stage ?? "",
      shipping_status: params.prodigi_shipping_status,
      shipments: params.prodigi_shipments,
    })
  ) {
    return "Shipped"
  }

  if (params.prodigi_stage === "Cancelled") {
    return "Cancelled"
  }

  return params.prodigi_stage ?? "Submitted"
}

export function parseProdigiShipmentsFromMetadata(
  metadata: Record<string, unknown> | null | undefined
): ProdigiShipmentSnapshot[] {
  const raw = metadata?.prodigi_shipments
  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null
      }

      const shipment = entry as Record<string, unknown>
      return {
        status: typeof shipment.status === "string" ? shipment.status : null,
        carrier_name:
          typeof shipment.carrier_name === "string"
            ? shipment.carrier_name
            : null,
        tracking_number:
          typeof shipment.tracking_number === "string"
            ? shipment.tracking_number
            : null,
        tracking_url:
          typeof shipment.tracking_url === "string"
            ? shipment.tracking_url
            : null,
      }
    })
    .filter((entry): entry is ProdigiShipmentSnapshot => entry != null)
}

export function buildProdigiFulfillmentView(fulfillment: {
  id: string
  metadata?: Record<string, unknown> | null
  shipped_at?: string | null
  delivered_at?: string | null
}) {
  const metadata = fulfillment.metadata ?? {}
  const prodigi_shipments = parseProdigiShipmentsFromMetadata(metadata)
  const prodigi_stage =
    typeof metadata.prodigi_stage === "string" ? metadata.prodigi_stage : null
  const prodigi_shipping_status =
    typeof metadata.prodigi_shipping_status === "string"
      ? metadata.prodigi_shipping_status
      : null

  return {
    fulfillment_id: fulfillment.id,
    prodigi_order_id: String(metadata.prodigi_order_id ?? ""),
    prodigi_stage,
    prodigi_shipping_status,
    prodigi_shipments,
    display_status: resolveProdigiDisplayStatus({
      prodigi_stage,
      prodigi_shipping_status,
      prodigi_shipments,
      shipped_at: fulfillment.shipped_at ?? null,
      delivered_at: fulfillment.delivered_at ?? null,
    }),
    shipped_at: fulfillment.shipped_at ?? null,
    delivered_at: fulfillment.delivered_at ?? null,
  }
}
