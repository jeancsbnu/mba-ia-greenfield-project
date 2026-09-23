import { expect, test } from "./fixtures"

// 1 spec → 1 file with one describe (feature = target_file stem) + N test() blocks.
// Upstream is faked server-side by mocks/ MSW via instrumentation.ts; per-scenario
// outcomes use the reserved trigger emails (conflict@ → 409, badrequest@ → 400).
// No page.route() of /api/** — that would short-circuit the real Route Handlers.
test.describe("auth-signup", () => {
  // 1. Cadastrar novo usuário com e-mail e senha

  test("1.1 signup-sucesso-conta-criada", async ({ page }) => {
    await page.goto("/signup")

    const card = page.locator("[data-slot='card']")
    await expect(card).toBeVisible()
    await expect(page.getByLabel("E-mail")).toBeVisible()
    await expect(page.getByLabel("Senha", { exact: true })).toBeVisible()
    const submit = page.getByRole("button", { name: "Criar conta" })
    await expect(submit).toBeVisible()

    await page.getByLabel("Nome completo").fill("Alice Doe")
    await page.getByLabel("E-mail").fill("alice@example.com")
    await page.getByLabel("Senha", { exact: true }).fill("Password1")
    await page.getByLabel("Confirmar senha").fill("Password1")
    await page.getByRole("checkbox").check()

    const signupRequest = page.waitForRequest(
      (r) => r.url().includes("/api/auth/signup") && r.method() === "POST"
    )
    await submit.click()
    await signupRequest

    await expect(page.getByRole("status")).toContainText("Conta criada!")
    // No session established, no redirect to an authenticated area.
    await expect(page).toHaveURL(/\/signup$/)
    const cookies = await page.context().cookies()
    expect(cookies.some((c) => c.name.includes("session"))).toBe(false)
  })

  test("1.2 signup-erro-409-email-ja-registrado", async ({ page }) => {
    await page.goto("/signup")

    await page.getByLabel("Nome completo").fill("Alice Doe")
    await page.getByLabel("E-mail").fill("conflict@example.com")
    await page.getByLabel("Senha", { exact: true }).fill("Password1")
    await page.getByLabel("Confirmar senha").fill("Password1")
    await page.getByRole("checkbox").check()
    await page.getByRole("button", { name: "Criar conta" }).click()

    await expect(page.getByText(/already registered/i)).toBeVisible()
    const cta = page.getByRole("link", { name: /fazer login/i })
    await expect(cta).toHaveAttribute("href", "/login")

    // Correct to a fresh email that trips the 400 validation trigger.
    await page.getByLabel("E-mail").fill("badrequest@example.com")
    await page.getByRole("button", { name: "Criar conta" }).click()

    const alert = page.locator("[data-slot='form-error']")
    await expect(alert).toContainText(/validation failed/i)
    await expect(
      page.getByRole("link", { name: /fazer login/i })
    ).toHaveCount(0)
  })

  test("1.3 signup-validacao-client-side-bloqueia-submit", async ({ page }) => {
    await page.goto("/signup")

    const requests: string[] = []
    page.on("request", (r) => {
      if (r.url().includes("/api/auth/signup")) requests.push(r.method())
    })

    await page.getByRole("button", { name: "Criar conta" }).click()
    await expect(
      page.getByText("Endereço de e-mail inválido")
    ).toBeVisible()
    await expect(
      page.getByText("Você precisa aceitar os termos")
    ).toBeVisible()
    expect(requests).toHaveLength(0)

    // Violate mirrored backend rules: malformed email + weak password, terms off.
    await page.getByLabel("Nome completo").fill("Alice Doe")
    await page.getByLabel("E-mail").fill("not-an-email")
    await page.getByLabel("Senha", { exact: true }).fill("weak")
    await page.getByLabel("Confirmar senha").fill("weak")
    await page.getByRole("button", { name: "Criar conta" }).click()
    await expect(
      page.getByText("Endereço de e-mail inválido")
    ).toBeVisible()
    expect(requests).toHaveLength(0)

    // Fix everything and accept terms → submit is released.
    await page.getByLabel("E-mail").fill("alice@example.com")
    await page.getByLabel("Senha", { exact: true }).fill("Password1")
    await page.getByLabel("Confirmar senha").fill("Password1")
    await page.getByRole("checkbox").check()

    const signupRequest = page.waitForRequest(
      (r) => r.url().includes("/api/auth/signup") && r.method() === "POST"
    )
    await page.getByRole("button", { name: "Criar conta" }).click()
    await signupRequest
    expect(requests.length).toBeGreaterThan(0)
  })
})
