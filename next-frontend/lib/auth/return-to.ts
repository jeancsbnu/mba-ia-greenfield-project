import { DEFAULT_RETURN_TO } from "@/lib/auth/refresh-redirect"

/** Nome do parâmetro de query que carrega o ponto de retorno. */
export const RETURN_TO_PARAM = "returnTo"

/**
 * Só caminhos internos são aceitos. `//host` e `/\host` são rejeitados porque o
 * navegador os trata como URL protocol-relative — seriam um open redirect.
 * Compartilhado pela rota de refresh e pelo login
 * (social-interactions-anonymous-gate/TD-03).
 */
export function safeReturnTo(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/")) return DEFAULT_RETURN_TO
  if (raw.startsWith("//") || raw.startsWith("/\\")) return DEFAULT_RETURN_TO
  return raw
}

/**
 * Destino do clique do visitante anônimo num controle de ação: o login, levando
 * o ponto de onde ele saiu (social-interactions-anonymous-gate/TD-01 e TD-03).
 */
export function buildLoginHref(returnTo: string): string {
  return `/login?${RETURN_TO_PARAM}=${encodeURIComponent(returnTo)}`
}
