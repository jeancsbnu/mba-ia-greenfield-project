import type { Page } from "@playwright/test"

import { expect, login, test } from "./fixtures"

// SI-07.9 — retrofit responsivo das telas antigas, que não têm frame mobile.
// O layout a 375px é derivado das regras de home-busca/TD-08; o que se observa
// aqui é o que a regra promete: nada rola na horizontal, a tabela rola dentro
// do próprio contêiner, a grade do canal vai de 1 a 4 colunas e as sugestões
// da watch page descem para baixo do player.
const MOBILE = { width: 375, height: 812 }
const DESKTOP = { width: 1024, height: 900 }

async function pageScrollsHorizontally(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  )
}

async function distinctColumns(page: Page, selector: string): Promise<number> {
  const xs = await page
    .locator(selector)
    .evaluateAll((items) =>
      items.map((item) => Math.round(item.getBoundingClientRect().x))
    )
  return new Set(xs).size
}

test.describe("responsive-retrofit", () => {
  test("telas-publicas-sem-rolagem-horizontal-a-375px", async ({ page }) => {
    await page.setViewportSize(MOBILE)

    for (const route of [
      "/@joana_cria",
      "/videos/watch-video",
      "/login",
      "/signup",
      "/terms",
      "/privacy",
    ]) {
      await page.goto(route)
      await expect(page.locator("body")).toBeVisible()
      expect(await pageScrollsHorizontally(page), route).toBe(false)
    }
  })

  test("telas-autenticadas-sem-rolagem-horizontal-a-375px", async ({ page }) => {
    await login(page, "user@example.com")
    await page.setViewportSize(MOBILE)

    for (const route of ["/upload", "/channel/videos"]) {
      await page.goto(route)
      await expect(page.locator("body")).toBeVisible()
      expect(await pageScrollsHorizontally(page), route).toBe(false)
    }
  })

  test("tabela-do-painel-rola-no-proprio-conteiner", async ({ page }) => {
    await login(page, "user@example.com")
    await page.setViewportSize(MOBILE)
    await page.goto("/channel/videos")

    const table = page.locator("[data-slot='video-table']")
    await expect(table).toBeVisible()
    const overflows = await table.evaluate(
      (element) => element.scrollWidth > element.clientWidth
    )
    expect(overflows).toBe(true)
    expect(await pageScrollsHorizontally(page)).toBe(false)
  })

  test("grade-do-canal-de-1-a-4-colunas", async ({ page }) => {
    const cards = "[data-slot='video-card']"

    await page.setViewportSize(MOBILE)
    await page.goto("/@joana_cria")
    await expect(page.locator(cards).first()).toBeVisible()
    expect(await distinctColumns(page, cards)).toBe(1)

    await page.setViewportSize(DESKTOP)
    await expect.poll(() => distinctColumns(page, cards)).toBe(4)
  })

  test("sugestoes-abaixo-do-player-no-mobile-e-ao-lado-no-desktop", async ({
    page,
  }) => {
    const player = page.locator("[data-slot='video-player']")
    const sidebar = page.locator("aside")

    await page.setViewportSize(MOBILE)
    await page.goto("/videos/watch-video")
    await expect(player).toBeVisible()
    const playerBox = await player.boundingBox()
    const sidebarBox = await sidebar.boundingBox()
    expect(sidebarBox!.y).toBeGreaterThanOrEqual(
      playerBox!.y + playerBox!.height
    )

    await page.setViewportSize(DESKTOP)
    await expect
      .poll(async () => {
        const [p, s] = await Promise.all([
          player.boundingBox(),
          sidebar.boundingBox(),
        ])
        return s!.x >= p!.x + p!.width && s!.y < p!.y + p!.height
      })
      .toBe(true)
  })
})
