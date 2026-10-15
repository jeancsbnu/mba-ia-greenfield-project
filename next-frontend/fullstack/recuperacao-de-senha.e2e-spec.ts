import { expect, test } from "@playwright/test"

import {
  PASSWORD,
  createConfirmedAccount,
  loginThroughUi,
  readPasswordResetLink,
} from "./helpers"

// Fluxo 6: pedido de recuperação → link lido no Mailpit → nova senha na tela
// /auth/reset-password → login só com a senha nova, contra a stack real.
test.describe("recuperacao-de-senha", () => {
  test("a senha nova passa a valer e a antiga deixa de entrar", async ({
    page,
    request,
  }) => {
    const email = await createConfirmedAccount(request, "recuperacao")
    const newPassword = "senha-nova-da-suite-456"

    await page.goto("/forgot-password")
    await page.getByLabel("E-mail").fill(email)
    await page.getByRole("button", { name: "Enviar link de redefinição" }).click()
    await expect(page.getByRole("status")).toContainText("Verifique seu e-mail")

    const link = await readPasswordResetLink(request, email)
    await page.goto(link)
    await page.getByLabel("Nova senha", { exact: true }).fill(newPassword)
    await page.getByLabel("Confirmar nova senha").fill(newPassword)
    await page.getByRole("button", { name: "Redefinir senha" }).click()
    await expect(page.getByRole("status")).toContainText("Senha redefinida")

    // O link é de uso único: a segunda visita cai no estado de link inválido.
    await page.goto(link)
    await page.getByLabel("Nova senha", { exact: true }).fill(newPassword)
    await page.getByLabel("Confirmar nova senha").fill(newPassword)
    await page.getByRole("button", { name: "Redefinir senha" }).click()
    await expect(
      page.locator("[data-slot='reset-password-invalid']")
    ).toContainText("Link inválido ou expirado")

    // A senha antiga não entra mais.
    await page.goto("/login")
    await page.getByLabel("E-mail").fill(email)
    await page.getByLabel("Senha", { exact: true }).fill(PASSWORD)
    await page.getByRole("button", { name: "Entrar" }).click()
    await expect(page.locator("[data-slot='form-error']")).toBeVisible()

    await loginThroughUi(page, email, "/", newPassword)
    await expect(
      page.getByRole("banner").getByRole("button", { name: "Sair" })
    ).toBeVisible()
  })
})
