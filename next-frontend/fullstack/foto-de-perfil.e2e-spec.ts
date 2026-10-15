import path from "node:path"

import { expect, test } from "@playwright/test"

import { createConfirmedAccount, loginThroughUi } from "./helpers"

const AVATAR = path.join(__dirname, "fixtures", "avatar.png")

// Fluxo 7: a foto enviada em "Editar canal" chega ao MinIO, a API redireciona
// a leitura pública para a URL assinada e a navbar a carrega do storage.
test.describe("foto-de-perfil", () => {
  test("a foto enviada aparece na navbar e some ao ser removida", async ({
    page,
    request,
  }) => {
    const email = await createConfirmedAccount(request, "foto")
    await loginThroughUi(page, email, "/channel/settings")

    const uploader = page.locator("[data-slot='channel-avatar-uploader']")
    const uploaded = page.waitForResponse(
      (r) =>
        r.request().method() === "PUT" &&
        new URL(r.url()).pathname === "/api/me/channel/avatar"
    )
    await uploader.getByLabel("Arquivo da foto do canal").setInputFiles(AVATAR)
    expect((await uploaded).status()).toBe(204)

    // O AvatarImage só aparece depois que a imagem carrega de verdade.
    await page.goto("/")
    const navbarAvatar = page
      .getByRole("banner")
      .getByRole("link", { name: "Seu canal" })
      .locator("[data-slot='avatar-image']")
    await expect(navbarAvatar).toBeVisible({ timeout: 15_000 })
    expect(
      await navbarAvatar.evaluate((img) => (img as HTMLImageElement).naturalWidth)
    ).toBe(16)

    await page.goto("/channel/settings")
    const removed = page.waitForResponse(
      (r) =>
        r.request().method() === "DELETE" &&
        new URL(r.url()).pathname === "/api/me/channel/avatar"
    )
    await uploader.getByRole("button", { name: "Remover foto" }).click()
    expect((await removed).status()).toBe(204)

    await page.goto("/")
    const banner = page.getByRole("banner")
    await expect(banner.locator("[data-slot='avatar-fallback']")).toBeVisible()
    await expect(banner.locator("[data-slot='avatar-image']")).toHaveCount(0)
  })
})
