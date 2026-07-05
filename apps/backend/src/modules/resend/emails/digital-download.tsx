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

type DigitalDownloadEmailProps = {
  order_display_id: number | string
  download_url: string
  expires_at: string
  store_name?: string
}

function DigitalDownloadEmailComponent({
  order_display_id,
  download_url,
  expires_at,
  store_name = "Store",
}: DigitalDownloadEmailProps) {
  const expiresLabel = new Date(expires_at).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })

  return (
    <Html>
      <Head />
      <Preview>{`Your digital download for order #${order_display_id}`}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                Your download is ready
              </Heading>
            </Section>

            <Section className="my-[32px]">
              <Text className="text-black text-[14px] leading-[24px]">
                Thanks for your purchase from {store_name}.
              </Text>
              <Text className="text-black text-[14px] leading-[24px]">
                Your digital files for order #{order_display_id} are ready to
                download as a zip archive.
              </Text>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={download_url}
              >
                Download files
              </Button>
            </Section>

            <Section className="my-[32px]">
              <Text className="text-black text-[14px] leading-[24px]">
                Or copy and paste this URL into your browser:
              </Text>
              <Link
                href={download_url}
                className="text-blue-600 no-underline text-[14px] leading-[24px] break-all"
              >
                {download_url}
              </Link>
            </Section>

            <Section className="my-[32px]">
              <Text className="text-[#666666] text-[12px] leading-[24px]">
                This link expires on {expiresLabel}.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export const digitalDownloadEmail = (props: DigitalDownloadEmailProps) => (
  <DigitalDownloadEmailComponent {...props} />
)

export default DigitalDownloadEmailComponent
