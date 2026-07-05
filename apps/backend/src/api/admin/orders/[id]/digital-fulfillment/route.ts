import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { fulfillDigitalOrderWorkflow } from "../../../../../workflows/fulfill-digital-order"
import { DIGITAL_DELIVERY_MODULE } from "../../../../../modules/digital-delivery"
import type DigitalDeliveryModuleService from "../../../../../modules/digital-delivery/service"
import { buildDigitalDownloadUrl } from "../../../../../utils/digital-delivery"
import { isResendConfigured } from "../../../../../utils/email"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const digitalDelivery = req.scope.resolve(
    DIGITAL_DELIVERY_MODULE
  ) as DigitalDeliveryModuleService
  const { id } = req.params

  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "payment_collections.status",
      "items.variant.metadata",
    ],
    filters: { id },
  })

  const order = data[0] as Record<string, any> | undefined
  if (!order) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Order ${id} not found`)
  }

  const paymentCaptured = (order.payment_collections ?? []).some(
    (pc: { status?: string } | null) => pc?.status === "completed"
  )

  const hasDigitalItems = (order.items ?? []).some(
    (item: { variant?: { metadata?: Record<string, unknown> | null } } | null) =>
      item?.variant?.metadata?.fulfillment_type === "digital"
  )

  const deliveries = await digitalDelivery.listDigitalDeliveries(
    { order_id: id },
    { take: 1, order: { created_at: "DESC" } }
  )

  const delivery = deliveries[0] ?? null

  return res.json({
    payment_captured: paymentCaptured,
    has_digital_items: hasDigitalItems,
    email_configured: isResendConfigured(),
    digital_delivery: delivery
      ? {
          delivery_id: delivery.id,
          fulfillment_id: delivery.fulfillment_id,
          email_sent_at: delivery.email_sent_at,
          expires_at: delivery.expires_at,
          download_url: buildDigitalDownloadUrl(delivery.token),
        }
      : null,
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params

  const { result } = await fulfillDigitalOrderWorkflow(req.scope).run({
    input: { order_id: id, force: true },
  })

  if (!result.plan) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Order has no digital items to fulfill, payment is not captured, or digital delivery already exists"
    )
  }

  return res.json({
    order_id: id,
    line_items: result.plan.line_items.length,
  })
}
