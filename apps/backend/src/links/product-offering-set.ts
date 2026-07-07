import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import PrintCatalogModule from "../modules/print-catalog"

// Many products can share a set; each product can subscribe to many sets.
export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  },
  {
    linkable: PrintCatalogModule.linkable.offeringSet,
    isList: true,
  }
)
