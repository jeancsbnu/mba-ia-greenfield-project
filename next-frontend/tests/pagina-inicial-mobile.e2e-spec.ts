import type { Page } from "@playwright/test"

import { expect, login, test, waitForHydration } from "./fixtures"

// Spec: next-frontend/specs/pagina-inicial-mobile.plan.md (SI-07.13b)
// A home a 375px: barra fechada (marca + "Buscar" + "Abrir menu"), faixa de
// chips rolável, grade em coluna única e paginação centralizada. A troca é só
// CSS (home-busca/TD-08).
const MOBILE = { width: 375, height: 812 }

const banner = (page: Page) => page.getByRole("banner")

const hydrated = (page: Page) =>
  waitForHydration(page, "[data-slot='navbar-actions'] button")

test.describe("pagina-inicial-mobile", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE)
  })

  // 1. Barra fechada e layout em coluna

  test("1.1 barra-fechada-sem-sessao-visivel", async ({ page }) => {
    await page.goto("/")

    await expect(banner(page).getByRole("link", { name: "StreamTube" })).toBeVisible()
    await expect(banner(page).getByRole("button", { name: "Buscar" })).toBeVisible()
    await expect(banner(page).getByRole("button", { name: "Abrir menu" })).toBeVisible()
    await expect(banner(page).getByRole("searchbox")).toBeHidden()
    await expect(banner(page).getByRole("link", { name: "Início" })).toBeHidden()
    await expect(banner(page).getByRole("link", { name: "Entrar" })).toBeHidden()

    await login(page, "user@example.com")
    await page.goto("/")

    await expect(banner(page).getByRole("button", { name: "Buscar" })).toBeVisible()
    await expect(banner(page).getByRole("button", { name: "Abrir menu" })).toBeVisible()
    await expect(banner(page).getByRole("link", { name: "Seu canal" })).toBeHidden()
    await expect(banner(page).getByRole("button", { name: "Sair" })).toBeHidden()
  })

  test("1.2 botao-de-busca-expande-e-foca", async ({ page }) => {
    await page.goto("/")
    await hydrated(page)

    const toggle = banner(page).getByRole("button", { name: "Buscar" })
    await toggle.click()

    await expect(toggle).toHaveAttribute("aria-expanded", "true")
    const searchbox = banner(page).getByRole("searchbox")
    await expect(searchbox).toBeVisible()
    await expect(searchbox).toBeFocused()
  })

  test("1.3 botao-de-menu-abre-o-sheet", async ({ page }) => {
    await page.goto("/")
    await hydrated(page)

    const menuButton = banner(page).getByRole("button", { name: "Abrir menu" })
    await menuButton.click()

    await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible()
    // Com o diálogo aberto o Radix esconde o resto da árvore dos leitores de
    // tela (aria-hidden), então o botão sai da consulta por papel.
    await expect(
      page.locator("[data-slot='navbar-actions'] [aria-label='Abrir menu']")
    ).toHaveAttribute("aria-expanded", "true")
  })

  test("1.4 chips-rolam-e-grade-em-coluna-unica", async ({ page }) => {
    await page.goto("/")

    const chips = page.getByRole("navigation", { name: "Categorias" })
    await expect(chips).toBeVisible()
    expect(
      await chips.evaluate((element) => element.scrollWidth > element.clientWidth)
    ).toBe(true)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      )
    ).toBe(false)

    const grid = page.locator("[data-slot='video-grid']")
    const boxes = await page
      .locator("[data-slot='video-card']")
      .evaluateAll((cards) =>
        cards.map((card) => {
          const rect = card.getBoundingClientRect()
          return { x: Math.round(rect.x), width: Math.round(rect.width) }
        })
      )
    const gridWidth = Math.round((await grid.boundingBox())!.width)
    expect(new Set(boxes.map((box) => box.x)).size).toBe(1)
    for (const box of boxes) {
      expect(box.width).toBe(gridWidth)
    }

    const pagination = page.getByRole("navigation", { name: "pagination" })
    const list = pagination.locator("[data-slot='pagination-content']")
    const listBox = (await list.boundingBox())!
    const navBox = (await pagination.boundingBox())!
    const listCenter = listBox.x + listBox.width / 2
    const navCenter = navBox.x + navBox.width / 2
    expect(Math.abs(listCenter - navCenter)).toBeLessThanOrEqual(2)
  })
})
