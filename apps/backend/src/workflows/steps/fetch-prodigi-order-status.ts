import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { PRODIGI_MODULE } from "../../modules/prodigi"
import type ProdigiModuleService from "../../modules/prodigi/service"
import {
  parseProdigiOrderStatus,
} from "../../utils/prodigi-fulfillment-status"

type FetchProdigiOrderStatusInput = {
  order_id: string
}

type ProdigiGetOrderResponse = {
  order?: Record<string, unknown>
}

export const fetchProdigiOrderStatusStep = createStep(
  "fetch-prodigi-order-status",
  async (input: FetchProdigiOrderStatusInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const prodigi = container.resolve(PRODIGI_MODULE) as ProdigiModuleService

    const { data } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "fulfillments.id",
        "fulfillments.canceled_at",
        "fulfillments.metadata",
      ],
      filters: { id: input.order_id },
    })

    const order = data[0] as Record<string, any> | undefined
    if (!order) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Order ${input.order_id} not found`
      )
    }

    const fulfillment = (order.fulfillments ?? []).find(
      (entry: any) =>
        entry && !entry.canceled_at && entry.metadata?.prodigi_order_id
    )

    const prodigiOrderId = fulfillment?.metadata?.prodigi_order_id as
      | string
      | undefined

    if (!fulfillment || !prodigiOrderId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Order has not been submitted to Prodigi yet"
      )
    }

    const response = (await prodigi.getOrder(
      prodigiOrderId
    )) as ProdigiGetOrderResponse
    const prodigiOrder = response.order

    if (!prodigiOrder) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Prodigi did not return order ${prodigiOrderId}`
      )
    }

    return new StepResponse(
      parseProdigiOrderStatus(prodigiOrder, input.order_id)
    )
  }
)
