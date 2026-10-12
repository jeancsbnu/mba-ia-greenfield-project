import type { Page } from "@playwright/test"

import { expect, login, test, waitForHydration } from "./fixtures"

// Spec: next-frontend/specs/resultados-da-busca.plan.md (SI-07.11b)
// Catálogo buildFeedCatalog() do SI-07.4: q=docker casa 13 vídeos — 10 do
// canal Docker Brasil (pelo canal) e 3 de Tech com Nina (pelo título). A
// página 1 vai de "Vídeo 2" a "Vídeo 26"; a página 2 tem só "Vídeo 29".
// q=erro-upstream faz o upstream responder 500.

const cards = (page: Page) => page.locator("[data-slot='video-card']")

const cardTitles = (page: Page) =>
  cards(page).getByRole("heading", { level: 3 })

const searchbox = (page: Page) =>
  page.getByRole("banner").getByRole("searchbox")

const hydrated = (page: Page) =>
  waitForHydration(page, "[data-slot='site-navbar'] input[name='q']")

test.describe("resultados-da-busca", () => {
  // 1. Busca, termo e paginação

  test("1.1 busca-mostra-resultados-por-titulo-e-canal", async ({ page }) => {
    await login(page, "user@example.com")
    await page.goto("/")
    await hydrated(page)

    await searchbox(page).fill("docker")
    await page
      .getByRole("banner")
      .getByRole("button", { name: "Buscar" })
      .click()

    await expect(page).toHaveURL(/\/results\?q=docker$/)
    await expect(
      page.getByRole("heading", { level: 1, name: "Resultados para “docker”" })
    ).toBeVisible()
    await expect(page.getByText("13 vídeos", { exact: true })).toBeVisible()
    await expect(cards(page)).toHaveCount(12)
    await expect(cardTitles(page).nth(0)).toHaveText("Vídeo 2")
    await expect(cardTitles(page).nth(1)).toHaveText("Docker na prática")

    // Casou só pelo canal e entra como card comum.
    await expect(
      cards(page).first().getByRole("link", { name: "Docker Brasil" })
    ).toBeVisible()

    await expect(searchbox(page)).toHaveValue("docker")
    await expect(
      page
        .getByRole("navigation", { name: "Navegação principal" })
        .locator("[aria-current='page']")
    ).toHaveCount(0)
  })

  test("1.2 termo-curto-mostra-aviso", async ({ page }) => {
    await page.goto("/results?q=ab")

    await expect(
      page.getByText("Digite pelo menos 3 caracteres para buscar.")
    ).toBeVisible()
    await expect(page.locator("[data-slot='results-heading']")).toHaveCount(0)
    await expect(cards(page)).toHaveCount(0)
    await expect(
      page.getByRole("navigation", { name: "pagination" })
    ).toHaveCount(0)

    await hydrated(page)
    await searchbox(page).fill("ab")
    await page
      .getByRole("banner")
      .getByRole("button", { name: "Buscar" })
      .click()

    // O minLength do campo barra o envio no navegador.
    await expect
      .poll(() =>
        searchbox(page).evaluate(
          (input) => (input as HTMLInputElement).validity.tooShort
        )
      )
      .toBe(true)
    await expect(page).toHaveURL(/\/results\?q=ab$/)
  })

  test("1.3 sem-termo-redireciona-para-a-home", async ({ page }) => {
    await page.goto("/results")
    await expect(page).toHaveURL(/localhost:\d+\/$/)

    await page.goto("/results?q=%20%20")
    await expect(page).toHaveURL(/localhost:\d+\/$/)
  })

  test("1.4 paginacao-preserva-o-termo", async ({ page }) => {
    await page.goto("/results?q=docker")
    await hydrated(page)

    const pageTwo = page
      .getByRole("navigation", { name: "pagination" })
      .getByRole("link", { name: "2", exact: true })
    await expect(pageTwo).toHaveAttribute("href", "/results?q=docker&page=2")

    await pageTwo.click()

    await expect(page).toHaveURL(/\/results\?q=docker&page=2$/)
    await expect(cardTitles(page)).toHaveText(["Vídeo 29"])
    await expect(
      page.getByRole("heading", { level: 1, name: "Resultados para “docker”" })
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Ir para a próxima página" })
    ).toHaveAttribute("aria-disabled", "true")
  })

  test("1.5 erro-do-upstream-mostra-tentar-novamente", async ({ page }) => {
    await page.goto("/results?q=erro-upstream")

    await expect(
      page.getByRole("heading", { name: "Não foi possível carregar os vídeos" })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Tentar novamente" })
    ).toBeVisible()
    await expect(page.locator("[data-slot='site-navbar']")).toBeVisible()
  })
})
