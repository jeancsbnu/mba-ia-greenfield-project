---
kind: task
name: task-rate-limit-visitor-identity
test_specs_aware: true
sources_mtime:
  docs/tasks/task-rate-limit-visitor-identity/context.md: "2026-10-08 17:50:36.838669700 -0300"
  docs/decisions/technical-decisions-rate-limit-visitor-identity.md: "2026-10-08 17:49:24.831258700 -0300"
  docs/decisions/technical-decisions-phase-02-auth.md: "2026-10-08 17:15:36.637194400 -0300"
  docs/decisions/technical-decisions-phase-02-auth-frontend.md: "2026-06-29 19:03:26.326787900 -0300"
  docs/decisions/technical-decisions-phase-01-configuracao-base.md: "2026-06-29 19:03:26.324780000 -0300"
  docs/decisions/technical-decisions-home-busca.md: "2026-10-08 14:26:59.559714000 -0300"
  docs/phases/phase-06-social-interactions/context.md: "2026-10-04 20:51:04.057909500 -0300"
  .claude/skills/testing-guide-nestjs-project/SKILL.md: "2026-10-08 09:21:00.084453800 -0300"
  .claude/skills/testing-guide-next-frontend/SKILL.md: "2026-06-29 19:03:26.177896400 -0300"
sources_hash:
  docs/tasks/task-rate-limit-visitor-identity/context.md: "40ade04f9fb5"
  docs/decisions/technical-decisions-rate-limit-visitor-identity.md: "0d1493a08793"
  docs/decisions/technical-decisions-phase-02-auth.md: "5035089bc4c6"
  docs/decisions/technical-decisions-phase-02-auth-frontend.md: "db21f0e40476"
  docs/decisions/technical-decisions-phase-01-configuracao-base.md: "60d0c41981c7"
  docs/decisions/technical-decisions-home-busca.md: "5d62495359b9"
  docs/phases/phase-06-social-interactions/context.md: "8732f61e249e"
  .claude/skills/testing-guide-nestjs-project/SKILL.md: "f0b3a8582444"
  .claude/skills/testing-guide-next-frontend/SKILL.md: "9942ebfdb06d"
---

# Task — Identidade do visitante no rate limit e orçamento das leituras públicas

## Objective

Identificação do visitante real atrás do BFF para o rate limit (de onde vem o IP, como ele chega ao Nest e qual é a chave do rastreador) e orçamento das rotas públicas de leitura

---

## Step Implementations

### SI-1 — Infra: segredo `INTERNAL_API_SECRET` no Nest

**Description:** Cria a chave de ambiente que autentica o repasse de identidade do BFF. Ela entra antes do guard que a consome.

**Technical actions:**

1. Acrescentar `INTERNAL_API_SECRET` como chave obrigatória ao `envValidationSchema` em `nestjs-project/src/config/env.validation.ts` (per `phase-01-configuracao-base/TD-02` e a convenção herdada de validação Joi da Fase 01; per `rate-limit-visitor-identity/TD-02`).
2. Expor o valor por um factory `registerAs` de domínio em `nestjs-project/src/config/` (um arquivo por domínio, per convenção herdada da Fase 01), injetável via `ConfigType<typeof …>` + `@Inject(….KEY)`.
3. Acrescentar a chave a `nestjs-project/.env.example` e aos blocos `environment:` dos serviços `nestjs-api` **e** `video-worker` em `nestjs-project/compose.yaml`. O worker valida o mesmo schema, e sem a chave ele não sobe.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `envValidationSchema` | Integration: a chave ausente é rejeitada com mensagem que a nomeia; presente, passa | `nestjs-project/src/config/env.validation.integration-spec.ts` |

**Dependencies:** none

**Acceptance criteria:**

- Com `INTERNAL_API_SECRET` ausente do ambiente, o `nestjs-api` falha no boot com erro de validação que nomeia `INTERNAL_API_SECRET`.
- Com a chave presente, `curl http://localhost:3000` volta a responder 200 e `docker compose ps video-worker` fica `Up` sem reinícios.
- `nestjs-project/.env.example` lista `INTERNAL_API_SECRET`.

---

### SI-2 — Rastreador do throttler: usuário ou IP confiável

**Description:** Troca a chave do throttler do `req.ip` (hoje o IP do servidor Next para todo o site) pela identidade do visitante. A forma da chave é a definida em `### API Contracts → Headers de identidade do visitante`.

