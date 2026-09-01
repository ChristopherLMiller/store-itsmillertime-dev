import { resolveAuthentikCallbackUrl } from "../redirect-uri"

describe("resolveAuthentikCallbackUrl", () => {
  const adminRedirectUri = "http://localhost:9000/app/login"
  const storefrontRedirectUri = "http://localhost:8000/auth/callback"

  it("uses the admin redirect URI for admin actors", () => {
    expect(
      resolveAuthentikCallbackUrl({
        actorType: "user",
        adminRedirectUri,
        storefrontRedirectUri,
      })
    ).toBe(adminRedirectUri)
  })

  it("uses the storefront redirect URI for customers", () => {
    expect(
      resolveAuthentikCallbackUrl({
        actorType: "customer",
        adminRedirectUri,
        storefrontRedirectUri,
      })
    ).toBe(storefrontRedirectUri)
  })

  it("accepts an allowlisted callback_url", () => {
    expect(
      resolveAuthentikCallbackUrl({
        actorType: "user",
        requestedCallbackUrl: `${storefrontRedirectUri}/`,
        adminRedirectUri,
        storefrontRedirectUri,
      })
    ).toBe(storefrontRedirectUri)
  })

  it("ignores callback URLs that are not allowlisted", () => {
    expect(
      resolveAuthentikCallbackUrl({
        actorType: "user",
        requestedCallbackUrl: "https://evil.example/callback",
        adminRedirectUri,
        storefrontRedirectUri,
      })
    ).toBe(adminRedirectUri)
  })

  it("throws when a customer signs in without a storefront redirect URI", () => {
    expect(() =>
      resolveAuthentikCallbackUrl({
        actorType: "customer",
        adminRedirectUri,
      })
    ).toThrow(/AUTHENTIK_STOREFRONT_REDIRECT_URI or STOREFRONT_URL/)
  })
})
