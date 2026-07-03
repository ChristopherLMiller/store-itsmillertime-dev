import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Button,
  Checkbox,
  Container,
  Drawer,
  FocusModal,
  Heading,
  Input,
  Label,
  Prompt,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { sdk } from "../../../lib/client"
import { ProdigiSpecsCard } from "../../../lib/prodigi-specs-display"
import { OfferingsTable } from "./offerings-table"
import type {
  AdminOfferingSet,
  AdminPrintOffering,
  OfferingCategory,
  ProdigiFetchedSpecs,
  ProdigiPrintAreaSpecs,
  ProdigiProductLookupResponse,
  UpdatePrintOfferingResponse,
} from "../../../lib/print-catalog-types"

const CATEGORIES: OfferingCategory[] = ["print", "canvas", "metal", "digital"]
const DEFAULT_MARKUP_PERCENT = 20

const computeRetailPrice = (unitCost: number, markupPercent: number) =>
  Math.round(unitCost * (1 + markupPercent / 100) * 100) / 100

const formatMoney = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount)

type OfferingFormState = {
  prodigi_sku: string
  label: string
  category: OfferingCategory
  markup_percent: number
  set_ids: string[]
}

const emptyForm: OfferingFormState = {
  prodigi_sku: "",
  label: "",
  category: "print",
  markup_percent: DEFAULT_MARKUP_PERCENT,
  set_ids: [],
}

const SetCheckboxList = ({
  sets,
  selected,
  onToggle,
}: {
  sets: AdminOfferingSet[]
  selected: string[]
  onToggle: (id: string) => void
}) => {
  if (!sets.length) {
    return (
      <Text size="small" leading="compact" className="text-ui-fg-subtle">
        No offering sets yet. Create one on the Offering Sets page.
      </Text>
    )
  }

  return (
    <div className="flex flex-col gap-y-2">
      {sets.map((set) => (
        <label key={set.id} className="flex items-center gap-x-2">
          <Checkbox
            checked={selected.includes(set.id)}
            onCheckedChange={() => onToggle(set.id)}
          />
          <Text size="small" leading="compact">
            {set.name}
            {set.is_default ? " (default)" : ""}
          </Text>
        </label>
      ))}
    </div>
  )
}

const PrefixSuggestions = ({
  prefix,
  suggestions,
  onSelect,
}: {
  prefix: string
  suggestions: ProdigiFetchedSpecs[]
  onSelect: (product: ProdigiFetchedSpecs) => void
}) => (
  <div className="flex flex-col gap-y-2">
    <Text size="small" leading="compact" className="text-ui-fg-subtle">
      {prefix} is a product family prefix. Pick a size to load its specs:
    </Text>
    <div className="border-ui-border-base divide-ui-border-base flex flex-col divide-y rounded-md border">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.sku}
          type="button"
          className="hover:bg-ui-bg-subtle-hover flex flex-col gap-y-0.5 px-4 py-3 text-left transition-colors"
          onClick={() => onSelect(suggestion)}
        >
          <Text size="small" leading="compact" weight="plus">
            {suggestion.suggested_label}
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {suggestion.sku}
            {suggestion.paper_type ? ` · ${suggestion.paper_type}` : ""}
            {suggestion.weight_gsm ? ` · ${suggestion.weight_gsm}gsm` : ""}
          </Text>
        </button>
      ))}
    </div>
  </div>
)

