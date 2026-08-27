import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PRINT_OFFERING_UPDATED_EVENT } from "../workflows/update-print-offering"
import { propagateOfferingDeactivationWorkflow } from "../workflows/propagate-offering-change"
import {
  findProductIdsForSets,
  reapplySetToProducts,
} from "../utils/propagation"

type PrintOfferingUpdatedEvent = {
  id: string
  active: boolean
  previous_active: boolean
  previous_set_ids: string[]
  new_set_ids: string[]
  specs_changed: boolean
  finish_options_changed?: boolean
}

export default async function printOfferingUpdatedHandler({
  event: { data },
  container,
}: SubscriberArgs<PrintOfferingUpdatedEvent>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  // Deactivated: retire linked variants everywhere (soft delete).
  if (data.previous_active && !data.active) {
    const { result } = await propagateOfferingDeactivationWorkflow(
      container
    ).run({
      input: { offering_id: data.id },
    })
    logger.info(
      `Propagation: offering ${data.id} deactivated, retired ${result.removed} variant(s)`
    )
    return
  }

  // Specs/prices are propagated synchronously in the update API route so
  // variant prices are committed before the admin UI responds.

  // Newly added to sets, or finish choices changed: create missing variants
  // on subscribed products.
  const setsToReapply = data.new_set_ids.filter((id) => {
    const newlyAdded = !data.previous_set_ids.includes(id)
    return data.active && (newlyAdded || data.finish_options_changed)
  })
  if (setsToReapply.length) {
    const productsBySet = await findProductIdsForSets(container, setsToReapply)
    for (const [setId, productIds] of productsBySet) {
      await reapplySetToProducts(container, setId, productIds)
    }
  }
}

export const config: SubscriberConfig = {
  event: PRINT_OFFERING_UPDATED_EVENT,
}
