"use server"

import { sdk } from "@lib/config"
import { fetchCache } from "@lib/util/cache"
import { getCacheOptions } from "./cookies"

export type EcommerceEnvironment = "sandbox" | "live"

export type EcommerceEnvironmentStatus = {
  environment: EcommerceEnvironment
  is_sandbox: boolean
  prodigi: {
    environment: EcommerceEnvironment
    api_url: string
  }
  stripe: {
    environment: EcommerceEnvironment
  }
}

export const retrieveEcommerceEnvironment = async (): Promise<EcommerceEnvironmentStatus | null> => {
  const next = {
    ...(await getCacheOptions("ecommerce-environment")),
  }

  return sdk.client
    .fetch<EcommerceEnvironmentStatus>("/store/ecommerce-environment", {
      method: "GET",
      next,
      cache: fetchCache,
    })
    .catch(() => null)
}
