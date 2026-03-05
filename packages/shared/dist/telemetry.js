// src/telemetry.ts
function isObject(x) {
  return !!x && typeof x === "object" && !Array.isArray(x);
}
function parseTelemetryEnvelope(body) {
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
  if (metadata === void 0) {
    return { ok: false, error: "metadata is required" };
  }
  try {
    JSON.stringify(metadata);
  } catch {
    return { ok: false, error: "metadata must be JSON-serializable" };
  }
  return {
    ok: true,
    value: { repo_id: repo_id.trim(), status, metadata }
  };
}
export {
  isObject,
  parseTelemetryEnvelope
};
