import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { PRODIGI_MODULE } from "../../../../../modules/prodigi"
import type ProdigiModuleService from "../../../../../modules/prodigi/service"
import type { NormalizedProdigiSpecs } from "../../../../../modules/prodigi/types"

const toPublicSpecs = (specs: NormalizedProdigiSpecs) => ({
  sku: specs.sku,
  description: specs.description,
  width: specs.width,
  height: specs.height,
  units: specs.units,
  substrate: specs.substrate,
  paper_type: specs.paper_type,
  weight_gsm: specs.weight_gsm,
  suggested_label: specs.suggested_label,
  attribute_specs: specs.attribute_specs,
  print_area_specs: specs.print_area_specs,
})

// Read-only proxy used by the admin "Fetch from Prodigi" button to prefill
// the offering form with live specs.
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const prodigi = req.scope.resolve(PRODIGI_MODULE) as ProdigiModuleService
  const { sku } = req.params

  const result = await prodigi.lookupProduct(sku)

  if (result.kind === "product") {
    return res.json({
      kind: "product",
      product: toPublicSpecs(result.product),
      attributes: result.attributes,
      unit_cost: result.unit_cost,
    })
  }

  return res.json({
    kind: "suggestions",
    prefix: result.prefix,
    suggestions: result.suggestions.map(toPublicSpecs),
  })
}
