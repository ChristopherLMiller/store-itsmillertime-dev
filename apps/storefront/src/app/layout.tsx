import { getBaseURL } from "@lib/util/env"
import { SITE_DESCRIPTION, SITE_NAME, SITE_TWITTER } from "@lib/util/site"
import { Outfit, Syne } from "next/font/google"
import { Metadata } from "next"
import { ReactNode } from "react"
import "styles/globals.css"

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "ItsMillerTime" }],
  creator: "ItsMillerTime",
  keywords: [
    "ItsMillerTime",
    "prints",
    "gallery prints",
    "3D prints",
    "models",
    "games",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    site: SITE_TWITTER,
    creator: SITE_TWITTER,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-mode="light"
      className={`${syne.variable} ${outfit.variable}`}
    >
      <body className="bg-paper text-ink antialiased font-sans">
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
