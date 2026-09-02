import { Text } from "@react-email/components"
import { ActionEmailTemplate, emailStyles } from "./layout"

type PasswordResetEmailProps = {
  reset_url: string
  email?: string
}

function PasswordResetEmailComponent({
  reset_url,
  email,
}: PasswordResetEmailProps) {
  return (
    <ActionEmailTemplate
      preview="Reset your password"
      greeting={email ? `Hi ${email},` : "Hi,"}
      body={
        <Text style={emailStyles.paragraph}>
          You requested a password reset for your shop account. Click the button
          below to choose a new password. This link will expire soon.
        </Text>
      }
      buttonText="Reset password"
      buttonHref={reset_url}
      fallbackText="If the button doesn't work, copy and paste this link into your browser:"
      footerText="If you didn't request this, you can safely ignore this email. Your password will stay the same."
    />
  )
}

export const passwordResetEmail = (props: PasswordResetEmailProps) => (
  <PasswordResetEmailComponent {...props} />
)

PasswordResetEmailComponent.PreviewProps = {
  reset_url: "https://store.itsmillertime.dev/us/reset-password?token=abc123",
  email: "alex@example.com",
} satisfies PasswordResetEmailProps

export default PasswordResetEmailComponent
