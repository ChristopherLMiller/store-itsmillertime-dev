import { model } from "@medusajs/framework/utils"

/**
 * Short-lived OTP challenge for linking a Medusa customer to an
 * itsMillerTime (Payload) account. Emails on either side do not need to match.
 */
export const LinkChallenge = model.define("account_link_challenge", {
  id: model.id().primaryKey(),
  /** Medusa customer id being linked (known when challenge starts from the shop). */
  customer_id: model.text().nullable(),
  /** Payload user id being linked (known when challenge starts from itsMillerTime). */
  payload_user_id: model.text().nullable(),
  /**
   * Where the OTP was sent.
   * - `payload`: shop → enter itsMillerTime email → OTP to that inbox
   * - `medusa`: www → enter shop email → OTP to that inbox
   */
  target_side: model.enum(["payload", "medusa"]),
  target_email: model.text(),
  code_hash: model.text(),
  attempts: model.number().default(0),
  expires_at: model.dateTime(),
  consumed_at: model.dateTime().nullable(),
  metadata: model.json().nullable(),
})
