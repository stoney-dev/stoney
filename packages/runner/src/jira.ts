// packages/runner/src/jira.ts
type JiraAuth = { base: string; auth: string };

function requireJiraAuth(): JiraAuth {
  const base = String(process.env.JIRA_BASE_URL || "").trim().replace(/\/+$/, "");
  const email = String(process.env.JIRA_EMAIL || "").trim();
  const token = String(process.env.JIRA_API_TOKEN || "").trim();

  if (!base || !email || !token) {
    throw new Error("Missing JIRA_BASE_URL/JIRA_EMAIL/JIRA_API_TOKEN.");
  }

  // Small safety: catch obvious config errors early
  if (!/^https?:\/\//i.test(base)) {
    throw new Error(`JIRA_BASE_URL must start with http(s):// (got "${base}")`);
  }

  const auth = Buffer.from(`${email}:${token}`).toString("base64");
  return { base, auth };
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

/**
 * Read-only existence check.
 * - ok=true  -> issue exists and is accessible
 * - ok=false -> not found/unauthorized/forbidden/other error
 */
const existsCache = new Map<string, { ok: boolean; status: number; message?: string }>();

export async function jiraIssueExists(issueKey: string): Promise<{ ok: boolean; status: number; message?: string }> {
  const key = String(issueKey || "").trim();
  if (!key) return { ok: false, status: 0, message: "Empty issue key" };

  const cached = existsCache.get(key);
  if (cached) return cached;

  let base = "";
  let auth = "";
  try {
    ({ base, auth } = requireJiraAuth());
  } catch (e: any) {
    const out = { ok: false, status: 0, message: e?.message || String(e) };
    existsCache.set(key, out);
    return out;
  }

  const url = `${base}/rest/api/3/issue/${encodeURIComponent(key)}?fields=summary`;

  try {
    const timeoutMs = Number(process.env.STONEY_TIMEOUT_MS || 15000);
    const res = await fetchWithTimeout(
      url,
      {
        headers: { authorization: `Basic ${auth}`, accept: "application/json" },
      },
      Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 15000
    );

    if (res.ok) {
      const out = { ok: true, status: res.status as number };
      existsCache.set(key, out);
      return out;
    }

    const txt = await res.text().catch(() => "");
    const msg =
      res.status === 404
        ? "Not found (404)"
        : res.status === 401
          ? "Unauthorized (401)"
          : res.status === 403
            ? "Forbidden (403)"
            : `Jira error (${res.status})`;

    // Avoid dumping huge HTML/JSON into notes
    const bodySnippet = txt ? `: ${txt.slice(0, 400)}` : "";
    const out = { ok: false, status: res.status, message: `${msg}${bodySnippet}` };
    existsCache.set(key, out);
    return out;
  } catch (e: any) {
    const out = { ok: false, status: 0, message: `Jira request failed: ${e?.message || String(e)}` };
    existsCache.set(key, out);
    return out;
  }
}