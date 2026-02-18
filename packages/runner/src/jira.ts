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
  // Accept ```stoney, ```yaml, ```yml
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

// ---------------------------------------------
// Jira suite loading (your existing feature)
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

  // 1) Best: ADF codeBlock nodes with language yaml/yml/stoney
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

  // 2) Fallback: plain text scan for ```yaml fences
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

// ---------------------------------------------
// NEW: Jira issue type resolution for creation
// ---------------------------------------------
export type JiraIssueType = { id: string; name: string };

export async function jiraFetchProjectIssueTypes(projectKey: string): Promise<JiraIssueType[]> {
  const { base, auth } = requireJiraAuth();
  const url = `${base}/rest/api/3/issue/createmeta?projectKeys=${encodeURIComponent(
    projectKey
  )}&expand=projects.issuetypes`;

  const res = await fetch(url, { headers: { authorization: `Basic ${auth}`, accept: "application/json" } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Jira createmeta failed (${res.status}): ${txt}`);
  }

  const data = await res.json();
  const types = data?.projects?.[0]?.issuetypes;
  if (!Array.isArray(types)) return [];

  return types
    .map((t: any) => ({ id: String(t.id || ""), name: String(t.name || "") }))
    .filter((t: JiraIssueType) => t.id && t.name);
}

export async function resolveJiraIssueType(opts: {
  projectKey: string;
  requestedName?: string; // e.g. "Bug"
  requestedId?: string;   // e.g. "10006"
}): Promise<{ id: string; name: string; reason: string }> {
  const types = await jiraFetchProjectIssueTypes(opts.projectKey);
  if (!types.length) {
    throw new Error(`No issue types returned for Jira project ${opts.projectKey}.`);
  }

  // 1) If ID was provided, use it if valid
  if (opts.requestedId) {
    const hit = types.find((t) => t.id === opts.requestedId);
    if (hit) return { ...hit, reason: `matched by id=${opts.requestedId}` };
    return {
      ...types[0],
      reason: `requested id=${opts.requestedId} not valid for project; fell back to ${types[0].name}`,
    };
  }

  const req = (opts.requestedName || "").trim().toLowerCase();

  // 2) If name provided, match by case-insensitive name
  if (req) {
    const hit = types.find((t) => t.name.trim().toLowerCase() === req);
    if (hit) return { ...hit, reason: `matched by name="${opts.requestedName}"` };

    // 2b) Friendly fallbacks for common names
    const fallbackOrder = ["bug", "defect", "incident", "task"];
    for (const want of fallbackOrder) {
      const h = types.find((t) => t.name.trim().toLowerCase() === want);
      if (h) {
        return {
          ...h,
          reason: `requested "${opts.requestedName}" missing; used "${h.name}" fallback`,
        };
      }
    }

    // 2c) Otherwise first available
    return { ...types[0], reason: `requested "${opts.requestedName}" missing; used first available "${types[0].name}"` };
  }

  // 3) No request: prefer Bug-ish, then Task, else first
  const prefer = ["bug", "defect", "incident", "task"];
  for (const want of prefer) {
    const h = types.find((t) => t.name.trim().toLowerCase() === want);
    if (h) return { ...h, reason: `no request; preferred "${h.name}"` };
  }

  return { ...types[0], reason: `no request; used first available "${types[0].name}"` };
}
