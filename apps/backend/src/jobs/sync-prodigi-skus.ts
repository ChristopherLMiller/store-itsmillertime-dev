import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PRINT_CATALOG_MODULE } from "../modules/print-catalog"
import type PrintCatalogModuleService from "../modules/print-catalog/service"
import { PRODIGI_MODULE } from "../modules/prodigi"
import type ProdigiModuleService from "../modules/prodigi/service"
import { updatePrintOfferingWorkflow } from "../workflows/update-print-offering"

const PAGE_SIZE = 50

// Dimensions can drift by float noise; only flag meaningful changes.
function dimensionChanged(a: number | null, b: number | null): boolean {
  if (a === null || b === null) {
    return a !== b
  }
  return Math.abs(a - b) > 0.01
}

/**
 * Nightly Prodigi SKU validity sync.
 *
 * Re-fetches every active PrintOffering from Prodigi. SKUs that 404 or whose
 * specs changed meaningfully are flagged with needs_review = true (visible on
 * the Print Catalog admin page) - never auto-deactivated or auto-updated, so a
 * human reviews before anything cascades to live products.
 */
export default async function syncProdigiSkusJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const printCatalog = container.resolve(
    PRINT_CATALOG_MODULE
  ) as PrintCatalogModuleService
  const prodigi = container.resolve(PRODIGI_MODULE) as ProdigiModuleService

  logger.info("Prodigi SKU sync: starting")

  let offset = 0
  let flagged = 0
  let checked = 0

  for (;;) {
    const offerings = await printCatalog.listPrintOfferings(
      { active: true },
      { take: PAGE_SIZE, skip: offset, order: { id: "ASC" } }
    )

    if (!offerings.length) {
      break
    }

    for (const offering of offerings) {
      checked += 1
      let needsReview = false
      let reason = ""

      try {
        const specs = await prodigi.getProductDetails(offering.prodigi_sku)

        if (
          dimensionChanged(specs.width, offering.width) ||
          dimensionChanged(specs.height, offering.height)
        ) {
          needsReview = true
          reason = `dimensions changed (${offering.width}x${offering.height} -> ${specs.width}x${specs.height})`
        }
      } catch (error) {
        needsReview = true
        reason = `fetch failed: ${(error as Error).message}`
      }

      if (needsReview && !offering.needs_review) {
        // needs_review-only update: emits no spec change, so nothing cascades.
        await updatePrintOfferingWorkflow(container).run({
          input: { id: offering.id, needs_review: true },
        })
        flagged += 1
        logger.warn(
          `Prodigi SKU sync: flagged ${offering.prodigi_sku} for review - ${reason}`
        )
      }
    }

    offset += PAGE_SIZE
  }

  logger.info(
    `Prodigi SKU sync: done, checked ${checked} offering(s), flagged ${flagged}`
  )
}

export const config = {
  name: "sync-prodigi-skus",
  schedule: "0 3 * * *",
}
