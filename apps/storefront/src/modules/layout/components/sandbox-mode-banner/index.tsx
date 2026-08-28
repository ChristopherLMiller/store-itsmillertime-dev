import { retrieveEcommerceEnvironment } from "@lib/data/ecommerce-environment"

function bannerCopy(status: {
  stripe: { environment: string }
  prodigi: { environment: string }
}): string {
  const stripeSandbox = status.stripe.environment === "sandbox"
  const prodigiSandbox = status.prodigi.environment === "sandbox"

  if (stripeSandbox && prodigiSandbox) {
    return "Test mode — Stripe test keys and Prodigi sandbox. No real charges or prints."
  }
  if (stripeSandbox) {
    return "Test mode — Stripe is sandbox. Prodigi is live."
  }
  return "Test mode — Prodigi is sandbox. Stripe is live."
}

export default async function SandboxModeBanner() {
  const status = await retrieveEcommerceEnvironment()

  if (!status?.is_sandbox) {
    return null
  }

  return (
    <div
      className="bg-amber-200 px-4 py-2 text-center text-sm text-amber-950"
      data-testid="sandbox-mode-banner"
    >
      {bannerCopy(status)}
    </div>
  )
}
