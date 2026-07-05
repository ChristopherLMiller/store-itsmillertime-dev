import type { LoaderOptions } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { logEcommerceEnvironmentBanner } from "../../../utils/log-ecommerce-environment"

export default async function logEcommerceEnvironmentLoader({
  container,
}: LoaderOptions) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  logEcommerceEnvironmentBanner(logger)
}
