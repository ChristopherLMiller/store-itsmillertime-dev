import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const FORMAT_OPTION_TITLE = "Format"
export const PAPER_OPTION_TITLE = "Paper"
export const DIGITAL_FORMAT_VALUE = "Digital Download"
export const DIGITAL_PAPER_VALUE = "Digital"

export type OfferingVariantPlan = {
  offering_id: string
  prodigi_sku: string
  label: string
  paper_name: string
  category: string
  width: number | null
  height: number | null
  substrate: string | null
  retail_price: number | null
  price_currency: string
}

export type VariantUpgradePlan = {
  variant_id: string
  paper_name: string
  format_label: string
}

export type OfferingSetApplicationPlan = {
  product_id: string
  offering_set_id: string
  paper_name: string
  format_option_id: string | null
  paper_option_id: string | null
  existing_format_values: string[]
  existing_paper_values: string[]
  format_values_to_ensure: string[]
  paper_values_to_ensure: string[]
  variants_to_create: OfferingVariantPlan[]
  variants_to_upgrade: VariantUpgradePlan[]
  create_digital_variant: boolean
  already_linked: boolean
}

type VariantOptionValue = {
  option?: { title?: string | null } | null
  value?: string | null
}

function getOptionValueByTitle(
  optionValues: VariantOptionValue[] | null | undefined,
  title: string
) {
  return optionValues?.find((entry) => entry?.option?.title === title)?.value
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

    const paperName = set.name
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
        "variants.options.option.title",
        "variants.options.value",
        "variants.print_offering.id",
        "offering_sets.id",
        "offering_sets.name",
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
    const paperOption = (product.options ?? []).find(
      (o) => o?.title === PAPER_OPTION_TITLE
    )

    const existingFormatValues = (formatOption?.values ?? [])
      .map((v) => v?.value)
      .filter((v): v is string => !!v)

    const existingPaperValues = (paperOption?.values ?? [])
      .map((v) => v?.value)
      .filter((v): v is string => !!v)

    const offeringIdsInSet = new Set(activeOfferings.map((o) => o.id))

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
        paper_name: paperName,
        category: o.category,
        width: o.width ?? null,
        height: o.height ?? null,
        substrate: o.substrate ?? null,
        retail_price: o.retail_price ?? null,
        price_currency: o.price_currency ?? "usd",
      }))

    const variantsToUpgrade: VariantUpgradePlan[] = variants
      .filter((variant) => {
        const offeringId = (
          variant as { print_offering?: { id: string } | null }
        ).print_offering?.id

        if (!offeringId || !offeringIdsInSet.has(offeringId)) {
          return false
        }

        const currentPaper = getOptionValueByTitle(
          variant.options as VariantOptionValue[] | undefined,
          PAPER_OPTION_TITLE
        )

        return !currentPaper
      })
      .map((variant) => {
        const offeringId = (
          variant as { print_offering?: { id: string } | null }
        ).print_offering!.id
        const offering = activeOfferings.find((entry) => entry.id === offeringId)

        return {
          variant_id: variant.id,
          paper_name: paperName,
          format_label:
            getOptionValueByTitle(
              variant.options as VariantOptionValue[] | undefined,
              FORMAT_OPTION_TITLE
            ) ?? offering?.label ?? "Print",
        }
      })

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

    const formatValuesToEnsure = [
      ...variantsToCreate.map((v) => v.label),
      ...variantsToUpgrade.map((v) => v.format_label),
      ...(createDigitalVariant ? [DIGITAL_FORMAT_VALUE] : []),
    ].filter((value, index, all) => all.indexOf(value) === index)

    const paperValuesToEnsure = [
      paperName,
      ...(createDigitalVariant ? [DIGITAL_PAPER_VALUE] : []),
    ].filter(
      (value, index, all) =>
        all.indexOf(value) === index && !existingPaperValues.includes(value)
    )

    const attachedSets =
      (
        product as {
          offering_sets?: ({ id: string; name: string } | null)[] | null
        }
      ).offering_sets ?? []

    const alreadyLinked = attachedSets.some(
      (entry) => entry?.id === input.offering_set_id
    )

    const plan: OfferingSetApplicationPlan = {
      product_id: input.product_id,
      offering_set_id: input.offering_set_id,
      paper_name: paperName,
      format_option_id: formatOption?.id ?? null,
      paper_option_id: paperOption?.id ?? null,
      existing_format_values: existingFormatValues,
      existing_paper_values: existingPaperValues,
      format_values_to_ensure: formatValuesToEnsure.filter(
        (value) => !existingFormatValues.includes(value)
      ),
      paper_values_to_ensure: paperValuesToEnsure,
      variants_to_create: variantsToCreate,
      variants_to_upgrade: variantsToUpgrade,
      create_digital_variant: createDigitalVariant,
      already_linked: alreadyLinked,
    }

    return new StepResponse(plan)
  }
)
