import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { getDepartmentCategories } from "@lib/util/catalog"
import { galleryHomeUrl, MAIN_SITE_URL, SITE_NAME } from "@lib/util/site"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"

export default async function Nav() {
  const [regions, locales, currentLocale, categories] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
    listCategories(),
  ])

  const departments = getDepartmentCategories(categories)

  return (
    <div className="sticky top-0 inset-x-0 z-50">
      <header className="relative h-16 mx-auto border-b border-stone-200/80 bg-[#f6f3ef]/90 backdrop-blur-md">
        <nav className="content-container flex items-center justify-between w-full h-full text-sm text-stone-600">
          <div className="flex items-center gap-8 h-full min-w-0">
            <div className="h-full small:hidden">
              <SideMenu
                regions={regions}
                locales={locales}
                currentLocale={currentLocale}
                departments={departments.map((department) => ({
                  name: department.name,
                  handle: department.handle,
                }))}
              />
            </div>
            <LocalizedClientLink
              href="/"
              className="text-stone-900 tracking-tight hover:text-stone-700 truncate"
              data-testid="nav-store-link"
            >
              {SITE_NAME}
            </LocalizedClientLink>
            <div className="hidden small:flex items-center gap-6">
              {departments.map((department) => (
                <LocalizedClientLink
                  key={department.id}
                  className="hover:text-stone-900"
                  href={`/categories/${department.handle}`}
                >
                  {department.name}
                </LocalizedClientLink>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 h-full">
            <a
              className="hidden small:inline hover:text-stone-900"
              href={galleryHomeUrl()}
            >
              Gallery
            </a>
            <a
              className="hidden small:inline hover:text-stone-900"
              href={MAIN_SITE_URL}
              data-testid="nav-main-site-link"
            >
              Main site
            </a>
            <LocalizedClientLink
              className="hidden small:inline hover:text-stone-900"
              href="/account"
              data-testid="nav-account-link"
            >
              Account
            </LocalizedClientLink>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-stone-900"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
            <div className="hidden small:block h-full">
              <SideMenu
                regions={regions}
                locales={locales}
                currentLocale={currentLocale}
                departments={departments.map((department) => ({
                  name: department.name,
                  handle: department.handle,
                }))}
              />
            </div>
          </div>
        </nav>
      </header>
    </div>
  )
}
