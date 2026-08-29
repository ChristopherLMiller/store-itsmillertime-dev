"use client"

import { useActionState } from "react"
import Input from "@modules/common/components/input"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"
import { SITE_NAME } from "@lib/util/site"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(signup, null)

  return (
    <div className="w-full flex flex-col" data-testid="register-page">
      <p className="shop-kicker">Account</p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink">
        Create an account
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        Save addresses and check on orders at {SITE_NAME}.
      </p>
      {message?.state === "verification_required" && (
        <div
          className="w-full mt-6 text-sm leading-relaxed text-ink bg-paper border border-bronze/25 p-4"
          data-testid="register-verification-message"
        >
          We sent a verification link to <strong>{message.email}</strong>.
          Please check your inbox to verify your email, then sign in.
        </div>
      )}
      <form className="w-full flex flex-col mt-8" action={formAction}>
        <div className="flex flex-col w-full gap-4">
          <Input
            label="First name"
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
          />
          <Input
            label="Last name"
            name="last_name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
          />
          <Input
            label="Email"
            name="email"
            required
            type="email"
            autoComplete="email"
            data-testid="email-input"
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            data-testid="phone-input"
          />
          <Input
            label="Password"
            name="password"
            required
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
          />
        </div>
        <ErrorMessage
          error={message?.state === "error" ? message.error : null}
          data-testid="register-error"
        />
        <p className="text-center text-xs leading-relaxed text-ink-muted mt-6">
          By creating an account, you agree to {SITE_NAME}&apos;s{" "}
          <LocalizedClientLink
            href="/content/privacy-policy"
            className="shop-link text-bronze hover:text-bronze-deep"
          >
            Privacy Policy
          </LocalizedClientLink>{" "}
          and{" "}
          <LocalizedClientLink
            href="/content/terms-of-use"
            className="shop-link text-bronze hover:text-bronze-deep"
          >
            Terms of Use
          </LocalizedClientLink>
          .
        </p>
        <SubmitButton className="w-full mt-6 h-11" data-testid="register-button">
          Join
        </SubmitButton>
      </form>
      <p className="text-center text-sm text-ink-muted mt-8">
        Already a member?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="shop-link text-bronze hover:text-bronze-deep"
        >
          Sign in
        </button>
      </p>
    </div>
  )
}

export default Register
