import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { isResendConfigured } from "../../../../../../utils/email"
import { canResendTrackingEmail } from "../../../../../../utils/shipment-notification"
import { sendShipmentNotificationWorkflow } from "../../../../../../workflows/send-shipment-notification"

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  if (!isResendConfigured()) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Resend is not configured — set RESEND_API_KEY and RESEND_FROM_EMAIL"
    )
  }

  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "email",
      "fulfillments.id",
      "fulfillments.canceled_at",
      "fulfillments.shipped_at",
      "fulfillments.delivered_at",
      "fulfillments.metadata",
      "fulfillments.labels.tracking_number",
      "fulfillments.labels.tracking_url",
    ],
    filters: { id },
  })

  const order = data[0] as Record<string, any> | undefined
  if (!order) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order ${id} not found`
    )
  }

  if (!order.email) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Order has no customer email address"
    )
  }

  const prodigiFulfillment = (order.fulfillments ?? []).find(
    (entry: any) => entry && !entry.canceled_at && entry.metadata?.prodigi_order_id
  )

  if (!prodigiFulfillment) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Order has not been submitted to Prodigi yet"
    )
  }

  if (!canResendTrackingEmail(order, prodigiFulfillment)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Order is not shipped yet — sync from Prodigi first"
    )
  }

  await sendShipmentNotificationWorkflow(req.scope).run({
    input: { fulfillment_id: prodigiFulfillment.id },
  })

  return res.json({
    sent: true,
    to: order.email,
  })
}
