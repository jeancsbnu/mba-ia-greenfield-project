import { ReactionType } from './reaction-type.enum';

/**
 * Delta a aplicar em `likes_count` quando a reação de um usuário passa de
 * `previous` para `next` (social-interactions/TD-02). Função pura de propósito:
 * a aritmética do toggle é a parte com ramificação de verdade e precisa ser
 * testável sem banco. Dislike nunca conta (social-interactions/TD-03).
 *
 * | anterior → nova      | delta |
 * |----------------------|-------|
 * | nenhuma → like       | +1    |
 * | like → nenhuma       | −1    |
 * | like → dislike       | −1    |
 * | dislike → like       | +1    |
 * | nenhuma ↔ dislike    | 0     |
 * | qualquer → a mesma   | 0     |
 */
export function likesDelta(
  previous: ReactionType | null,
  next: ReactionType | null,
): number {
  const wasLike = previous === ReactionType.LIKE ? 1 : 0;
  const isLike = next === ReactionType.LIKE ? 1 : 0;
  return isLike - wasLike;
}
