import { expect, login, test } from "./fixtures"

// O dono não se inscreve no próprio canal (a API recusa com 409
// CANNOT_SUBSCRIBE_OWN_CHANNEL): no lugar de "Inscrever-se" ele vê o atalho de
// edição. Upstream fingido pelo MSW — toda sessão, menos a do canal vazio, é
// dona do joana_cria, e "trigger-own-video" é um vídeo do canal de quem pede.
test.describe("own-channel", () => {
  test("1.1 dono-ve-editar-canal-no-proprio-canal", async ({ page }) => {
    await login(page, "user@example.com")
    await page.goto("/@joana_cria")

    const header = page.locator("[data-slot='channel-header']")
    await expect(
      header.getByRole("link", { name: "Editar canal" })
    ).toHaveAttribute("href", "/channel/settings")
    await expect(
      header.getByRole("button", { name: /inscrever-se|inscrito/i })
    ).toHaveCount(0)
  })

  test("1.2 visitante-ve-inscrever-se", async ({ page }) => {
    await page.goto("/@joana_cria")

    const header = page.locator("[data-slot='channel-header']")
    await expect(
      header.getByRole("button", { name: "Inscrever-se" })
    ).toBeVisible()
    await expect(header.getByRole("link", { name: "Editar canal" })).toHaveCount(0)
  })

  test("1.3 dono-ve-editar-video-no-proprio-video", async ({ page }) => {
    await login(page, "user@example.com")
    await page.goto("/videos/trigger-own-video")

    await expect(
      page.getByRole("link", { name: "Editar vídeo" })
    ).toHaveAttribute("href", "/videos/trigger-own-video/edit")
    await expect(
      page.getByRole("button", { name: /inscrever-se|inscrito/i })
    ).toHaveCount(0)
  })
})
