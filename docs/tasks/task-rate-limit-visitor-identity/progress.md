# task-rate-limit-visitor-identity — Progress

**Status:** completed
**SIs:** 6/6 completed

### SI-1 — Infra: segredo `INTERNAL_API_SECRET` no Nest
- **Status:** completed
- **Tests:** 6 passing (`env.validation.integration-spec.ts`: 2 novos de `INTERNAL_API_SECRET` + 4 existentes)
- **Observations:**
  - Factory de domínio criado como `src/config/internal-api.config.ts` (`registerAs('internalApi')`, campo `secret`) e carregado no `app.module.ts`; o `worker.module.ts` só valida o schema, sem carregar o factory, porque o worker não usa o guard.
  - O header do segredo é `X-Internal-Token` — o nome da Option A de TD-02 no decisions doc, que o `### API Contracts` marcou como `_undetermined_`.
  - ACs observados no container: sem a chave (`INTERNAL_API_SECRET=` vazio, que vence o `.env`) o `node dist/main` sai com `Config validation error: "INTERNAL_API_SECRET" is not allowed to be empty`; com a chave, `curl localhost:3000` → 200; `video-worker` rebuildado e reiniciado, `running restarts=0`.
  - O `compose.override.yaml` local troca o comando do `nestjs-api` por `tail -f /dev/null`, então o dev server não sobe sozinho — o 200 foi observado com `node dist/main` iniciado à mão.
  - Acrescentei a chave também ao `nestjs-project/.env` local (gitignored), senão o boot fora do compose quebra.

### SI-2 — Rastreador do throttler: usuário ou IP confiável
- **Status:** completed
- **Tests:** 7 passing em `visitor-throttler.guard.spec.ts`; regressão de `jwt-auth.guard.spec.ts` + `auth.module.integration-spec.ts` verde (16 no total); `tsc --noEmit` e eslint dos arquivos tocados limpos
- **Observations:**
  - Nomes dos headers em `src/auth/auth.constants.ts` (`x-client-ip`, `x-internal-token`), para o e2e do SI-3 reutilizar.
  - Comparação em tempo constante feita sobre os digests SHA-256 do token e do segredo: `timingSafeEqual` exige buffers do mesmo tamanho, e comparar digests evita vazar o tamanho do segredo. Header repetido (array) é tratado como ausente.
  - `auth.module.integration-spec.ts` passou a carregar `internalApiConfig` — o guard injeta o factory e o teste de compilação do módulo quebraria sem ele.
  - Os ACs de HTTP (baldes por IP com segredo válido, IP forjado ignorado, Bearer por usuário, sem 4xx) ficam provados no e2e do SI-3, como o próprio plano registra; aqui ficaram cobertos no nível da chave.

### SI-3 — Orçamentos: default de leitura e `AUTH_THROTTLE` explícito
- **Status:** completed
- **Tests:** 73 passing em 5 suítes e2e — `throttle-visitor-identity.e2e-spec.ts` (novo) + regressão de `auth`, `channels-subscription`, `videos-comments-create` e `videos-view-count`; `tsc --noEmit` e eslint limpos
- **Observations:**
  - O e2e novo também cobre os ACs de HTTP do SI-2: baldes separados por `X-Client-IP` confiável, IP forjado ignorado com token errado ou ausente, PATCH autenticado contado por usuário com 121 IPs diferentes, e token errado sem 4xx (GET público → 200).
  - Nenhum e2e existente precisou de ajuste: os que assertam 429 batem em `login`/`forgot-password` (agora com `AUTH_THROTTLE`, mesmo 10/60 s) ou em rotas com `@Throttle` próprio.
  - Comentários que citavam o default antigo de 10/60 s atualizados em `social-throttle.constants.ts` e `videos.controller.ts` (rota de view). A `description` do Swagger da view ainda diz "per IP" — não mexi para não regenerar o `openapi.json` fora do escopo.

### SI-4 — Identidade do visitante no BFF (Setup)
- **Status:** completed
- **Tests:** no tests (Setup — comportamento coberto em SI-5 e SI-6)
- **Observations:**
  - Helper exporta `visitorIdentityHeaders()` e as constantes `CLIENT_IP_HEADER`/`INTERNAL_TOKEN_HEADER`; degrada para só o token quando `headers()` lança (fora de request, ou mock de `next/headers` sem `headers`, como nas suítes existentes).
  - AC de env observado no container: sem `INTERNAL_API_SECRET` o `createEnv` acusa `Invalid environment variables` com `path: [ 'INTERNAL_API_SECRET' ]`; com a chave, carrega.
  - O `next-frontend/CLAUDE.md` cita um `.env.example` que não existe no repositório; a chave foi para o `.env` local (gitignored), com o mesmo valor de dev do compose do Nest.

### SI-5 — `next-frontend/lib/api/upstream.ts` → identidade do visitante (Migration)
- **Status:** completed
- **Tests:** 16 passing — `visitor-identity.test.ts` (4) e `upstream.integration.test.ts` (3) novos + regressão de `server-upstream.test.ts` e `optional-auth.test.ts`
- **Observations:** none

### SI-6 — `next-frontend/lib/auth/refresh.ts` → identidade do visitante (Migration)
- **Status:** completed
- **Tests:** 5 passing em `refresh.integration.test.ts` (1 novo; o single-flight segue coberto pelo teste existente)
- **Observations:** none

## Final verification (2026-10-08)

- Backend unit + integration: 313/321 na suíte inteira — as 8 falhas são todas de `subscriptions.service.integration-spec.ts` com `Unhandled error. ([Error: Connection is closed.])` do BullMQ (fila fechada cedo por outro arquivo, padrão já conhecido); o arquivo isolado passa 9/9 e não é tocado por esta task.
- Backend e2e: 163/163 (25 suítes).
- Backend `tsc --noEmit`: limpo. `npm run lint`: 0 erros, 1 warning pré-existente em `auth.service.integration-spec.ts`.
- Frontend Vitest: 439/439 (81 arquivos). `tsc --noEmit`: limpo. `npm run lint`: 0 erros, 3 warnings pré-existentes (`react-hooks/incompatible-library` em formulários com `watch()`).
- Playwright: nenhuma rodada completa saiu 65/65. 1ª: o preflight acusou MSW ausente no boot (`fetch failed` vazando para o upstream real) — reiniciado o container conforme o CLAUDE.md. 2ª: 63/65, 2 timeouts (`video-edit` 1.7, `video-upload` 1.1), que passam isolados (11/11). 3ª: 60/65, 5 timeouts de navegação (`page.goto`/`waitForURL` > 30 s) em `channel-settings`, `channel-subscriptions`, `channel-videos` e `video-upload`, que passam isolados (22/22). Toda falha é de tempo, nenhuma de asserção sobre conteúdo; não houve rodada de baseline na `main` para comparar.
