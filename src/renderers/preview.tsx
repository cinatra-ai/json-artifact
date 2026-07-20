"use client";

// The `preview` slot renderer for application/json.
//
// The neutral inline-preview capability consumed by in-core reuse sites: a
// single legible line summarizing the document (top-level keys, item count, or
// the primitive value), degrading to a raw snippet when the bytes are not JSON.
// Never blank. Requests no host ports; renders only from the authorized props
// snapshot.

import { type CSSProperties, type ReactNode } from "react";

import { JsonPreview } from "../json-tree";
import { type ArtifactRendererProps } from "../renderer-props";
import { useArtifactText } from "../use-artifact-text";

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

const skeletonStyle: CSSProperties = {
  height: "16px",
  width: "160px",
  borderRadius: "4px",
  background: "var(--muted, #f3f4f6)",
  opacity: 0.7,
};

function Body({ url }: { url: string | null }): ReactNode {
  const state = useArtifactText(url);
  switch (state.status) {
    case "no-content":
      return (
        <span style={mutedStyle} data-json-preview-empty>
          No JSON content
        </span>
      );
    case "loading":
      return <span style={skeletonStyle} aria-busy="true" data-json-preview-loading />;
    case "error":
      return (
        <span style={mutedStyle} data-json-preview-error>
          content unavailable
        </span>
      );
    case "loaded":
      return <JsonPreview text={state.text} />;
  }
}

/**
 * The default-exported preview renderer. Mounted in the main realm with the
 * shared React singleton; owns no React root.
 */
export default function JsonArtifactPreview(props: ArtifactRendererProps): ReactNode {
  const url = props.urls.preview ?? props.urls.download;
  return (
    <div style={shellStyle} data-json-artifact-preview>
      <Body url={url} />
    </div>
  );
}
