import { defineConfig } from "vitest/config";

/**
 * Firestore security rules 整合測試專用設定。
 * 需在 Firestore emulator 環境下執行:npm run test:rules
 * (透過 firebase emulators:exec 啟動 emulator 後執行)
 */
export default defineConfig({
  test: {
    include: ["tests/rules/**/*.test.ts"],
    environment: "node",
    testTimeout: 15000,
    hookTimeout: 30000,
  },
});
