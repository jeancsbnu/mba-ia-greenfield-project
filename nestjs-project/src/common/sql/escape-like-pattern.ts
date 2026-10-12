/**
 * Escapa os curingas do `LIKE` (`%` e `_`) e o próprio caractere de escape,
 * para uso com `LIKE ... ESCAPE '\'`. Sem isso, um `_` digitado na busca —
 * comum em nickname — casaria qualquer caractere.
 */
export function escapeLikePattern(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}
