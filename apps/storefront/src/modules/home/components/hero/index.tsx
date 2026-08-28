import { galleryHomeUrl, MAIN_SITE_URL, SITE_NAME } from "@lib/util/site"
import { Heading } from "@modules/common/components/ui"

const Hero = () => {
  return (
    <div className="w-full border-b border-stone-200">
      <div className="content-container py-16 small:py-24 max-w-3xl">
        <Heading
          level="h1"
          className="text-3xl small:text-4xl font-normal leading-tight text-stone-900"
        >
          {SITE_NAME}
        </Heading>
        <p className="mt-4 text-lg text-stone-600 leading-relaxed">
          Prints from the{" "}
          <a className="underline underline-offset-4 hover:text-stone-900" href={MAIN_SITE_URL}>
            ItsMillerTime
          </a>{" "}
          gallery, plus models, games, and other studio work.
        </p>
        <a
          href={galleryHomeUrl()}
          className="inline-block mt-6 text-sm text-stone-700 underline underline-offset-4 hover:text-stone-900"
        >
          Browse the gallery
        </a>
      </div>
    </div>
  )
}

export default Hero
