import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export default async function inviteCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{
  id: string
}>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  const config = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)

  const {
    data: [invite],
  } = await query.graph({
    entity: "invite",
    fields: ["email", "token"],
    filters: {
      id: data.id,
    },
  })

  const backendUrl =
    config.admin.backendUrl !== "/"
      ? config.admin.backendUrl
      : "http://localhost:9000"
  const adminPath = config.admin.path

  await notificationModuleService.createNotifications({
    to: invite.email,
    template: "user-invited",
    channel: "email",
    data: {
      invite_url: `${backendUrl}${adminPath}/invite?token=${invite.token}`,
    },
  })
}

export const config: SubscriberConfig = {
  event: ["invite.created", "invite.resent"],
}
