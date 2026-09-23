---
kind: phase
name: phase-04-video-channel-management
status: clean
issue_count: 0
sources_mtime:
  docs/phases/phase-04-video-channel-management/context.md: "2026-09-20T20:36:39-03:00"
  docs/decisions/technical-decisions-video-channel-management.md: "2026-09-20T20:35:29-03:00"
issues:
  - id: IC-1
    status: resolved
    summary: "TD-08 (Scope: Frontend) orphaned — UI Inventory is deferred"
    resolved_by: video-channel-management/TD-08
  - id: IC-2
    status: resolved
    summary: "TD-09 (Scope: Frontend) orphaned — UI Inventory is deferred"
    resolved_by: screen-inventory/phase-04-video-channel-management
  - id: AMB-1
    status: resolved
    summary: "Publish-eligibility rule (which video statuses) not specified"
    resolved_by: video-channel-management/TD-02
  - id: AMB-2
    status: resolved
    summary: "Quem aplica draft/visibilidade na assinatura de URL da Fase 03: Fase 04 ou 05?"
    resolved_by: video-channel-management/TD-02
  - id: MD-1
    status: resolved
    summary: "Concrete category value list undecided (TD-01 covers mechanism only)"
    resolved_by: video-channel-management/TD-10
  - id: OQ-1
    status: resolved
    summary: "TD-01 pending — Modelagem das categorias de vídeo"
    resolved_by: video-channel-management/TD-01
  - id: OQ-2
    status: resolved
    summary: "TD-02 pending — Modelo de estados (lifecycle × publicação × visibilidade)"
    resolved_by: video-channel-management/TD-02
  - id: OQ-3
    status: resolved
    summary: "TD-03 pending — Mecanismo de upload da thumbnail customizada"
    resolved_by: video-channel-management/TD-03
  - id: OQ-4
    status: resolved
    summary: "TD-04 pending — Precedência thumbnail auto vs. customizada"
    resolved_by: video-channel-management/TD-04
  - id: OQ-5
    status: resolved
    summary: "TD-05 pending — Origem dos contadores do painel"
    resolved_by: video-channel-management/TD-05
  - id: OQ-6
    status: resolved
    summary: "TD-06 pending — Estratégia de paginação das listagens"
    resolved_by: video-channel-management/TD-06
  - id: OQ-7
    status: resolved
    summary: "TD-07 pending — Política de alteração do nickname do canal"
    resolved_by: video-channel-management/TD-07
  - id: OQ-8
    status: resolved
    summary: "TD-08 pending — Esquema de URL da página pública do canal"
    resolved_by: video-channel-management/TD-08
  - id: OQ-9
    status: resolved
    summary: "TD-09 pending — Padrão de roteamento da edição de vídeo"
    resolved_by: video-channel-management/TD-09
  - id: OQ-10
    status: resolved
    summary: "TD-10 pending — Lista concreta de categorias de vídeo"
    resolved_by: video-channel-management/TD-10
  - id: OQ-11
    status: resolved
    summary: "Botão 'Editar' do painel: falta hover/foco e cabeçalho oculto da coluna"
    resolved_by: clarification
  - id: OQ-12
    status: resolved
    summary: "Painel: estados de lista, status do worker, publicar na linha, formato da data"
    resolved_by: clarification
  - id: OQ-13
    status: resolved
    summary: "Demais telas: faltam estados de erro, loading, sucesso, vazio e não encontrado"
    resolved_by: clarification
  - id: OQ-14
    status: resolved
    summary: "Edição de vídeo: momento do upload da thumbnail e variants de ciclo de vida"
    resolved_by: video-channel-management/TD-03
  - id: OQ-15
    status: resolved
    summary: "Edição de vídeo: mock 'Tutoriais' fora da lista do TD-10"
    resolved_by: clarification
  - id: OQ-16
    status: resolved
    summary: "Edição de canal: 'joana.cria' viola a allowlist; nickname muda a URL pública"
    resolved_by: clarification
  - id: OQ-17
    status: resolved
    summary: "Edição de canal: destino do 'Cancelar' e chrome ausente"
    resolved_by: video-channel-management/TD-09
  - id: OQ-18
    status: resolved
    summary: "Chrome autenticado compartilhado entre painel e telas de edição"
    resolved_by: video-channel-management/TD-09
  - id: OQ-19
    status: resolved
    summary: "Página pública: descrição, paginação e contagem só de vídeos públicos"
    resolved_by: video-channel-management/TD-06
  - id: OQ-20
    status: resolved
    summary: "Badge de duração do VideoCard: variante de Badge ou markup interno"
    resolved_by: clarification
  - id: OQ-21
    status: resolved
    summary: "Marca 'EstúdioCriador' vs BrandLogo StreamTube; fonte da imagem do avatar"
    resolved_by: clarification
  - id: OQ-22
    status: resolved
    summary: "Reuso herdado: BackLink e tipografia de label precisam de generalização"
    resolved_by: clarification
  - id: OQ-23
    status: resolved
    summary: "Logout herdado da Fase 02 citado como verbo desta fase"
    resolved_by: clarification
  - id: OQ-24
    status: resolved
    summary: "Telas de auth do Figma (41:177, 41:195) fora do escopo da Fase 04"
    resolved_by: clarification
