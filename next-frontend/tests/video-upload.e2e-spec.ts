import type { Page } from "@playwright/test"

import { expect, test } from "./fixtures"

// 1 spec → 1 file with one describe (feature = target_file stem) + N test() blocks.
// Upstream is faked server-side by mocks/ MSW via instrumentation.ts. No
// page.route() of /api/** — that would short-circuit the real Route Handlers
// (tus proxy + status proxy). Per-scenario outcomes use reserved trigger
// values baked into mocks/handlers/videos.ts:
//   - title "trigger-upload-too-large" → 400 UPLOAD_FILE_TOO_LARGE on create
//   - title "flaky-upload" → first chunk PATCH fails once, then succeeds
//   - title "trigger-poll-then-ready" → GET reports "processing" for the
//     first 2 polls, then "ready"
async function loginAsUploader(page: Page) {
  await page.goto("/login")
  await page.getByLabel("Email address").fill("uploader@example.com")
  await page.getByLabel("Password", { exact: true }).fill("secret123")
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect
    .poll(
      async () =>
        (await page.context().cookies()).some((c) =>
          c.name.includes("session")
        ),
      // Generous timeout: first hit after a fresh `next dev` start pays the
      // on-demand route-compile tax for /login + /api/auth/login.
      { timeout: 20000 }
    )
    .toBe(true)
}

test.describe("video-upload", () => {
  // 1. Upload de vídeo com barra de progresso e retomada (tus)

  test("1.1 upload-exibe-progresso-avancando-por-chunk", async ({ page }) => {
    await loginAsUploader(page)
    await page.goto("/upload")

    await page.getByLabel("Título").fill("Meu vídeo de teste")
    // 6MB — bigger than the 5MB chunkSize, so the upload spans 2 PATCH chunks.
    await page.getByLabel("Arquivo de vídeo").setInputFiles({
      name: "video.mp4",
      mimeType: "video/mp4",
      buffer: Buffer.alloc(6 * 1024 * 1024, 1),
    })
    await page.getByRole("button", { name: "Enviar vídeo" }).click()

    const seenValues = new Set<string>()
    await expect
      .poll(
        async () => {
          const value = await page
            .getByRole("progressbar")
            .getAttribute("aria-valuenow")
          if (value) seenValues.add(value)
          return seenValues.size
        },
        { timeout: 10000 }
      )
      .toBeGreaterThan(1)

    // Upload completes and the screen moves on to the processing state.
    await expect(page.locator("[data-slot='upload-processing']")).toBeVisible(
      { timeout: 10000 }
    )
  })

  test("1.2 upload-retomada-apos-queda-de-conexao", async ({ page }) => {
    await loginAsUploader(page)
    await page.goto("/upload")

    await page.getByLabel("Título").fill("flaky-upload")
    await page.getByLabel("Arquivo de vídeo").setInputFiles({
      name: "video.mp4",
      mimeType: "video/mp4",
      buffer: Buffer.alloc(6 * 1024 * 1024, 1),
    })
    await page.getByRole("button", { name: "Enviar vídeo" }).click()

    let maxSeen = 0
    let regressed = false
    await expect
      .poll(
        async () => {
          const value = await page
            .getByRole("progressbar")
            .getAttribute("aria-valuenow")
          const numeric = value ? Number(value) : 0
          if (numeric < maxSeen) regressed = true
          maxSeen = Math.max(maxSeen, numeric)
          return true
        },
        { timeout: 15000 }
      )
      .toBe(true)

    // Despite the simulated dropped connection on the first chunk, tus's
    // automatic retry (retryDelays) resumes and completes without the
    // progress bar ever going backwards.
    await expect(page.locator("[data-slot='upload-processing']")).toBeVisible(
      { timeout: 15000 }
    )
    expect(regressed).toBe(false)
  })

  // 2. Feedback de processamento pós-upload

  test("2.1 upload-concluido-poll-ate-status-mudar", async ({ page }) => {
    await loginAsUploader(page)
    await page.goto("/upload")

    await page.getByLabel("Título").fill("trigger-poll-then-ready")
    await page.getByLabel("Arquivo de vídeo").setInputFiles({
      name: "video.mp4",
      mimeType: "video/mp4",
      buffer: Buffer.from("small fixture video content"),
    })
    await page.getByRole("button", { name: "Enviar vídeo" }).click()

    await expect(page.locator("[data-slot='upload-processing']")).toBeVisible(
      { timeout: 10000 }
    )
    // The mock reports "processing" for the first two polls — the screen
    // must keep polling (not get stuck) until status leaves "processing".
    await expect(page.locator("[data-slot='upload-ready']")).toBeVisible({
      timeout: 10000,
    })
  })

  // 3. Tratamento de erros do backend sem vazar detalhes internos

  test("3.1 upload-erro-arquivo-grande-exibido-sem-detalhes-internos", async ({
    page,
  }) => {
    await loginAsUploader(page)
    await page.goto("/upload")

    await page.getByLabel("Título").fill("trigger-upload-too-large")
    await page.getByLabel("Arquivo de vídeo").setInputFiles({
      name: "video.mp4",
      mimeType: "video/mp4",
      buffer: Buffer.from("small fixture video content"),
    })
    await page.getByRole("button", { name: "Enviar vídeo" }).click()

    const alert = page.getByRole("alert")
    await expect(alert).toBeVisible({ timeout: 10000 })
    await expect(alert).toContainText(/excede o tamanho máximo permitido/)

    const alertText = (await alert.textContent()) ?? ""
    expect(alertText).not.toMatch(/UPLOAD_FILE_TOO_LARGE|statusCode|stack/i)

    // The form resets to idle so the user can retry.
    await expect(
      page.getByRole("button", { name: "Enviar vídeo" })
    ).toBeVisible()
  })
})
