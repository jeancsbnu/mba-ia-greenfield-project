import { expect, test } from "@playwright/test"

import {
  SAMPLE_VIDEO,
  createConfirmedAccount,
  loginThroughUi,
  uniqueSuffix,
} from "./helpers"

// Fluxo 2 (testes-producao/TD-01): envio pela tela de upload (tus atravessando
// Caddy e BFF) → processamento no worker real → publicação pela edição.
test.describe("upload-publicacao", () => {
  test("um vídeo enviado pela tela chega a publicado", async ({
    page,
    request,
  }) => {
    const email = await createConfirmedAccount(request, "upload")
    const title = `Upload da suíte ${uniqueSuffix()}`

    await loginThroughUi(page, email, "/upload")
    await page.getByLabel("Título").fill(title)
    await page.getByLabel("Arquivo de vídeo").setInputFiles(SAMPLE_VIDEO)

    const created = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname === "/api/videos/upload"
    )
    await page.getByRole("button", { name: "Enviar vídeo" }).click()
    const publicId = (await created).headers()["x-video-public-id"]
    expect(publicId).toBeTruthy()

    // O worker processa sem intervenção; a tela consulta o status até "ready".
    await expect(page.locator("[data-slot='upload-ready']")).toContainText(
      "Vídeo pronto!",
      { timeout: 90_000 }
    )

    // "Publicar" só habilita com o vídeo pronto, decidido no carregamento.
    await page.goto(`/videos/${publicId}/edit`)
    await page.getByRole("combobox").click()
    await page.getByRole("option", { name: "Tecnologia" }).click()
    await page
      .getByRole("radiogroup", { name: "Visibilidade" })
      .getByRole("radio", { name: "Público" })
      .click()
    await page.getByRole("button", { name: "Publicar" }).click()
    await expect(page.getByRole("status")).toContainText("Vídeo publicado.")

    await page.goto(`/videos/${publicId}`)
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title)
  })
})
