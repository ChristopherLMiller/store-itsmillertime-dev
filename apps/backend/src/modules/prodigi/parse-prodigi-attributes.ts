export type ProdigiAttributeSpecs = {
  paper_type: string | null
  substrate: string | null
  weight_gsm: number | null
  size: string | null
  /** Single-value attributes that don't match a known spec key */
  other: Record<string, string>
  /** Multi-value attributes the customer picks at order time (wrap, frame, etc.) */
  order_options: Record<string, string[]>
}

const PAPER_TYPE_KEYS = new Set([
  "papertype",
  "paper",
  "papername",
  "mediatype",
  "media",
  "producttype",
  "product",
  "type",
])

const SUBSTRATE_KEYS = new Set([
  "substrate",
  "finish",
  "surface",
  "material",
  "coating",
])

const WEIGHT_KEYS = new Set([
  "weight",
  "weightgsm",
  "gsm",
  "paperweight",
  "papergsm",
  "basisweight",
  "substrateweight",
])

const SIZE_KEYS = new Set([
  "size",
  "dimensions",
  "format",
  "printsiz",
  "printsize",
])

function normalizeAttributeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function humanizeAttributeKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase())
}

function firstValue(values: string[] | undefined): string | null {
  const value = values?.[0]?.trim()
  return value || null
}

export function parseWeightFromText(value: string | null): number | null {
  if (!value) {
    return null
  }

  const match = value.match(/(\d+(?:\.\d+)?)\s*gsm/i) ?? value.match(/^(\d+(?:\.\d+)?)$/)
  if (!match) {
    return null
  }

  const parsed = Number.parseFloat(match[1])
  return Number.isFinite(parsed) ? Math.round(parsed) : null
}

export function parseProdigiAttributes(
  attributes: Record<string, string[]> | null | undefined
): ProdigiAttributeSpecs {
  const result: ProdigiAttributeSpecs = {
    paper_type: null,
    substrate: null,
    weight_gsm: null,
    size: null,
    other: {},
    order_options: {},
  }

  for (const [rawKey, values] of Object.entries(attributes ?? {})) {
    if (!values?.length) {
      continue
    }

    const cleanedValues = values.map((value) => value.trim()).filter(Boolean)
    if (!cleanedValues.length) {
      continue
    }

    const key = normalizeAttributeKey(rawKey)

    if (PAPER_TYPE_KEYS.has(key)) {
      result.paper_type = cleanedValues[0]
      continue
    }

    if (SUBSTRATE_KEYS.has(key)) {
      result.substrate = cleanedValues[0]
      continue
    }

    if (WEIGHT_KEYS.has(key)) {
      result.weight_gsm =
        parseWeightFromText(cleanedValues[0]) ?? result.weight_gsm
      continue
    }

    if (SIZE_KEYS.has(key)) {
      result.size =
        cleanedValues.length === 1
          ? cleanedValues[0]
          : cleanedValues.join(", ")
      continue
    }

    if (cleanedValues.length === 1) {
      result.other[humanizeAttributeKey(rawKey)] = cleanedValues[0]
      continue
    }

    result.order_options[humanizeAttributeKey(rawKey)] = cleanedValues
  }

  return result
}
