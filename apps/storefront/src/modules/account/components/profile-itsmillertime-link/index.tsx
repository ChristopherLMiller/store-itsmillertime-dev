"use client"

import { useActionState, useEffect, useState, useTransition } from "react"
import { Button } from "@modules/common/components/ui"
import Input from "@modules/common/components/input"
import {
  confirmItsMillerTimeLink,
  startItsMillerTimeLink,
  unlinkItsMillerTimeAccount,
  type AccountLinkStatus,
} from "@lib/data/account-link"

type Props = {
  initialStatus: AccountLinkStatus | null
}

const ProfileItsMillerTimeLink = ({ initialStatus }: Props) => {
  const [status, setStatus] = useState(initialStatus)
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [targetEmail, setTargetEmail] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [startState, startAction] = useActionState(startItsMillerTimeLink, {
    success: false,
    error: null as string | null,
  })

  const [confirmState, confirmAction] = useActionState(
    confirmItsMillerTimeLink,
    {
      success: false,
      error: null as string | null,
    }
  )

  useEffect(() => {
    if (startState.success && startState.challenge_id) {
      setChallengeId(startState.challenge_id)
      setTargetEmail(startState.target_email || null)
      setMessage(
        `We sent a one-time code to ${startState.target_email}. Enter it below to finish linking.`
      )
    } else if (startState.error) {
      setMessage(startState.error)
    }
  }, [startState])

  useEffect(() => {
    if (confirmState.success) {
      setChallengeId(null)
      setMessage("itsMillerTime account linked.")
      setStatus({
        linked: true,
        brand: "itsMillerTime",
        payload_user_id: "linked",
        payload_email: targetEmail,
        linked_at: new Date().toISOString(),
        roles: [],
      })
      setTargetEmail(null)
    } else if (confirmState.error) {
      setMessage(confirmState.error)
    }
  }, [confirmState, targetEmail])

  const handleUnlink = () => {
    startTransition(async () => {
      const result = await unlinkItsMillerTimeAccount()
      if (result.success) {
        setStatus({
          linked: false,
          brand: "itsMillerTime",
          payload_user_id: null,
          payload_email: null,
          linked_at: null,
          roles: [],
        })
        setMessage("itsMillerTime account unlinked.")
      } else {
        setMessage(result.error)
      }
    })
  }

  return (
    <div className="w-full" data-testid="account-itsmillertime-link">
      <div className="flex flex-col gap-y-2">
        <span className="uppercase text-ui-fg-base text-small-regular">
          itsMillerTime account
        </span>
        <p className="text-base-regular text-ui-fg-subtle">
          Link your itsMillerTime account so private gallery prints and family
          access can follow you into the shop. Emails do not need to match —
          we&apos;ll email a one-time code to the itsMillerTime inbox you enter.
        </p>

        {status?.linked ? (
          <div className="flex flex-col gap-y-3 mt-2">
            <p className="text-base-regular">
              Linked to{" "}
              <span className="font-semibold">
                {status.payload_email || "itsMillerTime account"}
              </span>
              {status.roles.length > 0
                ? ` · roles: ${status.roles.join(", ")}`
                : null}
            </p>
            <Button
              variant="secondary"
              onClick={handleUnlink}
              isLoading={isPending}
              data-testid="unlink-itsmillertime-button"
            >
              Unlink itsMillerTime account
            </Button>
          </div>
        ) : challengeId ? (
          <form action={confirmAction} className="flex flex-col gap-y-3 mt-2">
            <input type="hidden" name="challenge_id" value={challengeId} />
            <Input
              label="One-time code"
              name="code"
              required
              autoComplete="one-time-code"
              data-testid="itsmillertime-otp-input"
            />
            <div className="flex gap-x-2">
              <Button type="submit" data-testid="confirm-itsmillertime-button">
                Confirm link
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setChallengeId(null)
                  setTargetEmail(null)
                  setMessage(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <form action={startAction} className="flex flex-col gap-y-3 mt-2">
            <Input
              label="itsMillerTime account email"
              name="email"
              type="email"
              required
              autoComplete="email"
              data-testid="itsmillertime-email-input"
            />
            <Button type="submit" data-testid="link-itsmillertime-button">
              Link itsMillerTime account
            </Button>
          </form>
        )}

        {message ? (
          <p className="text-small-regular text-ui-fg-subtle" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default ProfileItsMillerTimeLink
