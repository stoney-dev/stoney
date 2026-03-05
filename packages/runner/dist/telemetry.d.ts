type TelemetryStatus = "pass" | "fail";
/**
 * This is the ONLY shared source of truth for the telemetry wire format.
 * Keep it stable and backward-compatible.
 */
type TelemetryEnvelope = {
    repo_id: string;
    status: TelemetryStatus;
    metadata: unknown;
};
declare function isObject(x: unknown): x is Record<string, unknown>;
type ParseResult = {
    ok: true;
    value: TelemetryEnvelope;
} | {
    ok: false;
    error: string;
    details?: unknown;
};
declare function parseTelemetryEnvelope(body: unknown): ParseResult;

export { type ParseResult, type TelemetryEnvelope, type TelemetryStatus, isObject, parseTelemetryEnvelope };
