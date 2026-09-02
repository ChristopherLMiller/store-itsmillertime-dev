import { Text } from "@react-email/components"
import { ActionEmailTemplate, emailStyles } from "./layout"

type UserInvitedEmailProps = {
  invite_url: string
  email?: string
}

function UserInvitedEmailComponent({
  invite_url,
  email,
}: UserInvitedEmailProps) {
  return (
    <ActionEmailTemplate
      preview="You're invited to the ItsMillerTime admin"
      greeting={email ? `Hi ${email},` : "Hi,"}
      body={
        <Text style={emailStyles.paragraph}>
          You've been invited to the ItsMillerTime store admin. Click the button
          below to accept the invitation and set up your account.
        </Text>
      }
      buttonText="Accept invitation"
      buttonHref={invite_url}
      fallbackText="If the button doesn't work, copy and paste this link into your browser:"
      footerText="If you weren't expecting this invitation, you can ignore this email."
    />
  )
}

export const userInvitedEmail = (props: UserInvitedEmailProps) => (
  <UserInvitedEmailComponent {...props} />
)

UserInvitedEmailComponent.PreviewProps = {
  invite_url: "https://store-admin.itsmillertime.dev/app/invite?token=abc123",
  email: "alex@example.com",
} satisfies UserInvitedEmailProps

export default UserInvitedEmailComponent
