import "server-only";
import createClient from "openapi-fetch";
import type { paths } from "./types.gen";
import { env } from "@/lib/env";

import { visitorIdentityHeaders } from "./visitor-identity";

export const upstream = createClient<paths>({
  baseUrl: env.API_URL,
  // Resolver globalThis.fetch a CADA chamada, em vez de deixar o openapi-fetch
  // capturá-lo na criação do cliente. Este módulo carrega antes de o MSW trocar
  // o fetch global (tanto no instrumentation.ts do dev server quanto no
  // setupFiles do Vitest), então a referência capturada seria sempre a original
  // e nenhuma chamada ao upstream chegaria a ser interceptada.
  // Antes de delegar, anexa a identidade do visitante para o rate limit do
  // Nest (rate-limit-visitor-identity/TD-02).
  fetch: async (request) => {
    for (const [name, value] of Object.entries(await visitorIdentityHeaders())) {
      request.headers.set(name, value);
    }
    return globalThis.fetch(request);
  },
});
