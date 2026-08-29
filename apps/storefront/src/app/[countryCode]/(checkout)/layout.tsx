import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import SandboxModeBanner from "@modules/layout/components/sandbox-mode-banner"
import { SITE_NAME } from "@lib/util/site"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-paper relative small:min-h-screen">
      <SandboxModeBanner />
      <div className="h-16 bg-night text-cream">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="text-small-semi text-cream/60 flex items-center gap-x-2 flex-1 basis-0 hover:text-bronze"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="mt-px hidden small:block">
              Back to shopping cart
            </span>
            <span className="mt-px block small:hidden">Back</span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="font-display text-lg tracking-tight text-cream hover:text-bronze"
            data-testid="store-link"
          >
            {SITE_NAME}
          </LocalizedClientLink>
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">
        {children}
      </div>
      <div className="py-4 w-full flex items-center justify-center text-ink-muted txt-compact-small">
        {SITE_NAME}
      </div>
    </div>
  )
}
