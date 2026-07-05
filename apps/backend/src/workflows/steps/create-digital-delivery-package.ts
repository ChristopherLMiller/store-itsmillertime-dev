import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { randomBytes } from "crypto"
import path from "path"
import { DIGITAL_DELIVERY_MODULE } from "../../modules/digital-delivery"
import type DigitalDeliveryModuleService from "../../modules/digital-delivery/service"
import {
  buildDigitalDownloadUrl,
  createZipFromUrls,
  getDigitalDeliveryStorageDir,
  getDigitalDownloadExpiryDays,
} from "../../utils/digital-delivery"
import type { DigitalFulfillmentPlan } from "./prepare-digital-fulfillment"

export const createDigitalDeliveryPackageStep = createStep(
  "create-digital-delivery-package",
  async (plan: DigitalFulfillmentPlan, { container }) => {
    const digitalDelivery = container.resolve(
      DIGITAL_DELIVERY_MODULE
    ) as DigitalDeliveryModuleService

    const token = randomBytes(24).toString("hex")
    const expiresAt = new Date(
      Date.now() + getDigitalDownloadExpiryDays() * 24 * 60 * 60 * 1000
    )
    const zipPath = path.join(
      getDigitalDeliveryStorageDir(),
      `${plan.order_id}-${token}.zip`
    )

    await createZipFromUrls(plan.archive_files, zipPath)

    const [delivery] = await digitalDelivery.createDigitalDeliveries([
      {
        order_id: plan.order_id,
        token,
        zip_path: zipPath,
        expires_at: expiresAt,
        metadata: {
          line_item_ids: plan.line_items.map((item) => item.order_item_id),
          file_count: plan.archive_files.length,
        },
      },
    ])

    if (!delivery) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Failed to create digital delivery record"
      )
    }

    return new StepResponse(
      {
        delivery_id: delivery.id,
        token,
        zip_path: zipPath,
        expires_at: expiresAt.toISOString(),
        download_url: buildDigitalDownloadUrl(token),
      },
      {
        delivery_id: delivery.id,
        zip_path: zipPath,
      }
    )
  },
  async (compensation, { container }) => {
    if (!compensation?.delivery_id) {
      return
    }

    const digitalDelivery = container.resolve(
      DIGITAL_DELIVERY_MODULE
    ) as DigitalDeliveryModuleService

    await digitalDelivery.deleteDigitalDeliveries([compensation.delivery_id])

    if (compensation.zip_path) {
      const { unlink } = await import("fs/promises")
      await unlink(compensation.zip_path).catch(() => undefined)
    }
  }
)
