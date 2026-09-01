import type { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { ACCOUNT_LINK_MODULE } from "../../modules/account-link"
import type AccountLinkModuleService from "../../modules/account-link/service"
import {
  ITSMILLERTIME_BRAND,
  META_PAYLOAD_USER_ID,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MS,
} from "./constants"
import {
  generateOtpCode,
  hashOtpCode,
  isValidEmail,
  normalizeEmail,
  otpExpiresAt,
  otpMatches,
} from "./otp"
import {
  buildLinkedCustomerMetadata,
  clearPayloadLink,
  completePayloadLink,
  lookupPayloadUserByEmail,
  stripLinkedCustomerMetadata,
  type PayloadLinkUser,
} from "./payload-client"
import { syncCustomerGroupsForRoles } from "./sync-customer-groups"

type Challenge = {
  id: string
  customer_id: string | null
  payload_user_id: string | null
  target_side: "payload" | "medusa"
  target_email: string
  code_hash: string
  attempts: number
  expires_at: Date | string
  consumed_at: Date | string | null
  metadata?: Record<string, unknown> | null
}

function asDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value)
}

function service(container: MedusaContainer) {
  return container.resolve(ACCOUNT_LINK_MODULE) as AccountLinkModuleService
}

async function sendOtp(container: MedusaContainer, to: string, code: string) {
  const notification = container.resolve(Modules.NOTIFICATION)
  await notification.createNotifications({
    to,
    channel: "email",
    template: "account-link-otp",
    data: {
      code,
      brand: ITSMILLERTIME_BRAND,
      store_name: process.env.STORE_NAME || "ItsMillerTime Store",
      minutes_valid: Math.round(OTP_TTL_MS / 60000),
      subject: `Your ${ITSMILLERTIME_BRAND} account link code`,
    },
  })
}

async function invalidateOpen(
  accountLink: AccountLinkModuleService,
  filters: Record<string, unknown>
) {
  const open = (await accountLink.listLinkChallenges({
    ...filters,
    consumed_at: null,
  })) as Challenge[]
  if (!open.length) return
  await accountLink.updateLinkChallenges(
    open.map((row) => ({ id: row.id, consumed_at: new Date() }))
  )
}

async function loadOpen(
  accountLink: AccountLinkModuleService,
  challengeId: string
) {
  const challenge = (await accountLink.retrieveLinkChallenge(
    challengeId
  )) as Challenge

  if (challenge.consumed_at) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "This code was already used. Start linking again."
    )
  }
  if (asDate(challenge.expires_at).getTime() < Date.now()) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "This code has expired. Start linking again."
    )
  }
  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Too many incorrect attempts. Start linking again."
    )
  }
  return challenge
}

async function applyLink(
  container: MedusaContainer,
  customerId: string,
  payloadUser: PayloadLinkUser
) {
  const customers = container.resolve(Modules.CUSTOMER)
  const customer = await customers.retrieveCustomer(customerId)

  const linked = await completePayloadLink({
    payloadUserId: payloadUser.id,
    medusaCustomerId: customerId,
    medusaCustomerEmail: customer.email,
  })

  await customers.updateCustomers(customerId, {
    metadata: buildLinkedCustomerMetadata(
      (customer.metadata || {}) as Record<string, unknown>,
      linked
    ),
  })

  const groups = await syncCustomerGroupsForRoles(
    container,
    customerId,
    linked.roles
  )

  return { customer_id: customerId, user: linked, groups }
}

/** Shop → enter itsMillerTime email → OTP to that email. */
export async function startShopToPayloadChallenge(
  container: MedusaContainer,
  input: { customerId: string; payloadEmail: string }
) {
  const email = normalizeEmail(input.payloadEmail)
  if (!isValidEmail(email)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Enter a valid email")
  }

  const customers = container.resolve(Modules.CUSTOMER)
  const customer = await customers.retrieveCustomer(input.customerId)

  if (customer.metadata?.[META_PAYLOAD_USER_ID]) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "This shop account is already linked. Unlink first to link a different itsMillerTime account."
    )
  }

  const payloadUser = await lookupPayloadUserByEmail(email)
  if (!payloadUser) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No itsMillerTime account found for that email."
    )
  }
  if (payloadUser.medusaCustomerId) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "That itsMillerTime account is already linked to a shop account."
    )
  }

  const accountLink = service(container)
  await invalidateOpen(accountLink, {
    customer_id: input.customerId,
    target_side: "payload",
  })

  const code = generateOtpCode()
  const challenge = await accountLink.createLinkChallenges({
    customer_id: input.customerId,
    payload_user_id: payloadUser.id,
    target_side: "payload",
    target_email: email,
    code_hash: hashOtpCode(code),
    attempts: 0,
    expires_at: otpExpiresAt(),
    consumed_at: null,
    metadata: {
      payload_email: payloadUser.email,
      shop_email: customer.email,
    },
  })

  await sendOtp(container, email, code)

  return {
    challenge_id: challenge.id,
    target_email: email,
    expires_in_seconds: Math.round(OTP_TTL_MS / 1000),
  }
}

