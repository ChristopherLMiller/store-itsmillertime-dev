import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps } from "@medusajs/framework/types"
import type { HttpTypes } from "@medusajs/framework/types"
import {
  Button,
  Container,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../lib/client"
import type { AdminOfferingSet } from "../lib/print-catalog-types"

const ProductOfferingSetWidget = ({
  data: product,
}: DetailWidgetProps<HttpTypes.AdminProduct>) => {
  const queryClient = useQueryClient()
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)

  const { data: currentData, isLoading: currentLoading } = useQuery({
    queryKey: ["product-offering-set", product.id],
    queryFn: () =>
      sdk.client.fetch<{
        offering_set: { id: string; name: string } | null
      }>(`/admin/products/${product.id}/offering-set`),
  })

  const { data: setsData } = useQuery({
    queryKey: ["offering-sets"],
    queryFn: () =>
      sdk.client.fetch<{ offering_sets: AdminOfferingSet[] }>(
        "/admin/offering-sets"
      ),
  })

  const applySet = useMutation({
    mutationFn: (offering_set_id: string) =>
      sdk.client.fetch<{ created_variants: number }>(
        `/admin/products/${product.id}/offering-set`,
        {
          method: "POST",
          body: { offering_set_id },
        }
      ),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["product-offering-set", product.id],
      })
      queryClient.invalidateQueries({ queryKey: ["products", product.id] })
      toast.success(
        `Offering set applied - ${result.created_variants} variant(s) created`
      )
      setSelectedSetId(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to apply offering set")
    },
  })

  const currentSet = currentData?.offering_set ?? null
  const sets = setsData?.offering_sets ?? []
  const defaultSet = sets.find((s) => s.is_default)

  const effectiveSelection =
    selectedSetId ?? currentSet?.id ?? defaultSet?.id ?? undefined

  const dirty = !!effectiveSelection && effectiveSelection !== currentSet?.id

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Text size="small" leading="compact" weight="plus">
            Print Offering Set
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {currentLoading
              ? "Loading..."
              : currentSet
                ? `Subscribed to "${currentSet.name}"`
                : "Not subscribed to a set"}
          </Text>
        </div>
      </div>
      <div className="flex items-center gap-x-2 px-6 py-4">
        <div className="flex-1">
          <Select
            value={effectiveSelection}
            onValueChange={setSelectedSetId}
            disabled={applySet.isPending || !sets.length}
          >
            <Select.Trigger>
              <Select.Value
                placeholder={
                  sets.length ? "Select an offering set" : "No sets available"
                }
              />
            </Select.Trigger>
            <Select.Content>
              {sets.map((set) => (
                <Select.Item key={set.id} value={set.id}>
                  {set.name}
                  {set.is_default ? " (default)" : ""}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <Button
          size="small"
          onClick={() => effectiveSelection && applySet.mutate(effectiveSelection)}
          isLoading={applySet.isPending}
          disabled={!dirty && !!currentSet}
        >
          {currentSet ? "Re-apply / Switch" : "Apply Set"}
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
})

export default ProductOfferingSetWidget
