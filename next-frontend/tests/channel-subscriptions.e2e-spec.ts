import type { Page } from "@playwright/test"

import { expect, login, test } from "./fixtures"

// Spec: next-frontend/specs/channel-subscriptions.plan.md (SI-06.22b)
//
// Upstream fingido server-side pelo MSW do instrumentation.ts — nada de
// page.route() sobre /api/**. O handler de GET /me/subscriptions distingue o
// usuário pelo token que o mock de login emite para cada e-mail.
const ROUTE = "/channel/subscriptions"

function mariaRow(page: Page) {
  return page
    .locator("[data-slot='subscribed-channel-card']")
    .filter({ hasText: "Maria Rocha" })
}

/**
 * Espera a hidratação antes do clique otimista: o botão só responde depois
 * dela, e o clique se repete até a troca de rótulo aparecer. Cada tentativa
 * confere primeiro se a troca já aconteceu — sob carga, o rótulo pode virar
 * depois do prazo curto da tentativa, e clicar de novo desfaria a ação.
 */
async function clickWhenHydrated(
  page: Page,
  from: string,
  to: string
): Promise<void> {
  const row = mariaRow(page)
  const target = row.getByRole("button", { name: to })
  await expect(async () => {
    if (await target.isVisible()) return
    await row.getByRole("button", { name: from }).click({ timeout: 2000 })
    await expect(target).toBeVisible({ timeout: 2000 })
  }).toPass({ timeout: 20_000 })
}

test.describe("channel-subscriptions", () => {
  // 1. Lista e navegação

  test("1.1 lista-dos-canais-seguidos", async ({ page }) => {
    await login(page, "user@example.com")
    await page.goto("/channel/videos")
    await page.getByRole("link", { name: "Canais seguidos" }).click()

    await expect(page).toHaveURL(ROUTE)
    await expect(
      page.getByRole("link", { name: "Canais seguidos" })
    ).toHaveAttribute("aria-current", "page")
    await expect(
      page.getByRole("heading", { level: 1, name: "Canais que você segue" })
    ).toBeVisible()
    await expect(page.getByText("3 canais")).toBeVisible()

    const rows = page.locator("[data-slot='subscribed-channel-card']")
    await expect(rows).toHaveCount(3)
    await expect(rows.nth(0)).toContainText("Ana Costa")
    await expect(rows.nth(1)).toContainText("Diego Farias")
    await expect(rows.nth(2)).toContainText("Maria Rocha")
    await expect(mariaRow(page)).toContainText("1,2 mil inscritos · 42 vídeos")
    await expect(
      mariaRow(page).getByRole("button", { name: "Inscrito" })
    ).toBeVisible()
  })

  test("1.2 nome-leva-a-pagina-do-canal", async ({ page }) => {
    await login(page, "user@example.com")
    await page.goto(ROUTE)

    await page.getByRole("link", { name: "Maria Rocha" }).click()

    await expect(page).toHaveURL("/@maria_rocha")
    await expect(page.locator("[data-slot='channel-header']")).toBeVisible()
  })

  // 2. Deixar de seguir

  test("2.1 desinscrever-mantem-a-linha", async ({ page }) => {
    await login(page, "user@example.com")
    await page.goto(ROUTE)
    const row = mariaRow(page)
    await expect(row.locator("[data-slot='subscriber-count']")).toHaveText(
      "1,2 mil inscritos"
    )

    const response = page.waitForResponse(
      (r) =>
        r.url().includes("/api/channels/maria_rocha/subscription") &&
        r.request().method() === "DELETE"
    )
    await clickWhenHydrated(page, "Inscrito", "Inscrever-se")

    // 1200 − 1 continua "1,2 mil" na forma abreviada; a queda aparece no
    // aria-pressed e no rótulo, e a linha fica na lista.
    await expect(
      row.getByRole("button", { name: "Inscrever-se" })
    ).toHaveAttribute("aria-pressed", "false")
    await expect(
      page.locator("[data-slot='subscribed-channel-card']")
    ).toHaveCount(3)
    await expect(page.getByText("3 canais")).toBeVisible()

    expect((await response).status()).toBe(200)
    await expect(
      row.getByRole("button", { name: "Inscrever-se" })
    ).toBeVisible()
    await expect(
      page.locator("[data-slot='subscribed-channel-card']")
    ).toHaveCount(3)
  })

  test("2.2 segundo-clique-desfaz", async ({ page }) => {
    await login(page, "user@example.com")
    await page.goto(ROUTE)
    const row = mariaRow(page)

    const deleted = page.waitForResponse(
      (r) =>
        r.url().includes("/api/channels/maria_rocha/subscription") &&
        r.request().method() === "DELETE"
    )
    await clickWhenHydrated(page, "Inscrito", "Inscrever-se")
    await deleted

    const put = page.waitForRequest(
      (r) =>
        r.url().includes("/api/channels/maria_rocha/subscription") &&
        r.method() === "PUT"
    )
    await row.getByRole("button", { name: "Inscrever-se" }).click()
    await put

    await expect(row.getByRole("button", { name: "Inscrito" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    await expect(row.locator("[data-slot='subscriber-count']")).toHaveText(
      "1,2 mil inscritos"
    )
  })

  // 3. Estados de acesso e vazio

  test("3.1 usuario-sem-inscricoes", async ({ page }) => {
    await login(page, "no-subscriptions@example.com")
    await page.goto(ROUTE)

    await expect(page.getByText("0 canais")).toBeVisible()
    await expect(
      page.locator("[data-slot='subscriptions-empty']")
    ).toBeVisible()
    await expect(
      page.locator("[data-slot='subscribed-channel-card']")
    ).toHaveCount(0)
  })

  test("3.2 sem-sessao-vai-ao-login", async ({ page }) => {
    await page.goto(ROUTE)

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText("Canais que você segue")).toHaveCount(0)
  })
})
