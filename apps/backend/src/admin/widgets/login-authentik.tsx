import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, toast } from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { sdk } from "../lib/client"

const PROVIDER = "authentik"

type JwtPayload = {
  actor_id?: string
}

function decodeJwtPayload(token: string): JwtPayload {
  const payload = token.split(".")[1]
  if (!payload) {
    return {}
  }

  const padded = payload.replace(/-/g, "+").replace(/_/g, "/")
  return JSON.parse(atob(padded)) as JwtPayload
}

const AuthentikLogin = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const handledCallback = useRef(false)

  const { data: status } = useQuery({
    queryKey: ["authentik-status"],
    queryFn: () =>
      sdk.client.fetch<{ enabled: boolean }>("/auth/authentik/status"),
  })

  const { mutateAsync: completeCallback, isPending } = useMutation({
    mutationFn: async () => {
      const result = await sdk.auth.callback(
        "user",
        PROVIDER,
        Object.fromEntries(searchParams)
      )

      const token = typeof result === "string" ? result : result.token
      if (!token) {
        throw new Error("Authentik callback did not return a token")
      }

      const decoded = decodeJwtPayload(token)
      const userExists = Boolean(decoded.actor_id)

      if (!userExists) {
        await sdk.client.fetch("/auth/authentik/register-user", {
          method: "POST",
          body: {},
        })
        await sdk.auth.refresh()
      }

      navigate("/orders", { replace: true })
    },
    onError: (error) => {
      console.error("Authentik authentication error:", error)
      toast.error("Authentik sign-in failed")
    },
  })

  useEffect(() => {
    if (searchParams.get("error")) {
      toast.error(searchParams.get("error_description") || "Access denied")
      return
    }

    if (!searchParams.get("code") || handledCallback.current) {
      return
    }

    handledCallback.current = true
    void completeCallback()
  }, [searchParams, completeCallback])

  const signIn = async () => {
    const result = await sdk.auth.login("user", PROVIDER, {
      callback_url: `${window.location.origin}${window.location.pathname}`,
    })

    if (typeof result === "object" && result && "location" in result) {
      window.location.href = result.location
      return
    }

    toast.error("Authentik sign-in failed")
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
        isLoading={isPending}
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
