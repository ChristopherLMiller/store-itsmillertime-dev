"use client"

import { requestPasswordReset } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const ForgotPassword = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(requestPasswordReset, null)

  return (
    <div className="w-full flex flex-col" data-testid="forgot-password-page">
      <p className="shop-kicker">Account</p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink">
        Reset your password
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        Enter the email for your shop account. If it exists, we&apos;ll send a
        reset link.
      </p>
      {message?.state === "reset_sent" && (
        <div
          className="w-full mt-6 text-sm leading-relaxed text-ink bg-paper border border-bronze/25 p-4"
          data-testid="forgot-password-sent"
        >
          If an account exists for <strong>{message.email}</strong>, we sent
          password reset instructions.
        </div>
      )}
      <form className="w-full mt-8" action={formAction}>
        <Input
          label="Email"
          name="email"
          type="email"
          title="Enter a valid email address."
          autoComplete="email"
          required
          data-testid="forgot-password-email"
        />
        <ErrorMessage
          error={message?.state === "error" ? message.error : null}
          data-testid="forgot-password-error"
        />
        <SubmitButton
          data-testid="forgot-password-submit"
          className="w-full mt-6 h-11"
        >
          Send reset link
        </SubmitButton>
      </form>
      <p className="text-center text-sm text-ink-muted mt-8">
        Remembered it?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="shop-link text-bronze hover:text-bronze-deep"
          data-testid="back-to-sign-in"
        >
          Sign in
        </button>
      </p>
    </div>
  )
}

export default ForgotPassword
