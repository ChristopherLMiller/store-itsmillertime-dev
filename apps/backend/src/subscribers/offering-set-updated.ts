import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { OFFERING_SET_UPDATED_EVENT } from "../workflows/manage-offering-sets"
import { propagateOfferingRemovalFromSetWorkflow } from "../workflows/propagate-offering-change"
import {
  findProductIdsForSets,
  reapplySetToProducts,
} from "../utils/propagation"

type OfferingSetUpdatedEvent = {
  id: string
  added_offering_ids: string[]
  removed_offering_ids: string[]
}

export default async function offeringSetUpdatedHandler({
  event: { data },
  container,
}: SubscriberArgs<OfferingSetUpdatedEvent>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  if (!data.added_offering_ids.length && !data.removed_offering_ids.length) {
    return
  }

  const productsBySet = await findProductIdsForSets(container, [data.id])
  const productIds = productsBySet.get(data.id) ?? []

  if (!productIds.length) {
    return
  }

  // Offerings removed from this set: retire their variants, scoped to this
  // set's subscribers only (the offering may still be active in other sets).
  for (const offeringId of data.removed_offering_ids) {
    const { result } = await propagateOfferingRemovalFromSetWorkflow(
      container
    ).run({
      input: { offering_id: offeringId, product_ids: productIds },
    })
    logger.info(
      `Propagation: offering ${offeringId} removed from set ${data.id}, retired ${result.removed} variant(s)`
    )
  }

  // Offerings added to this set: create missing variants on subscribers.
  if (data.added_offering_ids.length) {
    await reapplySetToProducts(container, data.id, productIds)
  }
}

export const config: SubscriberConfig = {
  event: OFFERING_SET_UPDATED_EVENT,
}
