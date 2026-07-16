import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { JsonDocument, JsonPreview, JsonTree } from "../json-tree";
import JsonArtifactDetail from "../renderers/detail";
import JsonArtifactPreview from "../renderers/preview";
import type { ArtifactRendererProps } from "../renderer-props";

function markup(node: Parameters<typeof renderToStaticMarkup>[0]): string {
  return renderToStaticMarkup(node);
}

describe("JsonTree", () => {
  it("renders keys and values of a nested document", () => {
    const html = markup(<JsonTree value={{ name: "cinatra", count: 3, ok: true }} />);
    expect(html).toContain("name");
    expect(html).toContain("&quot;cinatra&quot;");
    expect(html).toContain("count");
    expect(html).toContain("true");
  });

  it("renders empty containers inline and never blank", () => {
    expect(markup(<JsonTree value={{}} />)).toContain("{");
    expect(markup(<JsonTree value={[]} />)).toContain("[");
  });

  it("collapses nodes deeper than the open depth, showing a child count", () => {
    const value = { outer: { inner: { secret: "buried" } } };
    // openDepth 0: only the root is expanded; depth-1 "outer" is collapsed.
    const collapsed = markup(<JsonTree value={value} openDepth={0} />);
    expect(collapsed).toContain("outer");
    expect(collapsed).toContain("key"); // the collapsed summary "{ 1 key }"
    expect(collapsed).not.toContain("buried"); // the buried leaf is not rendered
    // A generous open depth expands everything.
    const expanded = markup(<JsonTree value={value} openDepth={10} />);
    expect(expanded).toContain("buried");
  });

  it("renders a bare primitive root", () => {
    expect(markup(<JsonTree value={42} />)).toContain("42");
    expect(markup(<JsonTree value={"hello"} />)).toContain("hello");
  });
});

describe("JsonDocument (never-blank degradation)", () => {
  it("renders a tree for valid JSON text", () => {
    const html = markup(<JsonDocument text='{"a":1}' />);
    expect(html).toContain("a");
    expect(html).toContain("1");
  });

  it("shows raw bytes and a diagnostic for malformed JSON — not blank", () => {
    const raw = "{ not json ]";
    const html = markup(<JsonDocument text={raw} />);
    expect(html).toContain("Could not parse as JSON");
    expect(html).toContain("not json"); // the raw content is shown verbatim
    expect(html.length).toBeGreaterThan(0);
  });

  it("shows an explicit empty-state for an empty body", () => {
    const html = markup(<JsonDocument text="   " />);
    expect(html).toContain("No JSON content");
  });
});

describe("JsonPreview (compact, never-blank)", () => {
  it("summarizes an object's top-level keys", () => {
    const html = markup(<JsonPreview text='{"alpha":1,"beta":2}' />);
    expect(html).toContain("alpha");
    expect(html).toContain("beta");
  });

  it("summarizes an array by item count", () => {
    expect(markup(<JsonPreview text="[1,2,3]" />)).toContain("3 items");
  });

  it("falls back to a raw snippet for non-JSON — not blank", () => {
    const html = markup(<JsonPreview text="plain text, not json" />);
    expect(html).toContain("plain text");
  });
});

function baseProps(overrides: Partial<ArtifactRendererProps["urls"]>): ArtifactRendererProps {
  return {
    propsApiVersion: 1,
    artifact: {
      id: "art_1",
      title: "config.json",
      objectType: "@cinatra-ai/objects:object",
      mime: "application/json",
      size: 128,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      ownerLevel: "workspace",
      visibility: "workspace",
      sourceUrl: null,
    },
    representation: { revisionId: "rev_1", mime: "application/json" },
    urls: { preview: null, download: null, ...overrides },
    identity: { kind: "extension", extension: "@cinatra-ai/json-artifact", basis: "mime", selectable: true },
    actions: { download: null, openInSource: null },
  };
}

describe("slot renderers (default exports)", () => {
  it("detail renders a no-content floor synchronously when no URL is authorized", () => {
    const html = markup(<JsonArtifactDetail {...baseProps({})} />);
    expect(html).toContain("No JSON content is available");
    expect(html).toContain("config.json"); // the header title still renders
  });

  it("detail renders a bounded skeleton (never blank) while content loads", () => {
    const html = markup(<JsonArtifactDetail {...baseProps({ preview: "/api/artifacts/art_1/content" })} />);
    expect(html).toContain("aria-busy");
    expect(html.length).toBeGreaterThan(0);
  });

  it("preview renders a no-content state synchronously when no URL is authorized", () => {
    expect(markup(<JsonArtifactPreview {...baseProps({})} />)).toContain("No JSON content");
  });

  it("both default exports are React components (mountable functions)", () => {
    expect(typeof JsonArtifactDetail).toBe("function");
    expect(typeof JsonArtifactPreview).toBe("function");
  });
});
