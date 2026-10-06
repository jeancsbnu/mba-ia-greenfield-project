import { defineConfig, devices } from "@playwright/test";

// Local default: 2 workers. Playwright's own default is half the HOST's logical
// cores (4 on an 8-core machine), but the bottleneck is the containerized
// `next dev`, which only gets the CPUs Docker/WSL grants it (3 here). Four
// browsers against it time out on navigation; one is stable but slow. Override
// with PW_WORKERS=<n>.
function localWorkers(): number {
  const parsed = Number(process.env.PW_WORKERS);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 2;
}

// The dev server runs inside Docker (containerized next dev with MSW_ENABLED=true).
// Playwright runs on the HOST — never add a webServer block here.
// Start the server manually: docker compose exec -d next-frontend sh -c "MSW_ENABLED=true npm run dev"
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.e2e-spec.ts",
  // Preflight (server up + MSW registered) and route warm-up before any test.
  globalSetup: "./tests/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : localWorkers(),
  reporter: "html",
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
