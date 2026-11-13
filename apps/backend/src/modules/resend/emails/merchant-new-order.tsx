import { Button, Hr, Text } from "react-email"
import type { CustomerDTO, OrderDTO } from "@medusajs/framework/types"
import { formatEmailPrice } from "../../../utils/format-email-price"
import {
  EmailInfoBox,
  EmailLayout,
  EmailOrderItem,
  emailStyles,
} from "./layout"

type MerchantNewOrderEmailProps = {
  order: OrderDTO & {
    customer?: CustomerDTO | null
  }
  admin_order_url?: string | null
  store_name?: string
}

function formatCustomerName(order: MerchantNewOrderEmailProps["order"]) {
  const fromCustomer = [order.customer?.first_name, order.customer?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()
  if (fromCustomer) {
    return fromCustomer
  }

  return [order.shipping_address?.first_name, order.shipping_address?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()
}

function formatAddress(order: MerchantNewOrderEmailProps["order"]) {
  const address = order.shipping_address
  if (!address) {
    return null
  }

  const cityLine = [address.city, address.province, address.postal_code]
    .filter(Boolean)
    .join(", ")

  return [
    [address.first_name, address.last_name].filter(Boolean).join(" "),
    address.address_1,
    address.address_2,
    cityLine,
    address.country_code?.toUpperCase(),
  ]
    .filter(Boolean)
    .join("\n")
}

function MerchantNewOrderEmailComponent({
  order,
  admin_order_url,
  store_name = "ItsMillerTime Store",
}: MerchantNewOrderEmailProps) {
  const customerName = formatCustomerName(order) || "Guest customer"
  const shippingAddress = formatAddress(order)
  const shippingMethod = order.shipping_methods?.[0]?.name

  return (
    <EmailLayout
      wide
      preview={`New order #${order.display_id} at ${store_name}`}
    >
      <Text style={emailStyles.heading}>New order received</Text>
      <Text style={emailStyles.paragraph}>
        A new order was placed and is ready for review in Medusa admin.
      </Text>

      <EmailInfoBox>
        <Text style={emailStyles.subheading}>Order summary</Text>
        <Text style={emailStyles.itemMeta}>
          {store_name} · Order #{order.display_id}
        </Text>
        <Text style={emailStyles.itemMeta}>Customer: {customerName}</Text>
        <Text style={emailStyles.itemMeta}>Email: {order.email}</Text>
        {shippingMethod ? (
          <Text style={emailStyles.itemMeta}>
            Shipping method: {shippingMethod}
          </Text>
        ) : null}
        <Text
          style={{ ...emailStyles.itemMeta, fontWeight: "600", color: "#1a1a1a" }}
        >
          Total: {formatEmailPrice(order.total, order.currency_code)}
        </Text>
      </EmailInfoBox>

      <Text style={emailStyles.subheading}>Items ordered</Text>
      {order.items?.map((item) => (
        <EmailOrderItem
          key={item.id}
          thumbnail={item.thumbnail}
          title={item.product_title || item.title || "Item"}
          subtitle={item.variant_title}
          meta={`Qty: ${item.quantity} · ${formatEmailPrice(item.total, order.currency_code)}`}
        />
      ))}

      {shippingAddress ? (
        <EmailInfoBox>
          <Text style={emailStyles.subheading}>Ship to</Text>
          <Text style={{ ...emailStyles.itemMeta, whiteSpace: "pre-line" }}>
            {shippingAddress}
          </Text>
        </EmailInfoBox>
      ) : null}

      {admin_order_url ? (
        <Button href={admin_order_url} style={emailStyles.button}>
          Open order in admin
        </Button>
      ) : null}

      <Hr style={emailStyles.hr} />
      <Text style={emailStyles.footer}>
        You are receiving this because store order notifications are enabled
        for {store_name}.
      </Text>
    </EmailLayout>
  )
}

export const merchantNewOrderEmail = (props: MerchantNewOrderEmailProps) => (
  <MerchantNewOrderEmailComponent {...props} />
)

MerchantNewOrderEmailComponent.PreviewProps = {
  order: {
    id: "order_01EXAMPLE",
    display_id: 42,
    email: "alex@example.com",
    currency_code: "usd",
    total: 48,
    items: [
      {
        id: "item_1",
        title: "L",
        product_title: "Gallery print",
        variant_title: "11x14 / Lustre",
        thumbnail: "https://www.itsmillertime.dev/logo.png",
        total: 38,
        quantity: 1,
      },
    ],
    shipping_methods: [{ id: "ship_1", name: "Standard Shipping" }],
    shipping_address: {
      first_name: "Alex",
      last_name: "Example",
      address_1: "123 Main St",
      city: "Austin",
      province: "TX",
      postal_code: "78701",
      country_code: "us",
    },
    customer: { first_name: "Alex", last_name: "Example" },
  },
  admin_order_url: "https://medusa.itsmillertime.dev/app/orders/order_01EXAMPLE",
  store_name: "ItsMillerTime Store",
} as unknown as MerchantNewOrderEmailProps

export default MerchantNewOrderEmailComponent
