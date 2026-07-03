type ParseProductSpecsInput = {
  sku: string
  description: string
  width: number | null
  height: number | null
  units: string | null
}

export type ParsedProdigiProductSpecs = {
  paper_type: string | null
  weight_gsm: number | null
  suggested_label: string
}

function formatDimension(value: number): string {
  return Number.isInteger(value) || value % 1 === 0
    ? String(Math.round(value))
    : String(Number(value.toFixed(1)))
}

export function formatDisplaySize(
  width: number | null,
  height: number | null,
  units: string | null
): string | null {
  if (width == null || height == null) {
    return null
  }

  const w = formatDimension(width)
  const h = formatDimension(height)
  const normalizedUnits = units?.toLowerCase()

  if (normalizedUnits === "in" || normalizedUnits === "inch" || normalizedUnits === "inches") {
    return `${w}×${h}″`
  }

  if (normalizedUnits === "cm") {
    return `${w}×${h} cm`
  }

  return `${w}×${h}${units ? ` ${units}` : ""}`
}

export function parseWeightGsm(description: string): number | null {
  const match = description.match(/(\d+)\s*gsm/i)
  return match ? Number.parseInt(match[1], 10) : null
}

function inferPaperTypeFromSku(sku: string): string | null {
  const upper = sku.toUpperCase()

  if (upper.includes("-PAP-")) return "Photographic Art Print"
  if (upper.includes("-FAP-")) return "Fine Art Print"
  if (upper.includes("-CAN-")) return "Canvas Print"
  if (upper.includes("-MET-")) return "Metal Print"
  if (upper.includes("-ACR-")) return "Acrylic Print"
  if (upper.includes("-LUS-")) return "Lustre Print"
  if (upper.includes("-MAT-")) return "Matte Print"
  if (upper.includes("-GLO-")) return "Gloss Print"

  return null
}

export function parsePaperType(description: string, sku: string): string | null {
  const parts = description
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)

  const paperParts = parts.filter((part) => {
    if (/^\d+\s*gsm$/i.test(part)) {
      return false
    }

    if (/^[\d.]+\s*[x×]\s*[\d.]+/i.test(part)) {
      return false
    }

    // Standalone Prodigi paper codes (EMA, LPP, …)
    if (/^[A-Z]{2,5}$/.test(part)) {
      return false
    }

    return true
  })

  const combined = paperParts.join(", ").trim()

  if (combined.length >= 3) {
    return combined
  }

  return inferPaperTypeFromSku(sku)
}

export function buildSuggestedLabel(input: {
  width?: number | null
  height?: number | null
  units?: string | null
  size_label?: string | null
  paper_type: string | null
  weight_gsm?: number | null
}): string {
  const size =
    input.size_label ??
    formatDisplaySize(
      input.width ?? null,
      input.height ?? null,
      input.units ?? null
    )
  const weight = input.weight_gsm ? `${input.weight_gsm}gsm` : null

  const parts = [size, input.paper_type, weight].filter(Boolean)

  if (parts.length) {
    return parts.join(" · ")
  }

  return ""
}

export function parseProdigiProductSpecs(
  input: ParseProductSpecsInput
): ParsedProdigiProductSpecs {
  const paper_type = parsePaperType(input.description, input.sku)
  const weight_gsm = parseWeightGsm(input.description)
  const suggested_label =
    buildSuggestedLabel({
      width: input.width,
      height: input.height,
      units: input.units,
      paper_type,
      weight_gsm,
    }) || input.description

  return {
    paper_type,
    weight_gsm,
    suggested_label,
  }
}
