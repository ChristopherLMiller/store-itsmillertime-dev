import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createOfferingSetWorkflow } from "../../../workflows/manage-offering-sets"
import type { CreateOfferingSetSchema } from "./middlewares"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: offering_sets, metadata } = await query.graph({
    entity: "offering_set",
    ...req.queryConfig,
  })

  return res.json({
    offering_sets,
    count: metadata?.count ?? offering_sets.length,
    limit: req.queryConfig.pagination?.take,
    offset: req.queryConfig.pagination?.skip,
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest<CreateOfferingSetSchema>,
  res: MedusaResponse
) {
  const { result } = await createOfferingSetWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  return res.status(201).json({ offering_set: result })
}
