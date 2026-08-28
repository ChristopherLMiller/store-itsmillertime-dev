import { Metadata } from "next"

import { listCategories } from "@lib/data/categories"
import { getDepartmentCategories } from "@lib/util/catalog"
import { SITE_NAME } from "@lib/util/site"
import DepartmentGrid from "@modules/home/components/department-grid"
import Hero from "@modules/home/components/hero"

export const metadata: Metadata = {
  title: SITE_NAME,
  description:
    "The ItsMillerTime shop — prints, models, games, and 3D printed work.",
}

export default async function Home() {
  const categories = await listCategories()
  const departments = getDepartmentCategories(categories)

  return (
    <>
      <Hero />
      <DepartmentGrid departments={departments} />
    </>
  )
}
