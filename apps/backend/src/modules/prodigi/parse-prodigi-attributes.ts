export type ProdigiAttributeSpecs = {
  paper_type: string | null
  substrate: string | null
  weight_gsm: number | null
  size: string | null
  /** Finish values the customer may pick at order time (C-type Gloss/Lustre/Metallic). */
  finish_options: string[]
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
  "surface",
  "material",
  "coating",
])

const FINISH_KEYS = new Set(["finish", "printfinish", "surfacefinish"])

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

const WEIGHT_TEXT_PATTERN =
  /(\d+(?:\.\d+)?)\s*(?:gsm|g\/m[²2]|g\s*m[-−]?2)/i

export function parseWeightFromText(value: string | null): number | null {
  if (!value) {
    return null
  }

  const match =
    value.match(WEIGHT_TEXT_PATTERN) ?? value.match(/^(\d+(?:\.\d+)?)$/)
  if (!match) {
    return null
  }

  const parsed = Number.parseFloat(match[1])
  return Number.isFinite(parsed) ? Math.round(parsed) : null
}

/**
 * Attributes Prodigi requires on a quote. C-type SKUs reject quotes without
 * `finish`; canvas rejects quotes without `wrap`.
 */
export function quoteAttributesFromProduct(input: {
  attributes?: Record<string, string[]> | null
  finish_options?: string[]
}): Record<string, string> | undefined {
  const result: Record<string, string> = {}

  for (const [rawKey, values] of Object.entries(input.attributes ?? {})) {
    const cleaned = uniqueTrimmed(values)
    if (!cleaned.length) {
      continue
    }

    const key = normalizeAttributeKey(rawKey)
    if (FINISH_KEYS.has(key) || cleaned.length > 1) {
      result[rawKey] = cleaned[0]
    }
  }

  if (!Object.keys(result).some((key) => FINISH_KEYS.has(normalizeAttributeKey(key)))) {
    const finish = input.finish_options?.[0]?.trim()
    if (finish) {
      result.finish = finish
    }
  }

  return Object.keys(result).length ? result : undefined
}

function uniqueTrimmed(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed || seen.has(trimmed)) {
      continue
    }
    seen.add(trimmed)
    result.push(trimmed)
  }

  return result
}

export function collectFinishOptionsFromVariants(
  variants: { attributes?: Record<string, string> | null }[] | null | undefined
): string[] {
  const values: string[] = []

  for (const variant of variants ?? []) {
    for (const [rawKey, rawValue] of Object.entries(variant.attributes ?? {})) {
      if (!FINISH_KEYS.has(normalizeAttributeKey(rawKey))) {
        continue
      }
      if (rawValue?.trim()) {
        values.push(rawValue)
      }
    }
  }

  return uniqueTrimmed(values)
}

export function parseProdigiAttributes(
  attributes: Record<string, string[]> | null | undefined
): ProdigiAttributeSpecs {
  const result: ProdigiAttributeSpecs = {
    paper_type: null,
    substrate: null,
    weight_gsm: null,
    size: null,
    finish_options: [],
    other: {},
    order_options: {},
  }

  for (const [rawKey, values] of Object.entries(attributes ?? {})) {
    if (!values?.length) {
      continue
    }

    const cleanedValues = uniqueTrimmed(values)
    if (!cleanedValues.length) {
      continue
    }

    const key = normalizeAttributeKey(rawKey)

    if (PAPER_TYPE_KEYS.has(key)) {
      result.paper_type = cleanedValues[0]
      continue
    }

    if (FINISH_KEYS.has(key)) {
      result.finish_options = cleanedValues
      if (cleanedValues.length === 1 && !result.substrate) {
        result.substrate = cleanedValues[0]
      }
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
