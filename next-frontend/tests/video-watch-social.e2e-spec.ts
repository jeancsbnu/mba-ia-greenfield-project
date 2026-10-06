import type { Page } from "@playwright/test"

import { expect, login, test } from "./fixtures"

// Spec: next-frontend/specs/video-watch-social.plan.md (SI-06.21b + grupo 3
// do SI-06.21c)
//
// O upstream NestJS é fingido server-side pelo MSW do instrumentation.ts —
// NADA de page.route() sobre /api/**. Os cenários de erro usam os triggers
// reservados em mocks/factories/social.ts.
const SOCIAL_VIDEO = "social-video"
const LIKED_VIDEO = "liked-video"
const REACTION_FAILS_VIDEO = "reaction-fails-video"
const QUIET_VIDEO = "quiet-video"

/**
 * Espera a hidratação antes de clicar nos controles otimistas: antes dela o
 * clique cai no vazio e o teste falharia por corrida. O sinal é o toggle da
 * descrição, um client component que só responde depois de hidratado — a
 * hidratação do root cobre a árvore toda numa passada.
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

function reactionButtons(page: Page) {
  const reactions = page.locator("[data-slot='video-reactions']")
  return {
    like: (count: number) =>
      reactions.getByRole("button", { name: `Gostei · ${count}` }),
    dislike: reactions.getByRole("button", { name: "Não gostei" }),
  }
}

function countRequests(page: Page, fragment: string): () => number {
  let count = 0
  page.on("request", (request) => {
    if (request.url().includes(fragment)) count += 1
  })
  return () => count
}

test.describe("video-watch-social", () => {
  // 1. Reações e inscrição

  test("1.1 estado-pessoal-na-primeira-pintura", async ({ page }) => {
    await login(page, "user@example.com")

    // O HTML servido já carrega o estado pessoal: a asserção é sobre a
    // resposta do documento, antes de qualquer JavaScript rodar.
    const response = await page.request.get(`/videos/${LIKED_VIDEO}`)
    const html = await response.text()
    const likeTag = html.match(/<button[^>]*data-slot="like-button"[^>]*>/)?.[0]
    expect(likeTag).toContain('aria-pressed="true"')

    await page.goto(`/videos/${LIKED_VIDEO}`)
    const { like, dislike } = reactionButtons(page)
    await expect(like(128)).toHaveAttribute("aria-pressed", "true")
    await expect(dislike).toHaveAttribute("aria-pressed", "false")
    await expect(page.getByRole("button", { name: "Inscrito" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Sair" })).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Canais seguidos" })
    ).toBeVisible()
  })

  test("1.2 dislike-troca-o-like", async ({ page }) => {
    await login(page, "user@example.com")
    await page.goto(`/videos/${LIKED_VIDEO}`)
    await waitForHydration(page)
    const { like, dislike } = reactionButtons(page)
    await expect(like(128)).toHaveAttribute("aria-pressed", "true")

    const response = page.waitForResponse(
      (r) =>
        r.url().includes(`/api/videos/${LIKED_VIDEO}/reaction`) &&
        r.request().method() === "PUT"
    )
    await dislike.click()

    await expect(dislike).toHaveAttribute("aria-pressed", "true")
    await expect(like(127)).toHaveAttribute("aria-pressed", "false")
    await expect(dislike).toHaveText("Não gostei")

    expect((await response).status()).toBe(200)
    await expect(dislike).toHaveAttribute("aria-pressed", "true")
    await expect(like(127)).toHaveAttribute("aria-pressed", "false")
  })

  test("1.3 inscrever-atualiza-botao-e-contagem", async ({ page }) => {
    await login(page, "user@example.com")
    await page.goto(`/videos/${SOCIAL_VIDEO}`)
    await waitForHydration(page)

    const count = page.locator("[data-slot='subscriber-count']")
    await expect(count).toHaveText("1,2 mil inscritos")

    const response = page.waitForResponse(
      (r) =>
        r.url().includes("/api/channels/maria_rocha/subscription") &&
        r.request().method() === "PUT"
    )
    await page.getByRole("button", { name: "Inscrever-se" }).click()

    await expect(
      page.getByRole("button", { name: "Inscrito" })
    ).toHaveAttribute("aria-pressed", "true")

    expect((await response).status()).toBe(200)
    await expect(page.getByRole("button", { name: "Inscrito" })).toBeVisible()
    // 1200 + 1 continua "1,2 mil" na forma abreviada pt-BR: a contagem não
    // muda de texto neste fixture. O delta otimista dela é coberto no Vitest
    // do ChannelSubscriptionProvider; aqui basta que ela siga renderizada.
    await expect(count).toHaveText("1,2 mil inscritos")
  })

  test("1.4 falha-na-reacao-reverte", async ({ page }) => {
    await login(page, "user@example.com")
    await page.goto(`/videos/${REACTION_FAILS_VIDEO}`)
    await waitForHydration(page)
    const { like } = reactionButtons(page)
    await expect(like(128)).toHaveAttribute("aria-pressed", "false")

    const response = page.waitForResponse((r) =>
      r.url().includes(`/api/videos/${REACTION_FAILS_VIDEO}/reaction`)
    )
    await like(128).click()

    expect((await response).status()).toBe(429)
    await expect(like(128)).toHaveAttribute("aria-pressed", "false")
    await expect(page.locator("[data-slot='reaction-error']")).toBeVisible()
    await expect(page.locator("video")).toBeVisible()
  })

  // 2. Visitante anônimo

  test("2.1 anonimo-vai-ao-login-e-volta", async ({ page }) => {
    const reactionRequests = countRequests(
      page,
      `/api/videos/${SOCIAL_VIDEO}/reaction`
    )
    await page.goto(`/videos/${SOCIAL_VIDEO}`)
    const { like, dislike } = reactionButtons(page)
    await expect(like(128)).toBeVisible()
    await expect(dislike).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Inscrever-se" })
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible()
    await waitForHydration(page)

    await like(128).click()

    await expect(page).toHaveURL("/login?returnTo=%2Fvideos%2Fsocial-video")
    expect(reactionRequests()).toBe(0)

    await page.getByLabel("E-mail").fill("user@example.com")
    await page.getByLabel("Senha", { exact: true }).fill("secret123")
    // Dois saltos: o POST do login e a renderização da página de volta, já
    // com sessão. Esperar a resposta do login primeiro, como o helper
    // `login()` das fixtures, separa os dois prazos.
    const loginResponse = page.waitForResponse(
      (r) =>
        r.url().includes("/api/auth/login") && r.request().method() === "POST"
    )
    await page.getByRole("button", { name: "Entrar" }).click()
    expect((await loginResponse).status()).toBe(200)

    await expect(page).toHaveURL(`/videos/${SOCIAL_VIDEO}`, { timeout: 15_000 })
    await expect(page.getByRole("button", { name: "Sair" })).toBeVisible()
    await expect(like(128)).toHaveAttribute("aria-pressed", "false")
    expect(reactionRequests()).toBe(0)
  })

  // 3. Fluxo de comentários (ACs do SI-06.21c)

  test("3.1 publicar-comentario-aparece-no-topo", async ({ page }) => {
    await login(page, "user@example.com")
    await page.goto(`/videos/${SOCIAL_VIDEO}`)
    await waitForHydration(page)
    const section = page.locator("[data-slot='comments-section']")
    await expect(
      section.getByRole("heading", { name: "12 comentários" })
    ).toBeVisible()
    await expect(section.getByText("Mais recentes primeiro")).toBeVisible()

    const composer = section.getByLabel("Seu comentário")
    await composer.fill("Ótimo vídeo")
    await section.getByRole("button", { name: "Comentar" }).click()

    const firstThread = section.locator("[data-slot='comment-thread']").first()
    await expect(firstThread).toContainText("Ótimo vídeo")
    await expect(
      section.getByRole("heading", { name: "13 comentários" })
    ).toBeVisible()
    await expect(composer).toHaveValue("")

    const posts = countRequests(page, `/api/videos/${SOCIAL_VIDEO}/comments`)
    await composer.fill("   ")
    await expect(
      section.getByRole("button", { name: "Comentar" })
    ).toBeDisabled()
    expect(posts()).toBe(0)
  })

  test("3.2 responder-a-resposta-cria-irma", async ({ page }) => {
    await login(page, "user@example.com")
    await page.goto(`/videos/${SOCIAL_VIDEO}`)
    await waitForHydration(page)
    const thread = page.locator("[data-slot='comment-thread']").first()
    const replies = thread.locator("[data-slot='reply-list']")

    await replies.locator("[data-slot='reply-button']").first().click()
    const composer = thread.getByLabel("Sua resposta")
    await expect(composer).toBeVisible()

    await composer.fill("Concordo")
    await thread
      .getByRole("button", { name: "Responder", exact: true })
      .last()
      .click()

    // Irmã sob a mesma raiz: aparece no topo da lista de respostas da thread,
    // nunca aninhada sob a resposta clicada.
    await expect(replies.getByRole("listitem").first()).toContainText(
      "Concordo"
    )
    await expect(replies.locator("[data-slot='reply-list']")).toHaveCount(0)
  })

  test("3.3 ver-mais-respostas-e-mais-comentarios", async ({ page }) => {
    await page.goto(`/videos/${SOCIAL_VIDEO}`)
    await waitForHydration(page)
    const threads = page.locator("[data-slot='comment-thread']")
    const replies = threads
      .first()
      .locator("[data-slot='reply-list']")
      .getByRole("listitem")
    await expect(threads).toHaveCount(10)
    await expect(replies).toHaveCount(3)

    await page.getByRole("button", { name: "Ver mais 4 respostas" }).click()
    await expect(replies).toHaveCount(7)
    await expect(
      page.getByRole("button", { name: /Ver mais \d+ resposta/ })
    ).toHaveCount(0)

    await page
      .getByRole("button", { name: "Carregar mais comentários" })
      .click()
    await expect(threads).toHaveCount(12)
    await expect(
      page.getByRole("button", { name: "Carregar mais comentários" })
    ).toHaveCount(0)
  })

  test("3.4 video-sem-comentarios", async ({ page }) => {
    await page.goto(`/videos/${QUIET_VIDEO}`)
    const section = page.locator("[data-slot='comments-section']")
    await expect(
      section.getByRole("heading", { name: "0 comentários" })
    ).toBeVisible()
    await expect(section.getByLabel("Seu comentário")).toBeVisible()
    await expect(section.locator("[data-slot='comments-empty']")).toBeVisible()
    await expect(
      section.getByRole("button", { name: "Carregar mais comentários" })
    ).toHaveCount(0)
  })
})
