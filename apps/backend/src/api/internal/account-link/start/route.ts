import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { assertInternalSecret } from "../../../../lib/account-link/otp"
import { startPayloadToShopChallenge } from "../../../../lib/account-link/workflow"

type StartBody = {
  payload_user_id?: string
  payload_email?: string
  shop_email?: string
  roles?: string[]
  authentik_sub?: string | null
}

/**
 * Called by CMS when a logged-in itsMillerTime user starts linking a shop account.
 * Protected by ACCOUNT_LINK_SHARED_SECRET (not customer JWT).
 */
export async function POST(req: MedusaRequest<StartBody>, res: MedusaResponse) {
  assertInternalSecret(req.headers["x-account-link-secret"])

  const body = (req.body || {}) as StartBody
  if (!body.payload_user_id || !body.payload_email || !body.shop_email) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "payload_user_id, payload_email, and shop_email are required"
    )
  }

  const result = await startPayloadToShopChallenge(req.scope, {
    payloadUserId: body.payload_user_id,
    payloadEmail: body.payload_email,
    shopEmail: body.shop_email,
    roles: body.roles,
    authentikSub: body.authentik_sub,
  })

  res.status(201).json(result)
}
