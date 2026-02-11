function isObj(x: unknown): x is Record<string, any> {
    return !!x && typeof x === "object" && !Array.isArray(x);
  }
  
  export function deepSubsetMatch(actual: unknown, expected: unknown): boolean {
    if (expected === null || typeof expected !== "object") return Object.is(actual, expected);
  
    if (Array.isArray(expected)) {
      if (!Array.isArray(actual)) return false;
      if (expected.length > actual.length) return false;
      for (let i = 0; i < expected.length; i++) {
        if (!deepSubsetMatch(actual[i], expected[i])) return false;
      }
      return true;
    }
  
    if (isObj(expected)) {
      if (!isObj(actual)) return false;
      for (const key of Object.keys(expected)) {
        if (!(key in actual)) return false;
        if (!deepSubsetMatch((actual as any)[key], (expected as any)[key])) return false;
      }
      return true;
    }
  
    return false;
  }
  