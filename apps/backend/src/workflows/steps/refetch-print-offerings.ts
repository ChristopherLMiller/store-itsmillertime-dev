import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PRINT_CATALOG_MODULE } from "../../modules/print-catalog"
import type PrintCatalogModuleService from "../../modules/print-catalog/service"
import { PRODIGI_MODULE } from "../../modules/prodigi"
import type ProdigiModuleService from "../../modules/prodigi/service"
import { updatePrintOfferingWorkflow } from "../update-print-offering"
import { propagateOfferingUpdateWorkflow } from "../propagate-offering-change"

const PAGE_SIZE = 50
const FETCH_BATCH_SIZE = 4

export type RefetchPrintOfferingsResult = {
  checked: number
  updated: number
  skipped: number
  failed: { sku: string; reason: string }[]
  variants_updated: number
}

type CatalogOffering = {
  id: string
  prodigi_sku: string
  category: string
  active: boolean
}

type FetchOutcome =
  | { offering: CatalogOffering; kind: "skip" }
  | { offering: CatalogOffering; kind: "fail"; reason: string }
  | {
      offering: CatalogOffering
      kind: "ok"
      width: number | null
      height: number | null
      substrate: string | null
      paper_type: string | null
      weight_gsm: number | null
      finish_options: string[]
      suggested_label: string
      prodigi_unit_cost: number | null
      price_currency: string | undefined
      raw_prodigi_data: Record<string, unknown>
    }

async function listAllOfferings(
  printCatalog: PrintCatalogModuleService
): Promise<CatalogOffering[]> {
  const offerings: CatalogOffering[] = []
  let offset = 0

  for (;;) {
    const page = await printCatalog.listPrintOfferings(
      {},
      { take: PAGE_SIZE, skip: offset, order: { id: "ASC" } }
    )
    if (!page.length) {
      break
    }
    offerings.push(
      ...page.map((offering) => ({
        id: offering.id,
        prodigi_sku: offering.prodigi_sku,
        category: offering.category,
        active: offering.active,
      }))
    )
    offset += PAGE_SIZE
  }

  return offerings
}

async function mapInBatches<T, R>(
  items: T[],
  batchSize: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    results.push(...(await Promise.all(batch.map(mapper))))
  }

  return results
}

export const refetchPrintOfferingsStep = createStep(
  "refetch-print-offerings",
  async (_input: Record<string, unknown>, { container }) => {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    const printCatalog = container.resolve(
      PRINT_CATALOG_MODULE
    ) as PrintCatalogModuleService
    const prodigi = container.resolve(PRODIGI_MODULE) as ProdigiModuleService

    const offerings = await listAllOfferings(printCatalog)
    logger.info(`Print offering refetch: checking ${offerings.length} SKU(s)`)

    const outcomes = await mapInBatches(
      offerings,
      FETCH_BATCH_SIZE,
      async (offering): Promise<FetchOutcome> => {
        if (offering.category === "digital" || !offering.prodigi_sku.trim()) {
          return { offering, kind: "skip" }
        }

        try {
          const lookup = await prodigi.lookupProduct(offering.prodigi_sku)
          if (lookup.kind !== "product") {
            return {
              offering,
              kind: "fail",
              reason: `"${offering.prodigi_sku}" matched a product family, not a single SKU`,
            }
          }

          return {
            offering,
            kind: "ok",
            width: lookup.product.width,
            height: lookup.product.height,
            substrate: lookup.product.substrate,
            paper_type: lookup.product.paper_type,
            weight_gsm: lookup.product.weight_gsm,
            finish_options: lookup.product.finish_options ?? [],
            suggested_label: lookup.product.suggested_label,
            prodigi_unit_cost: lookup.unit_cost?.amount ?? null,
            price_currency: lookup.unit_cost?.currency,
            raw_prodigi_data: lookup.product.raw as unknown as Record<
              string,
              unknown
            >,
          }
        } catch (error) {
          return {
            offering,
            kind: "fail",
            reason: (error as Error).message,
          }
        }
      }
    )

    const summary: RefetchPrintOfferingsResult = {
      checked: offerings.length,
      updated: 0,
      skipped: 0,
      failed: [],
      variants_updated: 0,
    }

    for (const outcome of outcomes) {
      if (outcome.kind === "skip") {
        summary.skipped += 1
        continue
      }

      if (outcome.kind === "fail") {
        summary.failed.push({
          sku: outcome.offering.prodigi_sku,
          reason: outcome.reason,
        })
        await updatePrintOfferingWorkflow(container).run({
          input: { id: outcome.offering.id, needs_review: true },
        })
        continue
      }

      const { result } = await updatePrintOfferingWorkflow(container).run({
        input: {
          id: outcome.offering.id,
          label: outcome.suggested_label || undefined,
          width: outcome.width,
          height: outcome.height,
          substrate: outcome.substrate,
          paper_type: outcome.paper_type,
          weight_gsm: outcome.weight_gsm,
          finish_options: outcome.finish_options,
          ...(outcome.prodigi_unit_cost != null
            ? {
                prodigi_unit_cost: outcome.prodigi_unit_cost,
                price_currency: outcome.price_currency,
              }
            : {}),
          raw_prodigi_data: outcome.raw_prodigi_data,
          needs_review: false,
        },
      })

      summary.updated += 1

      if (result.specs_changed && result.offering.active) {
        const { result: propagation } = await propagateOfferingUpdateWorkflow(
          container
        ).run({
          input: { offering_id: outcome.offering.id },
        })
        summary.variants_updated += propagation.updated
      }
    }

    logger.info(
      `Print offering refetch: updated ${summary.updated}, skipped ${summary.skipped}, failed ${summary.failed.length}, variants ${summary.variants_updated}`
    )

    return new StepResponse(summary)
  }
)
