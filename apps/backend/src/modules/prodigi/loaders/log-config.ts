import type { LoaderOptions } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { resolveProdigiConfig } from "../config"

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

export default async function logProdigiConfigLoader({
  container,
}: LoaderOptions) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const config = resolveProdigiConfig()

  const apiKeyStatus = config.apiKey ? "configured" : "*** MISSING ***"
  const envVar =
    process.env.PRODIGI_ENVIRONMENT ?? "(unset - defaults to sandbox)"

  if (config.environment === "live") {
    printBanner(
      [
        "",
        "***  PRODIGI IS IN LIVE MODE  ***",
        "",
        "Real orders. Real charges. Real print fulfillment.",
        "Set PRODIGI_ENVIRONMENT=sandbox to use the test API.",
        "",
        `API URL:              ${config.baseUrl}`,
        `API key:              ${apiKeyStatus}`,
        `PRODIGI_ENVIRONMENT:  ${envVar}`,
        "",
      ],
      "!"
    )

    logger.error(
      "[Prodigi] LIVE MODE - production API active. Orders will be charged and fulfilled for real."
    )

    if (!config.apiKey) {
      printBanner(
        [
          "",
          "PRODIGI LIVE API KEY IS MISSING",
          "Set PRODIGI_API_KEY in your environment.",
          "",
        ],
        "!"
      )
      logger.error("[Prodigi] PRODIGI_API_KEY is not set - live API calls will fail")
    }
  } else {
    printBanner(
      [
        "",
        "PRODIGI IS IN SANDBOX MODE (test environment)",
        "",
        "Orders go to Prodigi sandbox only - nothing is printed or charged.",
        "Set PRODIGI_ENVIRONMENT=live only when you intend to go production.",
        "",
        `API URL:              ${config.baseUrl}`,
        `API key:              ${apiKeyStatus}`,
        `PRODIGI_ENVIRONMENT:  ${envVar}`,
        "",
      ],
      "="
    )

    logger.info("[Prodigi] Sandbox mode - test API only, no real fulfillment")

    if (!config.apiKey) {
      printBanner(
        [
          "",
          "PRODIGI SANDBOX API KEY IS MISSING",
          "Set PRODIGI_SANDBOX_API_KEY (or PRODIGI_API_KEY) in your environment.",
          "",
        ],
        "="
      )
      logger.warn("[Prodigi] Sandbox API key is not set - Prodigi calls will fail")
    }
  }
}
