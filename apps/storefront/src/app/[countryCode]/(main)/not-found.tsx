import { Metadata } from "next"

import InteractiveLink from "@modules/common/components/interactive-link"

export const metadata: Metadata = {
  title: "404",
  description: "Something went wrong",
}

export default function NotFound() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)]">
      <p className="text-sm text-ink-muted">Lost</p>
      <h1 className="font-display text-3xl tracking-tight text-ink">Page not found</h1>
      <p className="text-small-regular text-ink-muted">
        The page you tried to access does not exist.
      </p>
      <InteractiveLink href="/">Back to the shop</InteractiveLink>
    </div>
  )
}