---

# phase-04-video-channel-management — Validation

## Findings

### Inconsistencies

_None open._ `IC-2` was resolved when `## UI Inventory` became populated — see `## Resolved Issues`.

### Ambiguities

_None open._ `AMB-1` and `AMB-2` are resolved — see `## Resolved Issues`.

### Missing Decisions

_None open._ `MD-1` is covered by `video-channel-management/TD-10`.

### Dependency Gaps

_None._

### Inherited Constraint Conflicts

_None._

### Unresolved Open Questions

_None open._ No TD is pending, and the 14 items in `### Open Questions from Inventory` (`OQ-11`..`OQ-24`) were re-ingested from `context.md` and matched, by category and summary, the entries already resolved by `/plan-resolve` — see `## Resolved Issues`. The inventory file still lists them (this pipeline never edits inventories), which is expected.

### UI Coverage Gaps

_None._

## Resolved Issues

- **IC-1** _(resolved_by video-channel-management/TD-08)_ — TD-08 (Esquema de URL da página pública do canal) was orphaned: `Scope: Frontend` with UI Inventory deferred. Closed by `/plan-resolve video-channel-management`, which reclassified TD-08's `Scope` to `Cross-layer` — the URL scheme depends on the nickname allowlist (`[a-z0-9_]`, phase-02-auth/TD-10), which also governs how the backend exposes channel lookup by nickname, so the decision legitimately informs backend-facing contracts even without an active UI surface. A `**Revisions:**` entry was appended to TD-08 in the decisions doc documenting the reclassification.
- **IC-2** _(resolved_by screen-inventory/phase-04-video-channel-management)_ — TD-09 (Padrão de roteamento da edição de vídeo) had `Scope: Frontend` while `## UI Inventory` carried the deferred placeholder, which would have orphaned it in the final plan artifact. Closed by choice (b) of the original issue: `/screen-inventory 04` produced and validated the inventory (4 screens), and `/plan-context` was rerun, so `## UI Inventory` is now populated and TD-09 renders in the `UI Contracts` of the edit-video screen. TD-09's `Scope` stays `Frontend`.
- **MD-1** _(resolved_by video-channel-management/TD-10)_ — Concrete category value list undecided (TD-01 covered mechanism only). Closed by `/research video-channel-management`, which added TD-10 ("Lista concreta de categorias de vídeo") specifically covering this gap.
- **AMB-1** _(resolved_by video-channel-management/TD-02)_ — Publish-eligibility rule not specified. Closed by `/plan-resolve video-channel-management`, which recorded a Clarification in TD-02's body: only videos with `status: ready` are eligible for the draft→publish transition; `draft`/`processing`/`failed` videos must be rejected with a dedicated domain error. Unpublishing (`published_at = null`) has no such status restriction.
- **AMB-2** _(resolved_by video-channel-management/TD-02)_ — Quem aplica a regra de rascunho/visibilidade na assinatura de URL de vídeo da Fase 03. Decision: a Fase 04 assume. Appended as a `**Revisions:**` entry (2026-09-20) on TD-02: o endpoint de assinatura só assina rascunho (`published_at` nulo) para o dono; vídeo publicado (`public` ou `unlisted`) é assinado para quem tiver o `publicId`. `/plan-build` deve emitir SI no módulo de vídeos do `nestjs-project/`.
- **OQ-1** _(resolved_by video-channel-management/TD-01)_ — TD-01 (Modelagem das categorias de vídeo) decided: A (enum Postgres).
- **OQ-2** _(resolved_by video-channel-management/TD-02)_ — TD-02 (Modelo de estados) decided: A (três eixos independentes).
- **OQ-3** _(resolved_by video-channel-management/TD-03)_ — TD-03 (Mecanismo de upload da thumbnail customizada) decided: A (multipart via FileInterceptor). Libraries: multer.
- **OQ-4** _(resolved_by video-channel-management/TD-04)_ — TD-04 (Precedência thumbnail auto vs. customizada) decided: B (coluna separada + precedência).
- **OQ-5** _(resolved_by video-channel-management/TD-05)_ — TD-05 (Origem dos contadores do painel) decided: A (contadores desnormalizados, sem incremento nesta fase).
- **OQ-6** _(resolved_by video-channel-management/TD-06)_ — TD-06 (Estratégia de paginação) decided: A (offset/limit).
- **OQ-7** _(resolved_by video-channel-management/TD-07)_ — TD-07 (Política de alteração do nickname) decided: A (alteração livre com unicidade).
- **OQ-8** _(resolved_by video-channel-management/TD-08)_ — TD-08 (Esquema de URL da página pública do canal) decided: A (`/@{nickname}`). _(TD-08's Scope was later reclassified Frontend → Cross-layer to resolve `IC-1` — see the `IC-1` bullet above.)_
- **OQ-9** _(resolved_by video-channel-management/TD-09)_ — TD-09 (Padrão de roteamento da edição de vídeo) decided: A (rota dedicada). _(`IC-2`, which tracked this TD's Frontend-scope orphan condition under the deferred UI Inventory, was later resolved — see the `IC-2` bullet above.)_
- **OQ-10** _(resolved_by video-channel-management/TD-10)_ — TD-10 (Lista concreta de categorias de vídeo) decided: B (lista pequena + catch-all "Outros": Música, Jogos, Educação, Entretenimento, Notícias, Esportes, Tecnologia, Outros).
- **OQ-11** _(resolved_by clarification)_ — Botão "Editar" do painel. Decision: o implement infere hover/foco da variante outline do `Button` do DS e a coluna ganha `<th>` sr-only "Ações"; sem novo desenho no Figma.
- **OQ-12** _(resolved_by clarification)_ — Estados do painel. Decision: vazio/loading/erro seguem o padrão de auth; `processando`/`falhou` viram `Badge` extra; sem "Publicar" direto da linha (só pela edição); coluna PUBLICAÇÃO em data **relativa** ("há 3 dias") com a data absoluta no `title`; rascunho mostra "—" na visibilidade.
- **OQ-13** _(resolved_by clarification)_ — Estados ausentes nas demais telas. Decision: o implement infere o padrão do DS de auth (erro inline nos campos, botão em loading, alerta de erro); canal não encontrado usa o 404 do Next; canal sem vídeos usa um empty state simples.
- **OQ-14** _(resolved_by video-channel-management/TD-03)_ — Thumbnail e ciclo de vida na edição de vídeo. Decision: a thumbnail vai junto do submit (mesmo multipart; `ThumbnailUploader` sem mutation própria; cancelar não troca nada) — `**Revisions:**` entry (2026-09-20) on TD-03. Also: "Publicar" fica bloqueado quando `status ≠ ready` (regra já em TD-02) e o vídeo publicado mostra "Salvar alterações" + "Despublicar".
- **OQ-15** _(resolved_by clarification)_ — Mock "Tutoriais" fora do TD-10. Decision: o TD-10 não muda (8 categorias); o exemplo do Figma passa a uma categoria válida (ex.: "Educação"); o implement usa só a lista do TD-10.
- **OQ-16** _(resolved_by clarification)_ — Nickname na edição de canal. Decision: exemplo passa a "joana_cria"; o form valida a allowlist `[a-z0-9_]` (Zod + backend); helper text avisa que a URL pública `/@{nickname}` muda; o prefixo "@" é composição local do `Input`.
- **OQ-17** _(resolved_by video-channel-management/TD-09)_ — Destino do "Cancelar" da edição de canal. Decision: `/channel/videos` — recorded in the 2026-09-20 `**Revisions:**` entry on TD-09.
- **OQ-18** _(resolved_by video-channel-management/TD-09)_ — Chrome autenticado compartilhado. Decision: um layout de route group autenticado (`SiteNavbar` + `UserMenu`) envolve `/channel/videos`, `/videos/{publicId}/edit` e `/channel/settings` — recorded in the 2026-09-20 `**Revisions:**` entry on TD-09.
- **OQ-19** _(resolved_by video-channel-management/TD-06)_ — Página pública do canal. Decision: `limit` padrão 8 (grade 4×2), descrição no cabeçalho quando existir, contagem e total só de vídeos publicados e públicos, caixa tracejada é marcação de mock (não implementar) — recorded in the 2026-09-20 `**Revisions:**` entry on TD-06.
- **OQ-20** _(resolved_by clarification)_ — Badge de duração. Decision: markup interno do `VideoCard` (não é variante do `Badge` do DS); o `Badge` serve só aos chips de status/visibilidade. O inventário não foi editado; `Reuse?` do `VideoCard` segue como está.
- **OQ-21** _(resolved_by clarification)_ — Marca e avatar. Decision: "EstúdioCriador" é placeholder do mock — usa o `BrandLogo` StreamTube; avatar sem upload nesta fase, com iniciais do canal como fallback do `Avatar`.
- **OQ-22** _(resolved_by clarification)_ — Reuso do `BackLink`. Decision: entra na Fase 04 como SI de bootstrap — generalizar o `BackLink` (ícone e destino por props) mantendo os testes e o comportamento das telas de auth; a tipografia de label das telas de edição vira variante local.
- **OQ-23** _(resolved_by clarification)_ — Logout herdado da Fase 02. Decision: a Fase 04 entrega — o `UserMenu` do chrome autenticado chama o `POST /api/auth/logout` já existente; registrado como capability herdada concluída aqui, sem TD novo.
- **OQ-24** _(resolved_by clarification)_ — Telas de auth do Figma (`41:177`, `41:195`). Decision: fora do plano da Fase 04; ficam como follow-up (extension run do inventário `phase-02-auth-frontend`).
