import yaml from "js-yaml";

type JiraADFNode = any;

function adfToText(node: JiraADFNode, out: string[]) {
  if (!node) return;

  // text nodes
  if (node.type === "text" && typeof node.text === "string") {
    out.push(node.text);
  }

  // code blocks often store text under content->text
  if (node.type === "codeBlock") {
    const lines: string[] = [];
    const content = Array.isArray(node.content) ? node.content : [];
    for (const c of content) {
      if (c.type === "text" && typeof c.text === "string") lines.push(c.text);
    }
    // Preserve as code block marker so we can parse it reliably
    out.push("\n```" + (node.attrs?.language || "") + "\n" + lines.join("") + "\n```\n");
  }

  // recurse
  const children = Array.isArray(node.content) ? node.content : [];
  for (const c of children) adfToText(c, out);
}

function extractFirstStoneyFence(text: string): string | null {
  // accept ```stoney or ```yaml or ```yml
  const re = /```(stoney|yaml|yml)\s*\n([\s\S]*?)\n```/i;
  const m = text.match(re);
  if (!m) return null;
  return m[2].trim();
}

export async function loadSuiteFromJiraIssue(issueKey: string): Promise<any> {
  const base = (process.env.JIRA_BASE_URL || "").replace(/\/+$/, "");
  const email = process.env.JIRA_EMAIL || "";
  const token = process.env.JIRA_API_TOKEN || "";

  if (!base || !email || !token) {
    throw new Error("Missing JIRA_BASE_URL/JIRA_EMAIL/JIRA_API_TOKEN env vars (required to load suite from Jira).");
  }

  const auth = Buffer.from(`${email}:${token}`).toString("base64");
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

  const chunks: string[] = [];
  adfToText(desc, chunks);
  const text = chunks.join("");

  const fenced = extractFirstStoneyFence(text);
  if (!fenced) {
    throw new Error(
      `No \`\`\`stoney / \`\`\`yaml fenced code block found in Jira issue ${issueKey} (${summary}).`
    );
  }

  const parsed = yaml.load(fenced);
  return parsed;
}
