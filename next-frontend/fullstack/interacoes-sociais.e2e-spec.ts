import { expect, test } from "@playwright/test"

import {
  createConfirmedAccount,
  loginThroughUi,
  publishVideo,
  uniqueSuffix,
} from "./helpers"

// Fluxo 4 (testes-producao/TD-01): like, comentário e inscrição feitos por uma
// segunda conta no vídeo de outra, persistidos na API real.
test.describe("interacoes-sociais", () => {
  test("like, comentário e inscrição persistem depois de recarregar", async ({
    page,
    request,
    playwright,
    baseURL,
  }) => {
    const owner = await createConfirmedAccount(request, "dono")
    const publicId = await publishVideo(
      request,
      owner,
      `Social ${uniqueSuffix()}`,
      "Entretenimento"
    )

    // Contexto HTTP separado: o `request` acima ficou logado como o dono.
    const signup = await playwright.request.newContext({ baseURL })
    const viewer = await createConfirmedAccount(signup, "espectador")
    await signup.dispose()

    await loginThroughUi(page, viewer, `/videos/${publicId}`)

    // As três ações são otimistas: a tela muda antes de a API responder. Cada
    // passo espera a resposta do BFF, senão o reload abortaria o POST em voo.
    const mutation = (pathPart: string) =>
      page.waitForResponse(
        (response) =>
          response.request().method() !== "GET" &&
          new URL(response.url()).pathname.includes(pathPart)
      )

    const reactions = page.locator("[data-slot='video-reactions']")
    const reacted = mutation("/reaction")
    await reactions.getByRole("button", { name: "Gostei · 0" }).click()
    expect((await reacted).ok()).toBe(true)
    await expect(
      reactions.getByRole("button", { name: "Gostei · 1" })
    ).toHaveAttribute("aria-pressed", "true")

    const comment = `Comentário da suíte ${uniqueSuffix()}`
    const comments = page.locator("[data-slot='comments-section']")
    await comments.getByLabel("Seu comentário").fill(comment)
    const commented = mutation("/comments")
    await comments.getByRole("button", { name: "Comentar" }).click()
    expect((await commented).ok()).toBe(true)
    await expect(comments.getByText(comment)).toBeVisible()

    const subscribed = mutation("/subscription")
    await page.getByRole("button", { name: "Inscrever-se" }).click()
    expect((await subscribed).ok()).toBe(true)
    await expect(page.getByRole("button", { name: "Inscrito" })).toBeVisible()

    await page.reload()
    await expect(
      reactions.getByRole("button", { name: "Gostei · 1" })
    ).toHaveAttribute("aria-pressed", "true")
    await expect(comments.getByText(comment)).toBeVisible()
    await expect(page.getByRole("button", { name: "Inscrito" })).toBeVisible()
  })
})
