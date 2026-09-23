import { expect, test } from "./fixtures"

// Spec: next-frontend/specs/channel-public.plan.md (SI-04.14b)
// Nenhum cenário faz login: a vitrine é anônima (TD-08). Upstream é fingido
// server-side pelo MSW do instrumentation.ts; triggers por nickname:
// joana_cria (12 públicos), sem_videos (0), nao_existe (404).
test.describe("channel-public", () => {
  // 1. Mostrar o canal público a qualquer visitante

  test("1.1 mostra-cabecalho-e-grade-de-videos", async ({ page }) => {
    await page.goto("/@joana_cria")

    await expect(
      page.getByRole("heading", { level: 1, name: "Joana Cria" })
    ).toBeVisible()
    await expect(page.getByText("Vídeos de culinária")).toBeVisible()
    await expect(page.getByText("@joana_cria · 12 vídeos")).toBeVisible()

    // Nesta fase não há upload de avatar (OQ-21): o Avatar renderiza as
    // iniciais e carrega o nome via aria-label, não um <img alt>.
    await expect(
      page.locator("[data-slot='avatar'][aria-label='Joana Cria']")
    ).toBeVisible()

    const cards = page.locator("[data-slot='video-card']")
    await expect(cards.first()).toBeVisible()

    const first = cards.first()
    await expect(first.locator("img")).toBeVisible()
    await expect(
      first.locator("[data-slot='video-card-duration']")
    ).toHaveText(/^\d+:\d{2}$/)
    await expect(first.getByRole("heading", { level: 3 })).toBeVisible()
    await expect(first.getByText(/visualizações · há /)).toBeVisible()

    // A vitrine não expõe estado: rascunho e "Indisponível" ficam fora dela.
    await expect(page.getByText("Rascunho")).toHaveCount(0)
    await expect(page.getByText("Indisponível")).toHaveCount(0)
  })

  test("1.2 pagina-de-8-em-8", async ({ page }) => {
    await page.goto("/@joana_cria")

    await expect(page.locator("[data-slot='video-card']")).toHaveCount(8)

    const previous = page.getByRole("link", {
      name: "Ir para a página anterior",
    })
    await expect(previous).toHaveAttribute("aria-disabled", "true")
    await expect(
      page.locator("[aria-current='page']")
    ).toHaveText("1")
    await expect(
      page.getByRole("link", { name: "Ir para a próxima página" })
    ).toBeVisible()

    await page.goto("/@joana_cria?page=2")

    // 12 no total, 8 na primeira página → 4 restantes.
    await expect(page.locator("[data-slot='video-card']")).toHaveCount(4)
    await expect(page.locator("[aria-current='page']")).toHaveText("2")
    await expect(
      page.getByRole("link", { name: "Ir para a próxima página" })
    ).toHaveAttribute("aria-disabled", "true")
  })

  test("1.3 contagem-so-de-publicados-e-publicos", async ({ page }) => {
    await page.goto("/@joana_cria")
    const firstPage = await page.locator("[data-slot='video-card']").count()

    await page.goto("/@joana_cria?page=2")
    const secondPage = await page.locator("[data-slot='video-card']").count()

    // O total anunciado no meta tem de bater com o que a paginação entrega.
    expect(firstPage + secondPage).toBe(12)
    await expect(page.getByText("@joana_cria · 12 vídeos")).toBeVisible()
  })

  test("1.4 canal-inexistente-mostra-nao-encontrado", async ({ page }) => {
    await page.goto("/@nao_existe")

    await expect(
      page.getByRole("heading", { name: "Canal não encontrado" })
    ).toBeVisible()
    await expect(page.locator("[data-slot='channel-header']")).toHaveCount(0)
    await expect(page.locator("[data-slot='video-card']")).toHaveCount(0)
  })

  test("1.5 canal-sem-videos-publicados", async ({ page }) => {
    await page.goto("/@sem_videos")

    await expect(page.getByText("@sem_videos · 0 vídeos")).toBeVisible()
    await expect(
      page.getByText("Este canal ainda não tem vídeos publicados")
    ).toBeVisible()
    await expect(page.locator("[data-slot='video-card']")).toHaveCount(0)
  })

  test("1.6 botao-entrar-leva-ao-login", async ({ page }) => {
    await page.goto("/@joana_cria")

    await page.getByRole("link", { name: "Entrar" }).click()

    await expect(page).toHaveURL(/\/login$/)
  })
})
