/**
 * A WIDE ROW SCROLLS INSIDE ITS OWN CONTAINER, NEVER CUT AT THE CONTENT EDGE.
 *
 * The defect this file pins: inside the host's review island, every value-tree
 * row was cut at the panel's content edge — mid-word, no ellipsis, no wrap, no
 * scroll affordance. The rows carried `white-space: pre` inside a container
 * that declared `overflow-x: auto`, but that container was neither bounded
 * (nothing stopped an ancestor from stretching it) nor did its rows ever grow
 * past its content box, so it had no scrollable overflow of its own: the wide
 * glyphs were clipped by an ancestor between the island body wrapper and the
 * tree instead of scrolling inside the tree.
 *
 * The fix is a real scroll container in a bounded box: the element that holds
 * the rows is bounded by its parent (`min-width: 0` so a flex or grid chain
 * cannot force it wider, `max-width: 100%`) and scrolls on the horizontal axis,
 * and each row is `max-content` wide so a wide row establishes the scrollable
 * overflow region inside that container rather than overflowing the page.
 *
 * HOW THIS IS MEASURED HERE. The pack's suite runs `environment: 'node'` with
 * `react-dom/server` static markup: there is no layout engine, so a literal
 * `scrollWidth > clientWidth` reading cannot be taken in this tier (jsdom has
 * no layout either — both metrics are always 0 there). The equivalent taken
 * here is the rendered scroll contract at the same measure: the tree is mounted
 * inside a bounded container narrower than its widest row, and the markup is
 * asserted to declare a bounded horizontal scroll container whose rows are
 * wider than its content box, with the full glyphs of the widest row present
 * and no clipping or ellipsis anywhere on a row.
 */
import { type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { JsonTree } from "../src/json-tree";
import JsonArtifactDetail from "../src/renderers/detail";
import { props, textContent } from "./props-fixture";

/** One value far wider than any review-island panel: 240 characters, unbroken. */
const WIDE_VALUE = `sso-login-loop-${"x".repeat(200)}-end`;

const WIDE_DOCUMENT = {
  summary: WIDE_VALUE,
  nested: { deeper: { detail: WIDE_VALUE } },
  items: [WIDE_VALUE],
};

/**
 * The bounded parent the island body gives the display: narrower than the
 * widest row by construction (24 characters of measure against a 240-character
 * row), and clipping on its own axis the way the island document does.
 */
const BOUND_CH = 24;
function Bounded({ children }: { children: ReactNode }) {
  return (
    <div style={{ width: `${BOUND_CH}ch`, maxWidth: `${BOUND_CH}ch`, overflow: "hidden" }}>
      {children}
    </div>
  );
}

/** Every inline style attribute in the markup, in document order. */
function styles(html: string): string[] {
  return [...html.matchAll(/style="([^"]*)"/g)].map((m) => m[1]);
}

/** The style of the element that carries the rows (the tree root). */
function rowContainerStyle(html: string): string {
  const m = html.match(/<div style="([^"]*)"[^>]*data-json-tree/);
  expect(m, "the markup carries a data-json-tree row container").not.toBeNull();
  return (m as RegExpMatchArray)[1];
}

/** The styles of the row boxes — every box that lays its text out as `pre`. */
function rowStyles(html: string): string[] {
  return styles(html).filter((s) => s.includes("white-space:pre"));
}

describe("a value-tree row wider than its bounded parent scrolls inside its own container", () => {
  it("the fixture really is wider than the bound it is mounted in", () => {
    expect(WIDE_VALUE.length).toBeGreaterThan(BOUND_CH * 4);
  });

  it("the row container is a bounded horizontal scroll container", () => {
    const html = renderToStaticMarkup(
      <Bounded>
        <JsonTree value={WIDE_DOCUMENT} />
      </Bounded>,
    );
    const root = rowContainerStyle(html);
    // It scrolls on the axis the wide row overflows.
    expect(root).toMatch(/overflow-x:\s*auto/);
    // And it is BOUNDED: a flex or grid chain cannot stretch it past its
    // parent, so the overflow has somewhere to scroll instead of widening the
    // page and being clipped by an ancestor.
    expect(root).toMatch(/min-width:\s*0/);
    expect(root).toMatch(/max-width:\s*100%/);
  });

  it("every row is max-content wide, so a wide row overflows the container and not the page", () => {
    const html = renderToStaticMarkup(
      <Bounded>
        <JsonTree value={WIDE_DOCUMENT} />
      </Bounded>,
    );
    const rows = rowStyles(html);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row).toMatch(/width:\s*max-content/);
    }
  });

  it("no row clips or ellipsizes its own text", () => {
    const html = renderToStaticMarkup(
      <Bounded>
        <JsonTree value={WIDE_DOCUMENT} />
      </Bounded>,
    );
    for (const row of rowStyles(html)) {
      expect(row).not.toMatch(/overflow:\s*hidden/);
      expect(row).not.toMatch(/text-overflow/);
    }
  });

  it("draws the widest row's glyphs in full at that measure — nothing cut", () => {
    const html = renderToStaticMarkup(
      <Bounded>
        <JsonTree value={WIDE_DOCUMENT} />
      </Bounded>,
    );
    expect(html.split(WIDE_VALUE).length - 1).toBe(3);
    expect(html).not.toContain("…");
  });

  it("holds the same way through the detail renderer the island mounts", () => {
    const html = renderToStaticMarkup(
      <Bounded>
        <JsonArtifactDetail {...props(textContent(JSON.stringify(WIDE_DOCUMENT)))} />
      </Bounded>,
    );
    const root = rowContainerStyle(html);
    expect(root).toMatch(/overflow-x:\s*auto/);
    expect(root).toMatch(/min-width:\s*0/);
    expect(root).toMatch(/max-width:\s*100%/);
    for (const row of rowStyles(html)) expect(row).toMatch(/width:\s*max-content/);
    expect(html).toContain(WIDE_VALUE);
  });
});
