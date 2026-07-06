import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import {
  Button,
  Checkbox,
  Container,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { sdk } from "../lib/client"
import { invalidateProductQueries } from "../lib/invalidate-product-queries"
import type { AdminOfferingSet } from "../lib/print-catalog-types"
import { parseDigitalDownloadFiles } from "../../utils/digital-files"

const FORMAT_OPTION_TITLE = "Format"

function getPrimaryImageUrl(product: HttpTypes.AdminProduct): string | null {
  if (product.thumbnail) {
    return product.thumbnail
  }

  return product.images?.[0]?.url ?? null
}

function isLocalhostUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".local")
    )
  } catch {
    return false
  }
}

function isPhotoProduct(
  product: HttpTypes.AdminProduct,
  hasOfferingSet: boolean
): boolean {
  if (hasOfferingSet) {
    return true
  }

  const metadata = (product.metadata as Record<string, unknown> | null) ?? {}

  if (metadata.sells_digital === true) {
    return true
  }

  if (typeof metadata.print_asset_url === "string" && metadata.print_asset_url) {
    return true
  }

  if (product.options?.some((option) => option.title === FORMAT_OPTION_TITLE)) {
    return true
  }

  return (product.variants ?? []).some((variant) => {
    const variantMetadata =
      (variant.metadata as Record<string, unknown> | null) ?? {}
    return (
      variantMetadata.fulfillment_type === "print" ||
      variantMetadata.fulfillment_type === "digital"
    )
  })
}

function useHideAttributesForPhotoProducts(
  product: HttpTypes.AdminProduct,
  hasOfferingSet: boolean
) {
  const shouldHide = isPhotoProduct(product, hasOfferingSet)

  useEffect(() => {
    if (!shouldHide) {
      return
    }

    const hideAttributesSection = () => {
      const headings = document.querySelectorAll("h2")

      for (const heading of headings) {
        if (heading.textContent?.trim() !== "Attributes") {
          continue
        }

        const container = heading.closest('[class*="rounded"]')

        if (container instanceof HTMLElement) {
          container.hidden = true
        }
      }
    }

    hideAttributesSection()

    const observer = new MutationObserver(hideAttributesSection)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()

      const headings = document.querySelectorAll("h2")

      for (const heading of headings) {
        if (heading.textContent?.trim() !== "Attributes") {
          continue
        }

        const container = heading.closest('[class*="rounded"]')

        if (container instanceof HTMLElement) {
          container.hidden = false
        }
      }
    }
  }, [shouldHide, product.id])
}

