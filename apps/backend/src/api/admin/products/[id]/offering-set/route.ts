import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { applyOfferingSetToProductWorkflow } from "../../../../../workflows/apply-offering-set-to-product"
import type { ApplyOfferingSetSchema } from "./middlewares"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "offering_set.id", "offering_set.name"],
    filters: { id },
  })

  return res.json({
    offering_set:
      (data[0] as { offering_set?: { id: string; name: string } | null })
        ?.offering_set ?? null,
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest<ApplyOfferingSetSchema>,
  res: MedusaResponse
) {
  const { id } = req.params

  const { result } = await applyOfferingSetToProductWorkflow(req.scope).run({
    input: {
      product_id: id,
      offering_set_id: req.validatedBody.offering_set_id,
    },
  })

  return res.json({
    product_id: id,
    offering_set_id: req.validatedBody.offering_set_id,
    created_variants: result.created_variants?.length ?? 0,
  })
}
