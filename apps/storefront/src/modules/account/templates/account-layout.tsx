import React from "react"

import UnderlineLink from "@modules/common/components/interactive-link"
import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  if (!customer) {
    return (
      <div
        className="w-full flex items-center justify-center px-6 py-16 small:py-24 min-h-[calc(100dvh-12rem)]"
        data-testid="account-page"
      >
        {children}
      </div>
    )
  }

  return (
    <div className="flex-1 small:py-12" data-testid="account-page">
      <div className="flex-1 content-container h-full max-w-5xl mx-auto shop-panel flex flex-col">
        <div className="grid grid-cols-1 small:grid-cols-[240px_1fr] py-12 px-6">
          <div>
            <AccountNav customer={customer} />
          </div>
          <div className="flex-1">{children}</div>
        </div>
        <div className="flex flex-col small:flex-row items-end justify-between small:border-t border-bronze/20 py-12 gap-8 px-6">
          <div>
            <h3 className="font-display text-2xl tracking-tight mb-3">
              Need a hand?
            </h3>
            <span className="text-ink-muted">
              Browse the shop, or hop back to the main site if you were looking
              for the gallery.
            </span>
          </div>
          <div>
            <UnderlineLink href="/store">Back to the shop</UnderlineLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
