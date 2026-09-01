export const META_PAYLOAD_USER_ID = "payload_user_id"
export const META_PAYLOAD_EMAIL = "payload_email"
export const META_AUTHENTIK_SUB = "authentik_sub"
export const META_LINKED_AT = "itsmillertime_linked_at"
export const META_PAYLOAD_ROLES = "payload_roles"

export const ROLE_TO_CUSTOMER_GROUP: Record<string, string> = {
  family: "family",
  friend: "friend",
  client: "client",
  user: "user",
  admin: "admin",
}

export const OTP_TTL_MS = 15 * 60 * 1000
export const OTP_MAX_ATTEMPTS = 5
export const OTP_LENGTH = 6

export const ITSMILLERTIME_BRAND = "itsMillerTime"
