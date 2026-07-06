import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  buildTrackingLines,
  buildOrderUrl,
  type ShipmentNotificationContext,
} from "../../utils/shipment-notification"

type PrepareShipmentNotificationInput = {
  fulfillment_id: string
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
        "order.id",
        "order.display_id",
        "order.email",
        "order.customer.first_name",
        "order.shipping_address.first_name",
        "order.shipping_address.country_code",
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
    }

    return new StepResponse(context)
  }
)
