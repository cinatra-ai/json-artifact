"use client";

// The pretty-printed JSON tree viewer.
//
// A genuinely new renderer (there is no system base for application/json): it
// turns a JSON document into a fully expanded tree with type-colored leaves and
// a never-blank floor for every degraded state. No drawing sentence gives the
// value tree a per-node disclosure control, so it draws none: every container is
// open, and reintroducing collapse needs a ratified drawing change first.
// Colors resolve to the host's shared design tokens (CSS custom properties)
// in-realm, with self-contained fallbacks so the component also renders
// correctly outside the host.

import { useMemo, type CSSProperties, type ReactNode } from "react";

import {
  childCount,
  classifyJson,
  entriesOf,
  formatPrimitive,
  isContainer,
  safeParseJson,
  summarize,
  type JsonKind,
} from "./json-model";

// --- theming -------------------------------------------------------------

const MONO =
  'var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace)';

/** A leaf's color, mapped to a host design token with a readable fallback. */
function leafColor(kind: JsonKind): string {
  switch (kind) {
    case "string":
      return "var(--json-string, var(--color-emerald-600, #0f7b6c))";
    case "number":
      return "var(--json-number, var(--color-blue-600, #2563eb))";
    case "boolean":
      return "var(--json-boolean, var(--color-purple-600, #7c3aed))";
    case "null":
      return "var(--json-null, var(--muted-foreground, #6b7280))";
    default:
      return "var(--foreground, inherit)";
  }
}

const rootStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: "13px",
  lineHeight: 1.6,
  color: "var(--foreground, #111827)",
  overflowX: "auto",
  padding: "2px 0",
};

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "4px",
  whiteSpace: "pre",
};

const keyStyle: CSSProperties = { color: "var(--json-key, var(--foreground, #111827))", fontWeight: 500 };
const punctStyle: CSSProperties = { color: "var(--muted-foreground, #6b7280)" };

// --- one node ------------------------------------------------------------

interface NodeProps {
  value: unknown;
  depth: number;
  /** The property/index label, or null for the root. */
  label: string | null;
}

function KeyLabel({ label }: { label: string | null }): ReactNode {
  if (label === null) return null;
  return (
    <>
      <span style={keyStyle}>{label}</span>
      <span style={punctStyle}>: </span>
    </>
  );
}

function JsonNode(props: NodeProps): ReactNode {
  const { value, depth, label } = props;
  const indent: CSSProperties = { paddingLeft: `${depth * 14}px` };

  // Primitive leaf.
  if (!isContainer(value)) {
    const kind = classifyJson(value);
    return (
      <div style={{ ...rowStyle, ...indent }} data-json-kind={kind}>
        <span style={{ width: "1em", flex: "none" }} aria-hidden="true" />
        <span>
          <KeyLabel label={label} />
          <span style={{ color: leafColor(kind) }} data-json-value>
            {formatPrimitive(value)}
          </span>
        </span>
      </div>
    );
  }

  const kind = classifyJson(value);
  const entries = entriesOf(value);
  const n = childCount(value);
  const openBrace = kind === "array" ? "[" : "{";
  const closeBrace = kind === "array" ? "]" : "}";

  // Empty container — render inline.
  if (n === 0) {
    return (
      <div style={{ ...rowStyle, ...indent }} data-json-kind={kind} data-json-empty>
        <span style={{ width: "1em", flex: "none" }} aria-hidden="true" />
        <span>
          <KeyLabel label={label} />
          <span style={punctStyle}>
            {openBrace}
            {closeBrace}
          </span>
        </span>
      </div>
    );
  }

  // A non-empty container, drawn open, keeping the same one-character gutter the
  // leaf rows keep so the columns line up exactly as before, minus the control.
  return (
    <div data-json-kind={kind}>
      <div style={{ ...rowStyle, ...indent }}>
        <span style={{ width: "1em", flex: "none" }} aria-hidden="true" />
        <span>
          <KeyLabel label={label} />
          <span style={punctStyle}>{openBrace}</span>
        </span>
      </div>
      {entries.map((e) => (
        <JsonNode key={e.key} value={e.value} depth={depth + 1} label={e.key} />
      ))}
      <div style={{ ...rowStyle, ...indent }}>
        <span style={{ width: "1em", flex: "none" }} aria-hidden="true" />
        <span style={punctStyle}>{closeBrace}</span>
      </div>
    </div>
  );
}

// --- the tree ------------------------------------------------------------

/**
 * The tree over an already-parsed JSON value. Every container is expanded: no
 * drawing sentence gives the value tree a per-node disclosure control, so the
 * tree holds no expansion state and offers nothing to toggle.
 */
export function JsonTree({ value }: { value: unknown }): ReactNode {
  return (
    <div style={rootStyle} data-json-tree>
      <JsonNode value={value} depth={0} label={null} />
    </div>
  );
}

// --- never-blank floor for a document ------------------------------------

const noticeStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: "12px",
  color: "var(--muted-foreground, #6b7280)",
  padding: "4px 0",
};

const rawStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: "12px",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  color: "var(--foreground, #111827)",
  maxHeight: "60vh",
  overflow: "auto",
  margin: 0,
};

/**
 * Render a JSON DOCUMENT (raw text) to a tree — degrading, never blank:
 *  - valid JSON  → the tree;
 *  - malformed   → the raw bytes verbatim + a one-line diagnostic;
 *  - empty       → an explicit empty-state.
 * The safe-parse never throws, so this component cannot blank the host page.
 */
export function JsonDocument({ text }: { text: string }): ReactNode {
  const parsed = useMemo(() => safeParseJson(text), [text]);
  if (parsed.ok) {
    return <JsonTree value={parsed.value} />;
  }
  if (parsed.error === "empty document") {
    return (
      <div style={noticeStyle} data-json-empty-doc>
        No JSON content to display.
      </div>
    );
  }
  return (
    <div data-json-invalid>
      <div style={noticeStyle}>Could not parse as JSON ({parsed.error}). Showing raw content:</div>
      <pre style={rawStyle}>{parsed.raw}</pre>
    </div>
  );
}

// --- compact inline preview ----------------------------------------------

const previewStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: "12px",
  color: "var(--muted-foreground, #4b5563)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
};

/** Build a one-line structural summary of a parsed value for the preview slot. */
function previewLine(value: unknown): string {
  const kind = classifyJson(value);
  if (kind === "object") {
    const keys = Object.keys(value as object);
    if (keys.length === 0) return "{ }";
    const head = keys.slice(0, 5).join(", ");
    return `{ ${head}${keys.length > 5 ? `, +${keys.length - 5} more` : ""} }`;
  }
  if (kind === "array") return summarize(value);
  return formatPrimitive(value);
}

/**
 * The compact `preview` slot: a single legible line summarizing the document —
 * top-level keys for an object, item count for an array, the value for a
 * primitive — degrading to a raw snippet when the bytes are not JSON. Never
 * blank.
 */
export function JsonPreview({ text }: { text: string }): ReactNode {
  const parsed = useMemo(() => safeParseJson(text), [text]);
  if (parsed.ok) {
    return (
      <div style={previewStyle} data-json-preview title={previewLine(parsed.value)}>
        {previewLine(parsed.value)}
      </div>
    );
  }
  const snippet = parsed.raw.trim().slice(0, 120);
  return (
    <div style={previewStyle} data-json-preview-raw>
      {snippet.length > 0 ? snippet : "No JSON content"}
    </div>
  );
}
