import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { listShippingOptionsForCartWorkflow } from "@medusajs/medusa/core-flows"
import { filterShippingOptionsForCart } from "../../../utils/shipping-options"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const cartId = req.query.cart_id

  if (typeof cartId !== "string" || !cartId) {
    return res.json({ shipping_options: [] })
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "items.id",
        "items.title",
        "items.product_title",
        "items.variant.id",
        "items.variant.title",
        "items.variant.sku",
        "items.variant.metadata",
      ],
      filters: { id: cartId },
    })

    const cart = carts[0]
    if (!cart) {
      return res.json({ shipping_options: [] })
    }

    const { result } = await listShippingOptionsForCartWorkflow(req.scope).run({
      input: {
        cart_id: cartId,
      },
    })

    const shipping_options = filterShippingOptionsForCart(
      result as Array<Record<string, unknown>>,
      cart as Record<string, unknown>
    )

    return res.json({ shipping_options })
  } catch (error) {
    logger.error(
      `Failed to list shipping options for cart ${cartId}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    )

    return res.json({ shipping_options: [] })
  }
}
