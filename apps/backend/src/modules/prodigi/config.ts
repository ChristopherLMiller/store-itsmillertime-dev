import type { ProdigiModuleOptions } from "./types"
import {
  resolveEcommerceEnvironment,
  resolveEnvironmentApiKey,
} from "../../utils/ecommerce-environment"

export function resolveProdigiConfig(): ProdigiModuleOptions {
  const environment = resolveEcommerceEnvironment()

  if (environment === "live") {
    return {
      environment: "live",
      apiKey: resolveEnvironmentApiKey("PRODIGI"),
      baseUrl:
        process.env.PRODIGI_API_URL ||
        process.env.PRODIGI_LIVE_API_URL ||
        "https://api.prodigi.com",
    }
  }

  return {
    environment: "sandbox",
    apiKey: resolveEnvironmentApiKey("PRODIGI"),
    baseUrl:
      process.env.PRODIGI_API_URL ||
      process.env.PRODIGI_SANDBOX_API_URL ||
      "https://api.sandbox.prodigi.com",
  }
}
