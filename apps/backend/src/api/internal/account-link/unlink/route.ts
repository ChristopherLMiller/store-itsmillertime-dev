import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { META_PAYLOAD_USER_ID } from "../../../../lib/account-link/constants"
import { assertInternalSecret } from "../../../../lib/account-link/otp"
import { unlinkAccounts } from "../../../../lib/account-link/workflow"

type UnlinkBody = {
  payload_user_id?: string
  medusa_customer_id?: string
}

export async function POST(req: MedusaRequest<UnlinkBody>, res: MedusaResponse) {
  assertInternalSecret(req.headers["x-account-link-secret"])

  const body = (req.body || {}) as UnlinkBody
  let customerId = body.medusa_customer_id

  if (!customerId && body.payload_user_id) {
    const customers = req.scope.resolve(Modules.CUSTOMER)
    // Best-effort lookup via metadata; callers should prefer medusa_customer_id.
    const listed = await customers.listCustomers({}, { take: 200 })
    const match = listed.find(
      (customer) =>
        customer.metadata?.[META_PAYLOAD_USER_ID] != null &&
        String(customer.metadata[META_PAYLOAD_USER_ID]) === body.payload_user_id
    )
    customerId = match?.id
  }

  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Linked shop customer was not found"
    )
  }

  const result = await unlinkAccounts(req.scope, {
    customerId,
    payloadUserId: body.payload_user_id,
  })

  res.json(result)
}
