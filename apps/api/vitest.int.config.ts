import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

/** Integration tests - require a reachable DATABASE_URL. Run: bun run test:int */
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.int.spec.ts"],
  },
  plugins: [swc.vite({ module: { type: "es6" } })],
});
