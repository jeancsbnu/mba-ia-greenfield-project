import { expect, login, test, waitForHydration } from "./fixtures"

// Spec: next-frontend/specs/channel-settings.plan.md (SI-04.13b)
// O login user@example.com dá acesso ao canal joana_cria; o valor de nickname
// `nickname_em_uso` faz o PATCH responder 409.
test.describe("channel-settings", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "user@example.com")
    await page.goto("/channel/settings")
    await waitForHydration(page, "input[name='nickname']")
  })

  // 1. Editar as configurações públicas do canal

  test("1.1 mostra-os-dados-atuais-do-canal", async ({ page }) => {
    await expect(page.getByLabel("Nickname")).toHaveValue("joana_cria")
    await expect(page.getByLabel("Nome do canal")).toHaveValue("Joana Cria")
    await expect(page.getByLabel("Descrição")).toHaveValue(
      "Vídeos de culinária"
    )

    // O "@" é adorno decorativo, fora do nome acessível do campo.
    await expect(page.getByText("@", { exact: true })).toBeVisible()
    await expect(page.locator("[data-slot='user-menu']")).toBeVisible()
  })

  test("1.2 salva-com-dados-validos", async ({ page }) => {
    const name = page.getByLabel("Nome do canal")
    await name.fill("Joana Nova")

    const request = page.waitForRequest(
      (r) => r.url().includes("/api/me/channel") && r.method() === "PATCH"
    )
    await page.getByRole("button", { name: "Salvar alterações" }).click()

    const sent = await request
    expect(JSON.parse(sent.postData() ?? "{}")).toMatchObject({
      name: "Joana Nova",
    })

    await expect(page.getByRole("status")).toHaveText("Alterações salvas")
  })

  test("1.3 nickname-em-uso-mostra-erro-inline", async ({ page }) => {
    const nickname = page.getByLabel("Nickname")
    await nickname.fill("nickname_em_uso")

    const response = page.waitForResponse(
      (r) =>
        r.url().includes("/api/me/channel") && r.request().method() === "PATCH"
    )
    await page.getByRole("button", { name: "Salvar alterações" }).click()

    expect((await response).status()).toBe(409)

    await expect(
      page.getByText("Esse nickname já pertence a outro canal")
    ).toBeVisible()
    await expect(page.getByRole("status")).toHaveCount(0)

    // O canal não foi alterado: recarregar traz o valor anterior.
    await page.reload()
    await expect(page.getByLabel("Nickname")).toHaveValue("joana_cria")
  })

  test("1.4 allowlist-bloqueia-antes-do-envio", async ({ page }) => {
    let patched = false
    page.on("request", (r) => {
      if (r.url().includes("/api/me/channel") && r.method() === "PATCH") {
        patched = true
      }
    })

    // "joana.cria" é o exemplo do próprio Figma e o backend o rejeita; barrar
    // no cliente evita um round-trip só para receber 400.
    await page.getByLabel("Nickname").fill("joana.cria")
    await page.getByRole("button", { name: "Salvar alterações" }).click()

    await expect(page.getByText(/apenas letras minúsculas/i)).toBeVisible()
    expect(patched).toBe(false)
  })

  test("1.5 avisa-que-trocar-nickname-muda-a-url", async ({ page }) => {
    const nickname = page.getByLabel("Nickname")
    const describedBy = (await nickname.getAttribute("aria-describedby")) ?? ""
    expect(describedBy).not.toBe("")

    const texts = await Promise.all(
      describedBy
        .split(" ")
        .map(async (id) => (await page.locator(`#${id}`).textContent()) ?? "")
    )
    const joined = texts.join(" ")

    expect(joined).toContain("Único e global para o sistema")
    expect(joined).toContain("endereço público")
  })

  test("1.6 cancelar-volta-ao-painel", async ({ page }) => {
    await page.getByRole("link", { name: "Cancelar" }).click()

    await expect(page).toHaveURL(/\/channel\/videos$/)
  })
})

// 2. Conta sem canal: o login no-channel@example.com faz GET /me/channel
// responder 404 CHANNEL_NOT_FOUND.
test.describe("channel-settings sem canal", () => {
  test("2.1 conta-sem-canal-responde-404", async ({ page }) => {
    await login(page, "no-channel@example.com")

    const response = await page.goto("/channel/settings")

    // 404 de verdade, não 200 nem a página de erro genérica: o segmento não
    // tem loading.tsx, então o notFound() acontece antes de a resposta sair.
    expect(response?.status()).toBe(404)
    await expect(
      page.getByRole("heading", { name: "Canal não encontrado" })
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Voltar para o painel" })
    ).toHaveAttribute("href", "/channel/videos")
    await expect(page.locator("input[name='nickname']")).toHaveCount(0)
  })
})
