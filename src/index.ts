// @cinatra-ai/json-artifact — a dynamically-installable artifact renderer for
// application/json.
//
// This is the one genuinely new viewer in the artifact fleet: there is no system
// base covering application/json, yet agent-run structured outputs and
// object-content snapshots are application/json today. It ships an extension-owned
// renderer per slot (detail + preview) that mounts in the host page's main realm
// sharing the host React singleton, requests NO host ports, and renders only from
// the host-authorized props snapshot.
//
// THE DOCUMENT ARRIVES ON THE PROPS, through the versioned server content
// channel, read from the pinned revision on the server and capped there. The
// displays make no request of their own, on any road, which is what lets them
// draw inside a third-party application — where a display reaching for bytes
// from the browser carries no credential and paints an empty plate. Anything the
// channel cannot supply degrades to a NAMED floor, never a blank.

// The slot renderers (default-exported React components the host mounts).
export { default as JsonArtifactDetail } from "./renderers/detail";
export { default as JsonArtifactPreview } from "./renderers/preview";

// The reusable view components (the collapsible tree + document/preview wrappers).
export { JsonTree, JsonDocument, JsonPreview } from "./json-tree";

// The host-supplied props contract this renderer binds to (v2, no host ports).
export { PROPS_API_VERSION } from "./renderer-props";
export type { ArtifactRendererProps } from "./renderer-props";

// The content channel the displays read, and the total resolver over it.
export { ARTIFACT_CONTENT_CHANNEL_VERSION, ARTIFACT_CONTENT_CLASSES, ARTIFACT_CONTENT_ABSENCES } from "./artifact-content-channel";
export type { ArtifactContentProjection, ArtifactContentClass, ArtifactContentAbsence } from "./artifact-content-channel";
export {
  resolveArtifactTextView,
  contentFloorMessage,
  contentFloorSummary,
  byteDownloadHref,
} from "./content-view";
export type { ArtifactTextView, ArtifactTextViewInput, ContentFloorReason } from "./content-view";

// The pure, never-throwing JSON-tree model (shared by the view and the tests).
export {
  safeParseJson,
  classifyJson,
  isContainer,
  entriesOf,
  childCount,
  summarize,
  formatPrimitive,
  isExpanded,
  togglePath,
  childPath,
  startsExpanded,
  DEFAULT_OPEN_DEPTH,
} from "./json-model";
export type { JsonKind, JsonParseResult, JsonEntry } from "./json-model";

/** The typed mirror of the authoritative `cinatra.artifact` descriptor declared
 * in package.json — this extension claims exactly `application/json` and ships a
 * renderer for the detail and preview slots. */
export interface JsonArtifactManifest {
  accepts: { file: { mimeTypes: string[] } };
  ui: {
    abiVersion: 1;
    sdkAbiRange: string;
    renderers: {
      detail: { entry: string; propsApiVersion: number; representations: string[] };
      preview: { entry: string; propsApiVersion: number; representations: string[] };
    };
  };
}

export const jsonArtifactManifest: JsonArtifactManifest = {
  accepts: { file: { mimeTypes: ["application/json"] } },
  ui: {
    abiVersion: 1,
    sdkAbiRange: "^2.5.0",
    renderers: {
      detail: {
        entry: "./src/renderers/detail.tsx",
        propsApiVersion: 2,
        representations: ["application/json"],
      },
      preview: {
        entry: "./src/renderers/preview.tsx",
        propsApiVersion: 2,
        representations: ["application/json"],
      },
    },
  },
};