const AddOfferingModal = ({
  open,
  onOpenChange,
  sets,
  nextSortOrder,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sets: AdminOfferingSet[]
  nextSortOrder: number
}) => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<OfferingFormState>(emptyForm)
  const [fetched, setFetched] = useState<ProdigiFetchedSpecs | null>(null)
  const [fetchedAttributes, setFetchedAttributes] = useState<
    Record<string, string[]> | null
  >(null)
  const [unitCost, setUnitCost] = useState<{
    amount: number
    currency: string
  } | null>(null)
  const [suggestions, setSuggestions] = useState<{
    prefix: string
    items: ProdigiFetchedSpecs[]
  } | null>(null)

  const applyFetchedProduct = (
    product: ProdigiFetchedSpecs,
    attributes?: Record<string, string[]>,
    fetchedUnitCost?: { amount: number; currency: string } | null
  ) => {
    setFetched(product)
    setFetchedAttributes(attributes ?? null)
    setUnitCost(fetchedUnitCost ?? null)
    setSuggestions(null)
    setForm((prev) => ({
      ...prev,
      prodigi_sku: product.sku,
      label: prev.label || product.suggested_label,
    }))
  }

  const retailPreview =
    unitCost != null
      ? computeRetailPrice(unitCost.amount, form.markup_percent)
      : null

  const fetchSpecs = useMutation({
    mutationFn: (sku: string) =>
      sdk.client.fetch<ProdigiProductLookupResponse>(
        `/admin/prodigi/products/${encodeURIComponent(sku)}`
      ),
    onSuccess: (result) => {
      if (result.kind === "product") {
        applyFetchedProduct(
          result.product,
          result.attributes,
          result.unit_cost
        )
        toast.success(`Fetched specs for ${result.product.sku}`)
        return
      }

      setFetched(null)
      setFetchedAttributes(null)
      setUnitCost(null)
      setSuggestions({
        prefix: result.prefix,
        items: result.suggestions,
      })
    },
    onError: (error: Error) => {
      setFetched(null)
      setFetchedAttributes(null)
      setUnitCost(null)
      setSuggestions(null)
      toast.error(error.message || "Failed to fetch from Prodigi")
    },
  })

  const createOffering = useMutation({
    mutationFn: (data: OfferingFormState) =>
      sdk.client.fetch("/admin/print-offerings", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["print-offerings"] })
      queryClient.invalidateQueries({ queryKey: ["offering-sets"] })
      toast.success("Print offering created")
      setForm(emptyForm)
      setFetched(null)
      setFetchedAttributes(null)
      setUnitCost(null)
      setSuggestions(null)
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create offering")
    },
  })

  const handleSubmit = () => {
    if (!form.prodigi_sku || !form.label) {
      toast.error("Prodigi SKU and label are required")
      return
    }
    createOffering.mutate({ ...form, sort_order: nextSortOrder } as OfferingFormState & {
      sort_order: number
    })
  }

  const toggleSet = (id: string) => {
    setForm((prev) => ({
      ...prev,
      set_ids: prev.set_ids.includes(id)
        ? prev.set_ids.filter((s) => s !== id)
        : [...prev.set_ids, id],
    }))
  }

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content>
        <div className="flex h-full flex-col overflow-hidden">
          <FocusModal.Header>
            <div className="flex items-center justify-end gap-x-2">
              <FocusModal.Close asChild>
                <Button
                  size="small"
                  variant="secondary"
                  disabled={createOffering.isPending}
                >
                  Cancel
                </Button>
              </FocusModal.Close>
              <Button
                size="small"
                onClick={handleSubmit}
                isLoading={createOffering.isPending}
              >
                Save
              </Button>
            </div>
          </FocusModal.Header>

          <FocusModal.Body className="flex-1 overflow-auto">
            <div className="mx-auto flex w-full max-w-lg flex-col gap-y-6 px-6 py-8">
              <Heading level="h2">Add Prodigi SKU</Heading>

              <div className="flex flex-col gap-y-2">
                <Label>Prodigi SKU *</Label>
                <div className="flex items-center gap-x-2">
                  <Input
                    placeholder="e.g. GLOBAL-PAP or GLOBAL-PAP-8X10"
                    value={form.prodigi_sku}
                    onChange={(e) => {
                      setFetched(null)
                      setFetchedAttributes(null)
                      setUnitCost(null)
                      setSuggestions(null)
                      setForm({ ...form, prodigi_sku: e.target.value.trim() })
                    }}
                  />
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => fetchSpecs.mutate(form.prodigi_sku)}
                    isLoading={fetchSpecs.isPending}
                    disabled={!form.prodigi_sku}
                  >
                    Fetch from Prodigi
                  </Button>
                </div>
                <Text size="small" leading="compact" className="text-ui-fg-subtle">
                  Enter a full SKU or a product-family prefix (e.g. GLOBAL-PAP)
                  to browse available sizes from Prodigi.
                </Text>
                {suggestions && (
                  <PrefixSuggestions
                    prefix={suggestions.prefix}
                    suggestions={suggestions.items}
                    onSelect={(product) => fetchSpecs.mutate(product.sku)}
                  />
                )}
                {fetched && (
                  <ProdigiSpecsCard
                    source={fetched}
                    attributes={fetchedAttributes ?? undefined}
                    attributeSpecs={fetched.attribute_specs}
                    printAreaSpecs={fetched.print_area_specs}
                    onUseSuggestedLabel={(label) =>
                      setForm((prev) => ({ ...prev, label }))
                    }
                  />
                )}
              </div>

              <div className="flex flex-col gap-y-2">
                <Label>Storefront label *</Label>
                <Input
                  placeholder='e.g. 11×14″ · Fine Art Print'
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                />
                <Text size="small" leading="compact" className="text-ui-fg-subtle">
                  Short label shown on the storefront Format picker. Parsed
                  automatically when you fetch from Prodigi.
                </Text>
              </div>

              {unitCost && (
                <div className="bg-ui-bg-subtle flex flex-col gap-y-3 rounded-md px-4 py-3">
                  <Text size="small" leading="compact" weight="plus">
                    Pricing (print cost only — shipping is quoted at checkout)
                  </Text>
                  <Text size="small" leading="compact" className="text-ui-fg-subtle">
                    Prodigi print cost:{" "}
                    {formatMoney(unitCost.amount, unitCost.currency)}
                  </Text>
                  <div className="flex flex-col gap-y-2">
                    <Label>Markup %</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={form.markup_percent}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          markup_percent: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  {retailPreview != null && (
                    <Text size="small" leading="compact" weight="plus">
                      Storefront price:{" "}
                      {formatMoney(retailPreview, unitCost.currency)}
                    </Text>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    setForm({ ...form, category: value as OfferingCategory })
                  }
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Select category" />
                  </Select.Trigger>
                  <Select.Content>
                    {CATEGORIES.map((c) => (
                      <Select.Item key={c} value={c}>
                        {c}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>

              <div className="flex flex-col gap-y-2">
                <Label>Offering sets</Label>
                <SetCheckboxList
                  sets={sets}
                  selected={form.set_ids}
                  onToggle={toggleSet}
                />
              </div>
            </div>
          </FocusModal.Body>
        </div>
      </FocusModal.Content>
    </FocusModal>
  )
}

const EditOfferingDrawer = ({
  offering,
  sets,
  onOpenChange,
  onOfferingUpdated,
}: {
  offering: AdminPrintOffering | null
  sets: AdminOfferingSet[]
  onOpenChange: (open: boolean) => void
  onOfferingUpdated: (offering: AdminPrintOffering) => void
}) => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<{
    label: string
    category: OfferingCategory
    active: boolean
    markup_percent: number
    set_ids: string[]
  } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [printAreaSpecs, setPrintAreaSpecs] =
    useState<ProdigiPrintAreaSpecs | null>(null)

  const refreshOfferingQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["print-offerings"] })
    queryClient.invalidateQueries({ queryKey: ["offering-sets"] })
  }

  const formatVariantUpdateNote = (variantsUpdated: number) =>
    variantsUpdated > 0
      ? ` Updated ${variantsUpdated} product variant${
          variantsUpdated === 1 ? "" : "s"
        }.`
      : ""

  const saveOffering = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      sdk.client.fetch<UpdatePrintOfferingResponse>(
        `/admin/print-offerings/${offering!.id}`,
        {
          method: "POST",
          body: data,
        }
      ),
    onSuccess: (response) => {
      refreshOfferingQueries()
      onOfferingUpdated(response.offering)
      setForm(null)
      toast.success(
        "Offering saved." + formatVariantUpdateNote(response.variants_updated)
      )
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save offering")
    },
  })

  const refetchFromProdigi = useMutation({
    mutationFn: async () => {
      const result = await sdk.client.fetch<ProdigiProductLookupResponse>(
        `/admin/prodigi/products/${encodeURIComponent(offering!.prodigi_sku)}`
      )

      if (result.kind !== "product") {
        throw new Error("Could not resolve a single Prodigi SKU to refresh specs")
      }

      const markup =
        form?.markup_percent ??
        offering!.markup_percent ??
        DEFAULT_MARKUP_PERCENT
      const cost = result.unit_cost?.amount ?? null
      const currency = result.unit_cost?.currency?.toLowerCase()

      const response = await sdk.client.fetch<UpdatePrintOfferingResponse>(
        `/admin/print-offerings/${offering!.id}`,
        {
          method: "POST",
          body: {
            width: result.product.width,
            height: result.product.height,
            substrate: result.product.substrate,
            paper_type: result.product.paper_type,
            weight_gsm: result.product.weight_gsm,
            prodigi_unit_cost: cost,
            price_currency: currency,
            needs_review: false,
          },
        }
      )

      return {
        response,
        cost,
        currency,
        markup,
        printAreaSpecs: result.product.print_area_specs ?? null,
      }
    },
    onSuccess: ({ response, cost, currency, markup, printAreaSpecs }) => {
      refreshOfferingQueries()
      onOfferingUpdated(response.offering)
      setForm(null)
      setPrintAreaSpecs(printAreaSpecs)

      const retailPreview =
        cost != null ? computeRetailPrice(cost, markup) : null
      const message =
        cost != null && retailPreview != null
          ? `Prodigi cost ${formatMoney(cost, currency ?? "USD")} → storefront ${formatMoney(retailPreview, currency ?? "USD")}`
          : "Specs refreshed from Prodigi"

      toast.success(message + formatVariantUpdateNote(response.variants_updated))
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to re-fetch from Prodigi")
    },
  })

  const deleteOffering = useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ variants_removed?: number }>(
        `/admin/print-offerings/${offering!.id}`,
        {
          method: "DELETE",
        }
      ),
    onSuccess: (response) => {
      refreshOfferingQueries()
      const removed = response.variants_removed ?? 0
      toast.success(
        removed > 0
          ? `Print offering deleted and removed from ${removed} product${
              removed === 1 ? "" : "s"
            }.`
          : "Print offering deleted"
      )
      setConfirmDelete(false)
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete offering")
    },
  })

  if (!offering) {
    return null
  }

  const current = form ?? {
    label: offering.label,
    category: offering.category,
    active: offering.active,
    markup_percent: offering.markup_percent ?? DEFAULT_MARKUP_PERCENT,
    set_ids: (offering.sets ?? []).filter(Boolean).map((s) => s.id),
  }

  const editRetailPreview =
    (offering.prodigi_unit_cost ?? null) != null
      ? computeRetailPrice(
          offering.prodigi_unit_cost!,
          current.markup_percent
        )
      : null

  const toggleSet = (id: string) => {
    setForm({
      ...current,
      set_ids: current.set_ids.includes(id)
        ? current.set_ids.filter((s) => s !== id)
        : [...current.set_ids, id],
    })
  }

  return (
    <Drawer open={!!offering} onOpenChange={onOpenChange}>
      <Drawer.Content>
        <Drawer.Header>
          <div className="flex w-full items-center justify-between gap-x-3">
            <Drawer.Title>Edit {offering.prodigi_sku}</Drawer.Title>
            <Button
              size="small"
              variant="secondary"
              onClick={() => refetchFromProdigi.mutate()}
              isLoading={refetchFromProdigi.isPending}
              disabled={
                saveOffering.isPending ||
                deleteOffering.isPending ||
                refetchFromProdigi.isPending
              }
            >
              Re-fetch from Prodigi
            </Button>
          </div>
        </Drawer.Header>

        <Drawer.Body className="flex-1 overflow-auto p-4">
          <div className="flex flex-col gap-y-4">
            <div className="flex flex-col gap-y-2">
              <Label>Label</Label>
              <Input
                value={current.label}
                onChange={(e) => setForm({ ...current, label: e.target.value })}
              />
            </div>

            <div className="bg-ui-bg-subtle flex flex-col gap-y-3 rounded-md px-4 py-3">
              <Text size="small" leading="compact" weight="plus">
                Pricing
              </Text>
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                Prodigi print cost:{" "}
                {offering.prodigi_unit_cost != null
                  ? formatMoney(
                      offering.prodigi_unit_cost,
                      offering.price_currency ?? "USD"
                    )
                  : "Not quoted yet — re-fetch from Prodigi"}
              </Text>
              <div className="flex flex-col gap-y-2">
                <Label>Markup %</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={current.markup_percent}
                  onChange={(e) =>
                    setForm({
                      ...current,
                      markup_percent: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              {editRetailPreview != null && (
                <Text size="small" leading="compact" weight="plus">
                  Storefront price:{" "}
                  {formatMoney(
                    editRetailPreview,
                    offering.price_currency ?? "USD"
                  )}
                </Text>
              )}
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>Category</Label>
              <Select
                value={current.category}
                onValueChange={(value) =>
                  setForm({ ...current, category: value as OfferingCategory })
                }
              >
                <Select.Trigger>
                  <Select.Value placeholder="Select category" />
                </Select.Trigger>
                <Select.Content>
                  {CATEGORIES.map((c) => (
                    <Select.Item key={c} value={c}>
                      {c}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            <label className="flex items-center gap-x-2">
              <Checkbox
                checked={current.active}
                onCheckedChange={(checked) =>
                  setForm({ ...current, active: checked === true })
                }
              />
              <Text size="small" leading="compact">
                Active (available for new subscriptions)
              </Text>
            </label>

            <div className="flex flex-col gap-y-2">
              <Label>Offering sets</Label>
              <SetCheckboxList
                sets={sets}
                selected={current.set_ids}
                onToggle={toggleSet}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>Specs from Prodigi</Label>
              <ProdigiSpecsCard
                source={offering}
                printAreaSpecs={printAreaSpecs ?? undefined}
                onUseSuggestedLabel={(label) =>
                  setForm({ ...current, label })
                }
              />
            </div>
          </div>
        </Drawer.Body>

        <Drawer.Footer>
          <div className="flex items-center justify-between gap-x-2">
            <Button
              size="small"
              variant="danger"
              onClick={() => setConfirmDelete(true)}
              disabled={
                saveOffering.isPending ||
                refetchFromProdigi.isPending ||
                deleteOffering.isPending
              }
            >
              Delete
            </Button>
            <div className="flex items-center gap-x-2">
              <Drawer.Close asChild>
                <Button
                  size="small"
                  variant="secondary"
                  disabled={
                    saveOffering.isPending ||
                    refetchFromProdigi.isPending ||
                    deleteOffering.isPending
                  }
                >
                  Cancel
                </Button>
              </Drawer.Close>
              <Button
                size="small"
                onClick={() => saveOffering.mutate(current)}
                isLoading={saveOffering.isPending}
                disabled={refetchFromProdigi.isPending || deleteOffering.isPending}
              >
                Save
              </Button>
            </div>
          </div>
        </Drawer.Footer>
      </Drawer.Content>

      <Prompt open={confirmDelete} onOpenChange={setConfirmDelete}>
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>Delete print offering</Prompt.Title>
            <Prompt.Description>
              Delete "{offering.prodigi_sku}"? This removes the offering from
              your catalog and retires any linked product variants. Existing
              orders are preserved.
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel disabled={deleteOffering.isPending}>
              Cancel
            </Prompt.Cancel>
            <Prompt.Action onClick={() => deleteOffering.mutate()}>
              Delete
            </Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </Drawer>
  )
}

const PrintCatalogPage = () => {
  const navigate = useNavigate()
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<AdminPrintOffering | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const { data: offeringsData, isLoading } = useQuery({
    queryKey: ["print-offerings"],
    queryFn: () =>
      sdk.client.fetch<{ offerings: AdminPrintOffering[]; count: number }>(
        "/admin/print-offerings",
        { query: { order: "sort_order", limit: 200 } }
      ),
  })

  const { data: setsData } = useQuery({
    queryKey: ["offering-sets"],
    queryFn: () =>
      sdk.client.fetch<{ offering_sets: AdminOfferingSet[] }>(
        "/admin/offering-sets"
      ),
  })

  const allOfferings = offeringsData?.offerings ?? []
  const offerings =
    categoryFilter === "all"
      ? allOfferings
      : allOfferings.filter((o) => o.category === categoryFilter)
  const sortable = categoryFilter === "all"
  const nextSortOrder =
    allOfferings.reduce((max, offering) => Math.max(max, offering.sort_order ?? 0), 0) +
    10
  const sets = setsData?.offering_sets ?? []

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Print Offerings</Heading>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Prodigi SKUs available for print products
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          <Button
            size="small"
            variant="secondary"
            onClick={() => navigate("/prodigi/offering-sets")}
          >
            Offering Sets
          </Button>
          <Button size="small" onClick={() => setAddOpen(true)}>
            + Add SKU
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-x-2 px-6 py-4">
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Category
        </Text>
        <div className="w-40">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <Select.Trigger>
              <Select.Value placeholder="All" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All</Select.Item>
              {CATEGORIES.map((c) => (
                <Select.Item key={c} value={c}>
                  {c}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        {sortable && allOfferings.length > 1 && (
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Drag rows using the handle to set display order.
          </Text>
        )}
        {!sortable && categoryFilter !== "all" && (
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Clear the category filter to drag and reorder offerings.
          </Text>
        )}
      </div>

      <div className="px-6 py-4">
        {isLoading ? (
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Loading offerings...
          </Text>
        ) : offerings.length === 0 ? (
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            No print offerings yet. Click "+ Add SKU" to add your first Prodigi
            SKU.
          </Text>
        ) : (
          <OfferingsTable
            offerings={offerings}
            sortable={sortable}
            onSelect={setEditing}
          />
        )}
      </div>

      <AddOfferingModal
        open={addOpen}
        onOpenChange={setAddOpen}
        sets={sets}
        nextSortOrder={nextSortOrder}
      />
      <EditOfferingDrawer
        key={editing?.id ?? "none"}
        offering={editing}
        sets={sets}
        onOpenChange={(open) => !open && setEditing(null)}
        onOfferingUpdated={setEditing}
      />
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Print Catalog",
  rank: 0,
})

export default PrintCatalogPage
