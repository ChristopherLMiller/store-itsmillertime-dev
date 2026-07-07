import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { ArrowPath } from "@medusajs/icons"
import { Button, Container, StatusBadge, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../lib/client"
import { invalidateOrderQueries } from "../lib/invalidate-order-queries"

type ProdigiShipmentSnapshot = {
  status: string | null
  carrier_name: string | null
  tracking_number: string | null
  tracking_url: string | null
}

type ProdigiFulfillmentView = {
  fulfillment_id: string
  prodigi_order_id: string
  prodigi_environment: "sandbox" | "live"
  prodigi_dashboard_url: string | null
  prodigi_stage: string | null
  prodigi_shipping_status: string | null
  prodigi_shipments: ProdigiShipmentSnapshot[]
  display_status: string
  shipped_at: string | null
  delivered_at: string | null
}

type ProdigiStatus = {
  payment_captured: boolean
  email_configured: boolean
  can_resend_tracking: boolean
  prodigi_fulfillment: ProdigiFulfillmentView | null
}

function badgeColor(displayStatus: string) {
  switch (displayStatus) {
    case "Delivered":
      return "green" as const
    case "Shipped":
      return "blue" as const
    case "Cancelled":
      return "red" as const
    default:
      return "orange" as const
  }
}

function environmentBadgeColor(environment: ProdigiFulfillmentView["prodigi_environment"]) {
  return environment === "live" ? ("green" as const) : ("purple" as const)
}

function environmentLabel(environment: ProdigiFulfillmentView["prodigi_environment"]) {
  return environment === "live" ? "Live" : "Sandbox"
}

function formatTrackingSummary(shipments: ProdigiShipmentSnapshot[]) {
  const tracked = shipments.filter((shipment) => shipment.tracking_number)
  if (!tracked.length) {
    return null
  }

  const first = tracked[0]
  const suffix =
    tracked.length > 1 ? ` (+${tracked.length - 1} more)` : ""

  return `${first.carrier_name ?? "Carrier"} · ${first.tracking_number}${suffix}`
}

const OrderProdigiWidget = ({
  data: order,
}: DetailWidgetProps<HttpTypes.AdminOrder>) => {
  const queryClient = useQueryClient()

  const { data: status, isLoading } = useQuery({
    queryKey: ["order-prodigi", order.id],
    queryFn: () =>
      sdk.client.fetch<ProdigiStatus>(
        `/admin/orders/${order.id}/prodigi-fulfillment`
      ),
  })

  const submit = useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ prodigi_order_id: string; stage: string }>(
        `/admin/orders/${order.id}/prodigi-fulfillment`,
        { method: "POST" }
      ),
    onSuccess: async (result) => {
      await invalidateOrderQueries(queryClient, order.id)
      queryClient.invalidateQueries({ queryKey: ["order-prodigi", order.id] })
      toast.success(`Submitted to Prodigi (${result.prodigi_order_id})`)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit to Prodigi")
    },
  })

  const sync = useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ display_status: string }>(
        `/admin/orders/${order.id}/prodigi-fulfillment/sync`,
        { method: "POST" }
      ),
    onSuccess: async (result) => {
      await invalidateOrderQueries(queryClient, order.id)
      await queryClient.invalidateQueries({
        queryKey: ["order-prodigi", order.id],
      })
      toast.success(`Synced from Prodigi (${result.display_status})`)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to sync from Prodigi")
    },
  })

  const resendTracking = useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ sent: boolean; to: string }>(
        `/admin/orders/${order.id}/prodigi-fulfillment/resend-tracking`,
        { method: "POST" }
      ),
    onSuccess: (result) => {
      toast.success(`Tracking email sent to ${result.to}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to resend tracking email")
    },
  })

  const fulfillment = status?.prodigi_fulfillment ?? null
  const captured = status?.payment_captured ?? false
  const displayStatus = fulfillment?.display_status ?? "Submitted"
  const trackingSummary = fulfillment
    ? formatTrackingSummary(fulfillment.prodigi_shipments)
    : null
  const canResendTracking = status?.can_resend_tracking ?? false
  const emailConfigured = status?.email_configured ?? false

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="min-w-0 flex-1">
          <Text size="small" leading="compact" weight="plus">
            Prodigi Fulfillment
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {isLoading
              ? "Loading..."
              : fulfillment
                ? `Prodigi order ${fulfillment.prodigi_order_id}`
                : captured
                  ? "Ready to submit"
                  : "Waiting for payment capture"}
          </Text>
          {trackingSummary && (
            <Text
              size="small"
              leading="compact"
              className="text-ui-fg-subtle mt-1 truncate"
            >
              {trackingSummary}
            </Text>
          )}
          {canResendTracking && !emailConfigured && (
            <Text
              size="small"
              leading="compact"
              className="text-ui-fg-error mt-1"
            >
              Resend is not configured — set RESEND_API_KEY and
              RESEND_FROM_EMAIL.
            </Text>
          )}
        </div>
        <div className="ml-3 flex shrink-0 items-center gap-x-2">
          {fulfillment ? (
            <>
              <StatusBadge color={environmentBadgeColor(fulfillment.prodigi_environment)}>
                {environmentLabel(fulfillment.prodigi_environment)}
              </StatusBadge>
              <StatusBadge color={badgeColor(displayStatus)}>
                {displayStatus}
              </StatusBadge>
            </>
          ) : (
            <Button
              size="small"
              onClick={() => submit.mutate()}
              isLoading={submit.isPending}
              disabled={!captured || isLoading}
            >
              Submit to Prodigi
            </Button>
          )}
        </div>
      </div>

      {fulfillment && (
        <div className="flex flex-wrap justify-end gap-2 px-6 py-4">
          {fulfillment.prodigi_dashboard_url && (
            <Button size="small" variant="secondary" asChild>
              <a
                href={fulfillment.prodigi_dashboard_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Prodigi
              </a>
            </Button>
          )}
          <Button
            size="small"
            variant="secondary"
            onClick={() => sync.mutate()}
            isLoading={sync.isPending}
            disabled={isLoading}
          >
            <ArrowPath className="mr-1" />
            Sync
          </Button>
          {canResendTracking && (
            <Button
              size="small"
              variant="secondary"
              onClick={() => resendTracking.mutate()}
              isLoading={resendTracking.isPending}
              disabled={!emailConfigured || isLoading}
            >
              Resend tracking
            </Button>
          )}
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default OrderProdigiWidget
