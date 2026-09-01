import { createHash, randomInt, timingSafeEqual } from "node:crypto"
import { OTP_LENGTH, OTP_TTL_MS } from "./constants"

function pepper(): string {
  return (
    process.env.ACCOUNT_LINK_SECRET ||
    process.env.JWT_SECRET ||
    "dev-account-link-pepper"
  )
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))
}

export function generateOtpCode(): string {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0")
}

export function hashOtpCode(code: string): string {
  return createHash("sha256")
    .update(`${pepper()}:${code.trim()}`)
    .digest("hex")
}

export function otpMatches(code: string, codeHash: string): boolean {
  const a = Buffer.from(hashOtpCode(code), "utf8")
  const b = Buffer.from(codeHash, "utf8")
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function otpExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + OTP_TTL_MS)
}

export function assertInternalSecret(
  headerValue: string | string[] | undefined
) {
  const expected = process.env.ACCOUNT_LINK_SHARED_SECRET
  if (!expected) {
    throw new Error("ACCOUNT_LINK_SHARED_SECRET is not configured")
  }
  const provided = Array.isArray(headerValue) ? headerValue[0] : headerValue
  if (!provided || provided !== expected) {
    const err = new Error("Unauthorized") as Error & { status: number }
    err.status = 401
    throw err
  }
}
