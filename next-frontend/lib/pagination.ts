/** Itens por página do painel do dono (TD-06). */
export const OWNER_PAGE_SIZE = 10

/** Itens por página da vitrine pública — grid, não tabela (TD-06). */
export const PUBLIC_PAGE_SIZE = 8

/**
 * Normaliza o `page` da query string para um inteiro ≥ 1.
 *
 * Qualquer entrada inválida cai na página 1 em vez de virar erro: o valor vem
 * da URL, que o usuário edita à mão, e um 400 aqui seria hostil sem ganho.
 */
export function parsePage(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (value === undefined) return 1

  // Number() aceita "1e3", " 2 " e "0x10"; a checagem de dígitos evita isso.
  if (!/^\d+$/.test(value.trim())) return 1

  const parsed = Number(value.trim())
  if (!Number.isSafeInteger(parsed) || parsed < 1) return 1
  return parsed
}

/** Converte a página (base 1) no `offset` que a API espera (base 0). */
export function toOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize
}

/** Número de páginas para um total — sempre ≥ 1, para a página 1 existir vazia. */
export function totalPages(total: number, pageSize: number): number {
  if (total <= 0 || pageSize <= 0) return 1
  return Math.ceil(total / pageSize)
}
