import { HttpTypes } from "@medusajs/types"
import {
  FINISH_OPTION_TITLE,
  FORMAT_OPTION_TITLE,
  getFinishesForPaperAndFormat,
  getFormatsForPaper,
  getVariantOptionValue,
  PAPER_OPTION_TITLE,
} from "./product-options"

export type PrintSize = {
  width: number
  height: number
}

export type PaperPresentation = {
  name: string
  hint: string
}

const PAPER_PRESENTATION: Record<string, PaperPresentation> = {
  Digital: {
    name: "Digital download",
    hint: "Full-resolution files, no physical print",
  },
  "Lustre Photo Paper": {
    name: "Lustre",
    hint: "Classic photo paper with a soft sheen",
  },
  "Hahnemühle photo rag": {
    name: "Hahnemühle Photo Rag",
    hint: "Cotton fine-art rag, 308 gsm",
  },
  "Continuous-tone silver halide photo print": {
    name: "C-Type",
    hint: "Traditional silver halide, wet process",
  },
}

const FINISH_LABELS: Record<string, string> = {
  gloss: "Gloss",
  lustre: "Lustre",
  Standard: "Standard",
}

const PREFERRED_PAPER_ORDER = [
  "Lustre Photo Paper",
  "Hahnemühle photo rag",
  "Continuous-tone silver halide photo print",
  "Digital",
]

const SIZE_PATTERN = /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i

export function isPrintProduct(
  product: Pick<HttpTypes.StoreProduct, "options"> | null | undefined
): boolean {
  const titles = new Set((product?.options ?? []).map((option) => option.title))
  return titles.has(PAPER_OPTION_TITLE) && titles.has(FORMAT_OPTION_TITLE)
}

export function isDigitalPaper(paper: string | undefined): boolean {
  return (paper ?? "").trim().toLowerCase() === "digital"
}

export function parsePrintSize(value: string | undefined | null): PrintSize | null {
  if (!value) {
    return null
  }

  const match = value.match(SIZE_PATTERN)
  if (!match) {
    return null
  }

  const width = Number(match[1])
  const height = Number(match[2])
  if (!Number.isFinite(width) || !Number.isFinite(height) || !width || !height) {
    return null
  }

  return { width, height }
}

export function formatSizeLabel(value: string): string {
  const size = parsePrintSize(value)
  if (!size) {
    if (/digital/i.test(value)) {
      return "Digital download"
    }
    return value.split("·")[0]?.trim() || value
  }

  return `${formatDimension(size.width)} × ${formatDimension(size.height)}″`
}

export function paperPresentation(paper: string): PaperPresentation {
  return (
    PAPER_PRESENTATION[paper] ?? {
      name: paper,
      hint: "",
    }
  )
}

export function finishLabel(finish: string): string {
  return FINISH_LABELS[finish] ?? capitalize(finish)
}

export function sizeArea(value: string): number {
  const size = parsePrintSize(value)
  if (!size) {
    return Number.POSITIVE_INFINITY
  }
  return size.width * size.height
}

export function sortFormatValues(values: string[]): string[] {
  return [...values].sort((a, b) => {
    const areaDiff = sizeArea(a) - sizeArea(b)
    if (areaDiff !== 0) {
      return areaDiff
    }
    return formatSizeLabel(a).localeCompare(formatSizeLabel(b), undefined, {
      numeric: true,
    })
  })
}

export function tileAspectStyle(
  value: string,
  orientation: "landscape" | "portrait" | "square"
): { aspectRatio: string } {
  const size = parsePrintSize(value)
  if (!size) {
    return { aspectRatio: "4 / 3" }
  }

  const short = Math.min(size.width, size.height)
  const long = Math.max(size.width, size.height)

  if (orientation === "square" || short === long) {
    return { aspectRatio: `${size.width} / ${size.height}` }
  }

  if (orientation === "landscape") {
    return { aspectRatio: `${long} / ${short}` }
  }

  return { aspectRatio: `${short} / ${long}` }
}

export function preferredPaperValue(papers: string[]): string | undefined {
  for (const preferred of PREFERRED_PAPER_ORDER) {
    if (papers.includes(preferred)) {
      return preferred
    }
  }
  return papers.find((paper) => !isDigitalPaper(paper)) ?? papers[0]
}

