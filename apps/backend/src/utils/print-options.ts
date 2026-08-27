export const FORMAT_OPTION_TITLE = "Format"
export const PAPER_OPTION_TITLE = "Paper"
export const FINISH_OPTION_TITLE = "Finish"

/** Used when a product has a Finish option but this variant has no Prodigi finish. */
export const DEFAULT_FINISH_VALUE = "Standard"

export function normalizeFinishOptions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  const seen = new Set<string>()
  const options: string[] = []

  for (const entry of value) {
    const finish = String(entry).trim()
    if (!finish || seen.has(finish)) {
      continue
    }
    seen.add(finish)
    options.push(finish)
  }

  return options
}

export function finishesDiffer(
  current: unknown,
  next: unknown
): boolean {
  const left = normalizeFinishOptions(current)
  const right = normalizeFinishOptions(next)

  if (left.length !== right.length) {
    return true
  }

  return left.some((value, index) => value !== right[index])
}

export function isProdigiFinish(
  finish: string | null | undefined
): finish is string {
  return !!finish && finish !== DEFAULT_FINISH_VALUE
}

export function finishSkuSegment(finish: string): string {
  return finish.replace(/[^a-zA-Z0-9]+/g, "") || "finish"
}

export function buildPrintVariantSku(
  prodigiSku: string,
  productId: string,
  finish?: string | null
): string {
  if (isProdigiFinish(finish)) {
    return `${prodigiSku}__${finishSkuSegment(finish)}__${productId}`
  }

  return `${prodigiSku}__${productId}`
}

export function buildPrintVariantTitle(
  paperName: string,
  formatLabel: string,
  finish?: string | null
): string {
  if (isProdigiFinish(finish)) {
    return `${paperName} · ${formatLabel} · ${finish}`
  }

  return `${paperName} · ${formatLabel}`
}

export function prodigiAttributesForFinish(
  finish: string | null | undefined
): Record<string, string> | undefined {
  if (!isProdigiFinish(finish)) {
    return undefined
  }

  return { finish }
}
