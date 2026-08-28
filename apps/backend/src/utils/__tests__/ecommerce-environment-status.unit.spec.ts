import {
  classifyProdigiApiUrl,
  classifyStripeSecretKey,
} from "../ecommerce-environment-status"

describe("classifyProdigiApiUrl", () => {
  it("treats api.sandbox.prodigi.com as sandbox", () => {
    expect(
      classifyProdigiApiUrl("https://api.sandbox.prodigi.com", "live")
    ).toBe("sandbox")
  })

  it("treats api.prodigi.com as live", () => {
    expect(classifyProdigiApiUrl("https://api.prodigi.com", "sandbox")).toBe(
      "live"
    )
  })
})

describe("classifyStripeSecretKey", () => {
  it("treats sk_test_ keys as sandbox", () => {
    expect(classifyStripeSecretKey("sk_test_abc", "live")).toBe("sandbox")
  })

  it("treats sk_live_ keys as live", () => {
    expect(classifyStripeSecretKey("sk_live_abc", "sandbox")).toBe("live")
  })

  it("falls back when the key is missing", () => {
    expect(classifyStripeSecretKey("", "sandbox")).toBe("sandbox")
    expect(classifyStripeSecretKey(undefined, "live")).toBe("live")
  })
})