**Technical actions:**

1. Criar `nestjs-project/src/auth/guards/visitor-throttler.guard.ts` — `VisitorThrottlerGuard` estende `ThrottlerGuard` e sobrescreve `getTracker(req)`: devolve `user:<sub>` quando há `req.user`; caso contrário devolve `ip:<ip>`, onde `<ip>` é o `X-Client-IP` **somente** se o header do segredo bater com `INTERNAL_API_SECRET` em comparação de tempo constante, e `req.ip` nos demais casos (per `rate-limit-visitor-identity/TD-02` e `/TD-03`). O nome do header do segredo segue §API Contracts (_undetermined_ no context.md; vem da Option A de TD-02 no decisions doc).
2. Injetar no guard o factory de config criado no SI-1, preservando as dependências do construtor do `ThrottlerGuard` (opções, storage, reflector).
3. Em `nestjs-project/src/auth/auth.module.ts`, registrar `VisitorThrottlerGuard` no lugar de `ThrottlerGuard` no provider `APP_GUARD`, **mantendo** o `JwtAuthGuard` registrado antes. É essa ordem que garante `req.user` no `getTracker`.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `VisitorThrottlerGuard` | Unit: as quatro ramificações de `getTracker` — `req.user` presente; segredo válido + `X-Client-IP`; segredo inválido ou ausente com `X-Client-IP` forjado; nenhum header | `nestjs-project/src/auth/guards/visitor-throttler.guard.spec.ts` |

O comportamento observável por HTTP fica nos e2e do SI-3, que exercitam o guard pela aplicação inteira.

**Dependencies:** SI-1 — o guard lê `INTERNAL_API_SECRET` do factory de config.

**Acceptance criteria:**

- Com o segredo válido, requisições do mesmo socket com `X-Client-IP` diferentes caem em baldes diferentes: a 11ª `POST /auth/login` do IP A retorna `429` enquanto a 1ª do IP B não retorna `429`.
- Com o header do segredo ausente ou errado, `X-Client-IP` é ignorado: requisições com IPs forjados diferentes compartilham o balde de `req.ip` e a 11ª `POST /auth/login` retorna `429`.
- Uma requisição com Bearer válido é contada no balde do usuário, mesmo variando `X-Client-IP` entre as chamadas.
- Segredo ausente ou inválido nunca produz `4xx` por si só: a requisição segue e só a chave muda.

---

### SI-3 — Orçamentos: default de leitura e `AUTH_THROTTLE` explícito

**Description:** Inverte o default global, que deixa de ser o limite de login e passa a ser o orçamento de leitura, e prende o aperto de autenticação nos handlers que precisam dele. Os valores seguem `### API Contracts → Política de throttling por rota`.

**Technical actions:**

1. Em `nestjs-project/src/auth/auth.module.ts`, trocar o `ThrottlerModule.forRoot` para `ttl: 60000, limit: 120` (per `rate-limit-visitor-identity/TD-04`, Revision de 2026-10-08).
2. Criar a constante `AUTH_THROTTLE` (10 req / 60 s) em `nestjs-project/src/common/`, no mesmo padrão tipado de `social-throttle.constants.ts`.
3. Aplicar `@Throttle(AUTH_THROTTLE)` aos 6 handlers do `AuthController`: `register`, `confirm-email`, `resend-confirmation`, `login`, `forgot-password` e `reset-password`. `refresh`, `logout` e `me` ficam sem decorator (per `rate-limit-visitor-identity/TD-04`, Revision de 2026-10-08).
4. Criar `nestjs-project/test/throttle-visitor-identity.e2e-spec.ts` cobrindo os critérios de aceite deste SI e os do SI-2, com o mesmo padrão de limpeza de `ThrottlerStorage` de `test/auth.e2e-spec.ts`.
5. Rodar os e2e que hoje assertam `429` e ajustar qualquer premissa que dependesse do default antigo de 10/60 s global: `auth`, `channels-subscription`, `videos-comments-create` e `videos-view-count`.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| Política de throttling + `VisitorThrottlerGuard` pela aplicação | E2E: default 120/60 s, `AUTH_THROTTLE` 10/60 s, `refresh` no default, baldes por visitante (segredo válido/inválido) e por usuário | `nestjs-project/test/throttle-visitor-identity.e2e-spec.ts` |
| Orçamento de auth (regressão) | E2E: a 11ª requisição a um endpoint de auth na janela continua `429` | `nestjs-project/test/auth.e2e-spec.ts` |
| Orçamentos social e de view (regressão) | E2E: os `429` existentes continuam nos mesmos limites | `nestjs-project/test/channels-subscription.e2e-spec.ts` |

