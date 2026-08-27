import {
  buildPrintVariantSku,
  DEFAULT_FINISH_VALUE,
  finishesDiffer,
  isProdigiFinish,
  prodigiAttributesForFinish,
} from "../print-options"

describe("print-options", () => {
  it("treats Standard as not a Prodigi finish attribute", () => {
    expect(isProdigiFinish(DEFAULT_FINISH_VALUE)).toBe(false)
    expect(prodigiAttributesForFinish(DEFAULT_FINISH_VALUE)).toBeUndefined()
    expect(prodigiAttributesForFinish("Gloss")).toEqual({ finish: "Gloss" })
  })

  it("keeps finish in the variant SKU so Gloss and Lustre can coexist", () => {
    expect(buildPrintVariantSku("GLOBAL-PHO-16x20", "prod_1")).toBe(
      "GLOBAL-PHO-16x20__prod_1"
    )
    expect(buildPrintVariantSku("GLOBAL-PHO-16x20", "prod_1", "Gloss")).toBe(
      "GLOBAL-PHO-16x20__Gloss__prod_1"
    )
  })

  it("detects finish option list changes", () => {
    expect(finishesDiffer(["Gloss"], ["Gloss", "Lustre"])).toBe(true)
    expect(finishesDiffer(["Gloss", "Lustre"], ["Gloss", "Lustre"])).toBe(false)
  })
})
