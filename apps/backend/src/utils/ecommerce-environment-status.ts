import { resolveProdigiConfig } from "../modules/prodigi/config"
import {
  resolveEcommerceEnvironment,
  resolveEnvironmentApiKey,
  type EcommerceEnvironment,
} from "./ecommerce-environment"

export type ServiceEnvironmentStatus = {
  environment: EcommerceEnvironment
}

export type ProdigiEnvironmentStatus = ServiceEnvironmentStatus & {
  api_url: string
}

export type EcommerceEnvironmentStatus = {
  environment: EcommerceEnvironment
  is_sandbox: boolean
  prodigi: ProdigiEnvironmentStatus
  stripe: ServiceEnvironmentStatus
}

export function classifyStripeSecretKey(
  secretKey: string | undefined,
  fallback: EcommerceEnvironment
): EcommerceEnvironment {
  if (secretKey?.startsWith("sk_live_")) {
    return "live"
  }
  if (secretKey?.startsWith("sk_test_")) {
    return "sandbox"
  }
  return fallback
}

export function classifyProdigiApiUrl(
  baseUrl: string,
  fallback: EcommerceEnvironment
): EcommerceEnvironment {
  try {
    const host = new URL(baseUrl).hostname.toLowerCase()
    if (host.includes("sandbox")) {
      return "sandbox"
    }
    if (host === "api.prodigi.com" || host.endsWith(".prodigi.com")) {
      return "live"
    }
  } catch {
    // Fall through to the configured ecommerce environment.
  }

  return fallback
}

export function getEcommerceEnvironmentStatus(): EcommerceEnvironmentStatus {
  const environment = resolveEcommerceEnvironment()
  const prodigi = resolveProdigiConfig()
  const stripeKey = resolveEnvironmentApiKey("STRIPE")
  const prodigiEnvironment = classifyProdigiApiUrl(prodigi.baseUrl, environment)
  const stripeEnvironment = classifyStripeSecretKey(stripeKey, environment)

  return {
    environment,
    is_sandbox:
      environment === "sandbox" ||
      prodigiEnvironment === "sandbox" ||
      stripeEnvironment === "sandbox",
    prodigi: {
      environment: prodigiEnvironment,
      api_url: prodigi.baseUrl.replace(/\/+$/, ""),
    },
    stripe: {
      environment: stripeEnvironment,
    },
  }
}
