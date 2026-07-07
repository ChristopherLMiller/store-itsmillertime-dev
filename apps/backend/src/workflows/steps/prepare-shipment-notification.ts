import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  buildOrderUrl,
  buildShipmentItems,
  buildTrackingLines,
  type ShipmentNotificationContext,
} from "../../utils/shipment-notification"

type PrepareShipmentNotificationInput = {
  fulfillment_id: string
}

function formatAddressSummary(address: Record<string, any> | null | undefined) {
  if (!address) {
    return null
  }

  const name = [address.first_name, address.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()
  const cityLine = [address.city, address.province, address.postal_code]
    .filter(Boolean)
    .join(", ")
  const country = address.country_code?.toUpperCase?.()

  return [name, address.address_1, address.address_2, cityLine, country]
    .filter(Boolean)
    .join("\n")
}

export const prepareShipmentNotificationStep = createStep(
  "prepare-shipment-notification",
  async (input: PrepareShipmentNotificationInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data } = await query.graph({
      entity: "fulfillment",
      fields: [
        "id",
        "labels.tracking_number",
        "labels.tracking_url",
        "metadata",
        "items.line_item_id",
        "items.quantity",
        "order.id",
        "order.display_id",
        "order.email",
        "order.currency_code",
        "order.total",
        "order.customer.first_name",
        "order.customer.last_name",
        "order.shipping_address.first_name",
        "order.shipping_address.last_name",
        "order.shipping_address.address_1",
        "order.shipping_address.address_2",
        "order.shipping_address.city",
        "order.shipping_address.province",
        "order.shipping_address.postal_code",
        "order.shipping_address.country_code",
        "order.shipping_methods.name",
        "order.items.id",
        "order.items.title",
        "order.items.product_title",
        "order.items.variant_title",
        "order.items.thumbnail",
        "order.items.quantity",
      ],
      filters: {
        id: input.fulfillment_id,
      },
    })

    const fulfillment = data[0] as Record<string, any> | undefined
    const order = fulfillment?.order as Record<string, any> | undefined
    const orderDisplayId = order?.display_id ?? null
    const storeName = process.env.STORE_NAME || "Store"

    const context: ShipmentNotificationContext = {
      email: order?.email ?? null,
      order_display_id: orderDisplayId,
      subject: orderDisplayId
        ? `Your order #${orderDisplayId} has shipped`
        : "Your order has shipped",
      customer_name:
        order?.customer?.first_name ??
        order?.shipping_address?.first_name ??
        null,
      order_url: order ? buildOrderUrl(order) : null,
      tracking: fulfillment ? buildTrackingLines(fulfillment) : [],
      store_name: storeName,
      items: fulfillment
        ? buildShipmentItems(fulfillment, order?.items)
        : [],
      shipping_method_name: order?.shipping_methods?.[0]?.name ?? null,
      shipping_address_summary: formatAddressSummary(order?.shipping_address),
      currency_code: order?.currency_code ?? "USD",
      order_total: order?.total ?? null,
    }

    return new StepResponse(context)
  }
)
