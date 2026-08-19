import { sdk } from "./client"

const PROVIDER = "authentik"

type JwtPayload = {
  actor_id?: string
}

function decodeJwtPayload(token: string): JwtPayload {
  try {
    const payload = token.split(".")[1]
    if (!payload) {
      return {}
    }

    const padded = payload.replace(/-/g, "+").replace(/_/g, "/")
    const pad =
      padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4))
    return JSON.parse(atob(padded + pad)) as JwtPayload
  } catch {
    return {}
  }
}

export function getAuthentikCallbackQuery(): Record<string, string> {
  const params = new URLSearchParams(window.location.search)
  const query: Record<string, string> = {}

  for (const key of ["code", "state", "error", "error_description"]) {
    const value = params.get(key)
    if (value) {
      query[key] = value
    }
  }

  return query
}

export async function completeAuthentikLogin(
  query: Record<string, string>
): Promise<void> {
  if (query.error) {
    throw new Error(query.error_description || query.error)
  }

  if (!query.code || !query.state) {
    throw new Error("Authorization code or state is missing")
  }

  const result = await sdk.auth.callback("user", PROVIDER, {
    code: query.code,
    state: query.state,
  })

  const token = typeof result === "string" ? result : result.token
  if (!token) {
    throw new Error("Authentik callback did not return a token")
  }

  const decoded = decodeJwtPayload(token)
  if (!decoded.actor_id) {
    await sdk.client.fetch("/auth/authentik/register-user", {
      method: "POST",
      body: {},
    })
    await sdk.auth.refresh()
  }
}

export function authentikErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string" && message.trim()) {
      return message
    }
  }

  return "Authentik sign-in failed"
}
