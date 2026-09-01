"use client"

import { resetPassword } from "@lib/data/customer"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useActionState } from "react"

type Props = {
  token: string | null
  email: string | null
}

const ResetPassword = ({ token, email }: Props) => {
  const [message, formAction] = useActionState(resetPassword, null)
  const hasToken = Boolean(token)

  return (
    <div
      className="w-full max-w-md shop-panel p-8 small:p-10 shop-fade-up"
      data-testid="reset-password-page"
    >
      <p className="shop-kicker">Account</p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink">
        Choose a new password
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        Enter a new password for {email || "your shop account"}.
      </p>
      {message?.state === "reset_success" && (
        <div
          className="w-full mt-6 text-sm leading-relaxed text-ink bg-paper border border-bronze/25 p-4"
          data-testid="reset-password-success"
        >
          Your password is updated. You can sign in with it now.
        </div>
      )}
      {!hasToken && (
        <div className="w-full mt-6 text-sm leading-relaxed text-ink bg-paper border border-bronze/25 p-4">
          This reset link is invalid or has expired. Request a new one from
          sign in.
        </div>
      )}
      {hasToken && message?.state !== "reset_success" && (
        <form className="w-full mt-8" action={formAction}>
          <input type="hidden" name="token" value={token ?? ""} />
          <input type="hidden" name="email" value={email ?? ""} />
          <div className="flex flex-col w-full gap-4">
            <Input
              label="New password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              data-testid="reset-password-input"
            />
            <Input
              label="Confirm password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              required
              data-testid="reset-password-confirm"
            />
          </div>
          <ErrorMessage
            error={message?.state === "error" ? message.error : null}
            data-testid="reset-password-error"
          />
          <SubmitButton
            data-testid="reset-password-submit"
            className="w-full mt-6 h-11"
          >
            Update password
          </SubmitButton>
        </form>
      )}
      <p className="text-center text-sm text-ink-muted mt-8">
        <LocalizedClientLink
          href="/account"
          className="shop-link text-bronze hover:text-bronze-deep"
        >
          Back to sign in
        </LocalizedClientLink>
      </p>
    </div>
  )
}

export default ResetPassword
