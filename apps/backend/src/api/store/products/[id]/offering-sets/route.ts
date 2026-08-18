import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type LinkedOfferingSet = {
  id: string
  name: string
  description: string | null
}

/**
 * Public paper-type copy for a published product. The default Store product
 * retrieve does not include print-catalog links, so the gallery shop tab
 * (and any other storefront) reads name + description here.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  const { data } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "status",
      "offering_sets.id",
      "offering_sets.name",
      "offering_sets.description",
    ],
    filters: { id },
  })

  const product = data[0] as
    | {
        status?: string
        offering_sets?: (LinkedOfferingSet | null)[] | null
      }
    | undefined

  if (!product || product.status !== "published") {
    return res.status(404).json({
      message: `Product with id: ${id} was not found`,
    })
  }

  const offering_sets = (product.offering_sets ?? [])
    .filter((entry): entry is LinkedOfferingSet => !!entry?.id && !!entry.name)
    .map((set) => ({
      id: set.id,
      name: set.name,
      description: set.description?.trim() ? set.description.trim() : null,
    }))

  return res.json({ offering_sets })
}
