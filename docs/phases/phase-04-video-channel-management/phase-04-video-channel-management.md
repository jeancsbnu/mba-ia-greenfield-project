---
kind: phase
name: phase-04-video-channel-management
test_specs_aware: true
sources_mtime:
  docs/phases/phase-04-video-channel-management/context.md: "2026-09-20T20:36:39.257165100-03:00"
  docs/phases/phase-04-video-channel-management/library-refs.md: "2026-09-20T20:36:09.018715300-03:00"
  docs/project-plan.md: "2026-06-29T19:03:26-03:00"
  docs/decisions/technical-decisions-video-channel-management.md: "2026-09-20T20:35:29.658977100-03:00"
  docs/decisions/technical-decisions-next-frontend-openapi-typing.md: "2026-06-29T19:03:26.324780000-03:00"
  docs/inventories/screen-inventory-phase-04-video-channel-management.md: "2026-09-20T20:09:18.060083500-03:00"
---

# Fase 04 — Gerenciamento de Vídeos e Canal

## Objective

Entregar a edição completa de vídeos (título, descrição, categoria entre as categorias disponíveis, visibilidade público/unlisted e thumbnail customizada), o fluxo de rascunho → publicação, o painel de gerenciamento de vídeos do canal (thumbnail, título, visualizações, likes, comentários, tempo de publicação e status) com edição a partir do painel, a edição das informações do canal (nickname, nome e descrição) e a página pública do canal com informações e listagem de vídeos.

---

## Step Implementations

### SI-04.0.1 — Infra: install batch shadcn primitives

**Description:** Instalar as primitives shadcn usadas pelas quatro telas via CLI do registry; commitar os arquivos gerados em `components/ui/`.

**Technical actions:**

1. Rodar, dentro do container `next-frontend`, `npx shadcn@latest add avatar badge pagination radio-group select textarea` (alfabético) — gera `components/ui/<name>.tsx` por primitive.
2. Commitar `components/ui/avatar.tsx`, `badge.tsx`, `pagination.tsx`, `radio-group.tsx`, `select.tsx` e `textarea.tsx`.

**Tests:** _(empty — Infra)_

**Dependencies:** none

**Acceptance criteria:**

- `components/ui/avatar.tsx`, `badge.tsx`, `pagination.tsx`, `radio-group.tsx`, `select.tsx` e `textarea.tsx` existem em `next-frontend/components/ui/`.
- Os arquivos gerados compilam com `npx tsc --noEmit` no subprojeto `next-frontend`.

---

### SI-04.0.2 — Tests shadcn batch (≤5 files)

**Description:** Testes unitários das primitives shadcn instaladas em SI-04.0.1 (avatar, badge, pagination, radio-group, select) — variants, a11y, `data-slot` e handlers de evento.

**Technical actions:**

1. Criar um arquivo de teste por primitive (`avatar`, `badge`, `pagination`, `radio-group`, `select`); a sexta primitive, `textarea`, fica em SI-04.0.3 pelo limite de 5 arquivos.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `avatar.tsx` | Unit per testing-guide-next-frontend § "UI Primitives" — fallback com iniciais, `data-slot` | `next-frontend/components/ui/__tests__/avatar.test.tsx` |
| `badge.tsx` | Unit per testing-guide-next-frontend § "UI Primitives" — variants, `data-slot` | `next-frontend/components/ui/__tests__/badge.test.tsx` |
| `pagination.tsx` | Unit per testing-guide-next-frontend § "UI Primitives" — `nav`, `aria-current`, estado desabilitado | `next-frontend/components/ui/__tests__/pagination.test.tsx` |
| `radio-group.tsx` | Unit per testing-guide-next-frontend § "UI Primitives" — `role="radiogroup"`, seleção e navegação por setas | `next-frontend/components/ui/__tests__/radio-group.test.tsx` |
| `select.tsx` | Unit per testing-guide-next-frontend § "UI Primitives" — abrir, escolher opção, `data-slot` | `next-frontend/components/ui/__tests__/select.test.tsx` |

**Dependencies:** SI-04.0.1

**Acceptance criteria:**

- Cada primitive deste lote tem um arquivo de teste que cobre todas as variants, atributos ARIA, âncoras `data-slot` e handlers de evento.
- Os testes passam com `npm test` no subprojeto `next-frontend`.

---

### SI-04.0.3 — Tests shadcn batch (textarea)

**Description:** Teste unitário da primitive `textarea`, separado de SI-04.0.2 pelo limite de 5 arquivos de teste por SI.

**Technical actions:**

1. Criar o arquivo de teste de `textarea`.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `textarea.tsx` | Unit per testing-guide-next-frontend § "UI Primitives" — valor controlado, `disabled`, `aria-invalid`, `data-slot` | `next-frontend/components/ui/__tests__/textarea.test.tsx` |

**Dependencies:** SI-04.0.1

**Acceptance criteria:**

- `textarea` tem um teste que cobre valor controlado, estado desabilitado, `aria-invalid` e a âncora `data-slot`.
- O teste passa com `npm test` no subprojeto `next-frontend`.

---

### SI-04.0.4 — Custom-business simple group: channel-edit-form + channel-header + chevron-down-icon + chevron-left-icon + plus-icon

**Description:** Autorar componentes de negócio e ícones sem estado próprio, na versão apresentacional descrita no UI Contract; o wiring de dados e mutação de cada tela fica nos SIs Xb.

**Technical actions:**

1. Criar `components/channels/channel-edit-form.tsx` — form como unidade (react-hook-form + Zod, mutation via Route Handler); o Figma não tem um nó `<form>` dedicado, o form agrupa `form-fields` e `actions-row` dentro do card.
2. Criar `components/channels/channel-header.tsx` — faixa de cabeçalho do canal: avatar, nome, descrição quando existir e `@{nickname} · {videosCount} vídeos`.
3. Criar `components/icons/chevron-down-icon.tsx` — ícone decorativo interno do `Select`.
4. Criar `components/icons/chevron-left-icon.tsx` — ícone interno do `BackLink`; difere do `arrow-back-icon.tsx` existente (chevron vs seta).
5. Criar `components/icons/plus-icon.tsx` — ícone "+" 14px do botão "Criar novo vídeo".

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `channel-edit-form.tsx` | Unit per testing-guide-next-frontend § "Client Components" — renderização dos três campos, prefixo "@" decorativo e props | `next-frontend/components/channels/__tests__/channel-edit-form.test.tsx` |
| `channel-header.tsx` | Unit per testing-guide-next-frontend § "Client Components" — nome, meta com plural, descrição opcional e `alt` do avatar | `next-frontend/components/channels/__tests__/channel-header.test.tsx` |

Os três ícones não recebem teste próprio (testing-guide-next-frontend § "Icons": SVG estático).

**Dependencies:** SI-04.0.1

**Acceptance criteria:**

- Os cinco arquivos existem nos caminhos declarados e seguem o UI Contract das telas que os usam.
- `ChannelHeader` mostra `@{nickname} · 1 vídeo` no singular e `N vídeos` nos demais casos, e omite a descrição quando ela é nula.
- Os ícones são decorativos (`aria-hidden`) e não têm nome acessível próprio.
- Os testes passam com `npm test` no subprojeto `next-frontend`.

---

### SI-04.0.5 — Custom-business simple group: site-navbar + thumbnail-uploader + user-menu + video-card + video-edit-form

**Description:** Autorar o chrome autenticado e os componentes de vídeo sem estado próprio, na versão apresentacional descrita no UI Contract; a lógica e a mutação ficam nos SIs de layout e Xb.

**Technical actions:**

1. Criar `components/layout/site-navbar.tsx` — chrome: BrandLogo à esquerda e um slot à direita (UserMenu autenticado ou botão "Entrar" anônimo); sem busca nem links; reutilizado nas telas da Fase 04.
2. Criar `components/layout/user-menu.tsx` — composição Avatar + botão "Sair"; unidade dona da ação de logout (mesmo critério de Form + SubmitButton da fase 02).
3. Criar `components/videos/thumbnail-uploader.tsx` — coluna esquerda: preview + botão "Alterar thumbnail" + helper; envia a thumbnail customizada como multipart (TD-03); exibe a URL única já resolvida (TD-04), sem lógica auto-vs-custom no front.
4. Criar `components/videos/video-card.tsx` — card reutilizável nas Fases 05 e 07: thumbnail 233×131, duração sobreposta (markup interno, sem `Badge`), título em uma linha com ellipsis e meta `{viewsCount} visualizações · há X`.
5. Criar `components/videos/video-edit-form.tsx` — form como unidade (react-hook-form + Zod): recebe os valores atuais do vídeo e submete edição/publicação; wrapper "right-column" do Figma.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `site-navbar.tsx` | Unit per testing-guide-next-frontend § "Client Components" — slot anônimo vs autenticado | `next-frontend/components/layout/__tests__/site-navbar.test.tsx` |
| `user-menu.tsx` | Unit per testing-guide-next-frontend § "Client Components" — iniciais no avatar e botão "Sair" | `next-frontend/components/layout/__tests__/user-menu.test.tsx` |
| `thumbnail-uploader.tsx` | Unit per testing-guide-next-frontend § "Client Components" — preview local ao escolher arquivo, sem envio | `next-frontend/components/videos/__tests__/thumbnail-uploader.test.tsx` |
| `video-card.tsx` | Unit per testing-guide-next-frontend § "Client Components" — título truncado, duração `m:ss` e meta | `next-frontend/components/videos/__tests__/video-card.test.tsx` |
| `video-edit-form.tsx` | Unit per testing-guide-next-frontend § "Client Components" — campos pré-preenchidos e radiogroup rotulado | `next-frontend/components/videos/__tests__/video-edit-form.test.tsx` |

**Dependencies:** SI-04.0.1, SI-04.0.4

**Acceptance criteria:**

- Os cinco arquivos existem nos caminhos declarados e seguem o UI Contract das telas que os usam.
- `VideoCard` renderiza a duração como `m:ss` sobre a thumbnail e o título em uma única linha com ellipsis.
- `VideoEditForm` renderiza título, descrição, categoria e visibilidade pré-preenchidos, com labels ligados aos campos.
- Os testes passam com `npm test` no subprojeto `next-frontend`.

---

### SI-04.0.6 — Custom-business simple group: video-status-badge + video-table + video-visibility-badge

**Description:** Autorar os componentes do painel sem estado próprio: os dois chips e a tabela de vídeos, na versão apresentacional do UI Contract.

**Technical actions:**

1. Criar `components/videos/video-status-badge.tsx` — chips "Publicado" (success) e "Rascunho" (muted), mais os extras "Processando" (muted) e "Falhou" (destructive) para `status` diferente de `ready`; apenas exibição.
2. Criar `components/videos/video-table.tsx` — cabeçalho + linhas; última coluna com o botão "Editar" por linha (nome acessível `Editar {título}`) e `<th>` sr-only "Ações"; estados de rascunho com "—".
3. Criar `components/videos/video-visibility-badge.tsx` — "Público" (muted), "Indisponível" (warning) para `unlisted` e "—" (muted) em rascunho.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `video-status-badge.tsx` | Unit per testing-guide-next-frontend § "Client Components" — um caso por valor de status e publicação | `next-frontend/components/videos/__tests__/video-status-badge.test.tsx` |
| `video-table.tsx` | Unit per testing-guide-next-frontend § "Client Components" — linha de rascunho, contadores pt-BR, nome acessível do "Editar" | `next-frontend/components/videos/__tests__/video-table.test.tsx` |
| `video-visibility-badge.tsx` | Unit per testing-guide-next-frontend § "Client Components" — rótulo "Indisponível" para `unlisted` e "—" em rascunho | `next-frontend/components/videos/__tests__/video-visibility-badge.test.tsx` |

**Dependencies:** SI-04.0.1

**Acceptance criteria:**

- Os três arquivos existem nos caminhos declarados e seguem o UI Contract do painel.
- `VideoVisibilityBadge` nunca mostra o termo em inglês "Unlisted": o valor `unlisted` aparece como "Indisponível".
- `VideoTable` renderiza um botão "Editar" por linha cujo nome acessível inclui o título do vídeo.
- Os testes passam com `npm test` no subprojeto `next-frontend`.

---

### SI-04.1 — Migrar o schema de vídeo (categoria, visibilidade, publicação, thumbnail customizada e contadores)

**Description:** Adicionar à tabela `videos` as colunas e os enums dos TD-01, TD-02, TD-04, TD-05 e TD-10, com migration que preserva os vídeos existentes.

**Technical actions:**

1. Em `nestjs-project/src/videos/entities/video.entity.ts`, declarar os enums `VideoCategory` (valores byte-verbatim do TD-10) e `VideoVisibility` (`public`, `unlisted`) (per `video-channel-management/TD-01`, `TD-10`, `TD-02`).
2. Adicionar à entidade `Video` as colunas `category`, `visibility`, `published_at`, `custom_thumbnail_key`, `views_count`, `likes_count` e `comments_count` com os tipos, defaults e nulidade de `### Data Model` (per `video-channel-management/TD-02`, `TD-04`, `TD-05`).
3. Declarar na entidade o índice composto (`channel_id`, `published_at`).
4. Gerar a migration em `nestjs-project/src/database/migrations/` com `npm run migration:generate` e conferir que cria os enums antes das colunas, preenche os vídeos existentes (`published_at` nulo, `visibility` `'public'`, `category` `'Outros'`, contadores 0) e que o `down` remove as colunas e depois os enums.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `Video` | Integration: defaults (`category`, `visibility`, `published_at`, contadores) e rejeição de `category` fora do enum | `nestjs-project/src/videos/entities/video.entity.integration-spec.ts` |
| migrations | Integration: a migration sobe e reverte com vídeos já existentes | `nestjs-project/src/database/migrations.integration-spec.ts` |

**Dependencies:** none

**Acceptance criteria:**

- Depois de `npm run migration:run`, a tabela `videos` tem `category`, `visibility`, `published_at`, `custom_thumbnail_key`, `views_count`, `likes_count` e `comments_count` com os tipos de `### Data Model`.
- Inserir um vídeo sem informar as colunas novas grava `category = 'Outros'`, `visibility = 'public'`, `published_at` nulo e os três contadores em 0.
- Inserir `category` com valor fora dos oito valores do TD-10 falha com violação de enum.
- Um vídeo criado antes da migration continua existindo depois dela, com `published_at` nulo.
- `npm run migration:revert` remove as colunas e os enums sem erro.

---

### SI-04.2 — Endpoint GET /videos/{publicId} (detalhe do dono estendido)

**Route:** GET /videos/{publicId}
**Test Specs:** see `nestjs-project/specs/videos-detail.plan.md`
**Authorization:** Authenticated+Owner (per `### Authorization Matrix`)

**Description:** Estender a resposta do endpoint da Fase 03 com categoria, visibilidade, publicação e a URL única de thumbnail já resolvida, sem quebrar o consumidor de polling de status.

**Technical actions:**

1. Criar `VideosService.resolveThumbnailUrl(video)` — devolve a URL pré-assinada de `custom_thumbnail_key` quando não nulo, senão a de `thumbnail_key`, senão `null` (per `video-channel-management/TD-04`).
2. Em `VideosController.getVideo`, acrescentar `category`, `visibility`, `publishedAt` e `thumbnailUrl` à resposta, mantendo os campos atuais (per `### API Contracts` → `GET /videos/{publicId}`).
3. Atualizar o schema `@ApiResponse` 200 do endpoint com os quatro campos novos, que alimentam o `openapi.json`.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `VideosService.resolveThumbnailUrl` | Unit: precedência custom > gerada > `null` (storage mockado) | `nestjs-project/src/videos/videos.service.spec.ts` |
| `VideosService.resolveThumbnailUrl` | Integration: URL pré-assinada real do MinIO para as duas chaves | `nestjs-project/src/videos/videos.service.integration-spec.ts` |

Os testes E2E do endpoint são escritos externamente por `/plan-test-specs`, no spec referenciado em `**Test Specs:**`.

