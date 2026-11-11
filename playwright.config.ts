import { defineConfig, devices } from "@playwright/test";

try { process.loadEnvFile(); } catch {}

const PUERTO = 3101;

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/preparar-bd.ts",
  workers: 1,
  use: { baseURL: `http://localhost:${PUERTO}`, locale: "es-MX", timezoneId: "America/Monterrey" },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
    { name: "celular", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `next dev -p ${PUERTO}`,
    url: `http://localhost:${PUERTO}/login`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { DATABASE_URL: process.env.DATABASE_URL_TEST!, NEXT_DIST_DIR: ".next-e2e" },
  },
});
