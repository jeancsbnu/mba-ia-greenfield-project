import { expect, test } from "./fixtures"

// Tela /resend-confirmation, destino do CTA do login para conta não
// confirmada. Upstream fingido no servidor pelo MSW: 204 para qualquer e-mail
// (anti-enumeration) e 400 para o gatilho badrequest@example.com.
test.describe("auth-resend-confirmation", () => {
  test("1.1 login-nao-confirmado-leva-ao-reenvio", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("E-mail").fill("unconfirmed@example.com")
    await page.getByLabel("Senha", { exact: true }).fill("secret123")
    await page.getByRole("button", { name: "Entrar" }).click()

    await page
      .getByRole("link", { name: /Reenviar e-mail de confirmação/i })
      .click()
    await expect(page).toHaveURL(/\/resend-confirmation$/, { timeout: 15_000 })

    await page.getByLabel("E-mail").fill("unconfirmed@example.com")
    const request = page.waitForRequest(
      (r) =>
        r.url().includes("/api/auth/resend-confirmation") && r.method() === "POST"
    )
    await page.getByRole("button", { name: "Reenviar link de confirmação" }).click()
    expect((await request).postDataJSON()).toEqual({
      email: "unconfirmed@example.com",
    })

    await expect(page.getByRole("status")).toContainText("Verifique seu e-mail")
  })

  test("1.2 erro-400-inline-no-email", async ({ page }) => {
    await page.goto("/resend-confirmation")
    await page.getByLabel("E-mail").fill("badrequest@example.com")
    await page.getByRole("button", { name: "Reenviar link de confirmação" }).click()

    await expect(page.getByLabel("E-mail")).toHaveAttribute("aria-invalid", "true")
    await expect(page.getByRole("status")).toHaveCount(0)
  })
})
