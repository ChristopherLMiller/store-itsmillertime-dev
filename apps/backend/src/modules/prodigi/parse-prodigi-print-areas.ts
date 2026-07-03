export type ProdigiPrintAreaSize = {
  print_area: string
  horizontal_px: number
  vertical_px: number
  /** Human-readable variant context when sizes differ by option */
  variant_label: string | null
}

export type ProdigiPrintAreaSpecs = {
  /** Preferred entry for asset sizing (default area, first variant) */
  primary: ProdigiPrintAreaSize | null
  areas: ProdigiPrintAreaSize[]
}

type ProdigiVariantLike = {
  attributes?: Record<string, string> | null
  printAreaSizes?: Record<
    string,
    {
      horizontalResolution?: number
      verticalResolution?: number
    }
  > | null
}

function formatVariantLabel(
  attributes: Record<string, string> | null | undefined
): string | null {
  const entries = Object.entries(attributes ?? {}).filter(
    ([, value]) => value?.trim()
  )

  if (!entries.length) {
    return null
  }

  return entries.map(([key, value]) => `${key}: ${value}`).join(", ")
}

function areaKey(entry: ProdigiPrintAreaSize): string {
  return [
    entry.print_area,
    entry.horizontal_px,
    entry.vertical_px,
    entry.variant_label ?? "",
  ].join("|")
}

export function parseProdigiPrintAreas(
  variants: unknown[] | null | undefined
): ProdigiPrintAreaSpecs {
  const areas: ProdigiPrintAreaSize[] = []
  const seen = new Set<string>()

  for (const rawVariant of variants ?? []) {
    const variant = rawVariant as ProdigiVariantLike
    const variantLabel = formatVariantLabel(variant.attributes)
    const printAreaSizes = variant.printAreaSizes ?? {}

    for (const [printArea, dimensions] of Object.entries(printAreaSizes)) {
      const horizontal = dimensions?.horizontalResolution
      const vertical = dimensions?.verticalResolution

      if (
        horizontal == null ||
        vertical == null ||
        !Number.isFinite(horizontal) ||
        !Number.isFinite(vertical)
      ) {
        continue
      }

      const entry: ProdigiPrintAreaSize = {
        print_area: printArea,
        horizontal_px: Math.round(horizontal),
        vertical_px: Math.round(vertical),
        variant_label: variantLabel,
      }

      const key = areaKey(entry)
      if (seen.has(key)) {
        continue
      }

      seen.add(key)
      areas.push(entry)
    }
  }

  const primary =
    areas.find(
      (area) => area.print_area === "default" && area.variant_label == null
    ) ??
    areas.find((area) => area.print_area === "default") ??
    areas[0] ??
    null

  return { primary, areas }
}

export function formatPrintAreaSize(area: ProdigiPrintAreaSize): string {
  return `${area.horizontal_px.toLocaleString()} × ${area.vertical_px.toLocaleString()} px`
}

export function formatPrintAreaLabel(area: ProdigiPrintAreaSize): string {
  const size = formatPrintAreaSize(area)
  const parts = [area.print_area !== "default" ? area.print_area : null, size]

  if (area.variant_label) {
    parts.push(`(${area.variant_label})`)
  }

  return parts.filter(Boolean).join(" · ")
}
