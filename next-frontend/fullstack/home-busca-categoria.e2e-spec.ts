import { expect, test } from "@playwright/test"

import { createConfirmedAccount, publishVideo, uniqueSuffix } from "./helpers"

// Fluxo 5 (testes-producao/TD-01): o vídeo publicado aparece na home, na busca
// pelo título e no filtro da sua categoria, servidos pela API real.
test.describe("home-busca-categoria", () => {
  test("o vídeo publicado é encontrado na home, na busca e na categoria", async ({
    page,
    request,
  }) => {
    const owner = await createConfirmedAccount(request, "vitrine")
    const title = `Vitrine ${uniqueSuffix()}`
    await publishVideo(request, owner, title, "Esportes")

    const cardTitle = (scope = page) =>
      scope
        .locator("[data-slot='video-card']")
        .getByRole("heading", { level: 3, name: title })

    await page.goto("/")
    await expect(cardTitle()).toBeVisible()

    // O thumbnail vem do storage por URL assinada e precisa carregar de verdade
    // (no MSW ele é um arquivo local, então só esta suíte pega a quebra).
    const card = page
      .locator("[data-slot='video-card']")
      .filter({ has: cardTitle() })
    await expect
      .poll(() =>
        card.locator("img").first().evaluate((img) => (img as HTMLImageElement).naturalWidth)
      )
      .toBeGreaterThan(0)

    const banner = page.getByRole("banner")
    await banner.getByRole("searchbox").fill(title)
    await banner.getByRole("button", { name: "Buscar" }).click()
    await expect(page).toHaveURL(/\/results\?q=/)
    await expect(cardTitle()).toBeVisible()

    await page.goto("/")
    await page
      .getByRole("navigation", { name: "Categorias" })
      .getByRole("link", { name: "Esportes" })
      .click()
    await expect(page).toHaveURL(/category=Esportes/)
    await expect(cardTitle()).toBeVisible()
  })
})
