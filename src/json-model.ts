// Pure JSON-tree model for @cinatra-ai/json-artifact — no React, no DOM.
//
// This is the data layer the collapsible tree renders from. It is deliberately
// total and never-throwing: a viewer must degrade to a readable floor on ANY
// input (malformed bytes, a bare primitive, an enormous or deeply-nested
// document), never blank and never crash the host page. Every function here is
// pure over its inputs so the render layer and the tests share one source of
// truth.

/** The six JSON value shapes, plus `undefined` for an absent value. */
export type JsonKind = "object" | "array" | "string" | "number" | "boolean" | "null";

/** A safe-parse outcome. `ok:false` carries the raw text so the render layer can
 * still show the bytes verbatim (never blank) alongside a diagnostic. */
export type JsonParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string; raw: string };

/**
 * Parse JSON text WITHOUT ever throwing. An empty/whitespace-only body is
 * reported as its own failure reason (distinct from malformed) so the viewer can
 * render a precise empty-state. The raw text is always echoed back on failure.
 */
export function safeParseJson(text: string): JsonParseResult {
  if (typeof text !== "string" || text.trim().length === 0) {
    return { ok: false, error: "empty document", raw: typeof text === "string" ? text : "" };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "invalid JSON",
      raw: text,
    };
  }
}

/** Classify a parsed JSON value into its render kind. Arrays before objects. */
export function classifyJson(value: unknown): JsonKind {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  const t = typeof value;
  if (t === "object") return "object";
  if (t === "string") return "string";
  if (t === "number") return "number";
  if (t === "boolean") return "boolean";
  // Non-JSON residue (undefined/function/symbol/bigint) — should not occur from
  // JSON.parse, but the model stays total: treat as a null-ish leaf.
  return "null";
}

/** A container is an object or an array — the only kinds that expand. */
export function isContainer(value: unknown): boolean {
  const k = classifyJson(value);
  return k === "object" || k === "array";
}

/** A single child entry of a container: an object property or an array element.
 * `key` is the display label (property name or numeric index as a string). */
export interface JsonEntry {
  key: string;
  value: unknown;
}

/** The ordered child entries of a container ({} / [] → an empty list). Object
 * key order follows insertion order (what `JSON.parse` preserves). */
export function entriesOf(value: unknown): JsonEntry[] {
  if (Array.isArray(value)) {
    return value.map((v, i) => ({ key: String(i), value: v }));
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).map(([key, v]) => ({ key, value: v }));
  }
  return [];
}

/** The element/property count of a container (0 for a primitive). */
export function childCount(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value !== null && typeof value === "object") return Object.keys(value as object).length;
  return 0;
}

/**
 * A one-line collapsed summary of a container: `{ 3 keys }` / `[ 5 items ]`,
 * singular-aware, with a distinct empty form. Primitives return their formatted
 * value so the same helper labels every collapsed node.
 */
export function summarize(value: unknown): string {
  const kind = classifyJson(value);
  if (kind === "array") {
    const n = childCount(value);
    return n === 0 ? "[ ]" : `[ ${n} ${n === 1 ? "item" : "items"} ]`;
  }
  if (kind === "object") {
    const n = childCount(value);
    return n === 0 ? "{ }" : `{ ${n} ${n === 1 ? "key" : "keys"} }`;
  }
  return formatPrimitive(value);
}

/**
 * Format a primitive leaf for display. Strings are JSON-quoted (so control
 * characters and embedded quotes render unambiguously); numbers/booleans/null
 * use their canonical JSON text. Never throws.
 */
export function formatPrimitive(value: unknown): string {
  switch (classifyJson(value)) {
    case "string":
      try {
        return JSON.stringify(value);
      } catch {
        return `"${String(value)}"`;
      }
    case "number":
      return Number.isFinite(value as number) ? String(value) : "null";
    case "boolean":
      return (value as boolean) ? "true" : "false";
    default:
      return "null";
  }
}

/**
 * The auto-collapse policy: containers at or below `openDepth` start expanded,
 * deeper ones start collapsed — so a large document opens to a legible overview
 * instead of an unbounded wall. The default opens the first two levels.
 */
export const DEFAULT_OPEN_DEPTH = 2;

export function startsExpanded(depth: number, openDepth: number = DEFAULT_OPEN_DEPTH): boolean {
  return depth <= openDepth;
}

/**
 * Whether the node at `path` is currently expanded, given the set of paths the
 * user has explicitly TOGGLED away from their auto-collapse default. This keeps
 * expansion state as a small toggle-delta over the depth policy rather than a
 * full per-node map — a pure derivation the render layer and tests share.
 */
export function isExpanded(input: {
  path: string;
  depth: number;
  toggled: ReadonlySet<string>;
  openDepth?: number;
}): boolean {
  const def = startsExpanded(input.depth, input.openDepth);
  return input.toggled.has(input.path) ? !def : def;
}

/** The immutable toggle of one node's path in the delta set. */
export function togglePath(toggled: ReadonlySet<string>, path: string): Set<string> {
  const next = new Set(toggled);
  if (next.has(path)) next.delete(path);
  else next.add(path);
  return next;
}

/** Build a child's stable path from its parent path + entry key (root = ""). */
export function childPath(parentPath: string, key: string): string {
  return parentPath.length === 0 ? key : `${parentPath}/${key}`;
}
