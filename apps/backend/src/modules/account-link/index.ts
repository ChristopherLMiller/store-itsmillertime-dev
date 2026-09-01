import { Module } from "@medusajs/framework/utils"
import AccountLinkModuleService from "./service"

export const ACCOUNT_LINK_MODULE = "accountLink"

export default Module(ACCOUNT_LINK_MODULE, {
  service: AccountLinkModuleService,
})
