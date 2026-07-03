// Common Prodigi size suffixes appended to a product-family prefix (e.g. GLOBAL-PAP).
// Prodigi has no list/search API, so prefix discovery probes these candidates.
const BASE_SUFFIXES = [
  "4X6",
  "5X5",
  "5X7",
  "6X6",
  "8X8",
  "8X10",
  "8X12",
  "10X10",
  "10X15",
  "11X14",
  "12X12",
  "12X16",
  "12X18",
  "16X16",
  "16X20",
  "16X24",
  "18X24",
  "20X20",
  "20X24",
  "20X30",
  "24X24",
  "24X36",
  "30X30",
  "30X40",
  "A6",
  "A5",
  "A4",
  "A3",
  "A2",
  "A1",
]

export function buildSkuSuffixCandidates(): string[] {
  // Prodigi treats 8X10 and 8x10 as the same SKU; probe lowercase only.
  return BASE_SUFFIXES.map((suffix) => suffix.replace(/X/g, "x"))
}
