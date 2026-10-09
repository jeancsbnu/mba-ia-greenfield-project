import type { Throttle } from '@nestjs/throttler';

// A interface de opções do `@Throttle` não é exportada pela lib; o tipo vem
// do próprio parâmetro do decorator.
type ThrottleBudget = Parameters<typeof Throttle>[0];

const ONE_MINUTE_MS = 60_000;

/**
 * Orçamentos de rate limit das rotas sociais de escrita
 * (social-interactions/TD-09, Option B — dois orçamentos por perfil de abuso,
 * `@Throttle` por rota, storage em memória). Sobrepõem o default global de
 * 120/60 s registrado em `auth.module.ts`; o rastreador é o do
 * `VisitorThrottlerGuard` (usuário autenticado ou IP do visitante —
 * rate-limit-visitor-identity/TD-03).
 */
export const SOCIAL_THROTTLE: {
  /** Reagir a vídeo, reagir a comentário, inscrever-se e cancelar. */
  REACTIONS: ThrottleBudget;
  /** Criar comentário ou resposta. */
  COMMENTS: ThrottleBudget;
} = {
  REACTIONS: { default: { limit: 60, ttl: ONE_MINUTE_MS } },
  COMMENTS: { default: { limit: 5, ttl: ONE_MINUTE_MS } },
};