**Dependencies:** SI-04.1

**Acceptance criteria:**

- `GET /videos/{publicId}` do dono retorna `200` com `category`, `visibility`, `publishedAt` (nulo em rascunho) e `thumbnailUrl`, além de `publicId`, `title`, `description`, `status`, `durationSeconds` e `createdAt`.
- `thumbnailUrl` aponta para a thumbnail customizada quando o vídeo tem uma, e para a gerada pelo worker caso contrário.
- `thumbnailUrl` é `null` quando o vídeo não tem nenhuma thumbnail.
- `GET /videos/{publicId}` de um vídeo de outro canal retorna `403` com `FORBIDDEN`.
- `GET /videos/{publicId}` com `publicId` inexistente retorna `404` com `VIDEO_NOT_FOUND`.

---

### SI-04.3 — Endpoint PATCH /videos/{publicId} (edição, thumbnail e publicação)

**Route:** PATCH /videos/{publicId}
**Test Specs:** see `nestjs-project/specs/videos-update.plan.md`
**Authorization:** Authenticated+Owner (per `### Authorization Matrix`)

**Description:** Editar título, descrição, categoria e visibilidade, trocar a thumbnail customizada e publicar ou despublicar o vídeo numa única chamada multipart.

**Technical actions:**

1. Adicionar `@types/multer` como devDependency de `nestjs-project/package.json` (dentro do container `nestjs-api`); o `multer` já vem via `@nestjs/platform-express` (per `video-channel-management/TD-03`, `library-refs.md` → multer).
2. Criar `UpdateVideoDto` em `nestjs-project/src/videos/dto/update-video.dto.ts` com as regras de `#### Validation Rules — Fase 04 (backend)`, incluindo a conversão do texto `published` (`true`/`false`) em boolean.
3. Criar `VideoNotPublishableException` (`VIDEO_NOT_PUBLISHABLE`, 409) em `nestjs-project/src/common/exceptions/domain.exception.ts` (per `video-channel-management/TD-02`, Clarification de AMB-1).
4. Implementar `VideosService.updateVideo(video, dto, thumbnail?)`: aplica os campos, publica (`published_at` = agora, mantendo o valor atual se já publicado) só com `status = ready`, despublica (`published_at` = `null`) sem restrição de status, e grava a thumbnail no `storage_bucket` do vídeo atualizando só `custom_thumbnail_key`, nunca `thumbnail_key` (per `video-channel-management/TD-02`, `TD-04`).
5. Adicionar `PATCH :publicId` a `VideosController` com `FileInterceptor('thumbnail', { limits: { fileSize } })`, `ParseFilePipeBuilder` (MIME `image/jpeg`, `image/png` ou `image/webp`; até 2 MiB; arquivo opcional), verificação de dono e `@ApiConsumes('multipart/form-data')` (per `### API Contracts` → `PATCH /videos/{publicId}`).

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `VideosService.updateVideo` | Unit: ramos de publicação (ready, não ready, já publicado, despublicar), descrição vazia → `null` (repositório e storage mockados) | `nestjs-project/src/videos/videos.service.spec.ts` |
| `VideosService.updateVideo` | Integration: persistência de `category`, `visibility`, `published_at` e `custom_thumbnail_key` com `thumbnail_key` intacto | `nestjs-project/src/videos/videos.service.integration-spec.ts` |

Os testes E2E do endpoint são escritos externamente por `/plan-test-specs`, no spec referenciado em `**Test Specs:**`.

**Dependencies:** SI-04.2

**Acceptance criteria:**

- `PATCH /videos/{publicId}` com `title`, `description`, `category` e `visibility` válidos retorna `200` com o vídeo atualizado.
- `PATCH` com `published=true` num vídeo com `status = ready` retorna `200` com `publishedAt` preenchido; repetir a chamada mantém o mesmo `publishedAt`.
- `PATCH` com `published=true` num vídeo com `status` diferente de `ready` retorna `409` com `VIDEO_NOT_PUBLISHABLE` e não altera `published_at`.
- `PATCH` com `published=false` retorna `200` com `publishedAt` nulo, seja qual for o `status`.
- `PATCH` com `thumbnail` JPEG, PNG ou WebP de até 2 MiB retorna `200` e `thumbnailUrl` passa a apontar para a imagem enviada, sem alterar `thumbnail_key`.
- `PATCH` com `thumbnail` de outro tipo retorna `400`; acima de 2 MiB retorna `413`.
- `PATCH` com `category` fora dos oito valores do TD-10 ou com `title` vazio retorna `400`.
- `PATCH` de um vídeo de outro canal retorna `403` com `FORBIDDEN`; com `publicId` inexistente retorna `404` com `VIDEO_NOT_FOUND`.

---

### SI-04.4 — Endpoint GET /me/videos (painel do canal)

**Route:** GET /me/videos
**Test Specs:** see `nestjs-project/specs/me-videos.plan.md`
**Authorization:** Authenticated (per `### Authorization Matrix`)

**Description:** Listar, com paginação offset/limit e total, todos os vídeos do canal do usuário — rascunhos incluídos — para o painel de gerenciamento.

**Technical actions:**

1. Criar `nestjs-project/src/videos/channel-videos.controller.ts` (`@Controller()`, rota `me/videos`) e registrá-lo em `VideosModule`; o controller vive em `VideosModule` para evitar dependência circular entre `ChannelsModule` e `VideosModule`.
2. Criar `ListVideosQueryDto` em `nestjs-project/src/videos/dto/list-videos-query.dto.ts` — `offset` (≥ 0, padrão 0) e `limit` (1 a 50, padrão 10) (per `video-channel-management/TD-06`).
3. Implementar `VideosService.listByChannel(channelId, offset, limit)` — todos os vídeos do canal por `created_at` decrescente, com `total` do canal.
4. Montar o envelope `{ items, total, offset, limit }` com os itens `publicId`, `title`, `durationSeconds`, `thumbnailUrl` (via `resolveThumbnailUrl`), `status`, `visibility`, `publishedAt`, `viewsCount`, `likesCount` e `commentsCount` (per `### API Contracts` → `GET /me/videos`).
5. Resolver o canal por `ChannelsService.findByUserId`; sem canal, lançar a nova `ChannelNotFoundException` (`CHANNEL_NOT_FOUND`, 404) em `nestjs-project/src/common/exceptions/domain.exception.ts`.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `VideosService.listByChannel` | Integration: recorte por `offset`/`limit`, `total`, ordem, rascunhos incluídos e isolamento entre canais | `nestjs-project/src/videos/videos.service.integration-spec.ts` |

Os testes E2E do endpoint são escritos externamente por `/plan-test-specs`, no spec referenciado em `**Test Specs:**`.

**Dependencies:** SI-04.2

**Acceptance criteria:**

- `GET /me/videos` autenticado retorna `200` com `items`, `total`, `offset` e `limit`.
- A listagem inclui rascunhos e vídeos publicados do canal do usuário e nunca vídeos de outro canal.
- `offset` e `limit` recortam a lista e `total` continua sendo o total de vídeos do canal; sem parâmetros valem `offset` 0 e `limit` 10.
- Os vídeos mais recentes vêm primeiro (`created_at` decrescente).
- `GET /me/videos` com `limit` acima de 50 ou `offset` negativo retorna `400`.
- `GET /me/videos` sem token retorna `401`.

---

### SI-04.5 — Endpoints GET e PATCH /me/channel (canal do dono)

**Route:** PATCH /me/channel
**Test Specs:** see `nestjs-project/specs/me-channel.plan.md`
**Authorization:** Authenticated (per `### Authorization Matrix`)

**Description:** Ler e editar nickname, nome e descrição do canal do usuário autenticado, com nickname livre e único (`GET /me/channel` e `PATCH /me/channel`).

**Technical actions:**

1. Criar `nestjs-project/src/channels/channels.controller.ts` (`@Controller('me/channel')` com `GET` e `PATCH`) e registrá-lo em `ChannelsModule`.
2. Criar `UpdateChannelDto` em `nestjs-project/src/channels/dto/update-channel.dto.ts` — `nickname` (`^[a-z0-9_]+$`, 1 a 50), `name` (1 a 50) e `description` (opcional) (per `phase-02-auth/TD-10`, `### API Contracts` → `PATCH /me/channel`).
3. Implementar `ChannelsService.updateChannel(userId, dto)` — string vazia em `description` grava `null`, e a violação única da coluna `nickname` vira `NicknameAlreadyExistsException` (per `video-channel-management/TD-07`).
4. Criar `NicknameAlreadyExistsException` (`NICKNAME_ALREADY_EXISTS`, 409) em `nestjs-project/src/common/exceptions/domain.exception.ts`.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `ChannelsService.updateChannel` | Unit: `description` vazia → `null` e mapeamento da violação única (repositório mockado) | `nestjs-project/src/channels/channels.service.spec.ts` |
| `ChannelsService.updateChannel` | Integration: colisão real de nickname entre dois canais | `nestjs-project/src/channels/channels.service.integration-spec.ts` |

Os testes E2E do endpoint são escritos externamente por `/plan-test-specs`, no spec referenciado em `**Test Specs:**`.

**Dependencies:** SI-04.4

**Acceptance criteria:**

- `GET /me/channel` autenticado retorna `200` com `name`, `nickname` e `description`.
- `PATCH /me/channel` com `nickname`, `name` e `description` válidos retorna `200` com o canal atualizado.
- `PATCH /me/channel` com um nickname que já pertence a outro canal retorna `409` com `NICKNAME_ALREADY_EXISTS` e não altera o canal.
- `PATCH /me/channel` com nickname fora de `[a-z0-9_]`, nome vazio ou corpo vazio retorna `400`.
- `GET` e `PATCH /me/channel` sem token retornam `401`.

---

### SI-04.6 — Endpoints GET /channels/{nickname} e GET /channels/{nickname}/videos (canal público)

**Route:** GET /channels/{nickname}
**Test Specs:** see `nestjs-project/specs/channels-public.plan.md`
**Authorization:** Anonymous (per `### Authorization Matrix`)

**Description:** Expor sem autenticação as informações públicas de um canal e a listagem paginada dos seus vídeos publicados e públicos.

**Technical actions:**

1. Em `nestjs-project/src/videos/channel-videos.controller.ts`, acrescentar `GET channels/:nickname` e `GET channels/:nickname/videos`, ambos `@Public()` e sem conflito com as rotas `me`.
2. Implementar `ChannelsService.findByNicknameOrFail(nickname)`, que lança `ChannelNotFoundException` para nickname inexistente.
3. Implementar `VideosService.listPublicByChannel(channelId, offset, limit)` e `VideosService.countPublicByChannel(channelId)` — só vídeos com `published_at` não nulo e `visibility = public`, por `published_at` decrescente; `limit` padrão 8 (per `video-channel-management/TD-02`, `TD-06`).
4. Montar `{ name, nickname, description, videosCount }` e o envelope `{ items, total, offset, limit }` com os itens `publicId`, `title`, `durationSeconds`, `thumbnailUrl`, `viewsCount` e `publishedAt` (per `### API Contracts`).

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `ChannelsService.findByNicknameOrFail` | Unit: canal encontrado e `CHANNEL_NOT_FOUND` (repositório mockado) | `nestjs-project/src/channels/channels.service.spec.ts` |
| `VideosService.listPublicByChannel` | Integration: exclui rascunho e `unlisted`, ordena por `published_at`, `total` coerente com `videosCount` | `nestjs-project/src/videos/videos.service.integration-spec.ts` |

Os testes E2E dos endpoints são escritos externamente por `/plan-test-specs`, no spec referenciado em `**Test Specs:**`.

**Dependencies:** SI-04.4

**Acceptance criteria:**

- `GET /channels/{nickname}` sem token retorna `200` com `name`, `nickname`, `description` e `videosCount`.
- `videosCount` e `total` contam só vídeos publicados e públicos: rascunhos e vídeos `unlisted` ficam de fora.
- `GET /channels/{nickname}/videos` retorna `200` com `items`, `total`, `offset` e `limit`, mais recentes primeiro (`published_at` decrescente); sem parâmetros vale `limit` 8.
- Cada item de `items` traz `publicId`, `title`, `durationSeconds`, `thumbnailUrl`, `viewsCount` e `publishedAt`.
- Nickname inexistente retorna `404` com `CHANNEL_NOT_FOUND` nas duas rotas.
- `GET /channels/{nickname}/videos` com `limit` acima de 50 ou `offset` negativo retorna `400`.

---

### SI-04.7 — Assinatura de stream e download respeita rascunho e visibilidade

**Route:** GET /videos/{publicId}/stream
**Test Specs:** see `nestjs-project/specs/videos-stream-visibility.plan.md`
**Authorization:** Anonymous para vídeo publicado; Owner para rascunho (per `### Authorization Matrix`)

**Description:** Aplicar aos endpoints `stream` e `download` da Fase 03 a regra de que rascunho só é assinado para o dono, e vídeo publicado (público ou indisponível) para quem tiver o link.

**Technical actions:**

1. Em `nestjs-project/src/auth/guards/jwt-auth.guard.ts`, para rotas `@Public()` com `Authorization: Bearer` presente, tentar `verifyAsync` e preencher `request.user`; token ausente ou inválido segue anônimo, sem `401` (per `video-channel-management/TD-02`, revisão de 2026-09-20).
2. Implementar `VideosService.assertServable(video, userId?)` — rascunho (`published_at` nulo) só para o dono do canal; caso contrário lança `VideoNotFoundException`, antes da checagem `status = ready`.
3. Em `stream` e `download` de `VideosController`, ler o usuário opcional por `@CurrentUser()` e chamar `assertServable` antes de assinar a URL.
4. Atualizar a documentação OpenAPI das duas rotas: `Authorization` Bearer opcional e `404` também para rascunho de terceiros.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `JwtAuthGuard` | Unit: rota pública com token válido preenche `request.user`; token inválido é ignorado | `nestjs-project/src/auth/guards/jwt-auth.guard.spec.ts` |
| `VideosService.assertServable` | Unit: rascunho para dono, para terceiro e para anônimo; vídeo publicado para qualquer um | `nestjs-project/src/videos/videos.service.spec.ts` |
| `VideosService.assertServable` | Integration: ordem 404 antes de 409 com vídeos reais no banco | `nestjs-project/src/videos/videos.service.integration-spec.ts` |

Os testes E2E das duas rotas são escritos externamente por `/plan-test-specs`, no spec referenciado em `**Test Specs:**`.

**Dependencies:** SI-04.1

**Acceptance criteria:**

- `GET /videos/{publicId}/stream` de um vídeo publicado (público ou `unlisted`) sem token retorna `302` para a URL assinada.
- `GET /videos/{publicId}/stream` e `/download` de um rascunho sem token retornam `404` com `VIDEO_NOT_FOUND`.
- `GET /videos/{publicId}/stream` de um rascunho com `status = ready`, chamado pelo dono autenticado, retorna `302`.
- `GET /videos/{publicId}/stream` de um rascunho chamado por outro usuário autenticado retorna `404` com `VIDEO_NOT_FOUND`.
- `GET /videos/{publicId}/stream` de um vídeo publicado com token inválido retorna `302`, não `401`.
- `GET /videos/{publicId}/stream` de um vídeo publicado com `status` diferente de `ready` retorna `409` com `VIDEO_NOT_READY`.
- `GET /videos/{publicId}/download` aplica as mesmas regras de `stream`.

---

### SI-04.8 — Sincronizar o contrato OpenAPI e os mocks do frontend

**Description:** Levar os endpoints novos do backend para `openapi.json` e `types.gen.ts`, expor aliases tipados em `contracts.ts` e criar os handlers MSW que os SIs de frontend usam nos testes.

**Technical actions:**

