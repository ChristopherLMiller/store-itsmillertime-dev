import { createHmac, timingSafeEqual } from "crypto"

const STATE_TTL_SECONDS = 20 * 60

export type AuthentikOAuthState = {
  callback_url: string
  code_verifier: string
  iat: number
}

function toBase64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

function fromBase64Url(value: string): Buffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/")
  const pad =
    padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4))
  return Buffer.from(padded + pad, "base64")
}

export function signAuthentikOAuthState(
  payload: Omit<AuthentikOAuthState, "iat">,
  secret: string
): string {
  const body = toBase64Url(
    Buffer.from(
      JSON.stringify({
        ...payload,
        iat: Math.floor(Date.now() / 1000),
      } satisfies AuthentikOAuthState)
    )
  )
  const signature = toBase64Url(
    createHmac("sha256", secret).update(body).digest()
  )
  return `${body}.${signature}`
}

export function verifyAuthentikOAuthState(
  state: string,
  secret: string
): AuthentikOAuthState | null {
  const separator = state.lastIndexOf(".")
  if (separator <= 0) {
    return null
  }

  const body = state.slice(0, separator)
  const signature = state.slice(separator + 1)
  const expected = toBase64Url(
    createHmac("sha256", secret).update(body).digest()
  )

  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null
  }

  try {
    const payload = JSON.parse(
      fromBase64Url(body).toString("utf8")
    ) as AuthentikOAuthState

    if (
      typeof payload.callback_url !== "string" ||
      typeof payload.code_verifier !== "string" ||
      typeof payload.iat !== "number"
    ) {
      return null
    }

    if (Math.floor(Date.now() / 1000) - payload.iat > STATE_TTL_SECONDS) {
      return null
    }

    return payload
  } catch {
    return null
  }
}
