import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)

  return (
    <div
      className="w-full flex flex-col"
      data-testid="login-page"
    >
      <p className="shop-kicker">Account</p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink">
        Welcome back
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        Sign in to see orders and saved addresses.
      </p>
      {message?.state === "verification_required" && (
        <div
          className="w-full mt-6 text-sm leading-relaxed text-ink bg-paper border border-bronze/25 p-4"
          data-testid="login-verification-message"
        >
          We sent a verification link to <strong>{message.email}</strong>.
          Please verify your email, then sign in.
        </div>
      )}
      <form className="w-full mt-8" action={formAction}>
        <div className="flex flex-col w-full gap-4">
          <Input
            label="Email"
            name="email"
            type="email"
            title="Enter a valid email address."
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <ErrorMessage
          error={message?.state === "error" ? message.error : null}
          data-testid="login-error-message"
        />
        <SubmitButton data-testid="sign-in-button" className="w-full mt-6 h-11">
          Sign in
        </SubmitButton>
      </form>
      <p className="text-center text-sm text-ink-muted mt-8">
        Not a member?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="shop-link text-bronze hover:text-bronze-deep"
          data-testid="register-button"
        >
          Join us
        </button>
      </p>
    </div>
  )
}

export default Login
