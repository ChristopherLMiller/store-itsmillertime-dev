import type { QueryClient } from "@tanstack/react-query"

/**
 * Medusa admin order pages cache under `ordersQueryKeys` from
 * `@medusajs/dashboard` (`["orders", "detail", id, ...]`). Custom widgets
 * must invalidate that namespace — not `["order", id]`.
 */
export async function invalidateOrderQueries(
  queryClient: QueryClient,
  _orderId: string
) {
  await queryClient.invalidateQueries({ queryKey: ["orders"] })
  await queryClient.refetchQueries({
    queryKey: ["orders"],
    type: "active",
  })
}