1. Exportar o `openapi.json` do backend (`nestjs-project/src/openapi-export.ts`) e copiá-lo para `next-frontend/openapi.json` (per `next-frontend-openapi-typing/TD-02`).
2. Rodar `npm run openapi:types` em `next-frontend` para regenerar `lib/api/types.gen.ts` (per `next-frontend-openapi-typing/TD-03`).
3. Em `next-frontend/lib/api/contracts.ts`, acrescentar os aliases das operações novas: categoria, `UpdateVideoDto`, página de vídeos do painel, canal do dono, `UpdateChannelDto`, canal público e página de vídeos públicos — cada um indexando `paths`, e este continua sendo o único arquivo que importa `paths` (per `next-frontend-openapi-typing/TD-04`).
4. Criar os handlers MSW `next-frontend/mocks/handlers/channels.ts` e estender `mocks/handlers/videos.ts` para as operações novas, com corpos tipados por `paths` e fixtures determinísticas em `mocks/factories/` (per `next-frontend-openapi-typing/TD-05`).
5. Registrar os handlers novos no barrel `next-frontend/mocks/handlers/index.ts`.

**Tests:** _(empty — contrato provado por tsc; handlers exercitados pelos testes dos SIs 04.10 a 04.14)_

**Dependencies:** SI-04.2, SI-04.3, SI-04.4, SI-04.5, SI-04.6, SI-04.7

**Acceptance criteria:**

- `next-frontend/openapi.json` descreve `GET /me/videos`, `GET` e `PATCH /me/channel`, `PATCH /videos/{publicId}`, `GET /channels/{nickname}` e `GET /channels/{nickname}/videos`.
- `npx tsc --noEmit` em `next-frontend` passa com os aliases e handlers novos.
- Regenerar `openapi.json` e `types.gen.ts` não produz diff (o guard de CI de frescor do OpenAPI passa).
- Todo handler MSW novo tem o corpo de resposta tipado por `paths`, de modo que uma mudança de contrato quebra o `tsc`.

---

### SI-04.9 — Generalizar o BackLink (ícone por props)

**Description:** Permitir que o `BackLink` da Fase 02 receba um ícone, para servir ao "Voltar para o painel" com chevron da tela de edição de vídeo sem alterar as telas de auth.

**Technical actions:**

1. Em `next-frontend/components/auth/back-link.tsx`, adicionar a prop opcional `icon?: React.ReactNode`, renderizada antes de `children` dentro do mesmo `<Link>`; sem `icon` a saída atual não muda.
2. Estender `next-frontend/components/auth/__tests__/back-link.test.tsx` com o caso do ícone.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `BackLink` | Unit per testing-guide-next-frontend § "Client Components" — ícone antes do texto e nome acessível só com o texto | `next-frontend/components/auth/__tests__/back-link.test.tsx` |

**Dependencies:** none

**Acceptance criteria:**

- `BackLink` com `icon` renderiza o ícone antes do texto, dentro do mesmo link, com o `href` recebido.
- `BackLink` sem `icon` renderiza exatamente como antes, e os testes de auth existentes continuam passando.
- O nome acessível do link continua sendo apenas o texto, sem depender do ícone.

---

### SI-04.10 — Layout autenticado do canal (chrome, logout e leitura com refresh)

**Description:** Criar o route group autenticado que envolve as três telas do canal com `SiteNavbar` e `UserMenu`, ligar o logout e dar às leituras em Server Component um caminho de refresh do token, já que elas não podem gravar o cookie de sessão.

**Technical actions:**

1. Exportar `refreshOnce` de `next-frontend/lib/auth/refresh.ts` para reuso pela rota de refresh, sem alterar o comportamento de `withRefresh` (per `phase-02-auth-frontend/TD-03`).
2. Criar `next-frontend/app/api/auth/refresh/route.ts` (`GET`): renova os tokens e redireciona para `returnTo` (só caminho interno; qualquer outro valor cai em `/channel/videos`) e, em falha, para `/login` (per `### API Contracts` → BFF tier → `GET /api/auth/refresh`).
3. Criar o helper `next-frontend/lib/api/server-upstream.ts` para leituras em Server Component: chama `upstream` com o Bearer da sessão; sem sessão redireciona para `/login`; um `401` redireciona para `/api/auth/refresh?returnTo=…`, e o segundo `401` seguido (marcado por um parâmetro anexado pela rota de refresh) redireciona para `/login`, sem loop.
4. Criar `next-frontend/app/(studio)/layout.tsx` (Server Component): exige `session.isLoggedIn`, lê `GET /me/channel` pelo helper e renderiza `SiteNavbar` com `UserMenu` mostrando as iniciais do nome do canal; não usa `session.channelSlug`, que o login grava vazio (per `video-channel-management/TD-09`, revisão de 2026-09-20).
5. Ligar o botão "Sair" do `UserMenu` (Client Component) a `POST /api/auth/logout`, seguido de `router.push("/login")` e `router.refresh()` (per `### API Contracts` → BFF tier → `POST /api/auth/logout`).

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `lib/api/server-upstream.ts` | Unit per testing-guide-next-frontend § "Utilities" — sem sessão, `401` → refresh, segundo `401` → `/login` (MSW) | `next-frontend/lib/api/__tests__/server-upstream.test.ts` |
| `app/api/auth/refresh/route.ts` | Integration per testing-guide-next-frontend § "Route Handlers" — sucesso, falha e `returnTo` externo (MSW) | `next-frontend/app/api/auth/refresh/__tests__/route.integration.test.ts` |
| `components/layout/user-menu.tsx` | Unit per testing-guide-next-frontend § "Client Components" — clique em "Sair" chama o logout e navega | `next-frontend/components/layout/__tests__/user-menu.wiring.test.tsx` |

**Dependencies:** SI-04.5, SI-04.8, SI-04.0.5

**Acceptance criteria:**

- Uma rota do route group `(studio)` acessada sem sessão redireciona para `/login`.
- Com sessão, as rotas do route group mostram a navbar com o `UserMenu` e as iniciais do nome do canal, lidas de `GET /me/channel` a cada requisição.
- `GET /api/auth/refresh?returnTo=/channel/videos` com refresh token válido responde `302` para `/channel/videos` com o cookie de sessão renovado.
- `GET /api/auth/refresh` com refresh token inválido responde `302` para `/login` e destrói a sessão.
- `GET /api/auth/refresh?returnTo=https://outro.site` responde `302` para `/channel/videos`, nunca para o host externo.
- Clicar em "Sair" chama `POST /api/auth/logout` e leva o usuário a `/login`.

---

### SI-04.11.0 — Drift audit: Painel de gerenciamento de vídeos do canal

**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=39-2
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Painel de gerenciamento de vídeos do canal`

**Technical actions:**

1. **Drift audit** — invocar `figma:figma-implement-design` (handoff estreito) com:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=39-2
   - Reused DS components: [`components/layout/site-navbar.tsx`, `components/auth/brand-logo.tsx`, `components/icons/streamtube-icon.tsx`, `components/layout/user-menu.tsx`, `components/ui/avatar.tsx`, `components/ui/button.tsx`, `components/icons/plus-icon.tsx`, `components/videos/video-table.tsx`, `components/ui/badge.tsx`, `components/videos/video-visibility-badge.tsx`, `components/videos/video-status-badge.tsx`, `components/ui/pagination.tsx`]
   - Server-connected component names (sem endpoints/auth/erros): [`UserMenu`, `SairButton`, `VideoTable`]
   - Target paths (contexto somente leitura; sem escrita aqui): `app/(studio)/channel/videos/page.tsx` + `components/videos/video-table.tsx`

   Para cada componente da lista de Reused DS, comparar valores contra o arquivo em disco e classificar pelo enum de 4 status (`alinhado` / `drift menor` / `drift relevante` / `componente ausente`). Compor a Decision pela política padrão (`.claude/skills/plan-build/references/frontend-drift-report-schema.md` § Default decisions per status). Ler as seções anteriores de `frontend-drift-report.md` para montar `prior_decisions` e preencher a coluna `Prior` com detecção de CONFLICT. Escrever a seção `## Screen: painel-videos — audited at SI-04.11.0 ({YYYY-MM-DD})` em `frontend-drift-report.md` (append na primeira execução, sobrescrita no lugar nas seguintes). **Sem edição de código — verificável por `git diff` ao fim do SI.**

**Dependencies:** SI-04.0.1, SI-04.0.4, SI-04.0.5, SI-04.0.6

**Tests:** _(empty — audit-only; the report is the deliverable)_

**Acceptance criteria:**

- `frontend-drift-report.md` existe na pasta do plano, com a seção `## Screen: painel-videos` datada da execução atual.
- Todo componente da lista de Reused DS tem exatamente uma linha na tabela.
- Toda linha tem a coluna Decision preenchida conforme o status (`alinhado` → `skip`; `drift menor` → `auto-Edit` ou `exception`; `drift relevante` → `auto-Edit`, `exception` ou `CONFLICT: …; <verbo>`; `componente ausente` → `create`).
- Toda decisão `exception` traz uma justificativa de uma linha.
- `git diff --name-only HEAD -- next-frontend` ao fim do SI é vazio.

---

### SI-04.11a — Tela de Painel de gerenciamento de vídeos do canal (visual shell)

**Route:** /channel/videos
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=39-2
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Painel de gerenciamento de vídeos do canal`
**Drift Report:** see `frontend-drift-report.md` → `## Screen: painel-videos`

**Technical actions:**

1. **Apply drift decisions** — ler a seção do Drift Report desta tela e aplicar o verbo de cada linha da coluna Decision (`auto-Edit` → `Edit` no arquivo DS com os detalhes; `create` → criar o arquivo; `exception` / `skip` → nada; `CONFLICT: …; <verbo>` → remover o prefixo informativo e aplicar o verbo). Sem detecção nem julgamento de drift nesta etapa.
2. **Visual shell generation** — invocar `figma:figma-implement-design` (handoff estreito) com:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=39-2
   - Reused DS components: [`components/layout/site-navbar.tsx`, `components/auth/brand-logo.tsx`, `components/icons/streamtube-icon.tsx`, `components/layout/user-menu.tsx`, `components/ui/avatar.tsx`, `components/ui/button.tsx`, `components/icons/plus-icon.tsx`, `components/videos/video-table.tsx`, `components/ui/badge.tsx`, `components/videos/video-visibility-badge.tsx`, `components/videos/video-status-badge.tsx`, `components/ui/pagination.tsx`] _(refletindo as edições de DS da ação 1)_
   - Server-connected component names (sem endpoints/auth/erros): [`UserMenu`, `SairButton`, `VideoTable`]
   - Target paths: `app/(studio)/channel/videos/page.tsx` + `components/videos/video-table.tsx`

**Dependencies:** SI-04.11.0 + SI-04.0.1, SI-04.0.4, SI-04.0.5, SI-04.0.6

**Tests:** _(empty — shell smoke-gated by build AC; Unit tests live in SI-Xb; E2E in /plan-test-specs spec)_

**Acceptance criteria:**

- `app/(studio)/channel/videos/page.tsx` e `components/videos/video-table.tsx` existem, exportam os componentes esperados e compilam com `npx tsc --noEmit` em `next-frontend`.
- A tela renderiza com a fidelidade ao nó Figma dentro da tolerância do conjunto de componentes do DS.
- A tela não importa nada além da lista de Reused DS (fica visualmente escopada).

---

### SI-04.11b — Tela de Painel de gerenciamento de vídeos do canal (lógica & wiring)

**Test Specs:** see `next-frontend/specs/channel-videos.plan.md`
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Painel de gerenciamento de vídeos do canal`

**Technical actions:**

1. **Route guard application** — `**Auth requirement:**` Authenticated: o guard vem do layout `(studio)` do SI-04.10 (redireciona para `/login`); a página não duplica o guard.
2. **Rendering strategy application** — `**Rendering strategy:**` Server Component (RSC): `app/(studio)/channel/videos/page.tsx` sem `"use client"`, com `loading.tsx` (linhas-esqueleto) e `error.tsx` (mensagem + tentar de novo) ao lado; lê `searchParams.page` (per `phase-02-auth-frontend/TD-07`).
3. **Endpoint wiring** — chamar `GET /me/videos` pelo helper `lib/api/server-upstream.ts` (SI-04.10) com `offset` = (`page` − 1) × `limit` e `limit` 10, tipado pelo alias de `lib/api/contracts.ts` (SI-04.8); passar os itens ao `VideoTable` e montar os links do `Pagination` com `?page=` (per `video-channel-management/TD-06`; `### API Contracts` → `GET /me/videos`).
4. **Error mapping** — conforme `**Error Catalog → UX mapping:**`: `UNAUTHORIZED` → `/login`; `CHANNEL_NOT_FOUND` → `error.tsx` genérico; `400` por `page` inválido → normaliza para a página 1; estado vazio ("Nenhum vídeo ainda" com o botão "Criar novo vídeo" para `/upload`).
5. **Helpers e validação de `page`** — criar `next-frontend/lib/pagination.ts` (`parsePage`, `toOffset`) e `next-frontend/lib/format.ts` (`formatCount` em pt-BR e `formatRelativeDate` com a data absoluta para o `title`), usados também pela página pública.

**Dependencies:**

- `SI-04.11a` (visual shell deve existir antes do wiring).
- Backend: `SI-04.4` (`GET /me/videos`).
- `SI-04.8` (aliases de contrato e handlers MSW) e `SI-04.10` (layout autenticado e helper de leitura).

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `lib/pagination.ts` | Unit per testing-guide-next-frontend § "Utilities" — `page` inválido → 1 e `toOffset` | `next-frontend/lib/__tests__/pagination.test.ts` |
| `lib/format.ts` | Unit per testing-guide-next-frontend § "Utilities" — contagem `1.284`, data relativa e absoluta | `next-frontend/lib/__tests__/format.test.ts` |

E2E da página (redirect de guard, paginação, estado vazio, fluxo completo) é escrito externamente por `/plan-test-specs` no spec referenciado em `**Test Specs:**` acima e consumido pelo `/implement`. A página é um Server Component assíncrono, então não tem teste unitário (testing-guide-next-frontend: "Pages → E2E only").

**Acceptance criteria:**

- `/channel/videos` sem sessão redireciona para `/login`.
- `/channel/videos` com sessão mostra os vídeos do canal com thumbnail, título, duração, visibilidade, status, views, likes, comentários e publicação.
- A linha de um rascunho mostra "—" em visibilidade, métricas e publicação.
- `/channel/videos?page=2` mostra o segundo recorte da lista; `page` inválido mostra a página 1.
- Um canal sem vídeos mostra "Nenhum vídeo ainda" e o botão "Criar novo vídeo" que leva a `/upload`.
- O botão "Editar {título}" de uma linha leva a `/videos/{publicId}/edit`.
- Uma falha 5xx do upstream mostra o estado de erro com a ação de tentar de novo.

---

### SI-04.12.0 — Drift audit: Tela de edição de vídeo

**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=41-90
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Tela de edição de vídeo`

**Technical actions:**

1. **Drift audit** — invocar `figma:figma-implement-design` (handoff estreito) com:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=41-90
   - Reused DS components: [`components/auth/back-link.tsx`, `components/icons/chevron-left-icon.tsx`, `components/videos/video-edit-form.tsx`, `components/videos/thumbnail-uploader.tsx`, `components/ui/card.tsx`, `components/ui/button.tsx`, `components/ui/label.tsx`, `components/ui/input.tsx`, `components/ui/textarea.tsx`, `components/ui/select.tsx`, `components/icons/chevron-down-icon.tsx`, `components/ui/radio-group.tsx`]
   - Server-connected component names (sem endpoints/auth/erros): [`VideoEditForm`, `ThumbnailUploader`, `Button "Salvar rascunho"`, `Button "Publicar"`]
   - Target paths (contexto somente leitura; sem escrita aqui): `app/(studio)/videos/[publicId]/edit/page.tsx` + `components/videos/video-edit-form.tsx`

   Para cada componente da lista de Reused DS, comparar valores contra o arquivo em disco e classificar pelo enum de 4 status (`alinhado` / `drift menor` / `drift relevante` / `componente ausente`). Compor a Decision pela política padrão (`.claude/skills/plan-build/references/frontend-drift-report-schema.md` § Default decisions per status). Ler as seções anteriores de `frontend-drift-report.md` para montar `prior_decisions` e preencher a coluna `Prior` com detecção de CONFLICT. Escrever a seção `## Screen: edicao-video — audited at SI-04.12.0 ({YYYY-MM-DD})` em `frontend-drift-report.md` (append na primeira execução, sobrescrita no lugar nas seguintes). **Sem edição de código — verificável por `git diff` ao fim do SI.**

