import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { linkStatusFromMetadata } from "../../../lib/account-link/payload-client"
import { unlinkAccounts } from "../../../lib/account-link/workflow"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }

  const customers = req.scope.resolve(Modules.CUSTOMER)
  const customer = await customers.retrieveCustomer(customerId)

  res.json({
    account_link: linkStatusFromMetadata(
      (customer.metadata || {}) as Record<string, unknown>
    ),
  })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }

  const result = await unlinkAccounts(req.scope, { customerId })
  res.json(result)
}
