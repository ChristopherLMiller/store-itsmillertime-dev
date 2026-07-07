import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export type LinkedVariant = {
  id: string
  product_id: string
  metadata: Record<string, unknown> | null
  options?: ({
    option?: { title?: string | null } | null
    value?: string | null
  } | null)[] | null
}

export async function findLinkedVariants(
  container: { resolve: (key: string) => unknown },
  offeringId: string
): Promise<LinkedVariant[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (config: Record<string, unknown>) => Promise<{ data: unknown[] }>
  }

  const { data: offeringData } = await query.graph({
    entity: "print_offering",
    fields: [
      "id",
      "product_variants.id",
      "product_variants.product_id",
      "product_variants.metadata",
      "product_variants.options.option.title",
      "product_variants.options.value",
    ],
    filters: { id: offeringId },
  })

  const fromOffering = (
    (offeringData[0] as { product_variants?: (LinkedVariant | null)[] | null })
      ?.product_variants ?? []
  ).filter((v): v is LinkedVariant => !!v)

  if (fromOffering.length) {
    return fromOffering
  }

  const { data: variantData } = await query.graph({
    entity: "product_variant",
    fields: ["id", "product_id", "metadata", "print_offering.id", "options.option.title", "options.value"],
    filters: {
      print_offering: { id: offeringId },
    },
  })

  return (variantData as LinkedVariant[]).filter((v) => !!v?.id)
}
