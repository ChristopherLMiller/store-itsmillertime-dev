import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Text } from "@modules/common/components/ui"

export default function DepartmentGrid({
  departments,
}: {
  departments: HttpTypes.StoreProductCategory[]
}) {
  if (!departments.length) {
    return null
  }

  return (
    <div className="content-container py-12 small:py-20">
      <Text className="text-sm uppercase tracking-[0.18em] text-stone-500 mb-8">
        Shop
      </Text>
      <ul className="grid grid-cols-1 small:grid-cols-2 medium:grid-cols-4 gap-4">
        {departments.map((department) => (
          <li key={department.id}>
            <LocalizedClientLink
              href={`/categories/${department.handle}`}
              className="block h-full bg-white/70 border border-stone-200 rounded-md px-5 py-6 hover:border-stone-400 transition-colors"
            >
              <Text className="text-lg text-stone-900">
                {department.name}
              </Text>
              {department.description && (
                <Text className="text-sm text-stone-500 mt-2 leading-relaxed">
                  {department.description}
                </Text>
              )}
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
    </div>
  )
}
