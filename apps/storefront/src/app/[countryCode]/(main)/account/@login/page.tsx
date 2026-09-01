import { Metadata } from "next"

import LoginTemplate from "@modules/account/templates/login-template"
import { getAuthentikCustomerLoginEnabled } from "@lib/data/customer"
import { SITE_NAME } from "@lib/util/site"

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to your ${SITE_NAME} account.`,
}

export default async function Login() {
  const authentikEnabled = await getAuthentikCustomerLoginEnabled()

  return <LoginTemplate authentikEnabled={authentikEnabled} />
}
