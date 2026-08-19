import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (_req: MedusaRequest, res: MedusaResponse) => {
  const enabled = Boolean(
    process.env.AUTHENTIK_ISSUER &&
      process.env.AUTHENTIK_CLIENT_ID &&
      process.env.AUTHENTIK_CLIENT_SECRET
  )

  res.json({ enabled })
}
