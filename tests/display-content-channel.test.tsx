// @vitest-environment node
// BOTH SLOTS DRAW FROM THE CONTENT CHANNEL — the acceptance this wave is for:
// "The json, cms-snapshot and text displays draw through the content channel on
// every host."
//
// The projected text must reach the DRAWN OUTPUT, on the first-party snapshot
// and on the one a host builds inside a third-party application alike, and no
// request may leave the display while it happens.

import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { contentFloorMessage, contentFloorSummary } from "../src/content-view";
import JsonArtifactDetail from "../src/renderers/detail";
import JsonArtifactPreview from "../src/renderers/preview";
import { islandProps, noContent, props, textContent } from "./props-fixture";

const DOCUMENT = '{"alpha":1,"beta":[1,2,3]}';

/** Render with every network entry point this environment has replaced by a
 * recorder, so a display that reached for one is caught in the act. */
function drawWatched(node: Parameters<typeof renderToStaticMarkup>[0]): {
  html: string;
  calls: number;
} {
  const fetchSpy = vi.fn();
  const xhrSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
  vi.stubGlobal(
    "XMLHttpRequest",
    class {
      constructor() {
        xhrSpy();
      }
    },
  );
  const html = renderToStaticMarkup(node);
  return { html, calls: fetchSpy.mock.calls.length + xhrSpy.mock.calls.length };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the detail slot draws the projected text", () => {
  it("puts the host-projected content in the drawn output and asks the network for nothing", () => {
    const { html, calls } = drawWatched(<JsonArtifactDetail {...props(textContent(DOCUMENT))} />);
    expect(calls).toBe(0);
    expect(html).toContain("alpha");
    expect(html).toContain("beta");
    expect(html).toContain("data-json-artifact-detail");
    expect(html).not.toContain("aria-busy");
  });

  it("draws the same content inside a third-party application, where a session address is unreachable", () => {
    const { html, calls } = drawWatched(<JsonArtifactDetail {...islandProps(textContent(DOCUMENT))} />);
    expect(calls).toBe(0);
    expect(html).toContain("alpha");
  });

  it("stamps the props version it was drawn at, so a surface can read which contract it got", () => {
    const html = renderToStaticMarkup(<JsonArtifactDetail {...props(textContent(DOCUMENT))} />);
    expect(html).toContain('data-props-api-version="2"');
  });

  it("loads no subresource of its own — no frame, no picture, no address on an element", () => {
    const { html } = drawWatched(<JsonArtifactDetail {...props(textContent(DOCUMENT))} />);
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("src=");
  });

  // NO ADDRESS AT ALL, ON EITHER SURFACE. The panel used to offer a download,
  // so this pinned that the offered address was the island one. The drawing gives
  // this kind no download inside the panel (§V.2), so what is pinned now is the
  // stronger reading the content channel was built for: the document is drawn
  // from the props on the island, and the display reaches for nothing.
  it("reaches for no byte address on the island — the document came on the props", () => {
    const html = renderToStaticMarkup(<JsonArtifactDetail {...islandProps(textContent(DOCUMENT))} />);
    expect(html).toContain("alpha");
    expect(html).not.toContain("/api/lifecycle-views/artifact-bytes");
    expect(html).not.toMatch(/<a\b/);
  });

  it("says how much of a truncated document it is showing", () => {
    const html = renderToStaticMarkup(
      <JsonArtifactDetail
        {...props(textContent(DOCUMENT, { truncated: true, byteLength: 900000, projectedByteLength: 262144 }))}
      />,
    );
    expect(html).toContain("data-json-detail-truncated");
    expect(html).toContain("262,144");
    expect(html).toContain("900,000");
  });
});

describe("the detail slot floors, named and never blank", () => {
  it("floors with the named reason when the host builds an older props version", () => {
    const html = renderToStaticMarkup(
      <JsonArtifactDetail {...({ ...props(textContent(DOCUMENT)), propsApiVersion: 1 } as never)} />,
    );
    expect(html).toContain('data-json-detail-floor="props-version"');
    expect(html).toContain(contentFloorMessage("props-version"));
    expect(html.replace(/<[^>]*>/g, "").trim().length).toBeGreaterThan(0);
  });

  it("floors with the named reason when the surface handed it no projection", () => {
    const { content: _dropped, ...rest } = props(textContent(DOCUMENT));
    const html = renderToStaticMarkup(<JsonArtifactDetail {...(rest as never)} />);
    expect(html).toContain('data-json-detail-floor="content-unavailable"');
  });

  it("floors with the channel's own named absence", () => {
    const html = renderToStaticMarkup(<JsonArtifactDetail {...props(noContent("over-cap"))} />);
    expect(html).toContain('data-json-detail-floor="content-over-cap"');
    expect(html).toContain(contentFloorMessage("content-over-cap"));
  });

  it("still draws its header, and never throws, on a snapshot that is barely one", () => {
    const html = renderToStaticMarkup(<JsonArtifactDetail {...({ propsApiVersion: 2 } as never)} />);
    expect(html).toContain("data-json-artifact-detail");
    expect(html).toContain('data-json-detail-floor="content-unavailable"');
  });
});

describe("the preview slot draws the projected text", () => {
  it("summarizes the host-projected content and asks the network for nothing", () => {
    const { html, calls } = drawWatched(<JsonArtifactPreview {...props(textContent(DOCUMENT))} />);
    expect(calls).toBe(0);
    expect(html).toContain("alpha");
    expect(html).not.toContain("aria-busy");
  });

  it("floors with the named reason, in one compact line", () => {
    const html = renderToStaticMarkup(<JsonArtifactPreview {...props(noContent("absent"))} />);
    expect(html).toContain('data-json-preview-floor="content-absent"');
    expect(html).toContain(contentFloorSummary("content-absent"));
  });

  it("loads no subresource of its own", () => {
    const { html } = drawWatched(<JsonArtifactPreview {...props(textContent(DOCUMENT))} />);
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("src=");
  });
});
