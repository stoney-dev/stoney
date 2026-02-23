import yaml from "js-yaml";

type JiraADFNode = any;

function isObj(x: unknown): x is Record<string, any> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

function normalizeLang(lang: unknown): string {
  return String(lang || "").trim().toLowerCase();
}

function collectCodeBlocksFromADF(node: JiraADFNode, out: { lang: string; text: string }[]) {
  if (!node) return;

  if (isObj(node) && node.type === "codeBlock") {
    const lang = normalizeLang(node.attrs?.language);
    const parts: string[] = [];

    const content = Array.isArray(node.content) ? node.content : [];
    for (const c of content) {
      if (isObj(c) && c.type === "text" && typeof c.text === "string") parts.push(c.text);
    }

    out.push({ lang, text: parts.join("") });
  }

  const children = isObj(node) && Array.isArray(node.content) ? node.content : [];
  for (const c of children) collectCodeBlocksFromADF(c, out);
}

function adfToPlainText(node: JiraADFNode, out: string[]) {
  if (!node) return;

  if (isObj(node) && node.type === "text" && typeof node.text === "string") out.push(node.text);

  const children = isObj(node) && Array.isArray(node.content) ? node.content : [];
  for (const c of children) adfToPlainText(c, out);
}

function extractFirstFencedBlock(text: string): string | null {
  const re = /```(stoney|yaml|yml)\s*\n([\s\S]*?)\n```/i;
  const m = text.match(re);
  if (!m) return null;
  return m[2].trim();
}

function requireJiraAuth() {
  const base = (process.env.JIRA_BASE_URL || "").replace(/\/+$/, "");
  const email = process.env.JIRA_EMAIL || "";
  const token = process.env.JIRA_API_TOKEN || "";

  if (!base || !email || !token) {
    throw new Error("Missing JIRA_BASE_URL/JIRA_EMAIL/JIRA_API_TOKEN.");
  }

  const auth = Buffer.from(`${email}:${token}`).toString("base64");
  return { base, email, token, auth };
}

/**
 * ✅ v1 design primitive:
 * Validate an issue exists (read-only) so contracts can reference Jira reliably.
 *
 * Returns:
 * - ok=true  -> issue exists and is accessible
 * - ok=false -> not found / forbidden / other error
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

// ---------------------------------------------
// Legacy: Jira suite loading (keep for backwards compat)
// ---------------------------------------------
export async function loadSuiteFromJiraIssue(issueKey: string): Promise<any> {
  const { base, auth } = requireJiraAuth();

  const url = `${base}/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=summary,description`;
  const res = await fetch(url, {
    headers: { authorization: `Basic ${auth}`, accept: "application/json" },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Jira fetch failed (${res.status}): ${txt}`);
  }

  const issue = await res.json();
  const summary = issue?.fields?.summary || issueKey;
  const desc = issue?.fields?.description;

  const codeBlocks: { lang: string; text: string }[] = [];
  collectCodeBlocksFromADF(desc, codeBlocks);

  const preferred = codeBlocks.find((b) => ["stoney", "yaml", "yml"].includes(b.lang) && b.text.trim().length > 0);
  if (preferred) {
    try {
      return yaml.load(preferred.text.trim());
    } catch (e: any) {
      throw new Error(
        `Failed to parse YAML from Jira code block in ${issueKey} (${summary}). ` +
          `Language="${preferred.lang}". Error: ${e?.message || String(e)}`
      );
    }
  }

  const textParts: string[] = [];
  adfToPlainText(desc, textParts);
  const text = textParts.join("");

  const fenced = extractFirstFencedBlock(text);
  if (!fenced) {
    const langs = codeBlocks.map((b) => b.lang || "(none)").join(", ");
    throw new Error(
      `No Jira codeBlock language stoney/yaml/yml and no fenced \`\`\`stoney/\`\`\`yaml found in ${issueKey} (${summary}).` +
        (codeBlocks.length ? ` Found codeBlocks languages: ${langs}` : "")
    );
  }

  try {
    return yaml.load(fenced);
  } catch (e: any) {
    throw new Error(`Failed to parse YAML from fenced block in ${issueKey} (${summary}). Error: ${e?.message || String(e)}`);
  }
}