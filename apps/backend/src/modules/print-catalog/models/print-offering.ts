import { model } from "@medusajs/framework/utils"
import { OfferingSet } from "./offering-set"

export const PrintOffering = model.define("print_offering", {
  id: model.id().primaryKey(),
  prodigi_sku: model.text().unique(),
  label: model.text(),
  category: model.enum(["print", "canvas", "metal", "digital"]).default("print"),
  width: model.float().nullable(),
  height: model.float().nullable(),
  substrate: model.text().nullable(),
  paper_type: model.text().nullable(),
  weight_gsm: model.number().nullable(),
  prodigi_unit_cost: model.float().nullable(),
  markup_percent: model.float().default(20),
  retail_price: model.float().nullable(),
  price_currency: model.text().default("usd"),
  raw_prodigi_data: model.json().nullable(),
  active: model.boolean().default(true),
  needs_review: model.boolean().default(false),
  sort_order: model.number().default(0),
  sets: model.manyToMany(() => OfferingSet, {
    mappedBy: "offerings",
  }),
})
