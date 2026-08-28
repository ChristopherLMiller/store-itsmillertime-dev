import type { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { isPrintProduct } from "../utils/store-catalog"
import { ensureDepartmentCategoriesWorkflow } from "../workflows/ensure-department-categories"
import { syncPrintProductCategoriesWorkflow } from "../workflows/sync-print-product-categories"
import type { SyncPrintProductCategoriesResult } from "../workflows/steps/sync-print-product-categories"

const PAGE_SIZE = 50

export default async function backfillPrintAlbumCategories({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const productModule = container.resolve(Modules.PRODUCT)

  await ensureDepartmentCategoriesWorkflow(container).run({
    input: {},
  })

  let offset = 0
  let scanned = 0
  let synced = 0
  let skipped = 0

  for (;;) {
    const products = await productModule.listProducts(
      {},
      {
        take: PAGE_SIZE,
        skip: offset,
        relations: ["categories"],
        order: { id: "ASC" },
      }
    )

    if (!products.length) {
      break
    }

    for (const product of products) {
      scanned += 1
      if (!isPrintProduct(product.metadata as Record<string, unknown> | null)) {
        skipped += 1
        continue
      }

      const { result } = await syncPrintProductCategoriesWorkflow(container).run({
        input: { product_id: product.id },
      })
      const syncResult = result as SyncPrintProductCategoriesResult

      if (syncResult.skipped) {
        skipped += 1
      } else {
        synced += 1
      }
    }

    offset += PAGE_SIZE
  }

  logger.info(
    `Print album category backfill: scanned ${scanned}, synced ${synced}, skipped ${skipped}`
  )
}
