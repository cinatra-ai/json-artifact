import { describe, expect, it } from "vitest";

import {
  childCount,
  childPath,
  classifyJson,
  DEFAULT_OPEN_DEPTH,
  entriesOf,
  formatPrimitive,
  isContainer,
  isExpanded,
  safeParseJson,
  startsExpanded,
  summarize,
  togglePath,
} from "../json-model";

describe("safeParseJson", () => {
  it("parses valid JSON", () => {
    const r = safeParseJson('{"a":1,"b":[true,null]}');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual({ a: 1, b: [true, null] });
  });

  it("parses a bare primitive document", () => {
    const r = safeParseJson("42");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(42);
  });

  it("reports malformed JSON without throwing and echoes the raw text", () => {
    const raw = "{not: valid}";
    const r = safeParseJson(raw);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.raw).toBe(raw);
      expect(r.error).not.toBe("empty document");
      expect(typeof r.error).toBe("string");
    }
  });

  it("reports empty and whitespace-only bodies as their own reason", () => {
    for (const t of ["", "   ", "\n\t"]) {
      const r = safeParseJson(t);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe("empty document");
    }
  });

  it("never throws on non-string input", () => {
    // @ts-expect-error — exercising a hostile non-string at runtime
    expect(() => safeParseJson(null)).not.toThrow();
    // @ts-expect-error — exercising a hostile non-string at runtime
    const r = safeParseJson(undefined);
    expect(r.ok).toBe(false);
  });
});

describe("classifyJson / isContainer", () => {
  it("classifies every JSON kind, arrays before objects", () => {
    expect(classifyJson([])).toBe("array");
    expect(classifyJson({})).toBe("object");
    expect(classifyJson("x")).toBe("string");
    expect(classifyJson(3)).toBe("number");
    expect(classifyJson(false)).toBe("boolean");
    expect(classifyJson(null)).toBe("null");
  });

  it("treats objects and arrays as containers, primitives as leaves", () => {
    expect(isContainer({})).toBe(true);
    expect(isContainer([1])).toBe(true);
    expect(isContainer("s")).toBe(false);
    expect(isContainer(null)).toBe(false);
  });
});

describe("entriesOf / childCount", () => {
  it("yields object entries and array index entries in order", () => {
    expect(entriesOf({ a: 1, b: 2 })).toEqual([
      { key: "a", value: 1 },
      { key: "b", value: 2 },
    ]);
    expect(entriesOf(["x", "y"])).toEqual([
      { key: "0", value: "x" },
      { key: "1", value: "y" },
    ]);
  });

  it("returns no entries for primitives and empty containers", () => {
    expect(entriesOf(5)).toEqual([]);
    expect(entriesOf({})).toEqual([]);
    expect(childCount("s")).toBe(0);
    expect(childCount([1, 2, 3])).toBe(3);
    expect(childCount({ a: 1 })).toBe(1);
  });
});

describe("summarize", () => {
  it("is singular/plural/empty aware for containers", () => {
    expect(summarize({})).toBe("{ }");
    expect(summarize([])).toBe("[ ]");
    expect(summarize({ a: 1 })).toBe("{ 1 key }");
    expect(summarize({ a: 1, b: 2 })).toBe("{ 2 keys }");
    expect(summarize([1])).toBe("[ 1 item ]");
    expect(summarize([1, 2])).toBe("[ 2 items ]");
  });

  it("returns the formatted value for a primitive", () => {
    expect(summarize("hi")).toBe('"hi"');
    expect(summarize(true)).toBe("true");
  });
});

describe("formatPrimitive", () => {
  it("JSON-quotes strings and renders canonical scalars", () => {
    expect(formatPrimitive('a"b')).toBe('"a\\"b"');
    expect(formatPrimitive(0)).toBe("0");
    expect(formatPrimitive(-1.5)).toBe("-1.5");
    expect(formatPrimitive(true)).toBe("true");
    expect(formatPrimitive(false)).toBe("false");
    expect(formatPrimitive(null)).toBe("null");
  });

  it("degrades a non-finite number to null", () => {
    expect(formatPrimitive(Number.POSITIVE_INFINITY)).toBe("null");
    expect(formatPrimitive(Number.NaN)).toBe("null");
  });
});

describe("expansion policy", () => {
  it("auto-opens down to the configured depth", () => {
    expect(DEFAULT_OPEN_DEPTH).toBe(2);
    expect(startsExpanded(0)).toBe(true);
    expect(startsExpanded(2)).toBe(true);
    expect(startsExpanded(3)).toBe(false);
    expect(startsExpanded(1, 0)).toBe(false);
  });

  it("applies the toggle delta over the depth default", () => {
    const empty = new Set<string>();
    // A node that defaults open, toggled once, is now collapsed.
    expect(isExpanded({ path: "a", depth: 0, toggled: empty })).toBe(true);
    const t1 = togglePath(empty, "a");
    expect(isExpanded({ path: "a", depth: 0, toggled: t1 })).toBe(false);
    // A node that defaults collapsed, toggled once, is now expanded.
    expect(isExpanded({ path: "deep", depth: 5, toggled: empty })).toBe(false);
    const t2 = togglePath(empty, "deep");
    expect(isExpanded({ path: "deep", depth: 5, toggled: t2 })).toBe(true);
  });

  it("togglePath is immutable and reversible", () => {
    const a = new Set<string>();
    const b = togglePath(a, "p");
    expect(a.has("p")).toBe(false);
    expect(b.has("p")).toBe(true);
    const c = togglePath(b, "p");
    expect(c.has("p")).toBe(false);
  });

  it("builds stable child paths", () => {
    expect(childPath("", "root")).toBe("root");
    expect(childPath("a", "b")).toBe("a/b");
    expect(childPath("a/b", "0")).toBe("a/b/0");
  });
});
