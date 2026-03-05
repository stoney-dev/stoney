import crypto from "node:crypto";

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

function hashToUInt32(input: string): number {
  const h = crypto.createHash("sha256").update(input).digest();
  return h.readUInt32LE(0);
}

function makeRng(seed: number) {
  // xorshift32
  let x = seed || 123456789;
  return () => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >> 17;
    x >>>= 0;
    x ^= x << 5;
    x >>>= 0;
    return x / 0xffffffff;
  };
}

function randInt(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function fakeValue(spec: string, rng: () => number): Json {
  const parts = spec.split(",").map((s) => s.trim());
  const name = parts[0];

  if (name === "uuid") return crypto.randomUUID();

  if (name === "email") {
    const n = randInt(rng, 1000, 9999);
    return `user${n}@example.com`;
  }

  if (name === "isoDate") {
    const days = randInt(rng, -30, 30);
    const d = new Date(Date.now() + days * 86400000);
    return d.toISOString();
  }

  if (name === "int") {
    const min = parts[1] ? Number(parts[1]) : 1;
    const max = parts[2] ? Number(parts[2]) : 100;
    return randInt(rng, min, max);
  }

  if (name === "string") {
    const n = randInt(rng, 6, 14);
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    let s = "";
    for (let i = 0; i < n; i++) s += alphabet[randInt(rng, 0, alphabet.length - 1)];
    return s;
  }

  if (name === "bool") return rng() > 0.5;

  // fallback: keep marker so it's obvious
  return `fake(${spec})`;
}

/**
 * Replaces any string that is EXACTLY like: "fake(uuid)" or "fake(int,1,10)".
 * Deterministic per seed + JSON path so reruns are stable.
 */
export function resolveFakePlaceholders(value: unknown, seedKey: string): unknown {
  const walk = (v: unknown, path: string): unknown => {
    if (typeof v === "string") {
      const m = v.match(/^fake\((.+)\)$/);
      if (!m) return v;

      const localSeed = hashToUInt32(`${seedKey}|${path}|${m[1]}`);
      const localRng = makeRng(localSeed);
      return fakeValue(m[1], localRng);
    }

    if (Array.isArray(v)) return v.map((x, i) => walk(x, `${path}[${i}]`));

    if (v && typeof v === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        out[k] = walk(val, path ? `${path}.${k}` : k);
      }
      return out;
    }

    return v;
  };

  return walk(value, "");
}