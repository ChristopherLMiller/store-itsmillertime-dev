export type EcommerceEnvironment = "sandbox" | "live"

export function resolveEcommerceEnvironment(): EcommerceEnvironment {
  const environment = (
    process.env.NEXT_PUBLIC_ECOMMERCE_ENVIRONMENT || "sandbox"
  ).toLowerCase()

  if (environment === "live") {
    return "live"
  }

  return "sandbox"
}

export function resolveStripePublishableKey(): string | undefined {
  const environment = resolveEcommerceEnvironment().toUpperCase()
  return process.env[`NEXT_PUBLIC_STRIPE_${environment}_KEY`]
}
