import "server-only";
import createClient from "openapi-fetch";
import type { paths } from "./types.gen";
import { env } from "@/lib/env";

export const upstream = createClient<paths>({
  baseUrl: env.API_URL,
  // Resolver globalThis.fetch a CADA chamada, em vez de deixar o openapi-fetch
  // capturá-lo na criação do cliente. Este módulo carrega antes de o MSW trocar
  // o fetch global (tanto no instrumentation.ts do dev server quanto no
  // setupFiles do Vitest), então a referência capturada seria sempre a original
  // e nenhuma chamada ao upstream chegaria a ser interceptada.
  fetch: (request) => globalThis.fetch(request),
});
