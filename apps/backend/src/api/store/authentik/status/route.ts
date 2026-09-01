import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

function authentikEnabled() {
  return Boolean(
    process.env.AUTHENTIK_ISSUER &&
      process.env.AUTHENTIK_CLIENT_ID &&
      process.env.AUTHENTIK_CLIENT_SECRET
  )
}

export const GET = async (_req: MedusaRequest, res: MedusaResponse) => {
  const enabled = authentikEnabled()

  res.json({
    enabled,
    storefront: enabled,
  })
}
