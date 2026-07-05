import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createOrderFulfillmentWorkflow } from "@medusajs/medusa/core-flows"
import { prepareDigitalFulfillmentStep } from "./steps/prepare-digital-fulfillment"
import { createDigitalDeliveryPackageStep } from "./steps/create-digital-delivery-package"
import {
  markDigitalDeliveryFulfilledStep,
  sendDigitalDownloadEmailStep,
} from "./steps/send-digital-download-email"

export type FulfillDigitalOrderInput = {
  order_id: string
  force?: boolean
}

export const fulfillDigitalOrderWorkflow = createWorkflow(
  "fulfill-digital-order",
  function (input: FulfillDigitalOrderInput) {
    const plan = prepareDigitalFulfillmentStep(input)

    when({ plan }, ({ plan }) => !!plan).then(() => {
      const activePlan = transform({ plan }, ({ plan }) => plan!)

      const deliveryPackage = createDigitalDeliveryPackageStep(activePlan)

      const fulfillmentInput = transform({ activePlan }, ({ activePlan }) => ({
        order_id: activePlan.order_id,
        items: activePlan.line_items.map((item) => ({
          id: item.order_item_id,
          quantity: item.quantity,
        })),
        metadata: {
          fulfillment_type: "digital",
        },
      }))

      const fulfillment = createOrderFulfillmentWorkflow.runAsStep({
        input: fulfillmentInput,
      })

      const deliveryLinkInput = transform(
        { deliveryPackage, fulfillment },
        ({ deliveryPackage, fulfillment }) => ({
          delivery_id: deliveryPackage.delivery_id,
          fulfillment_id:
            (fulfillment as { id?: string }).id ??
            (fulfillment as { fulfillment?: { id?: string } }).fulfillment?.id ??
            "",
        })
      )

      markDigitalDeliveryFulfilledStep(deliveryLinkInput)

      const emailInput = transform(
        { activePlan, deliveryPackage },
        ({ activePlan, deliveryPackage }) => ({
          plan: activePlan,
          delivery_id: deliveryPackage.delivery_id,
          download_url: deliveryPackage.download_url,
          expires_at: deliveryPackage.expires_at,
        })
      )

      sendDigitalDownloadEmailStep(emailInput)
    })

    return new WorkflowResponse({ plan })
  }
)
