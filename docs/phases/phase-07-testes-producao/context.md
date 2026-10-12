---
kind: phase
name: phase-07-testes-producao
sources_mtime:
  docs/project-plan.md: "2026-06-29T19:03:26-03:00"
  docs/decisions/technical-decisions-testes-producao.md: "2026-10-11T22:41:37-03:00"
  docs/decisions/technical-decisions-next-frontend-config-base.md: "2026-06-29T19:03:26-03:00"
  docs/decisions/technical-decisions-next-frontend-msw-foundation.md: "2026-06-29T19:03:26-03:00"
  docs/decisions/technical-decisions-rate-limit-visitor-identity.md: "2026-10-08T19:04:24-03:00"
  docs/decisions/technical-decisions-next-frontend-openapi-typing.md: "2026-10-03T21:48:21-03:00"
  docs/phases/phase-01-configuracao-base/context.md: "2026-10-01T21:50:20-03:00"
  docs/phases/phase-02-auth/context.md: "2026-06-29T19:03:26-03:00"
  docs/phases/phase-02-auth-frontend/context.md: "2026-06-29T19:03:26-03:00"
  docs/phases/phase-03-upload-processing/context.md: "2026-09-22T21:20:53-03:00"
  docs/phases/phase-04-video-channel-management/context.md: "2026-09-22T21:20:53-03:00"
  docs/phases/phase-05-video-watch-page/context.md: "2026-09-29T22:45:01-03:00"
  docs/phases/phase-06-social-interactions/context.md: "2026-10-04T20:51:04-03:00"
  docs/phases/phase-07-home-busca/context.md: "2026-10-11T17:47:13-03:00"
  .claude/skills/testing-guide-nestjs-project/SKILL.md: "2026-10-08T09:21:00-03:00"
  .claude/skills/testing-guide-next-frontend/SKILL.md: "2026-06-29T19:03:26-03:00"
sources_hash:
  docs/project-plan.md: "18d6466649bb"
  docs/decisions/technical-decisions-testes-producao.md: "b1dc18c72cf0"
  docs/decisions/technical-decisions-next-frontend-config-base.md: "8d27d591df0e"
  docs/decisions/technical-decisions-next-frontend-msw-foundation.md: "a53ada59d6a6"
  docs/decisions/technical-decisions-rate-limit-visitor-identity.md: "0d1493a08793"
  docs/decisions/technical-decisions-next-frontend-openapi-typing.md: "371ec55c2f2a"
  docs/phases/phase-01-configuracao-base/context.md: "aed82fcbcf53"
  docs/phases/phase-02-auth/context.md: "2f6ccb7eaebc"
  docs/phases/phase-02-auth-frontend/context.md: "3f0f1efff30f"
  docs/phases/phase-03-upload-processing/context.md: "d10c73e13267"
  docs/phases/phase-04-video-channel-management/context.md: "71811d3a87ee"
  docs/phases/phase-05-video-watch-page/context.md: "71f919de97f4"
  docs/phases/phase-06-social-interactions/context.md: "8732f61e249e"
  docs/phases/phase-07-home-busca/context.md: "592b616d64eb"
  .claude/skills/testing-guide-nestjs-project/SKILL.md: "f0b3a8582444"
  .claude/skills/testing-guide-next-frontend/SKILL.md: "9942ebfdb06d"
---

# phase-07-testes-producao — Context

## Scope

**Phase name:** Página Inicial, Busca e Finalização

**Capabilities** (literal, `docs/project-plan.md`):

- Página inicial com grid de vídeos (thumbnail, título, canal, visualizações e tempo de publicação)
- Filtro de vídeos por categoria na home
- Barra de busca (pesquisa por título e canal)
- Header/navbar com logo, barra de busca, botão de login/avatar e navegação
- Paginação ou scroll infinito nas listagens de vídeos
- Layout responsivo para dispositivos móveis
- Testes dos fluxos principais da plataforma
- Ambiente de produção e deploy

