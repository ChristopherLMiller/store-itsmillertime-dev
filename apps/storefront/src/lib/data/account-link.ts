"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheTag } from "@lib/data/cookies"
import { revalidateTag } from "next/cache"

export type AccountLinkStatus = {
  linked: boolean
  brand: string
  payload_user_id: string | null
  payload_email: string | null
  linked_at: string | null
  roles: string[]
}

export async function getAccountLinkStatus(): Promise<AccountLinkStatus | null> {
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) {
    return null
  }

  try {
    const result = await sdk.client.fetch<{
      account_link: AccountLinkStatus
    }>(`/store/account-link`, {
      method: "GET",
      headers,
      cache: "no-store",
    })
    return result.account_link
  } catch {
    return null
  }
}

export async function startItsMillerTimeLink(
  _prev: unknown,
  formData: FormData
): Promise<{
  success: boolean
  error: string | null
  challenge_id?: string
  target_email?: string
}> {
  const email = String(formData.get("email") || "").trim()
  if (!email) {
    return { success: false, error: "Enter your itsMillerTime account email." }
  }

  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) {
    return { success: false, error: "You must be signed in." }
  }

  try {
    const result = await sdk.client.fetch<{
      challenge_id: string
      target_email: string
    }>(`/store/account-link/start`, {
      method: "POST",
      headers,
      body: { email },
    })

    return {
      success: true,
      error: null,
      challenge_id: result.challenge_id,
      target_email: result.target_email,
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not start account linking.",
    }
  }
}

export async function confirmItsMillerTimeLink(
  _prev: unknown,
  formData: FormData
): Promise<{ success: boolean; error: string | null }> {
  const challengeId = String(formData.get("challenge_id") || "").trim()
  const code = String(formData.get("code") || "").trim()

  if (!challengeId || !code) {
    return { success: false, error: "Enter the code from your email." }
  }

  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) {
    return { success: false, error: "You must be signed in." }
  }

  try {
    await sdk.client.fetch(`/store/account-link/confirm`, {
      method: "POST",
      headers,
      body: {
        challenge_id: challengeId,
        code,
      },
    })

    const tag = await getCacheTag("customers")
    if (tag) {
      revalidateTag(tag)
    }

    return { success: true, error: null }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not confirm account linking.",
    }
  }
}

export async function unlinkItsMillerTimeAccount(): Promise<{
  success: boolean
  error: string | null
}> {
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) {
    return { success: false, error: "You must be signed in." }
  }

  try {
    await sdk.client.fetch(`/store/account-link`, {
      method: "DELETE",
      headers,
    })

    const tag = await getCacheTag("customers")
    if (tag) {
      revalidateTag(tag)
    }

    return { success: true, error: null }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not unlink itsMillerTime account.",
    }
  }
}
