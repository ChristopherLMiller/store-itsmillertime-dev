import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { ConfigModule } from "@medusajs/framework/types"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const configModule = req.scope.resolve<ConfigModule>("configModule")
  const adminPath = configModule.admin?.path || "/app"

  res.redirect(302, adminPath)
}
