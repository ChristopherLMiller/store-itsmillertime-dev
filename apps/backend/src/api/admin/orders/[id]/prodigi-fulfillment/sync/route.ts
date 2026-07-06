import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  buildProdigiFulfillmentView,
  resolveProdigiDisplayStatus,
} from "../../../../../../utils/prodigi-fulfillment-status"
import { syncProdigiOrderWorkflow } from "../../../../../../workflows/sync-prodigi-order"

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await syncProdigiOrderWorkflow(req.scope).run({
    input: { order_id: id },
  })

  const { data } = await query.graph({
    entity: "order",
    fields: [
      "fulfillments.id",
      "fulfillments.canceled_at",
      "fulfillments.metadata",
      "fulfillments.shipped_at",
      "fulfillments.delivered_at",
    ],
    filters: { id },
  })

  const order = data[0] as Record<string, any> | undefined
  const prodigiFulfillment = (order?.fulfillments ?? []).find(
    (f: any) => f && !f.canceled_at && f.metadata?.prodigi_order_id
  )

  const view = prodigiFulfillment
    ? buildProdigiFulfillmentView(prodigiFulfillment)
    : null

  return res.json({
    synced: true,
    stage: result.status.stage,
    shipping_status: result.status.shipping_status,
    display_status:
      view?.display_status ??
      resolveProdigiDisplayStatus({
        prodigi_stage: result.status.stage,
        prodigi_shipping_status: result.status.shipping_status,
        prodigi_shipments: result.status.shipments,
        shipped_at: null,
        delivered_at: null,
      }),
    prodigi_fulfillment: view,
  })
}
