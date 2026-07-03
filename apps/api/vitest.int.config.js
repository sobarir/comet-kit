"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const unplugin_swc_1 = __importDefault(require("unplugin-swc"));
const config_1 = require("vitest/config");
/** Integration tests - require a reachable DATABASE_URL. Run: bun run test:int */
exports.default = (0, config_1.defineConfig)({
    test: {
        globals: true,
        environment: "node",
        include: ["src/**/*.int.spec.ts"],
    },
    plugins: [unplugin_swc_1.default.vite({ module: { type: "es6" } })],
});
//# sourceMappingURL=vitest.int.config.js.map