import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.spec.ts"],
    exclude: ["**/*.int.spec.ts", "**/node_modules/**"],
  },
  plugins: [
    // SWC keeps NestJS decorator metadata working under Vitest.
    // Module type must be es6 — Vitest 3 cannot be require()d from CJS output.
    swc.vite({ module: { type: "es6" } }),
  ],
});
