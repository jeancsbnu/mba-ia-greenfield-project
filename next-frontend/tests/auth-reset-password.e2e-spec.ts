import { expect, test } from "./fixtures"

// Destino do link do e-mail de recuperação (`/auth/reset-password?token=`).
// Upstream fingido no servidor pelo MSW (mocks/handlers/auth.ts): 204 para
// qualquer token, 401 INVALID_TOKEN para o gatilho reservado
// "invalid-reset-token". Sem page.route().
test.describe("auth-reset-password", () => {
  test("1.1 nova-senha-salva-e-leva-ao-login", async ({ page }) => {
    await page.goto("/auth/reset-password?token=valid-reset-token")

    await expect(
      page.getByRole("heading", { name: "Criar nova senha" })
    ).toBeVisible()
    await page.getByLabel("Nova senha", { exact: true }).fill("novaSenha123")
    await page.getByLabel("Confirmar nova senha").fill("novaSenha123")

    const request = page.waitForRequest(
      (r) => r.url().includes("/api/auth/reset-password") && r.method() === "POST"
    )
    await page.getByRole("button", { name: "Redefinir senha" }).click()
    expect((await request).postDataJSON()).toEqual({
      token: "valid-reset-token",
      new_password: "novaSenha123",
    })

    await expect(page.getByRole("status")).toContainText("Senha redefinida")
    // Redefinir a senha não abre sessão.
    const cookies = await page.context().cookies()
    expect(cookies.some((c) => c.name.includes("session"))).toBe(false)

    await page.getByRole("link", { name: "Ir para o login" }).click()
    await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 })
  })

  test("1.2 link-invalido-oferece-novo-link", async ({ page }) => {
    await page.goto("/auth/reset-password?token=invalid-reset-token")

    await page.getByLabel("Nova senha", { exact: true }).fill("novaSenha123")
    await page.getByLabel("Confirmar nova senha").fill("novaSenha123")
    await page.getByRole("button", { name: "Redefinir senha" }).click()

    const invalid = page.locator("[data-slot='reset-password-invalid']")
    await expect(invalid).toContainText("Link inválido ou expirado")
    await invalid.getByRole("link", { name: "Pedir um novo link" }).click()
    await expect(page).toHaveURL(/\/forgot-password$/, { timeout: 15_000 })
  })

  test("1.3 sem-token-mostra-link-invalido", async ({ page }) => {
    await page.goto("/auth/reset-password")

    await expect(
      page.locator("[data-slot='reset-password-invalid']")
    ).toContainText("Link inválido ou expirado")
    await expect(page.getByLabel("Nova senha", { exact: true })).toHaveCount(0)
  })
})
