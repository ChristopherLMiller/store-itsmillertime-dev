import { Text } from "react-email"
import { ActionEmailTemplate, emailStyles } from "./layout"

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
  store_name = "ItsMillerTime Store",
}: DigitalDownloadEmailProps) {
  const expiresLabel = new Date(expires_at).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })

  return (
    <ActionEmailTemplate
      preview={`Your digital download for order #${order_display_id}`}
      greeting="Your download is ready"
      body={
        <>
          <Text style={emailStyles.paragraph}>
            Thanks for your purchase from {store_name}. Your digital files for
            order #{order_display_id} are ready to download as a zip archive.
          </Text>
          <Text style={emailStyles.paragraph}>
            This link expires on {expiresLabel}.
          </Text>
        </>
      }
      buttonText="Download files"
      buttonHref={download_url}
      fallbackText="If the button doesn't work, copy and paste this link into your browser:"
      footerText="If you didn't place this order, reply to this email and we'll help sort it out."
    />
  )
}

export const digitalDownloadEmail = (props: DigitalDownloadEmailProps) => (
  <DigitalDownloadEmailComponent {...props} />
)

DigitalDownloadEmailComponent.PreviewProps = {
  order_display_id: 42,
  download_url: "https://store.itsmillertime.dev/downloads/example.zip",
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  store_name: "ItsMillerTime Store",
} satisfies DigitalDownloadEmailProps

export default DigitalDownloadEmailComponent
