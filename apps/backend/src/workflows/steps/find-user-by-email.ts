import type { UserDTO } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export const findUserByEmailStep = createStep(
  "find-user-by-email",
  async (input: { email: string }, { container }) => {
    const userModule = container.resolve(Modules.USER)
    const [user] = await userModule.listUsers(
      { email: input.email },
      { take: 1 }
    )

    return new StepResponse<UserDTO | null>(user ?? null)
  }
)
