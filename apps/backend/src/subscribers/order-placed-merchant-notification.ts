import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { isResendConfigured } from "../utils/email"
import { isStoreNotificationConfigured } from "../utils/store-notification"
import { sendMerchantOrderNotificationWorkflow } from "../workflows/send-merchant-order-notification"

export default async function orderPlacedMerchantNotificationHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  if (!isResendConfigured() || !isStoreNotificationConfigured()) {
    return
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    await sendMerchantOrderNotificationWorkflow(container).run({
      input: { id: data.id },
    })

    logger.info(`Merchant order notification queued for order ${data.id}`)
  } catch (error) {
    logger.error(
      `Failed to send merchant order notification for order ${data.id}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
