/**
 * src/sign.ts
 *
 * HMAC-SHA256 signing for the Stoney ingest endpoint.
 * The server at /api/ingest requires X-Stoney-Signature on every request.
 *
 * Protocol:
 *   signature = "sha256=" + HMAC-SHA256(rawBodyString, STONEY_TOKEN).hex()
 *   header:   X-Stoney-Signature: <signature>
 */

import { createHmac } from "node:crypto";

/**
 * Sign a raw JSON body string with the given token.
 * Returns the full header value ready to send: "sha256=<hex>"
 */
export function signPayload(body: string, token: string): string {
  const hex = createHmac("sha256", token).update(body).digest("hex");
  return `sha256=${hex}`;
}
