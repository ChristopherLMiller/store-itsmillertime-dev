import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ensureAuthentikAdminUserWorkflow } from "../../../../workflows/ensure-authentik-admin-user"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { result } = await ensureAuthentikAdminUserWorkflow(req.scope).run({
    input: {
      auth_identity_id: req.auth_context.auth_identity_id!,
    },
  })

  res.json({ user_id: result.user_id })
}
