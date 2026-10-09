import type { Throttle } from '@nestjs/throttler';

// A interface de opções do `@Throttle` não é exportada pela lib; o tipo vem
// do próprio parâmetro do decorator.
type ThrottleBudget = Parameters<typeof Throttle>[0];

/**
 * Orçamento das rotas de autenticação sensíveis a brute force e a abuso de
 * e-mail (rate-limit-visitor-identity/TD-04, Option B): `register`,
 * `confirm-email`, `resend-confirmation`, `login`, `forgot-password` e
 * `reset-password`. Aperta o default global de 120/60 s registrado em
 * `auth.module.ts`; `refresh`, `logout` e `me` ficam no default.
 */
export const AUTH_THROTTLE: ThrottleBudget = {
  default: { limit: 10, ttl: 60_000 },
};