**Dependencies:** SI-04.0.1, SI-04.0.4, SI-04.0.5, SI-04.9

**Tests:** _(empty — audit-only; the report is the deliverable)_

**Acceptance criteria:**

- `frontend-drift-report.md` existe na pasta do plano, com a seção `## Screen: edicao-video` datada da execução atual.
- Todo componente da lista de Reused DS tem exatamente uma linha na tabela.
- Toda linha tem a coluna Decision preenchida conforme o status (`alinhado` → `skip`; `drift menor` → `auto-Edit` ou `exception`; `drift relevante` → `auto-Edit`, `exception` ou `CONFLICT: …; <verbo>`; `componente ausente` → `create`).
- Toda decisão `exception` traz uma justificativa de uma linha.
- `git diff --name-only HEAD -- next-frontend` ao fim do SI é vazio.

---

### SI-04.12a — Tela de edição de vídeo (visual shell)

**Route:** /videos/{publicId}/edit
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=41-90
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Tela de edição de vídeo`
**Drift Report:** see `frontend-drift-report.md` → `## Screen: edicao-video`

**Technical actions:**

1. **Apply drift decisions** — ler a seção do Drift Report desta tela e aplicar o verbo de cada linha da coluna Decision (`auto-Edit` → `Edit` no arquivo DS com os detalhes; `create` → criar o arquivo; `exception` / `skip` → nada; `CONFLICT: …; <verbo>` → remover o prefixo informativo e aplicar o verbo). Sem detecção nem julgamento de drift nesta etapa.
2. **Visual shell generation** — invocar `figma:figma-implement-design` (handoff estreito) com:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=41-90
   - Reused DS components: [`components/auth/back-link.tsx`, `components/icons/chevron-left-icon.tsx`, `components/videos/video-edit-form.tsx`, `components/videos/thumbnail-uploader.tsx`, `components/ui/card.tsx`, `components/ui/button.tsx`, `components/ui/label.tsx`, `components/ui/input.tsx`, `components/ui/textarea.tsx`, `components/ui/select.tsx`, `components/icons/chevron-down-icon.tsx`, `components/ui/radio-group.tsx`] _(refletindo as edições de DS da ação 1)_
   - Server-connected component names (sem endpoints/auth/erros): [`VideoEditForm`, `ThumbnailUploader`, `Button "Salvar rascunho"`, `Button "Publicar"`]
   - Target paths: `app/(studio)/videos/[publicId]/edit/page.tsx` + `components/videos/video-edit-form.tsx`

**Dependencies:** SI-04.12.0 + SI-04.0.1, SI-04.0.4, SI-04.0.5, SI-04.9

**Tests:** _(empty — shell smoke-gated by build AC; Unit tests live in SI-Xb; E2E in /plan-test-specs spec)_

**Acceptance criteria:**

- `app/(studio)/videos/[publicId]/edit/page.tsx` e `components/videos/video-edit-form.tsx` existem, exportam os componentes esperados e compilam com `npx tsc --noEmit` em `next-frontend`.
- A tela renderiza com a fidelidade ao nó Figma dentro da tolerância do conjunto de componentes do DS.
- A tela não importa nada além da lista de Reused DS (fica visualmente escopada).

---

### SI-04.12b — Tela de edição de vídeo (lógica & wiring)

**Test Specs:** see `next-frontend/specs/video-edit.plan.md`
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Tela de edição de vídeo`

**Technical actions:**

1. **Route guard application** — `**Auth requirement:**` Authenticated+Owner: o login vem do layout `(studio)` (SI-04.10); a página carrega o vídeo por `GET /videos/{publicId}` no helper `lib/api/server-upstream.ts`, e `403` ou `404` do upstream viram `notFound()` sem revelar o vídeo de outro canal (per `video-channel-management/TD-09`).
2. **Rendering strategy application** — `**Rendering strategy:**` RSC + Client Component: `app/(studio)/videos/[publicId]/edit/page.tsx` é Server Component com `loading.tsx` e `not-found.tsx`; `VideoEditForm` leva `"use client"` e é dono do input e da mutação (per `phase-02-auth-frontend/TD-04`, `TD-05`, `TD-07`).
3. **Endpoint wiring (BFF)** — adicionar `PATCH` a `next-frontend/app/api/videos/[publicId]/route.ts`: reconstrói o `FormData` sem definir `Content-Type` à mão, injeta o Bearer da sessão, usa `withRefresh` e repassa status e corpo do upstream sem reformatar (per `### API Contracts` → BFF tier → `PATCH /api/videos/{publicId}`, `phase-02-auth-frontend/TD-03`).
4. **Form wiring e validação espelhada** — em `VideoEditForm`, react-hook-form + Zod (`next-frontend/lib/videos/edit-schema.ts` espelha `#### Validation Rules — Fase 04 (backend)`): monta o `FormData`; "Salvar rascunho" e "Salvar alterações" não enviam `published`, "Publicar" envia `published=true` e "Despublicar" `published=false`; "Publicar" fica desabilitado com `status` diferente de `ready`; "Alterar thumbnail" só mostra preview local, e o arquivo vai junto do submit (per `video-channel-management/TD-02`, `TD-03`, `TD-04`, `TD-10`).
5. **Error mapping** — conforme `**Error Catalog → UX mapping:**`: `400` inline no campo (MIME inválido sob o uploader), `413` sob o uploader, `VIDEO_NOT_PUBLISHABLE` como alerta ao lado de "Publicar", `FORBIDDEN` e `VIDEO_NOT_FOUND` → `not-found`, `UNAUTHORIZED` → `/login`; sucesso mostra mensagem inline (`role="status"`) e chama `router.refresh()`.

**Dependencies:**

- `SI-04.12a` (visual shell deve existir antes do wiring).
- Backend: `SI-04.2` (`GET /videos/{publicId}`) e `SI-04.3` (`PATCH /videos/{publicId}`).
- `SI-04.8` (aliases de contrato e handlers MSW) e `SI-04.10` (layout autenticado e helper de leitura).

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `components/videos/video-edit-form.tsx` | Unit per testing-guide-next-frontend § "Client Components" — submit de rascunho, publicar e despublicar, mapeamento de erros por linha, validação pré-submit, "Publicar" bloqueado com `status ≠ ready` | `next-frontend/components/videos/__tests__/video-edit-form.wiring.test.tsx` |
| `lib/videos/edit-schema.ts` | Unit per testing-guide-next-frontend § "Utilities" — título, categoria do TD-10, MIME e tamanho da thumbnail | `next-frontend/lib/videos/__tests__/edit-schema.test.ts` |
| `app/api/videos/[publicId]/route.ts` (`PATCH`) | Integration per testing-guide-next-frontend § "Route Handlers" — multipart encaminhado, erros repassados, refresh em `401` (MSW) | `next-frontend/app/api/videos/[publicId]/__tests__/route.integration.test.ts` |

E2E da página (guard, edição completa, publicação, thumbnail) é escrito externamente por `/plan-test-specs` no spec referenciado em `**Test Specs:**` acima e consumido pelo `/implement`. A página é um Server Component assíncrono, então não tem teste unitário (testing-guide-next-frontend: "Pages → E2E only").

**Acceptance criteria:**

- `/videos/{publicId}/edit` do dono mostra título, descrição, categoria, visibilidade e a thumbnail atual do vídeo.
- "Salvar rascunho" persiste as edições e mantém o vídeo como rascunho.
- "Publicar" num vídeo com `status = ready` publica o vídeo e passa a mostrar "Salvar alterações" e "Despublicar".
- "Publicar" fica desabilitado quando o `status` do vídeo não é `ready`.
- "Alterar thumbnail" mostra o preview do arquivo escolhido e só grava a imagem quando o formulário é enviado.
- Uma thumbnail de tipo inválido ou acima do limite mostra o erro sob o uploader e não altera o vídeo.
- `/videos/{publicId}/edit` de um vídeo de outro canal ou inexistente mostra a página de não encontrado.
- "Cancelar" e "Voltar para o painel" levam a `/channel/videos`.
- `PATCH /api/videos/{publicId}` encaminha o multipart ao upstream e devolve status e corpo sem reformatar.

---

### SI-04.13.0 — Drift audit: Tela de edição do canal

**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=41-141
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Tela de edição do canal`

**Technical actions:**

1. **Drift audit** — invocar `figma:figma-implement-design` (handoff estreito) com:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=41-141
   - Reused DS components: [`components/channels/channel-edit-form.tsx`, `components/ui/card.tsx`, `components/ui/label.tsx`, `components/ui/input.tsx`, `components/ui/textarea.tsx`, `components/ui/button.tsx`]
   - Server-connected component names (sem endpoints/auth/erros): [`ChannelEditForm`, `SaveButton`]
   - Target paths (contexto somente leitura; sem escrita aqui): `app/(studio)/channel/settings/page.tsx` + `components/channels/channel-edit-form.tsx`

   Para cada componente da lista de Reused DS, comparar valores contra o arquivo em disco e classificar pelo enum de 4 status (`alinhado` / `drift menor` / `drift relevante` / `componente ausente`). Compor a Decision pela política padrão (`.claude/skills/plan-build/references/frontend-drift-report-schema.md` § Default decisions per status). Ler as seções anteriores de `frontend-drift-report.md` para montar `prior_decisions` e preencher a coluna `Prior` com detecção de CONFLICT. Escrever a seção `## Screen: edicao-canal — audited at SI-04.13.0 ({YYYY-MM-DD})` em `frontend-drift-report.md` (append na primeira execução, sobrescrita no lugar nas seguintes). **Sem edição de código — verificável por `git diff` ao fim do SI.**

**Dependencies:** SI-04.0.1, SI-04.0.4

**Tests:** _(empty — audit-only; the report is the deliverable)_

**Acceptance criteria:**

- `frontend-drift-report.md` existe na pasta do plano, com a seção `## Screen: edicao-canal` datada da execução atual.
- Todo componente da lista de Reused DS tem exatamente uma linha na tabela.
- Toda linha tem a coluna Decision preenchida conforme o status (`alinhado` → `skip`; `drift menor` → `auto-Edit` ou `exception`; `drift relevante` → `auto-Edit`, `exception` ou `CONFLICT: …; <verbo>`; `componente ausente` → `create`).
- Toda decisão `exception` traz uma justificativa de uma linha.
- `git diff --name-only HEAD -- next-frontend` ao fim do SI é vazio.

---

### SI-04.13a — Tela de edição do canal (visual shell)

**Route:** /channel/settings
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=41-141
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Tela de edição do canal`
**Drift Report:** see `frontend-drift-report.md` → `## Screen: edicao-canal`

**Technical actions:**

1. **Apply drift decisions** — ler a seção do Drift Report desta tela e aplicar o verbo de cada linha da coluna Decision (`auto-Edit` → `Edit` no arquivo DS com os detalhes; `create` → criar o arquivo; `exception` / `skip` → nada; `CONFLICT: …; <verbo>` → remover o prefixo informativo e aplicar o verbo). Sem detecção nem julgamento de drift nesta etapa.
2. **Visual shell generation** — invocar `figma:figma-implement-design` (handoff estreito) com:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=41-141
   - Reused DS components: [`components/channels/channel-edit-form.tsx`, `components/ui/card.tsx`, `components/ui/label.tsx`, `components/ui/input.tsx`, `components/ui/textarea.tsx`, `components/ui/button.tsx`] _(refletindo as edições de DS da ação 1)_
   - Server-connected component names (sem endpoints/auth/erros): [`ChannelEditForm`, `SaveButton`]
   - Target paths: `app/(studio)/channel/settings/page.tsx` + `components/channels/channel-edit-form.tsx`

**Dependencies:** SI-04.13.0 + SI-04.0.1, SI-04.0.4

**Tests:** _(empty — shell smoke-gated by build AC; Unit tests live in SI-Xb; E2E in /plan-test-specs spec)_

**Acceptance criteria:**

- `app/(studio)/channel/settings/page.tsx` e `components/channels/channel-edit-form.tsx` existem, exportam os componentes esperados e compilam com `npx tsc --noEmit` em `next-frontend`.
- A tela renderiza com a fidelidade ao nó Figma dentro da tolerância do conjunto de componentes do DS.
- A tela não importa nada além da lista de Reused DS (fica visualmente escopada).

---

### SI-04.13b — Tela de edição do canal (lógica & wiring)

**Test Specs:** see `next-frontend/specs/channel-settings.plan.md`
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Tela de edição do canal`

**Technical actions:**

1. **Route guard application** — `**Auth requirement:**` Authenticated: o guard vem do layout `(studio)` (SI-04.10); a página carrega os dados atuais por `GET /me/channel` no helper `lib/api/server-upstream.ts`.
2. **Rendering strategy application** — `**Rendering strategy:**` RSC + Client Component: `app/(studio)/channel/settings/page.tsx` é Server Component com `loading.tsx` e `not-found.tsx`; `ChannelEditForm` leva `"use client"` e é dono do input e da mutação (per `phase-02-auth-frontend/TD-04`, `TD-05`, `TD-07`).
3. **Endpoint wiring (BFF)** — criar `next-frontend/app/api/me/channel/route.ts` com `PATCH`: injeta o Bearer da sessão, usa `withRefresh` e repassa status e corpo do upstream sem reformatar (per `### API Contracts` → BFF tier → `PATCH /api/me/channel`, `phase-02-auth-frontend/TD-03`).
4. **Form wiring e validação espelhada** — em `ChannelEditForm`, react-hook-form + Zod (`next-frontend/lib/channels/edit-schema.ts` espelha `#### Validation Rules — Fase 04 (backend)`: `nickname` `^[a-z0-9_]+$` de 1 a 50, `name` de 1 a 50, `description` opcional); prefixo "@" como adorno local `aria-hidden`; texto de apoio avisando que trocar o nickname muda a URL pública `/@{nickname}`; "Cancelar" leva a `/channel/videos` (per `video-channel-management/TD-07`, `TD-08`, `TD-09`, `phase-02-auth/TD-10`).
5. **Error mapping** — conforme `**Error Catalog → UX mapping:**`: `NICKNAME_ALREADY_EXISTS` inline sob o campo nickname, `400` inline no campo ofensor, `CHANNEL_NOT_FOUND` → `not-found`, `UNAUTHORIZED` → `/login`; sucesso mostra "Alterações salvas" (`role="status"`) e chama `router.refresh()` para o layout recarregar o canal.

**Dependencies:**

- `SI-04.13a` (visual shell deve existir antes do wiring).
- Backend: `SI-04.5` (`GET` e `PATCH /me/channel`).
- `SI-04.8` (aliases de contrato e handlers MSW) e `SI-04.10` (layout autenticado e helper de leitura).

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `components/channels/channel-edit-form.tsx` | Unit per testing-guide-next-frontend § "Client Components" — submit feliz, erro `409` inline no nickname, validação pré-submit da allowlist | `next-frontend/components/channels/__tests__/channel-edit-form.wiring.test.tsx` |
| `lib/channels/edit-schema.ts` | Unit per testing-guide-next-frontend § "Utilities" — allowlist do nickname, limites de tamanho | `next-frontend/lib/channels/__tests__/edit-schema.test.ts` |
| `app/api/me/channel/route.ts` (`PATCH`) | Integration per testing-guide-next-frontend § "Route Handlers" — pass-through de status e corpo, refresh em `401` (MSW) | `next-frontend/app/api/me/channel/__tests__/route.integration.test.ts` |

