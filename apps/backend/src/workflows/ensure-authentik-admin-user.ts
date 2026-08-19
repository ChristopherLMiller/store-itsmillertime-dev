import {
  createUsersWorkflow,
  setAuthAppMetadataStep,
} from "@medusajs/medusa/core-flows"
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { findUserByEmailStep } from "./steps/find-user-by-email"
import { getAuthentikIdentityStep } from "./steps/get-authentik-identity"
import { resolveAuthentikUserIdStep } from "./steps/resolve-authentik-user-id"

type WorkflowInput = {
  auth_identity_id: string
}

export const ensureAuthentikAdminUserWorkflow = createWorkflow(
  "ensure-authentik-admin-user",
  function (input: WorkflowInput) {
    const identity = getAuthentikIdentityStep(input)
    const existingUser = findUserByEmailStep({ email: identity.email })

    const createUsersInput = transform({ identity }, ({ identity }) => {
      return {
        users: [
          {
            email: identity.email,
            first_name: identity.first_name,
            last_name: identity.last_name,
          },
        ],
      }
    })

    const createdUsers = when(
      { existingUser },
      ({ existingUser }) => !existingUser
    ).then(() => {
      return createUsersWorkflow.runAsStep({
        input: createUsersInput,
      })
    })

    const unresolvedUserId = transform(
      { existingUser, createdUsers },
      ({ existingUser, createdUsers }) =>
        existingUser?.id ?? createdUsers?.[0]?.id
    )

    const userId = resolveAuthentikUserIdStep({ user_id: unresolvedUserId })

    const authUserInput = transform(
      { input, userId },
      ({ input, userId }) => {
        return {
          authIdentityId: input.auth_identity_id,
          actorType: "user",
          value: userId,
        }
      }
    )

    setAuthAppMetadataStep(authUserInput)

    return new WorkflowResponse({
      user_id: userId,
    })
  }
)
