import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"

import { expect, type APIRequestContext, type Page } from "@playwright/test"

import { MAILPIT_URL } from "./stack"

export const PASSWORD = "senha-da-suite-123"

/** Vídeo de ~8 s (H.264 + AAC): acima do limiar de 5 s que conta a view. */
export const SAMPLE_VIDEO = path.join(__dirname, "fixtures", "sample.mp4")

/** Sufixo curto para títulos únicos, buscáveis (≥ 3 caracteres). */
export function uniqueSuffix(): string {
  return randomUUID().slice(0, 8)
}

/** E-mail único por chamada: cada jornada cria as próprias contas. */
export function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}@fullstack.test`
}

type MailpitSearch = { messages: { ID: string }[] }
type MailpitMessage = { Text: string }

/**
 * Link `/auth/{route}?token=` do e-mail que a API mandou para `email`, lido
 * pela API HTTP do Mailpit da stack da suíte. Espera o e-mail chegar (o envio
 * é assíncrono em relação à resposta) e percorre a caixa inteira do endereço:
 * a conta que pede recuperação de senha já recebeu o e-mail de confirmação.
 */
async function readMailLink(
  request: APIRequestContext,
  email: string,
  route: "confirm-email" | "reset-password"
): Promise<string> {
  const pattern = new RegExp(`https?://\\S+/auth/${route}\\?token=[0-9a-f]+`)
  let link = ""
  await expect
    .poll(
      async () => {
        const search = await request.get(`${MAILPIT_URL}/api/v1/search`, {
          params: { query: `to:${email}` },
        })
        const { messages } = (await search.json()) as MailpitSearch
        for (const { ID } of messages) {
          const message = await request.get(`${MAILPIT_URL}/api/v1/message/${ID}`)
          const { Text } = (await message.json()) as MailpitMessage
          link = Text.match(pattern)?.[0] ?? ""
          if (link) break
        }
        return link
      },
      { timeout: 15_000, message: `link /auth/${route} no e-mail para ${email}` }
    )
    .not.toBe("")
  return link
}

/** Link de confirmação de conta do e-mail enviado no cadastro. */
export function readConfirmationLink(
  request: APIRequestContext,
  email: string
): Promise<string> {
  return readMailLink(request, email, "confirm-email")
}

/** Link de redefinição do e-mail de recuperação de senha. */
export function readPasswordResetLink(
  request: APIRequestContext,
  email: string
): Promise<string> {
  return readMailLink(request, email, "reset-password")
}

/**
 * Cadastra e confirma uma conta pelas mesmas rotas do BFF que o site usa
 * (`/api/auth/signup` e a rota-ponte `/auth/confirm-email`). Volta o e-mail.
 */
export async function createConfirmedAccount(
  request: APIRequestContext,
  prefix: string
): Promise<string> {
  const email = uniqueEmail(prefix)
  const signup = await request.post("/api/auth/signup", {
    data: { email, password: PASSWORD },
  })
  expect(signup.status()).toBe(201)

  const link = await readConfirmationLink(request, email)
  const confirm = await request.get(link, { maxRedirects: 0 })
  expect(confirm.status()).toBe(303)
  return email
}

/**
 * Entra pela tela de login e espera chegar a `returnTo`, que as jornadas
 * sempre passam para não depender do destino padrão do login.
 */
export async function loginThroughUi(
  page: Page,
  email: string,
  returnTo: string,
  password: string = PASSWORD
): Promise<void> {
  await page.goto(`/login?returnTo=${encodeURIComponent(returnTo)}`)
  await page.getByLabel("E-mail").fill(email)
  await page.getByLabel("Senha", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Entrar" }).click()
  await expect(page).toHaveURL(returnTo, { timeout: 15_000 })
}

function tusMetadata(fields: Record<string, string>): string {
  return Object.entries(fields)
    .map(([key, value]) => `${key} ${Buffer.from(value).toString("base64")}`)
    .join(",")
}

type OwnerVideo = { status: string }

/**
 * Cria os dados das jornadas 3 a 5 sem depender da ordem dos arquivos: entra
 * com `email` num contexto HTTP próprio, envia o vídeo de exemplo pelo
 * protocolo tus às mesmas rotas do BFF que a tela de upload usa, espera o
 * worker deixá-lo `ready` e publica. Volta o `publicId`.
 */
export async function publishVideo(
  request: APIRequestContext,
  email: string,
  title: string,
  category: string
): Promise<string> {
  const login = await request.post("/api/auth/login", {
    data: { email, password: PASSWORD },
  })
  expect(login.status()).toBe(200)

  const file = readFileSync(SAMPLE_VIDEO)
  const create = await request.post("/api/videos/upload", {
    headers: {
      "Tus-Resumable": "1.0.0",
      "Upload-Length": String(file.length),
      "Upload-Metadata": tusMetadata({ title, filetype: "video/mp4" }),
    },
  })
  expect(create.status()).toBe(201)
  const publicId = create.headers()["x-video-public-id"]
  const location = create.headers()["location"]
  expect(publicId).toBeTruthy()

  const append = await request.patch(location, {
    headers: {
      "Tus-Resumable": "1.0.0",
      "Upload-Offset": "0",
      "Content-Type": "application/offset+octet-stream",
    },
    data: file,
  })
  expect(append.status()).toBe(204)

  await expect
    .poll(
      async () => {
        const res = await request.get(`/api/videos/${publicId}`)
        return ((await res.json()) as OwnerVideo).status
      },
      { timeout: 90_000, intervals: [2_000], message: `processamento de ${publicId}` }
    )
    .toBe("ready")

  const publish = await request.patch(`/api/videos/${publicId}`, {
    multipart: {
      title,
      description: "Vídeo criado pela suíte full-stack.",
      category,
      visibility: "public",
      published: "true",
    },
  })
  expect(publish.status()).toBe(200)
  return publicId
}
