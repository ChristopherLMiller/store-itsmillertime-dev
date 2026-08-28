import {
  albumCategoryHandle,
  categoryIdsMatch,
  isPrintProduct,
  isPublicAlbum,
  parseProductAlbums,
} from "../store-catalog"

describe("store-catalog", () => {
  it("treats gallery_image_id as a print product", () => {
    expect(isPrintProduct({ gallery_image_id: "1800" })).toBe(true)
    expect(isPrintProduct({ gallery_image_id: 1800 })).toBe(true)
    expect(isPrintProduct({ gallery_image_id: "" })).toBe(false)
    expect(isPrintProduct({})).toBe(false)
  })

  it("skips privileged and NSFW albums and empty slugs", () => {
    expect(
      isPublicAlbum({ id: "1", slug: "starved-rock", title: "Starved Rock" })
    ).toBe(true)
    expect(
      isPublicAlbum({
        id: "2",
        slug: "kyrie",
        title: "Kyrie",
        visibility: "PRIVILEGED",
      })
    ).toBe(false)
    expect(
      isPublicAlbum({
        id: "3",
        slug: "nsfw",
        title: "Nsfw",
        isNsfw: true,
      })
    ).toBe(false)
    expect(isPublicAlbum({ id: "4", slug: "", title: "Nope" })).toBe(false)
  })

  it("parses public albums from product metadata", () => {
    const albums = parseProductAlbums({
      albums: [
        { id: 23, slug: "goshen-airshow-2017", title: "Goshen Airshow 2017" },
        { id: 13, slug: "kyrie", title: "Kyrie", visibility: "PRIVILEGED" },
        { slug: "" },
        null,
      ],
    })

    expect(albums).toEqual([
      {
        id: "23",
        slug: "goshen-airshow-2017",
        title: "Goshen Airshow 2017",
        visibility: undefined,
        isNsfw: false,
      },
    ])
  })

  it("prefixes album handles that collide with departments", () => {
    expect(albumCategoryHandle("astronomy")).toBe("astronomy")
    expect(albumCategoryHandle("prints")).toBe("album-prints")
  })

  it("compares category id sets", () => {
    expect(categoryIdsMatch(["a", "b"], ["b", "a"])).toBe(true)
    expect(categoryIdsMatch(["a"], ["a", "b"])).toBe(false)
  })
})
