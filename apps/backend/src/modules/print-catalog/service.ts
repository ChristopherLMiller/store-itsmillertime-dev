import { MedusaService } from "@medusajs/framework/utils"
import { PrintOffering } from "./models/print-offering"
import { OfferingSet } from "./models/offering-set"

class PrintCatalogModuleService extends MedusaService({
  PrintOffering,
  OfferingSet,
}) {}

export default PrintCatalogModuleService
