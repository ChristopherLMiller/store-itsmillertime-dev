import { revalidatePath, revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

const CATALOG_TAGS = ["products", "collections", "categories", "regions"] as const

function isAuthorized(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) {
    return false
  }

  const header = req.headers.get("x-revalidate-secret")
  const query = req.nextUrl.searchParams.get("secret")
  return header === secret || query === secret
}

function revalidateCatalog(tagsParam: string | null) {
  const requested = tagsParam
    ?.split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)

  const tags = requested?.length ? requested : [...CATALOG_TAGS]

  for (const tag of tags) {
    revalidateTag(tag)
  }

  // Bust the full route cache, not just fetch tags. Product pages are
  // statically generated, so tag-only invalidation is not enough.
  revalidatePath("/", "layout")
  revalidatePath("/[countryCode]/(main)/store", "page")
  revalidatePath("/[countryCode]/(main)/products/[handle]", "page")
  revalidatePath("/[countryCode]/(main)/collections/[handle]", "page")
  revalidatePath("/[countryCode]/(main)/categories/[...category]", "page")
}

function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  revalidateCatalog(req.nextUrl.searchParams.get("tags"))

  return NextResponse.json({ revalidated: true, now: Date.now() })
}

export async function GET(req: NextRequest) {
  return handle(req)
}

export async function POST(req: NextRequest) {
  return handle(req)
}
