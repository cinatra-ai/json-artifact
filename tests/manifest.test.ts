import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { jsonArtifactManifest } from "../src/index";

const pkgUrl = new URL("../package.json", import.meta.url);
const pkg = JSON.parse(readFileSync(pkgUrl, "utf8")) as {
  name: string;
  cinatra: {
    apiVersion: string;
    kind: string;
    displayName: string;
    vendor: { key: string; name: string };
    dependencies: unknown[];
    artifact: {
      accepts: { file: { mimeTypes: string[] } };
      ui: {
        abiVersion: number;
        sdkAbiRange: string;
        renderers: Record<string, { entry: string; propsApiVersion: number; representations: string[] }>;
      };
      objectTypes: Array<{
        type: string;
        claim: string;
        dispositions: Record<string, unknown>;
        schema: Record<string, unknown>;
      }>;
    };
  };
};

describe("package.json cinatra manifest", () => {
  it("is a first-party artifact renderer with the expected identity", () => {
    expect(pkg.name).toBe("@cinatra-ai/json-artifact");
    expect(pkg.cinatra.kind).toBe("artifact");
    expect(pkg.cinatra.apiVersion).toBe("cinatra.ai/v1");
    expect(pkg.cinatra.displayName).toBe("JSON");
    expect(pkg.cinatra.vendor).toEqual({ key: "cinatra-ai", name: "Cinatra" });
    expect(pkg.cinatra.dependencies).toEqual([]);
  });

  it("claims EXACTLY application/json and nothing else", () => {
    expect(pkg.cinatra.artifact.accepts).toEqual({ file: { mimeTypes: ["application/json"] } });
    // Every MIME token anywhere in the descriptor must be application/json.
    const claimed = new Set<string>();
    for (const m of pkg.cinatra.artifact.accepts.file.mimeTypes) claimed.add(m);
    for (const r of Object.values(pkg.cinatra.artifact.ui.renderers)) {
      for (const m of r.representations) claimed.add(m);
    }
    expect([...claimed]).toEqual(["application/json"]);
  });

  it("declares a v1 ui block with detail + preview renderers built against the host SDK", () => {
    const ui = pkg.cinatra.artifact.ui;
    expect(ui.abiVersion).toBe(1);
    expect(ui.sdkAbiRange).toBe("^2.4.0");
    expect(Object.keys(ui.renderers).sort()).toEqual(["detail", "preview"]);
    for (const [slot, r] of Object.entries(ui.renderers)) {
      expect(r.propsApiVersion, slot).toBe(1);
      expect(r.representations, slot).toEqual(["application/json"]);
      // The entry is a package-relative, path-contained subpath that exists.
      expect(r.entry.startsWith("./"), slot).toBe(true);
      expect(r.entry.includes(".."), slot).toBe(false);
      const abs = fileURLToPath(new URL(`../${r.entry.slice(2)}`, import.meta.url));
      expect(existsSync(abs), `${slot} entry ${r.entry} exists`).toBe(true);
    }
  });

  it("declares exactly one dedicated objectTypes claim for the upload type map", () => {
    const claims = pkg.cinatra.artifact.objectTypes;
    expect(Array.isArray(claims)).toBe(true);
    expect(claims).toHaveLength(1);
    const claim = claims[0];
    expect(claim.type).toBe("@cinatra-ai/json-artifact:artifact");
    expect(claim.claim).toBe("dedicated");
    expect(claim.dispositions).toEqual({
      projection: "artifact-safe",
      pinnable: false,
      snapshotPolicy: "none",
      sensitivity: "normal",
    });
    expect(claim.schema).toEqual({ type: "object" });
  });

  it("keeps the exported typed manifest in lock-step with package.json (no drift)", () => {
    expect(jsonArtifactManifest.accepts).toEqual(pkg.cinatra.artifact.accepts);
    expect(jsonArtifactManifest.ui).toEqual(pkg.cinatra.artifact.ui);
  });
});
