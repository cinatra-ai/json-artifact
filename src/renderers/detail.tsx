"use client";

// The `detail` slot renderer for application/json.
//
// Full artifact detail view: a collapsible, pretty-printed JSON tree over the
// document's authorized bytes, with a lightweight header (title + download) and
// a never-blank floor for every state — no content, loading, fetch error, and
// malformed JSON (shown as raw bytes, never blank). Requests no host ports;
// renders only from the authorized props snapshot.

import { type CSSProperties, type ReactNode } from "react";

import { JsonDocument } from "../json-tree";
import { type ArtifactRendererProps } from "../renderer-props";
import { useArtifactText } from "../use-artifact-text";

const wrapStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  minWidth: 0,
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
};

const titleStyle: CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--foreground, #111827)",
  margin: 0,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const linkStyle: CSSProperties = {
  fontSize: "12px",
  color: "var(--primary, #2563eb)",
  textDecoration: "none",
  flex: "none",
};

const noticeStyle: CSSProperties = {
  fontFamily:
    'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace)',
  fontSize: "12px",
  color: "var(--muted-foreground, #6b7280)",
  padding: "8px 0",
};

const skeletonStyle: CSSProperties = {
  height: "72px",
  borderRadius: "6px",
  background: "var(--muted, #f3f4f6)",
  opacity: 0.7,
};

function Body({ url }: { url: string | null }): ReactNode {
  const state = useArtifactText(url);
  switch (state.status) {
    case "no-content":
      return (
        <div style={noticeStyle} data-json-detail-empty>
          No JSON content is available for this artifact.
        </div>
      );
    case "loading":
      return <div style={skeletonStyle} aria-busy="true" data-json-detail-loading />;
    case "error":
      return (
        <div style={noticeStyle} data-json-detail-error>
          {state.message}.
        </div>
      );
    case "loaded":
      return <JsonDocument text={state.text} />;
  }
}

/**
 * The default-exported detail renderer. The host mounts this in the main realm
 * with the shared React singleton; it owns no React root.
 */
export default function JsonArtifactDetail(props: ArtifactRendererProps): ReactNode {
  const url = props.urls.preview ?? props.urls.download;
  const title = props.artifact.title ?? "JSON document";
  const download = props.actions.download ?? props.urls.download;
  return (
    <div style={wrapStyle} data-json-artifact-detail>
      <div style={headerStyle}>
        <p style={titleStyle} title={title}>
          {title}
        </p>
        {download ? (
          <a style={linkStyle} href={download} download data-json-download>
            Download
          </a>
        ) : null}
      </div>
      <Body url={url} />
    </div>
  );
}
