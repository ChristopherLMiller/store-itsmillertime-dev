import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { createReadStream } from "fs"
import { access } from "fs/promises"
import path from "path"
import { DIGITAL_DELIVERY_MODULE } from "../../../../modules/digital-delivery"
import type DigitalDeliveryModuleService from "../../../../modules/digital-delivery/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { token } = req.params

  if (!token) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Download not found")
  }

  const digitalDelivery = req.scope.resolve(
    DIGITAL_DELIVERY_MODULE
  ) as DigitalDeliveryModuleService

  const deliveries = await digitalDelivery.listDigitalDeliveries(
    { token },
    { take: 1 }
  )

  const delivery = deliveries[0]

  if (!delivery) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Download not found")
  }

  if (delivery.expires_at && new Date(delivery.expires_at) < new Date()) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "This download link has expired"
    )
  }

  try {
    await access(delivery.zip_path)
  } catch {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Download package is no longer available"
    )
  }

  const filename = path.basename(delivery.zip_path)

  res.setHeader("Content-Type", "application/zip")
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`
  )

  createReadStream(delivery.zip_path).pipe(res)
}
