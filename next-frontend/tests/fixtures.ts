import { test as base, expect, type Page } from "@playwright/test";

type NetworkFixtures = {
  network: void;
};

// MSW runs server-side in the containerized Next.js dev server via
// instrumentation.ts (MSW_ENABLED=true). This fixture is auto-applied to
// every E2E test to document that contract. Rules:
//   - Do NOT page.route() /api/** — it short-circuits real Route Handlers.
//   - Do NOT reach the real NestJS API — upstream is faked by mocks/ handlers.
//   - Per-scenario outcomes use reserved trigger fixtures in shared handlers
//     (e.g. "conflict@example.com" → 409); no per-test server.use() here.
export const test = base.extend<NetworkFixtures>({
  network: [async ({}, use) => { await use(); }, { auto: true }],
});

export { expect };

/**
 * Autentica pela UI real de /login e devolve com a sessão selada.
 *
 * O formulário de login NÃO navega: no sucesso ele chama `router.refresh()`
 * para o chrome do servidor refletir a sessão (phase-02-auth-frontend/TD-06).
 * Por isso a espera é pela resposta 200 do BFF, não por mudança de URL.
 */
export async function login(page: Page, email: string): Promise<void> {
  await page.goto("/login");

  const response = page.waitForResponse(
    (r) => r.url().includes("/api/auth/login") && r.request().method() === "POST"
  );

  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("secret123");
  await page.getByRole("button", { name: "Entrar" }).click();

  expect((await response).status()).toBe(200);
}
