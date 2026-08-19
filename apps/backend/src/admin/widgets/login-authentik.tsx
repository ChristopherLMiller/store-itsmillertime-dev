import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Spinner } from "@medusajs/icons"
import { Button, toast } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { sdk } from "../lib/client"
import {
  authentikErrorMessage,
  completeAuthentikLogin,
  getAuthentikCallbackQuery,
} from "../lib/complete-authentik-login"

const PROVIDER = "authentik"

let activeCallbackKey: string | null = null

const AuthentikLogin = () => {
  const navigate = useNavigate()
  const handledCallback = useRef(false)
  const [isCallbackPending, setIsCallbackPending] = useState(false)

  const { data: status } = useQuery({
    queryKey: ["authentik-status"],
    queryFn: () =>
      sdk.client.fetch<{ enabled: boolean }>("/auth/authentik/status"),
  })

  const handleCallback = useCallback(async () => {
    setIsCallbackPending(true)
    try {
      await completeAuthentikLogin(getAuthentikCallbackQuery())
      navigate("/orders", { replace: true })
    } catch (error) {
      console.error("Authentik authentication error:", error)
      toast.error(authentikErrorMessage(error))
      navigate("/login", { replace: true })
    }
    setIsCallbackPending(false)
  }, [navigate])

  useEffect(() => {
    const query = getAuthentikCallbackQuery()
    const callbackKey = query.code || query.error
    if (
      !callbackKey ||
      handledCallback.current ||
      activeCallbackKey === callbackKey
    ) {
      return
    }

    handledCallback.current = true
    activeCallbackKey = callbackKey
    void handleCallback()
  }, [handleCallback])

  const signIn = async () => {
    try {
      const result = await sdk.auth.login("user", PROVIDER, {})

      if (typeof result === "object" && result && "location" in result) {
        window.location.href = result.location
        return
      }

      toast.error("Authentik sign-in failed")
    } catch (error) {
      toast.error(authentikErrorMessage(error))
    }
  }

  if (isCallbackPending) {
    return (
      <div className="bg-ui-bg-subtle fixed inset-0 z-50 flex items-center justify-center">
        <Spinner className="text-ui-fg-subtle animate-spin" />
      </div>
    )
  }

  if (!status?.enabled) {
    return null
  }

  return (
    <>
      <hr className="bg-ui-border-base my-4" />
      <Button
        variant="secondary"
        className="w-full"
        onClick={() => void signIn()}
      >
        Sign in with Authentik
      </Button>
    </>
  )
}

export const config = defineWidgetConfig({
  zone: "login.after",
})

export default AuthentikLogin
