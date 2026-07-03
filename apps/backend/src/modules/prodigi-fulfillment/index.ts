import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import ProdigiFulfillmentProviderService from "./service"

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [ProdigiFulfillmentProviderService],
})
