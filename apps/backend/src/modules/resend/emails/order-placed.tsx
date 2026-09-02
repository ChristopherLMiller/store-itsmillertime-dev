import { Button, Hr, Text } from "@react-email/components"
import type { BigNumberValue, CustomerDTO, OrderDTO } from "@medusajs/framework/types"
import {
  EmailLayout,
  EmailOrderItem,
  EmailPriceRow,
  emailStyles,
} from "./layout"

type OrderPlacedEmailProps = {
  order: OrderDTO & {
    customer?: CustomerDTO | null
  }
  email_banner?: {
    body: string
    title: string
    url: string
  }
}

function formatPrice(price: BigNumberValue | null | undefined, currencyCode: string) {
  const formatter = new Intl.NumberFormat([], {
    style: "currency",
    currencyDisplay: "narrowSymbol",
    currency: currencyCode,
  })

  if (typeof price === "number") {
    return formatter.format(price)
  }

  if (typeof price === "string") {
    return formatter.format(parseFloat(price))
  }

  return price?.toString() || ""
}

function OrderPlacedEmailComponent({ order, email_banner }: OrderPlacedEmailProps) {
  const firstName =
    order.customer?.first_name || order.shipping_address?.first_name || "there"
  const shouldDisplayBanner = email_banner && "title" in email_banner

  return (
    <EmailLayout
      wide
      preview={`Thank you for your order from ItsMillerTime`}
    >
      <Text style={emailStyles.heading}>
        Thank you for your order, {firstName}
      </Text>
      <Text style={emailStyles.paragraph}>
        We're processing your order and will notify you when it ships.
      </Text>

      {shouldDisplayBanner ? (
        <>
          <Text style={emailStyles.subheading}>{email_banner.title}</Text>
          <Text style={emailStyles.paragraph}>{email_banner.body}</Text>
          <Button href={email_banner.url} style={emailStyles.button}>
            Shop now
          </Button>
        </>
      ) : null}

      <Text style={emailStyles.subheading}>Your items</Text>
      <Text style={emailStyles.itemMeta}>Order #{order.display_id}</Text>
      {order.items?.map((item) => (
        <EmailOrderItem
          key={item.id}
          thumbnail={item.thumbnail}
          title={item.product_title || item.title || "Item"}
          subtitle={item.variant_title}
          meta={formatPrice(item.total, order.currency_code)}
        />
      ))}

      <Text style={{ ...emailStyles.subheading, marginTop: "24px" }}>
        Order summary
      </Text>
      <EmailPriceRow
        label="Subtotal"
        value={formatPrice(order.item_total, order.currency_code)}
      />
      {order.shipping_methods?.map((method) => (
        <EmailPriceRow
          key={method.id}
          label={method.name || "Shipping"}
          value={formatPrice(method.total, order.currency_code)}
        />
      ))}
      <EmailPriceRow
        label="Tax"
        value={formatPrice(order.tax_total || 0, order.currency_code)}
      />
      <EmailPriceRow
        label="Total"
        value={formatPrice(order.total, order.currency_code)}
        bold
      />

      <Hr style={emailStyles.hr} />
      <Text style={emailStyles.footer}>
        If you have any questions, reply to this email. Order token: {order.id}
      </Text>
    </EmailLayout>
  )
}

export const orderPlacedEmail = (props: OrderPlacedEmailProps) => (
  <OrderPlacedEmailComponent {...props} />
)

OrderPlacedEmailComponent.PreviewProps = {
  order: {
    id: "order_01EXAMPLE",
    display_id: 42,
    email: "alex@example.com",
    currency_code: "usd",
    total: 48,
    item_total: 38,
    tax_total: 0,
    items: [
      {
        id: "item_1",
        title: "L",
        product_title: "Gallery print",
        variant_title: '11x14 / Lustre',
        thumbnail: "https://www.itsmillertime.dev/logo.png",
        total: 38,
        quantity: 1,
      },
    ],
    shipping_methods: [
      {
        id: "ship_1",
        name: "Standard Shipping",
        total: 10,
      },
    ],
    shipping_address: {
      first_name: "Alex",
    },
    customer: {
      first_name: "Alex",
    },
  },
} as unknown as OrderPlacedEmailProps

export default OrderPlacedEmailComponent
