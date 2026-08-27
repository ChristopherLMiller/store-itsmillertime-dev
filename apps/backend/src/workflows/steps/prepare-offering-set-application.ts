import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  DEFAULT_FINISH_VALUE,
  FINISH_OPTION_TITLE,
  FORMAT_OPTION_TITLE,
  PAPER_OPTION_TITLE,
  normalizeFinishOptions,
} from "../../utils/print-options"

export {
  DEFAULT_FINISH_VALUE,
  FINISH_OPTION_TITLE,
  FORMAT_OPTION_TITLE,
  PAPER_OPTION_TITLE,
}

export const DIGITAL_FORMAT_VALUE = "Digital Download"
export const DIGITAL_PAPER_VALUE = "Digital"

export type OfferingVariantPlan = {
  offering_id: string
  prodigi_sku: string
  label: string
  paper_name: string
  finish: string | null
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
  finish: string | null
}

export type OfferingSetApplicationPlan = {
  product_id: string
  offering_set_id: string
  paper_name: string
  has_finish_option: boolean
  format_option_id: string | null
  paper_option_id: string | null
  finish_option_id: string | null
  existing_format_values: string[]
  existing_paper_values: string[]
  existing_finish_values: string[]
  format_values_to_ensure: string[]
  paper_values_to_ensure: string[]
  finish_values_to_ensure: string[]
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

function getVariantFinish(
  variant: {
    metadata?: Record<string, unknown> | null
    options?: VariantOptionValue[] | null
  }
): string | null {
  const fromMeta = variant.metadata?.prodigi_finish
  if (typeof fromMeta === "string" && fromMeta.trim()) {
    return fromMeta.trim()
  }

  return (
    getOptionValueByTitle(
      variant.options as VariantOptionValue[] | undefined,
      FINISH_OPTION_TITLE
    ) ?? null
  )
}

function finishesForOffering(finishOptions: unknown): Array<string | null> {
  const options = normalizeFinishOptions(finishOptions)
  return options.length ? options : [null]
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
    const finishOption = (product.options ?? []).find(
      (o) => o?.title === FINISH_OPTION_TITLE
    )

    const existingFormatValues = (formatOption?.values ?? [])
      .map((v) => v?.value)
      .filter((v): v is string => !!v)

    const existingPaperValues = (paperOption?.values ?? [])
      .map((v) => v?.value)
      .filter((v): v is string => !!v)

    const existingFinishValues = (finishOption?.values ?? [])
      .map((v) => v?.value)
      .filter((v): v is string => !!v)

    const offeringIdsInSet = new Set(activeOfferings.map((o) => o.id))
    const setHasFinishChoice = activeOfferings.some(
      (o) => normalizeFinishOptions(o.finish_options).length > 1
    )
    const hasFinishOption = setHasFinishChoice || !!finishOption

    const variants = (product.variants ?? []).filter(
      (v): v is NonNullable<typeof v> => !!v
    )

    const existingByOffering = new Map<
      string,
      { variant: (typeof variants)[number]; finish: string | null }[]
    >()

    for (const variant of variants) {
      const offeringId = (
        variant as { print_offering?: { id: string } | null }
      ).print_offering?.id
      if (!offeringId) {
        continue
      }

      const list = existingByOffering.get(offeringId) ?? []
      list.push({ variant, finish: getVariantFinish(variant) })
      existingByOffering.set(offeringId, list)
    }

    const variantsToCreate: OfferingVariantPlan[] = []
    const variantsToUpgrade: VariantUpgradePlan[] = []
    const upgradeIds = new Set<string>()

    const queueUpgrade = (
      variant: (typeof variants)[number],
      plan: Omit<VariantUpgradePlan, "variant_id">
    ) => {
      if (upgradeIds.has(variant.id)) {
        return
      }
      upgradeIds.add(variant.id)
      variantsToUpgrade.push({ variant_id: variant.id, ...plan })
    }

    for (const offering of activeOfferings) {
      const neededFinishes = finishesForOffering(offering.finish_options)
      const existing = existingByOffering.get(offering.id) ?? []
      const usedVariantIds = new Set<string>()

      const coversFinish = (finish: string | null) =>
        existing.some((entry) => {
          if (usedVariantIds.has(entry.variant.id)) {
            return false
          }
          if (neededFinishes[0] === null && neededFinishes.length === 1) {
            return true
          }
          return entry.finish === finish
        })

      const takeLeftover = () =>
        existing.find((entry) => {
          if (usedVariantIds.has(entry.variant.id)) {
            return false
          }
          return (
            entry.finish == null || entry.finish === DEFAULT_FINISH_VALUE
          )
        })

      for (const finish of neededFinishes) {
        const alreadyCovered = coversFinish(finish)
        if (alreadyCovered) {
          const match = existing.find(
            (entry) =>
              !usedVariantIds.has(entry.variant.id) &&
              (neededFinishes[0] === null && neededFinishes.length === 1
                ? true
                : entry.finish === finish)
          )
          if (match) {
            usedVariantIds.add(match.variant.id)
          }
          continue
        }

        const leftover =
          finish != null && neededFinishes.some((value) => value != null)
            ? takeLeftover()
            : undefined

        const resolvedFinish = hasFinishOption
          ? finish ?? DEFAULT_FINISH_VALUE
          : finish

        if (leftover) {
          usedVariantIds.add(leftover.variant.id)
          queueUpgrade(leftover.variant, {
            paper_name:
              getOptionValueByTitle(
                leftover.variant.options as VariantOptionValue[] | undefined,
                PAPER_OPTION_TITLE
              ) ?? paperName,
            format_label:
              getOptionValueByTitle(
                leftover.variant.options as VariantOptionValue[] | undefined,
                FORMAT_OPTION_TITLE
              ) ?? offering.label,
            finish: resolvedFinish,
          })
          continue
        }

        variantsToCreate.push({
          offering_id: offering.id,
          prodigi_sku: offering.prodigi_sku,
          label: offering.label,
          paper_name: paperName,
          finish: resolvedFinish,
          category: offering.category,
          width: offering.width ?? null,
          height: offering.height ?? null,
          substrate: offering.substrate ?? null,
          retail_price: offering.retail_price ?? null,
          price_currency: offering.price_currency ?? "usd",
        })
      }
    }

    for (const variant of variants) {
      const offeringId = (
        variant as { print_offering?: { id: string } | null }
      ).print_offering?.id
      const isDigital =
        (variant.metadata as Record<string, unknown> | null)
          ?.fulfillment_type === "digital"

      const currentPaper = getOptionValueByTitle(
        variant.options as VariantOptionValue[] | undefined,
        PAPER_OPTION_TITLE
      )
      const currentFormat = getOptionValueByTitle(
        variant.options as VariantOptionValue[] | undefined,
        FORMAT_OPTION_TITLE
      )
      const currentFinish = getOptionValueByTitle(
        variant.options as VariantOptionValue[] | undefined,
        FINISH_OPTION_TITLE
      )

      const missingPaper =
        !!offeringId && offeringIdsInSet.has(offeringId) && !currentPaper
      const missingFinish =
        hasFinishOption && (offeringId || isDigital) && !currentFinish

      if (!missingPaper && !missingFinish) {
        continue
      }

      const offering = activeOfferings.find((entry) => entry.id === offeringId)

      queueUpgrade(variant, {
        paper_name:
          currentPaper ??
          (offeringIdsInSet.has(offeringId ?? "") ? paperName : DIGITAL_PAPER_VALUE),
        format_label:
          currentFormat ??
          offering?.label ??
          (isDigital ? DIGITAL_FORMAT_VALUE : "Print"),
        finish:
          getVariantFinish(variant) ??
          (hasFinishOption ? DEFAULT_FINISH_VALUE : null),
      })
    }

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

    const finishValuesToEnsure = hasFinishOption
      ? [
          ...variantsToCreate.map((v) => v.finish),
          ...variantsToUpgrade.map((v) => v.finish),
          ...(createDigitalVariant ? [DEFAULT_FINISH_VALUE] : []),
        ]
          .filter((value): value is string => !!value)
          .filter(
            (value, index, all) =>
              all.indexOf(value) === index &&
              !existingFinishValues.includes(value)
          )
      : []

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
      has_finish_option: hasFinishOption,
      format_option_id: formatOption?.id ?? null,
      paper_option_id: paperOption?.id ?? null,
      finish_option_id: finishOption?.id ?? null,
      existing_format_values: existingFormatValues,
      existing_paper_values: existingPaperValues,
      existing_finish_values: existingFinishValues,
      format_values_to_ensure: formatValuesToEnsure.filter(
        (value) => !existingFormatValues.includes(value)
      ),
      paper_values_to_ensure: paperValuesToEnsure,
      finish_values_to_ensure: finishValuesToEnsure,
      variants_to_create: variantsToCreate,
      variants_to_upgrade: variantsToUpgrade,
      create_digital_variant: createDigitalVariant,
      already_linked: alreadyLinked,
    }

    return new StepResponse(plan)
  }
)
