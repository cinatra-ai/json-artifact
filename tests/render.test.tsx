import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { JsonDocument, JsonPreview, JsonTree } from "../src/json-tree";
import JsonArtifactDetail from "../src/renderers/detail";
import JsonArtifactPreview from "../src/renderers/preview";
import { noContent, props, textContent } from "./props-fixture";

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

describe("slot renderers (default exports)", () => {
  const DOCUMENT = '{"alpha":1}';

  // THE PANEL IS THE WORK, AND NOTHING ABOVE IT (the review drawing §V.2: a
  // kind with nothing to put in a header "carries no header strip at all"). This
  // used to pin the file name repeated inside the panel; the artifact page's own
  // header names the file, and a proof round graded the repetition as a second
  // header the drawing does not draw.
  it("detail draws the projected document, and repeats no file name above it", () => {
    const html = markup(<JsonArtifactDetail {...props(textContent(DOCUMENT))} />);
    expect(html).toContain("alpha");
    expect(html).not.toContain("config.json");
  });

  it("detail floors, named and never blank, when the channel has nothing to give it", () => {
    const html = markup(<JsonArtifactDetail {...props(noContent("absent"))} />);
    expect(html).toContain('data-json-detail-floor="content-absent"');
    expect(html.replace(/<[^>]*>/g, "").trim().length).toBeGreaterThan(0);
  });

  it("preview draws a summary of the projected document", () => {
    expect(markup(<JsonArtifactPreview {...props(textContent(DOCUMENT))} />)).toContain("alpha");
  });

  it("preview floors, named and never blank, when the channel has nothing to give it", () => {
    const html = markup(<JsonArtifactPreview {...props(noContent("absent"))} />);
    expect(html).toContain('data-json-preview-floor="content-absent"');
    expect(html.replace(/<[^>]*>/g, "").trim().length).toBeGreaterThan(0);
  });

  it("neither slot draws a loading state — there is nothing to wait for", () => {
    expect(markup(<JsonArtifactDetail {...props(textContent(DOCUMENT))} />)).not.toContain("aria-busy");
    expect(markup(<JsonArtifactPreview {...props(textContent(DOCUMENT))} />)).not.toContain("aria-busy");
  });

  it("both default exports are React components (mountable functions)", () => {
    expect(typeof JsonArtifactDetail).toBe("function");
    expect(typeof JsonArtifactPreview).toBe("function");
  });
});
