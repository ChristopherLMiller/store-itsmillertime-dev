import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { processProdigiCallbackWorkflow } from "../../../../workflows/process-prodigi-callback"

/**
 * Prodigi callback endpoint (CloudEvents). Prodigi does not sign callbacks, so
 * authenticity relies on:
 * 1. The unguessable secret path segment (PRODIGI_WEBHOOK_SECRET)
 * 2. CloudEvent shape validation
 * 3. Lookup by our own stored Prodigi order id - unknown orders are ignored
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const { secret } = req.params

  const expected = process.env.PRODIGI_WEBHOOK_SECRET
  if (!expected || secret !== expected) {
    return res.status(404).json({ message: "Not found" })
  }

  const event = req.body as {
    specversion?: string
    type?: string
    data?: {
      order?: {
        id?: string
        merchantReference?: string
        status?: { stage?: string }
        shipments?: {
          carrier?: { name?: string }
          tracking?: { number?: string; url?: string }
        }[]
      }
    }
  }

  const order = event?.data?.order
  if (
    !event?.specversion ||
    !event?.type?.startsWith("com.prodigi") ||
    !order?.id
  ) {
    logger.warn("Prodigi callback: invalid CloudEvent payload - ignoring")
    return res.status(400).json({ message: "Invalid payload" })
  }

  await processProdigiCallbackWorkflow(req.scope).run({
    input: {
      prodigi_order_id: order.id,
      medusa_order_id: order.merchantReference ?? null,
      stage: order.status?.stage ?? "Unknown",
      shipments: (order.shipments ?? []).map((s) => ({
        carrier_name: s.carrier?.name ?? null,
        tracking_number: s.tracking?.number ?? null,
        tracking_url: s.tracking?.url ?? null,
      })),
    },
  })

  return res.status(200).json({ received: true })
}
