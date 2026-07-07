import type { BigNumberValue } from "@medusajs/framework/types"

export function formatEmailPrice(
  amount: BigNumberValue | null | undefined,
  currencyCode: string
): string {
  const formatter = new Intl.NumberFormat([], {
    style: "currency",
    currencyDisplay: "narrowSymbol",
    currency: currencyCode,
  })

  if (typeof amount === "number") {
    return formatter.format(amount)
  }

  if (typeof amount === "string") {
    const parsed = parseFloat(amount)
    return Number.isFinite(parsed) ? formatter.format(parsed) : amount
  }

  return amount?.toString() || ""
}
