import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { getDepartmentCategories } from "@lib/util/catalog"
import {
  galleryHomeUrl,
  MAIN_SITE_URL,
  SITE_NAME,
} from "@lib/util/site"
import { Text } from "@modules/common/components/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function Footer() {
  const { collections } = await listCollections({
    fields: "*products",
  })
  const productCategories = await listCategories()
  const departments = getDepartmentCategories(productCategories)

  return (
    <footer className="mt-16 w-full bg-night text-cream/55">
      <div
        aria-hidden
        className="h-px bg-gradient-to-r from-transparent via-bronze to-transparent"
      />
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-10 xsmall:flex-row items-start justify-between py-16 small:py-20">
          <div className="max-w-sm">
            <LocalizedClientLink
              href="/"
              className="font-display text-2xl tracking-tight text-cream hover:text-bronze"
            >
              {SITE_NAME}
            </LocalizedClientLink>
            <p className="mt-3 text-sm leading-relaxed">
              A shop next to the gallery — prints, games, and studio work.
            </p>
          </div>
          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3">
            {departments.length > 0 && (
              <div className="flex flex-col gap-y-3">
                <span className="text-bronze">Shop</span>
                <ul
                  className="grid grid-cols-1 gap-2"
                  data-testid="footer-categories"
                >
                  {departments.map((department) => (
                    <li key={department.id}>
                      <LocalizedClientLink
                        className="shop-link hover:text-bronze"
                        href={`/categories/${department.handle}`}
                        data-testid="category-link"
                      >
                        {department.name}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-3">
                <span className="text-bronze">Collections</span>
                <ul className="grid grid-cols-1 gap-2">
                  {collections?.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        className="shop-link hover:text-bronze"
                        href={`/collections/${c.handle}`}
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-y-3">
              <span className="text-bronze">ItsMillerTime</span>
              <ul className="grid grid-cols-1 gap-y-2">
                <li>
                  <a href={MAIN_SITE_URL} className="shop-link hover:text-bronze">
                    Main site
                  </a>
                </li>
                <li>
                  <a href={galleryHomeUrl()} className="shop-link hover:text-bronze">
                    Gallery
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex w-full mb-10 justify-between border-t border-bronze/20 pt-6">
          <Text className="txt-compact-small">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </Text>
        </div>
      </div>
    </footer>
  )
}
