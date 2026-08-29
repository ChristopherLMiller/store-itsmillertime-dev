"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import useToggleState from "@lib/hooks/use-toggle-state"
import { galleryHomeUrl, MAIN_SITE_URL, SITE_NAME } from "@lib/util/site"
import { ArrowRightMini, XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Text, clx } from "@modules/common/components/ui"
import { Fragment } from "react"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { Locale } from "@lib/data/locales"

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
  departments: { name: string; handle: string }[]
}

const SideMenu = ({
  regions,
  locales,
  currentLocale,
  departments,
}: SideMenuProps) => {
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              <div className="relative flex h-full">
                <Popover.Button
                  data-testid="nav-menu-button"
                  className="relative h-full flex items-center text-cream/65 hover:text-bronze transition-all ease-out duration-200 focus:outline-none"
                >
                  Menu
                </Popover.Button>
              </div>

              {open && (
                <div
                  className="fixed inset-0 z-[50] bg-black/0 pointer-events-auto"
                  onClick={close}
                  data-testid="side-menu-backdrop"
                />
              )}

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="opacity-0"
                enterTo="opacity-100 backdrop-blur-2xl"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 backdrop-blur-2xl"
                leaveTo="opacity-0"
              >
                <PopoverPanel className="flex flex-col absolute w-full pr-4 sm:pr-0 sm:w-1/3 2xl:w-1/4 sm:min-w-min h-[calc(100vh-1rem)] z-[51] inset-x-0 text-sm text-cream m-2">
                  <div
                    data-testid="nav-menu-popup"
                    className="flex flex-col h-full bg-night border border-bronze/30 rounded-sm justify-between p-6 shadow-lift-lg"
                  >
                    <div className="flex justify-end" id="xmark">
                      <button data-testid="close-menu-button" onClick={close} className="text-cream">
                        <XMark />
                      </button>
                    </div>
                    <ul className="flex flex-col gap-6 items-start justify-start">
                      <li>
                        <LocalizedClientLink
                          href="/"
                          className="font-display text-2xl leading-10 tracking-tight hover:text-bronze"
                          onClick={close}
                          data-testid="home-link"
                        >
                          Home
                        </LocalizedClientLink>
                      </li>
                      {departments.map((department) => (
                        <li key={department.handle}>
                          <LocalizedClientLink
                            href={`/categories/${department.handle}`}
                            className="font-display text-2xl leading-10 tracking-tight hover:text-bronze"
                            onClick={close}
                            data-testid={`${department.handle}-link`}
                          >
                            {department.name}
                          </LocalizedClientLink>
                        </li>
                      ))}
                      <li>
                        <a
                          href={galleryHomeUrl()}
                          className="font-display text-2xl leading-10 tracking-tight hover:text-bronze"
                          onClick={close}
                          data-testid="gallery-link"
                        >
                          Gallery
                        </a>
                      </li>
                      <li>
                        <a
                          href={MAIN_SITE_URL}
                          className="font-display text-2xl leading-10 tracking-tight hover:text-bronze"
                          onClick={close}
                          data-testid="main-site-link"
                        >
                          Main site
                        </a>
                      </li>
                      <li>
                        <LocalizedClientLink
                          href="/account"
                          className="font-display text-2xl leading-10 tracking-tight hover:text-bronze"
                          onClick={close}
                          data-testid="account-link"
                        >
                          Account
                        </LocalizedClientLink>
                      </li>
                      <li>
                        <LocalizedClientLink
                          href="/cart"
                          className="font-display text-2xl leading-10 tracking-tight hover:text-bronze"
                          onClick={close}
                          data-testid="cart-link"
                        >
                          Cart
                        </LocalizedClientLink>
                      </li>
                    </ul>
                    <div className="flex flex-col gap-y-6">
                      {!!locales?.length && (
                        <div
                          className="flex justify-between"
                          onMouseEnter={languageToggleState.open}
                          onMouseLeave={languageToggleState.close}
                        >
                          <LanguageSelect
                            toggleState={languageToggleState}
                            locales={locales}
                            currentLocale={currentLocale}
                          />
                          <ArrowRightMini
                            className={clx(
                              "transition-transform duration-150",
                              languageToggleState.state ? "-rotate-90" : ""
                            )}
                          />
                        </div>
                      )}
                      <div
                        className="flex justify-between"
                        onMouseEnter={countryToggleState.open}
                        onMouseLeave={countryToggleState.close}
                      >
                        {regions && (
                          <CountrySelect
                            toggleState={countryToggleState}
                            regions={regions}
                          />
                        )}
                        <ArrowRightMini
                          className={clx(
                            "transition-transform duration-150",
                            countryToggleState.state ? "-rotate-90" : ""
                          )}
                        />
                      </div>
                      <Text className="flex justify-between txt-compact-small">
                        © {new Date().getFullYear()} {SITE_NAME}. All rights
                        reserved.
                      </Text>
                    </div>
                  </div>
                </PopoverPanel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
