function requireJiraAuth() {
  const base = (process.env.JIRA_BASE_URL || "").replace(/\/+$/, "");
  const email = process.env.JIRA_EMAIL || "";
  const token = process.env.JIRA_API_TOKEN || "";

  if (!base || !email || !token) {
    throw new Error("Missing JIRA_BASE_URL/JIRA_EMAIL/JIRA_API_TOKEN.");
  }

  const auth = Buffer.from(`${email}:${token}`).toString("base64");
  return { base, auth };
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

  const { base, auth } = requireJiraAuth();
  const url = `${base}/rest/api/3/issue/${encodeURIComponent(key)}?fields=summary`;

  const res = await fetch(url, {
    headers: { authorization: `Basic ${auth}`, accept: "application/json" },
  });

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

  const out = { ok: false, status: res.status, message: `${msg}${txt ? `: ${txt}` : ""}` };
  existsCache.set(key, out);
  return out;
}