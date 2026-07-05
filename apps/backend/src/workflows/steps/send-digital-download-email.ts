import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { DIGITAL_DELIVERY_MODULE } from "../../modules/digital-delivery"
import type DigitalDeliveryModuleService from "../../modules/digital-delivery/service"
import { isResendConfigured } from "../../utils/email"
import type { DigitalFulfillmentPlan } from "./prepare-digital-fulfillment"

type SendDigitalDownloadEmailInput = {
  plan: DigitalFulfillmentPlan
  delivery_id: string
  download_url: string
  expires_at: string
}

export const sendDigitalDownloadEmailStep = createStep(
  "send-digital-download-email",
  async (input: SendDigitalDownloadEmailInput, { container }) => {
    if (!isResendConfigured()) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Resend is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL."
      )
    }

    const notificationModuleService = container.resolve(Modules.NOTIFICATION)

    await notificationModuleService.createNotifications({
      to: input.plan.email,
      channel: "email",
      template: "digital-download",
      data: {
        order_display_id: input.plan.display_id,
        download_url: input.download_url,
        expires_at: input.expires_at,
        store_name: process.env.STORE_NAME || "Store",
      },
    })

    const digitalDelivery = container.resolve(
      DIGITAL_DELIVERY_MODULE
    ) as DigitalDeliveryModuleService

    await digitalDelivery.updateDigitalDeliveries([
      {
        id: input.delivery_id,
        email_sent_at: new Date(),
      },
    ])

    return new StepResponse({ email_sent: true })
  },
  async (_data, { container }) => {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    logger.warn(
      "Digital download email compensation is a no-op; resend manually if needed."
    )
  }
)

export const markDigitalDeliveryFulfilledStep = createStep(
  "mark-digital-delivery-fulfilled",
  async (
    input: {
      delivery_id: string
      fulfillment_id: string
    },
    { container }
  ) => {
    const digitalDelivery = container.resolve(
      DIGITAL_DELIVERY_MODULE
    ) as DigitalDeliveryModuleService

    const [updated] = await digitalDelivery.updateDigitalDeliveries([
      {
        id: input.delivery_id,
        fulfillment_id: input.fulfillment_id,
      },
    ])

    if (!updated) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Failed to link digital delivery to fulfillment"
      )
    }

    return new StepResponse(updated)
  }
)
