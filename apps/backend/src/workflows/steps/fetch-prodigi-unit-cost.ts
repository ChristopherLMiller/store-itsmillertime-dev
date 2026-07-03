import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PRODIGI_MODULE } from "../../modules/prodigi"
import type ProdigiModuleService from "../../modules/prodigi/service"
import type { ProdigiUnitCost } from "../../modules/prodigi/types"

type FetchProdigiUnitCostInput = {
  prodigi_sku: string
}

export const fetchProdigiUnitCostStep = createStep(
  "fetch-prodigi-unit-cost",
  async (input: FetchProdigiUnitCostInput, { container }) => {
    const prodigi = container.resolve(PRODIGI_MODULE) as ProdigiModuleService
    const unitCost = await prodigi.getUnitCost(input.prodigi_sku)

    return new StepResponse<ProdigiUnitCost | null>(unitCost)
  }
)
