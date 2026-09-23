import { expect, login, test } from "./fixtures"

// Spec: next-frontend/specs/channel-videos.plan.md (SI-04.11b)
// Triggers por e-mail de login: user@example.com (12 vídeos),
// empty-channel@example.com (nenhum), panel-error@example.com (500).

test.describe("channel-videos", () => {
  // 1. Gerenciar os vídeos do canal pelo painel

  test("1.1 guard-redireciona-sem-sessao", async ({ page }) => {
    await page.goto("/channel/videos")

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByLabel("E-mail")).toBeVisible()
    await expect(page.locator("[data-slot='video-table']")).toHaveCount(0)
  })

  test("1.2 lista-os-videos-do-canal", async ({ page }) => {
    await login(page, "user@example.com")
    await page.goto("/channel/videos")

    await expect(page.locator("[data-slot='user-menu']")).toBeVisible()
    await expect(page.getByRole("button", { name: "Sair" })).toBeVisible()

    const rows = page.locator("[data-slot='video-table-row']")
    await expect(rows).toHaveCount(10)

    const first = rows.first()
    await expect(first.locator("img")).toBeVisible()
    await expect(first.getByText(/^\d+:\d{2}$/)).toBeVisible()

    // Rascunho: sem visibilidade, sem métricas, sem publicação.
    const draft = page
      .locator("[data-slot='video-table-row']")
      .filter({ has: page.locator("[data-status='draft']") })
      .first()
    await expect(draft.locator("[data-status='draft']")).toHaveText("Rascunho")
    await expect(draft.locator("[data-visibility='none']")).toHaveText("—")

    // "unlisted" nunca aparece em inglês para o usuário (TD-02).
    await expect(
      page.locator("[data-visibility='unlisted']").first()
    ).toHaveText("Indisponível")
    await expect(page.getByText("Unlisted")).toHaveCount(0)
  })

  test("1.3 pagina-por-search-param", async ({ page }) => {
    await login(page, "user@example.com")

    await page.goto("/channel/videos?page=2")
    // 12 no total, 10 na primeira página → 2 restantes.
    await expect(page.locator("[data-slot='video-table-row']")).toHaveCount(2)
    await expect(page.locator("[aria-current='page']")).toHaveText("2")

    // `page` inválido normaliza para a página 1 em vez de virar erro.
    await page.goto("/channel/videos?page=abc")
    await expect(page.locator("[data-slot='video-table-row']")).toHaveCount(10)
  })

  test("1.4 estado-vazio-com-criar-video", async ({ page }) => {
    await login(page, "empty-channel@example.com")
    await page.goto("/channel/videos")

    const empty = page.locator("[data-slot='videos-empty-state']")
    await expect(empty.getByText("Nenhum vídeo ainda")).toBeVisible()

    // O cabeçalho tem o mesmo CTA; a asserção é escopada ao estado vazio.
    const create = empty.getByRole("link", { name: "Criar novo vídeo" })
    await expect(create).toBeVisible()
    await create.click()

    await expect(page).toHaveURL(/\/upload$/)
  })

  test("1.5 editar-leva-a-tela-de-edicao", async ({ page }) => {
    await login(page, "user@example.com")
    await page.goto("/channel/videos")

    // O nome acessível inclui o título: "Editar" sozinho se repetiria em
    // todas as linhas e não identificaria o alvo.
    const edit = page.getByRole("link", { name: /^Editar .+/ }).first()
    await expect(edit).toBeVisible()

    const href = await edit.getAttribute("href")
    expect(href).toMatch(/^\/videos\/[^/]+\/edit$/)

    await edit.click()
    // waitForURL com o caminho literal: montar um RegExp a partir do href
    // depende de escape e é frágil quando a navegação demora sob carga.
    await page.waitForURL(`**${href ?? ""}`, { timeout: 15000 })
  })

  test("1.6 erro-do-upstream-com-nova-tentativa", async ({ page }) => {
    await login(page, "panel-error@example.com")
    await page.goto("/channel/videos")

    await expect(
      page.getByText("Não foi possível carregar seus vídeos")
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Tentar de novo" })
    ).toBeVisible()
    await expect(page.locator("[data-slot='video-table']")).toHaveCount(0)
  })
})
