import {
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
  ],
})
