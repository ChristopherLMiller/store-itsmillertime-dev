import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { resolveDigitalDownloadFiles } from "../../utils/digital-files"

export type DigitalLineItemPlan = {
  order_item_id: string
  quantity: number
  product_id: string
  product_title: string
  files: ReturnType<typeof resolveDigitalDownloadFiles>
}

export type DigitalFulfillmentPlan = {
  order_id: string
  display_id: number
  email: string
  line_items: DigitalLineItemPlan[]
  archive_files: ReturnType<typeof resolveDigitalDownloadFiles>
}

export type FulfillDigitalOrderInput = {
  order_id: string
  force?: boolean
}

export const prepareDigitalFulfillmentStep = createStep(
  "prepare-digital-fulfillment",
  async (input: FulfillDigitalOrderInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "payment_collections.status",
        "items.id",
        "items.quantity",
        "items.variant.metadata",
        "items.variant.product.id",
        "items.variant.product.title",
        "items.variant.product.metadata",
        "items.variant.product.thumbnail",
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

    const paymentCaptured = (order.payment_collections ?? []).some(
      (pc: { status?: string } | null) => pc?.status === "completed"
    )

    if (!paymentCaptured) {
      return new StepResponse(null)
    }

    const alreadyDelivered = (order.fulfillments ?? []).some(
      (fulfillment: {
        canceled_at?: string | null
        metadata?: Record<string, unknown> | null
      } | null) =>
        fulfillment &&
        !fulfillment.canceled_at &&
        fulfillment.metadata?.digital_delivery_id
    )

    if (alreadyDelivered && !input.force) {
      return new StepResponse(null)
    }

    if (!order.email) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Order ${input.order_id} is missing a customer email`
      )
    }

    const lineItems: DigitalLineItemPlan[] = []
    const problems: string[] = []
    const archiveFileMap = new Map<string, DigitalLineItemPlan["files"][number]>()

    for (const item of order.items ?? []) {
      if (!item) {
        continue
      }

      const variantMeta =
        (item.variant?.metadata as Record<string, unknown> | null) ?? {}

      if (variantMeta.fulfillment_type !== "digital") {
        continue
      }

      const product = item.variant?.product
      const productMeta =
        (product?.metadata as Record<string, unknown> | null) ?? {}
      const files = resolveDigitalDownloadFiles({
        productTitle: product?.title ?? "download",
        productMetadata: productMeta,
        thumbnail: product?.thumbnail ?? null,
      })

      if (!files.length) {
        problems.push(
          `Product ${product?.id ?? "unknown"} has no digital download files configured`
        )
        continue
      }

      for (const file of files) {
        archiveFileMap.set(`${file.url}::${file.archiveName}`, file)
      }

      lineItems.push({
        order_item_id: item.id,
        quantity: Number(item.quantity) || 1,
        product_id: product?.id ?? "",
        product_title: product?.title ?? "Download",
        files,
      })
    }

    if (!lineItems.length) {
      return new StepResponse(null)
    }

    if (problems.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Cannot fulfill digital order:\n- ${problems.join("\n- ")}`
      )
    }

    const plan: DigitalFulfillmentPlan = {
      order_id: order.id,
      display_id: order.display_id,
      email: order.email,
      line_items: lineItems,
      archive_files: [...archiveFileMap.values()],
    }

    return new StepResponse(plan)
  }
)
