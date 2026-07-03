import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import PrintCatalogModule from "../modules/print-catalog"

// One OfferingSet can be subscribed to by many Products; each Product has at most one set.
export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  },
  PrintCatalogModule.linkable.offeringSet
)
