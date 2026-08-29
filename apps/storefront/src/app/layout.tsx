import { getBaseURL } from "@lib/util/env"
import { Outfit, Syne } from "next/font/google"
import { Metadata } from "next"
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
}

export default function RootLayout(props: { children: React.ReactNode }) {
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
