import { model } from "@medusajs/framework/utils"

export const DigitalDelivery = model.define("digital_delivery", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  token: model.text(),
  zip_path: model.text(),
  expires_at: model.dateTime(),
  email_sent_at: model.dateTime().nullable(),
  fulfillment_id: model.text().nullable(),
  metadata: model.json().nullable(),
})
