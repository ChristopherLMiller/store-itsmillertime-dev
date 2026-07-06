import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Prodigi is the only physical (print-on-demand) fulfillment provider; every
// other option (e.g. the manual "digital delivery" method) is non-physical.
// Fulfillment provider ids are composed as `${identifier}_${configId}`, so the
// Prodigi provider id is prefixed with "prodigi".
const PRODIGI_PROVIDER_PREFIX = "prodigi"

type ShippingOptionRecord = {
  id: string
  fulfillment_provider_id?: string | null
  [key: string]: unknown
}

type CartFulfillmentProfile = {
  hasPhysical: boolean
  hasDigital: boolean
}

function isProdigiOption(option: ShippingOptionRecord): boolean {
  return (option.fulfillment_provider_id ?? "")
    .toLowerCase()
    .startsWith(PRODIGI_PROVIDER_PREFIX)
}

async function classifyCart(
  req: MedusaRequest
): Promise<CartFulfillmentProfile | null> {
  const cartId =
    (req.query?.cart_id as string | undefined) ??
    ((req as unknown as { filterableFields?: { cart_id?: string } })
      .filterableFields?.cart_id as string | undefined)

  if (!cartId) {
    return null
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "cart",
    fields: ["id", "items.variant.metadata"],
    filters: { id: cartId },
  })

  const cart = data?.[0] as
    | { items?: ({ variant?: { metadata?: Record<string, unknown> | null } } | null)[] }
    | undefined

  if (!cart) {
    return null
  }

  let hasPhysical = false
  let hasDigital = false

  for (const item of cart.items ?? []) {
    if (!item) {
      continue
    }
    const metadata =
      (item.variant?.metadata as Record<string, unknown> | null) ?? {}
    if (metadata.fulfillment_type === "digital") {
      hasDigital = true
    } else {
      hasPhysical = true
    }
  }

  return { hasPhysical, hasDigital }
}

/**
 * Medusa filters shipping options by the shipping profile of a cart's products.
 * Here a single product exposes both a physical (Prodigi) variant and a digital
 * variant under one shipping profile, so Medusa cannot tell them apart and
 * surfaces both the physical and the free "digital delivery" options for every
 * cart. That let a physical order check out with $0 shipping.
 *
 * This narrows the returned options to what the cart actually needs:
 *  - any physical (Prodigi) item present -> only physical shipping options
 *  - digital-only cart -> only non-physical (digital) options
 * If filtering would remove every option it is skipped, so a misconfigured
 * store never gets locked out of checkout.
 */
async function filterShippingOptionsByCartFulfillment(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  let profile: CartFulfillmentProfile | null = null
  try {
    profile = await classifyCart(req)
  } catch {
    return next()
  }

  if (!profile || (!profile.hasPhysical && !profile.hasDigital)) {
    return next()
  }

  const originalJson = res.json.bind(res)

  res.json = ((body: unknown) => {
    try {
      const payload = body as { shipping_options?: ShippingOptionRecord[] }
      if (payload && Array.isArray(payload.shipping_options)) {
        const filtered = profile!.hasPhysical
          ? payload.shipping_options.filter(isProdigiOption)
          : payload.shipping_options.filter((option) => !isProdigiOption(option))

        if (filtered.length) {
          return originalJson({ ...payload, shipping_options: filtered })
        }
      }
    } catch {
      // Fall through and return the unfiltered payload.
    }

    return originalJson(body)
  }) as typeof res.json

  return next()
}

export const storeShippingOptionsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/shipping-options",
    method: ["GET"],
    middlewares: [filterShippingOptionsByCartFulfillment],
  },
]
