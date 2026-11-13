import {
  allowFields,
  authenticate,
  defineMiddlewares,
  type MiddlewareRoute,
} from "@medusajs/framework/http"
import { authentikAuthMiddlewares } from "./auth/authentik/middlewares"
import { printOfferingsMiddlewares } from "./admin/print-offerings/middlewares"
import { offeringSetsMiddlewares } from "./admin/offering-sets/middlewares"
import { productOfferingSetMiddlewares } from "./admin/products/[id]/offering-set/middlewares"

const UPLOAD_SIZE_LIMIT = "100mb"

const accountLinkMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/account-link*",
    middlewares: [authenticate("customer", ["bearer", "session"])],
  },
]

// Since Medusa 2.21, Store API routes silently drop any requested field that is
// not on the route's allowlist. These are the extra fields the storefront
// relies on (see apps/storefront/src/lib/data/*). Keep the list minimal:
// every entry here is publicly readable. No `method`, so the allowlist also
// applies to POST routes that return the same resource.
const storeAllowedFieldsMiddlewares: MiddlewareRoute[] = [
  {
    // Product listing reads category.parent_category to classify prints/games.
    matcher: "/store/products*",
    middlewares: [allowFields("categories.parent_category")],
  },
  {
    // Category tree/nav reads metadata on child categories.
    matcher: "/store/product-categories*",
    middlewares: [allowFields("category_children.metadata")],
  },
  {
    // Shipping logic reads per-variant metadata from cart items.
    matcher: "/store/carts*",
    middlewares: [allowFields("items.variant.metadata")],
  },
]

export default defineMiddlewares({
  routes: [
    {
      method: ["POST"],
      matcher: "/admin/uploads",
      bodyParser: {
        sizeLimit: UPLOAD_SIZE_LIMIT,
      },
    },
    {
      method: ["POST"],
      matcher: "/admin/uploads/presigned-urls",
      bodyParser: {
        sizeLimit: UPLOAD_SIZE_LIMIT,
      },
    },
    ...authentikAuthMiddlewares,
    ...printOfferingsMiddlewares,
    ...offeringSetsMiddlewares,
    ...productOfferingSetMiddlewares,
    ...accountLinkMiddlewares,
    ...storeAllowedFieldsMiddlewares,
  ],
})
