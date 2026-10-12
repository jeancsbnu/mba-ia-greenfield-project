import type { Page } from "@playwright/test"

import { expect, login, test, waitForHydration } from "./fixtures"

// Spec: next-frontend/specs/menu-de-navegacao-mobile.plan.md (SI-07.15b)
// Com sessão de user@example.com, GET /me/channel devolve o canal "Joana
// Cria" (joana_cria). O sheet é o chrome do mobile (home-busca/TD-07): com
// sessão mostra a identidade, os três links e "Sair"; sem sessão, "Entrar" e
// só Início.
const MOBILE = { width: 375, height: 812 }

const menuButtonSelector =
  "[data-slot='navbar-actions'] [aria-label='Abrir menu']"

async function openMenu(page: Page) {
  await waitForHydration(page, menuButtonSelector)
  await page.getByRole("button", { name: "Abrir menu" }).click()
  const dialog = page.getByRole("dialog", { name: "Menu" })
  await expect(dialog).toBeVisible()
  return dialog
}

test.describe("menu-de-navegacao-mobile", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE)
  })

  // 1. Sheet logado e anônimo

  test("1.1 logado-ve-identidade-links-e-sair", async ({ page }) => {
    await login(page, "user@example.com")
    await page.goto("/")
    const dialog = await openMenu(page)

    await expect(dialog.getByText("Joana Cria", { exact: true })).toBeVisible()
    await expect(dialog.getByText("@joana_cria")).toBeVisible()
    const nav = dialog.getByRole("navigation", { name: "Menu de navegação" })
    await expect(nav.getByRole("link")).toHaveText([
      "Início",
      "Canais seguidos",
      "Meus vídeos",
    ])
    await expect(nav.getByRole("link", { name: "Início" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    await expect(dialog.getByRole("button", { name: "Sair" })).toBeVisible()
  })

  test("1.2 anonimo-ve-entrar-e-so-inicio", async ({ page }) => {
    await page.goto("/")
    const dialog = await openMenu(page)

    await expect(dialog.getByRole("link", { name: "Entrar" })).toHaveAttribute(
      "href",
      "/login"
    )
    const nav = dialog.getByRole("navigation", { name: "Menu de navegação" })
    await expect(nav.getByRole("link")).toHaveText(["Início"])
    await expect(dialog.getByRole("button", { name: "Sair" })).toHaveCount(0)
    await expect(
      dialog.locator("[data-slot='navigation-sheet-user']")
    ).toHaveCount(0)
  })

  test("1.3 identidade-leva-ao-proprio-canal", async ({ page }) => {
    await login(page, "user@example.com")
    await page.goto("/")
    const dialog = await openMenu(page)

    await dialog.getByText("Joana Cria", { exact: true }).click()

    await expect(page).toHaveURL(/\/@joana_cria$/)
    await expect(page.getByRole("dialog", { name: "Menu" })).toHaveCount(0)
  })

  test("1.4 sair-encerra-a-sessao", async ({ page }) => {
    await login(page, "user@example.com")
    await page.goto("/")
    const dialog = await openMenu(page)

    await dialog.getByRole("button", { name: "Sair" }).click()
    await expect(page).toHaveURL(/\/login$/)

    await page.goto("/")
    const anonymous = await openMenu(page)
    await expect(anonymous.getByRole("link", { name: "Entrar" })).toBeVisible()
  })

  test("1.5 fechar-devolve-o-foco", async ({ page }) => {
    await page.goto("/")
    const menuButton = page.locator(menuButtonSelector)

    await openMenu(page)
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog", { name: "Menu" })).toHaveCount(0)
    await expect(menuButton).toBeFocused()

    const dialog = await openMenu(page)
    await dialog.getByRole("button", { name: "Fechar menu" }).click()
    await expect(page.getByRole("dialog", { name: "Menu" })).toHaveCount(0)
    await expect(menuButton).toBeFocused()

    await openMenu(page)
    // O painel ocupa a direita (288px); a faixa à esquerda é o overlay.
    await page.mouse.click(20, 400)
    await expect(page.getByRole("dialog", { name: "Menu" })).toHaveCount(0)
  })
})
