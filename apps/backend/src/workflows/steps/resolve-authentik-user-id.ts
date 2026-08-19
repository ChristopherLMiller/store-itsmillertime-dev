import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export const resolveAuthentikUserIdStep = createStep(
  "resolve-authentik-user-id",
  async (input: { user_id?: string | null }) => {
    if (!input.user_id) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Unable to resolve a Medusa admin user for Authentik"
      )
    }

    return new StepResponse(input.user_id)
  }
)
