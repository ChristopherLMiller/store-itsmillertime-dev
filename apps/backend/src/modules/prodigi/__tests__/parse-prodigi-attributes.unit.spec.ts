import {
  parseProdigiAttributes,
  collectFinishOptionsFromVariants,
  quoteAttributesFromProduct,
  parseWeightFromText,
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

describe("quoteAttributesFromProduct", () => {
  it("sends the first finish so C-type quotes are accepted", () => {
    expect(
      quoteAttributesFromProduct({
        attributes: { finish: ["Gloss", "Lustre", "Metallic"] },
      })
    ).toEqual({ finish: "Gloss" })
  })

  it("sends wrap when canvas has a choice of wraps", () => {
    expect(
      quoteAttributesFromProduct({
        attributes: { wrap: ["Black", "ImageWrap", "White"] },
      })
    ).toEqual({ wrap: "Black" })
  })

  it("falls back to finish_options when attributes omit finish", () => {
    expect(
      quoteAttributesFromProduct({
        attributes: {},
        finish_options: ["Lustre", "Gloss"],
      })
    ).toEqual({ finish: "Lustre" })
  })

  it("omits attributes for SKUs that do not need them", () => {
    expect(
      quoteAttributesFromProduct({
        attributes: { size: ["8x10"] },
      })
    ).toBeUndefined()
  })
})

describe("parseWeightFromText", () => {
  it("parses gsm and g/m²", () => {
    expect(parseWeightFromText("240gsm")).toBe(240)
    expect(parseWeightFromText("310 g/m²")).toBe(310)
    expect(parseWeightFromText("200")).toBe(200)
    expect(parseWeightFromText("230-245μm")).toBeNull()
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
