---
kind: phase
name: phase-03-upload-processing
sources_mtime:
  docs/project-plan.md: "2026-06-29T19:03:26.352381300-03:00"
  docs/decisions/technical-decisions-upload-processing.md: "2026-07-02T21:21:48.795000200-03:00"
  docs/phases/phase-03-upload-processing/library-refs.md: "2026-07-02T21:35:07.544537300-03:00"
  docs/decisions/technical-decisions-next-frontend-openapi-typing.md: "2026-06-29T19:03:26.324780000-03:00"
  docs/decisions/technical-decisions-openapi-docs-nestjs.md: "2026-06-29T19:03:26.324780000-03:00"
  docs/decisions/technical-decisions-next-frontend-msw-foundation.md: "2026-06-29T19:03:26.322773600-03:00"
  docs/decisions/technical-decisions-next-frontend-config-base.md: "2026-06-29T19:03:26.322773600-03:00"
  docs/phases/phase-01-configuracao-base/context.md: "2026-06-29T19:03:26.334820700-03:00"
  docs/phases/phase-02-auth/context.md: "2026-06-29T19:03:26.342602400-03:00"
  docs/phases/phase-02-auth-frontend/context.md: "2026-06-29T19:03:26.338577700-03:00"
  .claude/skills/testing-guide-nestjs-project/SKILL.md: "2026-06-29T19:03:26.151141200-03:00"
  .claude/skills/testing-guide-next-frontend/SKILL.md: "2026-06-29T19:03:26.177896400-03:00"
---

# phase-03-upload-processing — Context

## Scope

**Phase name:** Fase 03 — Upload e Processamento de Vídeos

**Capabilities** (literal, `docs/project-plan.md`):

- Serviço de armazenamento de arquivos (vídeos e thumbnails)
- Serviço de processamento em segundo plano (filas)
- Upload de vídeos com suporte a arquivos de até 10GB sem impacto na performance
- Pré-cadastro automático do vídeo como rascunho ao iniciar o upload
- Processamento automático do vídeo após upload (extração de duração e metadados)
- Geração automática de thumbnail a partir de um frame do vídeo
- URL única por vídeo, sem conflito com outros vídeos
- Reprodução via streaming (sem necessidade de download completo)
- Download do vídeo pelo usuário

**Out of scope:** _Not specified._

**Deliverables:** upload de até 10GB funcional, processamento automático do vídeo, streaming funcionando, URLs únicas geradas.

**Affected subprojects:**

- `nestjs-project` — no specific note (plan does not name subprojects explicitly for this phase)

**Deferred subprojects:** _None._

**Sequencing notes:** Depende de: Fase 01, Fase 02

**Neighbors (for boundary detection only):**

- **Phase 02:** Fase 02 — Cadastro, Login e Gerenciamento de Conta: Fluxo completo de criação de conta, confirmação por e-mail, login, logout e recuperação de senha.
- **Phase 04:** Fase 04 — Gerenciamento de Vídeos e Canal: Edição das informações do vídeo, fluxo de rascunho e publicação, painel de administração do canal e página pública.

## Decisions Index

