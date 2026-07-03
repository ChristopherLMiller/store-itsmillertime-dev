import {
  AbstractFulfillmentProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import type {
  CalculatedShippingOptionPrice,
  CalculateShippingOptionPriceContext,
  CreateFulfillmentResult,
  FulfillmentOption,
} from "@medusajs/framework/types"
import ProdigiClient from "../prodigi/service"

export const PRODIGI_SHIPPING_METHODS = [
  { id: "Budget", name: "Budget Shipping" },
  { id: "Standard", name: "Standard Shipping" },
  { id: "Express", name: "Express Shipping" },
  { id: "Overnight", name: "Overnight Shipping" },
] as const

const QUOTE_CURRENCY = () => process.env.PRODIGI_QUOTE_CURRENCY || "USD"

type QuoteResponse = {
  outcome: string
  quotes: {
    shipmentMethod: string
    costSummary: {
      items: { amount: string; currency: string }
      shipping: { amount: string; currency: string }
    }
  }[]
}

/**
 * Extracts the Prodigi SKU from a variant SKU mirror ("PRODIGISKU__prod_123").
 * Returns null for non-print items (e.g. digital downloads).
 */
export function parseProdigiSku(variantSku: string | null | undefined): string | null {
  if (!variantSku || !variantSku.includes("__")) {
    return null
  }
  return variantSku.split("__")[0] || null
}

class ProdigiFulfillmentProviderService extends AbstractFulfillmentProviderService {
  static identifier = "prodigi"

  private client_: ProdigiClient

  constructor() {
    super()
    // The Prodigi client is stateless (env-configured HTTP), safe to own here.
    this.client_ = new ProdigiClient()
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return PRODIGI_SHIPPING_METHODS.map((method) => ({
      id: method.id,
      name: method.name,
    }))
  }

  async validateOption(_data: Record<string, unknown>): Promise<boolean> {
    return true
  }

  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    _context: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return { ...optionData, ...data }
  }

  async canCalculate(): Promise<boolean> {
    return true
  }

  async calculatePrice(
    optionData: Record<string, unknown>,
    _data: Record<string, unknown>,
    context: CalculateShippingOptionPriceContext
  ): Promise<CalculatedShippingOptionPrice> {
    const shippingMethod = (optionData.id as string) || "Standard"
    const countryCode =
      context.shipping_address?.country_code?.toUpperCase() ?? "US"

    const items = (context.items ?? [])
      .map((item) => ({
        sku: parseProdigiSku(
          (item as { variant_sku?: string | null }).variant_sku
        ),
        copies: Number(item.quantity) || 1,
      }))
      .filter((item): item is { sku: string; copies: number } => !!item.sku)
      .map((item) => ({
        sku: item.sku,
        copies: item.copies,
        assets: [{ printArea: "default" }],
      }))

    // No physical print items (e.g. all-digital cart): shipping is free.
    if (!items.length) {
      return {
        calculated_amount: 0,
        is_calculated_price_tax_inclusive: false,
      }
    }

    const response = (await this.client_.createQuote({
      shippingMethod,
      destinationCountryCode: countryCode,
      currencyCode: QUOTE_CURRENCY(),
      items,
    })) as QuoteResponse

    const quote = response.quotes?.[0]
    if (!quote) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Prodigi returned no quote for ${shippingMethod} to ${countryCode}`
      )
    }

    return {
      calculated_amount: parseFloat(quote.costSummary.shipping.amount),
      is_calculated_price_tax_inclusive: false,
    }
  }

  /**
   * Passthrough: the actual Prodigi order submission happens in
   * submitOrderToProdigiWorkflow (manual admin action), which stores the
   * Prodigi order id in the fulfillment's data/metadata afterwards.
   */
  async createFulfillment(
    data: Record<string, unknown>,
    _items: Record<string, unknown>[],
    _order: Record<string, unknown> | undefined,
    _fulfillment: Record<string, unknown>
  ): Promise<CreateFulfillmentResult> {
    return {
      data: { ...data },
      labels: [],
    }
  }

  async cancelFulfillment(data: Record<string, unknown>): Promise<void> {
    const prodigiOrderId = data?.prodigi_order_id as string | undefined
    if (!prodigiOrderId) {
      return
    }

    // Best-effort cancellation; Prodigi rejects cancels once in production.
    try {
      await this.client_.cancelOrder(prodigiOrderId)
    } catch {
      // Surfaced via Prodigi dashboard; do not block Medusa-side cancellation.
    }
  }
}

export default ProdigiFulfillmentProviderService