**Dependencies:** SI-2 — os orçamentos são contados por chave de visitante, e os e2e deste SI assertam os dois juntos.

**Acceptance criteria:**

- `GET /videos/:publicId/public`, sem decorator próprio, aceita 120 requisições do mesmo visitante em 60 s; a 121ª retorna `429` com o envelope do `ThrottlerExceptionFilter`.
- A 11ª `POST /auth/login` do mesmo visitante em 60 s retorna `429`; o mesmo vale para `register`, `confirm-email`, `resend-confirmation`, `forgot-password` e `reset-password`.
- A 11ª `POST /auth/refresh` do mesmo visitante em 60 s **não** retorna `429`.
- `PATCH /videos/:publicId` autenticado não retorna `429` antes da 121ª requisição do mesmo usuário na janela.
- `POST /videos/:publicId/view` continua retornando `429` na 31ª requisição da janela, e as rotas sociais nos mesmos limites de antes (60 e 5).

---

### SI-4 — Identidade do visitante no BFF (Setup)

**Frontend Runtime spec:** see `## Technical Specifications` → `### Frontend Runtime` → `#### rate-limit-visitor-identity/TD-02 — Como o BFF entrega o IP ao Nest e quando o Nest confia nele`

**Technical actions:**

1. Acrescentar `INTERNAL_API_SECRET` ao schema `server` de `next-frontend/lib/env.ts` (server-only, como `API_URL`, per `next-frontend-config-base/TD-03` citado em TD-02) e o valor de teste em `next-frontend/vitest.setup.ts`, ao lado de `API_URL` e `SESSION_PASSWORD`. O valor de dev vai no `.env` local, que não é versionado.
2. Criar `next-frontend/lib/api/visitor-identity.ts` — o helper que monta os dois headers a partir do snippet de Setup (`x-forwarded-for` → primeiro valor → `X-Client-IP`; o header do segredo com `env.INTERNAL_API_SECRET`). Fora do escopo de requisição, quando `headers()` lança, ele devolve só o header do segredo, sem lançar.
3. Atualizar `next-frontend/CLAUDE.md` § "Env var convention — single key, server-only", que hoje afirma uma chave só, para registrar `INTERNAL_API_SECRET` como segunda chave server-only e dizer o que ela autentica.

**Dependencies:** —

**Tests:** _(empty — Setup SI; smoke-gated by AC; behavior tests live in Migration + Verification SIs)_

**Acceptance criteria:**

- Com `INTERNAL_API_SECRET` ausente, o `next-frontend` falha ao carregar `lib/env.ts` com erro de validação que nomeia a chave.
- O conteúdo F2 do snippet de Setup (`"x-forwarded-for"`, `"X-Client-IP"`, o split pelo primeiro valor e `env.INTERNAL_API_SECRET`) está presente em `next-frontend/lib/api/visitor-identity.ts`.
- `next-frontend/CLAUDE.md` lista `API_URL` e `INTERNAL_API_SECRET` como as chaves server-only.

---

### SI-5 — `next-frontend/lib/api/upstream.ts` → identidade do visitante (Migration)

**Frontend Runtime spec:** see `## Technical Specifications` → `### Frontend Runtime` → `#### rate-limit-visitor-identity/TD-02 — Como o BFF entrega o IP ao Nest e quando o Nest confia nele` → Migração, linha `upstream.ts`

**Technical actions:**

1. No `fetch` do client `openapi-fetch` em `next-frontend/lib/api/upstream.ts`, aplicar os headers do helper de `lib/api/visitor-identity.ts` (SI-4) à `Request` antes de delegar. A delegação continua resolvendo `globalThis.fetch` a cada chamada, para o MSW interceptar.
2. Não tocar nos consumidores: `server-upstream`, `optional-auth` e `viewer-channel` herdam os headers pelo client. O proxy do tus fica de fora, per a linha "Aplicação" do Frontend Runtime.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `lib/api/visitor-identity.ts` | Unit: primeiro valor do `x-forwarded-for` com espaços aparados; sem `x-forwarded-for` → sem `X-Client-IP` e segredo presente; fora do escopo de requisição → não lança | `next-frontend/lib/api/__tests__/visitor-identity.test.ts` |
| `upstream` client com a identidade | Integration (MSW): a requisição que chega ao handler traz `X-Client-IP` e o header do segredo; `Authorization` intacto quando há sessão | `next-frontend/lib/api/__tests__/upstream.integration.test.ts` |
| Consumidores do `upstream` (regressão) | Integration: os testes existentes continuam verdes | `next-frontend/lib/api/__tests__/server-upstream.test.ts` |