| Ref | Source | Scope | Topic | Status | Decision | Libraries |
|-----|--------|-------|-------|--------|----------|-----------|
| upload-processing/TD-01 | phase | Backend | Serviço de armazenamento de objetos (vídeos e thumbnails) | decided | A (MinIO) | @aws-sdk/client-s3 |
| upload-processing/TD-02 | phase | Backend | Fila de processamento em segundo plano | decided | A (BullMQ + Redis) | bullmq, @nestjs/bullmq, ioredis |
| upload-processing/TD-03 | phase | Cross-layer | Estratégia de upload de arquivos grandes (até 10GB) | decided | A (tus) | tus-node-server, tus-js-client |
| upload-processing/TD-04 | phase | Backend | Momento do pré-cadastro do vídeo como rascunho | decided | A (hook pre-create do tus) | — |
| upload-processing/TD-05 | phase | Repo-wide | Arquitetura de deployment do Video Worker | decided | B (entry point em `nestjs-project/`) | — |
| upload-processing/TD-06 | phase | Backend | Biblioteca de manipulação de FFmpeg no Worker | decided | B (`child_process.spawn` + `ffmpeg-static`) | ffmpeg-static |
| upload-processing/TD-07 | phase | Backend | Geração de URL única por vídeo | decided | B (nanoid) | nanoid |
| upload-processing/TD-08 | phase | Cross-layer | Caminho de entrega para streaming e download | decided | B (URLs pré-assinadas) | — |
| upload-processing/TD-09 | phase | Cross-layer | Transporte do feedback de progresso de processamento | decided | A (Polling) | — |
| upload-processing/TD-10 | phase | Repo-wide | Onde adicionar os novos serviços de infra no Docker Compose | decided | A (dentro do `nestjs-project/compose.yaml`) | — |

_Source files:_

- upload-processing — `docs/decisions/technical-decisions-upload-processing.md` (scope_type: phase, related_phases: [3])

## Capability Coverage

| Capability (from project-plan.md) | Covered by |
|-----------------------------------|------------|
| Serviço de armazenamento de arquivos (vídeos e thumbnails) | upload-processing/TD-01, upload-processing/TD-10 |
| Serviço de processamento em segundo plano (filas) | upload-processing/TD-02, upload-processing/TD-10 |
| Upload de vídeos com suporte a arquivos de até 10GB sem impacto na performance | upload-processing/TD-03 |
| Pré-cadastro automático do vídeo como rascunho ao iniciar o upload | upload-processing/TD-04 |
| Processamento automático do vídeo após upload (extração de duração e metadados) | upload-processing/TD-05, upload-processing/TD-06, upload-processing/TD-09, upload-processing/TD-10 |
| Geração automática de thumbnail a partir de um frame do vídeo | upload-processing/TD-06 |
| URL única por vídeo, sem conflito com outros vídeos | upload-processing/TD-07 |
| Reprodução via streaming (sem necessidade de download completo) | upload-processing/TD-08 |
| Download do vídeo pelo usuário | upload-processing/TD-08 |

## Decisions Detail

### upload-processing/TD-01

**Recommendation:** é o único caminho gratuito e 100%-Docker (consistente com a filosofia do projeto — tudo roda em containers, "Docker Networking" no `CLAUDE.md` raiz), habilita o mesmo código de acesso a objetos que funcionaria em S3 real depois, e evita introduzir uma dependência de conta externa só para rodar localmente.
**Libraries:** @aws-sdk/client-s3

### upload-processing/TD-02

**Recommendation:** integração NestJS mais direta, eventos de progresso de job nativos (alimentam TD-09 sem trabalho extra), e é o padrão mais citado especificamente para pipelines de transcodificação/processamento de vídeo em Node.js.
**Libraries:** bullmq, @nestjs/bullmq, ioredis

### upload-processing/TD-03

**Recommendation:** é a única opção que atende ao requisito explícito de retomada de upload do `project-plan.md` sem reimplementar controle de offset manualmente; é o padrão de mercado citado por serviços de vídeo (Cloudflare, Vimeo) para exatamente este cenário (arquivos grandes, conexões não confiáveis).
**Libraries:** tus-node-server, tus-js-client

### upload-processing/TD-04

**Recommendation:** é a leitura literal do requisito do plano e se encaixa naturalmente no hook `pre-create` do protocolo tus escolhido em TD-03.
**Libraries:** —

### upload-processing/TD-05

**Recommendation:** mantém a separação de processos exigida pelo diagrama de arquitetura (worker distinto da API) sem pagar o custo de duplicar toda a configuração de banco/entidades/env em um terceiro subprojeto, o que é desproporcional para o escopo do curso.
**Libraries:** —

### upload-processing/TD-06

