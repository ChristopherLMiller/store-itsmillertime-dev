import { Metadata } from "next"
import { Suspense } from "react"

import ResetPassword from "@modules/account/components/reset-password"

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your shop account.",
}

type Props = {
  searchParams: Promise<{ token?: string; email?: string }>
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token = null, email = null } = await searchParams

  return (
    <div className="w-full flex justify-center px-6 py-16 small:py-24 min-h-[calc(100dvh-12rem)]">
      <Suspense
        fallback={
          <p className="text-sm text-ink-muted">Loading reset form…</p>
        }
      >
        <ResetPassword token={token} email={email} />
      </Suspense>
    </div>
  )
}
