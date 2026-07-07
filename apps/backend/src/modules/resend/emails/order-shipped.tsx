import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"
import { formatEmailPrice } from "../../../utils/format-email-price"
import type { ShipmentItemLine } from "../../../utils/shipment-notification"

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
  store_name = "Store",
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
  const primaryTracking = trackedLines[0]

  return (
    <Html>
      <Head />
      <Preview>{`Your order #${order_display_id} from ${store_name} has shipped`}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 my-auto mx-auto font-sans">
          <Container className="bg-white my-10 mx-auto w-full max-w-2xl">
            <Section className="bg-[#27272a] text-white px-6 py-5">
              <Heading className="text-white text-xl font-semibold m-0">
                {store_name}
              </Heading>
              <Text className="text-gray-300 text-sm m-0 mt-1">
                Order #{order_display_id} is on the way
              </Text>
            </Section>

            <Container className="px-6 py-6">
              <Text className="text-gray-800 text-[15px] leading-6 m-0">
                Hi {greetingName},
              </Text>
              <Text className="text-gray-600 text-[15px] leading-6 mt-3 mb-0">
                Good news — your order has shipped. You can track delivery below
                and review what is in this shipment.
              </Text>
            </Container>

            {trackedLines.length > 0 ? (
              <Container className="px-6 pb-2">
                <Section className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                  <Heading className="text-gray-900 text-base font-semibold m-0 mb-3">
                    Tracking information
                  </Heading>
                  {trackedLines.map((line, index) => (
                    <Section
                      key={`${line.tracking_number ?? "track"}-${index}`}
                      className={index > 0 ? "mt-4 pt-4 border-t border-gray-200" : ""}
                    >
                      {line.carrier_name ? (
                        <Text className="text-gray-800 text-sm font-medium m-0">
                          Carrier: {line.carrier_name}
                        </Text>
                      ) : null}
                      {line.tracking_number ? (
                        <Text className="text-gray-700 text-sm m-0 mt-1">
                          Tracking number: {line.tracking_number}
                        </Text>
                      ) : null}
                      {line.tracking_url ? (
                        <Text className="m-0 mt-3">
                          <Link
                            href={line.tracking_url}
                            className="text-blue-600 no-underline text-sm font-medium break-all"
                          >
                            Track this package
                          </Link>
                        </Text>
                      ) : null}
                    </Section>
                  ))}
                </Section>
              </Container>
            ) : (
              <Container className="px-6 pb-2">
                <Text className="text-gray-500 text-sm leading-6 m-0">
                  Tracking details are not available yet. We will email you when
                  the carrier provides an update.
                </Text>
              </Container>
            )}

            {primaryTracking?.tracking_url && (
              <Section className="text-center px-6 py-4">
                <Button
                  className="bg-[#27272a] rounded text-white text-sm font-semibold no-underline text-center px-6 py-3"
                  href={primaryTracking.tracking_url}
                >
                  Track shipment
                </Button>
              </Section>
            )}

            {items.length > 0 && (
              <Container className="px-6 py-4">
                <Heading className="text-gray-900 text-lg font-semibold m-0 mb-4">
                  Items in this shipment
                </Heading>
                {items.map((item, index) => (
                  <Section
                    key={`${item.title}-${index}`}
                    className="border-b border-gray-200 py-4"
                  >
                    <Row>
                      {item.thumbnail ? (
                        <Column className="w-[96px] align-top">
                          <Img
                            src={item.thumbnail}
                            alt={item.title}
                            width="96"
                            className="rounded-md"
                          />
                        </Column>
                      ) : null}
                      <Column className={item.thumbnail ? "pl-4 align-top" : "align-top"}>
                        <Text className="text-gray-900 text-base font-medium m-0">
                          {item.title}
                        </Text>
                        {item.variant_title ? (
                          <Text className="text-gray-500 text-sm m-0 mt-1">
                            {item.variant_title}
                          </Text>
                        ) : null}
                        <Text className="text-gray-700 text-sm m-0 mt-2">
                          Qty: {item.quantity}
                        </Text>
                      </Column>
                    </Row>
                  </Section>
                ))}
              </Container>
            )}

            <Container className="px-6 py-2">
              <Section className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                <Heading className="text-gray-900 text-base font-semibold m-0 mb-3">
                  Delivery details
                </Heading>
                {shipping_method_name ? (
                  <Text className="text-gray-700 text-sm m-0">
                    Shipping method: {shipping_method_name}
                  </Text>
                ) : null}
                {shipping_address_summary ? (
                  <Text className="text-gray-700 text-sm m-0 mt-3 whitespace-pre-line">
                    Ship to:
                    {"\n"}
                    {shipping_address_summary}
                  </Text>
                ) : null}
                {order_total != null ? (
                  <Text className="text-gray-900 text-sm font-semibold m-0 mt-3">
                    Order total: {formatEmailPrice(order_total, currency_code)}
                  </Text>
                ) : null}
              </Section>
            </Container>

            {order_url && (
              <Section className="text-center px-6 py-6">
                <Button
                  className="bg-[#27272a] rounded text-white text-sm font-semibold no-underline text-center px-6 py-3"
                  href={order_url}
                >
                  View order details
                </Button>
              </Section>
            )}

            <Section className="bg-gray-50 px-6 py-5 border-t border-gray-200">
              <Text className="text-gray-500 text-xs leading-5 m-0 text-center">
                If you have questions about this shipment, reply to this email
                and include order #{order_display_id}.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export const orderShippedEmail = (props: OrderShippedEmailProps) => (
  <OrderShippedEmailComponent {...props} />
)

export default OrderShippedEmailComponent
