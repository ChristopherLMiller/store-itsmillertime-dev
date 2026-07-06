import {
  validateAndTransformBody,
  type MiddlewareRoute,
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"

export const ApplyOfferingSetSchema = z.object({
  offering_set_id: z.string().min(1),
  sells_digital: z.boolean().optional(),
})
export type ApplyOfferingSetSchema = z.infer<typeof ApplyOfferingSetSchema>

export const productOfferingSetMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/products/:id/offering-set",
    method: "POST",
    middlewares: [validateAndTransformBody(ApplyOfferingSetSchema)],
  },
]
