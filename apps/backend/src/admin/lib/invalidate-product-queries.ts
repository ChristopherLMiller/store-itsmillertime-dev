import type { QueryClient } from "@tanstack/react-query"

/**
 * Medusa admin product pages cache under queryKeysFactory namespaces from
 * `@medusajs/dashboard`:
 * - `["products", "detail", id, ...]`
 * - `["product_variants", "list", ...]`
 * - `["product_options", "list", ...]`
 *
 * Custom widgets must invalidate those prefixes — not `["products", id]`.
 */
export async function invalidateProductQueries(
  queryClient: QueryClient,
  _productId: string
) {
  await queryClient.invalidateQueries({ queryKey: ["products"] })
  await queryClient.invalidateQueries({ queryKey: ["product_variants"] })
  await queryClient.invalidateQueries({ queryKey: ["product_options"] })

  await queryClient.refetchQueries({
    queryKey: ["products"],
    type: "active",
  })
  await queryClient.refetchQueries({
    queryKey: ["product_variants"],
    type: "active",
  })
  await queryClient.refetchQueries({
    queryKey: ["product_options"],
    type: "active",
  })
}
