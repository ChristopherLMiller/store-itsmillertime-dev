import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/framework/types"
import type { LinkDefinition } from "@medusajs/framework/types"
import { PRINT_CATALOG_MODULE } from "../modules/print-catalog"
import type PrintCatalogModuleService from "../modules/print-catalog/service"
import { findLinkedVariants } from "../utils/linked-variants"

const CHUNK_SIZE = 50

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

const cleanupOfferingBeforeDeleteStep = createStep(
  "cleanup-offering-before-delete",
  async (input: { id: string }, { container }) => {
    const variants = await findLinkedVariants(container, input.id)

    if (!variants.length) {
      return new StepResponse({ variants_removed: 0 }, null)
    }

    const productModule = container.resolve<IProductModuleService>(
      Modules.PRODUCT
    )
    const link = container.resolve(ContainerRegistrationKeys.LINK) as {
      dismiss: (entries: LinkDefinition[]) => Promise<unknown>
      list: (
        entries: LinkDefinition[],
        config?: { asLinkDefinition?: boolean }
      ) => Promise<LinkDefinition[]>
      create: (entries: LinkDefinition[]) => Promise<unknown>
    }

    const variantIds = variants.map((v) => v.id)
    const linkEntries = variants.map(
      (variant) =>
        ({
          [Modules.PRODUCT]: { product_variant_id: variant.id },
          [PRINT_CATALOG_MODULE]: { print_offering_id: input.id },
        }) as LinkDefinition
    )

    const linksBeforeDismiss = await link.list(linkEntries, {
      asLinkDefinition: true,
    })

    for (const batch of chunk(variantIds, CHUNK_SIZE)) {
      await productModule.softDeleteProductVariants(batch)
    }

    await link.dismiss(linkEntries)

    return new StepResponse(
      { variants_removed: variants.length },
      { variantIds, linksBeforeDismiss }
    )
  },
  async (previous, { container }) => {
    if (!previous?.variantIds?.length) {
      return
    }

    const productModule = container.resolve<IProductModuleService>(
      Modules.PRODUCT
    )
    const link = container.resolve(ContainerRegistrationKeys.LINK) as {
      create: (entries: LinkDefinition[]) => Promise<unknown>
    }

    await productModule.restoreProductVariants(previous.variantIds)

    if (previous.linksBeforeDismiss?.length) {
      await link.create(previous.linksBeforeDismiss)
    }
  }
)

const deletePrintOfferingStep = createStep(
  "delete-print-offering",
  async (input: { id: string }, { container }) => {
    const printCatalog = container.resolve(
      PRINT_CATALOG_MODULE
    ) as PrintCatalogModuleService

    const existing = await printCatalog.retrievePrintOffering(input.id).catch(
      () => null
    )

    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Print offering ${input.id} not found`
      )
    }

    await printCatalog.softDeletePrintOfferings(input.id)

    return new StepResponse(input.id, input.id)
  },
  async (offeringId, { container }) => {
    if (!offeringId) {
      return
    }
    const printCatalog = container.resolve(
      PRINT_CATALOG_MODULE
    ) as PrintCatalogModuleService
    await printCatalog.restorePrintOfferings(offeringId)
  }
)

export const deletePrintOfferingWorkflow = createWorkflow(
  "delete-print-offering",
  function (input: { id: string }) {
    const cleanup = cleanupOfferingBeforeDeleteStep(input)
    const id = deletePrintOfferingStep(input)
    return new WorkflowResponse({ id, variants_removed: cleanup.variants_removed })
  }
)
