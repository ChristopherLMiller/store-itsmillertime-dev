import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { createOrderFulfillmentWorkflow } from "@medusajs/medusa/core-flows"
import { PRODIGI_MODULE } from "../modules/prodigi"
import type ProdigiModuleService from "../modules/prodigi/service"
import { parseProdigiSku } from "../modules/prodigi-fulfillment/service"

export type SubmitOrderToProdigiInput = {
  order_id: string
}

type ProdigiSubmissionItem = {
  order_item_id: string
  quantity: number
  prodigi_sku: string
  asset_url: string
}

type ProdigiSubmissionPlan = {
  order_id: string
  display_id: number
  shipping_method: string
  recipient: {
    name: string
    email?: string
    address: {
      line1: string
      line2?: string
      postalOrZipCode: string
      countryCode: string
      townOrCity: string
      stateOrCounty?: string
    }
  }
  items: ProdigiSubmissionItem[]
}

const prepareProdigiSubmissionStep = createStep(
  "prepare-prodigi-submission",
  async (input: SubmitOrderToProdigiInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "payment_collections.status",
        "shipping_address.*",
        "shipping_methods.data",
        "items.id",
        "items.quantity",
        "items.variant_sku",
        "items.variant.metadata",
        "items.variant.product.id",
        "items.variant.product.metadata",
        "fulfillments.id",
        "fulfillments.canceled_at",
        "fulfillments.metadata",
      ],
      filters: { id: input.order_id },
    })

    const order = data[0] as Record<string, any> | undefined
    if (!order) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Order ${input.order_id} not found`
      )
    }

    // Gate: payment must be captured before anything is sent to Prodigi.
    const paymentCaptured = (order.payment_collections ?? []).some(
      (pc: { status?: string } | null) => pc?.status === "completed"
    )
    if (!paymentCaptured) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Payment has not been captured yet - capture it before submitting to Prodigi"
      )
    }

    // Guard against double submission.
    const alreadySubmitted = (order.fulfillments ?? []).some(
      (f: { canceled_at?: string | null; metadata?: Record<string, unknown> | null } | null) =>
        f && !f.canceled_at && f.metadata?.prodigi_order_id
    )
    if (alreadySubmitted) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This order already has a Prodigi fulfillment"
      )
    }

    const address = order.shipping_address
    if (!address?.address_1 || !address?.country_code || !address?.city) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Order is missing a complete shipping address"
      )
    }

    const prodigi = container.resolve(PRODIGI_MODULE) as ProdigiModuleService

    const items: ProdigiSubmissionItem[] = []
    const problems: string[] = []

    for (const item of order.items ?? []) {
      if (!item) {
        continue
      }

      const variantMeta =
        (item.variant?.metadata as Record<string, unknown> | null) ?? {}

      if (variantMeta.fulfillment_type === "digital") {
        continue
      }

      const prodigiSku =
        (variantMeta.prodigi_sku as string | undefined) ||
        parseProdigiSku(item.variant_sku)

      if (!prodigiSku) {
        // Not a print item and not digital: skip (not Prodigi's concern).
        continue
      }

      // Live safety net: verify the SKU still exists right before money moves.
      try {
        await prodigi.getProductDetails(prodigiSku)
      } catch {
        problems.push(`SKU ${prodigiSku} failed live verification with Prodigi`)
        continue
      }

      const productMeta =
        (item.variant?.product?.metadata as Record<string, unknown> | null) ??
        {}
      const assetUrl = productMeta.print_asset_url as string | undefined

      if (!assetUrl) {
        problems.push(
          `Product ${item.variant?.product?.id} is missing metadata.print_asset_url (high-res asset URL for printing)`
        )
        continue
      }

      items.push({
        order_item_id: item.id,
        quantity: Number(item.quantity) || 1,
        prodigi_sku: prodigiSku,
        asset_url: assetUrl,
      })
    }

    if (problems.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Cannot submit to Prodigi:\n- ${problems.join("\n- ")}`
      )
    }

    if (!items.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Order has no Prodigi print items to fulfill"
      )
    }

    const shippingMethod =
      ((order.shipping_methods?.[0]?.data as Record<string, unknown> | null)
        ?.id as string | undefined) || "Standard"

    const plan: ProdigiSubmissionPlan = {
      order_id: order.id,
      display_id: order.display_id,
      shipping_method: shippingMethod,
      recipient: {
        name:
          [address.first_name, address.last_name].filter(Boolean).join(" ") ||
          "Customer",
        email: order.email ?? undefined,
        address: {
          line1: address.address_1,
          line2: address.address_2 ?? undefined,
          postalOrZipCode: address.postal_code ?? "",
          countryCode: (address.country_code as string).toUpperCase(),
          townOrCity: address.city,
          stateOrCounty: address.province ?? undefined,
        },
      },
      items,
    }

    return new StepResponse(plan)
  }
)