const ProductProdigiSetupWidget = ({
  data: product,
}: DetailWidgetProps<HttpTypes.AdminProduct>) => {
  const queryClient = useQueryClient()
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)
  const [sellsDigital, setSellsDigital] = useState(false)
  const [printUsesProductImage, setPrintUsesProductImage] = useState(true)
  const [digitalUsesProductImage, setDigitalUsesProductImage] = useState(true)

  const { data: currentData, isLoading: offeringSetLoading } = useQuery({
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

  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ["product-print-settings", product.id],
    queryFn: () =>
      sdk.admin.product.retrieve(product.id, {
        fields: "metadata,thumbnail,*images,*options,variants.metadata",
      }),
  })

  const fullProduct = productData?.product ?? product
  const metadata =
    (fullProduct.metadata as Record<string, unknown> | null) ?? {}

  const primaryImageUrl = useMemo(
    () => getPrimaryImageUrl(fullProduct),
    [fullProduct]
  )

  const hasDigitalVariant = useMemo(
    () =>
      (fullProduct.variants ?? []).some(
        (variant) =>
          (variant.metadata as Record<string, unknown> | null)
            ?.fulfillment_type === "digital"
      ),
    [fullProduct.variants]
  )

  const currentSet = currentData?.offering_set ?? null
  const sets = setsData?.offering_sets ?? []
  const defaultSet = sets.find((set) => set.is_default)

  useHideAttributesForPhotoProducts(fullProduct, !!currentSet)

  const effectiveSelection =
    selectedSetId ?? currentSet?.id ?? defaultSet?.id ?? undefined

  const isReapply =
    !!currentSet && effectiveSelection === currentSet.id

  useEffect(() => {
    setSellsDigital(metadata.sells_digital === true)

    const savedPrintUrl =
      typeof metadata.print_asset_url === "string"
        ? metadata.print_asset_url
        : ""
    const savedDigitalUrl =
      parseDigitalDownloadFiles(metadata)[0]?.url ?? ""

    setPrintUsesProductImage(
      !savedPrintUrl ||
        (!!primaryImageUrl && savedPrintUrl === primaryImageUrl)
    )
    setDigitalUsesProductImage(
      !savedDigitalUrl ||
        (!!primaryImageUrl && savedDigitalUrl === primaryImageUrl)
    )
  }, [
    metadata.sells_digital,
    metadata.print_asset_url,
    metadata.digital_download_files,
    primaryImageUrl,
  ])

  const savedSellsDigital = metadata.sells_digital === true
  const savedPrintAssetUrl =
    typeof metadata.print_asset_url === "string"
      ? metadata.print_asset_url
      : ""
  const savedDigitalDownloadUrl =
    parseDigitalDownloadFiles(metadata)[0]?.url ?? ""

  const resolvedPrintUrl = printUsesProductImage
    ? primaryImageUrl ?? ""
    : savedPrintAssetUrl
  const resolvedDigitalUrl = digitalUsesProductImage
    ? primaryImageUrl ?? ""
    : savedDigitalDownloadUrl

  const settingsDirty =
    sellsDigital !== savedSellsDigital ||
    resolvedPrintUrl.trim() !== savedPrintAssetUrl.trim() ||
    resolvedDigitalUrl.trim() !== savedDigitalDownloadUrl.trim()

  const persistPrintSettings = async () => {
    const printAssetUrl = resolvedPrintUrl.trim()
    const digitalDownloadUrl = resolvedDigitalUrl.trim()

    await sdk.admin.product.update(product.id, {
      metadata: {
        ...metadata,
        sells_digital: sellsDigital,
        print_asset_url: printAssetUrl || null,
        digital_download_files: digitalDownloadUrl
          ? [{ url: digitalDownloadUrl }]
          : null,
      },
    })
  }

  const refreshProductData = async () => {
    await invalidateProductQueries(queryClient, product.id)
    await queryClient.invalidateQueries({
      queryKey: ["product-offering-set", product.id],
    })
    await queryClient.invalidateQueries({
      queryKey: ["product-print-settings", product.id],
    })
  }

  const applySet = useMutation({
    mutationFn: async (offering_set_id: string) => {
      if (settingsDirty) {
        await persistPrintSettings()
      }

      return sdk.client.fetch<{ created_variants: number }>(
        `/admin/products/${product.id}/offering-set`,
        {
          method: "POST",
          body: { offering_set_id, sells_digital: sellsDigital },
        }
      )
    },
    onSuccess: async (result) => {
      await refreshProductData()
      toast.success(
        `Offering set applied - ${result.created_variants} variant(s) created`
      )
      setSelectedSetId(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to apply offering set")
    },
  })

  const saveSettings = useMutation({
    mutationFn: async () => {
      await persistPrintSettings()

      if (!sellsDigital || hasDigitalVariant) {
        return { createdDigitalVariant: false, needsOfferingSet: false }
      }

      const { offering_set } = await sdk.client.fetch<{
        offering_set: { id: string; name: string } | null
      }>(`/admin/products/${product.id}/offering-set`)

      if (!offering_set?.id) {
        return { createdDigitalVariant: false, needsOfferingSet: true }
      }

      const { created_variants } = await sdk.client.fetch<{
        created_variants: number
      }>(`/admin/products/${product.id}/offering-set`, {
        method: "POST",
        body: {
          offering_set_id: offering_set.id,
          sells_digital: sellsDigital,
        },
      })

      return {
        createdDigitalVariant: created_variants > 0,
        needsOfferingSet: false,
      }
    },
    onSuccess: async ({ createdDigitalVariant, needsOfferingSet }) => {
      await refreshProductData()

      if (createdDigitalVariant) {
        toast.success(
          "Settings saved and Digital Download variant created. Set its price under Variants."
        )
      } else if (needsOfferingSet) {
        toast.success(
          "Settings saved. Apply an offering set to create the Digital Download variant."
        )
      } else {
        toast.success("Settings saved")
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save settings")
    },
  })

  const useProductImageForPrint = () => {
    if (!primaryImageUrl) {
      toast.error("No product image uploaded yet")
      return
    }

    setPrintUsesProductImage(true)
  }

  const useProductImageForDigital = () => {
    if (!primaryImageUrl) {
      toast.error("No product image uploaded yet")
      return
    }

    setDigitalUsesProductImage(true)
  }

  const printUrlWarning =
    resolvedPrintUrl.trim() && isLocalhostUrl(resolvedPrintUrl.trim())
      ? "Prodigi cannot fetch localhost URLs. Use a public URL (e.g. R2) in production."
      : null

  const isLoading = offeringSetLoading || productLoading

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Text size="small" leading="compact" weight="plus">
            Prodigi offering set
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {isLoading
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
          onClick={() =>
            effectiveSelection && applySet.mutate(effectiveSelection)
          }
          isLoading={applySet.isPending}
          disabled={!effectiveSelection}
        >
          {currentSet
            ? isReapply
              ? "Re-apply"
              : "Switch set"
            : "Apply set"}
        </Button>
      </div>

      <div className="px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Print & digital
        </Text>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Point Prodigi and digital delivery at your product image
        </Text>
      </div>

      <div className="flex flex-col gap-y-4 px-6 py-4">
        <div className="flex flex-col gap-y-2">
          <Text size="small" leading="compact" weight="plus">
            Print file
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {printUsesProductImage
              ? primaryImageUrl
                ? "Using the uploaded product image"
                : "Upload a product image first"
              : "Using a custom file from metadata"}
          </Text>
          {printUrlWarning && (
            <Text size="small" leading="compact" className="text-ui-fg-error">
              {printUrlWarning}
            </Text>
          )}
          <div>
            <Button
              size="small"
              variant="secondary"
              onClick={useProductImageForPrint}
              disabled={!primaryImageUrl || saveSettings.isPending}
            >
              Use product image
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-y-2">
          <Text size="small" leading="compact" weight="plus">
            Digital download file
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {digitalUsesProductImage
              ? primaryImageUrl
                ? "Using the uploaded product image"
                : "Upload a product image first"
              : savedDigitalDownloadUrl
                ? "Using a custom file from metadata"
                : "Falls back to the print file at fulfillment time"}
          </Text>
          <div>
            <Button
              size="small"
              variant="secondary"
              onClick={useProductImageForDigital}
              disabled={!primaryImageUrl || saveSettings.isPending}
            >
              Use product image
            </Button>
          </div>
        </div>

        <label className="flex items-start gap-x-2">
          <Checkbox
            checked={sellsDigital}
            onCheckedChange={(checked) => setSellsDigital(checked === true)}
            disabled={saveSettings.isPending}
          />
          <div className="flex flex-col gap-y-1">
            <Text size="small" leading="compact">
              Sell digital download
            </Text>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              Creates a &quot;Digital Download&quot; format variant (included when
              you apply or re-apply an offering set with this checked).
              {hasDigitalVariant
                ? " Digital variant exists — set its price under Variants if needed."
                : sellsDigital
                  ? " Apply or save to create it."
                  : ""}
            </Text>
          </div>
        </label>

        <div className="flex justify-end">
          <Button
            size="small"
            onClick={() => saveSettings.mutate()}
            isLoading={saveSettings.isPending}
            disabled={!settingsDirty || isLoading}
          >
            Save
          </Button>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
})

export default ProductProdigiSetupWidget
