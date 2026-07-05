export type EcommerceEnvironment = "sandbox" | "live"

export function resolveEcommerceEnvironment(): EcommerceEnvironment {
  const environment = (process.env.ECOMMERCE_ENVIRONMENT || "sandbox").toLowerCase()

  if (environment === "live") {
    return "live"
  }

  return "sandbox"
}

export function resolveEnvironmentApiKey(prefix: "PRODIGI" | "STRIPE"): string {
  const environment = resolveEcommerceEnvironment().toUpperCase()
  return process.env[`${prefix}_${environment}_API_KEY`] || ""
}

export function resolveStripeWebhookSecret(): string {
  const environment = resolveEcommerceEnvironment().toUpperCase()
  return process.env[`STRIPE_${environment}_WEBHOOK_SECRET`] || ""
}
