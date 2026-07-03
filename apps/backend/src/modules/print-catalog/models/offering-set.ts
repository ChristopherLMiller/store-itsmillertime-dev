import { model } from "@medusajs/framework/utils"
import { PrintOffering } from "./print-offering"

export const OfferingSet = model.define("offering_set", {
  id: model.id().primaryKey(),
  name: model.text(),
  description: model.text().nullable(),
  is_default: model.boolean().default(false),
  offerings: model.manyToMany(() => PrintOffering, {
    mappedBy: "sets",
    pivotTable: "offering_set_item",
  }),
})
