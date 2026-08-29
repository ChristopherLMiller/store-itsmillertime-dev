export const PRINTS_HANDLE = "prints"

export const DEPARTMENT_CATEGORIES = [
  {
    handle: PRINTS_HANDLE,
    name: "Prints",
    description: "Prints and digital downloads from the gallery.",
    rank: 0,
  },
  {
    handle: "board-games",
    name: "Board Games",
    description: "Pre-loved games, listed the way a shop should.",
    rank: 1,
  },
  {
    handle: "built-models",
    name: "Built Models",
    description: "Scale models I've built.",
    rank: 2,
  },
  {
    handle: "3d-prints",
    name: "3D Prints",
    description: "3D printed items.",
    rank: 3,
  },
] as const

export const DEPARTMENT_HANDLES = DEPARTMENT_CATEGORIES.map(
  (department) => department.handle
)

export type DepartmentHandle = (typeof DEPARTMENT_CATEGORIES)[number]["handle"]

export type GalleryAlbumRef = {
  id: string
  slug: string
  title: string
  visibility?: string
  isNsfw?: boolean
}

export const CATEGORY_KIND_DEPARTMENT = "department"
export const CATEGORY_KIND_ALBUM = "album"

export function isPrintProduct(
  metadata: Record<string, unknown> | null | undefined
): boolean {
  const imageId = metadata?.gallery_image_id
  if (typeof imageId === "number") {
    return Number.isFinite(imageId)
  }
  return typeof imageId === "string" && imageId.length > 0
}

export function isPublicAlbum(album: GalleryAlbumRef): boolean {
  if (album.isNsfw) {
    return false
  }
  if (album.visibility && album.visibility !== "ALL") {
    return false
  }
  return Boolean(album.slug)
}

export function parseAlbumRef(value: unknown): GalleryAlbumRef | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const record = value as Record<string, unknown>
  const slug = typeof record.slug === "string" ? record.slug.trim() : ""
  if (!slug) {
    return null
  }

  const id = record.id
  const title = typeof record.title === "string" ? record.title.trim() : ""

  return {
    id: id != null && String(id).length > 0 ? String(id) : slug,
    slug,
    title: title || slug,
    visibility:
      typeof record.visibility === "string" ? record.visibility : undefined,
    isNsfw: record.isNsfw === true || record.is_nsfw === true,
  }
}

export function parseProductAlbums(
  metadata: Record<string, unknown> | null | undefined
): GalleryAlbumRef[] {
  const albums = metadata?.albums
  if (!Array.isArray(albums)) {
    return []
  }

  return albums
    .map(parseAlbumRef)
    .filter((album): album is GalleryAlbumRef => album !== null)
    .filter(isPublicAlbum)
}

export function albumCategoryHandle(slug: string): string {
  return (DEPARTMENT_HANDLES as readonly string[]).includes(slug)
    ? `album-${slug}`
    : slug
}

export function categoryIdsMatch(current: string[], desired: string[]): boolean {
  if (current.length !== desired.length) {
    return false
  }
  const desiredSet = new Set(desired)
  return current.every((id) => desiredSet.has(id))
}
