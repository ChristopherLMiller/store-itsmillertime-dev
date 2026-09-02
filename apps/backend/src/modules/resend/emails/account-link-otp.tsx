import { Hr, Text } from "@react-email/components"
import {
  EmailLayout,
  emailStyles,
} from "./layout"

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
    <EmailLayout preview={`Your ${brand} account link code: ${code}`}>
      <Text style={emailStyles.heading}>Confirm account link</Text>
      <Text style={emailStyles.paragraph}>
        Someone requested linking a {store_name} shop account with a {brand}{" "}
        account. Use this one-time code to confirm:
      </Text>
      <Text style={emailStyles.code}>{code}</Text>
      <Text style={emailStyles.paragraph}>
        This code expires in {minutes_valid} minutes.
      </Text>
      <Hr style={emailStyles.hr} />
      <Text style={emailStyles.footer}>
        If you did not request this, you can ignore this email — no accounts
        will be linked.
      </Text>
    </EmailLayout>
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
} satisfies AccountLinkOtpEmailProps

export default accountLinkOtpEmail
