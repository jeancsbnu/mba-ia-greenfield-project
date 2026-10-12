import { expect, test, waitForHydration } from "./fixtures"

// Spec: next-frontend/specs/resultados-da-busca-sem-resultados.plan.md (SI-07.12b)
// Nenhum título, canal ou nickname do catálogo buildFeedCatalog() contém
// "xyzabc", então q=xyzabc responde { items: [], total: 0 }.
test.describe("resultados-da-busca-sem-resultados", () => {
  // 1. Estado vazio

  test("1.1 termo-sem-resultados-mostra-estado-vazio", async ({ page }) => {
    await page.goto("/")
    await waitForHydration(page, "[data-slot='site-navbar'] input[name='q']")

    const banner = page.getByRole("banner")
    await banner.getByRole("searchbox").fill("xyzabc")
    await banner.getByRole("button", { name: "Buscar" }).click()

    await expect(page).toHaveURL(/\/results\?q=xyzabc$/)
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Nenhum vídeo encontrado para “xyzabc”",
      })
    ).toBeVisible()
    await expect(
      page.getByText(
        "Confira a ortografia ou tente termos mais gerais, como o nome do canal."
      )
    ).toBeVisible()
    await expect(page.getByText(/^\d+ vídeos?$/)).toHaveCount(0)
    await expect(page.locator("[data-slot='video-grid']")).toHaveCount(0)
    await expect(
      page.getByRole("navigation", { name: "pagination" })
    ).toHaveCount(0)
  })

  test("1.2 voltar-para-o-inicio", async ({ page }) => {
    await page.goto("/results?q=xyzabc")
    await waitForHydration(page, "[data-slot='search-empty-state'] a")

    await page.getByRole("link", { name: "Voltar para o início" }).click()

    await expect(page).toHaveURL(/localhost:\d+\/$/)
    await expect(page.locator("[data-slot='video-card']")).toHaveCount(12)
  })

  test("1.3 termo-com-html-aparece-literal", async ({ page }) => {
    await page.goto("/results?q=%3Cb%3Exyz%3C%2Fb%3E")

    const title = page.getByRole("heading", { level: 1 })
    await expect(title).toHaveText("Nenhum vídeo encontrado para “<b>xyz</b>”")
    await expect(page.locator("[data-slot='search-empty-state'] b")).toHaveCount(0)
  })
})
