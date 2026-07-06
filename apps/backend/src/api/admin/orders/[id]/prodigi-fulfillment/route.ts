import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { buildProdigiFulfillmentView } from "../../../../../utils/prodigi-fulfillment-status"
import { isResendConfigured } from "../../../../../utils/email"
import { canResendTrackingEmail } from "../../../../../utils/shipment-notification"
import { submitOrderToProdigiWorkflow } from "../../../../../workflows/submit-order-to-prodigi"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "payment_collections.status",
      "fulfillments.id",
      "fulfillments.canceled_at",
      "fulfillments.metadata",
      "fulfillments.shipped_at",
      "fulfillments.delivered_at",
      "fulfillments.labels.tracking_number",
      "fulfillments.labels.tracking_url",
    ],
    filters: { id },
  })

  const order = data[0] as Record<string, any> | undefined

  const paymentCaptured = (order?.payment_collections ?? []).some(
    (pc: { status?: string } | null) => pc?.status === "completed"
  )

  const prodigiFulfillment = (order?.fulfillments ?? []).find(
    (f: any) => f && !f.canceled_at && f.metadata?.prodigi_order_id
  )

  return res.json({
    payment_captured: paymentCaptured,
    email_configured: isResendConfigured(),
    prodigi_fulfillment: prodigiFulfillment
      ? buildProdigiFulfillmentView(prodigiFulfillment)
      : null,
    can_resend_tracking: canResendTrackingEmail(order, prodigiFulfillment),
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params

  const { result } = await submitOrderToProdigiWorkflow(req.scope).run({
    input: { order_id: id },
  })

  return res.json({
    prodigi_order_id: result.prodigi_order.prodigi_order_id,
    stage: result.prodigi_order.stage,
  })
}
