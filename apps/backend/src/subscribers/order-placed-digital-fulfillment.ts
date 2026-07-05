import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { fulfillDigitalOrderWorkflow } from "../workflows/fulfill-digital-order"

type OrderPlacedEvent = {
  id: string
}

export default async function orderPlacedDigitalFulfillmentHandler({
  event: { data },
  container,
}: SubscriberArgs<OrderPlacedEvent>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const { result } = await fulfillDigitalOrderWorkflow(container).run({
      input: { order_id: data.id },
    })

    if (result.plan) {
      logger.info(
        `Digital fulfillment processed for order ${data.id} (${result.plan.line_items.length} line item(s))`
      )
    }
  } catch (error) {
    logger.error(
      `Digital fulfillment failed for order ${data.id}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
