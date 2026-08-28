import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { syncPrintProductCategoriesWorkflow } from "../workflows/sync-print-product-categories"
import type { SyncPrintProductCategoriesResult } from "../workflows/steps/sync-print-product-categories"

/**
 * When a gallery print is created or updated, mirror public album membership
 * into Medusa categories under Prints. CMS already writes `metadata.albums`;
 * this is the durable assignment path so new listings browse by album without
 * the Store panel needing category IDs.
 */
export default async function assignPrintProductCategoriesHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  if (!data?.id) {
    return
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const { result } = await syncPrintProductCategoriesWorkflow(container).run({
      input: { product_id: data.id },
    })
    const syncResult = result as SyncPrintProductCategoriesResult

    if (!syncResult.skipped) {
      logger.info(
        `Assigned print ${data.id} to album categories: ${syncResult.category_ids.join(", ") || "(none)"}`
      )
    }
  } catch (error) {
    logger.error(
      `Failed to assign album categories for product ${data.id}: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
}
