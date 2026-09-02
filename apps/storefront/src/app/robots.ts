import type { MetadataRoute } from "next"

import { getBaseURL } from "@lib/util/env"

export default function robots(): MetadataRoute.Robots {
  const base = getBaseURL().replace(/\/$/, "")

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/*/checkout",
          "/*/cart",
          "/*/account/",
          "/*/reset-password",
          "/*/verify-account",
          "/*/auth/",
          "/*/order/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
