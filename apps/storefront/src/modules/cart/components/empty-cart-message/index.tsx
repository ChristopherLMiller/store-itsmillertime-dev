import { Heading, Text } from "@modules/common/components/ui"

import InteractiveLink from "@modules/common/components/interactive-link"

const EmptyCartMessage = () => {
  return (
    <div
      className="py-24 px-2 flex flex-col justify-center items-start"
      data-testid="empty-cart-message"
    >
      <p className="text-sm text-ink-muted mb-3">Cart</p>
      <Heading
        level="h1"
        className="font-display text-4xl tracking-tight text-ink"
      >
        Nothing in the bag yet
      </Heading>
      <Text className="text-base-regular mt-4 mb-6 max-w-[32rem] text-ink-muted">
        Browse prints from the gallery, or pick up a pre-loved game or model
        from the shop.
      </Text>
      <div>
        <InteractiveLink href="/store">Explore products</InteractiveLink>
      </div>
    </div>
  )
}

export default EmptyCartMessage
