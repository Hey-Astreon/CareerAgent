import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json"],
      include: [
        "src/lib/providers/normalize.ts",
        "src/lib/providers/dedup.ts",
        "src/lib/providers/registry.ts",
        "src/lib/ai/scorer.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
