"use client"

import FastDelivery from "@modules/common/icons/fast-delivery"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
  printProduct?: boolean
}

const ProductTabs = ({ product, printProduct }: ProductTabsProps) => {
  const tabs = printProduct
    ? [
        {
          label: "Printing & shipping",
          component: <PrintShippingTab />,
        },
      ]
    : [
        {
          label: "Product Information",
          component: <ProductInfoTab product={product} />,
        },
        {
          label: "Shipping & Returns",
          component: <ShippingInfoTab />,
        },
      ]

  return (
    <div className="w-full border-t border-stone-200 pt-2">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  return (
    <div className="text-small-regular py-6">
      <div className="grid grid-cols-2 gap-x-8">
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">Material</span>
            <p>{product.material ? product.material : "-"}</p>
          </div>
          <div>
            <span className="font-semibold">Type</span>
            <p>{product.type ? product.type.value : "-"}</p>
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">Weight</span>
            <p>{product.weight ? `${product.weight} g` : "-"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const PrintShippingTab = () => {
  return (
    <div className="text-small-regular py-6 text-stone-600">
      <div className="flex items-start gap-x-2">
        <FastDelivery />
        <div className="flex flex-col gap-3 max-w-sm">
          <p>
            Physical prints are made to order and typically ship within 5–10
            business days. Digital downloads are available immediately after
            checkout.
          </p>
          <p>
            Sizes follow the photo’s orientation — landscape images print
            landscape, even when the listed size is written as 8 × 10.
          </p>
        </div>
      </div>
    </div>
  )
}

const ShippingInfoTab = () => {
  return (
    <div className="text-small-regular py-6">
      <div className="flex items-start gap-x-2">
        <FastDelivery />
        <div>
          <span className="font-semibold">Shipping</span>
          <p className="max-w-sm text-stone-600">
            Made to order. Most items ship within 5–10 business days.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
