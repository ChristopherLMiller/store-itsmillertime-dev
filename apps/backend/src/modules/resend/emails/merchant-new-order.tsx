import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"
import type { CustomerDTO, OrderDTO } from "@medusajs/framework/types"
import { formatEmailPrice } from "../../../utils/format-email-price"

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
  store_name = "Store",
}: MerchantNewOrderEmailProps) {
  const customerName = formatCustomerName(order) || "Guest customer"
  const shippingAddress = formatAddress(order)
  const shippingMethod = order.shipping_methods?.[0]?.name

  return (
    <Html>
      <Head />
      <Preview>{`New order #${order.display_id} at ${store_name}`}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 my-auto mx-auto font-sans">
          <Container className="bg-white my-10 mx-auto w-full max-w-2xl">
            <Section className="bg-[#27272a] text-white px-6 py-5">
              <Heading className="text-white text-xl font-semibold m-0">
                New order received
              </Heading>
              <Text className="text-gray-300 text-sm m-0 mt-1">
                {store_name} · Order #{order.display_id}
              </Text>
            </Section>

            <Container className="px-6 py-6">
              <Text className="text-gray-800 text-[15px] leading-6 m-0">
                A new order was placed and is ready for review in Medusa admin.
              </Text>
            </Container>

            <Container className="px-6 pb-2">
              <Section className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                <Heading className="text-gray-900 text-base font-semibold m-0 mb-3">
                  Order summary
                </Heading>
                <Text className="text-gray-700 text-sm m-0">
                  Customer: {customerName}
                </Text>
                <Text className="text-gray-700 text-sm m-0 mt-1">
                  Email: {order.email}
                </Text>
                {shippingMethod ? (
                  <Text className="text-gray-700 text-sm m-0 mt-1">
                    Shipping method: {shippingMethod}
                  </Text>
                ) : null}
                <Text className="text-gray-900 text-sm font-semibold m-0 mt-3">
                  Total: {formatEmailPrice(order.total, order.currency_code)}
                </Text>
              </Section>
            </Container>

            <Container className="px-6 py-4">
              <Heading className="text-gray-900 text-lg font-semibold m-0 mb-4">
                Items ordered
              </Heading>
              {order.items?.map((item) => (
                <Section key={item.id} className="border-b border-gray-200 py-4">
                  <Row>
                    {item.thumbnail ? (
                      <Column className="w-[96px] align-top">
                        <Img
                          src={item.thumbnail}
                          alt={item.product_title ?? item.title ?? "Item"}
                          width="96"
                          className="rounded-md"
                        />
                      </Column>
                    ) : null}
                    <Column className={item.thumbnail ? "pl-4 align-top" : "align-top"}>
                      <Text className="text-gray-900 text-base font-medium m-0">
                        {item.product_title || item.title}
                      </Text>
                      {item.variant_title ? (
                        <Text className="text-gray-500 text-sm m-0 mt-1">
                          {item.variant_title}
                        </Text>
                      ) : null}
                      <Text className="text-gray-700 text-sm m-0 mt-2">
                        Qty: {item.quantity} ·{" "}
                        {formatEmailPrice(item.total, order.currency_code)}
                      </Text>
                    </Column>
                  </Row>
                </Section>
              ))}
            </Container>

            {shippingAddress ? (
              <Container className="px-6 pb-4">
                <Section className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                  <Heading className="text-gray-900 text-base font-semibold m-0 mb-3">
                    Ship to
                  </Heading>
                  <Text className="text-gray-700 text-sm m-0 whitespace-pre-line">
                    {shippingAddress}
                  </Text>
                </Section>
              </Container>
            ) : null}

            {admin_order_url ? (
              <Section className="text-center px-6 py-6">
                <Button
                  className="bg-[#27272a] rounded text-white text-sm font-semibold no-underline text-center px-6 py-3"
                  href={admin_order_url}
                >
                  Open order in admin
                </Button>
              </Section>
            ) : null}

            <Section className="bg-gray-50 px-6 py-5 border-t border-gray-200">
              <Text className="text-gray-500 text-xs leading-5 m-0 text-center">
                You are receiving this because store order notifications are
                enabled for {store_name}.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export const merchantNewOrderEmail = (props: MerchantNewOrderEmailProps) => (
  <MerchantNewOrderEmailComponent {...props} />
)

export default MerchantNewOrderEmailComponent
