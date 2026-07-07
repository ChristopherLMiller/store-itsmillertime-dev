import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/framework/types"
import type { LinkDefinition } from "@medusajs/framework/types"
import { PRINT_CATALOG_MODULE } from "../../modules/print-catalog"

export type RemoveOfferingSetPlan = {
  product_id: string
  offering_set_id: string
  variant_ids_to_remove: string[]
  variant_offering_links: LinkDefinition[]
  is_linked: boolean
}

export const prepareRemoveOfferingSetStep = createStep(
  "prepare-remove-offering-set",
  async (
    input: { product_id: string; offering_set_id: string },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: setData } = await query.graph({
      entity: "offering_set",
      fields: ["id", "offerings.id"],
      filters: { id: input.offering_set_id },
    })

    const set = setData[0]
    if (!set) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Offering set ${input.offering_set_id} not found`
      )
    }

    const offeringIds = new Set(
      (set.offerings ?? [])
        .map((offering) => offering?.id)
        .filter((id): id is string => !!id)
    )

    const { data: productData } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "variants.id",
        "variants.metadata",
        "variants.print_offering.id",
        "offering_sets.id",
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

    const attachedSets =
      (
        product as {
          offering_sets?: ({ id: string } | null)[] | null
        }
      ).offering_sets ?? []

    const isLinked = attachedSets.some(
      (entry) => entry?.id === input.offering_set_id
    )

    const variantsToRemove = (product.variants ?? [])
      .filter((variant): variant is NonNullable<typeof variant> => !!variant)
      .filter((variant) => {
        const metadata =
          (variant.metadata as Record<string, unknown> | null) ?? {}
        if (metadata.fulfillment_type === "digital") {
          return false
        }

        if (metadata.offering_set_id === input.offering_set_id) {
          return true
        }

        const offeringId = (
          variant as { print_offering?: { id: string } | null }
        ).print_offering?.id

        return !!offeringId && offeringIds.has(offeringId)
      })

    const variantIdsToRemove = variantsToRemove.map((variant) => variant.id)

    const variantOfferingLinks = variantsToRemove
      .map((variant) => {
        const offeringId = (
          variant as { print_offering?: { id: string } | null }
        ).print_offering?.id

        if (!offeringId) {
          return null
        }

        return {
          [Modules.PRODUCT]: { product_variant_id: variant.id },
          [PRINT_CATALOG_MODULE]: { print_offering_id: offeringId },
        } as LinkDefinition
      })
      .filter((link): link is LinkDefinition => !!link)

    const plan: RemoveOfferingSetPlan = {
      product_id: input.product_id,
      offering_set_id: input.offering_set_id,
      variant_ids_to_remove: variantIdsToRemove,
      variant_offering_links: variantOfferingLinks,
      is_linked: isLinked,
    }

    return new StepResponse(plan)
  }
)

export const removeOfferingSetVariantsStep = createStep(
  "remove-offering-set-variants",
  async (plan: RemoveOfferingSetPlan, { container }) => {
    if (!plan.variant_ids_to_remove.length) {
      return new StepResponse({ removed: 0 }, [])
    }

    const productModule = container.resolve<IProductModuleService>(
      Modules.PRODUCT
    )

    await productModule.softDeleteProductVariants(plan.variant_ids_to_remove)

    return new StepResponse(
      { removed: plan.variant_ids_to_remove.length },
      plan.variant_ids_to_remove
    )
  },
  async (variantIds, { container }) => {
    if (!variantIds?.length) {
      return
    }

    const productModule = container.resolve<IProductModuleService>(
      Modules.PRODUCT
    )

    await productModule.restoreProductVariants(variantIds)
  }
)

type DismissLinksCompensation = {
  variant_offering_links: LinkDefinition[]
  product_set_link: LinkDefinition | null
}

export const dismissOfferingSetLinksStep = createStep(
  "dismiss-offering-set-links",
  async (plan: RemoveOfferingSetPlan, { container }) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK) as {
      dismiss: (entries: LinkDefinition[]) => Promise<unknown>
      create: (entries: LinkDefinition[]) => Promise<unknown>
      list: (
        entries: LinkDefinition[],
        config?: { asLinkDefinition?: boolean }
      ) => Promise<LinkDefinition[]>
    }

    const productSetLink: LinkDefinition | null = plan.is_linked
      ? {
          [Modules.PRODUCT]: { product_id: plan.product_id },
          [PRINT_CATALOG_MODULE]: {
            offering_set_id: plan.offering_set_id,
          },
        }
      : null

    const linksToDismiss = [
      ...plan.variant_offering_links,
      ...(productSetLink ? [productSetLink] : []),
    ]

    if (!linksToDismiss.length) {
      return new StepResponse({ dismissed: 0 }, null)
    }

    const linksBeforeDismiss = await link.list(linksToDismiss, {
      asLinkDefinition: true,
    })

    await link.dismiss(linksToDismiss)

    const compensation: DismissLinksCompensation = {
      variant_offering_links: plan.variant_offering_links,
      product_set_link: productSetLink,
    }

    return new StepResponse(
      { dismissed: linksBeforeDismiss.length },
      compensation
    )
  },
  async (compensation, { container }) => {
    if (!compensation) {
      return
    }

    const link = container.resolve(ContainerRegistrationKeys.LINK) as {
      create: (entries: LinkDefinition[]) => Promise<unknown>
    }

    const toRestore = [
      ...compensation.variant_offering_links,
      ...(compensation.product_set_link ? [compensation.product_set_link] : []),
    ]

    if (toRestore.length) {
      await link.create(toRestore)
    }
  }
)
