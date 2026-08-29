import { Text, clx } from "@modules/common/components/ui"
import { VariantPrice } from "types/global"

export default async function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  return (
    <span className="inline-flex items-baseline gap-2">
      {price.price_type === "sale" && (
        <Text
          className="line-through text-ink-muted"
          data-testid="original-price"
        >
          {price.original_price}
        </Text>
      )}
      <Text
        className={clx("text-ink", {
          "text-brick": price.price_type === "sale",
        })}
        data-testid="price"
      >
        {price.calculated_price}
      </Text>
    </span>
  )
}
