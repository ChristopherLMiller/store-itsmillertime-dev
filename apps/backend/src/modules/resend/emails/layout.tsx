import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components"
import * as React from "react"

const LOGO_URL =
  "https://cms.itsmillertime.dev/api/media/file/logo_2acde3523f.svg"

export const emailStyles = {
  main: {
    backgroundColor: "#a52b1e",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
    padding: "32px 0",
  },
  container: {
    backgroundColor: "#fafafa",
    margin: "0 auto",
    padding: "40px 20px",
    marginBottom: "64px",
    borderRadius: "8px",
    maxWidth: "480px",
  },
  containerWide: {
    backgroundColor: "#fafafa",
    margin: "0 auto",
    padding: "40px 20px",
    marginBottom: "64px",
    borderRadius: "8px",
    maxWidth: "600px",
  },
  section: {
    padding: "0 24px",
  },
  logoSection: {
    textAlign: "center" as const,
    padding: "0 24px 24px",
  },
  logo: {
    margin: "0 auto",
  },
  heading: {
    fontSize: "24px",
    fontWeight: "600",
    lineHeight: "32px",
    margin: "0 0 24px",
    color: "#1a1a1a",
  },
  subheading: {
    fontSize: "18px",
    fontWeight: "600",
    lineHeight: "26px",
    margin: "0 0 16px",
    color: "#1a1a1a",
  },
  paragraph: {
    fontSize: "16px",
    lineHeight: "24px",
    margin: "0 0 16px",
    color: "#525f7f",
  },
  button: {
    backgroundColor: "#a52b1e",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
    padding: "12px 24px",
    textDecoration: "none",
    display: "inline-block",
    marginBottom: "24px",
  },
  link: {
    color: "#000",
    fontSize: "14px",
    textDecoration: "underline",
    wordBreak: "break-all" as const,
    display: "block",
    marginBottom: "24px",
  },
  hr: {
    borderColor: "#e6ebf1",
    margin: "24px 0",
  },
  footer: {
    color: "#8898aa",
    fontSize: "14px",
    lineHeight: "20px",
    margin: "0",
  },
  infoBox: {
    backgroundColor: "#f4f4f5",
    border: "1px solid #e6ebf1",
    borderRadius: "6px",
    padding: "16px",
    marginBottom: "24px",
  },
  itemRow: {
    borderBottom: "1px solid #e6ebf1",
    padding: "16px 0",
  },
  itemTitle: {
    fontSize: "16px",
    fontWeight: "600",
    lineHeight: "24px",
    margin: "0 0 4px",
    color: "#1a1a1a",
  },
  itemMeta: {
    fontSize: "14px",
    lineHeight: "20px",
    margin: "0 0 4px",
    color: "#525f7f",
  },
  code: {
    fontSize: "32px",
    fontWeight: "700",
    letterSpacing: "0.35em",
    textAlign: "center" as const,
    color: "#1a1a1a",
    margin: "8px 0 24px",
  },
  thumbnail: {
    display: "block",
    borderRadius: "6px",
  },
} as const

interface EmailLayoutProps {
  children: React.ReactNode
  preview?: string
  wide?: boolean
}

export function EmailLayout({ children, preview, wide }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      {preview ? <Preview>{preview}</Preview> : null}
      <Body style={emailStyles.main}>
        <Container
          style={wide ? emailStyles.containerWide : emailStyles.container}
        >
          <Section style={emailStyles.logoSection}>
            <Img
              src={LOGO_URL}
              alt="itsMillerTime"
              width={120}
              style={emailStyles.logo}
            />
          </Section>
          <Section style={emailStyles.section}>{children}</Section>
        </Container>
      </Body>
    </Html>
  )
}

interface ActionEmailTemplateProps {
  greeting: string
  body: React.ReactNode
  buttonText: string
  buttonHref: string
  fallbackText: string
  footerText: string
  preview?: string
}

export function ActionEmailTemplate({
  greeting,
  body,
  buttonText,
  buttonHref,
  fallbackText,
  footerText,
  preview,
}: ActionEmailTemplateProps) {
  return (
    <EmailLayout preview={preview}>
      <Text style={emailStyles.heading}>{greeting}</Text>
      {body}
      <Button href={buttonHref} style={emailStyles.button}>
        {buttonText}
      </Button>
      <Text style={emailStyles.paragraph}>{fallbackText}</Text>
      <Link href={buttonHref} style={emailStyles.link}>
        {buttonHref}
      </Link>
      <Hr style={emailStyles.hr} />
      <Text style={emailStyles.footer}>{footerText}</Text>
    </EmailLayout>
  )
}

export function EmailInfoBox({ children }: { children: React.ReactNode }) {
  return <Section style={emailStyles.infoBox}>{children}</Section>
}

export function EmailOrderItem({
  thumbnail,
  title,
  subtitle,
  meta,
}: {
  thumbnail?: string | null
  title: string
  subtitle?: string | null
  meta?: string | null
}) {
  return (
    <Section style={emailStyles.itemRow}>
      <Row>
        {thumbnail ? (
          <Column style={{ width: "96px", verticalAlign: "top" }}>
            <Img
              src={thumbnail}
              alt={title}
              width="96"
              style={emailStyles.thumbnail}
            />
          </Column>
        ) : null}
        <Column
          style={{
            paddingLeft: thumbnail ? "16px" : "0",
            verticalAlign: "top",
          }}
        >
          <Text style={emailStyles.itemTitle}>{title}</Text>
          {subtitle ? (
            <Text style={emailStyles.itemMeta}>{subtitle}</Text>
          ) : null}
          {meta ? <Text style={emailStyles.itemMeta}>{meta}</Text> : null}
        </Column>
      </Row>
    </Section>
  )
}

export function EmailPriceRow({
  label,
  value,
  bold,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <Row>
      <Column style={{ width: "50%" }}>
        <Text
          style={{
            ...emailStyles.itemMeta,
            fontWeight: bold ? "600" : "400",
            color: bold ? "#1a1a1a" : "#525f7f",
          }}
        >
          {label}
        </Text>
      </Column>
      <Column style={{ width: "50%", textAlign: "right" }}>
        <Text
          style={{
            ...emailStyles.itemMeta,
            fontWeight: bold ? "600" : "400",
            color: bold ? "#1a1a1a" : "#525f7f",
            textAlign: "right",
          }}
        >
          {value}
        </Text>
      </Column>
    </Row>
  )
}
