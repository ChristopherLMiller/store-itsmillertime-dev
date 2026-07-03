export type OfferingCategory = "print" | "canvas" | "metal" | "digital"

export type AdminOfferingSet = {
  id: string
  name: string
  description: string | null
  is_default: boolean
  offerings?: AdminPrintOffering[]
}

export type AdminPrintOffering = {
  id: string
  prodigi_sku: string
  label: string
  category: OfferingCategory
  width: number | null
  height: number | null
  substrate: string | null
  paper_type: string | null
  weight_gsm: number | null
  prodigi_unit_cost: number | null
  markup_percent: number | null
  retail_price: number | null
  price_currency: string | null
  active: boolean
  needs_review: boolean
  sort_order: number
  sets?: AdminOfferingSet[]
}

export type ProdigiUnitCost = {
  amount: number
  currency: string
}

export type ProdigiPrintAreaSize = {
  print_area: string
  horizontal_px: number
  vertical_px: number
  variant_label: string | null
}

export type ProdigiPrintAreaSpecs = {
  primary: ProdigiPrintAreaSize | null
  areas: ProdigiPrintAreaSize[]
}

export type ProdigiFetchedSpecs = {
  sku: string
  description: string
  width: number | null
  height: number | null
  units: string | null
  substrate: string | null
  paper_type: string | null
  weight_gsm: number | null
  suggested_label: string
  attribute_specs?: ProdigiAttributeSpecs
  print_area_specs?: ProdigiPrintAreaSpecs
}

export type ProdigiAttributeSpecs = {
  paper_type: string | null
  substrate: string | null
  weight_gsm: number | null
  size: string | null
  other: Record<string, string>
  order_options: Record<string, string[]>
}

export type UpdatePrintOfferingResponse = {
  offering: AdminPrintOffering
  variants_updated: number
}

export type ProdigiProductLookupResponse =
  | {
      kind: "product"
      product: ProdigiFetchedSpecs
      attributes: Record<string, string[]>
      unit_cost: ProdigiUnitCost | null
    }
  | {
      kind: "suggestions"
      prefix: string
      suggestions: ProdigiFetchedSpecs[]
    }
