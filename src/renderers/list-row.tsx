// The row icon of this package's type in the Artifacts list: the shared icon set's
// file-braces glyph, drawn at 17 pixels inside the application's cell. It reads
// nothing but its props, requests no host port, fetches nothing and returns the
// same icon for every object type it receives.

import { FileBraces } from "lucide-react";

import type { ArtifactRendererProps } from "../renderer-props";

export interface ListRowProps {
  artifact: Pick<ArtifactRendererProps["artifact"], "objectType">;
}

export default function JsonArtifactListRow(_props: ListRowProps) {
  return <FileBraces aria-hidden size={17} strokeWidth={2} data-row-glyph="file-braces" />;
}
