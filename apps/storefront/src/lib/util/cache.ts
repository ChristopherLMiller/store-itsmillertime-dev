/**
 * Next.js caches `fetch(..., { cache: "force-cache" })` aggressively — fine for
 * production, but it makes admin catalog changes invisible during local dev.
 *
 * Production still caches, with a short ISR window so missed webhooks don't
 * leave the catalog stale until a process restart.
 */
export const catalogRevalidateSeconds = 60

export const shouldBypassDataCache =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_DISABLE_DATA_CACHE === "true"

export const fetchCache: RequestCache = shouldBypassDataCache
  ? "no-store"
  : "force-cache"

export const fetchRevalidate = shouldBypassDataCache
  ? 0
  : catalogRevalidateSeconds
