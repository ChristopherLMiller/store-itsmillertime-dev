export function getDefaultMarkupPercent(): number {
  const parsed = Number(process.env.PRODIGI_DEFAULT_MARKUP_PERCENT ?? "20")
  return Number.isFinite(parsed) ? parsed : 20
}

export function computeRetailPrice(
  unitCost: number,
  markupPercent: number
): number {
  return Math.round(unitCost * (1 + markupPercent / 100) * 100) / 100
}

export function normalizePriceCurrency(currency: string): string {
  return currency.trim().toLowerCase()
}

export function buildVariantPrices(
  retailPrice: number | null | undefined,
  currencyCode: string | null | undefined
) {
  if (retailPrice == null || retailPrice <= 0) {
    return undefined
  }

  return [
    {
      amount: retailPrice,
      currency_code: normalizePriceCurrency(currencyCode || "usd"),
    },
  ]
}
