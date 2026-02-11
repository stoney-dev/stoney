import http from "node:http";
import { URL } from "node:url";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const REQUIRED_TOKEN = process.env.STONEY_TARGET_TOKEN || "devtoken";

function json(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const path = u.pathname;

  if (req.method === "GET" && path === "/health") return json(res, 200, { ok: true });
  if (req.method === "GET" && path === "/v1/ping") return json(res, 200, { ok: true });

  if (req.method === "GET" && path === "/private/ping") {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
    if (token !== REQUIRED_TOKEN) return json(res, 401, { ok: false });
    return json(res, 200, { ok: true, private: true });
  }

  return json(res, 404, { ok: false, error: "not_found" });
});

server.listen(PORT, () => console.log(`Target listening on http://localhost:${PORT}`));