**Slice capabilities** (`covers_capabilities` de `technical-decisions-testes-producao.md`): as duas últimas bullets acima — "Testes dos fluxos principais da plataforma" e "Ambiente de produção e deploy". As seis primeiras pertencem à fatia irmã `home-busca`, já implementada (PR #80); os fluxos dela entram aqui só como alvo dos testes (`depends_on_slices: [home-busca]`).

**Out of scope:** _Not specified._

**Deliverables:** home page, busca, navegação, responsividade, testes realizados e ambiente de produção configurado.

**Affected subprojects:**

- `nestjs-project` — o que a produção exige da API e do worker (migrations compiladas, healthcheck, encerramento gracioso, transporte SMTP autenticado, endpoint público do storage) e a stack real que a suíte ponta a ponta exercita (TD-01, TD-02, TD-05, TD-06, TD-08, TD-10). _(do doc da fatia; a seção da Fase 07 em `project-plan.md` não nomeia subprojetos)_
- `next-frontend` — a suíte Playwright contra o backend real, a imagem de produção do BFF atrás do proxy e o host público do storage nas thumbnails (TD-01, TD-02, TD-05, TD-09). _(idem)_
- Repositório (CI, compose de produção, proxy, entrega) — TD-03, TD-04, TD-07, TD-09, TD-11. _(idem)_

**Deferred subprojects:** _None._

**Sequencing notes:** "> Depende de: todas as fases anteriores"

**Neighbors (for boundary detection only):**

- **Phase 06:** Interações Sociais — likes/dislikes em vídeos e comentários, comentários com respostas e inscrição em canais.
- **Phase 08:** _No phase 08 defined._

## Decisions Index

| Ref | Source | Scope | Topic | Status | Decision | Libraries | Renders in |
|-----|--------|-------|-------|--------|----------|-----------|------------|
| testes-producao/TD-01 | phase | Repo-wide | Camada dos testes ponta a ponta dos fluxos principais | pending | — | — | — |
| testes-producao/TD-02 | phase | Repo-wide | Dados e estado da suíte full-stack | pending | — | — | — |
| testes-producao/TD-03 | phase | Repo-wide | Pipeline de CI | pending | — | — | — |
| testes-producao/TD-04 | phase | Repo-wide | Plataforma de hospedagem | pending | — | — | — |
| testes-producao/TD-05 | phase | Cross-layer | Armazenamento de objetos em produção | pending | — | — | — |
| testes-producao/TD-06 | phase | Backend | Execução das migrations em produção | pending | — | — | — |
| testes-producao/TD-07 | phase | Repo-wide | Proxy reverso, TLS e superfície pública | pending | — | — | — |
| testes-producao/TD-08 | phase | Backend | Envio de e-mail transacional em produção | pending | — | — | — |
| testes-producao/TD-09 | phase | Repo-wide | Build das imagens, entrega e segredos | pending | — | — | — |
| testes-producao/TD-10 | phase | Backend | Saúde, logs e encerramento dos processos | pending | — | — | — |
| testes-producao/TD-11 | phase | Repo-wide | Backup e recuperação dos dados | pending | — | — | — |

_Source files:_

- testes-producao — `docs/decisions/technical-decisions-testes-producao.md` (scope_type: phase, related_phases: [7])

## Capability Coverage

| Capability (from project-plan.md) | Covered by |
|-----------------------------------|------------|
| Testes dos fluxos principais da plataforma | testes-producao/TD-01, testes-producao/TD-02, testes-producao/TD-03 |
| Ambiente de produção e deploy | testes-producao/TD-03, testes-producao/TD-04, testes-producao/TD-05, testes-producao/TD-06, testes-producao/TD-07, testes-producao/TD-08, testes-producao/TD-09, testes-producao/TD-10, testes-producao/TD-11 |

_Só as duas bullets da fatia (`covers_capabilities`); as seis primeiras bullets da fase são cobertas pela fatia `home-busca`. TD-03 é `Transversal — covers:` as duas._

## Decisions Detail

_No decided TDs yet._ _(as 11 TDs da fatia estão `pending`; esta seção é preenchida quando o `/plan-context` rodar de novo depois do `/plan-resolve`)_

## Inherited Decisions Detail

### phase-01-configuracao-base/TD-01

**Recommendation:** Option A (@nestjs/config) — Official, core-team-maintained, guaranteed NestJS 11 compatibility. The `registerAs()` factory pattern solves the TypeORM CLI sharing problem: the factory function can be imported as a plain function by `data-source.ts` while also serving as a DI injection token inside NestJS. Building a custom module recreates solved functionality; third-party packages carry maintenance risk.

**Libraries:** `@nestjs/config@^4.x`

### phase-01-configuracao-base/TD-02

**Recommendation:** Option A (Joi) — First-class integration with `@nestjs/config` via `validationSchema`, requiring zero custom wiring. Handles string-to-number coercion natively. Using a different tool for env validation vs. request validation is reasonable — env config is validated once at startup, DTOs are validated per-request. Zod is elegant but adds a third validation paradigm to the project.

**Libraries:** `joi@^17.x`

### phase-01-configuracao-base/TD-03

**Recommendation:** Option B (Namespaced/grouped with registerAs) — The project roadmap explicitly calls for auth, email, and storage in upcoming phases. Namespaced configs provide clear file boundaries per domain, typed injection via `ConfigType<typeof databaseConfig>`, and natural scalability. The `registerAs()` factory is dual-purpose: DI token inside NestJS and plain importable function for `data-source.ts`.

Initial files for Phase 01:
- `src/config/database.config.ts` — DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME
- `src/config/app.config.ts` — PORT, NODE_ENV

**Libraries:** —

### phase-01-configuracao-base/TD-04

**Recommendation:** Option A (Shared registerAs factory) — Natural outcome of choosing `@nestjs/config` with `registerAs`. The factory is already callable by design. `data-source.ts` imports it, calls `dotenv.config()`, then calls the factory. Zero duplication, minimal code, no extra abstraction.

```
src/config/database.config.ts  →  registerAs('database', () => ({ host, port, ... }))
                                         |                          |
                                    NestJS loads via           data-source.ts imports
                                    ConfigModule.forRoot()     and calls directly
```

**Libraries:** `dotenv` (transitive via `@nestjs/config`)

### phase-02-auth/TD-01

**Recommendation:** Argon2id — For a greenfield project in 2026, Argon2id is the OWASP-recommended choice. The native build dependency is a one-time Docker setup cost. The project has no legacy constraints favoring bcrypt. OWASP minimum: 19MiB memory, 2 iterations.

**Libraries:** `argon2@^0.41.x`

### phase-02-auth/TD-02

**Recommendation:** Option A (@nestjs/passport) — The project plan includes only email/password auth for now, but the plugin architecture costs little and future phases may add social login. Aligns with official NestJS docs, making onboarding and maintenance easier.

**Note:** Decision deliberately diverged from the Recommendation during implementation — custom guards were preferred over `@nestjs/passport` to keep the dependency surface smaller; social login is not on the near-term roadmap, so the plugin-architecture benefit did not justify the extra abstraction layer.

**Libraries:** `@nestjs/jwt@^11.0.0`

### phase-02-auth/TD-03

**Recommendation:** Option A (Refresh Token Rotation) — Provides the strongest security model with automatic theft detection. The DB write overhead is acceptable for a video platform (auth refresh is infrequent vs. video operations). PostgreSQL is already in the stack, so no new infrastructure needed. Race conditions can be mitigated with a short grace period for the old token.

**Libraries:** —

### phase-02-auth/TD-04

**Recommendation:** Option B (Random Opaque Tokens in DB) — Revocability is important: when a user requests a new password reset, previous tokens should be invalidated. The DB table is trivial to implement, and the tokens table can also serve future needs (e.g., API keys). Keeps email tokens decoupled from the JWT auth system.

**Libraries:** —

### phase-02-auth/TD-05

**Recommendation:** Option A (@nestjs-modules/mailer) — Best NestJS integration with minimal boilerplate. Supports SMTP (matching the architecture diagram), works with MailHog/Mailpit for local development without external dependencies, and scales to any SMTP provider in production. Template engine support (Handlebars) simplifies email formatting. No vendor lock-in.

**Libraries:** `@nestjs-modules/mailer@^2.x`, `handlebars@^4.x`

### phase-02-auth/TD-06

**Recommendation:** Option A (class-validator + class-transformer) — This is a backend-only project (no shared schemas with frontend), so Zod's single-source-of-truth advantage is less impactful. class-validator is the documented NestJS approach, and the project already uses decorators extensively (TypeORM entities, NestJS DI). Fewer integration surprises with NestJS 11.

**Libraries:** `class-validator@^0.14.x`, `class-transformer@^0.5.x`

### phase-02-auth/TD-07

**Recommendation:** Option A (Custom Domain Exception Filter) — Provides machine-readable error codes that the Next.js frontend can switch on, without the overhead of RFC 9457's URI-based type system. The project is single-consumer (first-party frontend), so a simple `{ statusCode, error, message }` format with domain codes balances clarity and simplicity. The custom filter cost is low — two small files.

**Libraries:** —

### phase-02-auth/TD-08

**Recommendation:** Option A (@nestjs/throttler) — Native NestJS integration is decisive: the guard system allows scoping rate limiting to `AuthModule` only via module-level `APP_GUARD`, with `@SkipThrottle()` for exemptions. The project is single-instance with no distributed requirements, so in-memory storage is sufficient. Using express-rate-limit would bypass NestJS's DI and guard lifecycle for no clear benefit.

**Libraries:** `@nestjs/throttler@^6.x`

### phase-02-auth/TD-09

**Recommendation:** Option B (Opaque) — Since DB lookup is mandatory (TD-03), JWT signature adds no security value. Opaque tokens are shorter, leak no data, and are simpler to generate.

**Note:** Decision deliberately diverged from the Recommendation — JWT was kept to reuse the access-token signing/verification infrastructure (`@nestjs/jwt`), trading token size and base64-readability for a single token format across the codebase.

**Libraries:** `@nestjs/jwt@^11.0.0`

### phase-02-auth/TD-10

**Recommendation:** Option A — The platform is a video sharing service with URL-based channel handles. A strict `[a-z0-9_]` allowlist is the simplest and most portable choice: no extra dependencies, no edge cases around hyphen positioning, and the `user_<random>` fallback provides a valid handle even for extreme email prefixes. Hyphens can always be added in a future iteration if user feedback justifies it.

**Libraries:** —

### phase-02-auth-frontend/TD-01

**Recommendation:** Three reasons. (1) **Architectural fit.** The strict-BFF model in `next-frontend-config-base/TD-03` already nominates the Route Handler as the only NestJS caller; cookie-based sessions are the natural match, and Auth.js's framework adds layers between the BFF and the cookie that buy nothing because the backend is the auth authority — Auth.js's value (DB adapters, OAuth providers, magic-link, `getServerSession` helpers) is mostly unused in this configuration. (2) **Smaller blast radius.** A ~50-LOC session helper is grep-friendly, debuggable, and test-friendly via the existing MSW+BFF integration test pattern; a misconfigured Auth.js callback is a longer fault-isolation loop. (3) **Compatibility with Next.js 16 / React 19.** Built-in `next/headers` `cookies()` is the canonical primitive both runtimes already use; Auth.js v5 versions track Next.js majors with a lag, adding compatibility risk that Option A does not have. Option C is rejected as unsafe (`localStorage` for refresh tokens) and architecturally regressive (loses RSC personalization).
**Libraries:** —

### phase-02-auth-frontend/TD-02

**Recommendation:** Three reasons. (1) **Defense in depth on the cookie content** — `httpOnly` blocks JS, encryption blocks accidental log/proxy inspection; the marginal cost is one ~3KB dep. (2) **Single cookie to manage** simplifies logout (one `session.destroy()` call) and avoids the orphan-cookie failure mode of Option A. (3) **Room to carry minimal user metadata** (`userId`, `email`, `channelSlug`) lets `app/layout.tsx` RSC render the authenticated chrome (avatar, channel name) without a per-render `/auth/me` round-trip — Phase 04+ gains compound here. Option A is a viable downgrade if the team rejects `iron-session` for any reason; the migration A→B (or B→A) is a one-Route-Handler refactor with no test changes downstream because the BFF interface is unchanged. Option C is rejected: it solves a problem (server-side revocation) the project does not have at the cost of infrastructure the project does not own.
**Libraries:** iron-session

### phase-02-auth-frontend/TD-03

**Recommendation:** The single-flight detail is non-trivial and goes in the helper from day one — tested by MSW with a "two concurrent intercepted upstream calls; one refresh expected" assertion. Option B's client-driven pattern is rejected because it doesn't replace Option A (RSC still needs server-side refresh) — adopting B means doing both. Option C's pre-emptive timer is rejected because the failure modes (multiple tabs, sleep/wake) outweigh the latency saving and force a `"use client"` shell near the root.
**Libraries:** —

### phase-02-auth-frontend/TD-04

**Recommendation:** Three reasons. (1) **Decoupled from TD-05** — works with Route Handlers OR Server Actions; the form code does not change if TD-05 is revisited later. (2) **Aligned with shadcn's canonical form primitive** — the project already commits to `radix-nova` shadcn (`components.json`); `npx shadcn@latest add form` produces react-hook-form wrappers; choosing react-hook-form means using the supported primitive instead of hand-rolling around it. (3) **Zod-first developer ergonomics match the rest of the FE foundation** — `next-frontend-config-base/TD-01` chose Zod 4 for env; the same schemas-as-source-of-truth pattern carries to forms with zero new validator paradigm. Option B is rejected for impedance with shadcn's primitive and for over-investing in progressive-enhancement that the strict-BFF model does not require. Option C is rejected for the per-field boilerplate and the loss of client-side feedback on a project that values quick, type-safe form iteration.
**Libraries:** react-hook-form, @hookform/resolvers

### phase-02-auth-frontend/TD-05

**Recommendation:** Three reasons. (1) **Strict-BFF alignment.** `next-frontend-config-base/TD-03` named Route Handlers as the BFF surface; Option A keeps every mutation visible under `app/api/**`. (2) **Test scaffold already exists** — `next-frontend/CLAUDE.md` § Testing and `next-frontend-msw-foundation` were authored for Route-Handlers-as-functions; Option A reuses them with zero invention. (3) **Single mutation surface** — Phase 02 sets the precedent for Phases 03–07; uniformity beats per-mutation idiom-picking when the cost of inconsistency compounds (Option C). Option B has real ergonomic appeal for the simplest forms but fragments the BFF surface and forces test-pattern reinvention; if the team later wants progressive enhancement for specific forms, the migration A→B is per-form and doesn't require touching unrelated routes — A is the safer default and the cheaper baseline.
**Libraries:** —

### phase-02-auth-frontend/TD-06

**Recommendation:** Two reinforcing reasons. (1) **No first-render flicker, no round-trip** — the session is delivered in the same response as the page HTML; the Client Provider hydrates with the correct initial state; users never see "Login" briefly turn into their avatar. (2) **No new BFF endpoint** — the cookie is the source of truth, RSC reads it, the Provider broadcasts it; the BFF surface stays minimal. The `router.refresh()` requirement after mid-session mutations is a small price (one line in the relevant mutation handler) for the structural benefits. Option B is rejected for the double-read-and-flicker; Option C is dominated by Option B and rejected.
**Libraries:** —

### phase-02-auth-frontend/TD-07

**Recommendation:** Three reasons. (1) **First-paint-correct** — the user sees the right outcome on the first paint, no skeleton, no flicker. (2) **Single integration pattern across both flows** — confirmation is RSC-only; reset is RSC + Client form (TD-04, TD-05 patterns reused) — both share the "RSC owns the token, Client Component owns the input" split. (3) **Email-prefetch behavior** is solved at the backend's idempotent-confirmation level (a small note for `/plan-build` to confirm; not a separate TD). Option B's Route-Handler-as-link-target adds redirects for no clean gain. Option C is dominated.
**Libraries:** —

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

### video-channel-management/TD-01

**Recommendation:** a capability descreve categorias "disponíveis na plataforma", isto é, um conjunto fixo definido pelo produto, e nenhuma fase do plano prevê gestão de categorias pelo usuário. Nesse cenário o enum entrega o que a arquitetura contract-first do projeto mais valoriza: os valores válidos atravessam `openapi.json` → `types.gen.ts` → `contracts.ts` sem endpoint nem fetch, mantendo o `select` do formulário estaticamente tipado. A Option B passa a ser a escolha correta no dia em que categorias virarem dado administrável — o custo de migrar enum → tabela é uma migration localizada.
**Libraries:** —

### video-channel-management/TD-02

**Recommendation:** decisiva é a propriedade de ownership de escrita: `status` já pertence ao Video Worker, e as Options B e C fariam o usuário escrever no mesmo campo que um processo assíncrono, criando uma corrida real (publicar durante reprocessamento). Além disso a capability do painel pede explicitamente "tempo de publicação", que só `published_at` fornece corretamente — `updated_at` é invalidado por qualquer edição de título. O custo (uma coluna extra) é pago uma vez; a conflação seria desfeita com migration de dados.
**Libraries:** —

**Revisions:**
- 2026-08-08 — Copy e cor do frontend (mesma Option A; nada muda no modelo de dados). O enum `visibility` (`public | unlisted`) continua igual no banco; só a exibição na UI muda: o valor `unlisted` é rotulado como **"Indisponível"** e os chips do painel e da edição de vídeo usam os tokens de tema já existentes em `globals.css`, sem cor nova — `Publicado` (status) → `success`; `Rascunho` (status) → `muted`; `Público` (visibilidade) → `muted`; `Indisponível` (visibilidade) → `warning`, sinalizando alcance restrito. Rationale: manter a UI 100% pt-BR (nunca o termo em inglês "Unlisted") e não introduzir cor fora do design system.
- 2026-09-20 — Assinatura de URL de vídeo passa a respeitar rascunho e visibilidade (mesma Option A; nenhuma coluna nova). O endpoint de assinatura criado na Fase 03 (`upload-processing/TD-08`) só assina vídeo com `published_at` nulo (rascunho) para o dono do canal; vídeo publicado — `public` ou `unlisted` — é assinado para qualquer chamador que tenha o `publicId` (`unlisted` continua "somente via link"). O plan-build deve emitir SI para essa alteração no módulo de vídeos do `nestjs-project/`. Rationale: resolve AMB-2 (/plan-validate) — a Fase 04 introduz os estados; deixar a checagem para a Fase 05 manteria o rascunho assistível por quem tiver o `publicId`.

### video-channel-management/TD-03

**Recommendation:** thumbnail é um arquivo pequeno, e o que domina a decisão aqui não é banda, é onde a validação acontece. Multipart é o único dos três em que o servidor inspeciona o arquivo **antes** de persistir, o que importa porque a thumbnail é conteúdo exibido publicamente. A Option B aplica a solução de um problema (arquivo gigante, conexão instável) a um caso que não o tem, e o faz no trecho de código mais frágil da Fase 03; a Option C troca validação confiável por uma economia de banda irrelevante nessa escala.
**Libraries:** multer

**Revisions:**
- 2026-09-20 — A thumbnail customizada é enviada no mesmo multipart do envio do formulário de edição do vídeo (mesma Option A). O `ThumbnailUploader` não tem mutation própria: escolher o arquivo só gera preview local e a gravação acontece no submit ("Salvar rascunho", "Publicar" ou "Salvar alterações"); cancelar a edição não altera a thumbnail. O endpoint de edição do vídeo passa a aceitar `multipart/form-data` com `FileInterceptor`, e os campos de texto chegam como partes do formulário. Rationale: resolve OQ-14 (/plan-validate) — uma única operação de salvar, sem thumbnail trocada antes de o usuário confirmar.

### video-channel-management/TD-04

**Recommendation:** o argumento decisivo é o custo da operação inversa: com a Option A, desfazer uma troca de thumbnail exige reprocessamento completo do vídeo no worker, enquanto na B é `UPDATE ... SET custom_thumbnail_key = NULL`. Preserva também a separação de ownership que a TD-02 estabelece: o worker escreve apenas seus próprios campos. A API deve expor uma única URL já resolvida, de modo que o frontend nunca implemente a precedência.
**Libraries:** —

### video-channel-management/TD-05

**Recommendation:** a capability obriga a expor os três números, então a Option B está fora; entre A e C, o fator decisivo é que a Fase 07 introduz paginação sobre essas mesmas listagens, e agregação por linha é justamente o padrão que não escala ali. Adotar A agora fixa o contrato uma única vez e deixa para as Fases 05/06 apenas a responsabilidade de incrementar — que é o escopo natural delas. O risco de divergência se mitiga exigindo que o incremento futuro ocorra na mesma transação do evento que o origina.
**Libraries:** —

### video-channel-management/TD-06

**Recommendation:** as duas listagens desta fase são escopadas por canal, portanto de baixa cardinalidade, e o painel de gerenciamento se beneficia de "página N" e de um total visível, que o cursor não oferece. A instabilidade sob concorrência do offset é irrelevante aqui, já que só o próprio dono insere vídeos no seu canal. Cursor permanece a escolha certa para o feed global da home (Fase 07), de alta cardinalidade e inserção por muitos autores — as duas estratégias podem coexistir, cada uma na superfície onde suas propriedades importam; esta TD vincula apenas as listagens desta fase.
**Libraries:** —

**Revisions:**
- 2026-09-20 — A listagem da página pública do canal usa `limit` padrão de 8 vídeos por página (grade 4×2 do design); a contagem "N vídeos" e o total da paginação consideram apenas vídeos publicados e públicos. O tamanho de página do painel não é fixado por esta TD (mesma Option A). Rationale: resolve OQ-19 (/plan-validate) — confirma o tamanho de página do mock contra a paginação offset/limit.

### video-channel-management/TD-07

**Recommendation:** a Option D está excluída pela capability, e entre A, B e C o critério é se o custo permanente da B se justifica agora. A plataforma ainda não tem links externos de entrada nem audiência acumulada, então preservação de link é um problema que ela não possui hoje, enquanto a segunda consulta no caminho de leitura de canal seria paga em toda requisição para sempre. Recomendo A registrando explicitamente o trade-off: se e quando houver tráfego externo relevante, migrar para B é aditivo (criar a tabela e passar a alimentá-la), não uma reescrita. Vale reservar `nickname_changed_at` na modelagem apenas se o produto sinalizar preocupação com squatting.
**Libraries:** —

### video-channel-management/TD-08

**Recommendation:** elimina a colisão por construção em vez de administrá-la: a Option C exigiria uma blocklist que precisa ser lembrada a cada rota nova das próximas três fases, e esquecer de atualizá-la produz um bug difícil de atribuir. Entre A e B a diferença é sobretudo idiomática, e A mantém a URL curta sem reintroduzir ambiguidade, dado que o `@` está fora do allowlist `[a-z0-9_]` já decidido.
**Libraries:** —

**Revisions:**
- 2026-07-31 — Scope reclassificado de Frontend para Cross-layer. Rationale: resolve IC-1 (/plan-validate) — o esquema de URL depende do allowlist de nickname (`[a-z0-9_]`, phase-02-auth/TD-10), que também condiciona como o backend expõe a busca de canal por nickname; classificar como Cross-layer permite que a decisão renderize nas seções voltadas a backend do artefato de build mesmo com o UI Inventory ainda diferido.

### video-channel-management/TD-09

**Recommendation:** o formulário desta fase é substancial e inclui upload, o que exclui a Option C por capacidade e desaconselha a B por risco de perda de estado. Além disso a Option B é **aditiva sobre a A**: a interceptação se sobrepõe a uma rota que precisa existir de todo modo, então escolher A agora não fecha a porta para o modal depois — o contrário não é verdade. Começar por A entrega a capability com o padrão de rota e de mutação já estabelecidos no projeto.
**Libraries:** —

**Revisions:**
- 2026-09-20 — As três rotas do canal autenticado (`/channel/videos`, `/videos/{publicId}/edit`, `/channel/settings`) compartilham um layout de route group autenticado com `SiteNavbar` e `UserMenu`; a rota dedicada da edição de vídeo continua a mesma (mesma Option A). O "Cancelar" da edição do canal navega para `/channel/videos`. Rationale: resolve OQ-17 e OQ-18 (/plan-validate) — o Figma só mostra o chrome no painel; o layout compartilhado evita duplicar a navbar e dá acesso ao logout nas telas de edição.

### video-channel-management/TD-10

**Recommendation:** o fator decisivo é que este é um projeto greenfield sem nenhum dado real de uso para calibrar uma taxonomia ampla como a da Option A; decidir 15 categorias agora é decidir 15 coisas às cegas, e boa parte provavelmente erra. A Option C parece mais simples mas na prática só adia a pergunta que a Option B já resolve com um catch-all. A assimetria de custo também favorece B: crescer um enum pequeno depois (Fase 05/07, quando houver conteúdo real para calibrar contra) é uma migration aditiva barata; a Option A já começa no tamanho que a B só atingiria com evidência real.
**Libraries:** —

### video-watch-page/TD-01

**Recommendation:** a capacidade descreve exatamente os controles nativos, e a entrega é MP4 progressivo por URL pré-assinada, sem streaming adaptativo, legendas ou DRM que justifiquem uma biblioteca. Trocar 53 kB ou 195 kB por controles que o navegador já fornece é custo sem contrapartida nesta fase. O caminho de saída é claro: se a Fase 07 trouxer HLS, legendas ou telemetria de reprodução, o TD é superseded por Vidstack, que é a opção com melhor relação peso/recursos entre as duas bibliotecas — o Plyr está sendo descontinuado e absorvido pelo Video.js, então não entrou como opção.
**Libraries:** —

### video-watch-page/TD-02

**Recommendation:** o trade-off de expor um link temporário já foi aceito em `TD-08`; o que falta é dimensionar o prazo para o uso real. A Option C reverte uma decisão vigente e sai de escopo. A Option B resolve um risco que hoje é hipotético, ao custo de um caminho de erro difícil de testar com o player nativo do TD-01; ela é o caminho natural se algum dia surgir requisito de revogação imediata.
**Libraries:** —

**Revisions:**
- 2026-09-26 — Validade de 6 h confirmada; deixa de ser premissa e passa a valor firme. Mesma Option A, nenhuma mudança de mecanismo. Rationale: resolve OQ-6 (/plan-validate) — o número foi fixado por premissa na redação original e o usuário o confirmou explicitamente no /plan-resolve.

### video-watch-page/TD-03

**Recommendation:** separa "abriu a página" de "assistiu", que é a distinção que dá sentido ao número, sem introduzir armazenamento de estado por visitante. A Option A é barata mas entrega uma métrica que engana. A Option C é o destino provável quando a contagem passar a ter peso — em ranking ou recomendação —, e aí o custo de privacidade e infraestrutura se justifica; hoje não.
**Libraries:** —

**Revisions:**
- 2026-09-26 — Limiar de reprodução efetiva alterado de **5 s para 10 s**. Mesma Option B: o mecanismo continua sendo o endpoint dedicado disparado pelo player, só o valor muda. Rationale: resolve OQ-6 (/plan-validate) — os 5 s eram premissa, não recomendação; 10 s exige intenção real de assistir sem penalizar vídeo curto, ao contrário dos 30 s da referência clássica de mercado, que zeraria a contagem de qualquer vídeo mais curto que isso.
- 2026-09-29 — Limiar **revertido de 10 s para 5 s**, desfazendo a revisão acima. Mesma Option B: o mecanismo não muda, só o valor. Rationale: resolve IC-3 (/plan-validate) — o `**Context:**` do `TD-05` e a prosa inteira do `TD-06` nunca acompanharam a mudança para 10 s e seguiam citando 5 s; das duas formas de alinhar as três fontes, a escolhida foi trazer o `TD-03` de volta ao valor que as outras duas já usavam. **Consequência assumida:** o verbo do inventário e o digest do `context.md` passam a dizer 10 s contra os 5 s desta decisão — o `/plan-resolve` não edita inventário, então fechar isso exige um extension run do `/screen-inventory`.

### video-watch-page/TD-04

**Recommendation:** é a única determinística, e determinismo aqui vale mais do que variedade: permite testar a sidebar sem fixar semente e cachear a resposta. A Option C fica natural quando a contagem do TD-03 tiver histórico; a Option B tem um custo de banco que não se paga.
**Libraries:** —

**Revisions:**
- 2026-09-26 — Recorte da sidebar fixado: **4 vídeos por página, com "ver mais" carregando as próximas páginas**. Mesma Option A — origem e ordenação inalteradas (mesma categoria, `published_at` desc, excluindo o vídeo atual, rascunhos e `unlisted`); o que se acrescenta é o tamanho do recorte e a paginação, que a decisão original não fixava. O contrato do endpoint expõe offset/limit, seguindo o padrão de `video-channel-management/TD-06`. Rationale: resolve AMB-1 (/plan-validate) — sem o tamanho, o plan-build não escreveria nem o contrato nem o SI da sidebar. Consequência assumida: o estado visual de "ver mais" e o de sidebar carregando não existem no Figma e serão implementados seguindo os padrões da Fase 04 (ver OQ-3).

### video-watch-page/TD-05

**Recommendation:** **Option B**, com C como caminho declarado para quando houver mais de uma instância. Três razões. (1) **O problema real desta fase não é a ausência de limite, é o limite errado** — o default existe e já cobre o endpoint; o que não existe é distinção entre um orçamento de autenticação e um de navegação, e é exatamente isso que o `@Throttle()` resolve, com uma linha. (2) **O Redis resolveria um problema que a fase não tem ainda** — reinício e multi-instância são reais, mas o deploy é de instância única até a Fase 07 tratar produção; acoplar o caminho de request ao Redis agora obriga a decidir o comportamento em caso de queda, uma decisão sem informação hoje. Subir de B para C depois é trocar o `storage` do módulo, sem tocar nas rotas. (3) **A Option D é desproporcional a uma métrica que o próprio `TD-03` decidiu não ser exata** — gastar contrato dos dois lados para encarecer, sem impedir, uma inflação de contador contradiz a escolha já feita. A Option A é defensável se a resposta for "a contagem não importa a ponto de justificar uma linha", mas então o 429 no meio da reprodução do usuário legítimo continua, e esse é um custo de produto, não de métrica.

Sobre os números, e explicitamente como premissa a confirmar no mesmo espírito do `TD-02` e do `TD-03`: sugiro **30 requisições por 60 s por IP** nessa rota. Trinta vídeos iniciados por minuto está muito acima de qualquer navegação humana e ainda assim é um terço do que um laço trivial alcançaria contra o default. O número é discutível; o que não é discutível é que ele deve ser diferente do orçamento de login.
**Libraries:** —

**Revisions:**
- 2026-09-29 — **30 requisições por 60 s por IP confirmadas**; deixa de ser premissa e passa a valor firme. Mesma Option B, nenhuma mudança de mecanismo. Rationale: resolve OQ-9 (/plan-validate) — o número foi fixado por premissa na redação original, no mesmo espírito do `TD-02` e do `TD-03`, e o usuário o confirmou explicitamente no /plan-resolve.

### video-watch-page/TD-06

**Recommendation:** **Option A como base, com C aplicada a um único E2E de fumaça.** O raciocínio é que as duas perguntas têm respostas diferentes e tentar uma resposta só é o que trava a decisão.

Para o **gatilho dos 5 s**, que é a regra de negócio real e cara de errar, a Option A é a única viável: o jsdom não reproduz mídia por construção, então nenhuma quantidade de bytes ajuda, e a fachada permite afirmar "aos 4,9 s não chama, aos 5,1 s chama uma vez só" em milissegundos. Depender de relógio real aqui, como a B exige, é lento e instável.

Para a **integração**, um único teste em Playwright com `page.route()` na origem do storage responde a pergunta que a A não responde — o `src` aponta para o lugar certo e o elemento consegue carregar — sem espalhar binário e espera por toda a suíte. Um teste, não uma política.

A Option B é a que menos entrega pelo custo: same-origin apaga a característica que torna o caminho real arriscado. A Option D seria aceitável se o gatilho dos 5 s não existisse, mas ele existe e é lógica, não pixel.

Uma consequência que precisa ser aceita junto: a fachada de mídia da Option A é superfície de produção que existe parcialmente para o teste. Vale enquanto for um ponto fino de indireção sobre o elemento; se começar a reimplementar o player, a decisão estará sendo mal aplicada.
**Libraries:** —

### social-interactions/TD-01

**Recommendation:** o fator decisivo é que a Option B abre mão de FK justamente num projeto onde vídeos e comentários serão apagados, e a limpeza manual de órfãos é dívida silenciosa. Entre A e C, as duas preservam integridade; A ganha por legibilidade e por índices mais simples, e o custo que ela cobra — duplicação de duas colunas e de um serviço pequeno — é baixo e visível, ao contrário do custo de C, que é um `CHECK` e dois índices parciais que crescem a cada alvo novo. O ganho de B só se realizaria com muitos alvos, e esta fase tem exatamente dois.
**Libraries:** —

### social-interactions/TD-02

**Recommendation:** a Option C está fora por contrariar decisão herdada que já ponderou o mesmo trade-off. Entre A e B, o argumento de B é real e é o mais forte em corretude; o que decide contra ele neste projeto é que a Fase 05 **já mostrou o custo de testar concorrência aqui**: o teste de duas chamadas simultâneas passou, mas o aviso do driver `pg` revelou que as queries foram serializadas no mesmo client, de modo que a atomicidade veio do SQL e não da observação do teste. Trigger moveria mais lógica para essa zona difícil de observar. A Option A mantém a aritmética do toggle — que é a parte com ramificação de verdade — em código testável sem banco, e o `UPDATE … SET x = x + :d` continua atômico no nível do SQL exatamente como o `views_count` da Fase 05. O risco que A aceita é escrita fora do serviço; mitiga-se mantendo a tabela de reações sem nenhum outro produtor.
**Libraries:** —

### social-interactions/TD-03

**Recommendation:** é a que não mexe em schema nem em contrato, e a assimetria que ela introduz é a convenção que o usuário já encontra nas plataformas de vídeo atuais, não uma invenção deste projeto. A Option C é tentadora por "deixar pronto", mas o projeto já tem a lição de colunas inertes: `likes_count` ficou em zero da Fase 04 até esta, e o custo de mantê-las nunca é zero. Se a tela da Fase 06, quando desenhada, mostrar um número de dislikes, a Option B é uma migração pequena e isolada — muito mais barata que carregar uma coluna sem consumidor por fases a fio.
**Libraries:** —

### social-interactions/TD-04

**Recommendation:** a limitação verificada do `TreeRepository` tira boa parte do apelo de B e C: adotá-las e ainda assim escrever a listagem em query builder cru é pagar a complexidade sem receber a conveniência. Entre A e D, o que decide é que a profundidade ilimitada é uma capacidade que o produto não pediu — a capability diz "respostas a comentários", e respostas a respostas não aparecem em nenhum outro bullet nem no entregável da fase. A Option A entrega o que está escrito com SQL comum, paginável e ordenável, e deixa a porta aberta: `parent_id` nulável é o mesmo schema de D, então aprofundar depois é mudar leitura e UI, não migrar dados.
**Libraries:** —

### social-interactions/TD-05

**Recommendation:** ordenar por data é o que torna o feedback de postagem correto sem nenhum mecanismo extra, e é coerente com o que a Fase 05 já fez na sidebar de sugestões. Entre A e B, B custa uma query a mais na primeira carga e **elimina** o N+1 que A convida; o limite por raiz que B precisa de qualquer forma é o mesmo controle "ver mais" que a Fase 05 já implementou e que o frontend já sabe renderizar. A Option C é a melhor ordenação para leitura madura, mas depende de volume que o produto ainda não tem, e introduz o problema de "cadê meu comentário" que exigiria resolver um segundo modo de ordenação nesta mesma fase.
**Libraries:** —

### social-interactions/TD-06

**Recommendation:** não pelo desempenho, que a Option A entrega igualmente bem no caso de hoje, mas por **consistência de padrão**: esta fase já vai construir e testar o mecanismo de contador transacional do TD-02 para likes e comentários, e ter um terceiro contador seguindo regra diferente significa dois modelos mentais, dois jeitos de testar e uma pergunta a mais em cada revisão futura. O custo marginal de B, tendo o mecanismo do TD-02 pronto, é uma coluna e uma chamada. A Option A é a escolha certa se o TD-02 for decidido como `COUNT` derivado — as duas devem andar juntas.
**Libraries:** —

### social-interactions/TD-07

**Recommendation:** o entregável da fase diz "listagem de canais seguidos", e a Fase 07 tem como bullets próprios a grade de vídeos, a paginação e o scroll infinito. Construir um feed aqui é antecipar o trabalho da 07 num lugar onde ele será reavaliado, e a Option C paga a complexidade do feed sem entregar o feed. Se a intenção do produto for realmente um feed, o lugar natural é a Fase 07, onde a infraestrutura de listagem será construída uma vez e usada pela home e por esta área. **Esta é a recomendação com maior chance de estar errada por leitura de escopo** — se "acesso rápido aos vídeos" significa feed para você, a Option B é defensável e o custo de decidir isso agora é muito menor que o de descobrir depois.
**Libraries:** —

**Revisions:**
- 2026-10-04 — Registrado que o "acesso rápido aos vídeos" da bullet do plano é satisfeito pelo **link para a página pública do canal**: os vídeos ficam a dois cliques, não a um. Mesma Option A, nenhuma mudança de mecanismo nem de escopo. Rationale: resolve IC-5 (/plan-validate) — a bullet do `project-plan.md` promete acesso aos vídeos e este TD entrega lista de canais; das três formas de alinhar as duas fontes, a escolhida foi registrar a leitura por escrito aqui, sem editar o plano e sem antecipar para esta fase o feed que a Fase 07 vai construir. O próprio `**Recommendation:**` acima já marcava esta como a recomendação com maior chance de erro por leitura de escopo; a divergência passa a ser decisão consciente e não omissão.

### social-interactions/TD-08

**Recommendation:** é a única que entrega o feedback imediato sem acrescentar dependência, e a primitiva já está na versão instalada. A Option B é mais simples e seria suficiente para a inscrição, que é clicada uma vez; para like e dislike, que são clicados muito e esperados como instantâneos, ela entrega a pior sensação da fase. A Option C resolve mais do que o problema desta fase e cria um segundo cache ao lado do que o App Router já mantém — se a Fase 07 mostrar necessidade real de cache de cliente, aí é a hora de reabrir, com mais evidência do que botões de like.
**Libraries:** —

### social-interactions/TD-09

**Recommendation:** **Option B**, com a Option C declarada como caminho para quando houver evidência de colisão por NAT ou de abuso que troca de IP — exatamente a forma como o `video-watch-page/TD-05` declarou o Redis para o caso multi-instância. Três razões. (1) A Option D está fora por um argumento verificável e não por gosto: 10/60 s compartilhado entre like, dislike, comentário e inscrição é estourado por leitura normal de uma thread, e o modo de falha é um botão que para de responder sem explicação. (2) Entre A e B, o que decide é que **as duas pontas têm perfis de abuso opostos** e um número único não serve às duas — e o custo de B sobre A é um segundo valor no mesmo decorator, não um mecanismo novo. (3) A Option C acerta no diagnóstico — por IP é mesmo o rastreador errado para rota autenticada — mas paga com alteração no `forRoot` de outra fase e com código custom para resolver um cenário que o projeto ainda não observou; é uma Revision barata de aplicar depois, sem trocar a letra, se a evidência aparecer.

Valores sugeridos para o preenchimento: **60/60 s** para reações e inscrição, **5/60 s** para criação de comentário e de resposta. Cinco comentários por minuto já é digitação humana rápida; sessenta toggles por minuto cobre leitura ativa de uma thread longa com folga. Os dois números são parâmetros e podem ser revisados por `/decide` sem trocar a opção.
**Libraries:** —

### social-interactions-anonymous-gate/TD-01

**Recommendation:** é a única das três em que o controle visível tem uma consequência útil para quem não está logado, e a conversão de visitante anônimo em cadastrado é justamente o que a página pública existe para fazer num produto cujo conteúdo é aberto. A Option B é defensável e mais barata, mas joga fora o ponto de conversão mais natural da plataforma em troca de evitar um redirecionamento. A Option C tem o pior perfil: paga o custo de renderizar o controle e não entrega nem a ação nem o caminho para obtê-la. O preço da A é a dependência do TD-03 — sem retorno pós-login a decisão fica pela metade, e por isso os dois devem ser decididos juntos.
**Libraries:** —

### social-interactions-anonymous-gate/TD-02

**Recommendation:** a Option C está fora porque entrega estado errado no recarregamento, que é o caminho mais comum de quem volta a um vídeo. Entre A e B o fator decisivo é que a B reintroduz exatamente o flicker de primeira pintura que o `phase-02-auth-frontend/TD-06` decidiu evitar no chrome autenticado, e seria incoerente aceitar aqui o que foi rejeitado lá por um ganho de cache que o projeto ainda não coleta — não há CDN nem cache compartilhado em frente à API, e a Fase 07 pode separar os contratos se e quando a home precisar. O custo honesto da A é um helper novo de leitura opcionalmente autenticada em `lib/api/`: o `fetchFromUpstream` não pode ser reaproveitado, porque o `redirect("/login")` dele é incompatível com página pública; ele precisa degradar para anônimo tanto na ausência de sessão quanto num `401` de token expirado, e esse segundo caminho é o que deve ser coberto por teste.
**Libraries:** —

### social-interactions-anonymous-gate/TD-03

**Recommendation:** é a única que fecha o ciclo que a Option A do TD-01 abre, e o faz reusando contrato, validador e vocabulário que já existem no repositório para o retorno pós-refresh, em vez de criar um segundo mecanismo paralelo para o mesmo problema. A Option B resolve o mesmo com estado oculto e ciclo de vida próprio, custo que só se justificaria se houvesse exigência de não expor o destino, que não há. A Option C é coerente apenas se o TD-01 for decidido como Option B ou C — se o anônimo não é convidado a logar a partir da ação, não há para onde voltar; nesse caso este TD inteiro perde objeto e deve ser decidido como C.
**Libraries:** —

### home-busca/TD-01

_(from slice home-busca)_

**Recommendation:** Option B. Consolida a regra "listável" num ponto só, que é o que o princípio de Single Responsibility do projeto pede (a regra já está duplicada antes desta fase), e mantém a busca como página própria, o destino natural de uma barra presente em todas as telas. A categoria vai na URL **com o valor do enum como está** (`?category=Música`, percent-encoded pelo navegador). Criar um mapa de slugs só para a URL seria a primeira tabela de categorias fora do `openapi.json` e contrariaria o `video-channel-management/TD-01`, cuja vantagem era justamente não ter mapa. O item da listagem reutiliza o shape de `SuggestedVideoListItem`, que já carrega o canal.
**Libraries:** —

**Revisions:**

- 2026-10-11 — Estados sem desenho e destinos do `VideoCard` fixados no resolve (mesma Option B):
  - carregamento, erro e vazio seguem os padrões das Fases 04–06: `loading.tsx` com skeleton da grade, `error.tsx` e estado vazio com mensagem para home sem vídeos, categoria sem vídeos e busca sem resultados. No mobile, a busca vazia reaproveita o estado desktop em coluna única. Esses critérios de aceite ficam argumentados, não observados;
  - o `VideoCard` leva a `/videos/{publicId}` pela thumbnail e pelo título, e a `/@{nickname}` pelo avatar e pelo nome do canal, como links irmãos (sem link aninhado). O `sizes` da thumbnail acompanha a variante `size=desktop|mobile`, com largura cheia no mobile.
  Rationale: resolve OQ-14 e OQ-17 (/plan-validate), registrado aqui porque o `**Decision:**` não chega ao `context.md` e o `/plan-build` lê esta prosa.

### home-busca/TD-02

_(from slice home-busca)_

**Recommendation:** Option A. É o único par que serve igualmente à home e à busca, sem um segundo mecanismo, e não acrescenta nenhum padrão novo ao frontend. A perda é a sensação de feed. A instabilidade sob concorrência, que motivou a sugestão de cursor no `video-channel-management/TD-06`, só aparece na fronteira de página, num catálogo que ainda não tem volume para que isso seja frequente. O tamanho de página deve ser múltiplo comum das colunas da grade do TD-08 (12 divide 1, 2, 3 e 4 colunas); o valor exato fica para o resolve. Se a decisão for a Option C, ela obriga a busca a ordenar por recência (TD-04).
**Libraries:** —

**Revisions:**

- 2026-10-11 — Tamanho de página fixado em **12 vídeos** para a home e a busca (12 divide 1, 2, 3 e 4 colunas). A paginação usa `components/ui/pagination.tsx` sem alteração, inclusive abaixo de `sm`, onde mostra só os chevrons; a divergência dos frames de 375 px, que mostram o texto, fica aceita. Anterior e Próxima ficam desabilitados nas pontas (`aria-disabled`) e, com uma página só, a paginação não é renderizada, como já faz `app/channels/[nickname]/page.tsx`. Mesma Option A. Rationale: resolve OQ-2 e OQ-13 (/plan-validate) — o tamanho era premissa da Recommendation, e o comportamento da paginação no mobile não estava desenhado.

### home-busca/TD-03

_(from slice home-busca)_

**Recommendation:** Option A. Reproduz a escolha do `video-watch-page/TD-04` pelo mesmo motivo: determinismo vale mais que variedade enquanto `views_count` não tiver histórico. Uma ordem por "em alta" só fica honesta com contagem por janela de tempo, que não existe no modelo. A Option C pode entrar depois como Revision barata, acrescentando `sort` sem quebrar o contrato.
**Libraries:** —

### home-busca/TD-04

_(from slice home-busca)_

**Recommendation:** Option A. "Título e canal" são campos curtos e nomes próprios, onde casar trecho importa mais que stemming, e o nickname `[a-z0-9_]` é literalmente uma string a casar. Os resultados são ordenados por **recência**, como a home (TD-03), e não por relevância. Isso mantém a busca compatível com qualquer escolha do TD-02, ao custo de não promover o melhor casamento ao topo. Cabe fixar no resolve um comprimento mínimo do termo, 2 ou 3 caracteres, para não cair em varredura. A Option B é o passo natural se a busca um dia incluir a descrição, que é texto corrido e se beneficia de stemming.
**Libraries:** —

**Revisions:**

- 2026-10-11 — Comprimento mínimo do termo fixado em **3 caracteres**, o menor que gera trigrama, para a busca nunca cair em varredura do índice. O query DTO do Nest rejeita `q` mais curto, e `/results` com termo abaixo do mínimo não chama o upstream e mostra um aviso no lugar dos resultados. Mesma Option A. Rationale: resolve OQ-4 (/plan-validate) — a Recommendation deixava o valor (2 ou 3) para o resolve.

### home-busca/TD-05

_(from slice home-busca)_

**Recommendation:** Option A. Atende a bullet literalmente com a menor superfície e mantém a busca como um modo da mesma listagem do TD-01. **É a recomendação com maior chance de estar errada por leitura de escopo:** se "pesquisar por canal" significa "encontrar o canal", a Option B é defensável e barata, porque o componente de lista de canais já existe.
**Libraries:** —

### home-busca/TD-06

_(from slice home-busca)_

**Recommendation:** Option A. Uma barra presente em toda tela pede o modelo que não depende de estar numa página específica, e o `next/form` entrega navegação no cliente com prefetch sem estado próprio. Com a Option A, a navbar continua quase toda servidor: só o form e o link ativo são cliente. As Options B e C são incrementos possíveis sobre a A, sem trocar a rota nem o contrato.
**Libraries:** —

### home-busca/TD-07

_(from slice home-busca)_

**Recommendation:** Option A. Com quatro destinos, a sidebar da Option B custa um retrofit de largura em todas as telas sem ter o que preencher, e a Option C duplica a navegação e colide com o player. A Option A é a única que muda **só** o chrome. Consequência assumida: a navbar passa a ser montada uma vez em layout, e não mais por página, para que busca e navegação não precisem ser repetidas nas telas.
**Libraries:** —

**Revisions:**

- 2026-10-11 — Chrome e navegação fixados no resolve (mesma Option A):
  - **Navbar única.** A navbar desenhada (`PublicSiteNavbar` estendida com busca e navegação) passa a ser o chrome de todas as telas, inclusive as do studio (`/channel/videos`, `/videos/{publicId}/edit`, `/channel/settings`), montada uma vez em layout. A `SiteNavbar` do route group autenticado é substituída por ela (Revision correspondente em `video-channel-management/TD-09`).
  - **Destinos.** Início / Canais seguidos / Meus vídeos, como no desenho, no lugar da lista do Context. O menu do usuário (avatar no desktop, bloco do usuário no sheet) ganha "Seu canal" → `/@{nickname}`, que hoje não tem link no chrome. "Enviar vídeo" continua pelo botão de `/channel/videos`.
  - **Mobile anônimo.** O sheet anônimo mostra um botão "Entrar" no lugar de `sheet-user` e "Sair", e só os links públicos (Início); as rotas do studio ficam ocultas. A barra mobile fechada não mostra avatar nem para o usuário logado: tudo fica no sheet, seguindo a barra do frame `84:299`.
  - **Primitivo.** A `NavigationSheet` compõe um `components/ui/sheet.tsx` novo (o Sheet do shadcn sobre o Dialog do Radix já instalado).
  - **Logout.** A chamada a `POST /api/auth/logout` sai de `components/layout/channel-user-menu.tsx` para um módulo compartilhado em `lib/auth` (ex.: um hook `useLogout`), consumido pelo menu do usuário e pelo "Sair" do sheet; cada ponto mantém o próprio visual.
  Rationale: resolve AMB-1, OQ-11, OQ-12, OQ-15 e OQ-16 (/plan-validate), registrado aqui porque o `**Decision:**` não chega ao `context.md` e o `/plan-build` lê esta prosa.

### home-busca/TD-08

_(from slice home-busca)_

**Recommendation:** Option B. É a única que entrega "layout responsivo" para a plataforma toda sem trocar a cota do Figma por frames de telas que, no mobile, só empilham o que já existe. O ponto em que a Option B é mais fraca, mobile argumentado e não observado, já foi aceito antes no projeto: na Fase 05, estados sem desenho foram implementados por padrão. A recomendação vem com um alerta de processo: home e resultados **também** não têm frame desktop. O `screen-inventory` desta fatia depende de desenhá-los de qualquer forma, então os frames mobile delas entram no mesmo lote.
**Libraries:** —

### home-busca/TD-09

_(from slice home-busca)_

**Recommendation:** Option A nesta fatia, com a propagação do IP real (Option C) registrada como task separada. A Option B parece prudente, mas na topologia atual troca abuso por indisponibilidade geral. A Option C é a correção certa, mas o alcance é o throttler inteiro, e misturá-la aqui viola a regra de um escopo por vez. Quando ela existir, acrescentar `@Throttle` à home e à busca é uma Revision barata deste TD.
**Libraries:** —

**Revisions:**

- 2026-10-11 — Decisão C, diferente da Recommendation A, que foi escrita antes da task `rate-limit-visitor-identity` (PRs #71 a #73). Essa task entregou a Option C por outro mecanismo:
  - o BFF repassa `X-Client-IP` autenticado por `INTERNAL_API_SECRET` (`rate-limit-visitor-identity/TD-02`), em vez de `X-Forwarded-For` com `trust proxy`;
  - o rastreador é `user:<sub>` para quem está logado e `ip:<ip>` para anônimo (`TD-03`);
  - o default global virou o orçamento de leitura de 120 req/60 s por visitante (`TD-04`).
  Home e busca ficam nesse default, sem decorator próprio, e esta fatia não tem SI de throttler. O Context deste TD, que descreve o teto de 10 req/min por IP, ficou superado. **Precedência (IC-1):** para rate limit valem `rate-limit-visitor-identity/TD-03` e `TD-04` sobre a prosa herdada de `phase-02-auth/TD-08` (default de 10/60 s por IP, `@SkipThrottle()` para exceções), `video-watch-page/TD-05` (o número de 30/60 s da view continua; o rastreador passa a ser por visitante) e `social-interactions/TD-09` (o rastreador por usuário já está aplicado). Rationale: resolve OQ-9 e IC-1 (/plan-validate).

### next-frontend-config-base/TD-01

**Recommendation:** **Option A (Zod 4)**. Three converging reasons: (1) **Type-inference matches the FE's strict-TS culture** — `lib/env.ts` exports a typed `env` object with no `as` casts, satisfying the project's "Type Safety" working principle. (2) **Ecosystem gravity in Next.js / React 19** — Zod is the de-facto schema language for App Router (Server Actions inputs, form resolvers, future contract validation), so introducing it once at the env layer compounds value for forms in Phase 02+. (3) **Direct enablement of TD-02 Option A (`@t3-oss/env-nextjs`)** — t3-env's first-citizen validator. Backend parity with Joi is not load-bearing: env schemas are not shared FE↔BE (different runtimes, different key sets); two validators across two subprojects is a bounded cost.
**Libraries:** zod

### next-frontend-config-base/TD-02

**Recommendation:** **Option A (`@t3-oss/env-nextjs`)**. The only option that combines (i) **type-level NEXT_PUBLIC_ prefix enforcement**, (ii) **runtime Proxy-based leak detection**, and (iii) **single-file, single-import-path consumer ergonomics**. Option B reaches roughly the same _structural_ outcome at higher implementation and maintenance cost, with a weaker guarantee (no prefix enforcement, no proxy). Option C is unsafe at any non-trivial team size. The marginal cost over B is one ~3KB dep — well-spent for the strongest boundary among the three.
**Libraries:** @t3-oss/env-nextjs

### next-frontend-config-base/TD-03

**Recommendation:** **Option A (Strict BFF — single server-only `API_URL`)**. Aligned with the BFF testing strategy and architectural commitment already documented in `next-frontend/CLAUDE.md` (Route Handlers as the only NestJS caller; BFF tests stub `fetch` via MSW). Eliminates CORS, eliminates public exposure of the backend URL, and produces the smallest correct foundation. Option B's `NEXT_PUBLIC_API_URL` is a future-proofing concession with no current consumer — and adding a public key later is a non-breaking change, while removing one is breaking. Option C ties a foundational decision to infra work explicitly deferred elsewhere. The Docker networking gap (how server-in-container resolves the backend) is a separate orthogonal decision, surfaced below.

> **Out-of-scope ancillary note (NOT a TD here):** Once Option A is chosen, the concrete _value_ of `API_URL` in dev (`http://host.docker.internal:3000` vs joining the two Compose stacks into a shared network with `http://nestjs-api:3000`) is a Docker-Compose-topology decision that this research does not resolve. It belongs in either Phase 02's pre-work or a dedicated infra ad-hoc TD. The env-key contract (this TD) is intentionally independent of how the value is resolved at runtime.
**Libraries:** —

### next-frontend-msw-foundation/TD-01

**Recommendation:** **Option B (per-domain modules + barrel)**. Three reasons. (1) **MSW's own best-practice recommends it** — the project should not invent its own scheme when the official one is documented and matches the codebase's domain orientation. (2) **Domain ownership tracks the codebase**, not the project plan — `components/`, `app/api/`, and any future feature folders will be organized by domain (auth, videos, channels), so handler files mirror that vocabulary and remain stable as phases come and go. (3) **Append-only growth with minimal merge conflicts** — each phase touches a new file plus one line in the barrel, which is the smallest practical concurrent-PR footprint. Option A is acceptable through Phase 02 alone (~5–7 endpoints) but accumulates costs that B avoids from day one; bootstrapping directly into B costs one extra file and one barrel and pays off by Phase 03. Option C's phase coupling is rejected outright — domain-by-phase is a category error.

> **File naming inside each domain module.** Inside `handlers/<domain>.ts`, group handlers by **HTTP method + path** rather than by test scenario — a single handler is the happy-path default; per-test error/edge scenarios are added via `server.use(...)` in the test file, never as additional handlers in the domain file. This keeps the domain file small and stable (one handler per `paths` entry, not one handler per assertion case).
**Libraries:** —

### next-frontend-msw-foundation/TD-02

**Recommendation:** **Option A (test-only, `setupServer` only at the foundation)**. The browser worker is a future capability with no documented current consumer; wiring it now (Option B) is speculative investment, and wiring it incoherently (Option C) actively misleads developers into thinking interception works when it doesn't under strict BFF. Option A keeps the foundation minimal, aligns 1:1 with everything CLAUDE.md and the existing rules currently document, and is non-breaking to extend.

**When Option A should be revisited** — the trigger for re-opening this TD with a Supersede toward Option B-style wiring:

- A dedicated capability appears in `docs/project-plan.md` or a phase plan that requires FE-offline dev (e.g., Storybook with mocked API responses; design-system playground that renders real-data states; FE-team-only sprints with the BE stack down).
- The number of BFF Route Handlers grows past the point where running the full stack just to dev a single FE page is the dominant pain.

Under Option A, when that day comes, the path to Option B is additive: `npx msw init public/` to generate the SW file, create `mocks/browser.ts`, create `mocks/handlers/bff/` mirroring the upstream tree, register the worker behind a `NEXT_PUBLIC_MSW` flag. The existing `handlers/<domain>.ts` files (upstream-targeted) keep working unchanged.

> **Directory naming under Option A.** Do not preemptively name handler files `upstream/auth.ts` to "leave room for Option B later" — that's premature complexity. Use the flat `handlers/auth.ts` per TD-01 today; if Option B is ever taken, the migration is "move `handlers/*.ts` into `handlers/upstream/` and add a sibling `handlers/bff/`" — a one-commit refactor with no test changes (the barrel keeps the same import surface to `mocks/server.ts`).
**Libraries:** —

### next-frontend-msw-foundation/TD-03

**Recommendation:** **Option D (hand-written defaults as the default + opt-in seeded faker for bulk collections)**. Reasons: (1) **Option B's determinism + readability is the right baseline** — every fixture in Phase 02 (5–7 endpoints, single-record-mostly) is naturally hand-written, and the diff-revealing override pattern is the highest-value benefit. (2) **Bulk-collection cases will arrive (Phase 07 home page grid, Phase 06 comment threads) and inline hand-written lists of 20+ items are genuinely tedious** — keeping faker available as a scoped tool is pragmatic. (3) **Per-fixture local seeding eliminates the global-cursor pitfall** that makes Option C structurally fragile — using `faker.seed(N)` immediately before a collection-builder run scopes the determinism to that fixture and isolates it from upstream changes to other factories.

Concrete pattern for D:

```ts
// mocks/factories/videos.ts  (Option B style — default case)
const baseVideo: Video = { id: "video-1", title: "First video", durationSec: 120, /* ... */ };
export const buildVideo = (overrides: Partial<Video> = {}): Video => ({ ...baseVideo, ...overrides });

// Opt-in faker for a bulk-list scenario only:
import { faker } from "@faker-js/faker";
export const buildVideoList = (n: number, seed = 42): Video[] => {
  faker.seed(seed); // local — does not affect any other factory
  return Array.from({ length: n }, (_, i) =>
    buildVideo({ id: `video-${i + 1}`, title: faker.lorem.sentence(4), durationSec: faker.number.int({ min: 60, max: 3600 }) }));
};
```

If the project never reaches a real bulk-collection use case, faker is simply never installed — Option D collapses into Option B in practice, with zero retroactive cost. Add `@faker-js/faker` to `devDependencies` only when the first `buildXList` is authored.
**Libraries:** —

### next-frontend-msw-foundation/TD-04

**Recommendation:** **Option A (universal handler set + `server.use(...)` overrides + `onUnhandledRequest: "error"`)**. The user's "import only what it needs" requirement is satisfied at the *authoring* layer by TD-01 (per-domain files; each phase adds one file). At the *runtime* layer, loading all handlers is the canonical MSW v2 model and imposes no cost on tests that don't fetch the extra URLs. `onUnhandledRequest: "error"` enforces that a phase's test cannot accidentally invoke a route outside its scope (the fetch fails loudly with "no handler matched"), which is the strongest version of "stays inside its phase" available. Option B's per-suite composition pays real boilerplate cost for an explicitness gain that TD-01 already provides at a different layer. Option C invents a Vitest-projects-shaped problem for a phase-shaped concern.

Concrete wiring (foundation SI under this option):

```ts
// next-frontend/vitest.config.ts (relevant excerpt)
export default defineConfig({
  test: {
    environment: "node", // BFF integration tests are Node-side
    setupFiles: ["./mocks/setup.ts"],
  },
});
```

```ts
// next-frontend/mocks/setup.ts
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

Phase 02+ tests need no additional setup — they `import { POST } from "@/app/api/auth/signup/route"`, build a `Request`, await the handler, and assert. Per-test deviations call `server.use(...)` inline.
**Libraries:** —

### rate-limit-visitor-identity/TD-01

**Recommendation:** Option A, fixando nesta decisão só o contrato: **o IP do visitante é escrito pela borda e o app nunca confia em `X-Forwarded-For` vindo do cliente**. O produto (nginx ou Caddy) e a parte de TLS ficam para a pesquisa de produção da Fase 07, que vai precisar dessa peça de qualquer forma. A Option B só se pagaria se não houvesse proxy em produção, e o próprio Next recomenda que haja; ela ainda bloqueia o `standalone`. A Option C mantém o defeito de hoje, trocando o balde único por um limite que o abusador escolhe contornar.
**Libraries:** —

**Revisions:**
- 2026-10-08 — Recorte de entrega desta task: **só o lado do app** — repasse de `X-Client-IP` com `INTERNAL_API_SECRET` (TD-02) e `getTracker` (TD-03). O BFF lê o `x-forwarded-for` como o Next 16 o
  entrega: confiável quando uma borda o sobrescreve, **forjável enquanto ela não existir** (o Next só o preenche quando ausente). **Nenhum SI de proxy nem de compose nesta task**; produto do proxy e TLS
  ficam para a fatia de deploy da Fase 07, e o código do app não muda quando a borda chegar. Mesma Option A. Rationale: recorte de entrega fixado no /plan-resolve (AMB-1), registrado aqui porque
  o `**Decision:**` não chega ao `context.md` e o `/plan-build` lê esta prosa (resolve IC-2 do /plan-validate).

### rate-limit-visitor-identity/TD-02

**Recommendation:** Option A. É a única que funciona sem reorganizar a rede dos dois stacks e que mantém os orçamentos já decididos (`video-watch-page/TD-05`, `social-interactions/TD-09`) onde estão, nos decorators do Nest, mudando só **quem** é a chave. O custo é uma chave de env cross-component, que é o mesmo tipo de contrato que `next-frontend-config-base/TD-03` já gere. A Option B é o caminho mais limpo **se** a Fase 07 de produção unificar as redes de qualquer forma; nesse caso ela pode suceder a A sem tocar nos decorators.
**Libraries:** —

### rate-limit-visitor-identity/TD-03

**Recommendation:** Option B. É a Revision que `social-interactions/TD-09` já tinha deixado pronta, e a evidência que ela esperava agora existe. A conta é a identidade certa onde existe conta, e o IP fica para o anônimo. A Option C só se justifica se aparecer abuso por várias contas no mesmo IP, e a migração de B para C é aditiva.
**Libraries:** —

### rate-limit-visitor-identity/TD-04

**Recommendation:** Option B, com **120/60 s por visitante como premissa a confirmar**. A conta é esta: uma página de vídeo custa cerca de 4 chamadas ao upstream, então 120/min equivale a uns 30 vídeos abertos por minuto, muito acima de navegação humana. Inverter o default troca "toda leitura nova nasce com limite de login" por "toda rota de auth precisa do decorator", que é um conjunto **fechado e pequeno** (7 rotas num controller só) e testável. A Option A tiraria o freio da busca, que é a consulta mais cara da plataforma. Com B, o `home-busca/TD-09` fica resolvido sem caso especial: home e busca caem no default de leitura, e o resolve daquela fatia deve alinhar a letra a esta decisão.
**Libraries:** —

**Revisions:**
- 2026-10-08 — Valores firmes: **120 req/60 s por visitante confirmado** (deixa de ser premissa) como default global. `@Throttle(AUTH_THROTTLE)` com **10/60 s** em **6** handlers do `AuthController`, não 7:
  `register`, `confirm-email`, `resend-confirmation`, `login`, `forgot-password` e `reset-password`; `refresh` (chamado pelo BFF no 401), `logout` e `me` ficam no default. Escritas autenticadas
  de dono sem decorator próprio (`PATCH /videos/:publicId`, `PATCH` do canal) **aceitam o default**, contadas por usuário (TD-03). Este default substitui como vigente o "aplicação inteira, a 10 req/60 s
  por IP" de `phase-02-auth/TD-08` (Revision de 2026-10-08 naquele TD). Mesma Option B. Rationale: premissa substituída por valor firme no /plan-resolve (AMB-2/OQ-4), registrada aqui porque o
  `**Decision:**` não chega ao `context.md` e o `/plan-build` lê esta prosa (resolve IC-1 do /plan-validate).

### next-frontend-openapi-typing/TD-01

**Recommendation:** **Option A (`openapi-typescript` + `openapi-fetch`)**. Three reinforcing reasons. (1) **Strict BFF makes the SDK surface valueless on the client.** Only Route Handlers ever call the upstream Nest; they already use `fetch` (Next 16's caching extensions sit on top of native `fetch`); a generated SDK adds a third client style to learn for zero functional gain. (2) **Types-first matches the rest of the FE foundation.** Env validation is Zod-derived types; component variants are `cva` types; both are TS-first with zero generated runtime. `paths` is the natural extension — one `.d.ts` file imported wherever the contract is touched. (3) **MSW typing is solved by the same `paths` symbol.** Hand-written handlers in `mocks/handlers.ts` type their resolver returns off `paths["/videos"]["get"]["responses"][200]`, giving the contract guarantee without orval/kubb's verbose generated handlers (which would be overridden per-test anyway). The marginal cost of adding `openapi-fetch` (~6KB, server-side only) is small enough that we recommend the **types + thin-client** pair, not types alone — `openapi-fetch` removes the `fetch(API_URL + path, { method, headers, body })` boilerplate in each Route Handler while staying within the BFF model. Options B/C/D may be revisited if (a) client-side data-fetching enters the stack with TanStack Query and per-endpoint hooks are wanted, or (b) the API grows beyond ~20 operations and per-call boilerplate becomes painful.
**Libraries:** openapi-typescript, openapi-fetch

### next-frontend-openapi-typing/TD-02

**Recommendation:** **Option B (committed local copy + repo-root sync script)**. Three reasons. (1) **Preserves the compose-stack independence** that `next-frontend-config-base/TD-03` Context calls out as the current architecture — neither subproject's compose file references the other. (2) **Drift is eliminated structurally when paired with TD-03's CI freshness check** — the check runs the sync script and asserts no diff on either `openapi.json` or `types.gen.ts`, so a backend PR that forgets to re-sync fails CI with a clear message. (3) **The committed local file is a real artifact in PR review** — reviewers see the contract change in `next-frontend/openapi.json`'s diff at the same time as the backend change, doubling the visibility (an `openapi.json`-only diff in a feature PR is a red flag for accidental drift). Option A is acceptable as a pre-CI fallback; Option C is rejected because the cross-stack file dependency in `docker-compose.yaml` introduces coupling that the current architecture explicitly avoids, and the "no drift" gain over B is small once TD-03 lands.
**Libraries:** —

### next-frontend-openapi-typing/TD-03

**Recommendation:** **Option C (committed + CI freshness check)**. It is the only option that makes contract drift _both_ visible (in PR diffs) _and_ impossible to merge accidentally (CI fail). The complexity premium over Option A is one CI step. Option B's "no committed artifacts" purity is poorly paid for in a monorepo where the cross-subproject build coupling becomes a real ergonomic cost, and it wastes the PR visibility that TD-02 Option B's committed `openapi.json` is specifically designed to deliver. Option A is acceptable as a temporary state until the CI pipeline lands; downgrading from C to A is reversible (just remove the CI step) but upgrading to C later requires explaining `types.gen.ts` history in a separate commit. Start at C. Apply the same script-and-check pattern to any future generated artifact (e.g., if `openapi-fetch` is wrapped, the wrapper file is hand-written; the only generated artifact remains `types.gen.ts`).
**Libraries:** —

### next-frontend-openapi-typing/TD-04

**Recommendation:** **Option A (single `lib/api/contracts.ts` with explicit aliases)**. It is the only option that (i) handles pass-through and reshape with the same mechanism, (ii) gives a single grep target for "what shape does the BFF expose", and (iii) decouples Component imports from App Router file paths (Components import `from "@/lib/api/contracts"`, not `from "@/app/api/videos/route"`). Option B is theoretically minimal but fragile against Next's actual RSC/Client/Route-Handler typing; Option C scatters the contract surface and creates drift opportunities. The "long file" concern is bounded — for the scope of StreamTube, the BFF will likely have <30 contract aliases at peak; sectioning by feature header comments is sufficient. Make `lib/api/contracts.ts` the only file that imports `paths` from `types.gen.ts` (lintable later); every other consumer imports from `contracts.ts`.
**Libraries:** —

**Revisions:**

- 2026-10-03 — Scope reclassificado de Frontend para Cross-layer (mesma Option A; `lib/api/contracts.ts` continua sendo o único importador de `paths`, nada muda no mecanismo). Rationale: resolve MD-2 (/plan-validate social-interactions) — a cadeia de contrato nasce no backend (`openapi-docs-nestjs` gera o `openapi.json`) e termina nos componentes do frontend; a Fase 06 acrescenta três grupos de rotas (reações, comentários, inscrições) que precisam atravessá-la, e com `Scope: Frontend` a decisão é filtrada das subseções voltadas a backend do artefato de build. Mesmo motivo e mesmo precedente de `video-channel-management/TD-08` em 2026-07-31.

### next-frontend-openapi-typing/TD-05

**Recommendation:** **Option A (hand-written, typed via `paths`)**. Reasons: (1) **Determinism over auto-generation** — BFF integration tests assert on specific values; randomized fixtures are anti-helpful. (2) **Coherence with TD-01 recommendation** — `openapi-typescript`'s `paths` type is the single contract anchor; reusing it in MSW handlers means "spec ↔ handler ↔ assertion" is one type chain. (3) **Scale fit** — Phase 02 introduces few endpoints; the manual cost is negligible at this stage. If the API grows to dozens of endpoints and authoring overhead becomes real, this TD can be superseded with a Kubb-or-hey-api MSW plugin without touching TD-01's `paths` import sites (the generator just produces additional handler files; the existing manual handlers stay valid). Option B locks the project into a heavier TD-01 choice for marginal mock-authoring savings; Option C is Option A with an unnecessary detour.
**Libraries:** —

## Inherited Conventions

- Backend config uses `@nestjs/config` with namespaced `registerAs(name, () => ({...}))` factories — one file per domain in `src/config/`. _(from phase 01)_
- Env variables are validated by a Joi schema in `src/config/env.validation.ts`, passed to `ConfigModule.forRoot({ validationSchema, validationOptions: ... _(from phase 01)_
- Config is injected into modules via `ConfigType<typeof xxxConfig>` and `@Inject(xxxConfig.KEY)`; the same factory is importable as a plain function fo... _(from phase 01)_
- `data-source.ts` loads `.env` via `import 'dotenv/config'` at the top, then imports `databaseConfig` and calls it as a plain function. _(from phase 01)_
- Database connection parameters (host, port, etc.) are sourced from a single `databaseConfig` factory — never duplicated between `AppModule` and `data-... _(from phase 01)_
- `TypeOrmModule.forRootAsync` is used (not `forRoot`), with `imports: [ConfigModule]`, `inject: [databaseConfig.KEY]`, `useFactory` returning options i... _(from phase 01)_

_As Fases 02-auth, 03, 04, 05, 06 e a fatia irmã `home-busca` repetem os mesmos seis bullets de configuração (deduplicados, origem preservada na Fase 01); nenhuma convenção nova foi introduzida por elas. Nenhum doc de fase (`phase-NN-*.md`) tem seção `## Conventions to Match`._

## Inherited Deferred Capabilities

| Capability | Status | Origin phase | Rationale |
|-----------|--------|--------------|-----------|
| Telas de frontend | deferred | phase-01-configuracao-base | `next-frontend/` is not initialized in this phase; UI surfaces start in a later phase. |
| Telas de cadastro, login, confirmação de conta e recuperação de senha | deferred | phase-02-auth | `next-frontend/` is not initialized in this phase; UI surfaces start in a later phase. |
| "Confirmação de conta via e-mail com link de ativação" | deferred | phase-02-auth-frontend | deferred_to_next_phase — UI landing screen de-scoped 2026-05-14; FE confirmation flow (TD-07) picked up by a future phase. BE side unchanged in `phase-02-auth`. |
| "Logout" | deferred | phase-02-auth-frontend | deferred_to_next_phase — logout button lives inside authenticated chrome (typically Phase 04). Phase 02 still implements POST `/api/auth/logout` (BFF route handler + `session.destroy()`) so the contract is ready when the chrome lands. |
| "Recuperação de senha (destination screen / set-new-password)" | deferred | phase-02-auth-frontend | deferred_to_next_phase — `/forgot-password` ships this phase sending the e-mail; the reset-password destination screen is absent from Figma → link destination remains a 404 until a later phase delivers the screen via `/screen-inventory` extension run. Documented as a known gap. |
| "Telas de cadastro, login, confirmação de conta e recuperação de senha" | deferred | phase-02-auth-frontend | a tela de confirmação da conta não será implementada nesta fase corrente, será adiada — the umbrella bullet's full coverage requires the confirmação and reset-password destination screens; both are deferred per Non-UI rows above. The 3 ship-this-phase telas (signup, login, forgot-password) are inventoried and covered by their own verbs; the umbrella bullet itself is deferred to the phase that lands the missing screens. |

_Phases 03, 04, 05 and 06, and sibling slice home-busca, add no deferred rows. Their `## Non-UI / Deferred Capabilities` is either `_None._` or a placeholder row with no `deferred` status._

## Non-UI / Deferred Capabilities

_None._

## Testing Requirements

### nestjs-project

| Artifact type | Required layers |
|---------------|-----------------|
| Entity (`*.entity.ts`) | Integration: constraints, defaults, `select: false` |
| Service with branching + DB | Unit: branch logic (mock repo) + Integration: DB contract |
| Service with DB only (no branching) | Integration: DB contract |
| Service with configured lib (JWT, cache) | Unit: real lib with test config |
| Service with side-effect dep (email, storage) | Integration: real capture service (Mailpit) or local adapter |
| Module with configured imports | Compilation test: Integration if it opens a DB connection, Unit otherwise |
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

| Artifact type | Required layers |
|---------------|-----------------|
| **Page** — sync RSC, static, no logic | None at component level; cover only if part of a critical flow → `*.e2e-spec.ts` |
| **Page** — sync RSC composing client children | Test client children directly; cover rendered page via `*.e2e-spec.ts` |
| **Page** — async RSC (`async function Page()` with `await`) | `*.e2e-spec.ts` only — Vitest cannot render it |
| **Layout** (`layout.tsx`) | None unless it adds logic (auth gate, conditional render); else via E2E |
| **Client component** (`"use client"`) with state/handlers | `*.test.tsx` — RTL + `jsdom` docblock, mock `next/navigation`, MSW for fetch |
| **Feature component** (server, composes primitives) | Skip unit; cover via the page's E2E |
| **shadcn UI primitive** (`components/ui/*`) | None — trust the library; cover via consumers |
| **Icon** (`components/icons/*`) | None |
| **`lib/` utility / boundary module** with branching or shape assumptions | `*.test.ts` |
| **Custom hook** (`hooks/*`) | `*.test.ts(x)` with `renderHook`, `jsdom` docblock |
| **Route handler** (`app/api/**/route.ts`) — proxy or with branching | `*.integration.test.ts` with MSW (+ `*.test.ts` for extracted pure logic) |
| **Server action / middleware / error-loading-not-found / metadata** | See `artifacts/future-types.md` — depends on type |

_Nota: o guia do `next-frontend` ainda diz que o Playwright não está instalado, mas a suíte existe desde a Fase 04 (`playwright.config.ts`, specs em `tests/`). Nenhum dos dois guias tem linha para artefatos de infraestrutura (Dockerfile, compose de produção, workflow de CI, config do proxy): as tabelas acima cobrem só o código da API e do frontend._
