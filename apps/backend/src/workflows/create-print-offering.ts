import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  computeRetailPrice,
  getDefaultMarkupPercent,
  normalizePriceCurrency,
} from "../utils/print-pricing"
import { fetchProdigiProductDetailsStep } from "./steps/fetch-prodigi-product-details"
import { fetchProdigiUnitCostStep } from "./steps/fetch-prodigi-unit-cost"
import { createPrintOfferingStep } from "./steps/create-print-offering"

export type CreatePrintOfferingWorkflowInput = {
  prodigi_sku: string
  label: string
  category?: "print" | "canvas" | "metal" | "digital"
  sort_order?: number
  markup_percent?: number
  set_ids?: string[]
}

export const createPrintOfferingWorkflow = createWorkflow(
  "create-print-offering",
  function (input: CreatePrintOfferingWorkflowInput) {
    const specs = fetchProdigiProductDetailsStep({
      prodigi_sku: input.prodigi_sku,
    })

    const unitCost = fetchProdigiUnitCostStep({
      prodigi_sku: input.prodigi_sku,
    })

    const offeringData = transform({ input, specs, unitCost }, (data) => {
      const markupPercent =
        data.input.markup_percent ?? getDefaultMarkupPercent()
      const costAmount = data.unitCost?.amount ?? null
      const priceCurrency = normalizePriceCurrency(
        data.unitCost?.currency || "usd"
      )
      const retailPrice =
        costAmount != null
          ? computeRetailPrice(costAmount, markupPercent)
          : null

      return {
        prodigi_sku: data.specs.sku,
        label: data.input.label,
        category: data.input.category ?? "print",
        sort_order: data.input.sort_order ?? 0,
        width: data.specs.width,
        height: data.specs.height,
        substrate: data.specs.substrate,
        paper_type: data.specs.paper_type,
        weight_gsm: data.specs.weight_gsm,
        prodigi_unit_cost: costAmount,
        markup_percent: markupPercent,
        retail_price: retailPrice,
        price_currency: priceCurrency,
        raw_prodigi_data: data.specs.raw as unknown as Record<string, unknown>,
        set_ids: data.input.set_ids,
      }
    })

    const offering = createPrintOfferingStep(offeringData)

    return new WorkflowResponse(offering)
  }
)
