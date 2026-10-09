import "server-only";
import { headers } from "next/headers";

import { env } from "@/lib/env";

// Headers de identidade que o BFF anexa a toda chamada server-side ao Nest
// (rate-limit-visitor-identity/TD-02). Todo visitante chega ao Nest pelo
// socket deste servidor, então o IP real viaja em `X-Client-IP`, e o Nest só
// acredita nele quando `X-Internal-Token` traz o segredo compartilhado.
export const CLIENT_IP_HEADER = "X-Client-IP";
export const INTERNAL_TOKEN_HEADER = "X-Internal-Token";

export async function visitorIdentityHeaders(): Promise<Record<string, string>> {
  const identity: Record<string, string> = {
    [INTERNAL_TOKEN_HEADER]: env.INTERNAL_API_SECRET,
  };
  const ip = await readVisitorIp();
  if (ip) {
    identity[CLIENT_IP_HEADER] = ip;
  }
  return identity;
}

// O primeiro valor do `x-forwarded-for` é o visitante. Até existir uma borda
// que sobrescreva esse header (TD-01), ele é o que o Next entrega — forjável.
// Fora do escopo de uma requisição (build, testes sem request) `headers()`
// lança; aí a chamada segue sem `X-Client-IP` e o Nest conta pelo socket.
async function readVisitorIp(): Promise<string | undefined> {
  try {
    const forwardedFor = (await headers()).get("x-forwarded-for");
    return forwardedFor?.split(",")[0]?.trim() || undefined;
  } catch {
    return undefined;
  }
}
