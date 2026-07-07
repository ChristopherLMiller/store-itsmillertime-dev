import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { prepareShipmentNotificationStep } from "./steps/prepare-shipment-notification"
import { sendNotificationStep } from "./steps/send-notification"

export type SendShipmentNotificationInput = {
  fulfillment_id: string
}

export const sendShipmentNotificationWorkflow = createWorkflow(
  "send-shipment-notification",
  (input: SendShipmentNotificationInput) => {
    const context = prepareShipmentNotificationStep(input)

    const notificationPayload = transform({ context }, ({ context }) => [
      {
        to: context.email as string,
        channel: "email",
        template: "order-shipped",
        data: {
          subject: context.subject,
          order_display_id: context.order_display_id,
          customer_name: context.customer_name,
          order_url: context.order_url,
          tracking: context.tracking,
          store_name: context.store_name,
          items: context.items,
          shipping_method_name: context.shipping_method_name,
          shipping_address_summary: context.shipping_address_summary,
          currency_code: context.currency_code,
          order_total: context.order_total,
        },
      },
    ])

    const notification = when(context, (data) => !!data.email).then(() => {
      return sendNotificationStep(notificationPayload)
    })

    return new WorkflowResponse({ notification })
  }
)
