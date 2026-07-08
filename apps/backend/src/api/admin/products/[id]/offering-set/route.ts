import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { applyOfferingSetToProductWorkflow } from "../../../../../workflows/apply-offering-set-to-product"
import { removeOfferingSetFromProductWorkflow } from "../../../../../workflows/remove-offering-set-from-product"
import type {
  ApplyOfferingSetSchema,
  RemoveOfferingSetSchema,
} from "./middlewares"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "offering_sets.id", "offering_sets.name"],
    filters: { id },
  })

  const product = data[0] as {
    offering_sets?: ({ id: string; name: string } | null)[] | null
  } | undefined

  const offering_sets = (product?.offering_sets ?? []).filter(
    (entry): entry is { id: string; name: string } => !!entry
  )

  return res.json({ offering_sets })
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
      sells_digital: req.validatedBody.sells_digital,
      digital_price: req.validatedBody.digital_price,
      digital_price_currency: req.validatedBody.digital_price_currency,
    },
  })

  return res.json({
    product_id: id,
    offering_set_id: req.validatedBody.offering_set_id,
    created_variants: result.created_variants?.length ?? 0,
  })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest<RemoveOfferingSetSchema>,
  res: MedusaResponse
) {
  const { id } = req.params

  const { result } = await removeOfferingSetFromProductWorkflow(req.scope).run({
    input: {
      product_id: id,
      offering_set_id: req.validatedBody.offering_set_id,
    },
  })

  return res.json({
    product_id: id,
    offering_set_id: req.validatedBody.offering_set_id,
    removed_variants: result.variant_ids_to_remove.length,
  })
}