export function preferredFormatValue(formats: string[]): string | undefined {
  if (!formats.length) {
    return undefined
  }

  const eightByTen = formats.find((value) => {
    const size = parsePrintSize(value)
    return (
      !!size &&
      ((size.width === 8 && size.height === 10) ||
        (size.width === 10 && size.height === 8))
    )
  })

  if (eightByTen) {
    return eightByTen
  }

  return sortFormatValues(formats)[0]
}

export function variantOptionsMap(
  variant: HttpTypes.StoreProductVariant | undefined
): Record<string, string | undefined> {
  return (
    variant?.options?.reduce((acc: Record<string, string>, varopt) => {
      if (varopt.option_id) {
        acc[varopt.option_id] = varopt.value
      }
      return acc
    }, {}) ?? {}
  )
}

export function initialPrintOptions(
  product: HttpTypes.StoreProduct,
  variantId?: string | null
): Record<string, string | undefined> {
  const fromUrl = product.variants?.find((variant) => variant.id === variantId)
  if (fromUrl) {
    return variantOptionsMap(fromUrl)
  }

  if (product.variants?.length === 1) {
    return variantOptionsMap(product.variants[0])
  }

  if (!isPrintProduct(product)) {
    return {}
  }

  const paperOption = product.options?.find(
    (option) => option.title === PAPER_OPTION_TITLE
  )
  const formatOption = product.options?.find(
    (option) => option.title === FORMAT_OPTION_TITLE
  )
  const finishOption = product.options?.find(
    (option) => option.title === FINISH_OPTION_TITLE
  )

  if (!paperOption) {
    return {}
  }

  const papers = (paperOption.values ?? []).map((entry) => entry.value)
  const paper = preferredPaperValue(papers)
  const formatValuesByPaper = getFormatsForPaper(product)
  const formats = paper ? Array.from(formatValuesByPaper.get(paper) ?? []) : []
  const format = preferredFormatValue(formats)
  const next: Record<string, string | undefined> = {}
  if (paper) {
    next[paperOption.id] = paper
  }
  if (format && formatOption) {
    next[formatOption.id] = format
  }

  if (!finishOption || !paper || !format) {
    return next
  }

  const allowed = getFinishesForPaperAndFormat(product).get(`${paper}::${format}`)
  if (!allowed?.size) {
    return next
  }

  const firstFinish = finishOption.values?.find((entry) =>
    allowed.has(entry.value)
  )?.value
  if (firstFinish) {
    next[finishOption.id] = firstFinish
  }

  return next
}

export function findVariantForSelection(
  product: HttpTypes.StoreProduct,
  selection: {
    paper?: string
    format?: string
    finish?: string
  }
): HttpTypes.StoreProductVariant | undefined {
  return product.variants?.find((variant) => {
    const paper = getVariantOptionValue(
      variant,
      PAPER_OPTION_TITLE,
      product.options
    )
    const format = getVariantOptionValue(
      variant,
      FORMAT_OPTION_TITLE,
      product.options
    )
    const finish = getVariantOptionValue(
      variant,
      FINISH_OPTION_TITLE,
      product.options
    )

    if (selection.paper && paper !== selection.paper) {
      return false
    }
    if (selection.format && format !== selection.format) {
      return false
    }
    if (selection.finish && finish && finish !== selection.finish) {
      return false
    }
    return true
  })
}

function formatDimension(value: number): string {
  return Number.isInteger(value) || value % 1 === 0
    ? String(Math.round(value))
    : String(Number(value.toFixed(1)))
}

function capitalize(value: string): string {
  if (!value) {
    return value
  }
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function compactVariantTitle(title: string | null | undefined): string {
  if (!title) {
    return ""
  }

  const parts = title.split("·").map((part) => part.trim()).filter(Boolean)
  if (!parts.length) {
    return ""
  }

  const paper = paperPresentation(parts[0]).name
  const size = parts[1] ? formatSizeLabel(parts[1]) : null
  const finish =
    parts[2] && parts[2] !== "Standard" ? finishLabel(parts[2]) : null

  return [paper, size, finish].filter(Boolean).join(" · ")
}

export function compactSelectionLabel(
  options: Record<string, string | undefined>,
  paperOption?: HttpTypes.StoreProductOption,
  formatOption?: HttpTypes.StoreProductOption,
  finishOption?: HttpTypes.StoreProductOption
): string {
  const paper = paperOption ? options[paperOption.id] : undefined
  const format = formatOption ? options[formatOption.id] : undefined
  const finish = finishOption ? options[finishOption.id] : undefined

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
