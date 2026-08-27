import {
  buildSuggestedLabel,
  parseProdigiProductSpecs,
} from "../parse-product-specs"

describe("parseProdigiProductSpecs", () => {
  it("leaves weight empty when Prodigi does not send gsm", () => {
    const specs = parseProdigiProductSpecs({
      sku: "GLOBAL-PHO-4x6",
      description: "C-Type, Silver Halide, 4x6",
      width: 4,
      height: 6,
      units: "in",
    })

    expect(specs.paper_type).toBe("C-Type, Silver Halide")
    expect(specs.weight_gsm).toBeNull()
    expect(specs.suggested_label).toBe("4×6″")
  })

  it("keeps an explicit gsm from the product description", () => {
    const specs = parseProdigiProductSpecs({
      sku: "GLOBAL-PHO-4x6",
      description: "C-type Print, 190gsm, 4x6",
      width: 4,
      height: 6,
      units: "in",
    })

    expect(specs.weight_gsm).toBe(190)
    expect(specs.suggested_label).toBe("4×6″ · 190gsm")
  })

  it("omits paper type and codes from the storefront label", () => {
    const specs = parseProdigiProductSpecs({
      sku: "GLOBAL-FAP-11x14",
      description: "Fine Art Print, HPR, 308gsm, 11x14",
      width: 11,
      height: 14,
      units: "in",
    })

    expect(specs.paper_type).toBe("Fine Art Print")
    expect(specs.suggested_label).toBe("11×14″ · 308gsm")
    expect(specs.suggested_label).not.toMatch(/HPR|Fine Art/i)
  })
})

describe("buildSuggestedLabel", () => {
  it("is size-only when there is no weight", () => {
    expect(
      buildSuggestedLabel({
        width: 8,
        height: 10,
        units: "in",
      })
    ).toBe("8×10″")
  })
})
