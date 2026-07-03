import type { ProdigiEnvironment, ProdigiModuleOptions } from "./types"

export function resolveProdigiConfig(): ProdigiModuleOptions {
  const environment = (process.env.PRODIGI_ENVIRONMENT ||
    "sandbox") as ProdigiEnvironment

  if (environment === "live") {
    return {
      environment: "live",
      apiKey: process.env.PRODIGI_API_KEY || "",
      baseUrl:
        process.env.PRODIGI_API_URL ||
        process.env.PRODIGI_LIVE_API_URL ||
        "https://api.prodigi.com",
    }
  }

  return {
    environment: "sandbox",
    apiKey:
      process.env.PRODIGI_SANDBOX_API_KEY || process.env.PRODIGI_API_KEY || "",
    baseUrl:
      process.env.PRODIGI_API_URL ||
      process.env.PRODIGI_SANDBOX_API_URL ||
      "https://api.sandbox.prodigi.com",
  }
}
