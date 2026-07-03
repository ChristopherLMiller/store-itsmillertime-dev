import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import PrintCatalogModule from "../modules/print-catalog"

// One PrintOffering can map to many ProductVariants (across products); each variant links to at most one offering.
export default defineLink(
  {
    linkable: ProductModule.linkable.productVariant,
    isList: true,
  },
  PrintCatalogModule.linkable.printOffering
)
