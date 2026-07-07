import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { parseProdigiCallbackFromRequest } from "../../../../utils/parse-prodigi-callback-event"
import { parseProdigiOrderStatus } from "../../../../utils/prodigi-fulfillment-status"
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

  const parsed = parseProdigiCallbackFromRequest(req)
  if (!parsed.ok) {
    logger.warn(`Prodigi callback: ${parsed.reason}`)
    return res.status(400).json({ message: "Invalid payload" })
  }

  const statusUpdate = parseProdigiOrderStatus(parsed.parsed.order)

  logger.info(
    `Prodigi callback ${parsed.parsed.eventType} for order ${statusUpdate.prodigi_order_id} (stage=${statusUpdate.stage})`
  )

  await processProdigiCallbackWorkflow(req.scope).run({
    input: statusUpdate,
  })

  return res.status(200).json({ received: true })
}
