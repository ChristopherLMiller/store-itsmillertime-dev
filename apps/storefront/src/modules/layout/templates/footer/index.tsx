import { listCategories } from "@lib/data/categories";
import { listCollections } from "@lib/data/collections";
import { getDepartmentCategories } from "@lib/util/catalog";
import {
  galleryHomeUrl,
  MAIN_SITE_URL,
  SITE_NAME,
} from "@lib/util/site";
import { Text, clx } from "@modules/common/components/ui";

import LocalizedClientLink from "@modules/common/components/localized-client-link";

export default async function Footer() {
  const { collections } = await listCollections({
    fields: "*products",
  });
  const productCategories = await listCategories();
  const departments = getDepartmentCategories(productCategories);

  return (
    <footer className="border-t border-stone-200 w-full">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-10 xsmall:flex-row items-start justify-between py-16 small:py-24">
          <div>
            <LocalizedClientLink
              href="/"
              className="text-stone-900 hover:text-stone-600"
            >
              {SITE_NAME}
            </LocalizedClientLink>
          </div>
          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3">
            {departments.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base">
                  Shop
                </span>
                <ul
                  className="grid grid-cols-1 gap-2"
                  data-testid="footer-categories"
                >
                  {departments.map((department) => (
                    <li
                      className="flex flex-col gap-2 text-ui-fg-subtle txt-small"
                      key={department.id}
                    >
                      <LocalizedClientLink
                        className="hover:text-ui-fg-base"
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
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base">
                  Collections
                </span>
                <ul
                  className={clx(
                    "grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small",
                    {
                      "grid-cols-2": (collections?.length || 0) > 3,
                    }
                  )}
                >
                  {collections?.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        className="hover:text-ui-fg-base"
                        href={`/collections/${c.handle}`}
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-y-2">
              <span className="text-sm text-stone-900">ItsMillerTime</span>
              <ul className="grid grid-cols-1 gap-y-2 text-ui-fg-subtle txt-small">
                <li>
                  <a
                    href={MAIN_SITE_URL}
                    className="hover:text-ui-fg-base"
                  >
                    Main site
                  </a>
                </li>
                <li>
                  <a
                    href={galleryHomeUrl()}
                    className="hover:text-ui-fg-base"
                  >
                    Gallery
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex w-full mb-16 justify-between text-ui-fg-muted">
          <Text className="txt-compact-small">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </Text>
        </div>
      </div>
    </footer>
  );
}
