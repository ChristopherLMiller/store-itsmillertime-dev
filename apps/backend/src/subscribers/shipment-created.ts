import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { isResendConfigured } from "../utils/email"
import { sendShipmentNotificationWorkflow } from "../workflows/send-shipment-notification"

type ShipmentCreatedEvent = {
  id: string
  no_notification?: boolean
}

export default async function shipmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<ShipmentCreatedEvent>) {
  if (data.no_notification) {
    return
  }

  if (!isResendConfigured()) {
    return
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    await sendShipmentNotificationWorkflow(container).run({
      input: { fulfillment_id: data.id },
    })

    logger.info(
      `Shipment notification queued for fulfillment ${data.id}`
    )
  } catch (error) {
    logger.error(
      `Failed to send shipment notification for fulfillment ${data.id}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    )
  }
}

export const config: SubscriberConfig = {
  event: "shipment.created",
}
