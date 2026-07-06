import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { listShippingOptionsForCartWorkflow } from "@medusajs/medusa/core-flows"
import { filterShippingOptionsForCart } from "../../../utils/shipping-options"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cartId = req.query.cart_id

  if (typeof cartId !== "string" || !cartId) {
    return res.status(400).json({
      message: "cart_id query parameter is required",
    })
  }

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
    return res.status(404).json({
      message: `Cart ${cartId} was not found`,
    })
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

  res.json({ shipping_options })
}
