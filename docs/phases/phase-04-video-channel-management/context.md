---
kind: phase
name: phase-04-video-channel-management
sources_mtime:
  docs/project-plan.md: "2026-06-29T19:03:26-03:00"
  docs/decisions/technical-decisions-video-channel-management.md: "2026-09-20T20:35:29-03:00"
  docs/phases/phase-04-video-channel-management/library-refs.md: "2026-09-20T20:36:09-03:00"
  docs/decisions/technical-decisions-next-frontend-openapi-typing.md: "2026-06-29T19:03:26-03:00"
  docs/inventories/screen-inventory-phase-04-video-channel-management.md: "2026-09-20T20:09:18-03:00"
  docs/phases/phase-01-configuracao-base/context.md: "2026-06-29T19:03:26-03:00"
  docs/phases/phase-02-auth/context.md: "2026-06-29T19:03:26-03:00"
  docs/phases/phase-02-auth-frontend/context.md: "2026-06-29T19:03:26-03:00"
  docs/phases/phase-03-upload-processing/context.md: "2026-07-02T21:35:27-03:00"
  .claude/skills/testing-guide-nestjs-project/SKILL.md: "2026-06-29T19:03:26-03:00"
  .claude/skills/testing-guide-next-frontend/SKILL.md: "2026-06-29T19:03:26-03:00"
---

# phase-04-video-channel-management — Context

## Scope

**Phase name:** Gerenciamento de Vídeos e Canal
**Capabilities** (literal, `docs/project-plan.md`):

- Categorias de vídeo disponíveis na plataforma
- Edição das informações do vídeo: título, descrição, categoria e thumbnail customizada
- Visibilidade do vídeo: público (aparece para todos) ou unlisted (somente via link)
- Fluxo de rascunho → publicação
- Painel de gerenciamento de vídeos do canal (thumbnail, título, visualizações, likes, comentários, tempo de publicação e status)
- Edição de vídeos a partir do painel
- Edição das informações do canal: nickname, nome e descrição
- Página pública do canal com informações e listagem de vídeos

