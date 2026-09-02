import { Button, Hr, Text } from "@react-email/components"
import { formatEmailPrice } from "../../../utils/format-email-price"
import type { ShipmentItemLine } from "../../../utils/shipment-notification"
import {
  EmailInfoBox,
  EmailLayout,
  EmailOrderItem,
  emailStyles,
} from "./layout"

export type ShipmentTrackingLine = {
  carrier_name?: string | null
  tracking_number?: string | null
  tracking_url?: string | null
}

type OrderShippedEmailProps = {
  order_display_id: number | string
  customer_name?: string | null
  order_url?: string | null
  tracking: ShipmentTrackingLine[]
  store_name?: string
  items?: ShipmentItemLine[]
  shipping_method_name?: string | null
  shipping_address_summary?: string | null
  currency_code?: string
  order_total?: number | string | null
}

function OrderShippedEmailComponent({
  order_display_id,
  customer_name,
  order_url,
  tracking,
  store_name = "ItsMillerTime Store",
  items = [],
  shipping_method_name,
  shipping_address_summary,
  currency_code = "USD",
  order_total,
}: OrderShippedEmailProps) {
  const greetingName = customer_name?.trim() || "there"
  const trackedLines = tracking.filter(
    (line) => line.tracking_number || line.tracking_url
  )

  return (
    <EmailLayout
      wide
      preview={`Your order #${order_display_id} from ${store_name} has shipped`}
    >
      <Text style={emailStyles.heading}>
        Order #{order_display_id} is on the way
      </Text>
      <Text style={emailStyles.paragraph}>Hi {greetingName},</Text>
      <Text style={emailStyles.paragraph}>
        Good news — your order has shipped. You can track delivery below and
        review what is in this shipment.
      </Text>

      {trackedLines.length > 0 ? (
        <EmailInfoBox>
          <Text style={emailStyles.subheading}>Tracking information</Text>
          {trackedLines.map((line, index) => (
            <div key={`${line.tracking_number ?? "track"}-${index}`}>
              {line.carrier_name ? (
                <Text style={emailStyles.itemMeta}>
                  Carrier: {line.carrier_name}
                </Text>
              ) : null}
              {line.tracking_number ? (
                <Text style={emailStyles.itemMeta}>
                  Tracking number: {line.tracking_number}
                </Text>
              ) : null}
              {line.tracking_url ? (
                <Button href={line.tracking_url} style={emailStyles.button}>
                  Track this package
                </Button>
              ) : null}
            </div>
          ))}
        </EmailInfoBox>
      ) : (
        <Text style={emailStyles.paragraph}>
          Tracking details are not available yet. We will email you when the
          carrier provides an update.
        </Text>
      )}

      {items.length > 0 ? (
        <>
          <Text style={emailStyles.subheading}>Items in this shipment</Text>
          {items.map((item, index) => (
            <EmailOrderItem
              key={`${item.title}-${index}`}
              thumbnail={item.thumbnail}
              title={item.title}
              subtitle={item.variant_title}
              meta={`Qty: ${item.quantity}`}
            />
          ))}
        </>
      ) : null}

      <EmailInfoBox>
        <Text style={emailStyles.subheading}>Delivery details</Text>
        {shipping_method_name ? (
          <Text style={emailStyles.itemMeta}>
            Shipping method: {shipping_method_name}
          </Text>
        ) : null}
        {shipping_address_summary ? (
          <Text style={{ ...emailStyles.itemMeta, whiteSpace: "pre-line" }}>
            {`Ship to:\n${shipping_address_summary}`}
          </Text>
        ) : null}
        {order_total != null ? (
          <Text style={{ ...emailStyles.itemMeta, fontWeight: "600", color: "#1a1a1a" }}>
            Order total: {formatEmailPrice(order_total, currency_code)}
          </Text>
        ) : null}
      </EmailInfoBox>

      {order_url ? (
        <Button href={order_url} style={emailStyles.button}>
          View order details
        </Button>
      ) : null}

      <Hr style={emailStyles.hr} />
      <Text style={emailStyles.footer}>
        If you have questions about this shipment, reply to this email and
        include order #{order_display_id}.
      </Text>
    </EmailLayout>
  )
}

export const orderShippedEmail = (props: OrderShippedEmailProps) => (
  <OrderShippedEmailComponent {...props} />
)

OrderShippedEmailComponent.PreviewProps = {
  order_display_id: 42,
  customer_name: "Alex",
  order_url: "https://store.itsmillertime.dev/us/account/orders/details/order_01",
  tracking: [
    {
      carrier_name: "USPS",
      tracking_number: "9400111899223197428490",
      tracking_url: "https://tools.usps.com/go/TrackConfirmAction",
    },
  ],
  items: [
    {
      title: "Gallery print",
      variant_title: "11x14 / Lustre",
      quantity: 1,
    },
  ],
  shipping_method_name: "Standard Shipping",
  shipping_address_summary: "Alex Example\n123 Main St\nAustin, TX 78701",
  currency_code: "USD",
  order_total: 48,
} satisfies OrderShippedEmailProps

export default OrderShippedEmailComponent
