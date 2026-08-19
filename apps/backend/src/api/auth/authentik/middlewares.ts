import {
  authenticate,
  type MiddlewareRoute,
} from "@medusajs/framework/http"

export const authentikAuthMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/auth/authentik/register-user",
    method: "POST",
    middlewares: [
      authenticate("user", ["bearer", "session"], {
        allowUnregistered: true,
      }),
    ],
  },
]