**Recommendation:** remove a dependência de uma lib arquivada sem introduzir outra de baixa adoção; o próprio `ffprobe` (parte do binário FFmpeg, não da lib) já entrega duração e metadados em JSON, e o comando de extração de thumbnail (`ffmpeg -ss <t> -i <in> -vframes 1 <out>`) é simples o suficiente para não precisar de uma API fluente por cima.
**Libraries:** ffmpeg-static

### upload-processing/TD-07

**Recommendation:** é a única opção que satisfaz literalmente os dois adjetivos do requisito ("curta" e "única") ao mesmo tempo, com uma dependência mínima e madura.
**Libraries:** nanoid

### upload-processing/TD-08

**Recommendation:** é a única opção alinhada ao diagrama de arquitetura do projeto, evita sobrecarregar o processo da API com tráfego de bytes de vídeo, e já deixa a porta aberta para a regra de visibilidade pública/unlisted da Fase 04 (a checagem acontece na hora de assinar a URL, não depois).
**Libraries:** —

### upload-processing/TD-09

**Recommendation:** o processamento de um vídeo leva segundos a minutos, não milissegundos; a latência de alguns segundos do polling é imperceptível nesse contexto, e evita introduzir gerenciamento de conexão de longa duração (SSE/WebSocket) nesta fase por um ganho marginal. Pode ser revisitado depois se a experiência de usuário exigir atualização mais imediata.
**Libraries:** —

### upload-processing/TD-10

**Recommendation:** segue a convenção já validada nas Fases 01/02 (stack por subprojeto) e combina diretamente com a recomendação de TD-05 (worker como processo dentro do `nestjs-project`).
**Libraries:** —

## Inherited Decisions Detail

### phase-02-auth/TD-01

**Recommendation:** Argon2id — For a greenfield project in 2026, Argon2id is the OWASP-recommended choice. The native build dependency is a one-time Docker setup cost. The project has no legacy constraints favoring bcrypt. OWASP minimum: 19MiB memory, 2 iterations.
**Libraries:** argon2@^0.41.x

### phase-02-auth/TD-02

**Recommendation:** The project plan includes only email/password auth for now, but the plugin architecture costs little and future phases may add social login. Aligns with official NestJS docs, making onboarding and maintenance easier.
**Libraries:** @nestjs/jwt@^11.0.0

### phase-02-auth/TD-03

**Recommendation:** Provides the strongest security model with automatic theft detection. The DB write overhead is acceptable for a video platform (auth refresh is infrequent vs. video operations). PostgreSQL is already in the stack, so no new infrastructure needed. Race conditions can be mitigated with a short grace period for the old token.
**Libraries:** —

### phase-02-auth/TD-04

**Recommendation:** Revocability is important: when a user requests a new password reset, previous tokens should be invalidated. The DB table is trivial to implement, and the tokens table can also serve future needs (e.g., API keys). Keeps email tokens decoupled from the JWT auth system.
**Libraries:** —

### phase-02-auth/TD-05

**Recommendation:** Best NestJS integration with minimal boilerplate. Supports SMTP (matching the architecture diagram), works with MailHog/Mailpit for local development without external dependencies, and scales to any SMTP provider in production. Template engine support (Handlebars) simplifies email formatting. No vendor lock-in.
**Libraries:** @nestjs-modules/mailer@^2.x, handlebars@^4.x

### phase-02-auth/TD-06

**Recommendation:** This is a backend-only project (no shared schemas with frontend), so Zod's single-source-of-truth advantage is less impactful. class-validator is the documented NestJS approach, and the project already uses decorators extensively (TypeORM entities, NestJS DI). Fewer integration surprises with NestJS 11.
**Libraries:** class-validator@^0.14.x, class-transformer@^0.5.x

### phase-02-auth/TD-07

**Recommendation:** Provides machine-readable error codes that the Next.js frontend can switch on, without the overhead of RFC 9457's URI-based type system. The project is single-consumer (first-party frontend), so a simple `{ statusCode, error, message }` format with domain codes balances clarity and simplicity. The custom filter cost is low — two small files.
**Libraries:** —

