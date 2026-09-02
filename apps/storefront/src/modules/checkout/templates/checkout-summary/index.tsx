import { Heading } from "@modules/common/components/ui"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"

const CheckoutSummary = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  return (
    <div className="relative small:sticky small:top-8 flex flex-col gap-y-6">
      <div className="w-full shop-panel flex flex-col p-6 small:p-8">
        <Heading
          level="h2"
          className="font-display text-3xl tracking-tight"
        >
          In your cart
        </Heading>
        <Divider className="my-6" />
        <CartTotals totals={cart} />
        <ItemsPreviewTemplate cart={cart} />
        <div className="my-6">
          <DiscountCode cart={cart} />
        </div>
      </div>
    </div>
  )
}

export default CheckoutSummary
