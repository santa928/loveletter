import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:4173",
  },
  webServer: {
    command: "npm run build:pages && npm run preview:pages -- --host 0.0.0.0 --port 4173",
    port: 4173,
    reuseExistingServer: false,
  },
});
