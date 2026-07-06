import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { Button, Container, StatusBadge, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../lib/client"
import { invalidateOrderQueries } from "../lib/invalidate-order-queries"

type DigitalStatus = {
  payment_captured: boolean
  has_digital_items: boolean
  email_configured: boolean
  digital_delivery: {
    delivery_id: string
    fulfillment_id: string | null
    email_sent_at: string | null
    expires_at: string
    download_url: string
  } | null
}

const OrderDigitalFulfillmentWidget = ({
  data: order,
}: DetailWidgetProps<HttpTypes.AdminOrder>) => {
  const queryClient = useQueryClient()

  const { data: status, isLoading } = useQuery({
    queryKey: ["order-digital", order.id],
    queryFn: () =>
      sdk.client.fetch<DigitalStatus>(
        `/admin/orders/${order.id}/digital-fulfillment`
      ),
  })

  const fulfill = useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ line_items: number }>(
        `/admin/orders/${order.id}/digital-fulfillment`,
        { method: "POST" }
      ),
    onSuccess: async (result) => {
      await invalidateOrderQueries(queryClient, order.id)
      queryClient.invalidateQueries({ queryKey: ["order-digital", order.id] })
      toast.success(
        `Digital delivery processed for ${result.line_items} item(s)`
      )
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to process digital delivery")
    },
  })

  const delivery = status?.digital_delivery ?? null
  const captured = status?.payment_captured ?? false
  const hasDigitalItems = status?.has_digital_items ?? false

  if (!hasDigitalItems) {
    return null
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Text size="small" leading="compact" weight="plus">
            Digital Download Fulfillment
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {isLoading
              ? "Loading..."
              : delivery?.email_sent_at
                ? "Download link emailed to customer"
                : captured
                  ? "Ready to package and email"
                  : "Waiting for payment capture"}
          </Text>
          {!status?.email_configured && (
            <Text size="small" leading="compact" className="text-ui-fg-error">
              Resend is not configured — set RESEND_API_KEY and RESEND_FROM_EMAIL.
            </Text>
          )}
        </div>
        {delivery?.email_sent_at ? (
          <StatusBadge color="green">Delivered</StatusBadge>
        ) : captured ? (
          <StatusBadge color="orange">Pending</StatusBadge>
        ) : null}
      </div>
      {delivery && (
        <div className="px-6 py-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle break-all">
            {delivery.download_url}
          </Text>
        </div>
      )}
      <div className="flex justify-end px-6 py-4">
        <Button
          size="small"
          onClick={() => fulfill.mutate()}
          isLoading={fulfill.isPending}
          disabled={!captured || !status?.email_configured}
        >
          {delivery ? "Resend / Rebuild" : "Process digital delivery"}
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default OrderDigitalFulfillmentWidget
