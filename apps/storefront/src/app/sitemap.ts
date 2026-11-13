import type { MetadataRoute } from "next"

import { getBaseURL } from "@lib/util/env"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseURL().replace(/\/$/, "")
  const country = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"
  const origin = `${base}/${country}`

  return [
    {
      url: origin,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${origin}/store`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ]
}
