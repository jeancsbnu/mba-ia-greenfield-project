import { readdirSync } from "node:fs"
import path from "node:path"

import type { FullConfig } from "@playwright/test"

// Roda uma vez, antes do primeiro teste. Duas tarefas:
//
// 1. Preflight — confirma que o dev server conteinerizado responde E que o
//    MSW do instrumentation.ts subiu. Sem isso, um boot que perdeu o MSW
//    (corrida descrita em next-frontend/CLAUDE.md) vira dezenas de falhas de
//    timeout sem nenhuma pista da causa.
// 2. Aquecimento — visita cada rota do app uma vez, para o Turbopack compilar
//    tudo aqui, sem prazo de teste correndo. Num `.next` zerado, a primeira
//    compilação de cada rota passa dos 5 s de um `expect` com folga.
//
// A lista de rotas sai da varredura de `app/`, não de uma lista à mão: rota
// nova entra no aquecimento sem ninguém lembrar de atualizar este arquivo.

const APP_DIR = path.join(__dirname, "..", "app")

// Página que só renderiza 200 com o upstream fingido: com o MSW fora do ar o
// fetch vaza para o API_URL real e a página devolve 500 (ou 404, se houver um
// NestJS de verdade escutando). Fixture de mocks/handlers/videos.ts.
const MSW_PROBE = "/videos/watch-video"

// Compilação a frio de uma rota pesada passa de um minuto quando o contêiner
// está disputado; o prazo aqui é de folga, não de desempenho.
const REQUEST_TIMEOUT_MS = 180_000

// Tempo para o `next dev` recém-iniciado começar a aceitar conexões.
const SERVER_BOOT_TIMEOUT_MS = 90_000

/**
 * Converte o caminho de um `page.tsx`/`route.ts` em URL: tira route groups
 * `(x)`, troca segmento dinâmico `[x]` por um valor qualquer e descarta
 * catch-all opcional `[[...x]]`. O valor do segmento não importa — uma página
 * que responde 404 ou redireciona para o login também foi compilada.
 */
function toUrl(file: string): string {
  const segments = path
    .relative(APP_DIR, path.dirname(file))
    .split(path.sep)
    .filter((segment) => segment !== "" && !/^\(.+\)$/.test(segment))
    .filter((segment) => !segment.startsWith("[[..."))
    .map((segment) => (segment.startsWith("[") ? "warmup" : segment))
  return `/${segments.join("/")}`
}

function discoverRoutes(): string[] {
  const entries = readdirSync(APP_DIR, { recursive: true, encoding: "utf8" })
  return entries
    .filter((entry) => !entry.split(path.sep).includes("__tests__"))
    .filter((entry) => /(^|[\\/])(page\.tsx|route\.ts)$/.test(entry))
    .map((entry) => toUrl(path.join(APP_DIR, entry)))
    .sort()
}

async function request(url: string): Promise<number> {
  const response = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  // Consumir o corpo garante que a renderização terminou, não só o cabeçalho.
  await response.arrayBuffer()
  return response.status
}

/**
 * Espera o dev server começar a escutar. Logo depois do `npm run dev` a
 * conexão é recusada por algumas dezenas de segundos — isso é boot, não falha.
 * Só desiste depois de SERVER_BOOT_TIMEOUT_MS sem resposta.
 */
async function waitForServer(baseURL: string): Promise<void> {
  const deadline = Date.now() + SERVER_BOOT_TIMEOUT_MS
  let lastError: unknown
  while (Date.now() < deadline) {
    try {
      await request(`${baseURL}/login`)
      return
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 2_000))
    }
  }
  throw new Error(
    `Dev server não responde em ${baseURL}. Suba com:\n` +
      `  docker compose exec -d next-frontend sh -c "MSW_ENABLED=true npm run dev"\n` +
      `(causa: ${String(lastError)})`
  )
}

async function preflight(baseURL: string): Promise<void> {
  await waitForServer(baseURL)

  const status = await request(`${baseURL}${MSW_PROBE}`)
  if (status !== 200) {
    throw new Error(
      `${MSW_PROBE} respondeu ${String(status)}: o MSW do instrumentation.ts não ` +
        `subiu neste boot do dev server. Reinicie o contêiner e suba o dev ` +
        `server num comando separado (ver "Restarting the dev server" em ` +
        `next-frontend/CLAUDE.md).`
    )
  }
}

async function warmUp(baseURL: string): Promise<void> {
  const routes = discoverRoutes()
  const started = Date.now()
  // Sequencial de propósito: as compilações disputam os mesmos núcleos do
  // contêiner, e em paralelo cada uma só ficaria mais lenta.
  for (const route of routes) {
    await request(`${baseURL}${route}`)
  }
  const seconds = ((Date.now() - started) / 1000).toFixed(1)
  console.log(
    `[global-setup] ${String(routes.length)} rotas aquecidas em ${seconds}s`
  )
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use.baseURL
  if (!baseURL) {
    throw new Error("playwright.config.ts precisa definir use.baseURL")
  }

  await preflight(baseURL)

  // PW_WARMUP=0 pula o aquecimento — útil para rodar uma spec só contra um
  // servidor já quente. O preflight continua valendo.
  if (process.env.PW_WARMUP !== "0") {
    await warmUp(baseURL)
  }
}