### phase-02-auth/TD-08

**Recommendation:** Native NestJS integration is decisive: the guard system allows scoping rate limiting to `AuthModule` only via module-level `APP_GUARD`, with `@SkipThrottle()` for exemptions. The project is single-instance with no distributed requirements, so in-memory storage is sufficient. Using express-rate-limit would bypass NestJS's DI and guard lifecycle for no clear benefit.
**Libraries:** @nestjs/throttler@^6.x

### phase-02-auth/TD-09

**Recommendation:** Since DB lookup is mandatory (TD-03), JWT signature adds no security value. Opaque tokens are shorter, leak no data, and are simpler to generate.
**Libraries:** @nestjs/jwt@^11.0.0

### phase-02-auth/TD-10

**Recommendation:** The platform is a video sharing service with URL-based channel handles. A strict `[a-z0-9_]` allowlist is the simplest and most portable choice: no extra dependencies, no edge cases around hyphen positioning, and the `user_<random>` fallback provides a valid handle even for extreme email prefixes. Hyphens can always be added in a future iteration if user feedback justifies it.
**Libraries:** —

### phase-02-auth-frontend/TD-01

**Recommendation:** Three reasons. (1) Architectural fit. The strict-BFF model in `next-frontend-config-base/TD-03` already nominates the Route Handler as the only NestJS caller; cookie-based sessions are the natural match, and Auth.js's framework adds layers between the BFF and the cookie that buy nothing because the backend is the auth authority — Auth.js's value (DB adapters, OAuth providers, magic-link, `getServerSession` helpers) is mostly unused in this configuration. (2) Smaller blast radius. A ~50-LOC session helper is grep-friendly, debuggable, and test-friendly via the existing MSW+BFF integration test pattern; a misconfigured Auth.js callback is a longer fault-isolation loop. (3) Compatibility with Next.js 16 / React 19. Built-in `next/headers` `cookies()` is the canonical primitive both runtimes already use; Auth.js v5 versions track Next.js majors with a lag, adding compatibility risk that Option A does not have. Option C is rejected as unsafe (`localStorage` for refresh tokens) and architecturally regressive (loses RSC personalization).
**Libraries:** —

### phase-02-auth-frontend/TD-02

**Recommendation:** Three reasons. (1) Defense in depth on the cookie content — `httpOnly` blocks JS, encryption blocks accidental log/proxy inspection; the marginal cost is one ~3KB dep. (2) Single cookie to manage simplifies logout (one `session.destroy()` call) and avoids the orphan-cookie failure mode of Option A. (3) Room to carry minimal user metadata (`userId`, `email`, `channelSlug`) lets `app/layout.tsx` RSC render the authenticated chrome (avatar, channel name) without a per-render `/auth/me` round-trip — Phase 04+ gains compound here. Option A is a viable downgrade if the team rejects `iron-session` for any reason; the migration A→B (or B→A) is a one-Route-Handler refactor with no test changes downstream because the BFF interface is unchanged. Option C is rejected: it solves a problem (server-side revocation) the project does not have at the cost of infrastructure the project does not own.
**Libraries:** iron-session

### phase-02-auth-frontend/TD-03

**Recommendation:** The single-flight detail is non-trivial and goes in the helper from day one — tested by MSW with a "two concurrent intercepted upstream calls; one refresh expected" assertion. Option B's client-driven pattern is rejected because it doesn't replace Option A (RSC still needs server-side refresh) — adopting B means doing both. Option C's pre-emptive timer is rejected because the failure modes (multiple tabs, sleep/wake) outweigh the latency saving and force a `"use client"` shell near the root.
**Libraries:** —

### phase-02-auth-frontend/TD-04

