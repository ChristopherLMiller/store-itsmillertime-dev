import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"

type AccountLinkOtpEmailProps = {
  code: string
  brand?: string
  store_name?: string
  minutes_valid?: number
}

function AccountLinkOtpEmailComponent({
  code,
  brand = "itsMillerTime",
  store_name = "ItsMillerTime Store",
  minutes_valid = 15,
}: AccountLinkOtpEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Your ${brand} account link code: ${code}`}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                Confirm account link
              </Heading>
            </Section>
            <Section>
              <Text className="text-black text-[14px] leading-[24px]">
                Someone requested linking a {store_name} shop account with a{" "}
                {brand} account. Use this one-time code to confirm:
              </Text>
              <Text className="text-black text-[32px] leading-[40px] font-bold tracking-[0.35em] text-center my-[24px]">
                {code}
              </Text>
              <Text className="text-black text-[14px] leading-[24px]">
                This code expires in {minutes_valid} minutes. If you did not
                request this, you can ignore this email — no accounts will be
                linked.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export const accountLinkOtpEmail = (props: AccountLinkOtpEmailProps) => (
  <AccountLinkOtpEmailComponent {...props} />
)

AccountLinkOtpEmailComponent.PreviewProps = {
  code: "482193",
  brand: "itsMillerTime",
  store_name: "ItsMillerTime Store",
  minutes_valid: 15,
} as AccountLinkOtpEmailProps

export default accountLinkOtpEmail
