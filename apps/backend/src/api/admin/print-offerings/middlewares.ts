import {
  validateAndTransformBody,
  validateAndTransformQuery,
  type MiddlewareRoute,
} from "@medusajs/framework/http"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { z } from "@medusajs/framework/zod"

export const CreatePrintOfferingSchema = z.object({
  prodigi_sku: z.string().min(1),
  label: z.string().min(1),
  category: z.enum(["print", "canvas", "metal", "digital"]).optional(),
  sort_order: z.number().optional(),
  markup_percent: z.number().min(0).optional(),
  set_ids: z.array(z.string()).optional(),
})
export type CreatePrintOfferingSchema = z.infer<typeof CreatePrintOfferingSchema>

export const UpdatePrintOfferingSchema = z.object({
  label: z.string().min(1).optional(),
  category: z.enum(["print", "canvas", "metal", "digital"]).optional(),
  sort_order: z.number().optional(),
  active: z.boolean().optional(),
  needs_review: z.boolean().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  substrate: z.string().nullable().optional(),
  paper_type: z.string().nullable().optional(),
  weight_gsm: z.number().nullable().optional(),
  prodigi_unit_cost: z.number().nullable().optional(),
  markup_percent: z.number().min(0).optional(),
  retail_price: z.number().nullable().optional(),
  price_currency: z.string().optional(),
  raw_prodigi_data: z.record(z.string(), z.unknown()).nullable().optional(),
  set_ids: z.array(z.string()).optional(),
})
export type UpdatePrintOfferingSchema = z.infer<typeof UpdatePrintOfferingSchema>

export const GetPrintOfferingsSchema = createFindParams()

export const printOfferingsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/print-offerings",
    method: "GET",
    middlewares: [
      validateAndTransformQuery(GetPrintOfferingsSchema, {
        defaults: [
          "id",
          "prodigi_sku",
          "label",
          "category",
          "width",
          "height",
          "substrate",
          "paper_type",
          "weight_gsm",
          "prodigi_unit_cost",
          "markup_percent",
          "retail_price",
          "price_currency",
          "active",
          "needs_review",
          "sort_order",
          "created_at",
          "updated_at",
          "sets.*",
        ],
        isList: true,
        defaultLimit: 100,
      }),
    ],
  },
  {
    matcher: "/admin/print-offerings",
    method: "POST",
    middlewares: [validateAndTransformBody(CreatePrintOfferingSchema)],
  },
  {
    matcher: "/admin/print-offerings/:id",
    method: "POST",
    middlewares: [validateAndTransformBody(UpdatePrintOfferingSchema)],
  },
]
