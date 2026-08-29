import { Heading, Text } from "@modules/common/components/ui"

const PRODIGI_URL = "https://www.prodigi.com"

type ProductTabsProps = {
  printProduct?: boolean
}

const ProductTabs = ({ printProduct }: ProductTabsProps) => {
  return (
    <div className="shop-panel p-6">
      {printProduct ? <PrintShippingCopy /> : <ShopShippingCopy />}
    </div>
  )
}

const PrintShippingCopy = () => {
  return (
    <div>
      <Heading
        level="h2"
        className="font-display text-xl tracking-tight text-ink"
      >
        Printing & shipping
      </Heading>
      <div className="mt-5 grid grid-cols-1 small:grid-cols-3 gap-6 small:gap-8">
        <div>
          <p className="shop-kicker">The watermark</p>
          <Text className="mt-2 text-sm leading-relaxed text-ink-soft">
            What you see here is only on the website. It will not be on your
            print, and it will not be in a digital download.
          </Text>
        </div>
        <div>
          <p className="shop-kicker">Made to order</p>
          <Text className="mt-2 text-sm leading-relaxed text-ink-soft">
            Physical prints are made by{" "}
            <a
              href={PRODIGI_URL}
              target="_blank"
              rel="noreferrer"
              className="text-bronze-deep underline underline-offset-4 hover:text-ink"
            >
              Prodigi</a>, a print lab we work with. They usually ship within
            5–10 business days. Digital downloads are ready as soon as you
            check out.
          </Text>
        </div>
        <div>
          <p className="shop-kicker">Orientation</p>
          <Text className="mt-2 text-sm leading-relaxed text-ink-soft">
            Sizes follow the photo — a landscape photo prints landscape, even
            when the listed size is written as 8 × 10.
          </Text>
        </div>
      </div>
    </div>
  )
}

const ShopShippingCopy = () => {
  return (
    <div className="flex flex-col gap-4">
      <Heading level="h2" className="font-display text-xl tracking-tight text-ink">
        Shipping & returns
      </Heading>
      <Text className="text-sm leading-relaxed text-ink-soft">
        These are existing items, not made to order. They usually ship within
        a few business days. Returns are accepted if the listing doesn’t match
        what you received.
      </Text>
    </div>
  )
}

export default ProductTabs