**Dependencies:** SI-4 (Setup — helper e chave de ambiente); SI-2 (cross-section — o Nest passa a ler os headers que este SI envia).

**Acceptance criteria:**

- Uma chamada pelo `upstream` client numa requisição com `x-forwarded-for: 203.0.113.7, 10.0.0.1` chega ao Nest com `X-Client-IP: 203.0.113.7` e o header do segredo com o valor de `INTERNAL_API_SECRET`.
- Uma chamada sem `x-forwarded-for` chega sem `X-Client-IP`, e o Nest conta pelo `req.ip`, per a regra de confiança de `### API Contracts`.
- O `Authorization: Bearer` de uma chamada autenticada chega inalterado.

---

### SI-6 — `next-frontend/lib/auth/refresh.ts` → identidade do visitante (Migration)

**Frontend Runtime spec:** see `## Technical Specifications` → `### Frontend Runtime` → `#### rate-limit-visitor-identity/TD-02 — Como o BFF entrega o IP ao Nest e quando o Nest confia nele` → Migração, linha `refresh.ts`

**Technical actions:**

1. No `fetch` direto para `${env.API_URL}/auth/refresh` em `next-frontend/lib/auth/refresh.ts`, acrescentar os headers do helper (SI-4) aos que já são enviados.
2. Preservar o single-flight do módulo: a chave de deduplicação e a promessa compartilhada não mudam, e só a montagem dos headers da requisição muda.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `refresh.ts` com a identidade | Integration (MSW): a chamada a `/auth/refresh` traz `X-Client-IP` e o header do segredo; o single-flight continua emitindo uma requisição só para chamadas concorrentes | `next-frontend/lib/auth/__tests__/refresh.integration.test.ts` |

**Dependencies:** SI-4 (Setup — helper e chave de ambiente); SI-2 (cross-section — o Nest passa a ler os headers que este SI envia).

**Acceptance criteria:**

- A chamada a `POST /auth/refresh` feita pelo BFF numa requisição com `x-forwarded-for` chega ao Nest com `X-Client-IP` e o header do segredo.
- Duas renovações concorrentes da mesma sessão continuam produzindo uma única requisição ao Nest.

---

## Technical Specifications

### API Contracts

> _Esta task não cria endpoint novo. Ela muda dois contratos que valem para todas as rotas do Nest: os headers de identidade que o BFF anexa a toda chamada ao upstream e a política de throttling por rota._

#### Headers de identidade do visitante — toda chamada BFF → Nest (SI-2, SI-5)

**Request headers:**
- `X-Client-IP`: string, opcional — o IP do visitante como o BFF o lê do `x-forwarded-for` que o Next entrega (primeiro valor da lista) *(per rate-limit-visitor-identity/TD-02; a origem do valor é rate-limit-visitor-identity/TD-01)*
- header que carrega o segredo `INTERNAL_API_SECRET`: string, opcional — _undetermined — o context.md nomeia o segredo (`INTERNAL_API_SECRET`, em rate-limit-visitor-identity/TD-02 e na Revision de TD-01) mas não o nome do header que o transporta; o nome está na Option A de TD-02 no decisions doc, e é lá que o SI o busca_
- `Authorization: Bearer <token>`: inalterado *(per phase-02-auth-frontend/TD-01)* — quando presente e válido, decide a chave do rastreador (abaixo)

**Regra de confiança no Nest** *(per rate-limit-visitor-identity/TD-02)*:
- `X-Client-IP` só é considerado quando o header do segredo bate com `INTERNAL_API_SECRET` (comparação em tempo constante); sem segredo válido, o IP é `req.ip`.
- Segredo ausente ou inválido **não** gera erro: a requisição segue e só a chave do rastreador muda.
- Até existir a borda que sobrescreve o `x-forwarded-for` (fatia de deploy da Fase 07), o valor de `X-Client-IP` é forjável pelo visitante *(per rate-limit-visitor-identity/TD-01, Revision de 2026-10-08)*.