**Out of scope:** _Not specified._
**Deliverables:** edição completa de vídeos, rascunho/publicação, painel de gerenciamento, edição de canal, página pública do canal.
**Affected subprojects:** `nestjs-project/`, `next-frontend/` _(not specified in `project-plan.md` — taken from the decisions doc's "Subprojects in scope")_
**Deferred subprojects:** _None._
**Sequencing notes:** Depende de: Fase 02, Fase 03. Description line: "Edição das informações do vídeo, fluxo de rascunho e publicação, painel de administração do canal e página pública."

**Neighbors (for boundary detection only):**

- **Phase 03:** Upload de arquivos grandes sem travar o sistema, processamento automático do vídeo e geração de URL única.
- **Phase 05:** Página onde o usuário assiste ao vídeo com player funcional, descrição, sugestões e acesso anônimo.

## Decisions Index

| Ref | Source | Scope | Topic | Status | Decision | Libraries |
|-----|--------|-------|-------|--------|----------|-----------|
| video-channel-management/TD-01 | phase | Cross-layer | Modelagem das categorias de vídeo | decided | A (enum Postgres) | — |
| video-channel-management/TD-02 | phase | Cross-layer | Modelo de estados — lifecycle × publicação × visibilidade | decided | A (três eixos independentes) | — |
|     └─ Last revision: 2026-09-20 — Assinatura de URL de vídeo passa a respeitar rascunho e visibilidade (mesma Option A; nenhuma coluna nova) | | | | | | |
| video-channel-management/TD-03 | phase | Cross-layer | Mecanismo de upload da thumbnail customizada | decided | A (multipart via FileInterceptor) | multer |
|     └─ Last revision: 2026-09-20 — Thumbnail enviada no mesmo multipart do formulário de edição do vídeo (mesma Option A) | | | | | | |
| video-channel-management/TD-04 | phase | Backend | Precedência entre thumbnail auto-gerada e customizada | decided | B (coluna separada + precedência) | — |
| video-channel-management/TD-05 | phase | Cross-layer | Origem dos contadores do painel | decided | A (contadores desnormalizados, sem incremento nesta fase) | — |
| video-channel-management/TD-06 | phase | Cross-layer | Estratégia de paginação das listagens da fase | decided | A (offset/limit) | — |
|     └─ Last revision: 2026-09-20 — Página pública do canal com limit padrão 8; contagem só de vídeos publicados e públicos (mesma Option A) | | | | | | |
| video-channel-management/TD-07 | phase | Cross-layer | Política de alteração do nickname do canal | decided | A (alteração livre com unicidade) | — |
| video-channel-management/TD-08 | phase | Cross-layer | Esquema de URL da página pública do canal | decided | A (`/@{nickname}`) | — |
|     └─ Last revision: 2026-07-31 — Scope reclassificado de Frontend para Cross-layer | | | | | | |
| video-channel-management/TD-09 | phase | Frontend | Roteamento da edição de vídeo a partir do painel | decided | A (rota dedicada) | — |
|     └─ Last revision: 2026-09-20 — Layout autenticado compartilhado pelas três rotas do canal; Cancelar da edição do canal vai para /channel/videos (mesma Option A) | | | | | | |
| video-channel-management/TD-10 | phase | Cross-layer | Lista concreta de categorias de vídeo | decided | B (lista pequena + catch-all "Outros") | — |

_Source files:_

- video-channel-management — `docs/decisions/technical-decisions-video-channel-management.md` (scope_type: phase, related_phases: [4])

## Capability Coverage

| Capability (from project-plan.md) | Covered by |
|-----------------------------------|------------|
| Categorias de vídeo disponíveis na plataforma | video-channel-management/TD-01, video-channel-management/TD-10 |
| Edição das informações do vídeo: título, descrição, categoria e thumbnail customizada | video-channel-management/TD-03, video-channel-management/TD-04 |
| Visibilidade do vídeo: público (aparece para todos) ou unlisted (somente via link) | video-channel-management/TD-02 |
| Fluxo de rascunho → publicação | video-channel-management/TD-02 |
| Painel de gerenciamento de vídeos do canal (thumbnail, título, visualizações, likes, comentários, tempo de publicação e status) | video-channel-management/TD-05, video-channel-management/TD-06 |
| Edição de vídeos a partir do painel | video-channel-management/TD-09 |
| Edição das informações do canal: nickname, nome e descrição | video-channel-management/TD-07 |
| Página pública do canal com informações e listagem de vídeos | video-channel-management/TD-06, video-channel-management/TD-08 |

## Decisions Detail

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

## Inherited Decisions Detail

### phase-01-configuracao-base/TD-01

**Recommendation:** Option A (@nestjs/config) — Official, core-team-maintained, guaranteed NestJS 11 compatibility. The `registerAs()` factory pattern solves the TypeORM CLI sharing problem: the factory function can be imported as a plain function by `data-source.ts` while also serving as a DI injection token inside NestJS. Building a custom module recreates solved functionality; third-party packages carry maintenance risk.

**Libraries:** `@nestjs/config@^4.x`

### phase-01-configuracao-base/TD-02

**Recommendation:** Option A (Joi) — First-class integration with `@nestjs/config` via `validationSchema`, requiring zero custom wiring. Handles string-to-number coercion natively. Using a different tool for env validation vs. request validation is reasonable — env config is validated once at startup, DTOs are validated per-request. Zod is elegant but adds a third validation paradigm to the project.

**Libraries:** `joi@^17.x`

### phase-01-configuracao-base/TD-03

**Recommendation:** Option B (Namespaced/grouped with registerAs) — The project roadmap explicitly calls for auth, email, and storage in upcoming phases. Namespaced configs provide clear file boundaries per domain, typed injection via `ConfigType<typeof databaseConfig>`, and natural scalability. The `registerAs()` factory is dual-purpose: DI token inside NestJS and plain importable function for `data-source.ts`. Initial files for Phase 01: `src/config/database.config.ts`, `src/config/app.config.ts`.

**Libraries:** —

### phase-01-configuracao-base/TD-04

**Recommendation:** Option A (Shared registerAs factory) — Natural outcome of choosing `@nestjs/config` with `registerAs`. The factory is already callable by design. `data-source.ts` imports it, calls `dotenv.config()`, then calls the factory. Zero duplication, minimal code, no extra abstraction.

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
**Libraries:** react-hook-form, @hookform/resolvers

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

### next-frontend-openapi-typing/TD-01

**Recommendation:** Three reinforcing reasons. (1) **Strict BFF makes the SDK surface valueless on the client.** Only Route Handlers ever call the upstream Nest; they already use `fetch` (Next 16's caching extensions sit on top of native `fetch`); a generated SDK adds a third client style to learn for zero functional gain. (2) **Types-first matches the rest of the FE foundation.** Env validation is Zod-derived types; component variants are `cva` types; both are TS-first with zero generated runtime. `paths` is the natural extension — one `.d.ts` file imported wherever the contract is touched. (3) **MSW typing is solved by the same `paths` symbol.** Hand-written handlers in `mocks/handlers.ts` type their resolver returns off `paths["/videos"]["get"]["responses"][200]`, giving the contract guarantee without orval/kubb's verbose generated handlers (which would be overridden per-test anyway). The marginal cost of adding `openapi-fetch` (~6KB, server-side only) is small enough that we recommend the **types + thin-client** pair, not types alone — `openapi-fetch` removes the `fetch(API_URL + path, { method, headers, body })` boilerplate in each Route Handler while staying within the BFF model. Options B/C/D may be revisited if (a) client-side data-fetching enters the stack with TanStack Query and per-endpoint hooks are wanted, or (b) the API grows beyond ~20 operations and per-call boilerplate becomes painful.
**Libraries:** openapi-typescript, openapi-fetch

### next-frontend-openapi-typing/TD-02

**Recommendation:** Three reasons. (1) **Preserves the compose-stack independence** that `next-frontend-config-base/TD-03` Context calls out as the current architecture — neither subproject's compose file references the other. (2) **Drift is eliminated structurally when paired with TD-03's CI freshness check** — the check runs the sync script and asserts no diff on either `openapi.json` or `types.gen.ts`, so a backend PR that forgets to re-sync fails CI with a clear message. (3) **The committed local file is a real artifact in PR review** — reviewers see the contract change in `next-frontend/openapi.json`'s diff at the same time as the backend change, doubling the visibility (an `openapi.json`-only diff in a feature PR is a red flag for accidental drift). Option A is acceptable as a pre-CI fallback; Option C is rejected because the cross-stack file dependency in `docker-compose.yaml` introduces coupling that the current architecture explicitly avoids, and the "no drift" gain over B is small once TD-03 lands.
**Libraries:** —

### next-frontend-openapi-typing/TD-03

**Recommendation:** It is the only option that makes contract drift _both_ visible (in PR diffs) _and_ impossible to merge accidentally (CI fail). The complexity premium over Option A is one CI step. Option B's "no committed artifacts" purity is poorly paid for in a monorepo where the cross-subproject build coupling becomes a real ergonomic cost, and it wastes the PR visibility that TD-02 Option B's committed `openapi.json` is specifically designed to deliver. Option A is acceptable as a temporary state until the CI pipeline lands; downgrading from C to A is reversible (just remove the CI step) but upgrading to C later requires explaining `types.gen.ts` history in a separate commit. Start at C. Apply the same script-and-check pattern to any future generated artifact (e.g., if `openapi-fetch` is wrapped, the wrapper file is hand-written; the only generated artifact remains `types.gen.ts`).
**Libraries:** —

### next-frontend-openapi-typing/TD-04

**Recommendation:** It is the only option that (i) handles pass-through and reshape with the same mechanism, (ii) gives a single grep target for "what shape does the BFF expose", and (iii) decouples Component imports from App Router file paths (Components import `from "@/lib/api/contracts"`, not `from "@/app/api/videos/route"`). Option B is theoretically minimal but fragile against Next's actual RSC/Client/Route-Handler typing; Option C scatters the contract surface and creates drift opportunities. The "long file" concern is bounded — for the scope of StreamTube, the BFF will likely have <30 contract aliases at peak; sectioning by feature header comments is sufficient. Make `lib/api/contracts.ts` the only file that imports `paths` from `types.gen.ts` (lintable later); every other consumer imports from `contracts.ts`.
**Libraries:** —

### next-frontend-openapi-typing/TD-05

**Recommendation:** Reasons: (1) **Determinism over auto-generation** — BFF integration tests assert on specific values; randomized fixtures are anti-helpful. (2) **Coherence with TD-01 recommendation** — `openapi-typescript`'s `paths` type is the single contract anchor; reusing it in MSW handlers means "spec ↔ handler ↔ assertion" is one type chain. (3) **Scale fit** — Phase 02 introduces few endpoints; the manual cost is negligible at this stage. If the API grows to dozens of endpoints and authoring overhead becomes real, this TD can be superseded with a Kubb-or-hey-api MSW plugin without touching TD-01's `paths` import sites (the generator just produces additional handler files; the existing manual handlers stay valid). Option B locks the project into a heavier TD-01 choice for marginal mock-authoring savings; Option C is Option A with an unnecessary detour.
**Libraries:** —

## Inherited Conventions

- Backend config uses `@nestjs/config` with namespaced `registerAs(name, () => ({...}))` factories — one file per domain in `src/config/`. _(from phase 01)_
- Env variables are validated by a Joi schema in `src/config/env.validation.ts`, passed to `ConfigModule.forRoot({ validationSchema, validationOptions: ... _(from phase 01)_
- Config is injected into modules via `ConfigType<typeof xxxConfig>` and `@Inject(xxxConfig.KEY)`; the same factory is importable as a plain function fo... _(from phase 01)_
- `data-source.ts` loads `.env` via `import 'dotenv/config'` at the top, then imports `databaseConfig` and calls it as a plain function. _(from phase 01)_
- Database connection parameters (host, port, etc.) are sourced from a single `databaseConfig` factory — never duplicated between `AppModule` and `data-... _(from phase 01)_
- `TypeOrmModule.forRootAsync` is used (not `forRoot`), with `imports: [ConfigModule]`, `inject: [databaseConfig.KEY]`, `useFactory` returning options i... _(from phase 01)_

## Inherited Deferred Capabilities

| Capability | Status | Origin phase | Rationale |
|-----------|--------|--------------|-----------|
| Telas de frontend | deferred | phase-01-configuracao-base | `next-frontend/` is not initialized in this phase; UI surfaces start in a later phase. |
| Telas de cadastro, login, confirmação de conta e recuperação de senha | deferred | phase-02-auth | `next-frontend/` is not initialized in this phase; UI surfaces start in a later phase. |
| "Confirmação de conta via e-mail com link de ativação" | deferred | phase-02-auth-frontend | deferred_to_next_phase — UI landing screen de-scoped 2026-05-14; FE confirmation flow (TD-07) picked up by a future phase. BE side unchanged in `phase-02-auth`. |
| "Logout" | deferred | phase-02-auth-frontend | deferred_to_next_phase — logout button lives inside authenticated chrome (typically Phase 04). Phase 02 still implements POST `/api/auth/logout` (BFF route handler + `session.destroy()`) so the contract is ready when the chrome lands. |
| "Recuperação de senha (destination screen / set-new-password)" | deferred | phase-02-auth-frontend | deferred_to_next_phase — `/forgot-password` ships this phase sending the e-mail; the reset-password destination screen is absent from Figma → link destination remains a 404 until a later phase delivers the screen via `/screen-inventory` extension run. Documented as a known gap. |
| "Telas de cadastro, login, confirmação de conta e recuperação de senha" | deferred | phase-02-auth-frontend | a tela de confirmação da conta não será implementada nesta fase corrente, será adiada — the umbrella bullet's full coverage requires the confirmação and reset-password destination screens; both are deferred per Non-UI rows above. The 3 ship-this-phase telas (signup, login, forgot-password) are inventoried and covered by their own verbs; the umbrella bullet itself is deferred to the phase that lands the missing screens. |

## UI Inventory

**Source:** `docs/inventories/screen-inventory-phase-04-video-channel-management.md`
**Screens in scope:** 4

### UI ↔ Capability Join

| Screen | Route | Verb | Capability | Covering Component |
|--------|-------|------|------------|-------------------|
| Painel de gerenciamento de vídeos do canal | /channel/videos | Exibir lista paginada de vídeos do canal com thumbnail, título, duração, visibilidade, status, contadores e data de publicação | "Painel de gerenciamento de vídeos do canal (thumbnail, título, visualizações, likes, comentários, tempo de publicação e status)" | VideoTable |
| Painel de gerenciamento de vídeos do canal | /channel/videos | Encerrar a sessão do usuário autenticado | "Logout" (capability herdada da Fase 02, diferida para este chrome autenticado; fora das 8 capabilities da Fase 04) | UserMenu + SairButton |
| Tela de edição de vídeo | /videos/{publicId}/edit | Exibir informações atuais do vídeo (título, descrição, categoria, visibilidade e thumbnail) para edição | "Edição de vídeos a partir do painel" | VideoEditForm + ThumbnailUploader |
| Tela de edição de vídeo | /videos/{publicId}/edit | Atualizar título e descrição do vídeo | "Edição das informações do vídeo: título, descrição, categoria e thumbnail customizada" | VideoEditForm |
| Tela de edição de vídeo | /videos/{publicId}/edit | Selecionar a categoria do vídeo entre as categorias disponíveis | "Categorias de vídeo disponíveis na plataforma" | VideoEditForm |
| Tela de edição de vídeo | /videos/{publicId}/edit | Definir a visibilidade do vídeo como público ou indisponível (unlisted) | "Visibilidade do vídeo: público (aparece para todos) ou unlisted (somente via link)" | VideoEditForm |
| Tela de edição de vídeo | /videos/{publicId}/edit | Substituir a thumbnail do vídeo por uma imagem personalizada | "Edição das informações do vídeo: título, descrição, categoria e thumbnail customizada" | ThumbnailUploader |
| Tela de edição de vídeo | /videos/{publicId}/edit | Salvar as alterações do vídeo mantendo-o como rascunho | "Fluxo de rascunho → publicação" | Button "Salvar rascunho" |
| Tela de edição de vídeo | /videos/{publicId}/edit | Publicar o vídeo | "Fluxo de rascunho → publicação" | Button "Publicar" |
| Tela de edição do canal | /channel/settings | Exibir informações atuais do canal (nickname, nome e descrição) para edição | "Edição das informações do canal: nickname, nome e descrição" | ChannelEditForm |
| Tela de edição do canal | /channel/settings | Salvar alterações de nickname, nome e descrição do canal | "Edição das informações do canal: nickname, nome e descrição" | ChannelEditForm + SaveButton |
| Página pública do canal | /@{nickname} | Exibir informações públicas do canal (nome, nickname, avatar e total de vídeos) | "Página pública do canal com informações e listagem de vídeos" | ChannelHeader |
| Página pública do canal | /@{nickname} | Exibir lista paginada de vídeos publicados e públicos do canal | "Página pública do canal com informações e listagem de vídeos" | VideoCard |

### Server-connected Components

- `UserMenu` (Painel de gerenciamento de vídeos do canal) — `Reuse?: new`
- `SairButton` (Painel de gerenciamento de vídeos do canal) — `Reuse?: components/ui/button.tsx`
- `VideoTable` (Painel de gerenciamento de vídeos do canal) — `Reuse?: new`
- `VideoEditForm` (Tela de edição de vídeo) — `Reuse?: new`
- `ThumbnailUploader` (Tela de edição de vídeo) — `Reuse?: new`
- `Button "Salvar rascunho"` (Tela de edição de vídeo) — `Reuse?: components/ui/button.tsx`
- `Button "Publicar"` (Tela de edição de vídeo) — `Reuse?: components/ui/button.tsx`
- `ChannelEditForm` (Tela de edição do canal) — `Reuse?: new`
- `SaveButton` (Tela de edição do canal) — `Reuse?: components/ui/button.tsx`
- `ChannelHeader` (Página pública do canal) — `Reuse?: new`
- `VideoCard` (Página pública do canal) — `Reuse?: new`

### Open Questions from Inventory

- **Botão "Editar" do painel.** O botão foi adicionado ao Figma em 2026-09-20 (nós 62:42, 62:44, 62:46) e a capability "Edição de vídeos a partir do painel" segue coberta pelo verbo remapeado da tela de edição. Falta desenhar hover/foco do botão e decidir se a coluna ganha um cabeçalho visualmente oculto para leitores de tela.
- **Estados de lista e ciclo de vida no painel.** Faltam: empty state, loading e erro; variant para `status` do worker (processando/falhou); ação de publicar direto da linha de rascunho; formato da coluna PUBLICAÇÃO (data absoluta vs. relativa, a capability diz "tempo de publicação"); o que exibir em "visibilidade" de um rascunho (hoje "—").
- **Estados ausentes nas demais telas.** Edição de vídeo, edição de canal e página pública mostram só o estado feliz: sem erro de validação/mutation, loading, sucesso, canal não encontrado nem canal sem vídeos (mesmo gap já registrado nas telas de auth da Fase 02). Decidir se o implement infere o padrão do DS de auth ou se o designer produz as variants.
- **Edição de vídeo — thumbnail e ciclo de vida.** O momento do upload da thumbnail (imediato ao escolher o arquivo vs. junto do submit, TD-03) decide se `ThumbnailUploader` tem mutation própria. Faltam variants para vídeo já publicado ("Salvar alterações"/"Despublicar") e para `status ≠ ready`, onde "Publicar" deve ficar bloqueado (TD-02).
- **Edição de vídeo — dado de mock fora do enum.** O Select exibe "Tutoriais", que não está na lista decidida em TD-10 (Música, Jogos, Educação, Entretenimento, Notícias, Esportes, Tecnologia, Outros). Atualizar o Figma ou revisar o TD.
- **Edição de canal — nickname.** O exemplo "joana.cria" contém ponto, fora da allowlist `[a-z0-9_]`; trocar o exemplo e validar com a allowlist. Trocar o nickname muda a URL pública `/@{nickname}` (TD-07 + TD-08) sem aviso no design. O prefixo "@" exige extensão do `Input` ou composição local.
- **Edição de canal — destino do "Cancelar" e chrome.** O Figma não define para onde "Cancelar" navega (`/@{nickname}`, painel ou `router.back()`), e a tela não mostra navbar nem navegação de volta.
- **Chrome autenticado compartilhado.** `SiteNavbar`/`UserMenu` só aparecem no painel; edição de vídeo e edição de canal não mostram o chrome. Definir se um layout autenticado (route group) envolve as três rotas.
- **Página pública — conteúdo e paginação.** A descrição do canal não aparece na faixa do cabeçalho; o mock mostra 42 vídeos com 8 por página mas só a página "1" (tamanho de página a confirmar contra TD-06); a caixa tracejada da paginação parece marcação de mock; a contagem "N vídeos" e o total devem contar só vídeos publicados e públicos (TD-02). O navbar completo (busca, variante autenticada) é da Fase 07.
- **Badge de duração.** Definir se o overlay de duração do `VideoCard` é uma variante do `Badge` (`components/ui/badge.tsx`) ou markup interno do card; se for interno, `Reuse?` passa a `new`.
- **Marca e avatar.** O wordmark do Figma é "EstúdioCriador", diferente do `BrandLogo` já implementado (StreamTube); confirmar se é placeholder do mock (ver `docs/design-identity.md`). A fonte da imagem do avatar não é coberta por nenhuma capability da Fase 04.
- **Reuso de componentes herdados.** `BackLink` vive em `components/auth/` e precisa de ícone (chevron) e destino parametrizáveis; a tipografia dos labels (caixa alta, 13px) difere do `FormLabel` da Fase 02. Mover/generalizar fica como tarefa separada.
- **Logout herdado da Fase 02.** O verbo "Encerrar a sessão" cita uma capability fora da Fase 04; o `plan-validate` deve tratá-lo como pendência herdada (já registrada em Open questions do inventário `phase-02-auth-frontend`).
- **Telas de auth do Figma (Fase 02).** As telas de redefinição de senha (`41:177`) e conta confirmada (`41:195`) foram removidas do escopo desta fase e são candidatas a uma extension run do inventário `phase-02-auth-frontend`.

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

| Artifact type | Required layers |
|---------------|-----------------|
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
