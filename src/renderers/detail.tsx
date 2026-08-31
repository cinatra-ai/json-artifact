"use client";

// The `detail` slot renderer for application/json.
//
// Full artifact detail view: a collapsible, pretty-printed JSON tree over the
// document the host projected onto these props, with a lightweight header
// (title + download) and a NAMED floor for every state the channel can report.
//
// IT DRAWS FROM THE CONTENT CHANNEL AND FROM NOTHING ELSE. The text arrives on
// the snapshot, read from the pinned revision on the server and capped there —
// this display makes no request of its own, on any road. That is what lets it
// draw inside a third-party application, where a display reaching for bytes from
// the browser carries no credential and paints an empty plate.
//
// NEVER BLANK, NEVER THROWN: content it cannot draw becomes a named floor.

import { type CSSProperties, type ReactNode } from "react";

import {
  byteDownloadHref,
  contentFloorMessage,
  resolveArtifactTextView,
  type ArtifactTextView,
} from "../content-view";
import { JsonDocument } from "../json-tree";
import { PROPS_API_VERSION, type ArtifactRendererProps } from "../renderer-props";

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

function Body({ view }: { view: ArtifactTextView }): ReactNode {
  if (view.kind === "floor") {
    return (
      <div style={noticeStyle} data-json-detail-floor={view.reason}>
        {contentFloorMessage(view.reason)}
      </div>
    );
  }
  return (
    <>
      <JsonDocument text={view.text} />
      {view.truncated ? (
        <p style={noticeStyle} data-json-detail-truncated>
          {`Showing the first ${view.projectedByteLength.toLocaleString("en-US")} of ${view.byteLength.toLocaleString("en-US")} bytes. Download it to read the whole of it.`}
        </p>
      ) : null}
    </>
  );
}

/**
 * The default-exported detail renderer. The host mounts this in the main realm
 * with the shared React singleton; it owns no React root.
 */
export default function JsonArtifactDetail(props: ArtifactRendererProps): ReactNode {
  const view = resolveArtifactTextView(props);
  const title = props?.artifact?.title ?? "JSON document";
  const download = byteDownloadHref(props);
  return (
    <div style={wrapStyle} data-json-artifact-detail data-props-api-version={PROPS_API_VERSION}>
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
      <Body view={view} />
    </div>
  );
}