**Chave do rastreador** *(per rate-limit-visitor-identity/TD-03)*:
- `user:<sub>` quando há `req.user` — o `JwtAuthGuard` é registrado antes do `ThrottlerGuard` em `APP_GUARD` e anexa `req.user` inclusive em rota `@Public()` que recebe Bearer válido.
- `ip:<ip>` caso contrário, com `<ip>` resolvido pela regra de confiança acima.

**Error responses:**
- 429: inalterado — envelope do `ThrottlerExceptionFilter` *(per phase-02-auth/TD-07)*

---

#### Política de throttling por rota (SI-3)

| Rotas | Orçamento por chave | Fonte |
|---|---|---|
| Default global (`ThrottlerModule.forRoot`) — toda rota sem `@Throttle` ou `@SkipThrottle` próprio, inclusive as escritas autenticadas de dono (`PATCH /videos/:publicId`, `PATCH` do canal) | **120 req / 60 s** | rate-limit-visitor-identity/TD-04, Revision de 2026-10-08 |
| `AuthController`: `register`, `confirm-email`, `resend-confirmation`, `login`, `forgot-password`, `reset-password` | `@Throttle(AUTH_THROTTLE)` — **10 req / 60 s** | rate-limit-visitor-identity/TD-04, Revision de 2026-10-08 |
| `AuthController`: `refresh`, `logout`, `me` | default (120 / 60 s) | rate-limit-visitor-identity/TD-04, Revision de 2026-10-08 |
| `POST /videos/:publicId/view` | inalterado — 30 / 60 s | `video-watch-page/TD-05`, citado em phase-02-auth/TD-08 (Revision de 2026-10-08) |
| Reações a vídeo e a comentário, inscrição (`SOCIAL_THROTTLE.REACTIONS`); criação de comentário e resposta (`SOCIAL_THROTTLE.COMMENTS`) | inalterados — 60 / 60 s e 5 / 60 s | social-interactions/TD-09 |
| `AppController` (`GET /`) | inalterado — `@SkipThrottle()` | código existente |
| Upload tus (`/videos/upload`) | fora do throttler — app Express montado em `main.ts`, antes do roteamento do Nest | código existente |

A chave de toda linha acima é a do rastreador (`user:<sub>` ou `ip:<ip>`). Como o `@nestjs/throttler` compõe a chave de armazenamento com o handler, cada rota continua com seu próprio balde por chave *(per phase-02-auth/TD-08, Revision de 2026-10-08)*.

### Frontend Runtime

#### rate-limit-visitor-identity/TD-02 — Como o BFF entrega o IP ao Nest e quando o Nest confia nele

**Pattern:** Option A. É a única que funciona sem reorganizar a rede dos dois stacks e que mantém os orçamentos já decididos (`video-watch-page/TD-05`, `social-interactions/TD-09`) onde estão, nos decorators do Nest, mudando só **quem** é a chave. O custo é uma chave de env cross-component, que é o mesmo tipo de contrato que `next-frontend-config-base/TD-03` já gere. A Option B é o caminho mais limpo **se** a Fase 07 de produção unificar as redes de qualquer forma; nesse caso ela pode suceder a A sem tocar nos decorators.

**Setup:**

```ts
// next-frontend/lib/api/upstream.ts — o `fetch` do client openapi-fetch
fetch: async (request) => {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip) request.headers.set("X-Client-IP", ip);
  request.headers.set(SECRET_HEADER, env.INTERNAL_API_SECRET); // nome: §API Contracts
  return globalThis.fetch(request);
},
```

`headers()` vem de `next/headers` e só existe dentro do escopo de uma requisição (RSC, Route Handler); fora dele (build, testes sem request) a leitura precisa degradar para "sem `X-Client-IP`", sem lançar. O `globalThis.fetch` resolvido a cada chamada continua obrigatório (o comentário existente em `upstream.ts` explica: o MSW troca o `fetch` global depois que o módulo carrega). `INTERNAL_API_SECRET` é server-only, como `API_URL` *(per next-frontend-config-base/TD-03, citado na Pattern acima)*.

**Aplicação:** a tarefa não tem superfície de UI (logic-only). O padrão vale para **toda chamada server-side do `next-frontend` ao `env.API_URL`**:

