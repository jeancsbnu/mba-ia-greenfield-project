import type { Page, Route } from "@playwright/test"

import { expect, test } from "./fixtures"

// Spec: next-frontend/specs/video-watch-page.plan.md (SI-05.6b)
//
// Nenhum cenário faz login: a watch page é anônima. O upstream NestJS é
// fingido server-side pelo MSW do instrumentation.ts, então os Route Handlers
// reais rodam — por isso NÃO há page.route() sobre /api/**.
//
// A única interceptação de browser aqui é na ORIGEM DO STORAGE, que é outra
// origem e está fora de /api/**: é a exceção decidida no
// video-watch-page/TD-06 (Option C), e a única forma de afirmar que o `src` e
// o `href` apontam ao lugar certo sem espalhar binário de vídeo pela suíte.
const STORAGE_ORIGIN = "http://storage.test"

const WATCH_VIDEO = "watch-video"
const RATE_LIMITED_VIDEO = "trigger-view-rate-limited"
const EMPTY_SUGGESTIONS_VIDEO = "trigger-empty-suggestions"
const SUGGESTIONS_ERROR_VIDEO = "trigger-suggestions-error"

/** Corpo mínimo para o `src` e para o download, servido do storage fingido. */
async function fulfillFromStorage(route: Route): Promise<void> {
  const disposition = new URL(route.request().url()).searchParams.get(
    "response-content-disposition"
  )
  await route.fulfill({
    status: 200,
    contentType: "video/mp4",
    headers: disposition === null ? {} : { "content-disposition": disposition },
    body: "fake-video-bytes",
  })
}

async function stubStorage(page: Page): Promise<void> {
  await page.route(`${STORAGE_ORIGIN}/**`, fulfillFromStorage)
}

/**
 * Avança o tempo de MÍDIA do player em passos de 0,25 s, como o `timeupdate`
 * real faria, sem depender de reprodução de verdade num navegador headless.
 *
 * Os passos são pequenos de propósito: o player ignora saltos maiores que 1 s
 * por considerá-los busca na barra, não reprodução — pular direto para 6 s
 * não contaria nada, e o teste passaria pelo motivo errado.
 */
async function advanceMedia(page: Page, seconds: number): Promise<void> {
  await page.evaluate((target) => {
    const video = document.querySelector("video")
    if (video === null) throw new Error("player não está montado")

    const state = window as unknown as { __mediaTime?: number }
    if (state.__mediaTime === undefined) {
      state.__mediaTime = 0
      Object.defineProperty(video, "currentTime", {
        configurable: true,
        get: () => state.__mediaTime ?? 0,
      })
    }

    for (let step = 0; step < target / 0.25; step++) {
      state.__mediaTime = Number(((state.__mediaTime ?? 0) + 0.25).toFixed(2))
      video.dispatchEvent(new Event("timeupdate"))
    }
  }, seconds)
}

/** Volta a mídia ao início sem remontar o player. */
async function rewind(page: Page): Promise<void> {
  await page.evaluate(() => {
    const video = document.querySelector("video")
    const state = window as unknown as { __mediaTime?: number }
    state.__mediaTime = 0
    video?.dispatchEvent(new Event("timeupdate"))
  })
}

/**
 * Espera a hidratacao antes de mexer no tempo de midia.
 *
 * O `useEffect` do player so se inscreve no `timeupdate` depois que o React
 * hidrata; eventos despachados antes disso caem no vazio e o teste falharia
 * por corrida, nao pelo que afirma. O sinal usado e comportamental: o toggle
 * da descricao e um client component e so responde ao clique depois de
 * hidratado — e a hidratacao do root cobre a arvore toda numa passada. O
 * estado e devolvido ao original no fim.
 */
async function waitForHydration(page: Page): Promise<void> {
  const toggle = page.getByRole("button", { name: "Mostrar mais" })
  await toggle.click()
  await expect(
    page.getByRole("button", { name: "Mostrar menos" })
  ).toBeVisible()
  await page.getByRole("button", { name: "Mostrar menos" }).click()
  await expect(toggle).toBeVisible()
}

/** Conta as requisições de contagem que o browser emitiu. */
function countViewRequests(page: Page, publicId: string): () => number {
  let count = 0
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().includes(`/api/videos/${publicId}/view`)
    ) {
      count += 1
    }
  })
  return () => count
}

