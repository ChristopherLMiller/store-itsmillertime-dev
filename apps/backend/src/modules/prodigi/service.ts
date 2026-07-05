import { MedusaError } from "@medusajs/framework/utils"
import { resolveProdigiConfig } from "./config"
import { parseProdigiAttributes } from "./parse-prodigi-attributes"
import { parseProdigiPrintAreas } from "./parse-prodigi-print-areas"
import {
  parseProdigiProductSpecs,
  buildSuggestedLabel,
  formatDisplaySize,
} from "./parse-product-specs"
import { resolveProdigiQuoteConfig } from "./quote-config"
import { buildSkuSuffixCandidates } from "./sku-suffixes"
import type {
  NormalizedProdigiSpecs,
  ProdigiCreateOrderInput,
  ProdigiModuleOptions,
  ProdigiProductDetailsResponse,
  ProdigiProductLookupResult,
  ProdigiQuoteInput,
  ProdigiQuoteResponse,
  ProdigiUnitCost,
} from "./types"

class ProdigiModuleService {
  private options_: ProdigiModuleOptions

  constructor() {
    this.options_ = resolveProdigiConfig()
  }

  getEnvironment(): string {
    return this.options_.environment
  }

  getBaseUrl(): string {
    return this.options_.baseUrl
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    if (!this.options_.apiKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Prodigi API key is not configured for ${this.options_.environment} environment`
      )
    }

    const url = `${this.options_.baseUrl}/v4.0${path}`

    const response = await fetch(url, {
      method,
      headers: {
        "X-API-Key": this.options_.apiKey,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "")

      if (response.status === 404) {
        const skuMatch = path.match(/^\/products\/(.+)$/)
        if (skuMatch) {
          const sku = decodeURIComponent(skuMatch[1])
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `SKU "${sku}" was not found in Prodigi's ${this.options_.environment} catalog. Use the full SKU from Prodigi (e.g. GLOBAL-PAP-8X10), not a prefix or category code.`
          )
        }
      }

      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Prodigi API error (${response.status}) for ${method} ${path}: ${errorBody}`
      )
    }

    return response.json() as Promise<T>
  }

  private async fetchProductResponse(
    sku: string
  ): Promise<ProdigiProductDetailsResponse | null> {
    if (!this.options_.apiKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Prodigi API key is not configured for ${this.options_.environment} environment`
      )
    }

    const url = `${this.options_.baseUrl}/v4.0/products/${encodeURIComponent(sku)}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": this.options_.apiKey,
        "Content-Type": "application/json",
      },
    })

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "")
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Prodigi API error (${response.status}) for GET /products/${sku}: ${errorBody}`
      )
    }

    return response.json() as Promise<ProdigiProductDetailsResponse>
  }

  async tryGetProductDetails(
    sku: string
  ): Promise<NormalizedProdigiSpecs | null> {
    const data = await this.fetchProductResponse(sku)

    if (!data || data.outcome !== "Ok" || !data.product) {
      return null
    }

    return this.normalizeProductDetails(data.product)
  }

  async getProductDetails(sku: string): Promise<NormalizedProdigiSpecs> {
    const specs = await this.tryGetProductDetails(sku)

    if (!specs) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `SKU "${sku}" was not found in Prodigi's ${this.options_.environment} catalog.`
      )
    }

    return specs
  }

  /**
   * Resolve an exact SKU or, when Prodigi returns 404, discover size variants
   * by probing common suffixes (Prodigi has no catalog search endpoint).
   */
  async lookupProduct(skuOrPrefix: string): Promise<ProdigiProductLookupResult> {
    const trimmed = skuOrPrefix.trim()
    const exact = await this.tryGetProductDetails(trimmed)

    if (exact) {
      const unit_cost = await this.getUnitCost(trimmed)

      return {
        kind: "product",
        product: exact,
        attributes: exact.raw.attributes ?? {},
        unit_cost,
      }
    }

    const suggestions = await this.discoverProductsByPrefix(trimmed)

    if (suggestions.length) {
      return {
        kind: "suggestions",
        prefix: trimmed,
        suggestions,
      }
    }

    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `No Prodigi products found for "${trimmed}". Try a product-family prefix (e.g. GLOBAL-PAP) or a full SKU (e.g. GLOBAL-PAP-8X10).`
    )
  }

  private async discoverProductsByPrefix(
    prefix: string
  ): Promise<NormalizedProdigiSpecs[]> {
    const normalizedPrefix = prefix.replace(/-+$/g, "")
    const candidates = buildSkuSuffixCandidates().map(
      (suffix) => `${normalizedPrefix}-${suffix}`
    )

    const matches = new Map<string, NormalizedProdigiSpecs>()
    const batchSize = 8

    for (let i = 0; i < candidates.length; i += batchSize) {
      const batch = candidates.slice(i, i + batchSize)
      const results = await Promise.all(
        batch.map((sku) => this.tryGetProductDetails(sku))
      )

      for (const result of results) {
        if (result) {
          matches.set(result.sku.toUpperCase(), result)
        }
      }
    }

    return [...matches.values()].sort((a, b) => {
      const widthDiff = (a.width ?? 0) - (b.width ?? 0)
      if (widthDiff !== 0) {
        return widthDiff
      }
      return (a.height ?? 0) - (b.height ?? 0)
    })
  }

  normalizeProductDetails(
    product: ProdigiProductDetailsResponse["product"]
  ): NormalizedProdigiSpecs {
    const dims = product.productDimensions
    const width = dims?.width ?? null
    const height = dims?.height ?? null
    const units = dims?.units ?? null
    const attributeSpecs = parseProdigiAttributes(product.attributes)
    const printAreaSpecs = parseProdigiPrintAreas(product.variants)
    const parsed = parseProdigiProductSpecs({
      sku: product.sku,
      description: product.description,
      width,
      height,
      units,
    })

    const paper_type = attributeSpecs.paper_type ?? parsed.paper_type
    const weight_gsm = attributeSpecs.weight_gsm ?? parsed.weight_gsm
    const substrate =
      attributeSpecs.substrate ??
      this.inferSubstrate(product.sku, product.description)
    const sizeLabel =
      attributeSpecs.size ?? formatDisplaySize(width, height, units)
    const suggested_label =
      buildSuggestedLabel({
        size_label: sizeLabel,
        paper_type,
        weight_gsm,
      }) || parsed.suggested_label

    return {
      sku: product.sku,
      description: product.description,
      width,
      height,
      units,
      substrate,
      paper_type,
      weight_gsm,
      suggested_label,
      attribute_specs: attributeSpecs,
      print_area_specs: printAreaSpecs,
      raw: product,
    }
  }

  /**
   * Best-effort substrate inference from SKU prefix and description.
   * Admin can override the label/category after fetch.
   */
  private inferSubstrate(sku: string, description: string): string | null {
    const upper = sku.toUpperCase()
    if (upper.includes("-CAN-") || upper.includes("CANVAS")) {
      return "canvas"
    }
    if (upper.includes("-MET-") || upper.includes("METAL")) {
      return "metal"
    }
    if (upper.includes("-ACR-") || upper.includes("ACRYLIC")) {
      return "acrylic"
    }
    if (upper.includes("-LUS-") || upper.includes("LUSTRE")) {
      return "lustre"
    }
    if (upper.includes("-MAT-") || upper.includes("MATTE")) {
      return "matte"
    }
    if (upper.includes("-GLO-") || upper.includes("GLOSS")) {
      return "gloss"
    }
    if (upper.includes("-FAP-") || upper.includes("FINE ART")) {
      return "fine art"
    }

    const descLower = description.toLowerCase()
    if (descLower.includes("canvas")) return "canvas"
    if (descLower.includes("metal")) return "metal"
    if (descLower.includes("lustre") || descLower.includes("luster")) {
      return "lustre"
    }
    if (descLower.includes("matte")) return "matte"
    if (descLower.includes("gloss")) return "gloss"

    return null
  }

  async getUnitCost(sku: string): Promise<ProdigiUnitCost | null> {
    const quoteConfig = resolveProdigiQuoteConfig()

    try {
      const response = (await this.createQuote({
        shippingMethod: quoteConfig.shippingMethod,
        destinationCountryCode: quoteConfig.destinationCountryCode,
        currencyCode: quoteConfig.currencyCode,
        items: [
          {
            sku,
            copies: 1,
            assets: [{ printArea: "default" }],
          },
        ],
      })) as ProdigiQuoteResponse

      const item = response.quotes?.[0]?.items?.find(
        (entry) => entry.sku.toUpperCase() === sku.toUpperCase()
      ) ?? response.quotes?.[0]?.items?.[0]

      if (!item?.unitCost?.amount) {
        return null
      }

      const amount = Number.parseFloat(item.unitCost.amount)

      if (!Number.isFinite(amount)) {
        return null
      }

      return {
        amount,
        currency: item.unitCost.currency || quoteConfig.currencyCode,
      }
    } catch {
      return null
    }
  }

  async createQuote(input: ProdigiQuoteInput) {
    return this.request("POST", "/quotes", input)
  }

  private optionalProdigiField(value?: string | null): string | undefined {
    if (value == null) {
      return undefined
    }

    const trimmed = value.trim()
    return trimmed || undefined
  }

  private normalizeCreateOrderInput(
    input: ProdigiCreateOrderInput
  ): ProdigiCreateOrderInput {
    const line2 = this.optionalProdigiField(input.recipient.address.line2)
    const stateOrCounty = this.optionalProdigiField(
      input.recipient.address.stateOrCounty
    )
    const email = this.optionalProdigiField(input.recipient.email)

    return {
      ...input,
      recipient: {
        name: input.recipient.name.trim(),
        ...(email ? { email } : {}),
        address: {
          line1: input.recipient.address.line1.trim(),
          ...(line2 ? { line2 } : {}),
          postalOrZipCode: input.recipient.address.postalOrZipCode.trim(),
          countryCode: input.recipient.address.countryCode.trim(),
          townOrCity: input.recipient.address.townOrCity.trim(),
          ...(stateOrCounty ? { stateOrCounty } : {}),
        },
      },
    }
  }

  async createOrder(input: ProdigiCreateOrderInput) {
    return this.request(
      "POST",
      "/orders",
      this.normalizeCreateOrderInput(input)
    )
  }

  async getOrder(orderId: string) {
    return this.request("GET", `/orders/${encodeURIComponent(orderId)}`)
  }

  async cancelOrder(orderId: string) {
    return this.request(
      "POST",
      `/orders/${encodeURIComponent(orderId)}/actions/cancel`
    )
  }
}

export default ProdigiModuleService