E2E da página (guard, edição do canal, conflito de nickname, "Cancelar") é escrito externamente por `/plan-test-specs` no spec referenciado em `**Test Specs:**` acima e consumido pelo `/implement`. A página é um Server Component assíncrono, então não tem teste unitário (testing-guide-next-frontend: "Pages → E2E only").

**Acceptance criteria:**

- `/channel/settings` mostra o nickname, o nome e a descrição atuais do canal nos campos do formulário.
- Salvar com dados válidos atualiza o canal e mostra "Alterações salvas".
- Salvar um nickname que já pertence a outro canal mostra o erro inline sob o campo nickname e não altera o canal.
- Um nickname com caractere fora de `[a-z0-9_]` (por exemplo "joana.cria") é bloqueado antes do envio, com erro no campo.
- O campo nickname avisa que trocar o valor muda a URL pública do canal.
- "Cancelar" leva a `/channel/videos`.
- `PATCH /api/me/channel` encaminha o corpo ao upstream e devolve status e corpo sem reformatar.

---

### SI-04.14.0 — Drift audit: Página pública do canal

**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=59-2
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Página pública do canal`

**Technical actions:**

1. **Drift audit** — invocar `figma:figma-implement-design` (handoff estreito) com:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=59-2
   - Reused DS components: [`components/layout/site-navbar.tsx`, `components/auth/brand-logo.tsx`, `components/icons/streamtube-icon.tsx`, `components/ui/button.tsx`, `components/channels/channel-header.tsx`, `components/ui/avatar.tsx`, `components/videos/video-card.tsx`, `components/ui/pagination.tsx`]
   - Server-connected component names (sem endpoints/auth/erros): [`ChannelHeader`, `VideoCard`]
   - Target paths (contexto somente leitura; sem escrita aqui): `app/channels/[nickname]/page.tsx` + `components/channels/channel-header.tsx` + `components/videos/video-card.tsx`

   Para cada componente da lista de Reused DS, comparar valores contra o arquivo em disco e classificar pelo enum de 4 status (`alinhado` / `drift menor` / `drift relevante` / `componente ausente`). Compor a Decision pela política padrão (`.claude/skills/plan-build/references/frontend-drift-report-schema.md` § Default decisions per status). Ler as seções anteriores de `frontend-drift-report.md` para montar `prior_decisions` e preencher a coluna `Prior` com detecção de CONFLICT. Escrever a seção `## Screen: pagina-publica-canal — audited at SI-04.14.0 ({YYYY-MM-DD})` em `frontend-drift-report.md` (append na primeira execução, sobrescrita no lugar nas seguintes). **Sem edição de código — verificável por `git diff` ao fim do SI.**

**Dependencies:** SI-04.0.1, SI-04.0.4, SI-04.0.5

**Tests:** _(empty — audit-only; the report is the deliverable)_

**Acceptance criteria:**

- `frontend-drift-report.md` existe na pasta do plano, com a seção `## Screen: pagina-publica-canal` datada da execução atual.
- Todo componente da lista de Reused DS tem exatamente uma linha na tabela.
- Toda linha tem a coluna Decision preenchida conforme o status (`alinhado` → `skip`; `drift menor` → `auto-Edit` ou `exception`; `drift relevante` → `auto-Edit`, `exception` ou `CONFLICT: …; <verbo>`; `componente ausente` → `create`).
- Toda decisão `exception` traz uma justificativa de uma linha.
- `git diff --name-only HEAD -- next-frontend` ao fim do SI é vazio.

---

### SI-04.14a — Tela de Página pública do canal (visual shell)

**Route:** /@{nickname}
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=59-2
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Página pública do canal`
**Drift Report:** see `frontend-drift-report.md` → `## Screen: pagina-publica-canal`

**Technical actions:**

1. **Apply drift decisions** — ler a seção do Drift Report desta tela e aplicar o verbo de cada linha da coluna Decision (`auto-Edit` → `Edit` no arquivo DS com os detalhes; `create` → criar o arquivo; `exception` / `skip` → nada; `CONFLICT: …; <verbo>` → remover o prefixo informativo e aplicar o verbo). Sem detecção nem julgamento de drift nesta etapa.
2. **Visual shell generation** — invocar `figma:figma-implement-design` (handoff estreito) com:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=59-2
   - Reused DS components: [`components/layout/site-navbar.tsx`, `components/auth/brand-logo.tsx`, `components/icons/streamtube-icon.tsx`, `components/ui/button.tsx`, `components/channels/channel-header.tsx`, `components/ui/avatar.tsx`, `components/videos/video-card.tsx`, `components/ui/pagination.tsx`] _(refletindo as edições de DS da ação 1)_
   - Server-connected component names (sem endpoints/auth/erros): [`ChannelHeader`, `VideoCard`]
   - Target paths: `app/channels/[nickname]/page.tsx` + `components/channels/channel-header.tsx` + `components/videos/video-card.tsx`

**Dependencies:** SI-04.14.0 + SI-04.0.1, SI-04.0.4, SI-04.0.5

**Tests:** _(empty — shell smoke-gated by build AC; Unit tests live in SI-Xb; E2E in /plan-test-specs spec)_

**Acceptance criteria:**

- `app/channels/[nickname]/page.tsx`, `components/channels/channel-header.tsx` e `components/videos/video-card.tsx` existem, exportam os componentes esperados e compilam com `npx tsc --noEmit` em `next-frontend`.
- A tela renderiza com a fidelidade ao nó Figma dentro da tolerância do conjunto de componentes do DS.
- A tela não importa nada além da lista de Reused DS (fica visualmente escopada).

---

### SI-04.14b — Tela de Página pública do canal (lógica & wiring)

**Test Specs:** see `next-frontend/specs/channel-public.plan.md`
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Página pública do canal`

**Technical actions:**

1. **Route guard application e roteamento** — `**Auth requirement:**` Anonymous: a rota não tem guard. Mapear `/@{nickname}` para `app/channels/[nickname]/page.tsx` por `rewrites` em `next-frontend/next.config.ts` (`/@:nickname`); pasta iniciada por `@` é slot de rota paralela no App Router, então confirmar a sintaxe nos docs do Next instalado em `node_modules/next/dist/docs/` antes de escrever (per `video-channel-management/TD-08`).
2. **Rendering strategy application** — `**Rendering strategy:**` Server Component (RSC) sem estado de cliente: `app/channels/[nickname]/page.tsx` com `loading.tsx`, `error.tsx` e `not-found.tsx` ao lado (per `phase-02-auth-frontend/TD-06`).
3. **Endpoint wiring** — chamar `GET /channels/{nickname}` e `GET /channels/{nickname}/videos` por `upstream` sem Bearer, com `limit` 8 e `offset` de `lib/pagination.ts` (SI-04.11b); compor `ChannelHeader`, a grade CSS de 4 colunas × 2 linhas de `VideoCard` e o `Pagination` com `?page=`, tipado pelos aliases de `lib/api/contracts.ts` (per `video-channel-management/TD-06`; `### API Contracts` → `GET /channels/{nickname}` e `GET /channels/{nickname}/videos`).
4. **Error mapping** — conforme `**Error Catalog → UX mapping:**`: `CHANNEL_NOT_FOUND` → `notFound()` ("Canal não encontrado"); `page` inválido → normaliza para a página 1; canal sem vídeos publicados → "Este canal ainda não tem vídeos publicados".
5. **Helper de contagem** — acrescentar `formatVideosCount` a `next-frontend/lib/format.ts` (singular "1 vídeo" e plural "N vídeos") e usar `formatRelativeDate` para o "há X" do meta dos cards.

**Dependencies:**

- `SI-04.14a` (visual shell deve existir antes do wiring).
- Backend: `SI-04.6` (`GET /channels/{nickname}` e `GET /channels/{nickname}/videos`).
- `SI-04.8` (aliases de contrato e handlers MSW) e `SI-04.11b` (`lib/pagination.ts` e `lib/format.ts`).

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `lib/format.ts` (`formatVideosCount`) | Unit per testing-guide-next-frontend § "Utilities" — singular, plural e zero | `next-frontend/lib/__tests__/format.test.ts` |

E2E da página (canal existente, canal inexistente, canal sem vídeos, paginação, `/@{nickname}`) é escrito externamente por `/plan-test-specs` no spec referenciado em `**Test Specs:**` acima e consumido pelo `/implement`. A página é um Server Component assíncrono, então não tem teste unitário (testing-guide-next-frontend: "Pages → E2E only").

**Acceptance criteria:**

- `/@{nickname}` de um canal existente, sem sessão, mostra o nome, `@{nickname} · N vídeos`, a descrição quando existir e os vídeos publicados e públicos em grade de 4 colunas.
- A página mostra no máximo 8 vídeos por vez, e `/@{nickname}?page=2` mostra o recorte seguinte.
- `N vídeos` conta só vídeos publicados e públicos; rascunhos e vídeos "Indisponível" não aparecem.
- `/@{nickname}` de um nickname inexistente mostra a página "Canal não encontrado".
- Um canal sem vídeos publicados mostra "Este canal ainda não tem vídeos publicados".
- O botão "Entrar" da navbar leva a `/login`.

---

## Technical Specifications

### Data Model

#### Video (modificada — tabela `videos`)

Colunas novas. As colunas existentes (`id`, `public_id`, `channel_id`, `title`, `description`, `status`, `upload_id`, `storage_bucket`, `storage_key`, `thumbnail_key`, `duration_seconds`, `mime_type`, `file_size_bytes`, `processing_error`, `created_at`, `updated_at`) não mudam.

| Field | Type | Constraints |
|-------|------|-------------|
| category | enum `VideoCategory` (enum Postgres) | not null, default `'Outros'` _(per video-channel-management/TD-01, TD-10)_ |
| visibility | enum `VideoVisibility` (`public`, `unlisted`) | not null, default `'public'` _(per video-channel-management/TD-02)_ |
| published_at | timestamptz | nullable; nulo = rascunho; escrito só pela API _(per video-channel-management/TD-02)_ |
| custom_thumbnail_key | varchar | nullable; chave da thumbnail customizada no storage _(per video-channel-management/TD-04)_ |
| views_count | int | not null, default 0 _(per video-channel-management/TD-05)_ |
| likes_count | int | not null, default 0 _(per video-channel-management/TD-05)_ |
| comments_count | int | not null, default 0 _(per video-channel-management/TD-05)_ |

**Valores de `VideoCategory` (byte-verbatim de video-channel-management/TD-10):** `Música`, `Jogos`, `Educação`, `Entretenimento`, `Notícias`, `Esportes`, `Tecnologia`, `Outros`. Os valores do enum são esses rótulos em pt-BR, com acento, sem mapa de rótulos separado, para que o `Select` do frontend use o tipo gerado direto de `openapi.json` (TD-01). Trocar por slugs ASCII exigiria uma Revision no TD-10.

**Ownership de escrita (TD-02):** `status` continua escrito apenas pelo Video Worker; `category`, `visibility`, `published_at` e `custom_thumbnail_key` são escritos apenas pela API em nome do dono do canal. `published_at` nunca vem do cliente.

**Precedência de thumbnail (TD-04):** a API expõe uma única URL já resolvida — `custom_thumbnail_key` quando não nulo, senão `thumbnail_key` (gerada pelo worker). O frontend nunca implementa a precedência.

**Contadores (TD-05):** denormalizados na própria linha, sem incremento nesta fase (permanecem 0 até as Fases 05/06). O TD fixa só o desenho de colunas desnormalizadas; os nomes `views_count`, `likes_count` e `comments_count` são escolha deste plano.

**Relations:** inalteradas (`Channel` has many `Video`).
**Indexes:** existentes (`public_id` unique, `channel_id`, `status`); novo índice composto em (`channel_id`, `published_at`) para a listagem pública (`visibility = 'public'` e `published_at IS NOT NULL`, ordenada por `published_at` decrescente) _(escolha do plano, não exigida por TD)_.
**Migration:** linhas existentes recebem `published_at` NULL (todo vídeo anterior à Fase 04 vira rascunho), `visibility` `'public'`, `category` `'Outros'` e contadores 0. A migration cria os enums antes das colunas; o `down` remove as colunas e depois os enums.

#### Channel (sem alteração de schema)

`nickname` já é `varchar(50)` com `unique`, e `name` é `varchar(50)`; `description` é `text` nullable. A edição de nickname é livre com unicidade (video-channel-management/TD-07): a violação da constraint única existente é mapeada para o erro de domínio `NICKNAME_ALREADY_EXISTS`. Não há coluna `nickname_changed_at` (o TD-07 a reserva só se o produto sinalizar preocupação com squatting).

### API Contracts

Convenções herdadas: formato de erro `{ statusCode, error, message }` com códigos de domínio em `error` (phase-02-auth/TD-07); respostas em camelCase como as já publicadas (`publicId`, `durationSeconds`); auth por `Authorization: Bearer <access_token>` no upstream. Rotas `me` resolvem para o canal do usuário autenticado e não aceitam outro canal. Todas as listagens usam offset/limit com total (video-channel-management/TD-06).

#### GET /videos/{publicId} (SI-04.2)

Resposta estendida do endpoint da Fase 03 (somente acréscimos; o consumidor de polling de status não quebra). Só o dono do canal acessa.

**Path parameters:**
- publicId: string, required — `public_id` do vídeo

**Request headers:**
- Authorization: Bearer access token, required

**Response 200:**
- publicId: string
- title: string
- description: string | null
- status: `draft` | `processing` | `ready` | `failed`
- durationSeconds: number | null
- createdAt: string (date-time)
- category: `VideoCategory` — novo
- visibility: `public` | `unlisted` — novo
- publishedAt: string (date-time) | null — novo; nulo = rascunho
- thumbnailUrl: string | null — novo; URL única já resolvida (video-channel-management/TD-04); nulo enquanto o worker não gerou nenhuma

**Error responses:**
- 401 UNAUTHORIZED: access token ausente ou inválido
- 403 FORBIDDEN: o usuário autenticado não é dono do vídeo
- 404 VIDEO_NOT_FOUND: `publicId` inexistente

---

#### PATCH /videos/{publicId} (SI-04.3)

Edita informações do vídeo, troca a thumbnail e controla a publicação numa única chamada (video-channel-management/TD-03, revisão de 2026-09-20: a thumbnail vai no mesmo multipart do formulário). Só o dono acessa.

**Path parameters:**
- publicId: string, required

**Request headers:**
- Authorization: Bearer access token, required
- Content-Type: multipart/form-data

**Request body:** (partes do formulário; todas opcionais — o corpo precisa ter ao menos uma)
- title: string — 1 a 200 caracteres, sem ser só espaços
- description: string — texto livre; string vazia grava `null`
- category: `VideoCategory` — um dos valores do TD-10
- visibility: `public` | `unlisted`
- published: boolean (texto `true`/`false`) — `true` publica (define `published_at` com o instante atual se ainda nulo; se já publicado, mantém o `published_at` original); `false` despublica (`published_at` = `null`)
- thumbnail: arquivo — `image/jpeg`, `image/png` ou `image/webp`, até 2 MiB; substitui a thumbnail customizada (`custom_thumbnail_key`) e nunca toca em `thumbnail_key`

**Response 200:**
- mesma forma de `GET /videos/{publicId}` (vídeo atualizado)

**Error responses:**
- 400 validation error: campo de texto inválido, corpo sem nenhuma parte, ou MIME da thumbnail fora da lista permitida
- 401 UNAUTHORIZED: access token ausente ou inválido
- 403 FORBIDDEN: o usuário autenticado não é dono do vídeo
- 404 VIDEO_NOT_FOUND: `publicId` inexistente
- 409 VIDEO_NOT_PUBLISHABLE: `published=true` com `status` diferente de `ready` (video-channel-management/TD-02, Clarification de AMB-1)
- 413 payload too large: thumbnail acima do limite de tamanho

---

#### GET /me/videos (SI-04.4)

Alimenta o painel de gerenciamento. Lista todos os vídeos do canal do usuário, rascunhos incluídos.

