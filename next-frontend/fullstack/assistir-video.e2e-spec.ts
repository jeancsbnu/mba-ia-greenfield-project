import { expect, test } from "@playwright/test"

import { createConfirmedAccount, publishVideo, uniqueSuffix } from "./helpers"
import { STORAGE_HOST } from "./stack"

// Fluxo 3 (testes-producao/TD-01): a página do vídeo toca a mídia pela URL
// assinada no host do storage (Caddy → MinIO) e conta a view depois de 5 s de
// reprodução real (video-watch-page/TD-03).
test.describe("assistir-video", () => {
  test("a mídia vem do storage e a view é contada", async ({
    page,
    request,
  }) => {
    const owner = await createConfirmedAccount(request, "assistir")
    const title = `Assistir ${uniqueSuffix()}`
    const publicId = await publishVideo(request, owner, title, "Educação")

    const media = page.waitForResponse(
      (response) => new URL(response.url()).host === STORAGE_HOST
    )
    await page.goto(`/videos/${publicId}`)
    await expect(page.getByText("0 visualizações")).toBeVisible()

    const mediaResponse = await media
    expect([200, 206]).toContain(mediaResponse.status())

    // Reprodução de verdade (mudo, por causa da política de autoplay): o
    // player só registra a view depois de 5 s tocando.
    const view = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname === `/api/videos/${publicId}/view`,
      { timeout: 30_000 }
    )
    await page.locator("video").evaluate((video: HTMLVideoElement) => {
      video.muted = true
      return video.play()
    })
    expect((await view).ok()).toBe(true)

    await page.reload()
    await expect(page.getByText("1 visualizações")).toBeVisible()
  })
})