**Recommendation:** Three reasons. (1) Decoupled from TD-05 — works with Route Handlers OR Server Actions; the form code does not change if TD-05 is revisited later. (2) Aligned with shadcn's canonical form primitive — the project already commits to `radix-nova` shadcn (`components.json`); `npx shadcn@latest add form` produces react-hook-form wrappers; choosing react-hook-form means using the supported primitive instead of hand-rolling around it. (3) Zod-first developer ergonomics match the rest of the FE foundation — `next-frontend-config-base/TD-01` chose Zod 4 for env; the same schemas-as-source-of-truth pattern carries to forms with zero new validator paradigm. Option B is rejected for impedance with shadcn's primitive and for over-investing in progressive-enhancement that the strict-BFF model does not require. Option C is rejected for the per-field boilerplate and the loss of client-side feedback on a project that values quick, type-safe form iteration.
**Libraries:** react-hook-form, @hookform/resolvers

### phase-02-auth-frontend/TD-05

**Recommendation:** Three reasons. (1) Strict-BFF alignment. `next-frontend-config-base/TD-03` named Route Handlers as the BFF surface; Option A keeps every mutation visible under `app/api/**`. (2) Test scaffold already exists — `next-frontend/CLAUDE.md` § Testing and `next-frontend-msw-foundation` were authored for Route-Handlers-as-functions; Option A reuses them with zero invention. (3) Single mutation surface — Phase 02 sets the precedent for Phases 03–07; uniformity beats per-mutation idiom-picking when the cost of inconsistency compounds (Option C). Option B has real ergonomic appeal for the simplest forms but fragments the BFF surface and forces test-pattern reinvention; if the team later wants progressive enhancement for specific forms, the migration A→B is per-form and doesn't require touching unrelated routes — A is the safer default and the cheaper baseline.
**Libraries:** —

### phase-02-auth-frontend/TD-06

**Recommendation:** Two reinforcing reasons. (1) No first-render flicker, no round-trip — the session is delivered in the same response as the page HTML; the Client Provider hydrates with the correct initial state; users never see "Login" briefly turn into their avatar. (2) No new BFF endpoint — the cookie is the source of truth, RSC reads it, the Provider broadcasts it; the BFF surface stays minimal. The `router.refresh()` requirement after mid-session mutations is a small price (one line in the relevant mutation handler) for the structural benefits. Option B is rejected for the double-read-and-flicker; Option C is dominated by Option B and rejected.
**Libraries:** —

### phase-02-auth-frontend/TD-07

**Recommendation:** Three reasons. (1) First-paint-correct — the user sees the right outcome on the first paint, no skeleton, no flicker. (2) Single integration pattern across both flows — confirmation is RSC-only; reset is RSC + Client form (TD-04, TD-05 patterns reused) — both share the "RSC owns the token, Client Component owns the input" split. (3) Email-prefetch behavior is solved at the backend's idempotent-confirmation level (a small note for `/plan-build` to confirm; not a separate TD). Option B's Route-Handler-as-link-target adds redirects for no clean gain. Option C is dominated.
**Libraries:** —

### next-frontend-openapi-typing/TD-01

