import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const FORMAT_OPTION_TITLE = "Format"
export const DIGITAL_FORMAT_VALUE = "Digital Download"

export type OfferingVariantPlan = {
  offering_id: string
  prodigi_sku: string
  label: string
  category: string
  width: number | null
  height: number | null
  substrate: string | null
  retail_price: number | null
  price_currency: string
}

export type OfferingSetApplicationPlan = {
  product_id: string
  offering_set_id: string
  format_option_id: string | null
  existing_option_values: string[]
  values_to_ensure: string[]
  variants_to_create: OfferingVariantPlan[]
  create_digital_variant: boolean
  previous_offering_set_id: string | null
}

export const prepareOfferingSetApplicationStep = createStep(
  "prepare-offering-set-application",
  async (
    input: {
      product_id: string
      offering_set_id: string
      sells_digital?: boolean
    },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: setData } = await query.graph({
      entity: "offering_set",
      fields: ["id", "name", "offerings.*"],
      filters: { id: input.offering_set_id },
    })

    const set = setData[0]
    if (!set) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Offering set ${input.offering_set_id} not found`
      )
    }

    const activeOfferings = (set.offerings ?? [])
      .filter(
        (o): o is NonNullable<typeof o> => !!o && o.active && !o.deleted_at
      )
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

    const { data: productData } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "metadata",
        "options.*",
        "options.values.*",
        "variants.id",
        "variants.metadata",
        "variants.print_offering.id",
        "offering_set.id",
      ],
      filters: { id: input.product_id },
    })

    const product = productData[0]
    if (!product) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product ${input.product_id} not found`
      )
    }

    const formatOption = (product.options ?? []).find(
      (o) => o?.title === FORMAT_OPTION_TITLE
    )
    const existingOptionValues = (formatOption?.values ?? [])
      .map((v) => v?.value)
      .filter((v): v is string => !!v)

    const variants = (product.variants ?? []).filter(
      (v): v is NonNullable<typeof v> => !!v
    )
    const linkedOfferingIds = new Set(
      variants
        .map((v) => (v as { print_offering?: { id: string } | null }).print_offering?.id)
        .filter((id): id is string => !!id)
    )

    const variantsToCreate: OfferingVariantPlan[] = activeOfferings
      .filter((o) => !linkedOfferingIds.has(o.id))
      .map((o) => ({
        offering_id: o.id,
        prodigi_sku: o.prodigi_sku,
        label: o.label,
        category: o.category,
        width: o.width ?? null,
        height: o.height ?? null,
        substrate: o.substrate ?? null,
        retail_price: o.retail_price ?? null,
        price_currency: o.price_currency ?? "usd",
      }))

    const sellsDigital =
      typeof input.sells_digital === "boolean"
        ? input.sells_digital
        : (product.metadata as Record<string, unknown> | null)?.sells_digital ===
          true
    const hasDigitalVariant = variants.some(
      (v) =>
        (v.metadata as Record<string, unknown> | null)?.fulfillment_type ===
        "digital"
    )
    const createDigitalVariant = sellsDigital && !hasDigitalVariant

    const neededValues = [
      ...variantsToCreate.map((v) => v.label),
      ...(createDigitalVariant ? [DIGITAL_FORMAT_VALUE] : []),
    ]
    const valuesToEnsure = neededValues.filter(
      (v) => !existingOptionValues.includes(v)
    )

    const plan: OfferingSetApplicationPlan = {
      product_id: input.product_id,
      offering_set_id: input.offering_set_id,
      format_option_id: formatOption?.id ?? null,
      existing_option_values: existingOptionValues,
      values_to_ensure: valuesToEnsure,
      variants_to_create: variantsToCreate,
      create_digital_variant: createDigitalVariant,
      previous_offering_set_id:
        (product as { offering_set?: { id: string } | null }).offering_set
          ?.id ?? null,
    }

    return new StepResponse(plan)
  }
)
