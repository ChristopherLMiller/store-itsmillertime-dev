import { DotsSix } from "@medusajs/icons"
import {
  Badge,
  IconButton,
  StatusBadge,
  Table,
  Text,
} from "@medusajs/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { sdk } from "../../../lib/client"
import type { AdminPrintOffering } from "../../../lib/print-catalog-types"

const formatMoney = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount)

export const OfferingsTable = ({
  offerings,
  sortable,
  onSelect,
}: {
  offerings: AdminPrintOffering[]
  sortable: boolean
  onSelect: (offering: AdminPrintOffering) => void
}) => {
  const queryClient = useQueryClient()
  const [orderedOfferings, setOrderedOfferings] = useState(offerings)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  useEffect(() => {
    setOrderedOfferings(offerings)
  }, [offerings])

  const reorderOfferings = useMutation({
    mutationFn: async (nextOrder: AdminPrintOffering[]) => {
      await Promise.all(
        nextOrder.map((offering, index) =>
          sdk.client.fetch(`/admin/print-offerings/${offering.id}`, {
            method: "POST",
            body: { sort_order: index * 10 },
          })
        )
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["print-offerings"] })
      queryClient.invalidateQueries({ queryKey: ["offering-sets"] })
    },
  })

  const moveOffering = (fromId: string, toId: string) => {
    if (fromId === toId) {
      return
    }

    const next = [...orderedOfferings]
    const fromIndex = next.findIndex((offering) => offering.id === fromId)
    const toIndex = next.findIndex((offering) => offering.id === toId)

    if (fromIndex < 0 || toIndex < 0) {
      return
    }

    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    setOrderedOfferings(next)
    reorderOfferings.mutate(next)
  }

  return (
    <div className="flex flex-col gap-y-2">
      {reorderOfferings.isPending && (
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Saving order...
        </Text>
      )}
      <Table>
      <Table.Header>
        <Table.Row>
          {sortable && <Table.HeaderCell className="w-10" />}
          <Table.HeaderCell>SKU</Table.HeaderCell>
          <Table.HeaderCell>Label</Table.HeaderCell>
          <Table.HeaderCell>Category</Table.HeaderCell>
          <Table.HeaderCell>Size</Table.HeaderCell>
          <Table.HeaderCell>Price</Table.HeaderCell>
          <Table.HeaderCell>Sets</Table.HeaderCell>
          <Table.HeaderCell>Status</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {orderedOfferings.map((offering) => (
          <Table.Row
            key={offering.id}
            className="cursor-pointer"
            onClick={() => onSelect(offering)}
            onDragOver={(event) => {
              if (!sortable || !draggingId) {
                return
              }
              event.preventDefault()
            }}
            onDrop={(event) => {
              event.preventDefault()
              if (!sortable || !draggingId) {
                return
              }
              moveOffering(draggingId, offering.id)
              setDraggingId(null)
            }}
          >
            {sortable && (
              <Table.Cell
                className="w-10"
                onClick={(event) => event.stopPropagation()}
              >
                <IconButton
                  size="small"
                  variant="transparent"
                  className="cursor-grab active:cursor-grabbing"
                  draggable
                  onDragStart={() => setDraggingId(offering.id)}
                  onDragEnd={() => setDraggingId(null)}
                >
                  <DotsSix />
                </IconButton>
              </Table.Cell>
            )}
            <Table.Cell>{offering.prodigi_sku}</Table.Cell>
            <Table.Cell>{offering.label}</Table.Cell>
            <Table.Cell>
              <Badge size="2xsmall">{offering.category}</Badge>
            </Table.Cell>
            <Table.Cell>
              {offering.width && offering.height
                ? `${offering.width} x ${offering.height}`
                : "-"}
            </Table.Cell>
            <Table.Cell>
              {offering.retail_price != null
                ? formatMoney(
                    offering.retail_price,
                    offering.price_currency ?? "USD"
                  )
                : "-"}
            </Table.Cell>
            <Table.Cell>
              {(offering.sets ?? [])
                .filter(Boolean)
                .map((set) => set.name)
                .join(", ") || "-"}
            </Table.Cell>
            <Table.Cell>
              <div className="flex items-center gap-x-1">
                <StatusBadge color={offering.active ? "green" : "grey"}>
                  {offering.active ? "Active" : "Inactive"}
                </StatusBadge>
                {offering.needs_review && (
                  <StatusBadge color="orange">Needs review</StatusBadge>
                )}
              </div>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
      </Table>
    </div>
  )
}
