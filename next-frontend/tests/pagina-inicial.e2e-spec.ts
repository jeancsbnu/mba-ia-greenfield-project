import type { Page } from "@playwright/test"

import { expect, test, waitForHydration } from "./fixtures"

// Spec: next-frontend/specs/pagina-inicial.plan.md (SI-07.10b)
// Catálogo buildFeedCatalog() do SI-07.4: 30 vídeos feed-1 … feed-30, do mais
// novo ao mais antigo; Música = feed-1, 8, 15, 22, 29; Outros vazia. Visitante
// anônimo, viewport desktop.

const cards = (page: Page) => page.locator("[data-slot='video-card']")

const cardTitles = (page: Page) =>
  cards(page).getByRole("heading", { level: 3 })

const chips = (page: Page) =>
  page.getByRole("navigation", { name: "Categorias" })

// Um clique num <Link> antes da hidratação se perde sem erro; os chips e os
// títulos são hidratados junto com o resto da árvore.
const hydrated = (page: Page) =>
  waitForHydration(page, "[data-slot='category-chip']")

test.describe("pagina-inicial", () => {
  // 1. Grade, categoria e paginação

  test("1.1 home-mostra-os-12-mais-recentes", async ({ page }) => {
    await page.goto("/")

    await expect(page.getByText("To get started")).toHaveCount(0)
    await expect(cards(page)).toHaveCount(12)
    await expect(cardTitles(page).first()).toHaveText("Música ao vivo")
    await expect(cardTitles(page).last()).toHaveText("Vídeo 12")

    const first = cards(page).first()
    await expect(first.locator("img")).toBeVisible()
    await expect(
      first.locator("[data-slot='video-card-duration']")
    ).toHaveText(/^\d+:\d{2}$/)
    await expect(first.getByText("JC", { exact: true })).toBeVisible()
    await expect(
      first.getByRole("link", { name: "Joana Cria" })
    ).toBeVisible()
    // Tempo relativo ("há 2 horas", "ontem"…): o catálogo tem data fixa.
    await expect(first.getByText(/visualizações · \S/)).toBeVisible()

    await expect(
      chips(page).getByRole("link", { name: "Todos" })
    ).toHaveAttribute("aria-current", "page")

    await hydrated(page)
    await first.getByRole("link", { name: "Música ao vivo" }).click()
    await expect(page).toHaveURL(/\/videos\/feed-1$/)

    await page.goBack()
    await hydrated(page)
    await cards(page).first().getByRole("link", { name: "Joana Cria" }).click()
    await expect(page).toHaveURL(/\/@joana_cria$/)
  })

  test("1.2 categoria-filtra-a-grade", async ({ page }) => {
    await page.goto("/")
    await hydrated(page)
    await chips(page).getByRole("link", { name: "Música" }).click()

    await expect(page).toHaveURL(/\/\?category=M%C3%BAsica$/)
    await expect(cards(page)).toHaveCount(5)
    await expect(cardTitles(page).first()).toHaveText("Música ao vivo")
    await expect(cardTitles(page).last()).toHaveText("Vídeo 29")
    await expect(
      chips(page).getByRole("link", { name: "Música" })
    ).toHaveAttribute("aria-current", "page")
    await expect(
      chips(page).getByRole("link", { name: "Todos" })
    ).not.toHaveAttribute("aria-current")

    await chips(page).getByRole("link", { name: "Todos" }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(cards(page)).toHaveCount(12)
    await expect(cardTitles(page).first()).toHaveText("Música ao vivo")
  })

  test("1.3 pagina-dois-mostra-os-videos-13-a-24", async ({ page }) => {
    await page.goto("/")
    await hydrated(page)
    await page
      .getByRole("navigation", { name: "pagination" })
      .getByRole("link", { name: "2", exact: true })
      .click()

    await expect(page).toHaveURL(/\/\?page=2$/)
    await expect(cardTitles(page).first()).toHaveText("Vídeo 13")
    await expect(cardTitles(page).last()).toHaveText("Vídeo 24")

    await page.goto("/?page=3")

    await expect(cards(page)).toHaveCount(6)
    await expect(cardTitles(page).first()).toHaveText("Vídeo 25")
    await expect(cardTitles(page).last()).toHaveText("Vídeo 30")
    await expect(
      page.getByRole("link", { name: "Ir para a próxima página" })
    ).toHaveAttribute("aria-disabled", "true")
  })

  test("1.4 categoria-fora-do-enum-lista-sem-filtro", async ({ page }) => {
    const response = await page.goto("/?category=Culin%C3%A1ria")

    expect(response?.status()).toBe(200)
    await expect(cards(page)).toHaveCount(12)
    await expect(cardTitles(page).first()).toHaveText("Música ao vivo")
    await expect(
      chips(page).getByRole("link", { name: "Todos" })
    ).toHaveAttribute("aria-current", "page")
  })

  test("1.5 categoria-vazia-mostra-mensagem", async ({ page }) => {
    await page.goto("/?category=Outros")

    await expect(page.getByText("Nenhum vídeo em Outros.")).toBeVisible()
    await expect(cards(page)).toHaveCount(0)
    await expect(
      page.getByRole("link", { name: "Ver todos os vídeos" })
    ).toHaveAttribute("href", "/")
    await expect(
      chips(page).getByRole("link", { name: "Outros" })
    ).toHaveAttribute("aria-current", "page")
  })

  test("1.6 pagina-unica-esconde-paginacao", async ({ page }) => {
    await page.goto("/?category=M%C3%BAsica")

    await expect(cards(page)).toHaveCount(5)
    await expect(
      page.getByRole("navigation", { name: "pagination" })
    ).toHaveCount(0)
  })
})
