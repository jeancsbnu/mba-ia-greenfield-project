/** Parâmetro de query com que a ponte de confirmação volta ao login. */
export const CONFIRMATION_PARAM = "confirmation"

/**
 * Desfecho da visita ao link de confirmação:
 * - `confirmed`: a API confirmou (204, inclusive na segunda visita ao link);
 * - `invalid`: sem token, ou token inválido/expirado (401);
 * - `error`: qualquer outra falha (rate limit, API fora) — o link pode valer.
 */
export type ConfirmationOutcome = "confirmed" | "invalid" | "error"

const OUTCOMES: readonly ConfirmationOutcome[] = ["confirmed", "invalid", "error"]

/** Lê o parâmetro da URL; valores desconhecidos não viram aviso. */
export function parseConfirmationOutcome(
  raw: string | string[] | undefined
): ConfirmationOutcome | null {
  const value = Array.isArray(raw) ? raw[0] : raw
  return OUTCOMES.find((outcome) => outcome === value) ?? null
}

/** Desfecho a partir do status HTTP da confirmação no upstream. */
export function outcomeFromStatus(status: number): ConfirmationOutcome {
  if (status >= 200 && status < 300) return "confirmed"
  if (status === 401) return "invalid"
  return "error"
}
