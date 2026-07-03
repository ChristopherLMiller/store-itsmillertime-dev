import { Module } from "@medusajs/framework/utils"
import logProdigiConfigLoader from "./loaders/log-config"
import ProdigiModuleService from "./service"

export const PRODIGI_MODULE = "prodigi"

export default Module(PRODIGI_MODULE, {
  service: ProdigiModuleService,
  loaders: [logProdigiConfigLoader],
})