test.describe("video-watch-page", () => {
  // 1. Reprodução e contagem de visualização

  test("1.1 contagem-nao-dispara-abaixo-do-limiar", async ({ page }) => {
    await stubStorage(page)
    const views = countViewRequests(page, WATCH_VIDEO)

    await page.goto(`/videos/${WATCH_VIDEO}`)

    const player = page.locator("video")
    await expect(player).toBeVisible()
    await expect(player).toHaveAttribute("controls", "")
    // `toHaveJSProperty` compara por igualdade estrita e nao aceita matcher
    // assimetrico; o `src` carrega a assinatura, entao a asserção e de prefixo.
    expect(await player.getAttribute("src")).toContain(STORAGE_ORIGIN)

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    // Exato, nao regex: os cards da sidebar tambem dizem "visualizacoes", e
    // um /visualizações/ solto viola o strict mode do Playwright.
    await expect(page.getByText("1.284 visualizações")).toBeVisible()
    await expect(page.getByText("Fixture Channel")).toBeVisible()

    await waitForHydration(page)

    await advanceMedia(page, 4)
    await page.waitForTimeout(300)
    expect(views()).toBe(0)

    await advanceMedia(page, 2)
    await expect.poll(views).toBe(1)
  })

  test("1.2 contagem-dispara-uma-unica-vez-por-montagem", async ({ page }) => {
    await stubStorage(page)
    const views = countViewRequests(page, WATCH_VIDEO)

    await page.goto(`/videos/${WATCH_VIDEO}`)
    // Reavança até o gatilho armar: o `useEffect` do player só se inscreve
    // depois da hidratação, e eventos despachados antes disso caem no vazio.
    // Reavançar é seguro justamente pelo que este cenário afirma — o gatilho
    // dispara uma vez por montagem, por mais que a mídia cruze o limiar.
    await expect
      .poll(async () => {
        await advanceMedia(page, 6)
        return views()
      })
      .toBe(1)

    // Mesma montagem do player: voltar ao início e cruzar o limiar de novo
    // não rearma o gatilho.
    await rewind(page)
    await advanceMedia(page, 6)
    await page.waitForTimeout(300)
    expect(views()).toBe(1)

    // Montagem nova, gatilho novo.
    await page.reload()
    await expect
      .poll(async () => {
        await advanceMedia(page, 6)
        return views()
      })
      .toBe(2)
  })

  test("1.3 erro-de-contagem-e-silencioso-para-o-espectador", async ({
    page,
  }) => {
    await stubStorage(page)

    // Trigger reservado: o upstream responde 429 nesta rota de contagem.
    await page.goto(`/videos/${RATE_LIMITED_VIDEO}`)
    await waitForHydration(page)
    await advanceMedia(page, 6)
    await page.waitForTimeout(300)

    // A contagem é métrica, não função da página.
    // Escopado em <main>: `getByRole("alert")` solto tambem casa com o route
    // announcer do Next (#__next-route-announcer__), que existe sempre.
    await expect(page.locator("main [role='alert']")).toHaveCount(0)
    await expect(page.locator("video")).toBeVisible()
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Baixar vídeo" })
    ).toBeVisible()
  })

  // 2. Download

  test("2.1 download-usa-a-url-que-veio-com-a-pagina", async ({ page }) => {
    await stubStorage(page)
    await page.goto(`/videos/${WATCH_VIDEO}`)

    const download = page.getByRole("link", { name: "Baixar vídeo" })
    const href = await download.getAttribute("href")
    expect(href).toContain(STORAGE_ORIGIN)
    expect(href).not.toContain("/api/")

    // Nenhuma chamada à API no clique: a URL já veio com a página (TD-02).
    let apiCalls = 0
    page.on("request", (request) => {
      if (request.url().includes("/api/")) apiCalls += 1
    })

    const started = page.waitForEvent("download")
    await download.click()
    const file = await started

    expect(apiCalls).toBe(0)
    expect(file.url()).toContain(STORAGE_ORIGIN)
    // O nome vem do content-disposition assinado, derivado do título — não da
    // chave de objeto, e não do atributo `download`, ignorado cross-origin.
    expect(file.suggestedFilename()).toBe("fixture-watch-video.mp4")
  })

  // 3. Sidebar de sugestões

  test("3.1 ver-mais-acrescenta-pagina-e-some-no-fim", async ({ page }) => {
    await stubStorage(page)
    await page.goto(`/videos/${WATCH_VIDEO}`)

    const cards = page.locator("[data-slot='video-card']")
    await expect(cards).toHaveCount(4)

    // `exact`: desde a Fase 06 a página também tem "Ver mais N respostas" na
    // seção de comentários.
    const loadMore = page.getByRole("button", { name: "Ver mais", exact: true })
    await expect(loadMore).toBeVisible()

    // waitForResponse, nao waitForRequest: a segunda resolve quando a
    // requisicao SAI, e sob carga a resposta pode demorar mais que o timeout
    // padrao da asserção seguinte.
    const nextPage = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/videos/${WATCH_VIDEO}/suggestions`) &&
        new URL(response.url()).searchParams.get("offset") === "4"
    )
    await loadMore.click()
    await nextPage

    // Acrescenta, não substitui: 4 + 2 de um total de 6.
    await expect(cards).toHaveCount(6)
    await expect(loadMore).toHaveCount(0)
  })

  test("3.2 sidebar-vazia-nao-e-erro", async ({ page }) => {
    await stubStorage(page)
    await page.goto(`/videos/${EMPTY_SUGGESTIONS_VIDEO}`)

    // Lista vazia é resultado legítimo: o TD-04 exclui o vídeo atual,
    // rascunhos e unlisted, então uma categoria com um só publicado dá [].
    await expect(page.locator("[data-slot='video-card']")).toHaveCount(0)
    await expect(
      page.getByText("Nenhuma sugestão nesta categoria")
    ).toBeVisible()
    // Escopado em <main>: `getByRole("alert")` solto tambem casa com o route
    // announcer do Next (#__next-route-announcer__), que existe sempre.
    await expect(page.locator("main [role='alert']")).toHaveCount(0)

    await expect(page.locator("video")).toBeVisible()
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })

  test("3.3 falha-nas-sugestoes-degrada-so-a-sidebar", async ({ page }) => {
    await stubStorage(page)

    // Trigger reservado: o upstream responde 500 nas sugestões.
    await page.goto(`/videos/${SUGGESTIONS_ERROR_VIDEO}`)

    // A falha fica contida na sidebar — a página não vai para o estado de
    // erro nem para o not-found.
    await expect(page.locator("video")).toBeVisible()
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    // Exato, nao regex: os cards da sidebar tambem dizem "visualizacoes", e
    // um /visualizações/ solto viola o strict mode do Playwright.
    await expect(page.getByText("1.284 visualizações")).toBeVisible()
    await expect(page.getByText("Fixture Channel")).toBeVisible()
    await expect(page.getByText("Vídeo não encontrado")).toHaveCount(0)
  })
})
