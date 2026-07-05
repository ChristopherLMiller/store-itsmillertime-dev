export type DigitalDownloadFile = {
  url: string
  filename?: string
}

export type ResolvedDigitalFile = DigitalDownloadFile & {
  archiveName: string
}

function sanitizeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-")
}

function inferFilename(url: string, fallback: string): string {
  try {
    const pathname = new URL(url).pathname
    const basename = pathname.split("/").pop()
    if (basename && basename.includes(".")) {
      return sanitizeFilename(basename)
    }
  } catch {
    // Ignore invalid URLs here; callers validate separately.
  }

  return sanitizeFilename(fallback)
}

export function parseDigitalDownloadFiles(
  metadata: Record<string, unknown> | null | undefined
): DigitalDownloadFile[] {
  const raw = metadata?.digital_download_files

  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .map((entry): DigitalDownloadFile | null => {
      if (!entry || typeof entry !== "object") {
        return null
      }

      const url = (entry as { url?: unknown }).url
      if (typeof url !== "string" || !url.trim()) {
        return null
      }

      const filename = (entry as { filename?: unknown }).filename
      const parsed: DigitalDownloadFile = {
        url: url.trim(),
      }

      if (typeof filename === "string" && filename.trim()) {
        parsed.filename = sanitizeFilename(filename.trim())
      }

      return parsed
    })
    .filter((entry): entry is DigitalDownloadFile => entry !== null)
}

export function resolveDigitalDownloadFiles(input: {
  productTitle: string
  productMetadata: Record<string, unknown> | null | undefined
  thumbnail?: string | null
}): ResolvedDigitalFile[] {
  const configured = parseDigitalDownloadFiles(input.productMetadata)

  const fallbackUrls = [
    ...configured.map((file) => file.url),
    ...(typeof input.productMetadata?.print_asset_url === "string"
      ? [input.productMetadata.print_asset_url]
      : []),
    ...(input.thumbnail ? [input.thumbnail] : []),
  ].filter((url, index, all) => !!url && all.indexOf(url) === index)

  if (!fallbackUrls.length) {
    return []
  }

  const files: DigitalDownloadFile[] =
    configured.length > 0
      ? configured
      : fallbackUrls.map((url) => ({ url }))

  return files.map((file, index) => {
    const archiveName =
      file.filename ??
      inferFilename(
        file.url,
        `${sanitizeFilename(input.productTitle || "download")}-${index + 1}.jpg`
      )

    return {
      ...file,
      archiveName,
    }
  })
}