**Request headers:**
- Authorization: Bearer access token, required

**Request query parameters:**
- offset: integer, optional, default 0 — mínimo 0
- limit: integer, optional, default 10 — de 1 a 50 _(default do plano; o TD-06 não fixa o tamanho de página do painel)_

**Response 200:**
- items: array, ordenado por `created_at` decrescente, com objetos:
  - publicId: string
  - title: string
  - durationSeconds: number | null
  - thumbnailUrl: string | null — URL única já resolvida (TD-04)
  - status: `draft` | `processing` | `ready` | `failed`
  - visibility: `public` | `unlisted`
  - publishedAt: string (date-time) | null
  - viewsCount: number
  - likesCount: number
  - commentsCount: number
- total: number — total de vídeos do canal
- offset: number
- limit: number

**Error responses:**
- 400 validation error: `offset` ou `limit` fora da faixa
- 401 UNAUTHORIZED: access token ausente ou inválido
- 404 CHANNEL_NOT_FOUND: o usuário não tem canal

---

#### GET /me/channel (SI-04.5)

**Request headers:**
- Authorization: Bearer access token, required

**Response 200:**
- name: string
- nickname: string
- description: string | null

**Error responses:**
- 401 UNAUTHORIZED: access token ausente ou inválido
- 404 CHANNEL_NOT_FOUND: o usuário não tem canal

---

#### PATCH /me/channel (SI-04.5)

Edita nickname, nome e descrição do canal (video-channel-management/TD-07: alteração livre com unicidade).

**Request headers:**
- Authorization: Bearer access token, required
- Content-Type: application/json

**Request body:** (todos opcionais — o corpo precisa ter ao menos um)
- nickname: string — `[a-z0-9_]`, 1 a 50 caracteres (phase-02-auth/TD-10)
- name: string — 1 a 50 caracteres
- description: string | null — texto livre; string vazia grava `null`

**Response 200:**
- mesma forma de `GET /me/channel`

**Error responses:**
- 400 validation error: nickname fora da allowlist ou de tamanho, nome vazio ou longo demais, ou corpo vazio
- 401 UNAUTHORIZED: access token ausente ou inválido
- 404 CHANNEL_NOT_FOUND: o usuário não tem canal
- 409 NICKNAME_ALREADY_EXISTS: o nickname já pertence a outro canal

---

#### GET /channels/{nickname} (SI-04.6)

Página pública do canal (video-channel-management/TD-08: `/@{nickname}`; o frontend remove o `@` da URL antes de chamar).

**Path parameters:**
- nickname: string, required

**Response 200:**
- name: string
- nickname: string
- description: string | null
- videosCount: number — só vídeos publicados e públicos (`published_at` não nulo e `visibility = public`)

**Error responses:**
- 404 CHANNEL_NOT_FOUND: nickname inexistente

---

#### GET /channels/{nickname}/videos (SI-04.6)

**Path parameters:**
- nickname: string, required

**Request query parameters:**
- offset: integer, optional, default 0 — mínimo 0
- limit: integer, optional, default 8 — de 1 a 50 (grade 4×2 da página pública, video-channel-management/TD-06, revisão de 2026-09-20)

**Response 200:**
- items: array, ordenado por `published_at` decrescente, só vídeos publicados e públicos, com objetos:
  - publicId: string
  - title: string
  - durationSeconds: number | null
  - thumbnailUrl: string | null
  - viewsCount: number
  - publishedAt: string (date-time)
- total: number — mesmo critério de `videosCount`
- offset: number
- limit: number

**Error responses:**
- 400 validation error: `offset` ou `limit` fora da faixa
- 404 CHANNEL_NOT_FOUND: nickname inexistente

---

#### GET /videos/{publicId}/stream e GET /videos/{publicId}/download — mudança de comportamento (SI-04.7)

As duas rotas seguem `@Public()` e a resposta 302 não muda. A regra do TD-08 da Fase 03 ("a checagem acontece na hora de assinar a URL") passa a valer com os estados desta fase (video-channel-management/TD-02, revisão de 2026-09-20): rascunho (`published_at` nulo) só é assinado para o dono do canal; vídeo publicado, `public` ou `unlisted`, é assinado para qualquer chamador que tenha o `publicId`.

**Request headers:**
- Authorization: Bearer access token, optional — quando presente e válido identifica o dono; token inválido é ignorado (a rota continua anônima), nunca 401

**Response 302:**
- Location: URL pré-assinada do storage (inalterada)

**Error responses:**
- 404 VIDEO_NOT_FOUND: `publicId` inexistente, ou vídeo em rascunho e chamador que não é o dono (a existência do rascunho não é revelada); avaliado antes do 409
- 409 VIDEO_NOT_READY: `status` diferente de `ready` (comportamento existente)

---

#### Validation Rules — Fase 04 (backend)

- `title`: 1 a 200 caracteres, sem ser só espaços (coluna `varchar(200)`)
- `description`: opcional; string vazia grava `null`
- `category`: um dos valores de `VideoCategory` (TD-10), verbatim
- `visibility`: `public` ou `unlisted`
- `published`: boolean; `true` só com `status = ready`
- `thumbnail`: MIME `image/jpeg`, `image/png` ou `image/webp`; no máximo 2 MiB _(limites do plano, ajustáveis; o TD-03 só exige validação no servidor antes de persistir)_
- `nickname`: `^[a-z0-9_]+$`, 1 a 50 caracteres; único entre canais
- `name`: 1 a 50 caracteres
- `offset`: inteiro ≥ 0; `limit`: inteiro de 1 a 50

---

> _BFF tier — contrato exposto ao frontend. O browser chama a rota FE-facing; a rota faz proxy do upstream conforme o BFF estrito documentado em `next-frontend/CLAUDE.md`. Só aparecem rotas chamadas pelo browser (mutações de Client Components). As leituras da fase (painel, detalhe do vídeo, canal do dono, canal público, vídeos públicos) são feitas por Server Components direto no upstream via `upstream` tipado por `paths`, sem rota `/api/**`. As operações upstream abaixo são definidas pelo tier backend deste plano e entram em `next-frontend/openapi.json` pela SI-04.8 (sincronia de contrato, `next-frontend-openapi-typing/TD-02` e `TD-03`); até lá os `forwards-to` são os do tier backend, verbatim._

#### PATCH /api/videos/{publicId} (SI-04.12b)

**forwards-to:** `PATCH /videos/{publicId}` *(derived: project contract source)*

**Request headers:**
- Content-Type: multipart/form-data *(derived: project contract source)*
- Authorization: Bearer injetado no servidor a partir do cookie de sessão; o browser nunca vê o token *(per phase-02-auth-frontend/TD-02)*

**Request body:** `UpdateVideoDto` mais a parte de arquivo `thumbnail` *(derived: project contract source — campos conforme a fonte; não re-spelled aqui para evitar duplicação)*

**Response 200 (FE-facing):** vídeo atualizado — pass-through *(derived: project contract source; reshape: none)*

**Error responses (FE-facing):**
- 400 validation error: pass-through *(derived: project contract source)*
- 401 UNAUTHORIZED: refresh transparente do token e uma nova tentativa antes de devolver o 401 *(per phase-02-auth-frontend/TD-03)*
- 403 FORBIDDEN: pass-through *(derived: project contract source)*
- 404 VIDEO_NOT_FOUND: pass-through *(derived: project contract source)*
- 409 VIDEO_NOT_PUBLISHABLE: pass-through *(derived: project contract source)*
- 413 payload too large: pass-through *(derived: project contract source)*

---

#### PATCH /api/me/channel (SI-04.13b)

**forwards-to:** `PATCH /me/channel` *(derived: project contract source)*

**Request headers:**
- Content-Type: application/json *(derived: project contract source)*
- Authorization: Bearer injetado no servidor a partir do cookie de sessão *(per phase-02-auth-frontend/TD-02)*

**Request body:** `UpdateChannelDto` *(derived: project contract source — campos conforme a fonte; não re-spelled aqui para evitar duplicação)*

**Response 200 (FE-facing):** canal atualizado — pass-through *(derived: project contract source; reshape: none)*

**Error responses (FE-facing):**
- 400 validation error: pass-through *(derived: project contract source)*
- 401 UNAUTHORIZED: refresh transparente do token e uma nova tentativa antes de devolver o 401 *(per phase-02-auth-frontend/TD-03)*
- 404 CHANNEL_NOT_FOUND: pass-through *(derived: project contract source)*
- 409 NICKNAME_ALREADY_EXISTS: pass-through *(derived: project contract source)*

---

#### GET /api/auth/refresh (SI-04.10)

Rota nova. Leituras em Server Component não podem gravar o cookie de sessão (só Route Handlers e Server Actions podem), e o `withRefresh` existente só cobre Route Handlers. Um `401` do upstream numa página redireciona para esta rota, que renova os tokens e devolve o usuário à página (refresh no servidor, single-flight — phase-02-auth-frontend/TD-03).

**forwards-to:** `POST /auth/refresh` *(derived: project contract source)*

**Request query parameters:**
- returnTo: string, required — caminho interno da aplicação (começa com uma única `/`, sem esquema nem host); qualquer outro valor cai em `/channel/videos` _(undetermined — a proteção contra open redirect é decisão deste plano; nenhum TD a define)_

**Response 302 (FE-facing):** redireciona para `returnTo` depois de renovar os tokens; redireciona para `/login` quando o refresh falha _(undetermined — os destinos do redirect são decisão deste plano; o TD-03 define só o refresh single-flight)_

**Set-Cookie / session side-effect:** regrava o cookie de sessão criptografado com o novo par de tokens; em falha destrói a sessão *(per phase-02-auth-frontend/TD-02)*

**Error responses (FE-facing):**
- _undetermined — qualquer falha vira o redirect para `/login`; não há corpo de erro para o browser_

---

#### POST /api/auth/logout (SI-04.10)

Rota já existente (Fase 02); esta fase só liga o botão "Sair" do `UserMenu`.

**forwards-to:** `POST /auth/logout` *(derived: project contract source)*

**Response 204 (FE-facing):** sem corpo *(derived: project contract source; reshape: none)*

**Set-Cookie / session side-effect:** destrói o cookie de sessão criptografado (`session.destroy()`) *(per phase-02-auth-frontend/TD-02)*

**Error responses (FE-facing):**
- _undetermined — a rota existente da Fase 02 destrói a sessão e responde 204 mesmo se o upstream falhar; esse comportamento está no código da rota, não em TD nem no contrato_

### Authorization Matrix

| Endpoint | Anonymous | Authenticated | Owner |
|----------|-----------|---------------|-------|
| GET /videos/{publicId} | ✗ | ✗ | ✓ |
| PATCH /videos/{publicId} | ✗ | ✗ | ✓ |
| GET /me/videos | ✗ | ✓ | ✓ |
| GET /me/channel | ✗ | ✓ | ✓ |
| PATCH /me/channel | ✗ | ✓ | ✓ |
| GET /channels/{nickname} | ✓ | ✓ | ✓ |
| GET /channels/{nickname}/videos | ✓ | ✓ | ✓ |
| GET /videos/{publicId}/stream | ✓ (só publicado) | ✓ (só publicado) | ✓ (inclui rascunho) |
| GET /videos/{publicId}/download | ✓ (só publicado) | ✓ (só publicado) | ✓ (inclui rascunho) |
| POST /auth/logout | ✗ | ✓ | ✓ |

Rotas `me` só endereçam o canal do próprio chamador; por isso "Authenticated" e "Owner" coincidem. As rotas do BFF (`/api/**`) herdam a linha do endpoint que fazem proxy.

---

### Error Catalog

| errorCode | HTTP | Trigger |
|-----------|------|---------|
| VIDEO_NOT_PUBLISHABLE | 409 | `PATCH /videos/{publicId}` com `published=true` e `status` diferente de `ready` |
| NICKNAME_ALREADY_EXISTS | 409 | `PATCH /me/channel` com nickname já usado por outro canal |
| CHANNEL_NOT_FOUND | 404 | Canal inexistente: nickname desconhecido em `GET /channels/{nickname}` e `GET /channels/{nickname}/videos`, ou usuário sem canal nas rotas `me` |
| VIDEO_NOT_FOUND | 404 | _(existente, Fase 03)_ `publicId` inexistente; passa a cobrir também rascunho pedido em `stream`/`download` por quem não é o dono |
| FORBIDDEN | 403 | _(existente, Fase 03)_ vídeo de outro canal em `GET`/`PATCH /videos/{publicId}` |
| VIDEO_NOT_READY | 409 | _(existente, Fase 03)_ `stream`/`download` com `status` diferente de `ready` |

Erros de validação (400) e de token (401) seguem o formato já estabelecido em phase-02-auth/TD-07.

### UI Contracts

Decisões transversais das quatro telas (resolvidas em `/plan-resolve` em 2026-09-20; ver `validation.md` → Resolved Issues):

- **Layout autenticado compartilhado** (video-channel-management/TD-09, revisão de 2026-09-20): `/channel/videos`, `/videos/{publicId}/edit` e `/channel/settings` ficam num route group com layout que renderiza `SiteNavbar` + `UserMenu`. O layout busca o canal por `GET /me/channel` a cada requisição; **não** usa `session.channelSlug`, porque a rota de login grava esse campo vazio.
- **Estados ausentes no Figma** (loading, erro, sucesso, vazio, não encontrado): o implement segue o padrão do DS de auth (erro inline por campo, botão em loading, alerta de erro de formulário); páginas Server Component usam `loading.tsx`, `error.tsx` e `not-found.tsx` do App Router.
- **Marca e avatar**: "EstúdioCriador" no Figma é placeholder do mock — usar o `BrandLogo` StreamTube existente. Não há upload de avatar nesta fase: o `Avatar` mostra as iniciais do nome do canal como fallback.
- **Texto em pt-BR** (D-04 de `docs/design-identity.md`); rótulos em caixa alta do Figma são estilo, não conteúdo.

#### Screen: Painel de gerenciamento de vídeos do canal

**Route:** `/channel/videos`
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=39-2 (node `FetKyb1V02WS5D6VCatK6t:39:2`)
**Purpose:** "Painel de gerenciamento de vídeos do canal (thumbnail, título, visualizações, likes, comentários, tempo de publicação e status)"

**Auth requirement:** Authenticated _(source: §Authorization Matrix — rows `GET /me/videos` e `POST /auth/logout`)_

**Rendering strategy:** Server Component (RSC) que lê a listagem direto do upstream via `upstream`; só o botão de logout e os links são interativos _(source: phase-02-auth-frontend/TD-07 — "RSC owns the token, Client Component owns the input"; `next-frontend/CLAUDE.md` § Architecture)_

**Reused DS components:**
- `components/layout/site-navbar.tsx (new)` — Chrome autenticado: BrandLogo à esquerda, UserMenu à direita; sem estado próprio nem busca/links no Figma; reutilizado nas demais telas da Fase 04
- `components/auth/brand-logo.tsx` — Herdado da fase 02 (source: phase-02); Figma mostra wordmark "EstúdioCriador" (placeholder do mock — usar o BrandLogo StreamTube)
- `components/icons/streamtube-icon.tsx` — Herdado da fase 02; reusar o componente DS, não o asset
- `components/layout/user-menu.tsx (new)` — Composição Avatar + botão "Sair"; unidade dona da ação de logout (mesmo critério de Form + SubmitButton da fase 02)
- `components/ui/avatar.tsx (new)` — Imagem circular 36px com borda; sem affordance de menu/dropdown no Figma; sem upload de avatar nesta fase, fallback com iniciais do canal
- `components/ui/button.tsx` — Herdado da fase 02 (variantes outline/secundária): "Sair", "Criar novo vídeo" (Next.js `<Link>` para `/upload`) e "Editar" por linha (Next.js `<Link>` para `/videos/{publicId}/edit`)
- `components/icons/plus-icon.tsx (new)` — Ícone "+" 14px; Figma renderiza como `<img>`
- `components/videos/video-table.tsx (new)` — Lista de vídeos do canal com dados vindos do servidor (offset/limit, TD-06); cabeçalho + linhas; última coluna de ações com o botão "Editar" por linha (EditVideoButton)
- `components/ui/badge.tsx (new)` — Primitive pill 100px de raio, usada pelos badges de visibilidade e status
- `components/videos/video-visibility-badge.tsx (new)` — Valores: "Público" (muted), "Indisponível" (warning), "—" (muted, linha de rascunho); rótulo de `unlisted` = "Indisponível" (TD-02)
- `components/videos/video-status-badge.tsx (new)` — Valores: "Publicado" (success), "Rascunho" (muted); apenas exibição
- `components/ui/pagination.tsx (new)` — "Anterior", página "1", "Próxima"; navegação por URL (Next.js `<Link>`/search param, TD-06 offset/limit com total) sem I/O próprio — a busca do recorte é feita por quem renderiza a listagem (VideoTable)

