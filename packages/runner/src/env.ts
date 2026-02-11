function isObj(x: unknown): x is Record<string, any> {
    return !!x && typeof x === "object" && !Array.isArray(x);
  }
  
  const ENV_RE = /\$\{([A-Z0-9_]+)\}/g;
  
  /**
   * Replaces `${NAME}` in strings with process.env.NAME.
   * - Missing env vars become "" (empty string) so the user sees auth failures as real failures.
   */
  export function interpolate(input: unknown): unknown {
    if (typeof input === "string") {
      return input.replace(ENV_RE, (_, name: string) => process.env[name] ?? "");
    }
    if (Array.isArray(input)) return input.map(interpolate);
    if (isObj(input)) {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(input)) out[k] = interpolate(v);
      return out;
    }
    return input;
  }
  