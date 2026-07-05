import { MedusaService } from "@medusajs/framework/utils"
import { DigitalDelivery } from "./models/digital-delivery"

class DigitalDeliveryModuleService extends MedusaService({
  DigitalDelivery,
}) {}

export default DigitalDeliveryModuleService
