import { expect, test } from "./fixtures"

// Link do e-mail de confirmação → ponte /auth/confirm-email → aviso no login.
// Upstream fingido pelo MSW: 204 para qualquer token e 401 para o gatilho
// reservado "invalid-confirmation-token".
test.describe("auth-confirm-email", () => {
  test("1.1 link-valido-avisa-conta-confirmada", async ({ page }) => {
    await page.goto("/auth/confirm-email?token=valid-token")

    await expect(page).toHaveURL(/\/login\?confirmation=confirmed$/)
    await expect(
      page.locator("[data-slot='confirmation-notice']")
    ).toContainText("Conta confirmada")
    await expect(page.getByLabel("E-mail")).toBeVisible()
  })

  test("1.2 link-invalido-oferece-reenvio", async ({ page }) => {
    await page.goto("/auth/confirm-email?token=invalid-confirmation-token")

    await expect(page).toHaveURL(/\/login\?confirmation=invalid$/)
    const notice = page.locator("[data-slot='confirmation-notice']")
    await expect(notice).toContainText("Link de confirmação inválido")
    await notice
      .getByRole("link", { name: "Reenviar e-mail de confirmação" })
      .click()
    await expect(page).toHaveURL(/\/resend-confirmation$/, { timeout: 15_000 })
  })

  test("1.3 login-sem-parametro-nao-mostra-aviso", async ({ page }) => {
    await page.goto("/login?confirmation=qualquer-coisa")

    await expect(page.getByLabel("E-mail")).toBeVisible()
    await expect(page.locator("[data-slot='confirmation-notice']")).toHaveCount(0)
  })
})
