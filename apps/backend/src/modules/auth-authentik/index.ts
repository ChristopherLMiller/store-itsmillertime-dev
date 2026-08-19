import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import AuthentikAuthProviderService from "./service"

export default ModuleProvider(Modules.AUTH, {
  services: [AuthentikAuthProviderService],
})
