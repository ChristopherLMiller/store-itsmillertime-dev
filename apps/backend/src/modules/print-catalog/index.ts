import { Module } from "@medusajs/framework/utils"
import PrintCatalogModuleService from "./service"

export const PRINT_CATALOG_MODULE = "printCatalog"

export default Module(PRINT_CATALOG_MODULE, {
  service: PrintCatalogModuleService,
})
