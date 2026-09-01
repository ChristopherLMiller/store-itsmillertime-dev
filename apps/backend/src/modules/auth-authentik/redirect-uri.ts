import { MedusaError } from "@medusajs/framework/utils"

export function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, "")
}

export function getAuthentikRedirectUris(
  env: Record<string, string | undefined> = process.env
): {
  adminRedirectUri: string
  storefrontRedirectUri: string
} {
  const adminRedirectUri =
    env.AUTHENTIK_REDIRECT_URI ||
    `${env.MEDUSA_BACKEND_URL || "http://localhost:9000"}/app/login`

  const storefrontRedirectUri =
    env.AUTHENTIK_STOREFRONT_REDIRECT_URI ||
    `${stripTrailingSlash(env.STOREFRONT_URL || "http://localhost:8000")}/auth/callback`

  return { adminRedirectUri, storefrontRedirectUri }
}

export function resolveAuthentikCallbackUrl(input: {
  actorType?: string
  requestedCallbackUrl?: string
  adminRedirectUri: string
  storefrontRedirectUri?: string
}): string {
  const allowed = new Set(
    [input.adminRedirectUri, input.storefrontRedirectUri]
      .filter((value): value is string => Boolean(value))
      .map(stripTrailingSlash)
  )

  const requested = input.requestedCallbackUrl
    ? stripTrailingSlash(input.requestedCallbackUrl)
    : undefined

  if (requested && allowed.has(requested)) {
    if (
      input.storefrontRedirectUri &&
      requested === stripTrailingSlash(input.storefrontRedirectUri)
    ) {
      return input.storefrontRedirectUri
    }

    return input.adminRedirectUri
  }

  if (input.actorType === "customer") {
    if (!input.storefrontRedirectUri) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Authentik storefront redirect URI is not configured. Set AUTHENTIK_STOREFRONT_REDIRECT_URI or STOREFRONT_URL."
      )
    }

    return input.storefrontRedirectUri
  }

  return input.adminRedirectUri
}
