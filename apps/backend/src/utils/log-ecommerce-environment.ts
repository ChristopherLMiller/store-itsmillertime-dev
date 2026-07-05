import type { Logger } from "@medusajs/framework/types"
import { resolveProdigiConfig } from "../modules/prodigi/config"
import {
  resolveEcommerceEnvironment,
  resolveEnvironmentApiKey,
  resolveStripeWebhookSecret,
} from "./ecommerce-environment"

const WIDTH = 78

function line(char: string): string {
  return char.repeat(WIDTH)
}

function pad(text: string): string {
  return `  ${text}`.padEnd(WIDTH)
}

function printBanner(lines: string[], borderChar: string): void {
  console.log("")
  console.log(line(borderChar))
  for (const text of lines) {
    console.log(pad(text))
  }
  console.log(line(borderChar))
  console.log("")
}

function keyStatus(value: string | undefined): string {
  return value ? "configured" : "*** MISSING ***"
}

export function logEcommerceEnvironmentBanner(logger: Logger): void {
  const environment = resolveEcommerceEnvironment()
  const envLabel = environment.toUpperCase()
  const envVar =
    process.env.ECOMMERCE_ENVIRONMENT ?? "(unset - defaults to sandbox)"

  const prodigiConfig = resolveProdigiConfig()
  const prodigiKeyVar = `PRODIGI_${envLabel}_API_KEY`
  const stripeKeyVar = `STRIPE_${envLabel}_API_KEY`
  const stripeWebhookVar = `STRIPE_${envLabel}_WEBHOOK_SECRET`

  const prodigiKey = resolveEnvironmentApiKey("PRODIGI")
  const stripeKey = resolveEnvironmentApiKey("STRIPE")
  const stripeWebhook = resolveStripeWebhookSecret()

  const isLive = environment === "live"
  const borderChar = isLive ? "!" : "="

  printBanner(
    [
      "",
      isLive
        ? "***  ECOMMERCE IS IN LIVE MODE  ***"
        : "ECOMMERCE IS IN SANDBOX MODE (test environment)",
      "",
      isLive
        ? "Real payments and real print fulfillment are active."
        : "Stripe test mode and Prodigi sandbox only — no real charges or prints.",
      isLive
        ? "Set ECOMMERCE_ENVIRONMENT=sandbox to use test APIs."
        : "Set ECOMMERCE_ENVIRONMENT=live only when you intend to go production.",
      "",
      `ECOMMERCE_ENVIRONMENT:  ${envVar}`,
      "",
      "Prodigi",
      `  API URL:                ${prodigiConfig.baseUrl}`,
      `  API key:                ${keyStatus(prodigiKey)}`,
      `  Key variable:           ${prodigiKeyVar}`,
      "",
      "Stripe",
      `  Secret key:             ${keyStatus(stripeKey)}`,
      `  Key variable:           ${stripeKeyVar}`,
      `  Webhook secret:         ${stripeWebhook ? "configured" : "not set"}`,
      `  Webhook variable:       ${stripeWebhookVar}`,
      "",
    ],
    borderChar
  )

  if (isLive) {
    logger.error(
      "[Ecommerce] LIVE MODE - production Stripe and Prodigi APIs are active."
    )
  } else {
    logger.info(
      "[Ecommerce] Sandbox mode - test Stripe and Prodigi APIs only."
    )
  }

  if (!prodigiKey) {
    printBanner(
      [
        "",
        `PRODIGI ${envLabel} API KEY IS MISSING`,
        `Set ${prodigiKeyVar} in your environment.`,
        "",
      ],
      borderChar
    )
    logger.error(`[Prodigi] ${prodigiKeyVar} is not set - Prodigi calls will fail`)
  }

  if (!stripeKey) {
    printBanner(
      [
        "",
        `STRIPE ${envLabel} API KEY IS MISSING`,
        `Set ${stripeKeyVar} in your environment.`,
        "",
      ],
      borderChar
    )
    logger.error(`[Stripe] ${stripeKeyVar} is not set - Stripe payments will fail`)
  }

  if (!stripeWebhook) {
    logger.warn(
      `[Stripe] ${stripeWebhookVar} is not set - webhook-dependent payment flows may leave orders pending`
    )
  }
}
