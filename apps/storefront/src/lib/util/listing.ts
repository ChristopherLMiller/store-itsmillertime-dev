import { HttpTypes } from "@medusajs/types"

import { isAlbumCategory } from "./catalog"
import { isPrintProduct } from "./print-format"

export { isAlbumCategory }

export type ListingKind = "print" | "shop"

function metaString(
  metadata: Record<string, unknown> | null | undefined,
  keys: string[]
): string | undefined {
  if (!metadata) {
    return undefined
  }

  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
  }

  return undefined
}

function metaNumber(
  metadata: Record<string, unknown> | null | undefined,
  keys: string[]
): number | undefined {
  if (!metadata) {
    return undefined
  }

  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === "number" && Number.isFinite(value)) {
      return value
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return undefined
}

export function productInPrintsDepartment(
  product: Pick<HttpTypes.StoreProduct, "categories">
): boolean {
  return (product.categories ?? []).some(
    (category) =>
      category.handle === "prints" ||
      category.parent_category?.handle === "prints"
  )
}

export function listingKindForProduct(
  product: Pick<HttpTypes.StoreProduct, "options" | "categories">
): ListingKind {
  if (isPrintProduct(product) || productInPrintsDepartment(product)) {
    return "print"
  }

  return "shop"
}

export function isBoardGameProduct(
  product: Pick<HttpTypes.StoreProduct, "categories">
): boolean {
  return (product.categories ?? []).some(
    (category) =>
      category.handle === "board-games" ||
      category.parent_category?.handle === "board-games"
  )
}

export type ShopFact = {
  label: string
  value: string
}

export function getShopFacts(
  product: HttpTypes.StoreProduct
): ShopFacts {
  const metadata = (product.metadata ?? {}) as Record<string, unknown>
  const facts: ShopFacts = {}

  const condition =
    metaString(metadata, ["condition", "condition_notes", "state"]) ||
    (isBoardGameProduct(product) ? "Pre-loved" : undefined)
  if (condition) {
    facts.condition = condition
  }

  const minPlayers = metaNumber(metadata, ["min_players", "minplayers"])
  const maxPlayers = metaNumber(metadata, ["max_players", "maxplayers"])
  const players = metaString(metadata, ["players", "player_count"])
  if (players) {
    facts.players = players
  } else if (minPlayers && maxPlayers) {
    facts.players =
      minPlayers === maxPlayers
        ? `${minPlayers}`
        : `${minPlayers}–${maxPlayers}`
  } else if (minPlayers) {
    facts.players = `${minPlayers}+`
  } else if (maxPlayers) {
    facts.players = `Up to ${maxPlayers}`
  }

  const playtime = metaString(metadata, [
    "playtime",
    "playing_time",
    "play_time",
  ])
  const minPlay = metaNumber(metadata, ["min_playtime", "minplaytime"])
  const maxPlay = metaNumber(metadata, ["max_playtime", "maxplaytime"])
  if (playtime) {
    facts.playtime = playtime
  } else if (minPlay && maxPlay) {
    facts.playtime =
      minPlay === maxPlay ? `${minPlay} min` : `${minPlay}–${maxPlay} min`
  } else if (maxPlay) {
    facts.playtime = `${maxPlay} min`
  }

  const year = metaString(metadata, [
    "year",
    "year_published",
    "published",
    "released",
  ])
  if (year) {
    facts.year = year
  }

  if (product.type?.value) {
    facts.type = product.type.value
  }

  if (product.material) {
    facts.material = product.material
  }

  if (product.weight) {
    facts.weight = `${product.weight} g`
  }

  const quantity = product.variants?.reduce((sum, variant) => {
    if (!variant.manage_inventory) {
      return sum
    }
    return sum + (variant.inventory_quantity ?? 0)
  }, 0)

  const managesInventory = product.variants?.some(
    (variant) => variant.manage_inventory
  )
  if (managesInventory && typeof quantity === "number") {
    facts.availability =
      quantity === 1 ? "1 available" : `${quantity} available`
  }

  return facts
}

export type ShopFacts = {
  condition?: string
  players?: string
  playtime?: string
  year?: string
  type?: string
  material?: string
  weight?: string
  availability?: string
}

export function shopFactList(product: HttpTypes.StoreProduct): ShopFact[] {
  const facts = getShopFacts(product)
  const rows: ShopFact[] = []

  if (facts.condition) {
    rows.push({ label: "Condition", value: facts.condition })
  }
  if (facts.players) {
    rows.push({ label: "Players", value: facts.players })
  }
  if (facts.playtime) {
    rows.push({ label: "Play time", value: facts.playtime })
  }
  if (facts.year) {
    rows.push({ label: "Year", value: facts.year })
  }
  if (facts.type) {
    rows.push({ label: "Type", value: facts.type })
  }
  if (facts.material) {
    rows.push({ label: "Material", value: facts.material })
  }
  if (facts.weight) {
    rows.push({ label: "Weight", value: facts.weight })
  }
  if (facts.availability) {
    rows.push({ label: "Stock", value: facts.availability })
  }

  return rows
}
