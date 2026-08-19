import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type AuthentikIdentityDetails = {
  email: string
  first_name?: string
  last_name?: string
}

export const getAuthentikIdentityStep = createStep(
  "get-authentik-identity",
  async (input: { auth_identity_id: string }, { container }) => {
    const authModule = container.resolve(Modules.AUTH)
    const identity = await authModule.retrieveAuthIdentity(
      input.auth_identity_id,
      { relations: ["provider_identities"] }
    )

    const providerIdentity =
      identity.provider_identities?.find(
        (item) => item.provider === "authentik"
      ) || identity.provider_identities?.[0]

    const metadata = (providerIdentity?.user_metadata ?? {}) as Record<
      string,
      unknown
    >
    const email =
      (typeof metadata.email === "string" && metadata.email) ||
      providerIdentity?.entity_id

    if (!email || !email.includes("@")) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Authentik identity is missing an email address"
      )
    }

    const firstName =
      typeof metadata.given_name === "string" ? metadata.given_name : undefined
    const lastName =
      typeof metadata.family_name === "string"
        ? metadata.family_name
        : undefined

    return new StepResponse<AuthentikIdentityDetails>({
      email,
      first_name: firstName,
      last_name: lastName,
    })
  }
)
