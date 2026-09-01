import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { assertInternalSecret } from "../../../../lib/account-link/otp"
import { confirmPayloadToShopChallenge } from "../../../../lib/account-link/workflow"

type ConfirmBody = {
  payload_user_id?: string
  challenge_id?: string
  code?: string
}

export async function POST(
  req: MedusaRequest<ConfirmBody>,
  res: MedusaResponse
) {
  assertInternalSecret(req.headers["x-account-link-secret"])

  const body = (req.body || {}) as ConfirmBody
  if (!body.payload_user_id || !body.challenge_id || !body.code) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "payload_user_id, challenge_id, and code are required"
    )
  }

  const result = await confirmPayloadToShopChallenge(req.scope, {
    payloadUserId: body.payload_user_id,
    challengeId: body.challenge_id,
    code: body.code,
  })

  res.json({
    linked: true,
    customer_id: result.customer_id,
    payload_user_id: result.user.id,
    payload_email: result.user.email,
    roles: result.user.roles,
    groups: result.groups,
  })
}
