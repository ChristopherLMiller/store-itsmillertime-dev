import type { ProdigiAttributeSpecs } from "./parse-prodigi-attributes"
import type { ProdigiPrintAreaSpecs } from "./parse-prodigi-print-areas"

export type { ProdigiAttributeSpecs } from "./parse-prodigi-attributes"
export type {
  ProdigiPrintAreaSize,
  ProdigiPrintAreaSpecs,
} from "./parse-prodigi-print-areas"

export type ProdigiEnvironment = "sandbox" | "live"

export type ProdigiModuleOptions = {
  environment: ProdigiEnvironment
  apiKey: string
  baseUrl: string
}

export type ProdigiProductDimensions = {
  width: number
  height: number
  units: string
}

export type ProdigiPrintAreaDimensions = {
  horizontalResolution: number
  verticalResolution: number
}

export type ProdigiProductVariant = {
  attributes?: Record<string, string>
  shipsTo?: string[]
  printAreaSizes?: Record<string, ProdigiPrintAreaDimensions>
}

export type ProdigiProductDetails = {
  sku: string
  description: string
  productDimensions: ProdigiProductDimensions
  attributes: Record<string, string[]>
  printAreas: Record<string, { required: boolean }>
  variants: ProdigiProductVariant[]
}

export type ProdigiProductDetailsResponse = {
  outcome: string
  product: ProdigiProductDetails
}

// Normalized specs used by the print-catalog module.
export type NormalizedProdigiSpecs = {
  sku: string
  description: string
  width: number | null
  height: number | null
  units: string | null
  substrate: string | null
  paper_type: string | null
  weight_gsm: number | null
  suggested_label: string
  attribute_specs: ProdigiAttributeSpecs
  print_area_specs: ProdigiPrintAreaSpecs
  raw: ProdigiProductDetails
}

export type ProdigiProductLookupResult =
  | {
      kind: "product"
      product: NormalizedProdigiSpecs
      attributes: Record<string, string[]>
      unit_cost: ProdigiUnitCost | null
    }
  | {
      kind: "suggestions"
      prefix: string
      suggestions: NormalizedProdigiSpecs[]
    }

export type ProdigiRecipient = {
  name: string
  email?: string
  address: {
    line1: string
    line2?: string
    postalOrZipCode: string
    countryCode: string
    townOrCity: string
    stateOrCounty?: string
  }
}

export type ProdigiOrderItem = {
  sku: string
  copies: number
  sizing?: string
  attributes?: Record<string, string>
  assets: { printArea: string; url: string }[]
}

export type ProdigiCreateOrderInput = {
  shippingMethod: string
  merchantReference?: string
  idempotencyKey?: string
  callbackUrl?: string
  recipient: ProdigiRecipient
  items: ProdigiOrderItem[]
  metadata?: Record<string, unknown>
}

export type ProdigiQuoteItemCost = {
  amount: string
  currency: string
}

export type ProdigiQuoteResponse = {
  outcome: string
  quotes: {
    shipmentMethod: string
    items: {
      sku: string
      unitCost: ProdigiQuoteItemCost
    }[]
  }[]
}

export type ProdigiUnitCost = {
  amount: number
  currency: string
}

export type ProdigiQuoteInput = {
  shippingMethod: string
  destinationCountryCode: string
  currencyCode?: string
  items: {
    sku: string
    copies: number
    attributes?: Record<string, string>
    assets?: { printArea: string }[]
  }[]
}
