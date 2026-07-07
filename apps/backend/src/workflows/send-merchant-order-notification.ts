import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { buildAdminOrderUrl } from "../utils/notification-urls"
import { getStoreNotificationEmails } from "../utils/store-notification"
import { sendNotificationStep } from "./steps/send-notification"

type WorkflowInput = {
  id: string
}

export const sendMerchantOrderNotificationWorkflow = createWorkflow(
  "send-merchant-order-notification",
  ({ id }: WorkflowInput) => {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "currency_code",
        "total",
        "items.*",
        "shipping_address.*",
        "shipping_methods.*",
        "customer.*",
      ],
      filters: {
        id,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    })

    const recipients = transform({}, () => getStoreNotificationEmails())

    const notification = when(
      { orders, recipients },
      (data) => data.recipients.length > 0
    ).then(() => {
      return sendNotificationStep(
        transform({ orders, recipients }, ({ orders, recipients }) => {
          const order = orders[0]
          const adminOrderUrl = buildAdminOrderUrl(order.id)
          const storeName = process.env.STORE_NAME || "Store"

          return recipients.map((to) => ({
            to,
            channel: "email" as const,
            template: "merchant-new-order",
            data: {
              subject: `New order #${order.display_id} at ${storeName}`,
              order,
              admin_order_url: adminOrderUrl,
              store_name: storeName,
            },
          }))
        })
      )
    })

    return new WorkflowResponse({
      notification,
    })
  }
)
