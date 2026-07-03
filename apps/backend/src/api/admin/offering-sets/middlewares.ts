import {
  validateAndTransformBody,
  validateAndTransformQuery,
  type MiddlewareRoute,
} from "@medusajs/framework/http"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { z } from "@medusajs/framework/zod"

export const CreateOfferingSetSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  is_default: z.boolean().optional(),
  offering_ids: z.array(z.string()).optional(),
})
export type CreateOfferingSetSchema = z.infer<typeof CreateOfferingSetSchema>

export const UpdateOfferingSetSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  is_default: z.boolean().optional(),
  offering_ids: z.array(z.string()).optional(),
})
export type UpdateOfferingSetSchema = z.infer<typeof UpdateOfferingSetSchema>

export const GetOfferingSetsSchema = createFindParams()

export const offeringSetsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/offering-sets",
    method: "GET",
    middlewares: [
      validateAndTransformQuery(GetOfferingSetsSchema, {
        defaults: [
          "id",
          "name",
          "description",
          "is_default",
          "created_at",
          "updated_at",
          "offerings.*",
        ],
        isList: true,
        defaultLimit: 100,
      }),
    ],
  },
  {
    matcher: "/admin/offering-sets",
    method: "POST",
    middlewares: [validateAndTransformBody(CreateOfferingSetSchema)],
  },
  {
    matcher: "/admin/offering-sets/:id",
    method: "POST",
    middlewares: [validateAndTransformBody(UpdateOfferingSetSchema)],
  },
]
