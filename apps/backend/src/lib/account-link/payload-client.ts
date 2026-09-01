import {
  ITSMILLERTIME_BRAND,
  META_AUTHENTIK_SUB,
  META_LINKED_AT,
  META_PAYLOAD_EMAIL,
  META_PAYLOAD_ROLES,
  META_PAYLOAD_USER_ID,
} from "./constants"

export type PayloadLinkUser = {
  id: string
  email: string
  roles: string[]
  authentikSub: string | null
  medusaCustomerId: string | null
}

function cmsBaseUrl(): string {
  const url =
    process.env.PAYLOAD_URL ||
    process.env.CMS_URL ||
    process.env.ITSMILLERTIME_CMS_URL
  if (!url) {
    throw new Error("PAYLOAD_URL (or CMS_URL) must be set for account linking")
  }
  return url.replace(/\/$/, "")
}

function sharedSecret(): string {
  const secret = process.env.ACCOUNT_LINK_SHARED_SECRET
  if (!secret) {
    throw new Error("ACCOUNT_LINK_SHARED_SECRET is not configured")
  }
  return secret
}

async function cmsFetch<T>(
  path: string,
  init: RequestInit & { method: string }
): Promise<T> {
  const response = await fetch(`${cmsBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-account-link-secret": sharedSecret(),
      ...(init.headers || {}),
    },
  })

  const body = (await response.json().catch(() => ({}))) as T & {
    error?: string
    message?: string
  }

  if (!response.ok) {
    const message =
      (typeof body.error === "string" && body.error) ||
      (typeof body.message === "string" && body.message) ||
      `CMS account-link request failed (${response.status})`
    const err = new Error(message) as Error & { status: number }
    err.status = response.status
    throw err
  }

  return body
}

export async function lookupPayloadUserByEmail(
  email: string
): Promise<PayloadLinkUser | null> {
  const result = await cmsFetch<{ user: PayloadLinkUser | null }>(
    "/api/account-link/medusa/lookup",
    { method: "POST", body: JSON.stringify({ email }) }
  )
  return result.user
}

export async function completePayloadLink(input: {
  payloadUserId: string
  medusaCustomerId: string
  medusaCustomerEmail: string
}): Promise<PayloadLinkUser> {
  const result = await cmsFetch<{ user: PayloadLinkUser }>(
    "/api/account-link/medusa/complete",
    { method: "POST", body: JSON.stringify(input) }
  )
  return result.user
}

export async function clearPayloadLink(input: {
  payloadUserId?: string
  medusaCustomerId?: string
}): Promise<void> {
  await cmsFetch("/api/account-link/medusa/unlink", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function buildLinkedCustomerMetadata(
  existing: Record<string, unknown> | null | undefined,
  user: PayloadLinkUser
): Record<string, unknown> {
  return {
    ...(existing || {}),
    [META_PAYLOAD_USER_ID]: user.id,
    [META_PAYLOAD_EMAIL]: user.email,
    [META_AUTHENTIK_SUB]: user.authentikSub,
    [META_PAYLOAD_ROLES]: user.roles,
    [META_LINKED_AT]: new Date().toISOString(),
  }
}

export function stripLinkedCustomerMetadata(
  existing: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const next = { ...(existing || {}) }
  delete next[META_PAYLOAD_USER_ID]
  delete next[META_PAYLOAD_EMAIL]
  delete next[META_AUTHENTIK_SUB]
  delete next[META_PAYLOAD_ROLES]
  delete next[META_LINKED_AT]
  return next
}

export function linkStatusFromMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  const payloadUserId = metadata?.[META_PAYLOAD_USER_ID]
  const linked =
    typeof payloadUserId === "string" || typeof payloadUserId === "number"
  return {
    linked: Boolean(linked),
    brand: ITSMILLERTIME_BRAND,
    payload_user_id: linked ? String(payloadUserId) : null,
    payload_email:
      typeof metadata?.[META_PAYLOAD_EMAIL] === "string"
        ? (metadata[META_PAYLOAD_EMAIL] as string)
        : null,
    linked_at:
      typeof metadata?.[META_LINKED_AT] === "string"
        ? (metadata[META_LINKED_AT] as string)
        : null,
    roles: Array.isArray(metadata?.[META_PAYLOAD_ROLES])
      ? (metadata![META_PAYLOAD_ROLES] as unknown[]).filter(
          (role): role is string => typeof role === "string"
        )
      : [],
  }
}
