export function getDefaultMarkupPercent(): number {
  const parsed = Number(process.env.PRODIGI_DEFAULT_MARKUP_PERCENT ?? "20")
  return Number.isFinite(parsed) ? parsed : 20
}

/**
 * Markup applied to the Prodigi shipping cost at checkout. Prodigi bills the
 * merchant for shipping on top of the item cost, so shipping must carry the
 * same profit margin as the item price - otherwise the merchant only breaks
 * even (or loses money) on delivery. Defaults to the product markup unless a
 * dedicated shipping markup is configured.
 */
export function getShippingMarkupPercent(): number {
  const raw = process.env.PRODIGI_SHIPPING_MARKUP_PERCENT
  if (raw != null && raw.trim() !== "") {
    const parsed = Number(raw)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return getDefaultMarkupPercent()
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
