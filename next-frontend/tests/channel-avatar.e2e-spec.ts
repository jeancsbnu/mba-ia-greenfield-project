import { expect, login, test } from "./fixtures"

// Foto de perfil do canal. Upstream fingido pelo MSW: só o canal "com_foto"
// tem foto (302 para /next.svg); os demais respondem 404 e ficam nas iniciais.
test.describe("channel-avatar", () => {
  test("1.1 canal-com-foto-mostra-a-imagem", async ({ page }) => {
    await page.goto("/@com_foto")

    const avatar = page
      .locator("[data-slot='channel-header']")
      .locator("[data-slot='avatar-image']")
    await expect(avatar).toBeVisible()
    await expect(avatar).toHaveAttribute("src", "/api/channels/com_foto/avatar")
  })

  test("1.2 canal-sem-foto-fica-nas-iniciais", async ({ page }) => {
    await page.goto("/@joana_cria")

    const header = page.locator("[data-slot='channel-header']")
    await expect(header.locator("[data-slot='avatar-fallback']")).toHaveText("JC")
    await expect(header.locator("[data-slot='avatar-image']")).toHaveCount(0)
  })

  test("1.3 editar-canal-envia-e-remove-a-foto", async ({ page }) => {
    await login(page, "user@example.com")
    await page.goto("/channel/settings")

    const uploader = page.locator("[data-slot='channel-avatar-uploader']")
    const put = page.waitForRequest(
      (r) => r.url().includes("/api/me/channel/avatar") && r.method() === "PUT"
    )
    await uploader.getByLabel("Arquivo da foto do canal").setInputFiles({
      name: "foto.png",
      mimeType: "image/png",
      buffer: Buffer.from("png-bytes"),
    })
    await put
    await expect(uploader.getByRole("alert")).toHaveCount(0)

    const del = page.waitForRequest(
      (r) => r.url().includes("/api/me/channel/avatar") && r.method() === "DELETE"
    )
    await uploader.getByRole("button", { name: "Remover foto" }).click()
    await del
    await expect(uploader.getByRole("alert")).toHaveCount(0)
  })
})
