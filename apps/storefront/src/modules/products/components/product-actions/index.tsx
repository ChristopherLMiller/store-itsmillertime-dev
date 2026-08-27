"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import {
  FINISH_OPTION_TITLE,
  FORMAT_OPTION_TITLE,
  getFinishesForPaperAndFormat,
  getFormatsForPaper,
  getSortedProductOptions,
  PAPER_OPTION_TITLE,
} from "@lib/util/product-options"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const countryCode = useParams().countryCode as string

  const sortedOptions = useMemo(
    () => getSortedProductOptions(product.options),
    [product.options]
  )

  const paperOption = useMemo(
    () => sortedOptions.find((option) => option.title === PAPER_OPTION_TITLE),
    [sortedOptions]
  )

  const formatOption = useMemo(
    () => sortedOptions.find((option) => option.title === FORMAT_OPTION_TITLE),
    [sortedOptions]
  )

  const finishOption = useMemo(
    () => sortedOptions.find((option) => option.title === FINISH_OPTION_TITLE),
    [sortedOptions]
  )

  const selectedPaper = paperOption ? options[paperOption.id] : undefined
  const selectedFormat = formatOption ? options[formatOption.id] : undefined

  const formatValuesByPaper = useMemo(
    () => getFormatsForPaper(product),
    [product]
  )

  const finishValuesByPaperFormat = useMemo(
    () => getFinishesForPaperAndFormat(product),
    [product]
  )

  const allowedFinishes = useMemo(() => {
    if (!selectedPaper || !selectedFormat) {
      return undefined
    }
    return finishValuesByPaperFormat.get(`${selectedPaper}::${selectedFormat}`)
  }, [finishValuesByPaperFormat, selectedPaper, selectedFormat])

  const showFinishPicker = (allowedFinishes?.size ?? 0) > 1

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  const withValidFinish = (
    next: Record<string, string | undefined>,
    paper: string | undefined,
    format: string | undefined
  ) => {
    if (!finishOption || !paper || !format) {
      return next
    }

    const allowed = finishValuesByPaperFormat.get(`${paper}::${format}`)
    if (!allowed?.size) {
      return next
    }

    const currentFinish = next[finishOption.id]
    if (currentFinish && allowed.has(currentFinish)) {
      return next
    }

    const firstFinish = finishOption.values?.find((entry) =>
      allowed.has(entry.value)
    )?.value

    return {
      ...next,
      [finishOption.id]: firstFinish,
    }
  }

  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => {
      let next = {
        ...prev,
        [optionId]: value,
      }

      if (paperOption?.id === optionId) {
        const allowedFormats = formatValuesByPaper.get(value)
        if (allowedFormats?.size && formatOption) {
          const currentFormat = next[formatOption.id]
          if (!currentFormat || !allowedFormats.has(currentFormat)) {
            next = {
              ...next,
              [formatOption.id]: formatOption.values?.find((entry) =>
                allowedFormats.has(entry.value)
              )?.value,
            }
          }
        }

        return withValidFinish(
          next,
          value,
          formatOption ? next[formatOption.id] : undefined
        )
      }

      if (formatOption?.id === optionId) {
        return withValidFinish(next, selectedPaper, value)
      }

      return next
    })
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    await addToCart({
      variantId: selectedVariant.id,
      quantity: 1,
      countryCode,
    })

    setIsAdding(false)
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {sortedOptions.map((option) => {
                if (
                  option.title === FINISH_OPTION_TITLE &&
                  !showFinishPicker
                ) {
                  return null
                }

                const allowedValues =
                  option.title === FORMAT_OPTION_TITLE && selectedPaper
                    ? formatValuesByPaper.get(selectedPaper)
                    : option.title === FINISH_OPTION_TITLE
                      ? allowedFinishes
                      : undefined

                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                      allowedValues={allowedValues}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        <ProductPrice product={product} variant={selectedVariant} />

        <Button
          onClick={handleAddToCart}
          disabled={
            !inStock ||
            !selectedVariant ||
            !!disabled ||
            isAdding ||
            !isValidVariant
          }
          variant="primary"
          className="w-full h-10"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {!selectedVariant && !options
            ? "Select variant"
            : !inStock || !isValidVariant
            ? "Out of stock"
            : "Add to cart"}
        </Button>
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
          sortedOptions={sortedOptions}
          formatValuesByPaper={formatValuesByPaper}
          selectedPaper={selectedPaper}
          allowedFinishes={allowedFinishes}
          showFinishPicker={showFinishPicker}
        />
      </div>
    </>
  )
}
