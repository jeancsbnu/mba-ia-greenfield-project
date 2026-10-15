import { expect, test } from "@playwright/test"

import {
  PASSWORD,
  loginThroughUi,
  readConfirmationLink,
  uniqueEmail,
} from "./helpers"

// Fluxo 1 (testes-producao/TD-01): cadastro → link lido no Mailpit → visita ao
// link (rota-ponte do BFF) → login → logout, contra a stack real.
test.describe("cadastro-confirmacao-login", () => {
  test("a conta só entra depois de visitar o link de confirmação", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("cadastro")

    await page.goto("/signup")
    await page.getByLabel("Nome completo").fill("Conta da Suíte")
    await page.getByLabel("E-mail").fill(email)
    await page.getByLabel("Senha", { exact: true }).fill(PASSWORD)
    await page.getByLabel("Confirmar senha").fill(PASSWORD)
    await page.getByRole("checkbox").check()
    await page.getByRole("button", { name: "Criar conta" }).click()
    await expect(page.getByRole("status")).toContainText("Conta criada!")

    // Antes de confirmar, o login é recusado com EMAIL_NOT_CONFIRMED (403).
    await page.goto("/login")
    await page.getByLabel("E-mail").fill(email)
    await page.getByLabel("Senha", { exact: true }).fill(PASSWORD)
    await page.getByRole("button", { name: "Entrar" }).click()
    await expect(
      page.locator("[data-slot='form-confirmation-error']")
    ).toBeVisible()

    // O link do e-mail aponta para a rota-ponte, que confirma e manda ao login
    // com o aviso de conta confirmada.
    const link = await readConfirmationLink(request, email)
    await page.goto(link)
    await expect(page).toHaveURL(/\/login\?confirmation=confirmed$/)
    await expect(
      page.locator("[data-slot='confirmation-notice']")
    ).toContainText("Conta confirmada")

    await loginThroughUi(page, email, "/")
    const banner = page.getByRole("banner")
    await expect(banner.getByRole("button", { name: "Sair" })).toBeVisible()

    await banner.getByRole("button", { name: "Sair" }).click()
    await expect(page).toHaveURL(/\/login$/)

    // /login usa o layout de autenticação, sem a navbar do site: o estado
    // deslogado se confere na home.
    await page.goto("/")
    await expect(banner.getByRole("link", { name: "Entrar" })).toBeVisible()
    await expect(banner.getByRole("button", { name: "Sair" })).toHaveCount(0)
  })
})
