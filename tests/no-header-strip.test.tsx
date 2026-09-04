/**
 * A KIND WITH NO HEADER STRIP DRAWS NONE (the review drawing §V.2, §XI).
 *
 * VERBATIM (§V.2): "It has no tabs and nothing else to put in a header, so it
 * carries NO HEADER STRIP AT ALL". A display that divides one artifact into
 * readings gets the design system's tabs (§XI); a display with one reading gets
 * a panel and the work in it, and nothing above the work.
 *
 * AND THE PAGE ALREADY NAMES THE FILE. The artifact page draws the display title
 * over the mono meta line; a strip inside the panel repeating the same name, with
 * a download control of its own beside it, is a second header the drawing does
 * not draw — a proof round measured it, and counted the control as one download
 * too many on a surface the drawing gives none.
 *
 * THE TRUNCATION READING STAYS, because it is a reading the display HAS: where
 * content is capped, "the display draws the named gap in the missing thing's
 * place". What leaves it is the instruction to go and download the rest, which
 * points at a control this panel no longer carries.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import JsonArtifactDetail from "../src/renderers/detail";
import { noContent, props, textContent } from "./props-fixture";

const SAMPLE = JSON.stringify({ subject: "Login loop on SSO", priority: "high" }, null, 2);
const FILE_NAME = "config.json";

describe("the panel carries no header strip and no download of its own", () => {
  it("draws no download control anywhere in the panel", () => {
    const html = renderToStaticMarkup(<JsonArtifactDetail {...props(textContent(SAMPLE))} />);
    expect(html).not.toMatch(/<a\b/);
    expect(html).not.toContain("data-json-download");
  });

  it("draws no download control on the floor either", () => {
    const html = renderToStaticMarkup(<JsonArtifactDetail {...props(noContent("absent"))} />);
    expect(html).not.toMatch(/<a\b/);
  });

  it("repeats no file name above the work — the page's own header names it", () => {
    const html = renderToStaticMarkup(<JsonArtifactDetail {...props(textContent(SAMPLE))} />);
    expect(html).not.toContain(FILE_NAME);
  });

  it("names the capped gap without pointing at a control it does not carry", () => {
    const html = renderToStaticMarkup(
      <JsonArtifactDetail
        {...props(
          textContent(SAMPLE, {
            truncated: true,
            byteLength: 4096,
            projectedByteLength: SAMPLE.length,
          }),
        )}
      />,
    );
    expect(html).toMatch(/Showing the first/);
    expect(html).not.toMatch(/Download it to read/);
  });

  it("still draws the work itself, and still names the props version it reads", () => {
    const html = renderToStaticMarkup(<JsonArtifactDetail {...props(textContent(SAMPLE))} />);
    expect(html).toContain("Login loop on SSO");
    expect(html).toContain("data-props-api-version");
  });
});
