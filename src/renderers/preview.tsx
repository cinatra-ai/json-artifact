"use client";

// The `preview` slot renderer for application/json.
//
// The neutral inline-preview capability consumed by in-core reuse sites: a
// single legible line summarizing the document the host projected onto these
// props (top-level keys, item count, or the primitive value), degrading to a raw
// snippet when the projected content is not JSON. Never blank.
//
// IT DRAWS FROM THE CONTENT CHANNEL AND FROM NOTHING ELSE — no request of its
// own, on any road, so a card carrying this line inside a third-party
// application shows the same line it shows on the artifact page.

import { type CSSProperties, type ReactNode } from "react";

import { contentFloorSummary, resolveArtifactTextView, type ArtifactTextView } from "../content-view";
import { JsonPreview } from "../json-tree";
import { PROPS_API_VERSION, type ArtifactRendererProps } from "../renderer-props";

const shellStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  minWidth: 0,
  maxWidth: "100%",
};

const mutedStyle: CSSProperties = {
  fontFamily:
    'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace)',
  fontSize: "12px",
  color: "var(--muted-foreground, #6b7280)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

function Body({ view }: { view: ArtifactTextView }): ReactNode {
  if (view.kind === "floor") {
    return (
      <span style={mutedStyle} data-json-preview-floor={view.reason}>
        {contentFloorSummary(view.reason)}
      </span>
    );
  }
  return <JsonPreview text={view.text} />;
}

/**
 * The default-exported preview renderer. Mounted in the main realm with the
 * shared React singleton; owns no React root.
 */
export default function JsonArtifactPreview(props: ArtifactRendererProps): ReactNode {
  return (
    <div style={shellStyle} data-json-artifact-preview data-props-api-version={PROPS_API_VERSION}>
      <Body view={resolveArtifactTextView(props)} />
    </div>
  );
}
