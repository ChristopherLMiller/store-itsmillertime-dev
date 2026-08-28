import { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"
import {
  FINISH_OPTION_TITLE,
  FORMAT_OPTION_TITLE,
  getVariantOptionValue,
  PAPER_OPTION_TITLE,
} from "@lib/util/product-options"
import {
  finishLabel,
  formatSizeLabel,
  isDigitalPaper,
  paperPresentation,
  compactVariantTitle,
} from "@lib/util/print-format"

type LineItemOptionsProps = {
  variant: HttpTypes.StoreProductVariant | undefined
  "data-testid"?: string
  "data-value"?: HttpTypes.StoreProductVariant
}

const LineItemOptions = ({
  variant,
  "data-testid": dataTestid,
  "data-value": dataValue,
}: LineItemOptionsProps) => {
  const summary = printSelectionSummary(variant)

  return (
    <Text
      data-testid={dataTestid}
      data-value={dataValue}
      className="inline-block txt-medium text-stone-500 w-full overflow-hidden text-ellipsis"
    >
      {summary}
    </Text>
  )
}

function printSelectionSummary(
  variant: HttpTypes.StoreProductVariant | undefined
): string {
  if (!variant) {
    return ""
  }

  const productOptions = variant.product?.options
  const paper = getVariantOptionValue(
    variant,
    PAPER_OPTION_TITLE,
    productOptions
  )
  const format = getVariantOptionValue(
    variant,
    FORMAT_OPTION_TITLE,
    productOptions
  )
  const finish = getVariantOptionValue(
    variant,
    FINISH_OPTION_TITLE,
    productOptions
  )

  if (!paper && !format) {
    return compactVariantTitle(variant.title)
  }

  const parts: string[] = []
  if (paper) {
    parts.push(paperPresentation(paper).name)
  }
  if (format && !isDigitalPaper(paper)) {
    parts.push(formatSizeLabel(format))
  }
  if (finish && finish !== "Standard") {
    parts.push(finishLabel(finish))
  }

  return parts.join(" · ")
}

export default LineItemOptions
