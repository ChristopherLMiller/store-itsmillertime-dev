import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PRINT_CATALOG_MODULE } from "../../modules/print-catalog"
import type PrintCatalogModuleService from "../../modules/print-catalog/service"
import {
  computeRetailPrice,
  normalizePriceCurrency,
} from "../../utils/print-pricing"

export type UpdatePrintOfferingStepInput = {
  id: string
  label?: string
  category?: "print" | "canvas" | "metal" | "digital"
  sort_order?: number
  active?: boolean
  needs_review?: boolean
  width?: number | null
  height?: number | null
  substrate?: string | null
  paper_type?: string | null
  weight_gsm?: number | null
  prodigi_unit_cost?: number | null
  markup_percent?: number
  retail_price?: number | null
  price_currency?: string
  raw_prodigi_data?: Record<string, unknown> | null
  set_ids?: string[]
}

export type UpdatePrintOfferingStepResult = {
  offering: Record<string, unknown> & { id: string; active: boolean }
  previous_active: boolean
  previous_set_ids: string[]
  new_set_ids: string[]
  specs_changed: boolean
}

export const updatePrintOfferingStep = createStep(
  "update-print-offering",
  async (input: UpdatePrintOfferingStepInput, { container }) => {
    const printCatalog = container.resolve(
      PRINT_CATALOG_MODULE
    ) as PrintCatalogModuleService

    const previous = await printCatalog.retrievePrintOffering(input.id, {
      relations: ["sets"],
    })
    const previousSetIds = (previous.sets ?? []).map((s) => s.id)

    const { id, set_ids, ...data } = input

    const nextUnitCost =
      input.prodigi_unit_cost !== undefined
        ? input.prodigi_unit_cost
        : previous.prodigi_unit_cost
    const nextMarkup =
      input.markup_percent !== undefined
        ? input.markup_percent
        : previous.markup_percent
    const nextCurrency = normalizePriceCurrency(
      input.price_currency ?? previous.price_currency ?? "usd"
    )

    let nextRetailPrice =
      input.retail_price !== undefined ? input.retail_price : previous.retail_price

    const pricingInputsChanged =
      input.prodigi_unit_cost !== undefined ||
      input.markup_percent !== undefined

    if (pricingInputsChanged && input.retail_price === undefined) {
      nextRetailPrice =
        nextUnitCost != null
          ? computeRetailPrice(nextUnitCost, nextMarkup ?? 0)
          : null
    }

    const updated = await printCatalog.updatePrintOfferings({
      id,
      ...data,
      prodigi_unit_cost: nextUnitCost,
      markup_percent: nextMarkup,
      retail_price: nextRetailPrice,
      price_currency: nextCurrency,
      ...(set_ids ? { sets: set_ids } : {}),
    })

    const specsChanged =
      (input.label !== undefined && input.label !== previous.label) ||
      (input.category !== undefined && input.category !== previous.category) ||
      (input.width !== undefined && input.width !== previous.width) ||
      (input.height !== undefined && input.height !== previous.height) ||
      (input.substrate !== undefined && input.substrate !== previous.substrate) ||
      (input.paper_type !== undefined && input.paper_type !== previous.paper_type) ||
      (input.weight_gsm !== undefined && input.weight_gsm !== previous.weight_gsm) ||
      (input.prodigi_unit_cost !== undefined &&
        input.prodigi_unit_cost !== previous.prodigi_unit_cost) ||
      (input.markup_percent !== undefined &&
        input.markup_percent !== previous.markup_percent) ||
      (nextRetailPrice != null &&
        previous.retail_price != null &&
        Math.abs(nextRetailPrice - previous.retail_price) >= 0.005) ||
      (nextRetailPrice != null && previous.retail_price == null) ||
      (nextRetailPrice == null && previous.retail_price != null) ||
      (input.price_currency !== undefined &&
        nextCurrency !== normalizePriceCurrency(previous.price_currency ?? "usd"))

    const result: UpdatePrintOfferingStepResult = {
      offering: updated as UpdatePrintOfferingStepResult["offering"],
      previous_active: previous.active,
      previous_set_ids: previousSetIds,
      new_set_ids: set_ids ?? previousSetIds,
      specs_changed: specsChanged,
    }

    return new StepResponse(result, {
      id,
      label: previous.label,
      category: previous.category,
      sort_order: previous.sort_order,
      active: previous.active,
      needs_review: previous.needs_review,
      width: previous.width,
      height: previous.height,
      substrate: previous.substrate,
      paper_type: previous.paper_type,
      weight_gsm: previous.weight_gsm,
      prodigi_unit_cost: previous.prodigi_unit_cost,
      markup_percent: previous.markup_percent,
      retail_price: previous.retail_price,
      price_currency: previous.price_currency,
      sets: previousSetIds,
    })
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }
    const printCatalog = container.resolve(
      PRINT_CATALOG_MODULE
    ) as PrintCatalogModuleService
    await printCatalog.updatePrintOfferings(previous)
  }
)
