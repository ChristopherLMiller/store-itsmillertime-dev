import { getProductPrice } from "@lib/util/get-product-price"
import {
  finishLabel,
  findVariantForSelection,
  formatSizeLabel,
  isDigitalPaper,
  paperPresentation,
  sortFormatValues,
  tileAspectStyle,
} from "@lib/util/print-format"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"

type PrintOptionsProps = {
  product: HttpTypes.StoreProduct
  paperOption?: HttpTypes.StoreProductOption
  formatOption?: HttpTypes.StoreProductOption
  finishOption?: HttpTypes.StoreProductOption
  options: Record<string, string | undefined>
  updateOption: (optionId: string, value: string) => void
  formatValuesByPaper: Map<string, Set<string>>
  allowedFinishes?: Set<string>
  showFinishPicker: boolean
  disabled?: boolean
  photoOrientation?: "landscape" | "portrait" | "square"
}

const PrintOptions = ({
  product,
  paperOption,
  formatOption,
  finishOption,
  options,
  updateOption,
  formatValuesByPaper,
  allowedFinishes,
  showFinishPicker,
  disabled,
  photoOrientation = "landscape",
}: PrintOptionsProps) => {
  const selectedPaper = paperOption ? options[paperOption.id] : undefined
  const selectedFormat = formatOption ? options[formatOption.id] : undefined
  const selectedFinish = finishOption ? options[finishOption.id] : undefined

  const paperValues = (paperOption?.values ?? []).map((entry) => entry.value)
  const formatValues = sortFormatValues(
    selectedPaper
      ? Array.from(formatValuesByPaper.get(selectedPaper) ?? [])
      : []
  )
  const finishValues = (finishOption?.values ?? [])
    .map((entry) => entry.value)
    .filter((value) => !allowedFinishes || allowedFinishes.has(value))

  const digitalSelected = isDigitalPaper(selectedPaper)

  return (
    <div className="flex flex-col gap-8">
      {paperOption && (
        <fieldset disabled={disabled} className="min-w-0">
          <legend className="text-sm font-medium text-stone-800 mb-3">
            Paper
          </legend>
          <div className="flex flex-col gap-2">
            {paperValues.map((value) => {
              const presented = paperPresentation(value)
              const selected = value === selectedPaper
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateOption(paperOption.id, value)}
                  className={clx(
                    "text-left rounded-md border px-3 py-3 transition-colors",
                    selected
                      ? "border-stone-900 bg-white"
                      : "border-stone-200 bg-white/60 hover:border-stone-400"
                  )}
                  data-testid="paper-option"
                >
                  <span className="block text-sm text-stone-900">
                    {presented.name}
                  </span>
                  {presented.hint && (
                    <span className="block text-xs text-stone-500 mt-0.5">
                      {presented.hint}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      {formatOption && !digitalSelected && formatValues.length > 0 && (
        <fieldset disabled={disabled} className="min-w-0">
          <legend className="text-sm font-medium text-stone-800 mb-3">
            Size
          </legend>
          <div className="grid grid-cols-3 gap-2 max-h-[22rem] overflow-y-auto pr-1">
            {formatValues.map((value) => {
              const selected = value === selectedFormat
              const variant = findVariantForSelection(product, {
                paper: selectedPaper,
                format: value,
                finish: selectedFinish,
              })
              const price = getProductPrice({
                product,
                variantId: variant?.id,
              }).variantPrice

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateOption(formatOption.id, value)}
                  className={clx(
                    "flex flex-col items-center gap-2 rounded-md border px-2 py-3 transition-colors",
                    selected
                      ? "border-stone-900 bg-white"
                      : "border-stone-200 bg-white/60 hover:border-stone-400"
                  )}
                  data-testid="format-option"
                >
                  <span
                    className="w-10 max-w-full border border-stone-400/80 bg-stone-100"
                    style={tileAspectStyle(value, photoOrientation)}
                    aria-hidden
                  />
                  <span className="text-xs text-stone-900 leading-tight">
                    {formatSizeLabel(value)}
                  </span>
                  {price && (
                    <span className="text-[11px] text-stone-500">
                      {price.calculated_price}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      {finishOption && showFinishPicker && (
        <fieldset disabled={disabled} className="min-w-0">
          <legend className="text-sm font-medium text-stone-800 mb-3">
            Finish
          </legend>
          <div className="flex flex-wrap gap-2">
            {finishValues.map((value) => {
              const selected = value === selectedFinish
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateOption(finishOption.id, value)}
                  className={clx(
                    "rounded-full border px-3 py-1.5 text-sm capitalize transition-colors",
                    selected
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 bg-white hover:border-stone-400"
                  )}
                  data-testid="finish-option"
                >
                  {finishLabel(value)}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}
    </div>
  )
}

export default PrintOptions
