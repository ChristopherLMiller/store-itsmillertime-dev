type Logger = {
  info: (message: string) => void
  warn: (message: string) => void
  error: (message: string) => void
}

/**
 * Ask the Next.js storefront to drop its catalog cache after Medusa data
 * changes. Safe to call from subscribers — failures are logged, not thrown.
 */
export async function invalidateStorefrontCache(
  logger: Logger,
  tags: string[] = ["products"]
) {
  const storefrontUrl = process.env.STOREFRONT_URL?.replace(/\/$/, "")
  const secret = process.env.REVALIDATE_SECRET

  if (!storefrontUrl) {
    logger.warn(
      "STOREFRONT_URL is not set; storefront catalog cache was not revalidated"
    )
    return
  }

  if (!secret) {
    logger.warn(
      "REVALIDATE_SECRET is not set; storefront catalog cache was not revalidated"
    )
    return
  }

  const url = `${storefrontUrl}/api/revalidate?tags=${encodeURIComponent(
    tags.join(",")
  )}`

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-revalidate-secret": secret,
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      logger.warn(
        `Storefront cache revalidation failed: ${response.status} ${response.statusText}`
      )
      return
    }

    logger.info(`Storefront cache revalidated for tags: ${tags.join(", ")}`)
  } catch (error) {
    logger.warn(
      `Storefront cache revalidation request failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}
