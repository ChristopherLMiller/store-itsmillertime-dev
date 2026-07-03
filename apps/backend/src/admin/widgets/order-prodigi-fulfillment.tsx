import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { Button, Container, StatusBadge, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../lib/client"

type ProdigiStatus = {
  payment_captured: boolean
  prodigi_fulfillment: {
    fulfillment_id: string
    prodigi_order_id: string
    prodigi_stage: string | null
    shipped_at: string | null
    delivered_at: string | null
  } | null
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
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["order-prodigi", order.id] })
      queryClient.invalidateQueries({ queryKey: ["order", order.id] })
      toast.success(`Submitted to Prodigi (${result.prodigi_order_id})`)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit to Prodigi")
    },
  })

  const fulfillment = status?.prodigi_fulfillment ?? null
  const captured = status?.payment_captured ?? false

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
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
        </div>
        {fulfillment ? (
          <StatusBadge
            color={
              fulfillment.delivered_at
                ? "green"
                : fulfillment.shipped_at
                  ? "blue"
                  : "orange"
            }
          >
            {fulfillment.delivered_at
              ? "Delivered"
              : fulfillment.shipped_at
                ? "Shipped"
                : (fulfillment.prodigi_stage ?? "Submitted")}
          </StatusBadge>
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
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default OrderProdigiWidget
