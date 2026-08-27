import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PRINT_CATALOG_MODULE } from "../../modules/print-catalog"
import type PrintCatalogModuleService from "../../modules/print-catalog/service"
import { finishOptionsForStorage } from "../../utils/print-options"

export type CreatePrintOfferingStepInput = {
  prodigi_sku: string
  label: string
  category?: "print" | "canvas" | "metal" | "digital"
  sort_order?: number
  width?: number | null
  height?: number | null
  substrate?: string | null
  paper_type?: string | null
  weight_gsm?: number | null
  finish_options?: string[] | null
  prodigi_unit_cost?: number | null
  markup_percent?: number
  retail_price?: number | null
  price_currency?: string
  raw_prodigi_data?: Record<string, unknown> | null
  set_ids?: string[]
}

export const createPrintOfferingStep = createStep(
  "create-print-offering",
  async (input: CreatePrintOfferingStepInput, { container }) => {
    const printCatalog = container.resolve(
      PRINT_CATALOG_MODULE
    ) as PrintCatalogModuleService

    const { set_ids, finish_options, ...data } = input

    const offering = await printCatalog.createPrintOfferings({
      ...data,
      finish_options: finishOptionsForStorage(finish_options),
      ...(set_ids?.length ? { sets: set_ids } : {}),
    })

    return new StepResponse(offering, offering.id)
  },
  async (offeringId, { container }) => {
    if (!offeringId) {
      return
    }
    const printCatalog = container.resolve(
      PRINT_CATALOG_MODULE
    ) as PrintCatalogModuleService
    await printCatalog.deletePrintOfferings(offeringId)
  }
)
