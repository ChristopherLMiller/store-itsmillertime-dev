import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import type { IFulfillmentModuleService } from "@medusajs/framework/types"
import { createOrderShipmentWorkflow } from "@medusajs/medusa/core-flows"

export type ProdigiCallbackInput = {
  prodigi_order_id: string
  medusa_order_id: string | null
  stage: string
  shipments: {
    carrier_name: string | null
    tracking_number: string | null
    tracking_url: string | null
  }[]
}

type CallbackTarget = {
  found: boolean
  order_id: string | null
  fulfillment_id: string | null
  already_shipped: boolean
  shipment_items: { id: string; quantity: number }[]
}

const resolveCallbackTargetStep = createStep(
  "resolve-callback-target",
  async (input: ProdigiCallbackInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

    const notFound: CallbackTarget = {
      found: false,
      order_id: null,
      fulfillment_id: null,
      already_shipped: false,
      shipment_items: [],
    }

    if (!input.medusa_order_id) {
      logger.warn(
        `Prodigi callback for ${input.prodigi_order_id} has no merchantReference - ignoring`
      )
      return new StepResponse(notFound)
    }

    const { data } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "fulfillments.id",
        "fulfillments.canceled_at",
        "fulfillments.shipped_at",
        "fulfillments.metadata",
        "fulfillments.items.line_item_id",
        "fulfillments.items.quantity",
      ],
      filters: { id: input.medusa_order_id },
    })

    const order = data[0] as Record<string, any> | undefined
    if (!order) {
      logger.warn(
        `Prodigi callback references unknown order ${input.medusa_order_id} - ignoring`
      )
      return new StepResponse(notFound)
    }

    const fulfillment = (order.fulfillments ?? []).find(
      (f: any) =>
        f &&
        !f.canceled_at &&
        f.metadata?.prodigi_order_id === input.prodigi_order_id
    )

    if (!fulfillment) {
      logger.warn(
        `Prodigi callback: no fulfillment on order ${input.medusa_order_id} matches Prodigi order ${input.prodigi_order_id} - ignoring`
      )
      return new StepResponse(notFound)
    }

    const target: CallbackTarget = {
      found: true,
      order_id: order.id,
      fulfillment_id: fulfillment.id,
      already_shipped: !!fulfillment.shipped_at,
      shipment_items: (fulfillment.items ?? [])
        .filter((i: any) => !!i?.line_item_id)
        .map((i: any) => ({
          id: i.line_item_id,
          quantity: Number(i.quantity) || 1,
        })),
    }

    return new StepResponse(target)
  }
)

const updateFulfillmentStageStep = createStep(
  "update-fulfillment-stage",
  async (
    input: { fulfillment_id: string | null; stage: string },
    { container }
  ) => {
    if (!input.fulfillment_id) {
      return new StepResponse(null)
    }

    const fulfillmentModule = container.resolve<IFulfillmentModuleService>(
      Modules.FULFILLMENT
    )

    const existing = await fulfillmentModule.retrieveFulfillment(
      input.fulfillment_id
    )

    await fulfillmentModule.updateFulfillment(input.fulfillment_id, {
      metadata: {
        ...(existing.metadata ?? {}),
        prodigi_stage: input.stage,
      },
    })

    return new StepResponse(input.fulfillment_id)
  }
)

export const processProdigiCallbackWorkflow = createWorkflow(
  "process-prodigi-callback",
  function (input: ProdigiCallbackInput) {
    const target = resolveCallbackTargetStep(input)

    const stageUpdate = transform({ target, input }, ({ target, input }) => ({
      fulfillment_id: target.fulfillment_id,
      stage: input.stage,
    }))

    updateFulfillmentStageStep(stageUpdate)

    // Create the Medusa shipment (with tracking) exactly once, when Prodigi
    // reports tracked shipments for a not-yet-shipped fulfillment.
    const shouldCreateShipment = transform(
      { target, input },
      ({ target, input }) =>
        target.found &&
        !target.already_shipped &&
        target.shipment_items.length > 0 &&
        input.shipments.some((s) => !!s.tracking_number)
    )

    when(shouldCreateShipment, (should) => should).then(() => {
      const shipmentInput = transform(
        { target, input },
        ({ target, input }) => ({
          order_id: target.order_id as string,
          fulfillment_id: target.fulfillment_id as string,
          items: target.shipment_items,
          labels: input.shipments
            .filter((s) => !!s.tracking_number)
            .map((s) => ({
              tracking_number: s.tracking_number as string,
              tracking_url: s.tracking_url ?? "",
              label_url: "",
            })),
        })
      )

      createOrderShipmentWorkflow.runAsStep({ input: shipmentInput })
    })

    return new WorkflowResponse(target)
  }
)
