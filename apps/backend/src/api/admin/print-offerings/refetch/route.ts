import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { refetchPrintOfferingsWorkflow } from "../../../../../workflows/refetch-print-offerings"
import type { RefetchPrintOfferingsSchema } from "../middlewares"

export async function POST(
  req: AuthenticatedMedusaRequest<RefetchPrintOfferingsSchema>,
  res: MedusaResponse
) {
  const { result } = await refetchPrintOfferingsWorkflow(req.scope).run({
    input: req.validatedBody ?? {},
  })

  return res.json(result)
}
