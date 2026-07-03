import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { PRINT_CATALOG_MODULE } from "../modules/print-catalog"
import type PrintCatalogModuleService from "../modules/print-catalog/service"

export const OFFERING_SET_UPDATED_EVENT = "offering_set.updated"

type CreateOfferingSetInput = {
  name: string
  description?: string | null
  is_default?: boolean
  offering_ids?: string[]
}

const createOfferingSetStep = createStep(
  "create-offering-set",
  async (input: CreateOfferingSetInput, { container }) => {
    const printCatalog = container.resolve(
      PRINT_CATALOG_MODULE
    ) as PrintCatalogModuleService

    const { offering_ids, ...data } = input

    const set = await printCatalog.createOfferingSets({
      ...data,
      ...(offering_ids?.length ? { offerings: offering_ids } : {}),
    })

    return new StepResponse(set, set.id)
  },
  async (setId, { container }) => {
    if (!setId) {
      return
    }
    const printCatalog = container.resolve(
      PRINT_CATALOG_MODULE
    ) as PrintCatalogModuleService
    await printCatalog.deleteOfferingSets(setId)
  }
)

export const createOfferingSetWorkflow = createWorkflow(
  "create-offering-set",
  function (input: CreateOfferingSetInput) {
    const set = createOfferingSetStep(input)
    return new WorkflowResponse(set)
  }
)

type UpdateOfferingSetInput = {
  id: string
  name?: string
  description?: string | null
  is_default?: boolean
  offering_ids?: string[]
}

type UpdateOfferingSetResult = {
  set: Record<string, unknown> & { id: string }
  added_offering_ids: string[]
  removed_offering_ids: string[]
}

const updateOfferingSetStep = createStep(
  "update-offering-set",
  async (input: UpdateOfferingSetInput, { container }) => {
    const printCatalog = container.resolve(
      PRINT_CATALOG_MODULE
    ) as PrintCatalogModuleService

    const previous = await printCatalog.retrieveOfferingSet(input.id, {
      relations: ["offerings"],
    })
    const previousOfferingIds = (previous.offerings ?? []).map((o) => o.id)

    const { id, offering_ids, ...data } = input

    const set = await printCatalog.updateOfferingSets({
      id,
      ...data,
      ...(offering_ids ? { offerings: offering_ids } : {}),
    })

    const newIds = offering_ids ?? previousOfferingIds
    const result: UpdateOfferingSetResult = {
      set: set as UpdateOfferingSetResult["set"],
      added_offering_ids: newIds.filter(
        (oid) => !previousOfferingIds.includes(oid)
      ),
      removed_offering_ids: previousOfferingIds.filter(
        (oid) => !newIds.includes(oid)
      ),
    }

    return new StepResponse(result, {
      id,
      name: previous.name,
      description: previous.description,
      is_default: previous.is_default,
      offerings: previousOfferingIds,
    })
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }
    const printCatalog = container.resolve(
      PRINT_CATALOG_MODULE
    ) as PrintCatalogModuleService
    await printCatalog.updateOfferingSets(previous)
  }
)

export const updateOfferingSetWorkflow = createWorkflow(
  "update-offering-set",
  function (input: UpdateOfferingSetInput) {
    const result = updateOfferingSetStep(input)

    const eventData = transform({ result }, ({ result }) => ({
      id: result.set.id,
      added_offering_ids: result.added_offering_ids,
      removed_offering_ids: result.removed_offering_ids,
    }))

    emitEventStep({
      eventName: OFFERING_SET_UPDATED_EVENT,
      data: eventData,
    })

    return new WorkflowResponse(result)
  }
)

const deleteOfferingSetStep = createStep(
  "delete-offering-set",
  async (input: { id: string }, { container }) => {
    const printCatalog = container.resolve(
      PRINT_CATALOG_MODULE
    ) as PrintCatalogModuleService

    await printCatalog.softDeleteOfferingSets(input.id)

    return new StepResponse(input.id, input.id)
  },
  async (setId, { container }) => {
    if (!setId) {
      return
    }
    const printCatalog = container.resolve(
      PRINT_CATALOG_MODULE
    ) as PrintCatalogModuleService
    await printCatalog.restoreOfferingSets(setId)
  }
)

export const deleteOfferingSetWorkflow = createWorkflow(
  "delete-offering-set",
  function (input: { id: string }) {
    const id = deleteOfferingSetStep(input)
    return new WorkflowResponse(id)
  }
)
