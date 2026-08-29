import { departmentCoverUrl, departmentIntro } from "@lib/util/catalog"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Reveal from "@modules/common/components/reveal"
import { Text } from "@modules/common/components/ui"
import Image from "next/image"

const DEPARTMENT_TONES: Record<string, string> = {
  prints: "bg-night",
  "board-games": "bg-moss-deep",
  "built-models": "bg-dusk-deep",
  "3d-prints": "bg-clay-deep",
}

export default function DepartmentGrid({
  departments,
}: {
  departments: HttpTypes.StoreProductCategory[]
}) {
  if (!departments.length) {
    return null
  }

  return (
    <div className="content-container py-16 small:py-24">
      <ul className="grid grid-cols-1 small:grid-cols-2 gap-6 small:gap-8">
        {departments.map((department, index) => {
          const cover = departmentCoverUrl(department)
          const description = departmentIntro(department)
          const tone = DEPARTMENT_TONES[department.handle] ?? "bg-night"

          return (
            <li key={department.id}>
              <Reveal delay={index * 90}>
                <LocalizedClientLink
                  href={`/categories/${department.handle}`}
                  className="group block shop-lift"
                >
                  <div className={`relative aspect-[3/2] overflow-hidden ${tone}`}>
                    {cover && (
                      <Image
                        src={cover}
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/25 to-transparent transition-opacity duration-500 group-hover:from-night/80" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-bronze/70 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 small:p-6 translate-y-0 transition-transform duration-500 ease-out group-hover:-translate-y-0.5">
                      <Text className="font-display text-2xl tracking-tight text-cream">
                        {department.name}
                      </Text>
                      {description && (
                        <Text className="mt-1 text-sm leading-relaxed text-bronze-pale/90 line-clamp-2">
                          {description}
                        </Text>
                      )}
                    </div>
                  </div>
                </LocalizedClientLink>
              </Reveal>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
