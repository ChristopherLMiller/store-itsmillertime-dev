import { Button, Text } from "@medusajs/ui"
import {
  buildSuggestedLabel,
  formatDisplaySize,
} from "../../modules/prodigi/parse-product-specs"
import type {
  AdminPrintOffering,
  ProdigiAttributeSpecs,
  ProdigiFetchedSpecs,
  ProdigiPrintAreaSpecs,
} from "./print-catalog-types"
import {
  formatPrintAreaLabel,
  formatPrintAreaSize,
} from "../../modules/prodigi/parse-prodigi-print-areas"

type SpecsSource = ProdigiFetchedSpecs | AdminPrintOffering

const isFetchedSpecs = (source: SpecsSource): source is ProdigiFetchedSpecs =>
  "description" in source && typeof source.description === "string"

export function suggestedLabelFromOffering(
  offering: Pick<
    AdminPrintOffering,
    "width" | "height" | "paper_type" | "weight_gsm" | "substrate" | "label"
  >
): string {
  const built = buildSuggestedLabel({
    width: offering.width,
    height: offering.height,
    units: "in",
    paper_type: offering.paper_type,
    weight_gsm: offering.weight_gsm,
  })

  return built || offering.label
}

export function suggestedLabelFromFetched(product: ProdigiFetchedSpecs): string {
  return product.suggested_label || product.description
}

function SpecRow({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return null
  }

  return (
    <div className="flex items-start justify-between gap-x-4">
      <Text size="small" leading="compact" className="text-ui-fg-subtle shrink-0">
        {label}
      </Text>
      <Text size="small" leading="compact" className="text-right">
        {value}
      </Text>
    </div>
  )
}

function resolveDisplaySpecs(
  source: SpecsSource,
  attributeSpecs?: ProdigiAttributeSpecs
) {
  const fetched = isFetchedSpecs(source)
  const specs = attributeSpecs ?? (fetched ? source.attribute_specs : undefined)

  const size =
    specs?.size ??
    formatDisplaySize(
      source.width,
      source.height,
      fetched ? source.units : "in"
    )

  return {
    size,
    paper_type: specs?.paper_type ?? source.paper_type,
    weight_gsm: specs?.weight_gsm ?? source.weight_gsm,
    substrate: specs?.substrate ?? source.substrate,
    other: specs?.other ?? {},
    order_options: specs?.order_options ?? {},
  }
}

export const ProdigiSpecsCard = ({
  source,
  attributes,
  attributeSpecs,
  printAreaSpecs,
  onUseSuggestedLabel,
}: {
  source: SpecsSource
  attributes?: Record<string, string[]>
  attributeSpecs?: ProdigiAttributeSpecs
  printAreaSpecs?: ProdigiPrintAreaSpecs
  onUseSuggestedLabel?: (label: string) => void
}) => {
  const fetched = isFetchedSpecs(source)
  const sku = fetched ? source.sku : source.prodigi_sku
  const display = resolveDisplaySpecs(source, attributeSpecs)
  const printAreas =
    printAreaSpecs ?? (fetched ? source.print_area_specs : undefined)
  const suggested = fetched
    ? suggestedLabelFromFetched(source)
    : buildSuggestedLabel({
        size_label: display.size,
        paper_type: display.paper_type,
        weight_gsm: display.weight_gsm,
      }) || suggestedLabelFromOffering(source)

  const rawAttributeLines = attributes
    ? Object.entries(attributes).map(
        ([name, values]) => `${name}: ${values.join(", ")}`
      )
    : []

  return (
    <div className="bg-ui-bg-subtle flex flex-col gap-y-2 rounded-md px-4 py-3">
      <Text size="small" leading="compact" weight="plus">
        Prodigi product details
      </Text>

      <SpecRow label="SKU" value={sku} />
      <SpecRow label="Size" value={display.size} />
      <SpecRow label="Paper / product" value={display.paper_type} />
      <SpecRow
        label="Weight"
        value={display.weight_gsm ? `${display.weight_gsm} gsm` : null}
      />
      <SpecRow label="Finish / substrate" value={display.substrate} />

      {printAreas?.primary && (
        <>
          <SpecRow
            label="Print resolution"
            value={formatPrintAreaSize(printAreas.primary)}
          />
          <SpecRow
            label="Print area"
            value={
              printAreas.primary.print_area === "default"
                ? "default"
                : printAreas.primary.print_area
            }
          />
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Upload at least {formatPrintAreaSize(printAreas.primary)} for best
            results. Smaller images may upsample and lose sharpness.
          </Text>
        </>
      )}

      {printAreas && printAreas.areas.length > 1 && (
        <div className="flex flex-col gap-y-1">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            All print area sizes
          </Text>
          {printAreas.areas.map((area) => (
            <Text
              key={`${area.print_area}-${area.horizontal_px}-${area.vertical_px}-${area.variant_label ?? ""}`}
              size="small"
              leading="compact"
            >
              {formatPrintAreaLabel(area)}
            </Text>
          ))}
        </div>
      )}

      {Object.entries(display.other).map(([label, value]) => (
        <SpecRow key={label} label={label} value={value} />
      ))}

      {Object.entries(display.order_options).map(([label, values]) => (
        <SpecRow key={label} label={label} value={values.join(", ")} />
      ))}

      {fetched && (
        <SpecRow label="Prodigi description" value={source.description} />
      )}

      {rawAttributeLines.length > 0 && (
        <div className="border-ui-border-base mt-1 border-t pt-2">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Raw Prodigi attributes
          </Text>
          {rawAttributeLines.map((line) => (
            <Text
              key={line}
              size="small"
              leading="compact"
              className="text-ui-fg-subtle"
            >
              {line}
            </Text>
          ))}
        </div>
      )}

      <div className="border-ui-border-base mt-1 border-t pt-2">
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Suggested storefront label
        </Text>
        <Text size="small" leading="compact" weight="plus">
          {suggested}
        </Text>
        {onUseSuggestedLabel && suggested && (
          <Button
            type="button"
            size="small"
            variant="secondary"
            className="mt-2"
            onClick={() => onUseSuggestedLabel(suggested)}
          >
            Use suggested label
          </Button>
        )}
      </div>
    </div>
  )
}
