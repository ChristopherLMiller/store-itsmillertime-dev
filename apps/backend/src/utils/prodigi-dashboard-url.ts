import {
  resolveEcommerceEnvironment,
  type EcommerceEnvironment,
} from "./ecommerce-environment"

export type ProdigiEnvironment = EcommerceEnvironment

const PRODIGI_DASHBOARD_BASE_URL: Record<ProdigiEnvironment, string> = {
  sandbox: "https://sandbox-beta-dashboard.pwinty.com",
  live: "https://dashboard.prodigi.com",
}

/**
 * Prodigi's dashboard uses numeric order IDs; the API returns `ord_{id}`.
 */
export function normalizeProdigiDashboardOrderId(
  prodigiOrderId: string
): string | null {
  const trimmed = prodigiOrderId.trim()
  if (!trimmed) {
    return null
  }

  if (trimmed.startsWith("ord_")) {
    const numericId = trimmed.slice(4)
    return numericId || null
  }

  return trimmed
}

export function resolveStoredProdigiEnvironment(
  metadata: Record<string, unknown> | null | undefined
): ProdigiEnvironment {
  const value = metadata?.prodigi_environment
  if (value === "sandbox" || value === "live") {
    return value
  }

  // Legacy fulfillments submitted before we stored the environment.
  return "live"
}

export function buildProdigiDashboardOrderUrl(
  prodigiOrderId: string,
  environment?: ProdigiEnvironment
): string | null {
  const dashboardOrderId = normalizeProdigiDashboardOrderId(prodigiOrderId)
  if (!dashboardOrderId) {
    return null
  }

  const env = environment ?? resolveEcommerceEnvironment()
  const baseUrl = PRODIGI_DASHBOARD_BASE_URL[env]

  return `${baseUrl}/orders/${dashboardOrderId}/detail`
}
