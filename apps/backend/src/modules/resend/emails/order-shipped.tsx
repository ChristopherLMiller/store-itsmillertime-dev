import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"

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
}

function OrderShippedEmailComponent({
  order_display_id,
  customer_name,
  order_url,
  tracking,
  store_name = "Store",
}: OrderShippedEmailProps) {
  const greetingName = customer_name?.trim() || "there"
  const trackedLines = tracking.filter(
    (line) => line.tracking_number || line.tracking_url
  )

  return (
    <Html>
      <Head />
      <Preview>{`Your order #${order_display_id} has shipped`}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                Your order is on the way
              </Heading>
            </Section>

            <Section className="my-[32px]">
              <Text className="text-black text-[14px] leading-[24px]">
                Hi {greetingName},
              </Text>
              <Text className="text-black text-[14px] leading-[24px]">
                Good news — {store_name} has shipped order #{order_display_id}.
              </Text>
            </Section>

            {trackedLines.length > 0 ? (
              <Section className="my-[32px]">
                <Text className="text-black text-[14px] leading-[24px] font-semibold">
                  Tracking
                </Text>
                {trackedLines.map((line, index) => (
                  <Text
                    key={`${line.tracking_number ?? "track"}-${index}`}
                    className="text-black text-[14px] leading-[24px]"
                  >
                    {line.carrier_name ? `${line.carrier_name}: ` : ""}
                    {line.tracking_url ? (
                      <Link
                        href={line.tracking_url}
                        className="text-blue-600 no-underline break-all"
                      >
                        {line.tracking_number || line.tracking_url}
                      </Link>
                    ) : (
                      line.tracking_number
                    )}
                  </Text>
                ))}
              </Section>
            ) : (
              <Section className="my-[32px]">
                <Text className="text-[#666666] text-[14px] leading-[24px]">
                  Tracking details are not available yet. We will email you if
                  they become available.
                </Text>
              </Section>
            )}

            {order_url && (
              <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                  className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                  href={order_url}
                >
                  View order
                </Button>
              </Section>
            )}
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
