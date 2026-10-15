import { expect, test } from "./fixtures"

// /terms e /privacy: destino dos links do checkbox de termos do cadastro.
// Páginas estáticas no layout do site, sem dependência do upstream.
test.describe("legal-pages", () => {
  test("1.1 cadastro-abre-os-termos-em-nova-aba", async ({ page, context }) => {
    await page.goto("/signup")
    await page.getByLabel("E-mail").fill("alice@example.com")

    const [terms] = await Promise.all([
      context.waitForEvent("page"),
      page.getByRole("link", { name: "Termos de Uso" }).click(),
    ])
    await terms.waitForLoadState()
    await expect(terms).toHaveURL(/\/terms$/)
    await expect(
      terms.getByRole("heading", { level: 1, name: "Termos de Uso" })
    ).toBeVisible()

    // O formulário de cadastro continua preenchido na aba original.
    await expect(page.getByLabel("E-mail")).toHaveValue("alice@example.com")
  })

  test("1.2 politica-de-privacidade-renderiza", async ({ page }) => {
    await page.goto("/privacy")

    await expect(
      page.getByRole("heading", { level: 1, name: "Política de Privacidade" })
    ).toBeVisible()
    await expect(page.getByRole("banner")).toBeVisible()
    await expect(page).toHaveTitle("Política de Privacidade — StreamTube")
  })
})
