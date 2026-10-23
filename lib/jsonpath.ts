import { JSONPath } from "jsonpath-plus";
import { parse as llParse } from "lossless-json";

export interface JsonPathResult {
  ok: boolean;
  matches: unknown[];
  paths: string[];
  error?: string;
}

// The value at a JSON Pointer such as `/items/0` (RFC 6901: `~1` is `/`, `~0` is `~`, and `""` is the root).
function atPointer(tree: unknown, pointer: string): unknown {
  return pointer
    .split("/")
    .slice(1)
    .reduce(
      (node, token) => (node as Record<string, unknown>)[token.replace(/~1/g, "/").replace(/~0/g, "~")],
      tree,
    );
}

export function runJsonPath(raw: string, path: string): JsonPathResult {
  if (!raw.trim()) return { ok: false, matches: [], paths: [], error: "Paste JSON first" };
  if (!path.trim()) return { ok: false, matches: [], paths: [], error: "Enter a JSONPath expression" };
  let parsed: unknown;
  // Lossless copy of the same input, so matched numbers keep every digit. The expression still runs on `parsed`:
  // jsonpath-plus would walk into a LosslessNumber's own fields, and filters would stop matching numbers.
  let lossless: unknown;
  try {
    parsed = JSON.parse(raw);
    lossless = llParse(raw);
  } catch (e) {
    return { ok: false, matches: [], paths: [], error: `Invalid JSON: ${e instanceof Error ? e.message : "parse error"}` };
  }
  try {
    const result = JSONPath({
      path,
      json: parsed as object,
      resultType: "all",
      wrap: true,
    }) as { value: unknown; path: string; pointer: string }[];
    return {
      ok: true,
      // A string match keeps its own value: for a property name (`$.*~`) the pointer is that property's value.
      matches: result.map((r) => (typeof r.value === "string" ? r.value : atPointer(lossless, r.pointer))),
      paths: result.map((r) => r.path),
    };
  } catch (e) {
    return {
      ok: false,
      matches: [],
      paths: [],
      error: e instanceof Error ? e.message : "JSONPath evaluation failed",
    };
  }
}
