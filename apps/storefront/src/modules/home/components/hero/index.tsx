import { SITE_NAME } from "@lib/util/site"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Heading } from "@modules/common/components/ui"
import Image from "next/image"

const Hero = ({ featuredImage }: { featuredImage?: string | null }) => {
  return (
    <section className="relative overflow-hidden bg-night text-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-bronze/20 via-transparent to-brick/15"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-moss/25 blur-3xl shop-drift"
      />
      <div className="content-container relative py-14 small:py-20">
        <div className="grid grid-cols-1 small:grid-cols-2 gap-10 small:gap-16 items-center">
          <div>
            <p className="shop-kicker text-bronze shop-fade-up">{SITE_NAME}</p>
            <Heading
              level="h1"
              className="mt-3 font-display font-medium text-4xl small:text-5xl leading-[1.1] tracking-tight text-cream shop-fade-up [animation-delay:90ms]"
            >
              Prints from the gallery, plus the rest of the studio.
            </Heading>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-cream/70 shop-fade-up [animation-delay:160ms]">
              Choose a photo and how you want it printed. Board games, models, and
              other one-offs live here too.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm shop-fade-up [animation-delay:260ms]">
              <LocalizedClientLink
                href="/categories/prints"
                className="inline-flex h-11 items-center rounded-sm bg-brick px-5 text-cream shadow-lift transition-[transform,background-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:bg-brick-deep hover:shadow-lift-md"
              >
                Browse prints
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/categories/board-games"
                className="shop-link text-bronze hover:text-bronze-pale"
              >
                Shop games
              </LocalizedClientLink>
            </div>
          </div>
          {featuredImage && (
            <div className="relative shop-fade-up [animation-delay:180ms]">
              <div
                aria-hidden
                className="absolute -inset-3 translate-x-3 translate-y-3 bg-bronze/35"
              />
              <LocalizedClientLink
                href="/categories/prints"
                className="relative block aspect-[3/2] overflow-hidden bg-night-soft shadow-glow"
              >
                <Image
                  src={featuredImage}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover shop-kenburns"
                />
              </LocalizedClientLink>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default Hero
