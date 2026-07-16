# JSON

A collapsible, pretty-printed viewer for JSON documents. Agent-run structured outputs and object-content snapshots arrive as `application/json`, and this renderer gives them a first-class home: an expandable tree with type-colored values, child counts on collapsed nodes, and a raw-bytes fallback whenever the content is not valid JSON — so the panel is never blank.

Install from the Cinatra marketplace by searching for "JSON" and clicking **Add**. No credentials or configuration are required; the renderer is active immediately for every artifact whose content type is `application/json`. Open any such artifact to see its detail view rendered as a tree — click a node to expand or collapse it — or see a one-line structural summary wherever an inline preview appears. If the bytes cannot be parsed as JSON, the exact content is shown verbatim with a short diagnostic instead of failing.

## Works with

- Cinatra artifacts — any library item whose content type is `application/json`

## Capabilities

- Browse a JSON document as an expand/collapse tree instead of a flat blob
- Read type-colored strings, numbers, booleans, and nulls at a glance
- Scan large documents quickly — deep nodes start collapsed with a child count
- Fall back to raw, readable bytes when the content is not valid JSON
- Preview a document's shape inline as a single structural summary line
