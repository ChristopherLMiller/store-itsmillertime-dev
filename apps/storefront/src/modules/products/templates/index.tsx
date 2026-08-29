import React, { Suspense } from "react"

import { isPrintProduct } from "@lib/util/print-format"
import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const printProduct = isPrintProduct(product)

  return (
    <>
      <div
        className="content-container py-8 small:py-12"
        data-testid="product-container"
      >
        <div className="flex flex-col small:grid small:grid-cols-[minmax(0,1.4fr)_minmax(280px,400px)] small:gap-x-12 small:gap-y-8 small:items-start">
          <div className="order-1 w-full shop-fade-up small:col-start-1 small:row-start-1">
            <ImageGallery
              images={images}
              alt={product.title ?? ""}
              layout={printProduct ? "print" : "shop"}
            />
          </div>
          <div className="order-2 flex flex-col small:sticky small:top-28 gap-6 shop-fade-up [animation-delay:100ms] small:col-start-2 small:row-start-1 small:row-span-3">
            <div className="flex flex-col py-8 small:py-6 gap-8 shop-panel p-6">
              <ProductInfo product={product} printProduct={printProduct} />
              <ProductOnboardingCta />
              <Suspense
                fallback={
                  <ProductActions
                    disabled={true}
                    product={product}
                    region={region}
                  />
                }
              >
                <ProductActionsWrapper id={product.id} region={region} />
              </Suspense>
            </div>
            {!printProduct && <ProductTabs />}
          </div>
          {printProduct && (
            <div className="order-3 mt-8 small:mt-0 shop-fade-up [animation-delay:160ms] small:col-start-1 small:row-start-2">
              <ProductTabs printProduct />
            </div>
          )}
          {printProduct && (
            <div
              className="order-4 mt-10 small:mt-0 small:col-start-1 small:row-start-3"
              data-testid="related-products-container"
            >
              <Suspense fallback={<SkeletonRelatedProducts layout="aside" />}>
                <RelatedProducts
                  product={product}
                  countryCode={countryCode}
                  layout="aside"
                />
              </Suspense>
            </div>
          )}
        </div>
      </div>
      {!printProduct && (
        <div
          className="content-container my-16 small:my-24"
          data-testid="related-products-container"
        >
          <Suspense fallback={<SkeletonRelatedProducts />}>
            <RelatedProducts product={product} countryCode={countryCode} />
          </Suspense>
        </div>
      )}
    </>
  )
}

export default ProductTemplate
