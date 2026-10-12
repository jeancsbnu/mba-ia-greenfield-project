/**
 * Limites do termo de busca — os mesmos da query de GET /videos no backend
 * (home-busca/TD-04, Revision de 2026-10-11). O SearchForm os usa no
 * `minLength`/`maxLength`, e a ResultsPage repete a barreira no servidor.
 */
export const SEARCH_MIN_LENGTH = 3
export const SEARCH_MAX_LENGTH = 100

export type SearchTerm =
  | { kind: "empty" }
  | { kind: "short"; term: string }
  | { kind: "long"; term: string }
  | { kind: "valid"; term: string }

/**
 * Classifica o `q` da URL, já aparado nas pontas. Só `valid` chega ao
 * upstream: `empty` volta para a home, e `short`/`long` viram aviso sem
 * chamada — o backend responderia 400 a qualquer um dos dois.
 */
export function parseSearchTerm(raw: string | string[] | undefined): SearchTerm {
  const value = Array.isArray(raw) ? raw[0] : raw
  const term = (value ?? "").trim()

  if (term.length === 0) return { kind: "empty" }
  if (term.length < SEARCH_MIN_LENGTH) return { kind: "short", term }
  if (term.length > SEARCH_MAX_LENGTH) return { kind: "long", term }
  return { kind: "valid", term }
}