**Server-connected components:**
- `UserMenu` — verbs: Encerrar a sessão do usuário autenticado | endpoint: `POST /api/auth/logout` (§API Contracts → BFF tier — see for `forwards-to` + request/response/projection) | reuse: `components/layout/user-menu.tsx (new)`
- `SairButton` — verbs: Encerrar a sessão do usuário autenticado | endpoint: `POST /api/auth/logout` (§API Contracts → BFF tier) | reuse: `components/ui/button.tsx`
- `VideoTable` — verbs: Exibir lista paginada de vídeos do canal com thumbnail, título, duração, visibilidade, status, contadores e data de publicação | endpoint: `GET /me/videos` (§API Contracts — leitura em Server Component via `upstream`, sem rota BFF) | reuse: `components/videos/video-table.tsx (new)`

**Behaviors:**

*Rendered states:*
- Loading: `loading.tsx` com linhas-esqueleto da tabela
- Empty: "Nenhum vídeo ainda" com o botão "Criar novo vídeo" (`/upload`)
- Success: tabela com thumbnail 100×56, título com ellipsis, duração `m:ss`, chip de visibilidade, chip de status, views/likes/comentários alinhados à direita em pt-BR (`1.284`), data de publicação e o botão "Editar". Rascunho mostra "—" em visibilidade, métricas e publicação. A coluna PUBLICAÇÃO usa data relativa ("há 3 dias") com a data absoluta no `title`. Vídeo com `status` diferente de `ready` ganha um `Badge` extra ao lado do chip de status: "Processando" (muted) ou "Falhou" (destructive)
- Error: `error.tsx` com mensagem e ação de tentar de novo

*Interactions:*
- `EditVideoButton` "Editar" → navega para `/videos/{publicId}/edit`, sem mutation
- `CreateVideoButton` "Criar novo vídeo" → navega para `/upload`
- `Pagination` → troca o search param `page`; a página lê `page` e calcula `offset` = (`page` − 1) × `limit`
- Hover e foco do "Editar" herdam a variante outline do `Button` do DS (sem desenho novo no Figma)

**Error Catalog → UX mapping:**

| errorCode (from §Error Catalog) | UX treatment |
|---------------------------------|--------------|
| `UNAUTHORIZED` | Redirect para `/login` (a página já checa `session.isLoggedIn`) |
| `CHANNEL_NOT_FOUND` | `error.tsx` genérico — usuário autenticado sem canal é estado inconsistente |
| `400 validation error` (`page` inválido) | Normaliza para a página 1, sem mensagem |

**Client-side validation mirror:** _(source: §API Contracts → Validation Rules)_

- `page`: inteiro ≥ 1; qualquer outro valor vira 1 (`offset` ≥ 0, `limit` de 1 a 50)

**Accessibility notes:**
- O botão "Editar" tem nome acessível `Editar {título}`; a coluna de ações ganha `<th>` visualmente oculto (sr-only) "Ações"
- Tabela com semântica `<table>`; chips com texto, não só cor; `Pagination` como `<nav>` com `aria-current="page"` na página atual e estado desabilitado em Anterior/Próxima nas pontas
- Ícones de play e "+" decorativos (`alt=""`)

---

#### Screen: Tela de edição de vídeo

**Route:** `/videos/{publicId}/edit`
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=41-90 (node `FetKyb1V02WS5D6VCatK6t:41:90`)
**Purpose:** "Edição das informações do vídeo: título, descrição, categoria e thumbnail customizada" (com o "Fluxo de rascunho → publicação" acionado pelos botões "Salvar rascunho" e "Publicar")

**Auth requirement:** Authenticated+Owner _(source: §Authorization Matrix — rows `GET /videos/{publicId}` e `PATCH /videos/{publicId}`)_

**Rendering strategy:** Server Component (RSC) carrega o vídeo por `upstream`; `VideoEditForm` é Client Component que é dono do input e da mutação _(source: video-channel-management/TD-09 — rota dedicada; phase-02-auth-frontend/TD-07 — "RSC owns the token, Client Component owns the input"; phase-02-auth-frontend/TD-04 e TD-05 — react-hook-form e Route Handlers)_

**Reused DS components:**
- `components/auth/back-link.tsx` — Herdado da fase 02 (source: phase-02); aqui com ícone chevron-left e destino no painel: ícone e destino passam a ser parametrizáveis por props (SI-04.9, OQ-22 resolvido)
- `components/icons/chevron-left-icon.tsx (new)` — Ícone interno do BackLink; difere do `arrow-back-icon.tsx` existente (chevron vs seta)
- `components/videos/video-edit-form.tsx (new)` — Form como unidade (react-hook-form + Zod): recebe valores atuais do vídeo e submete edição/publicação; wrapper "right-column" do Figma. Sem validação de campos desenhada
- `components/videos/thumbnail-uploader.tsx (new)` — Coluna esquerda: preview + botão "Alterar thumbnail" + helper; envia thumbnail customizada como multipart (TD-03); exibe a URL única já resolvida (TD-04), sem lógica auto-vs-custom no front
- `components/ui/card.tsx` — Container do card "Thumbnail atual"; reuso da fase 02 (source: phase-02)
- `components/ui/button.tsx` — "Alterar thumbnail" (outline; apenas abre o seletor de arquivo), "Salvar rascunho" (secondary/outline), "Publicar" (primary)
- `components/ui/label.tsx` — Reuso da fase 02 (source: phase-02); TÍTULO, DESCRIÇÃO, CATEGORIA e VISIBILIDADE (esta rotula o grupo de radios); tipografia caixa alta 13px difere do `FormLabel` da fase 02 → variante local
- `components/ui/input.tsx` — Controlado via react-hook-form; pré-preenchido com o título atual
- `components/ui/textarea.tsx (new)` — Campo multilinha (120px) controlado via react-hook-form; primitive DS ainda não autorada
- `components/ui/select.tsx (new)` — Opções vêm de enum estático tipado via openapi (TD-01/TD-10), sem fetch em runtime: sem backend ele continuaria funcionando
- `components/icons/chevron-down-icon.tsx (new)` — Ícone decorativo interno do Select
- `components/ui/radio-group.tsx (new)` — Estado local do form; dois itens (`public` | `unlisted`, TD-02); item "Indisponível" = UI label de `unlisted` (TD-02, Revision 2026-08-08)

**Server-connected components:**
- `VideoEditForm` — verbs: Exibir informações atuais do vídeo (título, descrição, categoria, visibilidade e thumbnail) para edição; Atualizar título e descrição do vídeo; Selecionar a categoria do vídeo entre as categorias disponíveis; Definir a visibilidade do vídeo como público ou indisponível (unlisted) | endpoint: `GET /videos/{publicId}` (§API Contracts — leitura em Server Component via `upstream`) e `PATCH /api/videos/{publicId}` (§API Contracts → BFF tier — see for `forwards-to` + request/response/projection) | reuse: `components/videos/video-edit-form.tsx (new)`
- `ThumbnailUploader` — verbs: Substituir a thumbnail do vídeo por uma imagem personalizada | endpoint: `PATCH /api/videos/{publicId}` (§API Contracts → BFF tier; a thumbnail é a parte de arquivo do mesmo envio do formulário, sem mutation própria — video-channel-management/TD-03, revisão de 2026-09-20) | reuse: `components/videos/thumbnail-uploader.tsx (new)`
- `Button "Salvar rascunho"` — verbs: Salvar as alterações do vídeo mantendo-o como rascunho | endpoint: `PATCH /api/videos/{publicId}` (§API Contracts → BFF tier) | reuse: `components/ui/button.tsx`
- `Button "Publicar"` — verbs: Publicar o vídeo | endpoint: `PATCH /api/videos/{publicId}` com `published=true` (§API Contracts → BFF tier) | reuse: `components/ui/button.tsx`

**Behaviors:**

*Rendered states:*
- Loading: botões desabilitados com rótulo de progresso durante o envio; a página usa `loading.tsx`
- Empty: not applicable
- Success: mensagem inline de confirmação ("Alterações salvas" / "Vídeo publicado") com `role="status"`, seguida de `router.refresh()` para recarregar o estado do vídeo
- Error: erro inline por campo e alerta de formulário; detalhes no mapeamento abaixo
- Variantes por ciclo de vida: rascunho mostra "Salvar rascunho" + "Publicar"; vídeo já publicado mostra "Salvar alterações" + "Despublicar"; com `status` diferente de `ready`, "Publicar" fica desabilitado com um texto de apoio (regra do TD-02)

*Interactions:*
- `ThumbnailUploader` "Alterar thumbnail" → abre o seletor de arquivo e mostra preview local do arquivo escolhido; nada é enviado até o submit do formulário
- `Salvar rascunho` / `Publicar` / `Salvar alterações` / `Despublicar` → um único `PATCH` multipart; `Publicar` envia `published=true`, `Despublicar` envia `published=false`
- `Cancelar` e `BackLink` "Voltar para o painel" → navegam para `/channel/videos`, sem mutation e sem confirmação de alterações não salvas

**Error Catalog → UX mapping:**

| errorCode (from §Error Catalog) | UX treatment |
|---------------------------------|--------------|
| `400 validation error` | Erro inline embaixo do campo; MIME de thumbnail inválido aparece sob o `ThumbnailUploader` |
| `413 payload too large` | Erro inline sob o `ThumbnailUploader` ("A imagem excede o limite de tamanho") |
| `VIDEO_NOT_PUBLISHABLE` | Alerta ao lado de "Publicar": o vídeo ainda está processando ou falhou |
| `FORBIDDEN` | `notFound()` — a tela não revela vídeo de outro canal |
| `VIDEO_NOT_FOUND` | `not-found.tsx` do App Router |
| `UNAUTHORIZED` | Redirect para `/login` |

**Client-side validation mirror:** _(source: §API Contracts → Validation Rules — aplicada antes do submit)_

- `title`: obrigatório, 1 a 200 caracteres, sem ser só espaços
- `description`: opcional
- `category`: um dos valores de `VideoCategory` (TD-10); o `Select` só oferece essa lista — o exemplo "Tutoriais" do Figma não é válido
- `visibility`: `public` ou `unlisted`
- `thumbnail`: `image/jpeg`, `image/png` ou `image/webp`, até 2 MiB

**Accessibility notes:**
- Os radios do Figma são imagens: implementar `role="radiogroup"` rotulado por "VISIBILIDADE" e navegação por setas com semântica nativa de radio
- `input`/`select` do Figma são `div`: ligar `label` por `for`/`id` no código
- Chevrons decorativos (`alt=""`)
- `Cancelar` e o BackLink levam ao mesmo destino (painel)
- Erros ligados aos campos por `aria-describedby`

---

#### Screen: Tela de edição do canal

**Route:** `/channel/settings`
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=41-141 (node `FetKyb1V02WS5D6VCatK6t:41:141`)
**Purpose:** "Edição das informações do canal: nickname, nome e descrição"

**Auth requirement:** Authenticated _(source: §Authorization Matrix — rows `GET /me/channel` e `PATCH /me/channel`)_

**Rendering strategy:** Server Component (RSC) carrega o canal por `upstream`; `ChannelEditForm` é Client Component que é dono do input e da mutação _(source: phase-02-auth-frontend/TD-07 — "RSC owns the token, Client Component owns the input"; phase-02-auth-frontend/TD-04 e TD-05)_

**Reused DS components:**
- `components/channels/channel-edit-form.tsx (new)` — Form como unidade (react-hook-form + Zod, mutation via Route Handler); o Figma não tem um nó `<form>` dedicado, o form agrupa `form-fields` e `actions-row` dentro do card
- `components/ui/card.tsx` — Container do formulário (520px); mesmo componente do auth, ver phase-02
- `components/ui/label.tsx` — NICKNAME, NOME DO CANAL e DESCRIÇÃO; see screen: Tela de edição de vídeo
- `components/ui/input.tsx` — Controlado via react-hook-form; o prefixo "@" é um adorno local dentro do container do campo (composição local, sem primitive nova)
- `components/ui/textarea.tsx (new)` — see screen: Tela de edição de vídeo; altura 100px
- `components/ui/button.tsx` — "Salvar alterações" (submit)

**Server-connected components:**
- `ChannelEditForm` — verbs: Exibir informações atuais do canal (nickname, nome e descrição) para edição; Salvar alterações de nickname, nome e descrição do canal | endpoint: `GET /me/channel` (§API Contracts — leitura em Server Component via `upstream`) e `PATCH /api/me/channel` (§API Contracts → BFF tier — see for `forwards-to` + request/response/projection) | reuse: `components/channels/channel-edit-form.tsx (new)`
- `SaveButton` — verbs: Salvar alterações de nickname, nome e descrição do canal | endpoint: `PATCH /api/me/channel` (§API Contracts → BFF tier) | reuse: `components/ui/button.tsx`

**Behaviors:**

*Rendered states:*
- Loading: botão "Salvar alterações" desabilitado durante o envio; a página usa `loading.tsx`
- Empty: not applicable
- Success: mensagem inline "Alterações salvas" com `role="status"` e `router.refresh()` para o layout autenticado recarregar o canal
- Error: erro inline por campo e alerta de formulário

*Interactions:*
- `Cancelar` → navega para `/channel/videos` (video-channel-management/TD-09, revisão de 2026-09-20); sem mutation
- Trocar o nickname muda a URL pública `/@{nickname}` (TD-07 + TD-08): o campo mostra um texto de apoio avisando disso, além do "Único e global para o sistema"

**Error Catalog → UX mapping:**

| errorCode (from §Error Catalog) | UX treatment |
|---------------------------------|--------------|
| `NICKNAME_ALREADY_EXISTS` | Erro inline sob o campo nickname ("Este nickname já está em uso") |
| `400 validation error` | Erro inline sob o campo ofensor |
| `CHANNEL_NOT_FOUND` | `not-found.tsx` do App Router |
| `UNAUTHORIZED` | Redirect para `/login` |

**Client-side validation mirror:** _(source: §API Contracts → Validation Rules — aplicada antes do submit)_

- `nickname`: obrigatório, `^[a-z0-9_]+$`, 1 a 50 caracteres; o exemplo "joana.cria" do Figma é inválido — usar `joana_cria`
- `name`: obrigatório, 1 a 50 caracteres
- `description`: opcional

**Accessibility notes:**
- O prefixo "@" é decorativo (`aria-hidden`); o `label` do campo continua sendo NICKNAME
- Textos de apoio ligados ao campo por `aria-describedby`
- Foco e hover seguem os padrões do DS de auth

---

#### Screen: Página pública do canal

**Route:** `/@{nickname}`
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=59-2 (node `FetKyb1V02WS5D6VCatK6t:59:2`)
**Purpose:** "Página pública do canal com informações e listagem de vídeos"

**Auth requirement:** Anonymous _(source: §Authorization Matrix — rows `GET /channels/{nickname}` e `GET /channels/{nickname}/videos`)_

