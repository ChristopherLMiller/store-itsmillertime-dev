import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getEcommerceEnvironmentStatus } from "../../../utils/ecommerce-environment-status"

/**
 * Public sandbox/live flags for Stripe and Prodigi. Does not expose keys.
 * Stripe uses one API host; test vs live is the secret-key prefix.
 * Prodigi uses separate hosts (api.sandbox.prodigi.com vs api.prodigi.com).
 */
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  return res.json(getEcommerceEnvironmentStatus())
}
