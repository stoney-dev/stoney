export type TelemetryStatus = "pass" | "fail";

/**
 * This is the ONLY shared source of truth for the telemetry wire format.
 * Keep it stable and backward-compatible.
 */
export type TelemetryEnvelope = {
  repo_id: string;
  status: TelemetryStatus;
  metadata: unknown;
};

export function isObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

export type ParseResult =
  | { ok: true; value: TelemetryEnvelope }
  | { ok: false; error: string; details?: unknown };

export function parseTelemetryEnvelope(body: unknown): ParseResult {
  if (!isObject(body)) return { ok: false, error: "Body must be a JSON object" };

  const repo_id = body.repo_id;
  const status = body.status;
  const metadata = body.metadata;

  if (typeof repo_id !== "string" || repo_id.trim().length === 0) {
    return { ok: false, error: "repo_id must be a non-empty string" };
  }

  if (status !== "pass" && status !== "fail") {
    return { ok: false, error: 'status must be "pass" or "fail"' };
  }

  if (metadata === undefined) {
    return { ok: false, error: "metadata is required" };
  }

  // Ensure JSON-serializable (nice errors if someone sends weird stuff)
  try {
    JSON.stringify(metadata);
  } catch {
    return { ok: false, error: "metadata must be JSON-serializable" };
  }

  return {
    ok: true,
    value: { repo_id: repo_id.trim(), status, metadata },
  };
}