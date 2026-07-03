import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Badge,
  Button,
  Checkbox,
  Container,
  Drawer,
  FocusModal,
  Heading,
  Input,
  Label,
  Prompt,
  Table,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { sdk } from "../../../lib/client"
import type {
  AdminOfferingSet,
  AdminPrintOffering,
} from "../../../lib/print-catalog-types"

type SetFormState = {
  name: string
  description: string
  is_default: boolean
  offering_ids: string[]
}

const emptySetForm: SetFormState = {
  name: "",
  description: "",
  is_default: false,
  offering_ids: [],
}

const OfferingCheckboxList = ({
  offerings,
  selected,
  onToggle,
}: {
  offerings: AdminPrintOffering[]
  selected: string[]
  onToggle: (id: string) => void
}) => {
  if (!offerings.length) {
    return (
      <Text size="small" leading="compact" className="text-ui-fg-subtle">
        No print offerings yet. Add SKUs on the Print Catalog page first.
      </Text>
    )
  }

  return (
    <div className="flex max-h-72 flex-col gap-y-2 overflow-auto">
      {offerings.map((offering) => (
        <label key={offering.id} className="flex items-center gap-x-2">
          <Checkbox
            checked={selected.includes(offering.id)}
            onCheckedChange={() => onToggle(offering.id)}
          />
          <Text size="small" leading="compact">
            {offering.label}
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {offering.prodigi_sku}
            {!offering.active ? " (inactive)" : ""}
          </Text>
        </label>
      ))}
    </div>
  )
}

const SetFormFields = ({
  form,
  setForm,
  offerings,
}: {
  form: SetFormState
  setForm: (form: SetFormState) => void
  offerings: AdminPrintOffering[]
}) => {
  const toggleOffering = (id: string) => {
    setForm({
      ...form,
      offering_ids: form.offering_ids.includes(id)
        ? form.offering_ids.filter((o) => o !== id)
        : [...form.offering_ids, id],
    })
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-col gap-y-2">
        <Label>Name *</Label>
        <Input
          placeholder="e.g. Standard Photo Prints"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-y-2">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <label className="flex items-center gap-x-2">
        <Checkbox
          checked={form.is_default}
          onCheckedChange={(checked) =>
            setForm({ ...form, is_default: checked === true })
          }
        />
        <Text size="small" leading="compact">
          Default set for new products
        </Text>
      </label>

      <div className="flex flex-col gap-y-2">
        <Label>Offerings in this set</Label>
        <OfferingCheckboxList
          offerings={offerings}
          selected={form.offering_ids}
          onToggle={toggleOffering}
        />
      </div>
    </div>
  )
}

const OfferingSetsPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<SetFormState>(emptySetForm)
  const [editingSet, setEditingSet] = useState<AdminOfferingSet | null>(null)
  const [editForm, setEditForm] = useState<SetFormState | null>(null)
  const [deletingSet, setDeletingSet] = useState<AdminOfferingSet | null>(null)

  const { data: setsData, isLoading } = useQuery({
    queryKey: ["offering-sets"],
    queryFn: () =>
      sdk.client.fetch<{ offering_sets: AdminOfferingSet[] }>(
        "/admin/offering-sets"
      ),
  })

  const { data: offeringsData } = useQuery({
    queryKey: ["print-offerings"],
    queryFn: () =>
      sdk.client.fetch<{ offerings: AdminPrintOffering[] }>(
        "/admin/print-offerings",
        { query: { order: "sort_order", limit: 200 } }
      ),
  })

  const sets = setsData?.offering_sets ?? []
  const offerings = offeringsData?.offerings ?? []

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["offering-sets"] })
    queryClient.invalidateQueries({ queryKey: ["print-offerings"] })
  }

  const createSet = useMutation({
    mutationFn: (data: SetFormState) =>
      sdk.client.fetch("/admin/offering-sets", { method: "POST", body: data }),
    onSuccess: () => {
      invalidate()
      toast.success("Offering set created")
      setCreateForm(emptySetForm)
      setCreateOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create set")
    },
  })

  const updateSet = useMutation({
    mutationFn: (input: { id: string; data: SetFormState }) =>
      sdk.client.fetch(`/admin/offering-sets/${input.id}`, {
        method: "POST",
        body: input.data,
      }),
    onSuccess: () => {
      invalidate()
      toast.success("Offering set updated")
      setEditingSet(null)
      setEditForm(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update set")
    },
  })

  const deleteSet = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/offering-sets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate()
      toast.success("Offering set deleted")
      setDeletingSet(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete set")
    },
  })

  const openEdit = (set: AdminOfferingSet) => {
    setEditingSet(set)
    setEditForm({
      name: set.name,
      description: set.description ?? "",
      is_default: set.is_default,
      offering_ids: (set.offerings ?? []).filter(Boolean).map((o) => o.id),
    })
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Offering Sets</Heading>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Curated groups of print offerings that products subscribe to
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          <Button
            size="small"
            variant="secondary"
            onClick={() => navigate("/prodigi/print-catalog")}
          >
            Print Offerings
          </Button>
          <Button size="small" onClick={() => setCreateOpen(true)}>
            + Create Set
          </Button>
        </div>
      </div>

      <div className="px-6 py-4">
        {isLoading ? (
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Loading sets...
          </Text>
        ) : sets.length === 0 ? (
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            No offering sets yet. Create one to group print offerings for
            products.
          </Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Description</Table.HeaderCell>
                <Table.HeaderCell>Offerings</Table.HeaderCell>
                <Table.HeaderCell>Default</Table.HeaderCell>
                <Table.HeaderCell></Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {sets.map((set) => (
                <Table.Row
                  key={set.id}
                  className="cursor-pointer"
                  onClick={() => openEdit(set)}
                >
                  <Table.Cell>{set.name}</Table.Cell>
                  <Table.Cell>{set.description || "-"}</Table.Cell>
                  <Table.Cell>
                    {(set.offerings ?? []).filter(Boolean).length}
                  </Table.Cell>
                  <Table.Cell>
                    {set.is_default ? <Badge size="2xsmall">Default</Badge> : "-"}
                  </Table.Cell>
                  <Table.Cell onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="small"
                      variant="danger"
                      onClick={() => setDeletingSet(set)}
                    >
                      Delete
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>

      <FocusModal open={createOpen} onOpenChange={setCreateOpen}>
        <FocusModal.Content>
          <div className="flex h-full flex-col overflow-hidden">
            <FocusModal.Header>
              <div className="flex items-center justify-end gap-x-2">
                <FocusModal.Close asChild>
                  <Button
                    size="small"
                    variant="secondary"
                    disabled={createSet.isPending}
                  >
                    Cancel
                  </Button>
                </FocusModal.Close>
                <Button
                  size="small"
                  onClick={() => {
                    if (!createForm.name) {
                      toast.error("Name is required")
                      return
                    }
                    createSet.mutate(createForm)
                  }}
                  isLoading={createSet.isPending}
                >
                  Save
                </Button>
              </div>
            </FocusModal.Header>
            <FocusModal.Body className="flex-1 overflow-auto">
              <div className="mx-auto flex w-full max-w-lg flex-col gap-y-6 px-6 py-8">
                <Heading level="h2">Create Offering Set</Heading>
                <SetFormFields
                  form={createForm}
                  setForm={setCreateForm}
                  offerings={offerings}
                />
              </div>
            </FocusModal.Body>
          </div>
        </FocusModal.Content>
      </FocusModal>

      <Drawer
        open={!!editingSet}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSet(null)
            setEditForm(null)
          }
        }}
      >
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edit {editingSet?.name}</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex-1 overflow-auto p-4">
            {editForm && (
              <SetFormFields
                form={editForm}
                setForm={setEditForm}
                offerings={offerings}
              />
            )}
          </Drawer.Body>
          <Drawer.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <Drawer.Close asChild>
                <Button
                  size="small"
                  variant="secondary"
                  disabled={updateSet.isPending}
                >
                  Cancel
                </Button>
              </Drawer.Close>
              <Button
                size="small"
                onClick={() => {
                  if (!editingSet || !editForm) {
                    return
                  }
                  if (!editForm.name) {
                    toast.error("Name is required")
                    return
                  }
                  updateSet.mutate({ id: editingSet.id, data: editForm })
                }}
                isLoading={updateSet.isPending}
              >
                Save
              </Button>
            </div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>

      <Prompt
        open={!!deletingSet}
        onOpenChange={(open) => !open && setDeletingSet(null)}
      >
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>Delete offering set</Prompt.Title>
            <Prompt.Description>
              Delete "{deletingSet?.name}"? Products subscribed to this set will
              keep their existing variants but stop receiving catalog updates.
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel disabled={deleteSet.isPending}>Cancel</Prompt.Cancel>
            <Prompt.Action
              onClick={() => deletingSet && deleteSet.mutate(deletingSet.id)}
            >
              Delete
            </Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Offering Sets",
  rank: 1,
})

export default OfferingSetsPage
