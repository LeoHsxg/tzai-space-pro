import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    // 一般單元測試;rules 整合測試由 test:rules script 另外指定
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
