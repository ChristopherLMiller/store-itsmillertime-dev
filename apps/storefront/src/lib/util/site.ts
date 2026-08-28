export const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME || "ItsMillerTime Store"

export const MAIN_SITE_URL =
  process.env.NEXT_PUBLIC_MAIN_SITE_URL || "https://itsmillertime.dev"

export const MAIN_SITE_GALLERY_PATH = "/galleries"

export function mainSiteUrl(path = "/"): string {
  return new URL(path, MAIN_SITE_URL).toString()
}

export function galleryHomeUrl(): string {
  return mainSiteUrl(MAIN_SITE_GALLERY_PATH)
}

export function galleryAlbumUrl(
  albumSlug: string,
  imageId?: string | number | null
): string {
  const url = new URL(
    `${MAIN_SITE_GALLERY_PATH}/${albumSlug}`,
    MAIN_SITE_URL
  )
  if (imageId != null && String(imageId).length > 0) {
    url.searchParams.set("selected", String(imageId))
  }
  return url.toString()
}

type GalleryAlbumMeta = {
  id?: string
  slug?: string
  title?: string
}

function asGalleryImageId(value: unknown): string | number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string" && value.length > 0) {
    return value
  }
  return null
}

function albumSlugFromMetadata(
  metadata: Record<string, unknown> | null | undefined
): string | null {
  const albums = metadata?.albums
  if (!Array.isArray(albums)) {
    return null
  }

  for (const album of albums) {
    if (!album || typeof album !== "object") {
      continue
    }
    const slug = (album as GalleryAlbumMeta).slug
    if (typeof slug === "string" && slug) {
      return slug
    }
  }

  return null
}

export function productGalleryUrl(product: {
  categories?:
    | { handle: string; parent_category?: { handle: string } | null }[]
    | null
  metadata?: Record<string, unknown> | null
}): string | null {
  const imageId = asGalleryImageId(product.metadata?.gallery_image_id)
  if (imageId == null) {
    return null
  }

  const fromMeta = albumSlugFromMetadata(product.metadata)
  if (fromMeta) {
    return galleryAlbumUrl(fromMeta, imageId)
  }

  const albumCategory = product.categories?.find(
    (category) => category.parent_category?.handle === "prints"
  )
  if (albumCategory?.handle) {
    return galleryAlbumUrl(albumCategory.handle, imageId)
  }

  return galleryHomeUrl()
}
