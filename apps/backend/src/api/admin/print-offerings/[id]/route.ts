import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { updatePrintOfferingWorkflow } from "../../../../workflows/update-print-offering"
import { deletePrintOfferingWorkflow } from "../../../../workflows/delete-print-offering"
import { propagateOfferingUpdateWorkflow } from "../../../../workflows/propagate-offering-change"
import type { UpdatePrintOfferingSchema } from "../middlewares"

const OFFERING_FIELDS = [
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
] as const

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  const { data } = await query.graph({
    entity: "print_offering",
    fields: [...OFFERING_FIELDS],
    filters: { id },
  })

  if (!data.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Print offering ${id} not found`
    )
  }

  return res.json({ offering: data[0] })
}

export async function POST(
  req: AuthenticatedMedusaRequest<UpdatePrintOfferingSchema>,
  res: MedusaResponse
) {
  const { id } = req.params

  const { result } = await updatePrintOfferingWorkflow(req.scope).run({
    input: { id, ...req.validatedBody },
  })

  let variants_updated = 0
  if (result.specs_changed && result.offering.active) {
    const { result: propagation } = await propagateOfferingUpdateWorkflow(
      req.scope
    ).run({
      input: { offering_id: id },
    })
    variants_updated = propagation.updated
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "print_offering",
    fields: [...OFFERING_FIELDS],
    filters: { id },
  })

  return res.json({
    offering: data[0],
    variants_updated,
  })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params

  const { result } = await deletePrintOfferingWorkflow(req.scope).run({
    input: { id },
  })

  return res.json({
    id,
    object: "print_offering",
    deleted: true,
    variants_removed: result.variants_removed ?? 0,
  })
}
