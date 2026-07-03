import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { applyOfferingSetToProductWorkflow } from "../workflows/apply-offering-set-to-product"

export const PROPAGATION_CHUNK_SIZE = 50

export async function findProductIdsForSets(
  container: MedusaContainer,
  setIds: string[]
): Promise<Map<string, string[]>> {
  if (!setIds.length) {
    return new Map()
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "offering_set",
    fields: ["id", "products.id"],
    filters: { id: setIds },
  })

  const result = new Map<string, string[]>()
  for (const set of data as {
    id: string
    products?: ({ id: string } | null)[] | null
  }[]) {
    result.set(
      set.id,
      (set.products ?? [])
        .filter((p): p is { id: string } => !!p)
        .map((p) => p.id)
    )
  }
  return result
}

/**
 * Re-applies a set to each subscribed product in chunks. Apply is idempotent:
 * it only creates variants for offerings the product doesn't already have.
 */
export async function reapplySetToProducts(
  container: MedusaContainer,
  setId: string,
  productIds: string[]
): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  for (let i = 0; i < productIds.length; i += PROPAGATION_CHUNK_SIZE) {
    const batch = productIds.slice(i, i + PROPAGATION_CHUNK_SIZE)

    for (const productId of batch) {
      try {
        await applyOfferingSetToProductWorkflow(container).run({
          input: { product_id: productId, offering_set_id: setId },
        })
      } catch (error) {
        logger.error(
          `Propagation: failed to apply set ${setId} to product ${productId}: ${
            (error as Error).message
          }`
        )
      }
    }

    logger.info(
      `Propagation: applied set ${setId} to ${Math.min(
        i + PROPAGATION_CHUNK_SIZE,
        productIds.length
      )}/${productIds.length} products`
    )
  }
}
