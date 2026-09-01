import { MedusaService } from "@medusajs/framework/utils"
import { LinkChallenge } from "./models/link-challenge"

class AccountLinkModuleService extends MedusaService({
  LinkChallenge,
}) {}

export default AccountLinkModuleService
