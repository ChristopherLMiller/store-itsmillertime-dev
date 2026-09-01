import "server-only"

export type JwtPayload = {
  actor_id?: string
  user_metadata?: Record<string, unknown>
}

export function decodeJwtPayload(token: string): JwtPayload {
  try {
    const payload = token.split(".")[1]
    if (!payload) {
      return {}
    }

    const padded = payload.replace(/-/g, "+").replace(/_/g, "/")
    const pad =
      padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4))
    return JSON.parse(
      Buffer.from(padded + pad, "base64").toString("utf8")
    ) as JwtPayload
  } catch {
    return {}
  }
}

export function extractAuthToken(result: unknown): string | null {
  if (typeof result === "string" && result) {
    return result
  }

  if (
    result &&
    typeof result === "object" &&
    "token" in result &&
    typeof result.token === "string" &&
    result.token
  ) {
    return result.token
  }

  return null
}
