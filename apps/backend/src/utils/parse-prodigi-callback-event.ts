import type { MedusaRequest } from "@medusajs/framework/http"
import type { ProdigiOrderLike } from "./prodigi-fulfillment-status"

export type ParsedProdigiCallback = {
  eventType: string
  order: ProdigiOrderLike
}

export type ParseProdigiCallbackResult =
  | { ok: true; parsed: ParsedProdigiCallback }
  | { ok: false; reason: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function isProdigiEventType(type: unknown): type is string {
  return typeof type === "string" && type.toLowerCase().startsWith("com.prodigi")
}

function normalizeDataField(data: unknown): Record<string, unknown> | null {
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data)
      return isRecord(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  return isRecord(data) ? data : null
}

function extractOrderFromData(
  data: Record<string, unknown>
): ProdigiOrderLike | null {
  const nested = data.order
  if (isRecord(nested) && typeof nested.id === "string") {
    return nested as ProdigiOrderLike
  }

  if (typeof data.id === "string" && data.id.startsWith("ord_")) {
    return data as ProdigiOrderLike
  }

  return null
}

function readCeHeader(req: MedusaRequest, name: string): string | null {
  const headers = req.headers
  const key = `ce-${name}`
  const value = headers[key] ?? headers[key.toLowerCase()]

  if (typeof value === "string" && value.length) {
    return value
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0]
  }

  return null
}

function parseStructuredCloudEvent(
  body: Record<string, unknown>
): ParseProdigiCallbackResult | null {
  const specversion = body.specversion
  const type = body.type

  if (
    (typeof specversion !== "string" && typeof specversion !== "number") ||
    !isProdigiEventType(type)
  ) {
    return null
  }

  const data = normalizeDataField(body.data)
  if (!data) {
    return { ok: false, reason: "CloudEvent data missing or unparseable" }
  }

  const order = extractOrderFromData(data)
  if (!order?.id) {
    return { ok: false, reason: "CloudEvent data has no order id" }
  }

  return { ok: true, parsed: { eventType: type, order } }
}

function parseBinaryCloudEvent(
  req: MedusaRequest,
  body: Record<string, unknown>
): ParseProdigiCallbackResult | null {
  const eventType = readCeHeader(req, "type")
  const specversion = readCeHeader(req, "specversion")

  if (!eventType || !specversion || !isProdigiEventType(eventType)) {
    return null
  }

  const data = normalizeDataField(body) ?? body
  const order = extractOrderFromData(data)
  if (!order?.id) {
    return { ok: false, reason: "Binary CloudEvent body has no order id" }
  }

  return { ok: true, parsed: { eventType, order } }
}

/**
 * Prodigi callbacks follow CloudEvents but payloads vary by binding:
 * - structured JSON envelope with data.order (documented sample)
 * - structured JSON with order fields directly in data
 * - data as a JSON string rather than an object
 * - binary HTTP binding with ce-* headers and order JSON in the body
 */
export function parseProdigiCallbackFromRequest(
  req: MedusaRequest
): ParseProdigiCallbackResult {
  const body = req.body

  if (!isRecord(body)) {
    return { ok: false, reason: "Request body is not a JSON object" }
  }

  const structured = parseStructuredCloudEvent(body)
  if (structured) {
    return structured
  }

  const binary = parseBinaryCloudEvent(req, body)
  if (binary) {
    return binary
  }

  const directOrder = extractOrderFromData(body)
  if (directOrder?.id) {
    return {
      ok: true,
      parsed: {
        eventType:
          readCeHeader(req, "type") ?? "com.prodigi.order.status.unknown",
        order: directOrder,
      },
    }
  }

  if (isRecord(body.order) && typeof body.order.id === "string") {
    return {
      ok: true,
      parsed: {
        eventType:
          readCeHeader(req, "type") ?? "com.prodigi.order.status.unknown",
        order: body.order as ProdigiOrderLike,
      },
    }
  }

  const contentType = req.headers["content-type"]
  const bodyKeys = Object.keys(body).slice(0, 8).join(", ")

  return {
    ok: false,
    reason: `Unrecognized Prodigi callback payload (content-type=${contentType ?? "unknown"}, keys=${bodyKeys || "none"})`,
  }
}