- **Adota:** o client `upstream` (`lib/api/upstream.ts`), e com ele todo Route Handler em `app/api/**` e todo Server Component que o usa — inclusive os helpers `lib/api/server-upstream.ts`, `lib/api/optional-auth.ts` e `lib/api/viewer-channel.ts`; e o `fetch` direto de `lib/auth/refresh.ts` (`POST /auth/refresh`).
- **Exclui:** o proxy tus `app/api/videos/upload/[[...path]]/route.ts` — o servidor tus do Nest é montado como app Express em `main.ts`, fora do `ThrottlerGuard`, então os headers não mudariam nenhuma chave.

**Migração:**

| File | Current behavior | Required change | Owning SI |
|------|-----------------|-----------------|-----------|
| `next-frontend/lib/api/upstream.ts` | `fetch: (request) => globalThis.fetch(request)` repassa a requisição sem identidade | anexar `X-Client-IP` e o header do segredo antes de delegar a `globalThis.fetch` | SI-5 |
| `next-frontend/lib/auth/refresh.ts` | `fetch(\`${env.API_URL}/auth/refresh\`)` direto, só com `Content-Type` | anexar os mesmos dois headers (helper compartilhado com `upstream.ts`) | SI-6 |

A chave `INTERNAL_API_SECRET` em `next-frontend/lib/env.ts` e o helper compartilhado que monta os dois headers são o Setup do padrão (SI-4), não uma migração de arquivo existente.

**Verificação:**

- **Unit:** o helper que monta os headers de identidade — com `x-forwarded-for` de um e de vários valores, sem `x-forwarded-for`, e fora do escopo de requisição (degrada sem lançar).
- **Integration:** uma chamada real pelo client `upstream` e uma pelo `tryRefresh`, com o MSW interceptando o upstream e assertando que `X-Client-IP` e o header do segredo chegam com os valores esperados.
- **E2E:** sem spec Playwright nova — a tarefa não muda nenhuma tela; o efeito observável (baldes separados por visitante) é provado nos e2e do Nest (SI-3).
- **Regression guards:** a suíte Vitest inteira continua verde (o `onUnhandledRequest: "error"` do `mocks/setup.ts` pega qualquer chamada que passe a sair sem interceptação), e a suíte Playwright existente continua verde.

---

## Dependency Map

```
Backend
SI-1 (root — segredo INTERNAL_API_SECRET no Nest)
└── SI-2 — depends on SI-1 (VisitorThrottlerGuard lê o segredo)
    └── SI-3 — depends on SI-2 (orçamentos contados por visitante)

Frontend
SI-4 (root — Setup: chave de ambiente + helper de headers)
├── SI-5 — depends on SI-4 + SI-2 (upstream.ts envia os headers que o Nest lê)
└── SI-6 — depends on SI-4 + SI-2 (refresh.ts envia os headers que o Nest lê)
```

---

## Deliverables

- [ ] SI-1 — Infra: segredo `INTERNAL_API_SECRET` no Nest
- [ ] SI-2 — Rastreador do throttler: usuário ou IP confiável
- [ ] SI-3 — Orçamentos: default de leitura e `AUTH_THROTTLE` explícito
- [ ] SI-4 — Identidade do visitante no BFF (Setup)
- [ ] SI-5 — `next-frontend/lib/api/upstream.ts` → identidade do visitante (Migration)
- [ ] SI-6 — `next-frontend/lib/auth/refresh.ts` → identidade do visitante (Migration)

**Full test suites:**

Rodar **uma suíte por vez** — nunca backend e frontend em paralelo.

- [ ] Backend tests pass (`cd nestjs-project && docker compose exec nestjs-api npm test -- --runInBand`)
- [ ] E2E tests pass (`cd nestjs-project && docker compose exec nestjs-api npm run test:e2e`)
- [ ] Type/compilation checks pass (`cd nestjs-project && docker compose exec nestjs-api npx tsc --noEmit`)
- [ ] Lint passes (`cd nestjs-project && docker compose exec nestjs-api npm run lint`)
- [ ] Frontend tests pass (`cd next-frontend && docker compose exec next-frontend npm test`)
- [ ] Type/compilation checks pass (`cd next-frontend && docker compose exec next-frontend npx tsc --noEmit`)
- [ ] Lint passes (`cd next-frontend && docker compose exec next-frontend npm run lint`)
- [ ] Frontend E2E tests pass (`cd next-frontend && npx playwright test`, no host, com o dev server do container rodando com `MSW_ENABLED=true` — ver `next-frontend/CLAUDE.md` → "E2E test prerequisites"); nenhum spec novo, regressão do login e da navegação autenticada