/** www → enter shop email → OTP to that shop email. */
export async function startPayloadToShopChallenge(
  container: MedusaContainer,
  input: {
    payloadUserId: string
    payloadEmail: string
    shopEmail: string
    roles?: string[]
    authentikSub?: string | null
  }
) {
  const email = normalizeEmail(input.shopEmail)
  if (!isValidEmail(email)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Enter a valid email")
  }

  const customers = container.resolve(Modules.CUSTOMER)
  const list = await customers.listCustomers({ email }, { take: 1 })
  const customer = list[0]
  if (!customer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No shop account found for that email."
    )
  }
  if (customer.metadata?.[META_PAYLOAD_USER_ID]) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "That shop account is already linked to an itsMillerTime account."
    )
  }

  const accountLink = service(container)
  await invalidateOpen(accountLink, {
    payload_user_id: input.payloadUserId,
    target_side: "medusa",
  })

  const code = generateOtpCode()
  const challenge = await accountLink.createLinkChallenges({
    customer_id: customer.id,
    payload_user_id: input.payloadUserId,
    target_side: "medusa",
    target_email: email,
    code_hash: hashOtpCode(code),
    attempts: 0,
    expires_at: otpExpiresAt(),
    consumed_at: null,
    metadata: {
      payload_email: normalizeEmail(input.payloadEmail),
      shop_email: customer.email,
      roles: input.roles || [],
      authentik_sub: input.authentikSub || null,
    },
  })

  await sendOtp(container, email, code)

  return {
    challenge_id: challenge.id,
    target_email: email,
    expires_in_seconds: Math.round(OTP_TTL_MS / 1000),
    customer_id: customer.id,
  }
}

export async function confirmShopToPayloadChallenge(
  container: MedusaContainer,
  input: { customerId: string; challengeId: string; code: string }
) {
  const accountLink = service(container)
  const challenge = await loadOpen(accountLink, input.challengeId)

  if (
    challenge.target_side !== "payload" ||
    challenge.customer_id !== input.customerId
  ) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "This confirmation does not match your shop session."
    )
  }

  if (!otpMatches(input.code, challenge.code_hash)) {
    await accountLink.updateLinkChallenges({
      id: challenge.id,
      attempts: challenge.attempts + 1,
    })
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Incorrect code. Check the email and try again."
    )
  }

  const payloadUser = await lookupPayloadUserByEmail(challenge.target_email)
  if (!payloadUser || payloadUser.id !== challenge.payload_user_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "itsMillerTime account is no longer available for linking."
    )
  }

  const result = await applyLink(container, input.customerId, payloadUser)
  await accountLink.updateLinkChallenges({
    id: challenge.id,
    consumed_at: new Date(),
  })
  return result
}

export async function confirmPayloadToShopChallenge(
  container: MedusaContainer,
  input: { payloadUserId: string; challengeId: string; code: string }
) {
  const accountLink = service(container)
  const challenge = await loadOpen(accountLink, input.challengeId)

  if (
    challenge.target_side !== "medusa" ||
    challenge.payload_user_id !== input.payloadUserId
  ) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "This confirmation does not match your itsMillerTime session."
    )
  }
  if (!challenge.customer_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Challenge is missing shop customer."
    )
  }

  if (!otpMatches(input.code, challenge.code_hash)) {
    await accountLink.updateLinkChallenges({
      id: challenge.id,
      attempts: challenge.attempts + 1,
    })
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Incorrect code. Check the email and try again."
    )
  }

  const meta = (challenge.metadata || {}) as {
    payload_email?: string
    roles?: string[]
    authentik_sub?: string | null
  }

  let payloadUser: PayloadLinkUser = {
    id: input.payloadUserId,
    email: meta.payload_email || "",
    roles: Array.isArray(meta.roles) ? meta.roles : [],
    authentikSub: meta.authentik_sub || null,
    medusaCustomerId: null,
  }

  if (payloadUser.email) {
    const live = await lookupPayloadUserByEmail(payloadUser.email)
    if (live) payloadUser = live
  }

  const result = await applyLink(container, challenge.customer_id, payloadUser)
  await accountLink.updateLinkChallenges({
    id: challenge.id,
    consumed_at: new Date(),
  })
  return result
}

export async function unlinkAccounts(
  container: MedusaContainer,
  input: { customerId: string; payloadUserId?: string }
) {
  const customers = container.resolve(Modules.CUSTOMER)
  const customer = await customers.retrieveCustomer(input.customerId)

  const payloadUserId =
    input.payloadUserId ||
    (customer.metadata?.[META_PAYLOAD_USER_ID] != null
      ? String(customer.metadata[META_PAYLOAD_USER_ID])
      : undefined)

  await clearPayloadLink({
    payloadUserId,
    medusaCustomerId: input.customerId,
  })

  await customers.updateCustomers(input.customerId, {
    metadata: stripLinkedCustomerMetadata(
      (customer.metadata || {}) as Record<string, unknown>
    ),
  })

  await syncCustomerGroupsForRoles(container, input.customerId, [])

  return { customer_id: input.customerId, unlinked: true }
}
