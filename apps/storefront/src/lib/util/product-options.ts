import { HttpTypes } from "@medusajs/types"

export const PAPER_OPTION_TITLE = "Paper"
export const FORMAT_OPTION_TITLE = "Format"

const OPTION_ORDER = [PAPER_OPTION_TITLE, FORMAT_OPTION_TITLE]

export function getSortedProductOptions(
  options: HttpTypes.StoreProductOption[] | null | undefined
) {
  return [...(options ?? [])].sort((a, b) => {
    const aIndex = OPTION_ORDER.indexOf(a.title ?? "")
    const bIndex = OPTION_ORDER.indexOf(b.title ?? "")

    if (aIndex === -1 && bIndex === -1) {
      return (a.title ?? "").localeCompare(b.title ?? "")
    }

    if (aIndex === -1) {
      return 1
    }

    if (bIndex === -1) {
      return -1
    }

    return aIndex - bIndex
  })
}

export function getVariantOptionValue(
  variant: HttpTypes.StoreProductVariant,
  optionTitle: string,
  productOptions: HttpTypes.StoreProductOption[] | null | undefined
) {
  const option = productOptions?.find((entry) => entry.title === optionTitle)
  if (!option) {
    return undefined
  }

  return variant.options?.find((entry) => entry.option_id === option.id)?.value
}

export function getFormatsForPaper(product: HttpTypes.StoreProduct) {
  const map = new Map<string, Set<string>>()

  for (const variant of product.variants ?? []) {
    const paper = getVariantOptionValue(
      variant,
      PAPER_OPTION_TITLE,
      product.options
    )
    const format = getVariantOptionValue(
      variant,
      FORMAT_OPTION_TITLE,
      product.options
    )

    if (!paper || !format) {
      continue
    }

    const formats = map.get(paper) ?? new Set<string>()
    formats.add(format)
    map.set(paper, formats)
  }

  return map
}
