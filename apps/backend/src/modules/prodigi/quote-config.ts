export function resolveProdigiQuoteConfig() {
  return {
    destinationCountryCode: (
      process.env.PRODIGI_QUOTE_DESTINATION || "US"
    ).toUpperCase(),
    currencyCode: (process.env.PRODIGI_QUOTE_CURRENCY || "USD").toUpperCase(),
    shippingMethod: process.env.PRODIGI_QUOTE_SHIPPING_METHOD || "Standard",
  }
}
