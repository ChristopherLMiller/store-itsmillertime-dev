import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { startShopToPayloadChallenge } from "../../../../lib/account-link/workflow"

type StartBody = {
  email?: string
}

export async function POST(
  req: AuthenticatedMedusaRequest<StartBody>,
  res: MedusaResponse
) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }

  const email = req.validatedBody?.email ?? req.body?.email
  if (!email || typeof email !== "string") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "itsMillerTime account email is required"
    )
  }

  const result = await startShopToPayloadChallenge(req.scope, {
    customerId,
    payloadEmail: email,
  })

  res.status(201).json(result)
}
