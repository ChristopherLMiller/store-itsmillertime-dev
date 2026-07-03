import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  deleteOfferingSetWorkflow,
  updateOfferingSetWorkflow,
} from "../../../../workflows/manage-offering-sets"
import type { UpdateOfferingSetSchema } from "../middlewares"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  const { data } = await query.graph({
    entity: "offering_set",
    fields: [
      "id",
      "name",
      "description",
      "is_default",
      "created_at",
      "updated_at",
      "offerings.*",
    ],
    filters: { id },
  })

  if (!data.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Offering set ${id} not found`
    )
  }

  return res.json({ offering_set: data[0] })
}

export async function POST(
  req: AuthenticatedMedusaRequest<UpdateOfferingSetSchema>,
  res: MedusaResponse
) {
  const { id } = req.params

  const { result } = await updateOfferingSetWorkflow(req.scope).run({
    input: { id, ...req.validatedBody },
  })

  return res.json({ offering_set: result })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params

  await deleteOfferingSetWorkflow(req.scope).run({ input: { id } })

  return res.json({ id, object: "offering_set", deleted: true })
}
