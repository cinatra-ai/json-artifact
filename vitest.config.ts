import { defineConfig } from "vitest/config";

// The renderer is exercised without a browser: pure model logic runs in Node,
// and the React components are checked via `react-dom/server` static markup, so
// no jsdom/DOM environment is needed. esbuild's automatic JSX transform handles
// the .tsx sources (jsxImportSource defaults to the shared React).
export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
