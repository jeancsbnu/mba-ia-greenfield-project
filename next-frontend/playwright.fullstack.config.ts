import { defineConfig, devices } from "@playwright/test"

import { APP_URL } from "./fullstack/stack"

// Suíte full-stack (testes-producao/TD-01, Option A): Playwright contra a stack
// REAL — compose.prod.yaml da raiz, num projeto Compose próprio que o
// globalSetup sobe zerado e o globalTeardown derruba com os volumes. Não usa o
// MSW nem o dev server: é distinta da suíte de `tests/` (playwright.config.ts),
// que continua sem enxergar estes arquivos.
//
// Roda no HOST: `npm run test:fullstack`.
export default defineConfig({
  testDir: "./fullstack",
  testMatch: "**/*.e2e-spec.ts",
  globalSetup: "./fullstack/global-setup.ts",
  globalTeardown: "./fullstack/global-teardown.ts",
  // As jornadas compartilham uma stack só (worker, fila, storage).
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // Upload + processamento no worker cabem com folga em 2 min.
  timeout: 120_000,
  expect: { timeout: 10_000 },
  reporter: [["html", { outputFolder: "playwright-report-fullstack" }]],
  outputDir: "test-results-fullstack",
  use: {
    baseURL: APP_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chrome",
      // Google Chrome, não o Chromium do Playwright: o Chromium não decodifica
      // H.264/AAC, e a jornada de assistir precisa que o vídeo toque de verdade
      // para a view ser contada. Na CI: `npx playwright install chrome`.
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
})
