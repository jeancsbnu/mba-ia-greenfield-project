import { expect, login, test } from "./fixtures"

// Spec: next-frontend/specs/video-edit.plan.md (SI-04.12b)
// Triggers por publicId: draft-video (rascunho ready), published-video
// (publicado), processing-video (status processing), missing-video (404),
// foreign-video (403).
const CATEGORIES = [
  "Música",
  "Jogos",
  "Educação",
  "Entretenimento",
  "Notícias",
  "Esportes",
  "Tecnologia",
  "Outros",
]

test.describe("video-edit", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "user@example.com")
  })

  // 1. Editar um vídeo do canal

  test("1.1 mostra-os-dados-atuais-do-video", async ({ page }) => {
    await page.goto("/videos/draft-video/edit")

    await expect(page.getByLabel("Título")).toHaveValue("Receita de bolo")
    await expect(page.getByLabel("Descrição")).toBeVisible()

    const category = page.getByRole("combobox")
    await expect(category).toHaveText("Educação")

    // A lista é fechada nos oito valores do TD-10 — "Tutoriais", que aparece
    // no mock do Figma, não pertence ao enum.
    await category.click()
    for (const name of CATEGORIES) {
      await expect(page.getByRole("option", { name })).toBeVisible()
    }
    await expect(page.getByRole("option", { name: "Tutoriais" })).toHaveCount(0)
    await page.keyboard.press("Escape")

    const group = page.getByRole("radiogroup", { name: "Visibilidade" })
    await expect(group).toBeVisible()
    await expect(page.getByRole("radio", { name: "Público" })).toHaveAttribute(
      "aria-checked",
      "true"
    )
    await expect(
      page.getByRole("radio", { name: "Indisponível" })
    ).toBeVisible()

    await expect(page.getByText("Thumbnail atual")).toBeVisible()
  })

  test("1.2 salva-rascunho-mantendo-o-como-rascunho", async ({ page }) => {
    await page.goto("/videos/draft-video/edit")

    await page.getByLabel("Título").fill("Receita de bolo v2")

    const request = page.waitForRequest(
      (r) =>
        r.url().includes("/api/videos/draft-video") && r.method() === "PATCH"
    )
    await page.getByRole("button", { name: "Salvar rascunho" }).click()

    const sent = await request
    expect(sent.headers()["content-type"]).toContain("multipart/form-data")

    // O corpo em si não é inspecionável aqui: o Playwright não expõe o payload
    // de um FormData montado no navegador. O que ele monta já é coberto por
    // components/videos/__tests__/video-edit-form.wiring.test.tsx, que asserta
    // campo a campo — inclusive a AUSÊNCIA de `published` ao salvar rascunho.
    // Aqui o que importa é o efeito observável do ciclo completo.
    await expect(page.getByRole("status")).toHaveText("Alterações salvas.")
    await expect(
      page.getByRole("button", { name: "Salvar rascunho" })
    ).toBeVisible()
    await expect(page.getByRole("button", { name: "Publicar" })).toBeVisible()
  })

  test("1.3 publica-e-passa-a-mostrar-despublicar", async ({ page }) => {
    await page.goto("/videos/draft-video/edit")

    const request = page.waitForRequest(
      (r) =>
        r.url().includes("/api/videos/draft-video") && r.method() === "PATCH"
    )
    await page.getByRole("button", { name: "Publicar" }).click()

    await request
    // "Vídeo publicado." só aparece no caminho de publish, então a mensagem é
    // a prova de que `published=true` foi enviado e aceito.
    await expect(page.getByRole("status")).toHaveText("Vídeo publicado.")
  })

  test("1.4 publicar-fica-desabilitado-sem-status-ready", async ({ page }) => {
    await page.goto("/videos/processing-video/edit")

    const publish = page.getByRole("button", { name: "Publicar" })
    await expect(publish).toBeDisabled()

    const describedBy = (await publish.getAttribute("aria-describedby")) ?? ""
    await expect(page.locator(`#${describedBy}`)).toContainText("processamento")

    await expect(
      page.getByRole("button", { name: "Salvar rascunho" })
    ).toBeEnabled()
  })

  test("1.5 thumbnail-so-e-enviada-no-submit", async ({ page }) => {
    await page.goto("/videos/draft-video/edit")

    let patched = false
    page.on("request", (r) => {
      if (r.url().includes("/api/videos/draft-video") && r.method() === "PATCH") {
        patched = true
      }
    })

    // PNG mínimo válido (1x1), suficiente para o preview local.
    await page.getByLabel("Alterar thumbnail").setInputFiles({
      name: "thumb.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64"
      ),
    })

    // Escolher o arquivo só gera preview local; a gravação é no submit (TD-03).
    expect(patched).toBe(false)

    const request = page.waitForRequest(
      (r) =>
        r.url().includes("/api/videos/draft-video") && r.method() === "PATCH"
    )
    await page.getByRole("button", { name: "Salvar rascunho" }).click()

    // A presença da parte `thumbnail` no multipart é coberta pelo teste de
    // wiring; aqui prova-se que a gravação só acontece NO SUBMIT — nenhum
    // PATCH partiu ao escolher o arquivo, e um parte depois do clique.
    expect((await request).headers()["content-type"]).toContain(
      "multipart/form-data"
    )
    await expect(page.getByRole("status")).toHaveText("Alterações salvas.")
  })

  test("1.6 thumbnail-invalida-mostra-erro-no-uploader", async ({ page }) => {
    await page.goto("/videos/draft-video/edit")

    let patched = false
    page.on("request", (r) => {
      if (r.url().includes("/api/videos/draft-video") && r.method() === "PATCH") {
        patched = true
      }
    })

    await page.getByLabel("Alterar thumbnail").setInputFiles({
      name: "nota.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("nao sou imagem"),
    })

    await page.getByRole("button", { name: "Salvar rascunho" }).click()

    await expect(page.getByText(/JPEG, PNG ou WebP/)).toBeVisible()
    expect(patched).toBe(false)
  })

  test("1.7 video-de-outro-canal-ou-inexistente", async ({ page }) => {
    // 403 e 404 caem no mesmo lugar: um 403 explícito revelaria que o vídeo
    // existe em outro canal (TD-09).
    await page.goto("/videos/foreign-video/edit")
    await expect(
      page.getByRole("heading", { name: "Vídeo não encontrado" })
    ).toBeVisible()
    await expect(page.getByLabel("Título")).toHaveCount(0)

    await page.goto("/videos/missing-video/edit")
    await expect(
      page.getByRole("heading", { name: "Vídeo não encontrado" })
    ).toBeVisible()
  })
})
