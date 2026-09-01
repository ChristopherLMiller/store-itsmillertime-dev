"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"

import { completeAuthentikCustomerLogin } from "@lib/data/customer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const AuthentikCallback = () => {
  const searchParams = useSearchParams()
  const { countryCode } = useParams() as { countryCode: string }
  const [error, setError] = useState<string | null>(null)
  const [verificationEmail, setVerificationEmail] = useState<string | null>(
    null
  )
  const started = useRef(false)

  useEffect(() => {
    if (started.current) {
      return
    }
    started.current = true

    const query: Record<string, string> = {}
    for (const key of ["code", "state", "error", "error_description"]) {
      const value = searchParams.get(key)
      if (value) {
        query[key] = value
      }
    }

    completeAuthentikCustomerLogin(query).then((result) => {
      if (!result) {
        return
      }

      if (result.state === "success") {
        window.location.assign(`/${countryCode}/account`)
        return
      }

      if (result.state === "verification_required") {
        setVerificationEmail(result.email)
        return
      }

      if (result.state === "error") {
        setError(result.error)
      }
    })
  }, [countryCode, searchParams])

  return (
    <div
      className="w-full max-w-md shop-panel p-8 small:p-10 shop-fade-up"
      data-testid="authentik-callback-page"
    >
      <p className="shop-kicker">Account</p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink">
        {error || verificationEmail ? "Sign in" : "Signing you in"}
      </h1>
      {!error && !verificationEmail && (
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Finishing your Authentik sign-in…
        </p>
      )}
      {verificationEmail && (
        <p className="mt-3 text-sm leading-relaxed text-ink">
          We sent a verification link to <strong>{verificationEmail}</strong>.
          Please verify your email, then sign in.
        </p>
      )}
      {error && (
        <p
          className="mt-3 text-sm leading-relaxed text-rose-500"
          data-testid="authentik-callback-error"
        >
          {error}
        </p>
      )}
      {(error || verificationEmail) && (
        <p className="mt-8 text-sm">
          <LocalizedClientLink
            href="/account"
            className="shop-link text-bronze hover:text-bronze-deep"
          >
            Back to sign in
          </LocalizedClientLink>
        </p>
      )}
    </div>
  )
}

export default AuthentikCallback
