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

export function getStripePublishableKeyEnvVar(): string {
  return resolveEcommerceEnvironment() === "live"
    ? "NEXT_PUBLIC_STRIPE_LIVE_KEY"
    : "NEXT_PUBLIC_STRIPE_SANDBOX_KEY"
}

// Next.js only inlines NEXT_PUBLIC_* vars when accessed statically.
// Dynamic lookups like process.env[`NEXT_PUBLIC_STRIPE_${env}_KEY`] are
// always undefined in the browser bundle.
export function resolveStripePublishableKey(): string | undefined {
  if (resolveEcommerceEnvironment() === "live") {
    return (
      process.env.NEXT_PUBLIC_STRIPE_LIVE_KEY ||
      process.env.NEXT_PUBLIC_STRIPE_KEY
    )
  }

  return (
    process.env.NEXT_PUBLIC_STRIPE_SANDBOX_KEY ||
    process.env.NEXT_PUBLIC_STRIPE_KEY
  )
}
