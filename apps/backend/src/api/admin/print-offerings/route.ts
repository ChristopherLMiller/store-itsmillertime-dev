import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createPrintOfferingWorkflow } from "../../../workflows/create-print-offering"
import type { CreatePrintOfferingSchema } from "./middlewares"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: offerings, metadata } = await query.graph({
    entity: "print_offering",
    ...req.queryConfig,
  })

  return res.json({
    offerings,
    count: metadata?.count ?? offerings.length,
    limit: req.queryConfig.pagination?.take,
    offset: req.queryConfig.pagination?.skip,
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest<CreatePrintOfferingSchema>,
  res: MedusaResponse
) {
  const { result } = await createPrintOfferingWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  return res.status(201).json({ offering: result })
}
