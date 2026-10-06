import type { Page } from "@playwright/test"

import { expect, login, test } from "./fixtures"

// Spec: next-frontend/specs/channel-public-subscription.plan.md (SI-06.23b)
//
// Upstream fingido server-side pelo MSW do instrumentation.ts — nada de
// page.route() sobre /api/**. Triggers por nickname em mocks/factories/social.ts.
const SOCIAL_CHANNEL = "maria_rocha"
const FOLLOWED_CHANNEL = "canal_seguido"

function header(page: Page) {
  return page.locator("[data-slot='channel-header']")
}

function countRequests(page: Page, fragment: string): () => number {
  let count = 0
  page.on("request", (request) => {
    if (request.url().includes(fragment)) count += 1
  })
  return () => count
}

/**
 * Espera a hidratação antes do clique: antes dela o botão não responde, e o
 * clique se repete até a troca de rótulo aparecer. Cada tentativa confere
 * primeiro se a troca já aconteceu — sob carga, o rótulo pode virar depois do
 * prazo curto da tentativa, e clicar de novo desfaria a inscrição.
 */
async function clickWhenHydrated(
  page: Page,
  from: string,
  to: string
): Promise<void> {
  const target = header(page).getByRole("button", { name: to })
  await expect(async () => {
    if (await target.isVisible()) return
    await header(page)
      .getByRole("button", { name: from })
      .click({ timeout: 2000 })
    await expect(target).toBeVisible({ timeout: 2000 })
  }).toPass({ timeout: 20_000 })
}

test.describe("channel-public-subscription", () => {
  // 1. Contagem e inscrição

  test("1.1 anonimo-ve-contagem-e-botao", async ({ page }) => {
    await page.goto(`/@${SOCIAL_CHANNEL}`)

    await expect(header(page)).toContainText(
      "@maria_rocha · 1,2 mil inscritos · "
    )
    await expect(
      header(page).getByRole("button", { name: "Inscrever-se" })
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible()
  })

  test("1.2 inscrito-ve-inscrito-na-primeira-pintura", async ({ page }) => {
    await login(page, "user@example.com")

    const response = await page.request.get(`/@${FOLLOWED_CHANNEL}`)
    const html = await response.text()
    const buttonTag = html.match(
      /<button[^>]*data-slot="subscribe-button"[^>]*>/
    )?.[0]
    expect(buttonTag).toContain('aria-pressed="true"')

    await page.goto(`/@${FOLLOWED_CHANNEL}`)
    await expect(
      header(page).getByRole("button", { name: "Inscrito" })
    ).toBeVisible()
    await expect(page.getByRole("button", { name: "Sair" })).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Canais seguidos" })
    ).toBeVisible()
  })

  test("1.3 inscrever-atualiza-no-mesmo-instante", async ({ page }) => {
    await login(page, "user@example.com")
    await page.goto(`/@${SOCIAL_CHANNEL}`)
    const count = header(page).locator("[data-slot='subscriber-count']")
    await expect(count).toHaveText("1,2 mil inscritos")

    const response = page.waitForResponse(
      (r) =>
        r.url().includes(`/api/channels/${SOCIAL_CHANNEL}/subscription`) &&
        r.request().method() === "PUT"
    )
    await clickWhenHydrated(page, "Inscrever-se", "Inscrito")

    expect((await response).status()).toBe(200)
    await expect(
      header(page).getByRole("button", { name: "Inscrito" })
    ).toHaveAttribute("aria-pressed", "true")
    // 1200 + 1 continua "1,2 mil" na forma abreviada pt-BR.
    await expect(count).toHaveText("1,2 mil inscritos")
  })

  // 2. Visitante anônimo e canal inexistente

  test("2.1 anonimo-vai-ao-login-e-volta", async ({ page }) => {
    const subscriptionRequests = countRequests(
      page,
      `/api/channels/${SOCIAL_CHANNEL}/subscription`
    )
    await page.goto(`/@${SOCIAL_CHANNEL}`)

    // Mesmo cuidado do helper: se o clique anterior já navegou (a compilação
    // de /login no dev pode passar do prazo da tentativa), não clicar de novo.
    await expect(async () => {
      if (page.url().includes("/login")) return
      await header(page)
        .getByRole("button", { name: "Inscrever-se" })
        .click({ timeout: 2000 })
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
    }).toPass({ timeout: 30_000 })

    await expect(page).toHaveURL("/login?returnTo=%2F%40maria_rocha")
    expect(subscriptionRequests()).toBe(0)

    await page.getByLabel("E-mail").fill("user@example.com")
    await page.getByLabel("Senha", { exact: true }).fill("secret123")
    await page.getByRole("button", { name: "Entrar" }).click()

    await expect(page).toHaveURL(`/@${SOCIAL_CHANNEL}`)
    await expect(page.getByRole("button", { name: "Sair" })).toBeVisible()
  })

  test("2.2 canal-inexistente", async ({ page }) => {
    await page.goto("/@nao_existe")

    await expect(
      page.getByRole("heading", { name: "Canal não encontrado" })
    ).toBeVisible()
    await expect(page.locator("[data-slot='subscribe-button']")).toHaveCount(0)
  })
})
