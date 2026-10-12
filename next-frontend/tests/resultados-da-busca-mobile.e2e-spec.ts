import type { Page } from "@playwright/test"

import { expect, test, waitForHydration } from "./fixtures"

// Spec: next-frontend/specs/resultados-da-busca-mobile.plan.md (SI-07.14b)
// Em /results, a 375px, a barra começa com a busca expandida (premissa do
// build: o desenho só mostra esse estado). Catálogo buildFeedCatalog():
// q=docker → 13 vídeos; q=musica → só "Música ao vivo".
const MOBILE = { width: 375, height: 812 }

const banner = (page: Page) => page.getByRole("banner")

const hydrated = (page: Page) =>
  waitForHydration(page, "[data-slot='navbar-actions'] button")

test.describe("resultados-da-busca-mobile", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE)
  })

  // 1. Busca expandida no mobile

  test("1.1 results-abre-com-busca-expandida", async ({ page }) => {
    await page.goto("/results?q=docker")

    await expect(
      banner(page).getByRole("button", { name: "Fechar busca" })
    ).toBeVisible()
    await expect(banner(page).getByRole("searchbox")).toHaveValue("docker")
    await expect(
      banner(page).getByRole("link", { name: "StreamTube" })
    ).toBeHidden()
    await expect(
      banner(page).getByRole("button", { name: "Abrir menu" })
    ).toHaveCount(0)

    await expect(
      page.getByRole("heading", { level: 1, name: "Resultados para “docker”" })
    ).toBeVisible()
    const xs = await page
      .locator("[data-slot='video-card']")
      .evaluateAll((cards) =>
        cards.map((card) => Math.round(card.getBoundingClientRect().x))
      )
    expect(xs.length).toBeGreaterThan(1)
    expect(new Set(xs).size).toBe(1)
  })

  test("1.2 fechar-busca-devolve-a-barra", async ({ page }) => {
    await page.goto("/results?q=docker")
    await hydrated(page)

    await banner(page).getByRole("button", { name: "Fechar busca" }).click()

    await expect(banner(page).getByRole("link", { name: "StreamTube" })).toBeVisible()
    const toggle = banner(page).getByRole("button", { name: "Buscar" })
    await expect(toggle).toBeVisible()
    await expect(
      banner(page).getByRole("button", { name: "Abrir menu" })
    ).toBeVisible()
    await expect(toggle).toBeFocused()
  })

  test("1.3 enviar-termo-novo-pelo-icone", async ({ page }) => {
    await page.goto("/results?q=docker")
    await hydrated(page)

    const searchbox = banner(page).getByRole("searchbox")
    await searchbox.fill("")
    await searchbox.fill("musica")
    await banner(page).getByRole("button", { name: "Buscar" }).click()

    await expect(page).toHaveURL(/\/results\?q=musica$/)
    await expect(
      page.locator("[data-slot='video-card']").getByRole("heading", { level: 3 })
    ).toHaveText(["Música ao vivo"])
  })
})