**Rendering strategy:** Server Component (RSC) lê o canal e a listagem direto do upstream por `upstream`; sem estado de cliente _(source: `next-frontend/CLAUDE.md` § Architecture — Server Components por padrão; phase-02-auth-frontend/TD-06 — sessão lida em RSC)_. **Roteamento:** no App Router, pasta iniciada por `@` é slot de rota paralela; o mapeamento de `/@{nickname}` (TD-08) deve ser confirmado nos docs do Next instalado em `node_modules/next/dist/docs/` antes de implementar (por exemplo via `rewrites`).

**Reused DS components:**
- `components/layout/site-navbar.tsx (new)` — see screen: Painel de gerenciamento de vídeos do canal; aqui em estado anônimo (BrandLogo + "Entrar"). Navbar completo (busca, variante autenticada) é escopo da Fase 07
- `components/auth/brand-logo.tsx` — see screen: Painel de gerenciamento de vídeos do canal; wordmark "EstúdioCriador" do Figma é placeholder
- `components/icons/streamtube-icon.tsx` — see screen: Painel de gerenciamento de vídeos do canal
- `components/ui/button.tsx` — "Entrar" renderizado como Next.js `<Link>` para `/login` com aparência outline; não dispara mutation
- `components/channels/channel-header.tsx (new)` — Faixa de cabeçalho do canal. Renderiza dados do canal buscados no servidor (nome, nickname, avatar, total de vídeos) e a descrição quando existir
- `components/ui/avatar.tsx (new)` — see screen: Painel de gerenciamento de vídeos do canal; aqui 80×80, com fallback de iniciais do canal
- `components/videos/video-card.tsx (new)` — Componente Figma real, reutilizável nas Fases 05 (sugestões) e 07 (home/busca). Exibe dados de vídeo vindos do backend. O overlay de duração é markup interno do card (não usa o `Badge` do DS — OQ-20 resolvido)
- `components/ui/pagination.tsx (new)` — see screen: Painel de gerenciamento de vídeos do canal; "Anterior 1 Próxima" alinhada à direita, navega por URL (TD-06 offset/limit)

**Server-connected components:**
- `ChannelHeader` — verbs: Exibir informações públicas do canal (nome, nickname, avatar e total de vídeos) | endpoint: `GET /channels/{nickname}` (§API Contracts — leitura em Server Component via `upstream`, sem rota BFF) | reuse: `components/channels/channel-header.tsx (new)`
- `VideoCard` — verbs: Exibir lista paginada de vídeos publicados e públicos do canal | endpoint: `GET /channels/{nickname}/videos` (§API Contracts — leitura em Server Component via `upstream`, sem rota BFF) | reuse: `components/videos/video-card.tsx (new)`

**Behaviors:**

*Rendered states:*
- Loading: `loading.tsx` com cabeçalho e cards-esqueleto
- Empty: "Este canal ainda não tem vídeos publicados"
- Success: cabeçalho com avatar 80×80, nome, descrição (quando existir) e `@{nickname} · {videosCount} vídeos` (singular "1 vídeo"), divisor, grade CSS de 4 colunas × 2 linhas (8 por página) e paginação; cada card mostra thumbnail 233×131 com raio 8px, duração sobreposta, título em uma linha com ellipsis e `{viewsCount} visualizações · há X`
- Error: `error.tsx` com mensagem e ação de tentar de novo; nickname inexistente usa `not-found.tsx` ("Canal não encontrado")

*Interactions:*
- `Pagination` → troca o search param `page`; a página calcula `offset` = (`page` − 1) × `limit` com `limit` 8
- O `VideoCard` não navega para a página de vídeo nesta fase (escopo da Fase 05)

**Error Catalog → UX mapping:**

| errorCode (from §Error Catalog) | UX treatment |
|---------------------------------|--------------|
| `CHANNEL_NOT_FOUND` | `not-found.tsx` do App Router ("Canal não encontrado") |
| `400 validation error` (`page` inválido) | Normaliza para a página 1, sem mensagem |

**Client-side validation mirror:** _(source: §API Contracts → Validation Rules)_

- `page`: inteiro ≥ 1; qualquer outro valor vira 1 (`offset` ≥ 0, `limit` 8)

**Accessibility notes:**
- O avatar recebe `alt` com o nome do canal; as thumbnails dos cards são decorativas (`alt=""`) porque o título está ao lado
- `Pagination` como `<nav>` com `aria-current="page"` e estado desabilitado nas pontas
- A grade é CSS grid; só o desktop foi desenhado (sem comportamento responsivo definido no Figma)

### UI ↔ API Traceability Matrix

| Verb | Component | Screen | Endpoint (from API Contracts) | TD ref |
|------|-----------|--------|-------------------------------|--------|
| Exibir lista paginada de vídeos do canal com thumbnail, título, duração, visibilidade, status, contadores e data de publicação | VideoTable | /channel/videos | GET /me/videos _(leitura em Server Component via `upstream`; sem rota BFF)_ | video-channel-management/TD-05, video-channel-management/TD-06 |
| Encerrar a sessão do usuário autenticado | UserMenu + SairButton | /channel/videos | POST /api/auth/logout → forwards-to POST /auth/logout | phase-02-auth-frontend/TD-02 _(capability herdada da Fase 02: "Logout")_ |
| Exibir informações atuais do vídeo (título, descrição, categoria, visibilidade e thumbnail) para edição | VideoEditForm + ThumbnailUploader | /videos/{publicId}/edit | GET /videos/{publicId} _(leitura em Server Component via `upstream`; sem rota BFF)_ | video-channel-management/TD-09, video-channel-management/TD-04 |
| Atualizar título e descrição do vídeo | VideoEditForm | /videos/{publicId}/edit | PATCH /api/videos/{publicId} → forwards-to PATCH /videos/{publicId} | video-channel-management/TD-03 |
| Selecionar a categoria do vídeo entre as categorias disponíveis | VideoEditForm (Select) | /videos/{publicId}/edit | PATCH /api/videos/{publicId} → forwards-to PATCH /videos/{publicId} | video-channel-management/TD-01, video-channel-management/TD-10 |
| Definir a visibilidade do vídeo como público ou indisponível (unlisted) | VideoEditForm (RadioGroup) | /videos/{publicId}/edit | PATCH /api/videos/{publicId} → forwards-to PATCH /videos/{publicId} | video-channel-management/TD-02 |
| Substituir a thumbnail do vídeo por uma imagem personalizada | ThumbnailUploader | /videos/{publicId}/edit | PATCH /api/videos/{publicId} → forwards-to PATCH /videos/{publicId} | video-channel-management/TD-03, video-channel-management/TD-04 |
| Salvar as alterações do vídeo mantendo-o como rascunho | Button "Salvar rascunho" | /videos/{publicId}/edit | PATCH /api/videos/{publicId} → forwards-to PATCH /videos/{publicId} | video-channel-management/TD-02 |
| Publicar o vídeo | Button "Publicar" | /videos/{publicId}/edit | PATCH /api/videos/{publicId} → forwards-to PATCH /videos/{publicId} (`published=true`) | video-channel-management/TD-02 |
| Exibir informações atuais do canal (nickname, nome e descrição) para edição | ChannelEditForm | /channel/settings | GET /me/channel _(leitura em Server Component via `upstream`; sem rota BFF)_ | video-channel-management/TD-07 |
| Salvar alterações de nickname, nome e descrição do canal | ChannelEditForm + SaveButton | /channel/settings | PATCH /api/me/channel → forwards-to PATCH /me/channel | video-channel-management/TD-07 |
| Exibir informações públicas do canal (nome, nickname, avatar e total de vídeos) | ChannelHeader | /@{nickname} | GET /channels/{nickname} _(leitura em Server Component via `upstream`; sem rota BFF)_ | video-channel-management/TD-08 |
| Exibir lista paginada de vídeos publicados e públicos do canal | VideoCard | /@{nickname} | GET /channels/{nickname}/videos _(leitura em Server Component via `upstream`; sem rota BFF)_ | video-channel-management/TD-06, video-channel-management/TD-08 |

_Capabilities marked in `## Non-UI / Deferred Capabilities` are excluded from this matrix. (Nenhuma nesta fase.)_

---

## Dependency Map

```
SI-04.0.1 (root — instala as primitives shadcn)
├── SI-04.0.2 — depends on SI-04.0.1 (testes das primitives)
├── SI-04.0.3 — depends on SI-04.0.1 (teste do textarea)
├── SI-04.0.4 — depends on SI-04.0.1 (channel-edit-form, channel-header e ícones)
│   └── SI-04.0.5 — depends on SI-04.0.1 + SI-04.0.4 (navbar, menu e componentes de vídeo usam ícones e avatar)
└── SI-04.0.6 — depends on SI-04.0.1 (chips e tabela do painel)

SI-04.1 (root — schema do vídeo)
├── SI-04.2 — depends on SI-04.1 (entidade estendida antes do detalhe do dono)
│   ├── SI-04.3 — depends on SI-04.2 (edição reusa a resolução de thumbnail)
│   └── SI-04.4 — depends on SI-04.2 (painel reusa a resolução de thumbnail; cria CHANNEL_NOT_FOUND)
│       ├── SI-04.5 — depends on SI-04.4 (usa CHANNEL_NOT_FOUND)
│       └── SI-04.6 — depends on SI-04.4 (usa CHANNEL_NOT_FOUND e o controller de canais)
└── SI-04.7 — depends on SI-04.1 (rascunho depende de published_at)

SI-04.8 — depends on SI-04.2 + SI-04.3 + SI-04.4 + SI-04.5 + SI-04.6 + SI-04.7 (o contrato só existe depois dos endpoints)
SI-04.9 (root, independente — BackLink com ícone)
SI-04.10 — depends on SI-04.5 + SI-04.8 + SI-04.0.5 (layout lê GET /me/channel e usa SiteNavbar/UserMenu)

SI-04.11.0 — depends on SI-04.0.1 + SI-04.0.4 + SI-04.0.5 + SI-04.0.6 (o audit lê os arquivos DS do disco)
└── SI-04.11a — depends on SI-04.11.0 + bootstraps
    └── SI-04.11b — depends on SI-04.11a + SI-04.4 + SI-04.8 + SI-04.10

SI-04.12.0 — depends on SI-04.0.1 + SI-04.0.4 + SI-04.0.5 + SI-04.9
└── SI-04.12a — depends on SI-04.12.0 + bootstraps
    └── SI-04.12b — depends on SI-04.12a + SI-04.2 + SI-04.3 + SI-04.8 + SI-04.10

SI-04.13.0 — depends on SI-04.0.1 + SI-04.0.4
└── SI-04.13a — depends on SI-04.13.0 + bootstraps
    └── SI-04.13b — depends on SI-04.13a + SI-04.5 + SI-04.8 + SI-04.10

SI-04.14.0 — depends on SI-04.0.1 + SI-04.0.4 + SI-04.0.5
└── SI-04.14a — depends on SI-04.14.0 + bootstraps
    └── SI-04.14b — depends on SI-04.14a + SI-04.6 + SI-04.8 + SI-04.11b
```

---

## Deliverables

- [ ] SI-04.0.1 — Infra: install batch shadcn primitives
- [ ] SI-04.0.2 — Tests shadcn batch (≤5 files)
- [ ] SI-04.0.3 — Tests shadcn batch (textarea)
- [ ] SI-04.0.4 — Custom-business simple group: channel-edit-form + channel-header + chevron-down-icon + chevron-left-icon + plus-icon
- [ ] SI-04.0.5 — Custom-business simple group: site-navbar + thumbnail-uploader + user-menu + video-card + video-edit-form
- [ ] SI-04.0.6 — Custom-business simple group: video-status-badge + video-table + video-visibility-badge
- [ ] SI-04.1 — Migrar o schema de vídeo (categoria, visibilidade, publicação, thumbnail customizada e contadores)
- [ ] SI-04.2 — Endpoint GET /videos/{publicId} (detalhe do dono estendido)
- [ ] SI-04.3 — Endpoint PATCH /videos/{publicId} (edição, thumbnail e publicação)
- [ ] SI-04.4 — Endpoint GET /me/videos (painel do canal)
- [ ] SI-04.5 — Endpoints GET e PATCH /me/channel (canal do dono)
- [ ] SI-04.6 — Endpoints GET /channels/{nickname} e GET /channels/{nickname}/videos (canal público)
- [ ] SI-04.7 — Assinatura de stream e download respeita rascunho e visibilidade
- [ ] SI-04.8 — Sincronizar o contrato OpenAPI e os mocks do frontend
- [ ] SI-04.9 — Generalizar o BackLink (ícone por props)
- [ ] SI-04.10 — Layout autenticado do canal (chrome, logout e leitura com refresh)
- [ ] SI-04.11.0 — Drift audit: Painel de gerenciamento de vídeos do canal
- [ ] SI-04.11a — Tela de Painel de gerenciamento de vídeos do canal (visual shell)
- [ ] SI-04.11b — Tela de Painel de gerenciamento de vídeos do canal (lógica & wiring)
- [ ] SI-04.12.0 — Drift audit: Tela de edição de vídeo
- [ ] SI-04.12a — Tela de edição de vídeo (visual shell)
- [ ] SI-04.12b — Tela de edição de vídeo (lógica & wiring)
- [ ] SI-04.13.0 — Drift audit: Tela de edição do canal
- [ ] SI-04.13a — Tela de edição do canal (visual shell)
- [ ] SI-04.13b — Tela de edição do canal (lógica & wiring)
- [ ] SI-04.14.0 — Drift audit: Página pública do canal
- [ ] SI-04.14a — Tela de Página pública do canal (visual shell)
- [ ] SI-04.14b — Tela de Página pública do canal (lógica & wiring)

**Per-screen deliverables:**

- [ ] Tela Painel de gerenciamento de vídeos do canal (`/channel/videos`) é roteável
- [ ] Tela Painel de gerenciamento de vídeos do canal (`/channel/videos`) renderiza os estados de carregamento, sucesso, vazio e erro
- [ ] Tela Painel de gerenciamento de vídeos do canal (`/channel/videos`) passa nos testes de componente (camadas do testing-guide-next-frontend)
- [ ] Tela de edição de vídeo (`/videos/{publicId}/edit`) é roteável
- [ ] Tela de edição de vídeo (`/videos/{publicId}/edit`) renderiza os estados de carregamento, sucesso e erro
- [ ] Tela de edição de vídeo (`/videos/{publicId}/edit`) passa nos testes de componente (camadas do testing-guide-next-frontend)
- [ ] Tela de edição do canal (`/channel/settings`) é roteável
- [ ] Tela de edição do canal (`/channel/settings`) renderiza os estados de carregamento, sucesso e erro
- [ ] Tela de edição do canal (`/channel/settings`) passa nos testes de componente (camadas do testing-guide-next-frontend)
- [ ] Página pública do canal (`/@{nickname}`) é roteável
- [ ] Página pública do canal (`/@{nickname}`) renderiza os estados de carregamento, sucesso, vazio e canal não encontrado
- [ ] Página pública do canal (`/@{nickname}`) passa nos testes de componente (camadas do testing-guide-next-frontend)

**Full test suites:**

- [ ] Backend tests pass (`cd nestjs-project && docker compose exec nestjs-api npm test -- --runInBand`)
- [ ] E2E tests pass (`cd nestjs-project && docker compose exec nestjs-api npm run test:e2e`)
- [ ] Type/compilation checks pass (`cd nestjs-project && docker compose exec nestjs-api npx tsc --noEmit`)
- [ ] Lint passes (`cd nestjs-project && docker compose exec nestjs-api npm run lint`)
- [ ] Frontend tests pass (`cd next-frontend && docker compose exec next-frontend npm test`)
- [ ] Type/compilation checks pass (`cd next-frontend && docker compose exec next-frontend npx tsc --noEmit`)
- [ ] Lint passes (`cd next-frontend && docker compose exec next-frontend npm run lint`)
- [ ] Frontend E2E passes, com o dev server em `MSW_ENABLED=true` (`cd next-frontend && npx playwright test`, no host)