**Recommendation:** (`openapi-typescript` + `openapi-fetch`). Three reinforcing reasons. (1) Strict BFF makes the SDK surface valueless on the client. Only Route Handlers ever call the upstream Nest; they already use `fetch` (Next 16's caching extensions sit on top of native `fetch`); a generated SDK adds a third client style to learn for zero functional gain. (2) Types-first matches the rest of the FE foundation. Env validation is Zod-derived types; component variants are `cva` types; both are TS-first with zero generated runtime. `paths` is the natural extension — one `.d.ts` file imported wherever the contract is touched. (3) MSW typing is solved by the same `paths` symbol. Hand-written handlers in `mocks/handlers.ts` type their resolver returns off `paths["/videos"]["get"]["responses"][200]`, giving the contract guarantee without orval/kubb's verbose generated handlers (which would be overridden per-test anyway). The marginal cost of adding `openapi-fetch` (~6KB, server-side only) is small enough that we recommend the types + thin-client pair, not types alone — `openapi-fetch` removes the `fetch(API_URL + path, { method, headers, body })` boilerplate in each Route Handler while staying within the BFF model.
**Libraries:** openapi-typescript, openapi-fetch

### next-frontend-openapi-typing/TD-02

**Recommendation:** (committed local copy + repo-root sync script). Three reasons. (1) Preserves the compose-stack independence that `next-frontend-config-base/TD-03` Context calls out as the current architecture — neither subproject's compose file references the other. (2) Drift is eliminated structurally when paired with TD-03's CI freshness check. (3) The committed local file is a real artifact in PR review — reviewers see the contract change in `next-frontend/openapi.json`'s diff at the same time as the backend change.
**Libraries:** —

### next-frontend-openapi-typing/TD-03

**Recommendation:** (committed + CI freshness check). It is the only option that makes contract drift both visible (in PR diffs) and impossible to merge accidentally (CI fail). The complexity premium over Option A is one CI step. Apply the same script-and-check pattern to any future generated artifact (e.g., if `openapi-fetch` is wrapped, the wrapper file is hand-written; the only generated artifact remains `types.gen.ts`).
**Libraries:** —

### next-frontend-openapi-typing/TD-04

**Recommendation:** (single `lib/api/contracts.ts` with explicit aliases). It is the only option that (i) handles pass-through and reshape with the same mechanism, (ii) gives a single grep target for "what shape does the BFF expose", and (iii) decouples Component imports from App Router file paths. Make `lib/api/contracts.ts` the only file that imports `paths` from `types.gen.ts`; every other consumer imports from `contracts.ts`.
**Libraries:** —

### next-frontend-openapi-typing/TD-05

**Recommendation:** (hand-written, typed via `paths`). Reasons: (1) Determinism over auto-generation — BFF integration tests assert on specific values; randomized fixtures are anti-helpful. (2) Coherence with TD-01 — `openapi-typescript`'s `paths` type is the single contract anchor; reusing it in MSW handlers means "spec ↔ handler ↔ assertion" is one type chain. (3) Scale fit — manual cost is negligible at this stage; can be superseded with a generator plugin later without touching TD-01's `paths` import sites.
**Libraries:** —

### openapi-docs-nestjs/TD-01

**Recommendation:** (`@nestjs/swagger`) — é a única opção que preserva as decisões anteriores (`class-validator` em TD-06 de phase-02-auth) sem re-platform; o CLI plugin com `classValidatorShim: true` aproveita os decoradores `class-validator` existentes para inferir schemas, mantendo o boilerplate baixo.
**Libraries:** @nestjs/swagger

### openapi-docs-nestjs/TD-02

**Recommendation:** (Ambos: UI interativa + `openapi.json` exportado) — o custo marginal sobre expor só a UI é apenas um npm script (~15 linhas) e o benefício é uma fundação correta para futura integração FE (codegen offline) sem perder a UI interativa que dev/QA usam.
**Libraries:** —

### openapi-docs-nestjs/TD-03

**Recommendation:** (Apenas em dev/staging via env flag) — alinha com a postura defensiva já estabelecida em phase 02 e não compromete consumidores legítimos (o `openapi.json` commitado em TD-02 cumpre o papel de "spec consultável fora da UI").
**Libraries:** —

### next-frontend-msw-foundation/TD-01

**Recommendation:** (per-domain modules + barrel). Three reasons. (1) MSW's own best-practice recommends it. (2) Domain ownership tracks the codebase, not the project plan — handler files mirror the same vocabulary (auth, videos, channels) as `components/`/`app/api/`. (3) Append-only growth with minimal merge conflicts — each phase touches a new file plus one line in the barrel.
**Libraries:** —

### next-frontend-msw-foundation/TD-02

**Recommendation:** (test-only, `setupServer` only at the foundation). The browser worker is a future capability with no documented current consumer; wiring it now is speculative investment. Keeps the foundation minimal, aligned 1:1 with what CLAUDE.md currently documents, and non-breaking to extend later.
**Libraries:** —

### next-frontend-msw-foundation/TD-03

**Recommendation:** (hand-written defaults as the default + opt-in seeded faker for bulk collections). Every fixture up to Phase 02 (single-record-mostly) is naturally hand-written with a diff-revealing override pattern; bulk-collection cases arriving later (Phase 07 home grid, Phase 06 comment threads) justify keeping faker available as a scoped tool, seeded per-fixture to avoid the global-cursor pitfall.
**Libraries:** —

### next-frontend-msw-foundation/TD-04

**Recommendation:** (universal handler set + `server.use(...)` overrides + `onUnhandledRequest: "error"`). "Import only what it's needed" is satisfied at the authoring layer by TD-01 (per-domain files). At runtime, loading all handlers is the canonical MSW v2 model; `onUnhandledRequest: "error"` enforces that a phase's test cannot accidentally invoke a route outside its scope.
**Libraries:** —

### next-frontend-config-base/TD-01

**Recommendation:** (Zod 4). Three converging reasons: (1) type-inference matches the FE's strict-TS culture. (2) Ecosystem gravity in Next.js/React 19 — Zod is the de-facto schema language for App Router. (3) Direct enablement of TD-02 (`@t3-oss/env-nextjs`, Zod-first). Backend parity with Joi is not load-bearing — env schemas are not shared FE↔BE.
**Libraries:** zod

### next-frontend-config-base/TD-02

**Recommendation:** (`@t3-oss/env-nextjs`). The only option that combines type-level `NEXT_PUBLIC_` prefix enforcement, runtime Proxy-based leak detection, and single-file consumer ergonomics. The marginal cost over a hand-rolled schema is one ~3KB dep — well spent for the strongest boundary among the options considered.
**Libraries:** @t3-oss/env-nextjs

### next-frontend-config-base/TD-03

**Recommendation:** (Strict BFF — single server-only `API_URL`). Aligned with the BFF testing strategy already documented in `next-frontend/CLAUDE.md` (Route Handlers as the only NestJS caller; BFF tests stub `fetch` via MSW). Eliminates CORS, eliminates public exposure of the backend URL. A `NEXT_PUBLIC_API_URL` variant is a future-proofing concession with no current consumer, and adding a public key later is non-breaking while removing one would be breaking.
**Libraries:** —

## Inherited Conventions

- Backend config uses `@nestjs/config` with namespaced `registerAs(name, () => ({...}))` factories — one file per domain in `src/config/`. _(from phase 02)_
- Env variables are validated by a Joi schema in `src/config/env.validation.ts`, passed to `ConfigModule.forRoot({ validationSchema, validationOptions: { allowUnknown: true, abortEarly: false } })`. _(from phase 02)_
- Config is injected into modules via `ConfigType<typeof xxxConfig>` and `@Inject(xxxConfig.KEY)`; the same factory is importable as a plain function for non-DI contexts (e.g., TypeORM CLI). _(from phase 02)_
- `data-source.ts` loads `.env` via `import 'dotenv/config'` at the top, then imports `databaseConfig` and calls it as a plain function. _(from phase 02)_
- Database connection parameters (host, port, etc.) are sourced from a single `databaseConfig` factory — never duplicated between `AppModule` and `data-source.ts`. _(from phase 02)_
- `TypeOrmModule.forRootAsync` is used (not `forRoot`), with `imports: [ConfigModule]`, `inject: [databaseConfig.KEY]`, `useFactory` returning options including `autoLoadEntities: true`, `synchronize: false`. _(from phase 02)_

## Inherited Deferred Capabilities

| Capability | Status | Origin phase | Rationale |
|-----------|--------|--------------|-----------|
| Telas de frontend | deferred | phase-01-configuracao-base | `next-frontend/` is not initialized in this phase; UI surfaces start in a later phase. |
| Telas de cadastro, login, confirmação de conta e recuperação de senha | deferred | phase-02-auth | `next-frontend/` is not initialized in this phase; UI surfaces start in a later phase. |
| "Confirmação de conta via e-mail com link de ativação" | deferred | phase-02-auth-frontend | deferred_to_next_phase — UI landing screen de-scoped 2026-05-14; FE confirmation flow (TD-07) picked up by a future phase. BE side unchanged in `phase-02-auth`. |
| "Logout" | deferred | phase-02-auth-frontend | deferred_to_next_phase — logout button lives inside authenticated chrome (typically Phase 04). Phase 02 still implements POST `/api/auth/logout` (BFF route handler + `session.destroy()`) so the contract is ready when the chrome lands. |
| "Recuperação de senha (destination screen / set-new-password)" | deferred | phase-02-auth-frontend | deferred_to_next_phase — `/forgot-password` ships this phase sending the e-mail; the reset-password destination screen is absent from Figma → link destination remains a 404 until a later phase delivers the screen via `/screen-inventory` extension run. Documented as a known gap. |
| "Telas de cadastro, login, confirmação de conta e recuperação de senha" | deferred | phase-02-auth-frontend | a tela de confirmação da conta não será implementada nesta fase corrente, será adiada — the umbrella bullet's full coverage requires the confirmação and reset-password destination screens; both are deferred per Non-UI rows above. The 3 ship-this-phase telas (signup, login, forgot-password) are inventoried and covered by their own verbs; the umbrella bullet itself is deferred to the phase that lands the missing screens. |

## Non-UI / Deferred Capabilities

| Capability | Status | Rationale | TD refs |
|-----------|--------|-----------|---------|
| (empty on first assembly — plan-resolve appends rows as user marks capabilities) |

## Testing Requirements

### nestjs-project

| Artifact created | Required tests |
|---|---|
| Entity (`*.entity.ts`) | Integration: constraints, defaults, `select: false` |
| Service with branching + DB | Unit: branch logic (mock repo) + Integration: DB contract |
| Service with DB only (no branching) | Integration: DB contract |
| Service with configured lib (JWT, cache) | Unit: real lib with test config |
| Service with side-effect dep (email, storage) | Integration: real capture service (Mailpit) or local adapter |
| Module with configured imports | Unit: compilation test |
| Controller | E2E only — do NOT write unit tests |
| DTO | E2E: one validation wiring test per endpoint |
| Guard (delegates to service for business logic) | E2E + Unit if complex internal logic |
| Guard (simple, delegates to Passport) | E2E only |
| Strategy (Passport) | E2E via guard |
| Pipe (custom transformation/validation) | Unit |
| Interceptor (response transform, logging) | Unit and/or E2E |
| Exception Filter | Unit + E2E |
| Middleware | E2E |

### next-frontend

| Artifact created | Required tests |
|---|---|
| Page — sync RSC, static, no logic | None at component level; cover only if part of a critical flow → `*.e2e-spec.ts` |
| Page — sync RSC composing client children | Test client children directly; cover rendered page via `*.e2e-spec.ts` |
| Page — async RSC (`async function Page()` with `await`) | `*.e2e-spec.ts` only — Vitest cannot render it |
| Layout (`layout.tsx`) | None unless it adds logic (auth gate, conditional render); else via E2E |
| Client component (`"use client"`) with state/handlers | `*.test.tsx` — RTL + `jsdom` docblock, mock `next/navigation`, MSW for fetch |
| Feature component (server, composes primitives) | Skip unit; cover via the page's E2E |
| shadcn UI primitive (`components/ui/*`) | None — trust the library; cover via consumers |
| Icon (`components/icons/*`) | None |
| `lib/` utility / boundary module with branching or shape assumptions | `*.test.ts` |
| Custom hook (`hooks/*`) | `*.test.ts(x)` with `renderHook`, `jsdom` docblock |
| Route handler (`app/api/**/route.ts`) — proxy or with branching | `*.integration.test.ts` with MSW (+ `*.test.ts` for extracted pure logic) |
| Server action / middleware / error-loading-not-found / metadata | See guide — depends on type |
