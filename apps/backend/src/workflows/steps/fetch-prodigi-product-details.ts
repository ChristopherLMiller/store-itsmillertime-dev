import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PRODIGI_MODULE } from "../../modules/prodigi"
import type ProdigiModuleService from "../../modules/prodigi/service"
import type { NormalizedProdigiSpecs } from "../../modules/prodigi/types"

type FetchProdigiProductDetailsInput = {
  prodigi_sku: string
}

export const fetchProdigiProductDetailsStep = createStep(
  "fetch-prodigi-product-details",
  async (input: FetchProdigiProductDetailsInput, { container }) => {
    const prodigiService = container.resolve(PRODIGI_MODULE) as ProdigiModuleService

    const specs = await prodigiService.getProductDetails(input.prodigi_sku)

    return new StepResponse<NormalizedProdigiSpecs>(specs)
  }
)
