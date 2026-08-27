import {
  parseProdigiAttributes,
  collectFinishOptionsFromVariants,
} from "../parse-prodigi-attributes"

describe("parseProdigiAttributes", () => {
  it("keeps every C-type finish as a customer choice", () => {
    const specs = parseProdigiAttributes({
      finish: ["Gloss", "Lustre", "Metallic"],
    })

    expect(specs.finish_options).toEqual(["Gloss", "Lustre", "Metallic"])
    expect(specs.substrate).toBeNull()
    expect(specs.order_options).toEqual({})
  })

  it("treats a single finish as both a spec and the value sent to Prodigi", () => {
    const specs = parseProdigiAttributes({
      finish: ["Lustre"],
    })

    expect(specs.finish_options).toEqual(["Lustre"])
    expect(specs.substrate).toBe("Lustre")
  })

  it("does not let a finish list overwrite an explicit substrate", () => {
    const specs = parseProdigiAttributes({
      substrate: ["Photo paper"],
      finish: ["Lustre"],
    })

    expect(specs.substrate).toBe("Photo paper")
    expect(specs.finish_options).toEqual(["Lustre"])
  })

  it("still captures wrap as an order-time option", () => {
    const specs = parseProdigiAttributes({
      wrap: ["Black", "ImageWrap", "White"],
    })

    expect(specs.order_options).toEqual({
      Wrap: ["Black", "ImageWrap", "White"],
    })
    expect(specs.finish_options).toEqual([])
  })
})

describe("collectFinishOptionsFromVariants", () => {
  it("unions finish values from Prodigi variants", () => {
    expect(
      collectFinishOptionsFromVariants([
        { attributes: { finish: "Gloss" } },
        { attributes: { finish: "Lustre" } },
        { attributes: { finish: "Gloss" } },
        { attributes: { wrap: "Black" } },
      ])
    ).toEqual(["Gloss", "Lustre"])
  })
})
