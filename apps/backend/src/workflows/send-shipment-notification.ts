import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import {
  parseProdigiShipmentsFromMetadata,
  type ProdigiShipmentSnapshot,
} from "../utils/prodigi-fulfillment-status"
import { sendNotificationStep } from "./steps/send-notification"

export type SendShipmentNotificationInput = {
  fulfillment_id: string
}

type TrackingLine = {
  carrier_name?: string | null
  tracking_number?: string | null
  tracking_url?: string | null
}

function buildTrackingLines(
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

function buildOrderUrl(order: Record<string, any>): string | null {
  const storefrontUrl = process.env.STOREFRONT_URL?.replace(/\/$/, "")
  if (!storefrontUrl) {
    return null
  }

  const countryCode =
    order.shipping_address?.country_code?.toLowerCase?.() ?? "us"

  return `${storefrontUrl}/${countryCode}/account/orders/details/${order.id}`
}

export const sendShipmentNotificationWorkflow = createWorkflow(
  "send-shipment-notification",
  (input: SendShipmentNotificationInput) => {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "customer.first_name",
        "shipping_address.first_name",
        "shipping_address.country_code",
        "fulfillments.id",
        "fulfillments.labels.tracking_number",
        "fulfillments.labels.tracking_url",
        "fulfillments.metadata",
      ],
      filters: {
        fulfillments: {
          id: input.fulfillment_id,
        },
      },
    }).config({ name: "get-order-for-shipment-notification" })

    const context = transform({ orders, input }, ({ orders, input }) => {
      const order = orders[0] as Record<string, any> | undefined
      const fulfillment = (order?.fulfillments ?? []).find(
        (entry: Record<string, any>) => entry?.id === input.fulfillment_id
      )

      return {
        email: order?.email ?? null,
        order_display_id: order?.display_id ?? null,
        customer_name:
          order?.customer?.first_name ??
          order?.shipping_address?.first_name ??
          null,
        order_url: order ? buildOrderUrl(order) : null,
        tracking: fulfillment ? buildTrackingLines(fulfillment) : [],
      }
    })

    const notification = when(context, (data) => !!data.email).then(() => {
      return sendNotificationStep([
        {
          to: context.email as string,
          channel: "email",
          template: "order-shipped",
          data: {
            subject: `Your order #${context.order_display_id} has shipped`,
            order_display_id: context.order_display_id,
            customer_name: context.customer_name,
            order_url: context.order_url,
            tracking: context.tracking,
            store_name: process.env.STORE_NAME || "Store",
          },
        },
      ])
    })

    return new WorkflowResponse({ notification })
  }
)