const createProdigiOrderStep = createStep(
  "create-prodigi-order",
  async (plan: ProdigiSubmissionPlan, { container }) => {
    const prodigi = container.resolve(PRODIGI_MODULE) as ProdigiModuleService

    const webhookSecret = process.env.PRODIGI_WEBHOOK_SECRET
    const backendUrl = process.env.MEDUSA_BACKEND_URL
    const callbackUrl =
      webhookSecret && backendUrl
        ? `${backendUrl.replace(/\/$/, "")}/hooks/prodigi/${webhookSecret}`
        : undefined

    const response = (await prodigi.createOrder({
      shippingMethod: plan.shipping_method,
      merchantReference: plan.order_id,
      idempotencyKey: plan.order_id,
      ...(callbackUrl ? { callbackUrl } : {}),
      recipient: plan.recipient,
      items: plan.items.map((item) => ({
        sku: item.prodigi_sku,
        copies: item.quantity,
        sizing: "fillPrintArea",
        assets: [{ printArea: "default", url: item.asset_url }],
      })),
      metadata: {
        medusa_order_id: plan.order_id,
        medusa_display_id: plan.display_id,
      },
    })) as { order?: { id: string; status?: { stage?: string } } }

    const prodigiOrderId = response.order?.id
    if (!prodigiOrderId) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Prodigi did not return an order id"
      )
    }

    return new StepResponse(
      {
        prodigi_order_id: prodigiOrderId,
        stage: response.order?.status?.stage ?? "InProgress",
      },
      prodigiOrderId
    )
  },
  async (prodigiOrderId, { container }) => {
    if (!prodigiOrderId) {
      return
    }
    const prodigi = container.resolve(PRODIGI_MODULE) as ProdigiModuleService
    try {
      await prodigi.cancelOrder(prodigiOrderId)
    } catch {
      // Cancellation window may have passed; handled manually in Prodigi dashboard.
    }
  }
)

export const submitOrderToProdigiWorkflow = createWorkflow(
  "submit-order-to-prodigi",
  function (input: SubmitOrderToProdigiInput) {
    const plan = prepareProdigiSubmissionStep(input)

    const prodigiOrder = createProdigiOrderStep(plan)

    const fulfillmentInput = transform(
      { plan, prodigiOrder },
      ({ plan, prodigiOrder }) => ({
        order_id: plan.order_id,
        items: plan.items.map((item) => ({
          id: item.order_item_id,
          quantity: item.quantity,
        })),
        metadata: {
          prodigi_order_id: prodigiOrder.prodigi_order_id,
          prodigi_stage: prodigiOrder.stage,
        },
      })
    )

    const fulfillment = createOrderFulfillmentWorkflow.runAsStep({
      input: fulfillmentInput,
    })

    return new WorkflowResponse({
      prodigi_order: prodigiOrder,
      fulfillment,
    })
  }
)
