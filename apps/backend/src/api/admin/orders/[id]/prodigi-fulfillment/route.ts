import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
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
    prodigi_fulfillment: prodigiFulfillment
      ? {
          fulfillment_id: prodigiFulfillment.id,
          prodigi_order_id: prodigiFulfillment.metadata.prodigi_order_id,
          prodigi_stage: prodigiFulfillment.metadata.prodigi_stage ?? null,
          shipped_at: prodigiFulfillment.shipped_at,
          delivered_at: prodigiFulfillment.delivered_at,
        }
      : null,
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
