import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { confirmShopToPayloadChallenge } from "../../../../lib/account-link/workflow"

type ConfirmBody = {
  challenge_id?: string
  code?: string
}

export async function POST(
  req: AuthenticatedMedusaRequest<ConfirmBody>,
  res: MedusaResponse
) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }

  const body = req.validatedBody ?? req.body
  const challengeId = body?.challenge_id
  const code = body?.code

  if (!challengeId || typeof challengeId !== "string") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "challenge_id is required"
    )
  }
  if (!code || typeof code !== "string") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "code is required")
  }

  const result = await confirmShopToPayloadChallenge(req.scope, {
    customerId,
    challengeId,
    code,
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
