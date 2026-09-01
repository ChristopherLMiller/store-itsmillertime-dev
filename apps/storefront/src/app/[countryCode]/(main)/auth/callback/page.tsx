import { Metadata } from "next"
import { Suspense } from "react"

import AuthentikCallback from "@modules/account/components/authentik-callback"

export const metadata: Metadata = {
  title: "Signing in",
  description: "Finishing Authentik sign-in.",
}

export default function AuthentikCallbackPage() {
  return (
    <div className="w-full flex justify-center px-6 py-16 small:py-24 min-h-[calc(100dvh-12rem)]">
      <Suspense
        fallback={
          <p className="text-sm text-ink-muted">Finishing Authentik sign-in…</p>
        }
      >
        <AuthentikCallback />
      </Suspense>
    </div>
  )
}
