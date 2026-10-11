---
kind: phase
name: phase-07-home-busca
test_specs_aware: true
sources_mtime:
  docs/phases/phase-07-home-busca/context.md: "2026-10-11T17:47:13-03:00"
  docs/decisions/technical-decisions-home-busca.md: "2026-10-11T17:47:13-03:00"
  docs/decisions/technical-decisions-rate-limit-visitor-identity.md: "2026-10-08T19:04:24-03:00"
  docs/decisions/technical-decisions-next-frontend-msw-foundation.md: "2026-06-29T19:03:26-03:00"
  docs/decisions/technical-decisions-next-frontend-openapi-typing.md: "2026-10-03T21:48:21-03:00"
sources_hash:
  docs/phases/phase-07-home-busca/context.md: "592b616d64eb"
  docs/decisions/technical-decisions-home-busca.md: "feda55ba3eed"
  docs/decisions/technical-decisions-rate-limit-visitor-identity.md: "0d1493a08793"
  docs/decisions/technical-decisions-next-frontend-msw-foundation.md: "a53ada59d6a6"
  docs/decisions/technical-decisions-next-frontend-openapi-typing.md: "371ec55c2f2a"
---

# Phase 07 — Página Inicial, Busca e Finalização (fatia home-busca)

## Objective

Entregar a fatia home-busca da Fase 07: a "Página inicial com grid de vídeos (thumbnail, título, canal, visualizações e tempo de publicação)", o "Filtro de vídeos por categoria na home", a "Barra de busca (pesquisa por título e canal)", o "Header/navbar com logo, barra de busca, botão de login/avatar e navegação", a "Paginação ou scroll infinito nas listagens de vídeos" e o "Layout responsivo para dispositivos móveis" — home page, busca, navegação e responsividade; os testes dos fluxos principais e o ambiente de produção ficam com a fatia irmã.

---

## Step Implementations

### SI-07.0.1 — Infra: install batch shadcn primitives

**Description:** Instalar o primitivo `sheet` do shadcn, base da `NavigationSheet` *(per home-busca/TD-07, Revision de 2026-10-11)*.

**Technical actions:**

1. Rodar `docker compose exec next-frontend npx shadcn@latest add sheet`, que gera `components/ui/sheet.tsx` sobre o Dialog do `radix-ui` já instalado e respeita o `components.json`.
2. Commitar `components/ui/sheet.tsx`.

**Tests:** _(empty — Infra)_

O batch de testes de primitivo (Group B) não é emitido. O `testing-guide-next-frontend` classifica primitivos shadcn de `components/ui/*` como "None — trust the library; cover via consumers", e quem cobre o sheet é a `NavigationSheet`.

**Dependencies:** none

**Acceptance criteria:**

- `next-frontend/components/ui/sheet.tsx` existe e exporta o Sheet e seus subcomponentes (trigger, content, header, title, close).
- `docker compose exec next-frontend npx tsc --noEmit` sai com código 0 com o arquivo novo.

---

### SI-07.0.2 — Custom-business complex: CategoryChip

**Description:** Criar `components/videos/category-chip.tsx`. É um componente de negócio com estado visual `default | selected`, conforme a nota do inventário: "Variantes `state=default\|selected`. Cada chip é um link de navegação para a categoria e não faz I/O próprio".

**Technical actions:**

1. Criar `components/videos/category-chip.tsx`, um `<Link>` com props `label`, `href` e `selected`, conforme §UI Contracts → Página inicial. O chip selecionado leva `aria-current="page"`, e a variante visual sai de `cva` com os tokens do DS.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `category-chip.tsx` | Unit per testing-guide-next-frontend § "Client Components" baseline — renderiza o rótulo e o `href` | `components/videos/__tests__/category-chip.test.tsx` |
| `category-chip.tsx` | Unit: estado `selected` → `aria-current="page"` e `data-state="selected"`; `default` sem `aria-current` | (same file) |

**Dependencies:** none

**Acceptance criteria:**

- O chip renderiza um link com o rótulo e o destino recebidos.
- Só o chip selecionado anuncia `aria-current="page"` ao leitor de tela.

---

### SI-07.0.3 — Custom-business simple group: MenuIcon + SearchIcon + XIcon + NavigationSheet + SearchForm

**Description:** Criar os ícones e os dois componentes de chrome novos que as telas consomem. São componentes de apresentação e de navegação, sem I/O próprio.

**Technical actions:**

1. Criar `components/icons/menu-icon.tsx`, `components/icons/search-icon.tsx` e `components/icons/x-icon.tsx`. São glifos SVG dos componentes Figma `menu-icon`, `search-icon` e `x-icon`, no padrão de `components/icons/streamtube-icon.tsx`, decorativos por padrão (`aria-hidden`).
2. Criar `components/layout/navigation-sheet.tsx` (`"use client"`), composta sobre `components/ui/sheet.tsx`. Recebe por props `viewer: { name, nickname } | null`, `pathname` e `onSignOut` / `isSigningOut`, e renderiza as variantes logada e anônima de §UI Contracts → Menu de navegação — mobile *(per home-busca/TD-07, Revision de 2026-10-11)*.
3. Criar `components/layout/search-form.tsx` (`"use client"`): `<Form action="/results">` do `next/form` com `<input type="search" name="q" required minLength={3} maxLength={100}>`, `<label>` visualmente oculto e botão "Buscar". Recebe `defaultValue` e `variant: "desktop" | "mobile"`; no mobile o submit é só ícone *(per home-busca/TD-06 e home-busca/TD-04, Revision de 2026-10-11)*.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `navigation-sheet.tsx` | Unit per testing-guide-next-frontend § "Client Components" — variante logada (identidade, três links, "Sair"), variante anônima ("Entrar" + Início, sem "Sair"), "Sair" chama `onSignOut` e fica desabilitado com `isSigningOut` | `components/layout/__tests__/navigation-sheet.test.tsx` |
| `search-form.tsx` | Unit per testing-guide-next-frontend § "Client Components" — `action="/results"`, `name="q"`, atributos `required`/`minLength`/`maxLength`, `defaultValue` preenchido, rótulo acessível nas duas variantes | `components/layout/__tests__/search-form.test.tsx` |

Os três ícones não têm teste, conforme o testing guide: "Icon (`components/icons/*`) — None".

**Dependencies:** SI-07.0.1 — a `NavigationSheet` compõe o `components/ui/sheet.tsx`

**Acceptance criteria:**

- Os cinco arquivos existem nos caminhos declarados no UI Contracts e compilam.
- O `SearchForm` recusa no navegador o envio de um termo com menos de 3 caracteres.
- A `NavigationSheet` anônima não oferece "Sair" nem os links do studio; a logada oferece os três links e "Sair".

---

### SI-07.0.4 — Custom-business simple group: CategoryFilter + SearchEmptyState + VideoGrid

**Description:** Criar os três componentes de listagem que a home e os resultados compõem. Nenhum faz fetch: recebem dados da página RSC.

**Technical actions:**

1. Criar `components/videos/category-filter.tsx`: faixa com "Todos" + as 8 categorias, na ordem do enum de `contracts.ts`, cada uma um `CategoryChip`. O `href` é `/?category={encodeURIComponent(valor)}`, e "Todos" leva a `/`. Recebe a categoria corrente e marca o chip selecionado. Abaixo de `sm` a faixa rola na horizontal *(per home-busca/TD-01 e video-channel-management/TD-01)*.
2. Criar `components/videos/search-empty-state.tsx`: badge com `SearchIcon`, título "Nenhum vídeo encontrado para “{q}”", texto de dica e link "Voltar para o início" para `/`. Recebe `q` por props e o renderiza como texto.
3. Criar `components/videos/video-grid.tsx`: `<ul>` com a grade responsiva (1 coluna; 2 em `sm`, 3 em `md`, 4 em `lg`), um `VideoCard` por item. Recebe os itens e a variante de tamanho *(per home-busca/TD-08)*.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `category-filter.tsx` | Unit per testing-guide-next-frontend § "utilities & boundary" — 9 links na ordem do enum; `href` com o valor percent-encoded (`Música` → `M%C3%BAsica`); "Todos" selecionado sem categoria; categoria corrente selecionada | `components/videos/__tests__/category-filter.test.tsx` |

`SearchEmptyState` e `VideoGrid` são Presentational, sem ramificação, e ficam cobertos pelo E2E das telas, como pede o testing guide para "Feature component (server, composes primitives) — Skip unit; cover via the page's E2E".

**Dependencies:** SI-07.0.2 — o `CategoryFilter` compõe o `CategoryChip`; SI-07.0.3 — o `SearchEmptyState` usa o `SearchIcon`; SI-07.6 — a `VideoGrid` renderiza o `VideoCard` estendido

**Acceptance criteria:**

- O filtro oferece "Todos" e as 8 categorias, cada uma apontando para `/?category=` com o valor do enum codificado, sem mapa de slugs.
- O estado vazio repete o termo buscado como texto e leva de volta a `/`.
- A grade mostra 1 coluna abaixo de `sm` e 4 a partir de `lg`.

---

### SI-07.1 — Infra: migration de extensões e índices da listagem e da busca

**Description:** Criar a migration `CreateVideoFeedAndSearchIndexes` de §Data Model. A listagem global e a busca dependem desses índices para não varrer a tabela *(per home-busca/TD-03 e home-busca/TD-04)*.

**Technical actions:**

1. Criar `src/database/migrations/<timestamp>-CreateVideoFeedAndSearchIndexes.ts`. O `up` cria as extensões `pg_trgm` e `unaccent`, a função `immutable_unaccent(text)` (`IMMUTABLE PARALLEL SAFE STRICT`, dicionário qualificado por schema) e os quatro índices exatamente como na tabela de §Data Model. O `down` desfaz na ordem inversa *(per home-busca/TD-04)*.
2. Registrar a migration em `ALL_MIGRATIONS` de `src/test/test-database.ts`; sem isso o `globalSetup` falha listando o arquivo.
3. Declarar os índices nas entidades com `@Index('<nome>', { synchronize: false })`: `videos_title_search_idx` e `videos_listable_published_idx` em `Video`; `channels_name_search_idx` e `channels_nickname_search_idx` em `Channel`. Assim o diff de schema não os trata como órfãos.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| Migration `CreateVideoFeedAndSearchIndexes` | Integration: contra o banco de teste, a função `immutable_unaccent` existe e é `IMMUTABLE` (`pg_proc.provolatile = 'i'`), `immutable_unaccent('Música')` devolve `Musica`, e os quatro índices existem em `pg_indexes` com a definição esperada, incluindo o predicado parcial | `src/videos/entities/video.entity.integration-spec.ts` |

**Dependencies:** none

**Acceptance criteria:**

- `docker compose exec nestjs-api npm run migration:run` aplica a migration no banco de dev sem erro, e `migration:revert` a desfaz.
- Depois da migration, `SELECT immutable_unaccent(lower('Educação'))` devolve `educacao`.
- `pg_indexes` lista `videos_title_search_idx`, `videos_listable_published_idx`, `channels_name_search_idx` e `channels_nickname_search_idx`.
- O índice `videos_listable_published_idx` tem o predicado `published_at IS NOT NULL AND visibility = 'public'`.

---

### SI-07.2 — Consolidar a regra "listável" e implementar a listagem global no VideosService

**Description:** Pôr a regra "listável" num ponto só e escrever a consulta da listagem global, com filtro por categoria e busca, no `VideosService` *(per home-busca/TD-01, home-busca/TD-03, home-busca/TD-04, home-busca/TD-05)*.

**Technical actions:**

1. Extrair a regra "listável" (`published_at IS NOT NULL` e `visibility = 'public'`) para um ponto único do `VideosService`: um helper privado que aplica as duas condições a um query builder e um objeto `where` reusável para `find*`. Fazer `listPublicByChannel`, `countPublicByChannel`, `countPublicByChannels` e `listSuggestions` usarem esse ponto, sem mudar o comportamento *(per video-channel-management/TD-02 e home-busca/TD-01)*.
2. Criar `src/common/sql/escape-like-pattern.ts`: função pura que escapa `\`, `%` e `_` para uso com `LIKE ... ESCAPE '\'` (§Data Model → Casamento da busca).
3. Implementar `listFeed({ q?, category?, offset, limit }): Promise<VideoFeedPage>` no `VideosService`:
   - join com `channel`, regra "listável" e `category` quando houver;
   - com `q`, `immutable_unaccent(lower(video.title)) LIKE :pattern ESCAPE '\'` OR o mesmo sobre `channel.name` OR `channel.nickname LIKE :nicknamePattern ESCAPE '\'`;
   - ordem `published_at DESC, id DESC`, `skip`/`take` e `getManyAndCount`;
   - item mapeado no shape de `SuggestedVideoListItem`, com `thumbnailUrl` por `resolveThumbnailUrl` *(per home-busca/TD-03 e home-busca/TD-05)*.
4. Criar `VideoFeedPage` (`items: SuggestedVideoListItem[]`, `total`) em `src/videos/dto/video-feed-response.dto.ts`, com `@ApiProperty` no padrão de `SuggestedVideosPage`.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `escape-like-pattern.ts` | Unit: `%`, `_` e `\` escapados; termo sem curinga inalterado | `src/common/sql/escape-like-pattern.spec.ts` |
| `VideosService.listFeed` | Integration: só listáveis (rascunho e `unlisted` fora); ordem `published_at DESC, id DESC`; filtro por `category`; `q` casa título sem acento e sem caixa ("musica" acha "Música"), nome do canal e nickname; casamento só pelo canal traz os vídeos do canal; `_` no termo é literal; `total` ignora a página; lista vazia sem erro | `src/videos/videos.service.feed.integration-spec.ts` |
| `VideosService` (regra consolidada) | Integration: as consultas por canal e as sugestões continuam com o mesmo resultado | `src/videos/videos.service.integration-spec.ts` |

**Dependencies:** SI-07.1 — a busca usa `immutable_unaccent` e os índices da migration

**Acceptance criteria:**

- `listFeed` sem filtros devolve só vídeos publicados e públicos, do mais recente ao mais antigo.
- `listFeed` com `q = "musica"` devolve um vídeo de título "Música ao vivo" e um vídeo de outro título cujo canal se chama "Música Boa".
- `listFeed` com `q = "a_b"` não casa "aXb": o `_` é literal.
- Um vídeo `unlisted` ou em rascunho nunca aparece, com ou sem `q` e `category`.
- As listagens por canal e as sugestões devolvem os mesmos resultados de antes da consolidação.

---

### SI-07.3 — Endpoint GET /videos

**Route:** GET /videos
**Test Specs:** see `nestjs-project/specs/videos-feed.plan.md`
**Authorization:** Anonymous (`@Public()`), com Bearer opcional e ignorado — §Authorization Matrix

**Description:** Expor a listagem global no `VideosController`, com query validada e documentada no OpenAPI (§API Contracts → GET /videos).

**Technical actions:**

1. Criar `src/videos/dto/video-feed-query.dto.ts`, `VideoFeedQueryDto`, conforme §API Contracts → Validation Rules:
   - `q`: `@IsOptional`, `@Transform` que apara as pontas, `@Length(3, 100)`;
   - `category`: `@IsOptional`, `@IsEnum(VideoCategory)`;
   - `offset`: `@Min(0)`, default 0;
   - `limit`: `@Min(1) @Max(50)`, default 12;
   - números com `@Type(() => Number)`, como nos DTOs de query existentes *(per home-busca/TD-02 e home-busca/TD-04, Revisions de 2026-10-11)*.
2. Adicionar `@Public() @Get()` `listFeed` ao `VideosController`, delegando a `VideosService.listFeed`. Sem `@Throttle` nem `@SkipThrottle`: a rota fica no default global de 120/60 s por visitante *(per home-busca/TD-09, Revision de 2026-10-11)*.
3. Documentar a rota com `@ApiOperation`, `@ApiResponse` 200 (`VideoFeedPage`), 400 e 429 (`ApiErrorEnvelope`) e `@ApiBearerAuth('access-token')`, no padrão de `getSuggestions`. Registrar `VideoFeedPage` nos modelos extras do Swagger, se o padrão do módulo exigir.

**Tests:** _(empty — controller E2E-only per testing guide; scenarios authored in the /plan-test-specs spec)_

**Dependencies:** SI-07.2 — o controller delega a `listFeed`

**Acceptance criteria:**

- `GET /videos` sem query retorna `200` com `{ items, total }`, até 12 itens, do mais recente ao mais antigo.
- `GET /videos?category=Música` retorna `200` só com vídeos dessa categoria.
- `GET /videos?q=docker` retorna `200` com os vídeos cujo título, nome de canal ou nickname casa com "docker".
- `GET /videos?q=ab` retorna `400` com `error: "VALIDATION_ERROR"`.
- `GET /videos?category=Culinária` retorna `400` com `error: "VALIDATION_ERROR"`.
- `GET /videos?limit=51` retorna `400` com `error: "VALIDATION_ERROR"`.
- A 121ª requisição do mesmo visitante em 60 s retorna `429` com `error: "RATE_LIMIT_EXCEEDED"`.
- O `openapi.json` gerado descreve `GET /videos` com os quatro parâmetros de query e o schema `VideoFeedPage`.

---

### SI-07.4 — Infra: sincronizar o contrato OpenAPI e o mock da listagem global

**Description:** Levar `GET /videos` e `VideoFeedPage` até `paths` no frontend e dar à listagem um handler MSW tipado. Sem isso, nenhuma página, fixture ou teste desta fatia tem tipo nem upstream fake.

**Technical actions:**

1. Regenerar `nestjs-project/openapi.json` com `docker compose exec nestjs-api npm run openapi:export`. O script roda `nest build`, necessário para o plugin do Swagger preencher o DTO de query *(per openapi-docs-nestjs/TD-01 e TD-02)*.
2. Rodar `scripts/sync-openapi.sh` no host e depois `docker compose exec next-frontend npm run openapi:types`, que regenera `lib/api/types.gen.ts` *(per next-frontend-openapi-typing/TD-02 e TD-03)*.
3. Acrescentar a `next-frontend/lib/api/contracts.ts`, numa seção "listagem global", os aliases `VideoFeedPage`, `VideoFeedItem` e `VideoFeedQuery`, derivados de `paths["/videos"]["get"]`. O `contracts.ts` continua o único importador de `paths` *(per next-frontend-openapi-typing/TD-04)*.
4. Criar em `next-frontend/mocks/factories/videos.ts` o catálogo determinístico `buildFeedCatalog()` e acrescentar a `mocks/handlers/videos.ts` o handler `http.get(\`${env.API_URL}/videos\`)`, tipado por `paths`, que aplica `q`, `category`, `offset` e `limit` sobre esse catálogo na ordem por `publishedAt` desc *(per next-frontend-msw-foundation/TD-01, TD-03, TD-04 e next-frontend-openapi-typing/TD-05)*.
   - **Catálogo:** `FEED_TOTAL = 30` vídeos `feed-1` … `feed-30`, com `publishedAt` decrescente nessa ordem. A categoria do vídeo `i` (base 0) é a `i % 7` do enum, então `Outros` fica vazia e `Música` tem 5 vídeos. O canal é o `i % 3` de `Joana Cria` (`joana_cria`), `Docker Brasil` (`docker_brasil`) e `Tech com Nina` (`tech_com_nina`).
   - **Títulos:** `Vídeo {n}`, exceto `feed-1` = "Música ao vivo" e `feed-3`, `feed-6` e `feed-9` = "Docker na prática", "Docker Compose do zero" e "Docker em produção", todos do canal `tech_com_nina`. Com isso, `q=docker` casa 10 vídeos pelo canal e 3 pelo título (13 no total, 2 páginas), e `q=musica` casa 1.
   - **Casamento:** título, nome ou nickname do canal, sem acento e sem caixa, como no backend.
   - **Trigger de erro:** `q=erro-upstream` responde `500` `INTERNAL_ERROR`, para exercitar o `error.tsx` da listagem.

**Tests:** _(empty — Infra)_

**Dependencies:** SI-07.3 — a rota precisa estar no backend antes do export

**Acceptance criteria:**

- `next-frontend/openapi.json` contém `GET /videos` com `q`, `category`, `offset` e `limit` e o schema `VideoFeedPage`.
- Repetir o sync e o `openapi:types` não produz diff em `openapi.json` nem em `types.gen.ts`, e a checagem de frescor do CI passa.
- `docker compose exec next-frontend npx tsc --noEmit` sai com código 0.
- Nenhum arquivo de aplicação fora de `lib/api/contracts.ts` importa `paths` de `types.gen.ts`. Os handlers de `mocks/` são a exceção prevista por `next-frontend-openapi-typing/TD-05`.
- Com `MSW_ENABLED=true`, `GET ${API_URL}/videos` responde `total: 30`; `?q=docker` responde `total: 13`; `?category=Outros` e `?q=xyzabc` respondem `{ items: [], total: 0 }`.

---

### SI-07.5 — Hook de logout compartilhado

**Description:** Tirar o logout de dentro do `ChannelUserMenu` e pô-lo num hook, para que o "Sair" da navbar e o do sheet usem a mesma lógica sem duplicá-la *(per home-busca/TD-07, Revision de 2026-10-11)*.

**Technical actions:**

1. Criar `lib/auth/use-logout.ts` (`"use client"`), que expõe `{ signOut, isSigningOut }`. O `signOut` faz `POST /api/auth/logout`, depois `router.push("/login")` e `router.refresh()`, mantendo o comportamento atual: a resposta não é checada e o estado volta a `false` no `finally` *(per phase-02-auth-frontend/TD-05)*.
2. Refazer `components/layout/channel-user-menu.tsx` sobre o hook, sem mudar o que ele renderiza. Ele sai de vez no SI-07.8, quando a `SiteNavbar` passa a consumir o hook direto.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `use-logout.ts` | Unit per testing-guide-next-frontend § "Custom hook" — `renderHook` com jsdom e `next/navigation` mockado: `signOut` chama `POST /api/auth/logout` (interceptado no mesmo padrão de `components/layout/__tests__/user-menu.wiring.test.tsx`), navega para `/login` e faz `refresh`; `isSigningOut` é `true` durante a chamada e `false` ao fim | `lib/auth/__tests__/use-logout.test.ts` |

**Dependencies:** none

**Acceptance criteria:**

- Clicar em "Sair" no chrome autenticado encerra a sessão e leva a `/login`, como hoje.
- Enquanto o logout está em curso, o botão "Sair" fica desabilitado.

---

### SI-07.6 — Estender o VideoCard e migrar os chamadores

**Description:** Dar ao `VideoCard` a linha do canal, a variante de tamanho e os links próprios. Os três chamadores atuais deixam de envolvê-lo num `<Link>` *(per home-busca/TD-01, Revision de 2026-10-11)*.

**Technical actions:**

1. Estender `components/videos/video-card.tsx` conforme §UI Contracts → `VideoCard` estendido:
   - `publicId`, `channel?: { name, nickname }` e `size: "desktop" | "mobile"`;
   - thumbnail e título como link para `/videos/{publicId}`;
   - avatar (`Avatar` + `initialsOf`) e nome do canal como link irmão para `/@{nickname}`, só quando `channel` vem;
   - título em até 2 linhas, canal e meta em 1;
   - `sizes` da thumbnail por variante, com largura cheia no mobile.
2. Migrar `app/channels/[nickname]/page.tsx`, a sidebar de `app/videos/[publicId]/page.tsx` e `components/videos/sidebar-load-more.tsx`: passar `publicId`, remover o `<Link>` externo e não passar `channel`, para que a página do canal e a sidebar fiquem como estão no desenho.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `video-card.tsx` | Unit per testing-guide-next-frontend § "Client Components" — thumbnail e título apontam para `/videos/{publicId}`; com `channel`, avatar e nome apontam para `/@{nickname}` e as iniciais vêm de `initialsOf`; sem `channel`, a linha não aparece; nenhum `<a>` aninhado; `sizes` difere entre `desktop` e `mobile` | `components/videos/__tests__/video-card.test.tsx` |
| `sidebar-load-more.tsx` | Unit — os cards anexados seguem apontando para `/videos/{publicId}` sem link externo | `components/videos/__tests__/sidebar-load-more.test.tsx` |

**Dependencies:** none

**Acceptance criteria:**

- Na página do canal e na sidebar da watch page, clicar no card leva ao vídeo, como hoje, e o HTML não tem `<a>` dentro de `<a>`.
- Um card com canal mostra o avatar com iniciais e o nome, e os dois levam à página pública do canal.
- A thumbnail do card mobile é servida para a largura cheia da coluna.

---

### SI-07.7 — Navbar montada em layout: route groups `(site)` e `(feed)`

**Description:** Montar a navbar uma vez por layout, em vez de uma vez por página, conforme a estrutura de rotas de §UI Contracts → Navbar única *(per home-busca/TD-07, Revision de 2026-10-11)*. As URLs não mudam.

**Technical actions:**

1. Criar `app/(site)/layout.tsx`, um Server Component que renderiza `<PublicSiteNavbar />` e o `<main>` com o gutter responsivo (`px-4`, `lg:px-12`).
2. Mover com `git mv`:
   - `app/videos/[publicId]/` para `app/(site)/videos/[publicId]/`;
   - `app/channels/[nickname]/` para `app/(site)/channels/[nickname]/`, com os arquivos especiais (`loading`, `error`, `not-found`);
   - `app/page.tsx` para `app/(site)/(feed)/page.tsx`. O conteúdo da home é reescrito no SI-07.10a.
3. Remover o `<PublicSiteNavbar />` das duas páginas movidas e o prop `loginVariant` do `PublicSiteNavbar`. O "Entrar" passa a ter a variante única `secondary`.
4. Trocar, em `app/(studio)/layout.tsx`, o par `SiteNavbar` + `ChannelUserMenu` (e a leitura de `GET /me/channel` por `fetchFromUpstream`, que só servia ao nome) pelo `<PublicSiteNavbar />`. O `redirect("/login")` sem sessão continua.
5. Conferir o rewrite `/@:nickname` de `next.config.ts`: o destino `/channels/:nickname` continua válido, porque o route group não entra na URL.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| Watch page movida | E2E de regressão — a rota `/videos/{publicId}` renderiza como antes, agora com a navbar do layout | `tests/video-watch-page.e2e-spec.ts` |
| Página do canal movida | E2E de regressão — `/@{nickname}` (rewrite) renderiza como antes | `tests/channel-public.e2e-spec.ts` |
| Layout `(studio)` | E2E de regressão — `/channel/videos` sem sessão redireciona a `/login`; com sessão, renderiza com a navbar única | `tests/channel-videos.e2e-spec.ts` |

As três specs já existem. Os seletores que dependiam do chrome antigo são ajustados ao novo, sem afrouxar as asserções de conteúdo.

**Dependencies:** SI-07.6 — o SI-07.6 edita as páginas que este SI move

**Acceptance criteria:**

- `/videos/{publicId}`, `/@{nickname}`, `/channel/videos`, `/channel/subscriptions`, `/channel/settings` e `/videos/{publicId}/edit` respondem nas mesmas URLs de antes.
- Cada uma dessas telas mostra exatamente uma navbar.
- `/channel/videos` sem sessão continua redirecionando para `/login`.
- As telas de `(auth)` e `/upload` continuam sem navbar.

---

### SI-07.8 — Navbar desktop: busca, links por sessão, "Seu canal" e logout pelo hook

**Description:** Compor a barra completa do desktop, a partir de `lg`, sobre a `SiteNavbar`: busca, os links conforme a sessão, o avatar como "Seu canal" e o "Sair" pelo hook compartilhado *(per home-busca/TD-06 e home-busca/TD-07, Revision de 2026-10-11)*.

**Technical actions:**

1. Fazer o `PublicSiteNavbar` entregar à `SiteNavbar` `viewer = { name, nickname } | null`, a partir de `getViewerChannel()`, no lugar de compor `ChannelUserMenu` ou "Entrar" por conta própria.
2. Reescrever `components/layout/site-navbar.tsx` (`"use client"`) para a barra desktop de §UI Contracts → Composição da navbar:
   - BrandLogo, depois `SearchForm`, depois os links, depois o controle de sessão;
   - Início sempre; Canais seguidos e Meus vídeos só com `viewer`;
   - `aria-current="page"` pelo `usePathname`, nenhum ativo em `/results`;
   - o `showSubscriptionsLink` sai.
3. Preencher o `SearchForm` com o `q` corrente via `useSearchParams()` dentro de `<Suspense>`, para que o campo chegue preenchido em `/results` *(per home-busca/TD-06 — "a navbar precisa ler `q`")*.
4. Estender `components/layout/user-menu.tsx`:
   - avatar como `<Link href="/@{nickname}" aria-label="Seu canal">`;
   - "Sair" ligado ao `signOut` / `isSigningOut` do `useLogout`.
   
   Apagar `components/layout/channel-user-menu.tsx`, que fica sem consumidor.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `site-navbar.tsx` | Unit per testing-guide-next-frontend § "Client Components" — anônimo: Início, `SearchForm` e "Entrar", sem links do studio; logado: Início, Canais seguidos, Meus vídeos e o `UserMenu`; `aria-current` na rota corrente e em nenhum link em `/results`; campo de busca preenchido com o `q` da URL | `components/layout/__tests__/site-navbar.test.tsx` |
| `user-menu.tsx` | Unit — avatar com iniciais é link para `/@{nickname}` com rótulo "Seu canal"; "Sair" chama `signOut` e fica desabilitado com `isSigningOut` | `components/layout/__tests__/user-menu.test.tsx` |
| `user-menu.tsx` + `use-logout.ts` | Unit (wiring) — o clique em "Sair" faz o `POST /api/auth/logout` e navega para `/login` | `components/layout/__tests__/user-menu.wiring.test.tsx` |

**Dependencies:** SI-07.0.3 — `SearchForm`; SI-07.5 — `useLogout`; SI-07.7 — a navbar já é montada em layout

**Acceptance criteria:**

- A partir de `lg`, o visitante anônimo vê logo, busca, "Início" e "Entrar", e nenhum link do studio.
- A partir de `lg`, o usuário logado vê logo, busca, "Início", "Canais seguidos", "Meus vídeos", o avatar e "Sair".
- Clicar no avatar leva a `/@{nickname}` do próprio canal.
- Em `/results?q=docker`, o campo de busca da navbar chega com "docker".
- O link da rota corrente é anunciado como página atual, e em `/results` nenhum link é.

---

### SI-07.9 — Retrofit responsivo das telas existentes

**Description:** Aplicar as regras de §UI Contracts → Regras responsivas às telas que já existiam. Elas não têm frame mobile, então o layout é derivado por regra e os critérios são argumentados *(per home-busca/TD-08 — "Regras responsivas escritas, com frames mobile só para o que é novo")*.

**Technical actions:**

1. Trocar o gutter fixo `px-12` das páginas e layouts existentes por `px-4 lg:px-12`. Isso vale para a página do canal, a watch page e as telas de `(studio)`, `(auth)` e `/upload`.
2. Completar a grade da página do canal com `md:grid-cols-3`, para seguir 1 → 2 (`sm`) → 3 (`md`) → 4 (`lg`) colunas.
3. Garantir na watch page que player e conteúdo ocupam a largura cheia abaixo de `lg`, com a sidebar de sugestões abaixo do conteúdo. O `lg:flex-row` atual é mantido.
4. Envolver a tabela do painel (`components/videos/video-table.tsx` em `/channel/videos`) num contêiner `overflow-x-auto`, sem encolher colunas. Os formulários de auth, upload, edição e configurações do canal passam a ocupar a largura cheia do contêiner abaixo do breakpoint, mantendo a largura máxima atual acima.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| Telas existentes a 375px | E2E (Playwright, viewport 375×812): a página não tem rolagem horizontal (`scrollWidth <= innerWidth`) em `/@{nickname}`, `/videos/{publicId}`, `/login`, `/signup`, `/upload` e `/channel/videos`; nesta última, a tabela rola dentro do próprio contêiner; na watch page, as sugestões ficam abaixo do player | `tests/responsive-retrofit.e2e-spec.ts` |

**Dependencies:** SI-07.7 — as páginas já estão nos route groups novos

**Acceptance criteria:**

- A 375px de largura, nenhuma das telas existentes tem rolagem horizontal da página.
- A 375px, a grade da página do canal tem 1 coluna; a 1024px, tem 4.
- A 375px, a tabela do painel rola na horizontal dentro do próprio contêiner, e o resto da tela fica parado.
- A 375px, as sugestões da watch page aparecem abaixo do player; a 1024px, ao lado.

---

### SI-07.10.0 — Drift audit: Página inicial

**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=83-127
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Página inicial`

**Technical actions:**

1. **Drift audit** — invoke `figma:figma-implement-design` (narrow handoff per Decisão #31) with:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=83-127
   - Reused DS components: [`components/layout/site-navbar.tsx`, `components/layout/public-site-navbar.tsx`, `components/auth/brand-logo.tsx`, `components/icons/streamtube-icon.tsx`, `components/layout/search-form.tsx`, `components/icons/search-icon.tsx`, `components/ui/button.tsx`, `components/videos/category-filter.tsx`, `components/videos/category-chip.tsx`, `components/videos/video-grid.tsx`, `components/videos/video-card.tsx`, `components/ui/avatar.tsx`, `components/ui/pagination.tsx`]
   - Server-connected component names (no endpoints/auth/errors): [HomePage, PublicSiteNavbar, VideoCard]
   - Target paths (read-only context for audit; no writes here): `app/(site)/(feed)/page.tsx` + `components/videos/category-filter.tsx`, `components/videos/video-grid.tsx`, `components/videos/video-card.tsx`

   For each component in the Reused DS list, perform value-level diff against the file on disk and classify per the 4-value status enum (`alinhado` / `drift menor` / `drift relevante` / `componente ausente`). Compose Decision per default policy (see `.claude/skills/plan-build/references/frontend-drift-report-schema.md` § Default decisions per status). Read prior sections of `frontend-drift-report.md` to build `prior_decisions`; populate `Prior` column with CONFLICT detection (executed by `/implement` per its SKILL.md cross-screen consultation algorithm). Write a `## Screen: pagina-inicial — audited at SI-07.10.0 ({YYYY-MM-DD})` section to `frontend-drift-report.md` (append on first run, overwrite-in-place on re-run). **No code edits — verifiable via `git diff` at SI end.**

**Dependencies:** SI-07.0.2, SI-07.0.3, SI-07.0.4

**Tests:** _(empty — audit-only; the report is the deliverable)_

**Acceptance criteria:**

- `frontend-drift-report.md` exists in the plan folder; section `## Screen: pagina-inicial` exists with the current run's date in heading.
- Every component in the Reused DS list has exactly one row in the table.
- Every row has a Decision column populated per the schema (`alinhado` → `skip`; `drift menor` → `auto-Edit` or `exception`; `drift relevante` → `auto-Edit`, `exception` or `CONFLICT: …`; `componente ausente` → `create`).
- Every `exception` decision carries a one-liner justification.
- `git diff --name-only HEAD -- next-frontend` after the SI is empty.

---

### SI-07.10a — Tela de Página inicial (visual shell)

**Route:** /
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=83-127
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Página inicial`
**Drift Report:** see `frontend-drift-report.md` → `## Screen: pagina-inicial`

**Technical actions:**

1. **Apply drift decisions** — read the Drift Report section for this screen. For each row, parse the Decision column and apply per the verb body:
   - `auto-Edit "<specifics>"` → apply `Edit` on the named DS file with the documented specifics
   - `create` → create the file (icons via Figma asset; components per spec)
   - `exception` / `skip` → no-op
   - `CONFLICT: <one-liner>; <verb> "<specifics>"` → strip the `CONFLICT: <one-liner>;` prefix (informational only) and apply the verb body per the rules above

   No drift detection or auto-judgment in this step. The audit-SI did the analysis; this step is mechanical application.

2. **Visual shell generation** — invoke `figma:figma-implement-design` (narrow handoff per Decisão #31) with:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=83-127
   - Reused DS components: [`components/layout/site-navbar.tsx`, `components/layout/public-site-navbar.tsx`, `components/auth/brand-logo.tsx`, `components/icons/streamtube-icon.tsx`, `components/layout/search-form.tsx`, `components/icons/search-icon.tsx`, `components/ui/button.tsx`, `components/videos/category-filter.tsx`, `components/videos/category-chip.tsx`, `components/videos/video-grid.tsx`, `components/videos/video-card.tsx`, `components/ui/avatar.tsx`, `components/ui/pagination.tsx`] _(now reflecting any DS edits from action 1)_
   - Server-connected component names (no endpoints/auth/errors): [HomePage, PublicSiteNavbar, VideoCard]
   - Target paths: `app/(site)/(feed)/page.tsx` (substitui o placeholder do `create-next-app`) + `app/(site)/(feed)/loading.tsx`

**Dependencies:** SI-07.10.0 + SI-07.0.2, SI-07.0.3, SI-07.0.4, SI-07.7

**Tests:** _(empty — shell smoke-gated by build AC; Unit tests live in SI-Xb; E2E in /plan-test-specs spec)_

**Acceptance criteria:**

- All target paths exist, export expected components, and compile per `docker compose exec next-frontend npx tsc --noEmit`.
- A rota `/` mostra a faixa de chips, a grade de 12 cards e a paginação do desenho, sem o conteúdo do `create-next-app`.
- No runtime imports beyond Reused DS list (stays visually scoped).

---

### SI-07.10b — Tela de Página inicial (lógica & wiring)

**Test Specs:** see `next-frontend/specs/pagina-inicial.plan.md`
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Página inicial`

**Technical actions:**

1. **Rendering strategy** — `app/(site)/(feed)/page.tsx` é Server Component assíncrono, sem `"use client"`, e lê `searchParams` (`category`, `page`). A `category` só é repassada quando é um valor do enum de `contracts.ts`; fora disso é ignorada. A `page` é normalizada por `parsePage` *(per home-busca/TD-01, Revision de 2026-10-11)*.
2. **Endpoint wiring** — chamar `upstream.GET("/videos", { params: { query: { category, offset: toOffset(page, FEED_PAGE_SIZE), limit: FEED_PAGE_SIZE } } })`, com `FEED_PAGE_SIZE = 12` novo em `lib/pagination.ts` e tipos `VideoFeedPage` / `VideoFeedQuery` de `contracts.ts`. Repassar os itens à `VideoGrid` com `size` responsivo e `channel` em cada card *(per home-busca/TD-02 e home-busca/TD-03)*.
3. **Estados** — mensagem de vazio global ou por categoria (com "Ver todos os vídeos"); paginação só com `lastPage > 1`, com hrefs que preservam `category` e `aria-disabled` nas pontas, no padrão de `app/(site)/channels/[nickname]/page.tsx`; `app/(site)/(feed)/error.tsx` (`"use client"`) com "Tentar novamente" (`reset()`) *(per home-busca/TD-01 e home-busca/TD-02, Revisions de 2026-10-11)*.
4. **Error mapping** — um erro do upstream lança, e o `error.tsx` da listagem trata `RATE_LIMIT_EXCEEDED` e qualquer falha inesperada, conforme §UI Contracts → Página inicial → Error Catalog → UX mapping.

**Dependencies:**

- `SI-07.10a` (visual shell must exist before wiring).
- Backend SIs: `SI-07.3` — `GET /videos`.
- Shared-types SI: `SI-07.4` — `VideoFeedPage` em `contracts.ts` e o handler MSW.
- `SI-07.8` — navbar desktop com busca.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `lib/pagination.ts` | Unit per testing-guide-next-frontend § "utilities" — `FEED_PAGE_SIZE` é 12 e `toOffset(3, 12)` é 24 | `lib/__tests__/pagination.test.ts` |
| `app/(site)/(feed)/error.tsx` | Unit per testing-guide-next-frontend § "Client Components" — renderiza a mensagem e "Tentar novamente" chama `reset` | `app/(site)/(feed)/__tests__/error.test.tsx` |

A página é async RSC, coberta só por E2E, que vem do spec do `/plan-test-specs`.

**Acceptance criteria:**

- `/` mostra os 12 vídeos publicados mais recentes, cada um com thumbnail, duração, título, canal, visualizações e tempo de publicação.
- `/?category=Música` mostra só vídeos de Música, com o chip "Música" selecionado, e a paginação preserva a categoria.
- `/?page=2` mostra os vídeos 13 a 24.
- `/?category=Culinária` lista sem filtro, sem erro.
- Uma categoria sem vídeos mostra "Nenhum vídeo em {categoria}." e o link para ver todos.
- Com uma página só, a paginação não aparece.

---

### SI-07.11.0 — Drift audit: Resultados da busca

**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=83-311
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Resultados da busca`

**Technical actions:**

1. **Drift audit** — invoke `figma:figma-implement-design` (narrow handoff per Decisão #31) with:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=83-311
   - Reused DS components: [`components/layout/site-navbar.tsx`, `components/layout/public-site-navbar.tsx`, `components/auth/brand-logo.tsx`, `components/icons/streamtube-icon.tsx`, `components/layout/search-form.tsx`, `components/ui/input.tsx`, `components/icons/search-icon.tsx`, `components/ui/button.tsx`, `components/layout/user-menu.tsx`, `components/ui/avatar.tsx`, `components/videos/video-grid.tsx`, `components/videos/video-card.tsx`, `components/ui/pagination.tsx`]
   - Server-connected component names (no endpoints/auth/errors): [ResultsPage, PublicSiteNavbar, VideoCard]
   - Target paths (read-only context for audit; no writes here): `app/(site)/(feed)/results/page.tsx` + `components/layout/search-form.tsx`, `components/videos/video-grid.tsx`

   For each component in the Reused DS list, perform value-level diff against the file on disk and classify per the 4-value status enum (`alinhado` / `drift menor` / `drift relevante` / `componente ausente`). Compose Decision per default policy (see `.claude/skills/plan-build/references/frontend-drift-report-schema.md` § Default decisions per status). Read prior sections of `frontend-drift-report.md` to build `prior_decisions`; populate `Prior` column with CONFLICT detection. Write a `## Screen: resultados-da-busca — audited at SI-07.11.0 ({YYYY-MM-DD})` section to `frontend-drift-report.md` (append on first run, overwrite-in-place on re-run). **No code edits — verifiable via `git diff` at SI end.**

**Dependencies:** SI-07.0.3, SI-07.0.4

**Tests:** _(empty — audit-only; the report is the deliverable)_

**Acceptance criteria:**

- `frontend-drift-report.md` exists in the plan folder; section `## Screen: resultados-da-busca` exists with the current run's date in heading.
- Every component in the Reused DS list has exactly one row in the table.
- Every row has a Decision column populated per the schema.
- Every `exception` decision carries a one-liner justification.
- `git diff --name-only HEAD -- next-frontend` after the SI is empty.

---

### SI-07.11a — Tela de Resultados da busca (visual shell)

**Route:** /results
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=83-311
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Resultados da busca`
**Drift Report:** see `frontend-drift-report.md` → `## Screen: resultados-da-busca`

**Technical actions:**

1. **Apply drift decisions** — read the Drift Report section for this screen. For each row, parse the Decision column and apply per the verb body (`auto-Edit "<specifics>"` → `Edit` on the named DS file; `create` → create the file; `exception` / `skip` → no-op; `CONFLICT: <one-liner>; <verb> "<specifics>"` → strip the prefix and apply the verb body). No drift detection or auto-judgment in this step.
2. **Visual shell generation** — invoke `figma:figma-implement-design` (narrow handoff per Decisão #31) with:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=83-311
   - Reused DS components: [`components/layout/site-navbar.tsx`, `components/layout/public-site-navbar.tsx`, `components/auth/brand-logo.tsx`, `components/icons/streamtube-icon.tsx`, `components/layout/search-form.tsx`, `components/ui/input.tsx`, `components/icons/search-icon.tsx`, `components/ui/button.tsx`, `components/layout/user-menu.tsx`, `components/ui/avatar.tsx`, `components/videos/video-grid.tsx`, `components/videos/video-card.tsx`, `components/ui/pagination.tsx`] _(now reflecting any DS edits from action 1)_
   - Server-connected component names (no endpoints/auth/errors): [ResultsPage, PublicSiteNavbar, VideoCard]
   - Target paths: `app/(site)/(feed)/results/page.tsx`, incluindo o `ResultsHeading` como markup da página

**Dependencies:** SI-07.11.0 + SI-07.0.3, SI-07.0.4, SI-07.7

**Tests:** _(empty — shell smoke-gated by build AC; Unit tests live in SI-Xb; E2E in /plan-test-specs spec)_

**Acceptance criteria:**

- All target paths exist, export expected components, and compile per `docker compose exec next-frontend npx tsc --noEmit`.
- A rota `/results` mostra o `ResultsHeading`, a grade e a paginação do desenho.
- No runtime imports beyond Reused DS list (stays visually scoped).

---

### SI-07.11b — Tela de Resultados da busca (lógica & wiring)

**Test Specs:** see `next-frontend/specs/resultados-da-busca.plan.md`
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Resultados da busca`

**Technical actions:**

1. **Termo da URL** — criar `lib/search.ts` com `parseSearchTerm(raw)`, que apara o termo e o classifica em `empty`, `short` (1–2 caracteres) ou `valid` (3–100), espelhando a validação do backend *(per home-busca/TD-04, Revision de 2026-10-11)*.
2. **Rendering strategy** — `app/(site)/(feed)/results/page.tsx` é Server Component assíncrono e lê `q` e `page`:
   - `empty` → `redirect("/")`;
   - `short` → o aviso "Digite pelo menos 3 caracteres para buscar.", sem chamar o upstream;
   - `valid` → busca.
   
   `generateMetadata` dá o título "Resultados para “{q}”".
3. **Endpoint wiring** — com termo válido, `upstream.GET("/videos", { params: { query: { q, offset: toOffset(page, FEED_PAGE_SIZE), limit: FEED_PAGE_SIZE } } })`. Repassar os itens à `VideoGrid`, e o termo e o `total` ao `ResultsHeading`, com a contagem por `formatVideosCount` ("1 vídeo" / "N vídeos") *(per home-busca/TD-01, home-busca/TD-04, home-busca/TD-05)*.
4. **Paginação e erro** — paginação só com mais de uma página, hrefs `?q={termo}&page=N`, `aria-disabled` nas pontas. Erro do upstream cai no `app/(site)/(feed)/error.tsx` do SI-07.10b *(per home-busca/TD-02, Revision de 2026-10-11)*.

**Dependencies:**

- `SI-07.11a` (visual shell must exist before wiring).
- Backend SIs: `SI-07.3` — `GET /videos`.
- Shared-types SI: `SI-07.4` — `contracts.ts` e o handler MSW.
- `SI-07.10b` — `FEED_PAGE_SIZE` e o `error.tsx` da listagem.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `lib/search.ts` | Unit per testing-guide-next-frontend § "utilities" — `undefined`, `""` e `"   "` → `empty`; `"ab"` e `" ab "` → `short`; `"abc"` → `valid` com o termo aparado; array de valores usa o primeiro; mais de 100 caracteres não é `valid` | `lib/__tests__/search.test.ts` |

A página é async RSC, coberta só por E2E, que vem do spec do `/plan-test-specs`.

**Acceptance criteria:**

- `/results?q=docker` mostra "Resultados para “docker”", a contagem e os vídeos cujo título, canal ou nickname casa com "docker", do mais recente ao mais antigo.
- Um vídeo cujo título não contém o termo, mas cujo canal contém, aparece nos resultados como vídeo comum.
- `/results?q=ab` mostra o aviso de mínimo de 3 caracteres e não chama o upstream.
- `/results` e `/results?q=%20` redirecionam para `/`.
- A paginação de `/results?q=docker` preserva o termo nos links.

---

### SI-07.12.0 — Drift audit: Resultados da busca — sem resultados

**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=83-437
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Resultados da busca — sem resultados`

**Technical actions:**

1. **Drift audit** — invoke `figma:figma-implement-design` (narrow handoff per Decisão #31) with:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=83-437
   - Reused DS components: [`components/layout/site-navbar.tsx`, `components/layout/public-site-navbar.tsx`, `components/auth/brand-logo.tsx`, `components/icons/streamtube-icon.tsx`, `components/layout/search-form.tsx`, `components/ui/input.tsx`, `components/icons/search-icon.tsx`, `components/ui/button.tsx`, `components/layout/user-menu.tsx`, `components/ui/avatar.tsx`, `components/videos/search-empty-state.tsx`]
   - Server-connected component names (no endpoints/auth/errors): [ResultsPage]
   - Target paths (read-only context for audit; no writes here): `app/(site)/(feed)/results/page.tsx` + `components/videos/search-empty-state.tsx`

   For each component in the Reused DS list, perform value-level diff against the file on disk and classify per the 4-value status enum. Compose Decision per default policy (see `.claude/skills/plan-build/references/frontend-drift-report-schema.md` § Default decisions per status). Read prior sections of `frontend-drift-report.md` to build `prior_decisions`; populate `Prior` column with CONFLICT detection. Write a `## Screen: resultados-da-busca-sem-resultados — audited at SI-07.12.0 ({YYYY-MM-DD})` section to `frontend-drift-report.md`. **No code edits — verifiable via `git diff` at SI end.**

**Dependencies:** SI-07.0.3, SI-07.0.4

**Tests:** _(empty — audit-only; the report is the deliverable)_

**Acceptance criteria:**

- `frontend-drift-report.md` exists in the plan folder; section `## Screen: resultados-da-busca-sem-resultados` exists with the current run's date in heading.
- Every component in the Reused DS list has exactly one row in the table.
- Every row has a Decision column populated per the schema.
- Every `exception` decision carries a one-liner justification.
- `git diff --name-only HEAD -- next-frontend` after the SI is empty.

---

### SI-07.12a — Tela de Resultados da busca — sem resultados (visual shell)

**Route:** /results (estado com zero vídeos)
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=83-437
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Resultados da busca — sem resultados`
**Drift Report:** see `frontend-drift-report.md` → `## Screen: resultados-da-busca-sem-resultados`

**Technical actions:**

1. **Apply drift decisions** — read the Drift Report section for this screen. For each row, parse the Decision column and apply per the verb body (`auto-Edit "<specifics>"` → `Edit` on the named DS file; `create` → create the file; `exception` / `skip` → no-op; `CONFLICT: <one-liner>; <verb> "<specifics>"` → strip the prefix and apply the verb body). No drift detection or auto-judgment in this step.
2. **Visual shell generation** — invoke `figma:figma-implement-design` (narrow handoff per Decisão #31) with:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=83-437
   - Reused DS components: [`components/layout/site-navbar.tsx`, `components/layout/public-site-navbar.tsx`, `components/auth/brand-logo.tsx`, `components/icons/streamtube-icon.tsx`, `components/layout/search-form.tsx`, `components/ui/input.tsx`, `components/icons/search-icon.tsx`, `components/ui/button.tsx`, `components/layout/user-menu.tsx`, `components/ui/avatar.tsx`, `components/videos/search-empty-state.tsx`] _(now reflecting any DS edits from action 1)_
   - Server-connected component names (no endpoints/auth/errors): [ResultsPage]
   - Target paths: `components/videos/search-empty-state.tsx` (badge, título, dica e "Voltar para o início" do frame 83:437)

**Dependencies:** SI-07.12.0 + SI-07.0.3, SI-07.0.4, SI-07.11a

**Tests:** _(empty — shell smoke-gated by build AC; Unit tests live in SI-Xb; E2E in /plan-test-specs spec)_

**Acceptance criteria:**

- All target paths exist, export expected components, and compile per `docker compose exec next-frontend npx tsc --noEmit`.
- O `SearchEmptyState` renderiza o badge com o glifo de busca, o título com o termo, a dica e o link "Voltar para o início".
- No runtime imports beyond Reused DS list (stays visually scoped).

---

### SI-07.12b — Tela de Resultados da busca — sem resultados (lógica & wiring)

**Test Specs:** see `next-frontend/specs/resultados-da-busca-sem-resultados.plan.md`
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Resultados da busca — sem resultados`

**Technical actions:**

1. **Endpoint wiring** — na `ResultsPage`, quando a resposta de `GET /videos?q` tem `total === 0`, renderizar `<SearchEmptyState q={termo} />` no lugar do `ResultsHeading`, da grade e da paginação *(per home-busca/TD-05)*. É a mesma chamada do SI-07.11b, só com outro ramo de renderização.
2. **Rendering strategy** — o termo chega ao `SearchEmptyState` por props e é renderizado como texto. Abaixo de `sm`, o estado fica em coluna única pelas regras responsivas *(per home-busca/TD-08)*.

**Dependencies:**

- `SI-07.12a` (visual shell must exist before wiring).
- Backend SIs: `SI-07.3` — `GET /videos`.
- `SI-07.11b` — a `ResultsPage` e a chamada à busca.

**Tests:** _(empty — o estado é ramo de render de uma página async RSC, coberto só por E2E no spec do /plan-test-specs)_

**Acceptance criteria:**

- `/results?q=xyzabc`, com zero vídeos, mostra "Nenhum vídeo encontrado para “xyzabc”", a dica e o link "Voltar para o início", sem contagem, grade nem paginação.
- O link "Voltar para o início" leva a `/`.
- Um termo com HTML, como `<b>x</b>`, aparece literalmente no título, sem ser interpretado.

---

### SI-07.13.0 — Drift audit: Página inicial — mobile

**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=84-299
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Página inicial — mobile`

**Technical actions:**

1. **Drift audit** — invoke `figma:figma-implement-design` (narrow handoff per Decisão #31) with:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=84-299
   - Reused DS components: [`components/layout/site-navbar.tsx`, `components/layout/public-site-navbar.tsx`, `components/auth/brand-logo.tsx`, `components/icons/streamtube-icon.tsx`, `components/ui/icon-button.tsx`, `components/icons/search-icon.tsx`, `components/icons/menu-icon.tsx`, `components/videos/category-filter.tsx`, `components/videos/category-chip.tsx`, `components/videos/video-grid.tsx`, `components/videos/video-card.tsx`, `components/ui/avatar.tsx`, `components/ui/pagination.tsx`]
   - Server-connected component names (no endpoints/auth/errors): [HomePage, PublicSiteNavbar, VideoCard]
   - Target paths (read-only context for audit; no writes here): `app/(site)/(feed)/page.tsx` + `components/layout/site-navbar.tsx`, `components/videos/category-filter.tsx`, `components/videos/video-grid.tsx`, `components/videos/video-card.tsx`

   For each component in the Reused DS list, perform value-level diff against the file on disk and classify per the 4-value status enum. Record the Pagination text-vs-chevron divergence below `sm` as `exception "DS mantido sem alteração por home-busca/TD-02, Revision de 2026-10-11"`. Compose Decision per default policy (see `.claude/skills/plan-build/references/frontend-drift-report-schema.md` § Default decisions per status). Read prior sections of `frontend-drift-report.md` to build `prior_decisions`; populate `Prior` column with CONFLICT detection. Write a `## Screen: pagina-inicial-mobile — audited at SI-07.13.0 ({YYYY-MM-DD})` section to `frontend-drift-report.md`. **No code edits — verifiable via `git diff` at SI end.**

**Dependencies:** SI-07.0.2, SI-07.0.3, SI-07.0.4

**Tests:** _(empty — audit-only; the report is the deliverable)_

**Acceptance criteria:**

- `frontend-drift-report.md` exists in the plan folder; section `## Screen: pagina-inicial-mobile` exists with the current run's date in heading.
- Every component in the Reused DS list has exactly one row in the table.
- Every row has a Decision column populated per the schema.
- Every `exception` decision carries a one-liner justification.
- `git diff --name-only HEAD -- next-frontend` after the SI is empty.

---

### SI-07.13a — Tela de Página inicial — mobile (visual shell)

**Route:** / (viewport 375px)
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=84-299
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Página inicial — mobile`
**Drift Report:** see `frontend-drift-report.md` → `## Screen: pagina-inicial-mobile`

**Technical actions:**

1. **Apply drift decisions** — read the Drift Report section for this screen. For each row, parse the Decision column and apply per the verb body (`auto-Edit "<specifics>"` → `Edit` on the named DS file; `create` → create the file; `exception` / `skip` → no-op; `CONFLICT: <one-liner>; <verb> "<specifics>"` → strip the prefix and apply the verb body). No drift detection or auto-judgment in this step.
2. **Visual shell generation** — invoke `figma:figma-implement-design` (narrow handoff per Decisão #31) with:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=84-299
   - Reused DS components: [`components/layout/site-navbar.tsx`, `components/layout/public-site-navbar.tsx`, `components/auth/brand-logo.tsx`, `components/icons/streamtube-icon.tsx`, `components/ui/icon-button.tsx`, `components/icons/search-icon.tsx`, `components/icons/menu-icon.tsx`, `components/videos/category-filter.tsx`, `components/videos/category-chip.tsx`, `components/videos/video-grid.tsx`, `components/videos/video-card.tsx`, `components/ui/avatar.tsx`, `components/ui/pagination.tsx`] _(now reflecting any DS edits from action 1)_
   - Server-connected component names (no endpoints/auth/errors): [HomePage, PublicSiteNavbar, VideoCard]
   - Target paths: `components/layout/site-navbar.tsx`, para a barra fechada abaixo de `lg` (BrandLogo + `navbar-actions` com `SearchToggleButton` e `MenuButton`); e as classes responsivas de `app/(site)/(feed)/page.tsx`, para a faixa de chips rolável, a grade em coluna única e a paginação centralizada

**Dependencies:** SI-07.13.0 + SI-07.0.2, SI-07.0.3, SI-07.0.4, SI-07.10a

**Tests:** _(empty — shell smoke-gated by build AC; Unit tests live in SI-Xb; E2E in /plan-test-specs spec)_

**Acceptance criteria:**

- All target paths exist, export expected components, and compile per `docker compose exec next-frontend npx tsc --noEmit`.
- A 375px, a barra mostra só a marca e os dois botões de ícone, e a grade fica em coluna única com cards na largura do contêiner.
- No runtime imports beyond Reused DS list (stays visually scoped).

---

### SI-07.13b — Tela de Página inicial — mobile (lógica & wiring)

**Test Specs:** see `next-frontend/specs/pagina-inicial-mobile.plan.md`
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Página inicial — mobile`

**Technical actions:**

1. **Rendering strategy** — a troca de layout é só CSS, sem detecção de dispositivo no servidor: abaixo de `lg` a `SiteNavbar` mostra a barra fechada, e a partir de `lg`, a barra completa do SI-07.8 *(per home-busca/TD-08)*. A `HomePage` não muda de lógica: a mesma chamada do SI-07.10b alimenta a coluna única.
2. **Estado da barra mobile** — na `SiteNavbar` (`"use client"`), guardar:
   - `searchOpen`: o `SearchToggleButton` abre a busca, com `aria-expanded` e `aria-controls`, e foca o input;
   - `menuOpen`: o `MenuButton` abre a `NavigationSheet`, que recebe `viewer`, `pathname` e o `signOut` / `isSigningOut` do `useLogout` *(per home-busca/TD-07, Revision de 2026-10-11)*.
3. **Sem controle de sessão na barra fechada** — abaixo de `lg`, nem "Entrar" nem avatar aparecem na barra, para anônimo e para logado; o acesso fica no sheet *(per home-busca/TD-07, Revision de 2026-10-11)*.

**Dependencies:**

- `SI-07.13a` (visual shell must exist before wiring).
- `SI-07.0.3` — `NavigationSheet` e `SearchForm`.
- `SI-07.8` — `viewer` e `useLogout` na `SiteNavbar`.
- `SI-07.10b` — a `HomePage` ligada ao upstream.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `site-navbar.tsx` | Unit per testing-guide-next-frontend § "Client Components" — `SearchToggleButton` alterna `aria-expanded` e foca o input; `MenuButton` abre a `NavigationSheet` com o `viewer` recebido; a barra fechada não renderiza "Entrar" nem avatar | `components/layout/__tests__/site-navbar.test.tsx` |

**Acceptance criteria:**

- A 375px, `/` mostra a marca, o botão de busca e o botão de menu, sem "Entrar" e sem avatar na barra.
- A 375px, tocar no botão de busca expande o campo e o deixa com foco.
- A 375px, tocar no botão de menu abre o menu de navegação.
- A 375px, a faixa de categorias rola na horizontal e a grade fica em coluna única.

---

### SI-07.14.0 — Drift audit: Resultados da busca — mobile

**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=84-379
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Resultados da busca — mobile`

**Technical actions:**

1. **Drift audit** — invoke `figma:figma-implement-design` (narrow handoff per Decisão #31) with:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=84-379
   - Reused DS components: [`components/layout/site-navbar.tsx`, `components/ui/icon-button.tsx`, `components/icons/arrow-back-icon.tsx`, `components/layout/search-form.tsx`, `components/icons/search-icon.tsx`, `components/videos/video-grid.tsx`, `components/videos/video-card.tsx`, `components/ui/avatar.tsx`, `components/ui/pagination.tsx`]
   - Server-connected component names (no endpoints/auth/errors): [ResultsPage, VideoCard]
   - Target paths (read-only context for audit; no writes here): `app/(site)/(feed)/results/page.tsx` + `components/layout/site-navbar.tsx`, `components/layout/search-form.tsx`

   For each component in the Reused DS list, perform value-level diff against the file on disk and classify per the 4-value status enum. Compose Decision per default policy (see `.claude/skills/plan-build/references/frontend-drift-report-schema.md` § Default decisions per status). Read prior sections of `frontend-drift-report.md` to build `prior_decisions`; populate `Prior` column with CONFLICT detection. Write a `## Screen: resultados-da-busca-mobile — audited at SI-07.14.0 ({YYYY-MM-DD})` section to `frontend-drift-report.md`. **No code edits — verifiable via `git diff` at SI end.**

**Dependencies:** SI-07.0.3, SI-07.0.4

**Tests:** _(empty — audit-only; the report is the deliverable)_

**Acceptance criteria:**

- `frontend-drift-report.md` exists in the plan folder; section `## Screen: resultados-da-busca-mobile` exists with the current run's date in heading.
- Every component in the Reused DS list has exactly one row in the table.
- Every row has a Decision column populated per the schema.
- Every `exception` decision carries a one-liner justification.
- `git diff --name-only HEAD -- next-frontend` after the SI is empty.

---

### SI-07.14a — Tela de Resultados da busca — mobile (visual shell)

**Route:** /results (viewport 375px, busca expandida)
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=84-379
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Resultados da busca — mobile`
**Drift Report:** see `frontend-drift-report.md` → `## Screen: resultados-da-busca-mobile`

**Technical actions:**

1. **Apply drift decisions** — read the Drift Report section for this screen. For each row, parse the Decision column and apply per the verb body (`auto-Edit "<specifics>"` → `Edit` on the named DS file; `create` → create the file; `exception` / `skip` → no-op; `CONFLICT: <one-liner>; <verb> "<specifics>"` → strip the prefix and apply the verb body). No drift detection or auto-judgment in this step.
2. **Visual shell generation** — invoke `figma:figma-implement-design` (narrow handoff per Decisão #31) with:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=84-379
   - Reused DS components: [`components/layout/site-navbar.tsx`, `components/ui/icon-button.tsx`, `components/icons/arrow-back-icon.tsx`, `components/layout/search-form.tsx`, `components/icons/search-icon.tsx`, `components/videos/video-grid.tsx`, `components/videos/video-card.tsx`, `components/ui/avatar.tsx`, `components/ui/pagination.tsx`] _(now reflecting any DS edits from action 1)_
   - Server-connected component names (no endpoints/auth/errors): [ResultsPage, VideoCard]
   - Target paths: `components/layout/site-navbar.tsx`, para o estado de busca expandida (`SearchBackButton` + `SearchForm` na variante `mobile`, ocupando a barra inteira); e as classes responsivas de `app/(site)/(feed)/results/page.tsx`, para o heading, a coluna única e a paginação centralizada

**Dependencies:** SI-07.14.0 + SI-07.0.3, SI-07.0.4, SI-07.11a, SI-07.13a

**Tests:** _(empty — shell smoke-gated by build AC; Unit tests live in SI-Xb; E2E in /plan-test-specs spec)_

**Acceptance criteria:**

- All target paths exist, export expected components, and compile per `docker compose exec next-frontend npx tsc --noEmit`.
- O estado expandido mostra só o botão de voltar e o formulário de busca, com o submit só com ícone.
- No runtime imports beyond Reused DS list (stays visually scoped).

---

### SI-07.14b — Tela de Resultados da busca — mobile (lógica & wiring)

**Test Specs:** see `next-frontend/specs/resultados-da-busca-mobile.plan.md`
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Resultados da busca — mobile`

**Technical actions:**

1. **Estado inicial em `/results`** — abaixo de `lg`, a barra começa expandida, com o `SearchForm` preenchido com o `q` corrente, como no frame 84:379. Nas outras rotas começa fechada. _Premissa do build:_ o desenho só mostra `/results` expandido, e nenhum TD fixa o estado inicial *(per home-busca/TD-07)*.
2. **Recolher a busca** — o `SearchBackButton` (`aria-label="Fechar busca"`) fecha a busca e devolve o foco ao `SearchToggleButton`. Expandir pelo toggle foca o input.
3. **Envio** — o submit só com ícone (`aria-label="Buscar"`) navega para `/results?q={termo}`, com a mesma validação do desktop (`required`, `minLength={3}`, `maxLength={100}`) *(per home-busca/TD-06 e home-busca/TD-04, Revision de 2026-10-11)*.

**Dependencies:**

- `SI-07.14a` (visual shell must exist before wiring).
- `SI-07.13b` — o estado da barra mobile na `SiteNavbar`.
- `SI-07.11b` — a `ResultsPage` ligada ao upstream.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `site-navbar.tsx` | Unit per testing-guide-next-frontend § "Client Components" — em `/results` a busca começa expandida e com o `q`; o `SearchBackButton` recolhe e devolve o foco ao toggle; fora de `/results` começa recolhida | `components/layout/__tests__/site-navbar.test.tsx` |

**Acceptance criteria:**

- A 375px, `/results?q=docker` abre com o campo de busca expandido e preenchido com "docker", e a lista em coluna única.
- Tocar em "Fechar busca" devolve a barra com a marca e os dois botões, e o foco volta ao botão de busca.
- A 375px, enviar um termo novo pelo ícone leva aos resultados desse termo.

---

### SI-07.15.0 — Drift audit: Menu de navegação — mobile

**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=84-425
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Menu de navegação — mobile`

**Technical actions:**

1. **Drift audit** — invoke `figma:figma-implement-design` (narrow handoff per Decisão #31) with:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=84-425
   - Reused DS components: [`components/layout/site-navbar.tsx`, `components/layout/public-site-navbar.tsx`, `components/auth/brand-logo.tsx`, `components/icons/streamtube-icon.tsx`, `components/ui/icon-button.tsx`, `components/icons/search-icon.tsx`, `components/icons/menu-icon.tsx`, `components/icons/x-icon.tsx`, `components/videos/category-filter.tsx`, `components/videos/category-chip.tsx`, `components/videos/video-grid.tsx`, `components/videos/video-card.tsx`, `components/ui/avatar.tsx`, `components/layout/navigation-sheet.tsx`, `components/ui/button.tsx`, `components/ui/sheet.tsx`]
   - Server-connected component names (no endpoints/auth/errors): [PublicSiteNavbar, SairButton]
   - Target paths (read-only context for audit; no writes here): `components/layout/navigation-sheet.tsx`, `components/ui/sheet.tsx`

   For each component in the Reused DS list, perform value-level diff against the file on disk and classify per the 4-value status enum. Compose Decision per default policy (see `.claude/skills/plan-build/references/frontend-drift-report-schema.md` § Default decisions per status). Read prior sections of `frontend-drift-report.md` to build `prior_decisions`; populate `Prior` column with CONFLICT detection. Write a `## Screen: menu-de-navegacao-mobile — audited at SI-07.15.0 ({YYYY-MM-DD})` section to `frontend-drift-report.md`. **No code edits — verifiable via `git diff` at SI end.**

**Dependencies:** SI-07.0.1, SI-07.0.2, SI-07.0.3, SI-07.0.4

**Tests:** _(empty — audit-only; the report is the deliverable)_

**Acceptance criteria:**

- `frontend-drift-report.md` exists in the plan folder; section `## Screen: menu-de-navegacao-mobile` exists with the current run's date in heading.
- Every component in the Reused DS list has exactly one row in the table.
- Every row has a Decision column populated per the schema.
- Every `exception` decision carries a one-liner justification.
- `git diff --name-only HEAD -- next-frontend` after the SI is empty.

---

### SI-07.15a — Tela de Menu de navegação — mobile (visual shell)

**Route:** / (viewport 375px, menu aberto); o sheet é chrome global
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=84-425
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Menu de navegação — mobile`
**Drift Report:** see `frontend-drift-report.md` → `## Screen: menu-de-navegacao-mobile`

**Technical actions:**

1. **Apply drift decisions** — read the Drift Report section for this screen. For each row, parse the Decision column and apply per the verb body (`auto-Edit "<specifics>"` → `Edit` on the named DS file; `create` → create the file; `exception` / `skip` → no-op; `CONFLICT: <one-liner>; <verb> "<specifics>"` → strip the prefix and apply the verb body). No drift detection or auto-judgment in this step.
2. **Visual shell generation** — invoke `figma:figma-implement-design` (narrow handoff per Decisão #31) with:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=84-425
   - Reused DS components: [`components/layout/site-navbar.tsx`, `components/layout/public-site-navbar.tsx`, `components/auth/brand-logo.tsx`, `components/icons/streamtube-icon.tsx`, `components/ui/icon-button.tsx`, `components/icons/search-icon.tsx`, `components/icons/menu-icon.tsx`, `components/icons/x-icon.tsx`, `components/videos/category-filter.tsx`, `components/videos/category-chip.tsx`, `components/videos/video-grid.tsx`, `components/videos/video-card.tsx`, `components/ui/avatar.tsx`, `components/layout/navigation-sheet.tsx`, `components/ui/button.tsx`, `components/ui/sheet.tsx`] _(now reflecting any DS edits from action 1)_
   - Server-connected component names (no endpoints/auth/errors): [PublicSiteNavbar, SairButton]
   - Target paths: `components/layout/navigation-sheet.tsx` — painel de 288px à direita com header "Menu" + fechar, `sheet-user`, divisores, os três links (o ativo destacado) e "Sair" outline

**Dependencies:** SI-07.15.0 + SI-07.0.1, SI-07.0.2, SI-07.0.3, SI-07.0.4, SI-07.13a

**Tests:** _(empty — shell smoke-gated by build AC; Unit tests live in SI-Xb; E2E in /plan-test-specs spec)_

**Acceptance criteria:**

- All target paths exist, export expected components, and compile per `docker compose exec next-frontend npx tsc --noEmit`.
- O sheet aberto reproduz a estrutura do frame 84:488: header, identidade, links, divisores e "Sair".
- No runtime imports beyond Reused DS list (stays visually scoped).

---

### SI-07.15b — Tela de Menu de navegação — mobile (lógica & wiring)

**Test Specs:** see `next-frontend/specs/menu-de-navegacao-mobile.plan.md`
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Menu de navegação — mobile`

**Technical actions:**

1. **Identidade** — o `PublicSiteNavbar` entrega à `SiteNavbar` o `viewer` com `name` e `nickname`, de `GET /me/channel` por `getViewerChannel()`. A `SiteNavbar` o repassa à `NavigationSheet`, cujo `sheet-user` mostra avatar (iniciais por `initialsOf`), nome e `@nickname`, como link "Seu canal" para `/@{nickname}` *(per home-busca/TD-07, Revision de 2026-10-11)*.
2. **Variantes** — sem `viewer`, o sheet mostra "Entrar" (link para `/login`) no lugar de `sheet-user` e "Sair", e só o link Início. Com `viewer`, mostra Início, Canais seguidos e Meus vídeos, e "Sair" *(per home-busca/TD-07, Revision de 2026-10-11)*.
3. **Navegação e fechamento** — cada link do sheet e o `sheet-user` navegam e fecham o sheet. O link da rota corrente leva `aria-current="page"`. O título "Menu" é o título acessível do diálogo, e o foco volta ao `MenuButton` ao fechar.
4. **Logout** — o "Sair" chama o `signOut` do `useLogout` e fica desabilitado enquanto `isSigningOut` *(per home-busca/TD-07, Revision de 2026-10-11 — logout compartilhado)*.

**Dependencies:**

- `SI-07.15a` (visual shell must exist before wiring).
- `SI-07.5` — `useLogout`.
- `SI-07.8` — `viewer` com `nickname` na `SiteNavbar`.
- `SI-07.13b` — o `MenuButton` que abre o sheet.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `navigation-sheet.tsx` | Unit per testing-guide-next-frontend § "Client Components" — com `viewer`: nome, `@nickname`, `sheet-user` como link para `/@{nickname}`, três links e "Sair"; sem `viewer`: "Entrar" para `/login`, só Início, sem "Sair"; clicar num link fecha o sheet; `aria-current` na rota corrente | `components/layout/__tests__/navigation-sheet.test.tsx` |
| `navigation-sheet.tsx` + `use-logout.ts` | Unit (wiring) — "Sair" faz o `POST /api/auth/logout` e navega para `/login`; desabilitado durante a chamada | `components/layout/__tests__/navigation-sheet.wiring.test.tsx` |

**Acceptance criteria:**

- A 375px, logado, o menu mostra o nome e o `@nickname` do próprio canal, os links Início, Canais seguidos e Meus vídeos, e "Sair".
- A 375px, anônimo, o menu mostra "Entrar" e só o link Início.
- Tocar no nome do usuário no menu leva à página pública do próprio canal.
- Tocar em "Sair" no menu encerra a sessão e leva a `/login`.
- Esc, o botão fechar ou um toque fora do painel fecham o menu, e o foco volta ao botão de menu.

---

## Technical Specifications

### Data Model

Nenhuma entidade nova e nenhuma coluna nova. A fatia acrescenta **uma migration de índices e extensões** que serve a listagem global e a busca.

**Estado no repositório, verificado em 2026-10-11:**
- `videos` tem só `@Index(['channel_id', 'published_at'])` e índices simples em `channel_id` e `status`. Nenhum serve uma consulta sem `channel_id` *(per home-busca/TD-03 — "hoje não há índice útil para uma consulta sem `channel_id`")*.
- `channels` tem `name varchar(50)` e `nickname varchar(50) unique`.
- Não existe extensão de texto instalada.
- As migrations ficam em `nestjs-project/src/database/migrations/`. Toda migration nova entra em `ALL_MIGRATIONS` de `src/test/test-database.ts`; o `globalSetup` falha listando o arquivo que faltar.

#### Migration — `CreateVideoFeedAndSearchIndexes` (nova)

| Objeto | Definição | Por quê |
|--------|-----------|---------|
| extensão `pg_trgm` | `CREATE EXTENSION IF NOT EXISTS pg_trgm` | Índice GIN de trigramas para casar trecho *(per home-busca/TD-04)* |
| extensão `unaccent` | `CREATE EXTENSION IF NOT EXISTS unaccent` | Casamento sem acento ("musica" acha "Música") *(per home-busca/TD-04)* |
| função `immutable_unaccent(text)` | `LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT`, corpo `SELECT public.unaccent('public.unaccent'::regdictionary, $1)` | O `unaccent()` é `STABLE`, e o índice de expressão exige um wrapper `IMMUTABLE` com o dicionário qualificado por schema *(per home-busca/TD-04)* |
| índice `videos_title_search_idx` | `GIN (immutable_unaccent(lower(title)) gin_trgm_ops)` em `videos` | Busca por título |
| índice `channels_name_search_idx` | `GIN (immutable_unaccent(lower(name)) gin_trgm_ops)` em `channels` | Busca pelo nome do canal |
| índice `channels_nickname_search_idx` | `GIN (nickname gin_trgm_ops)` em `channels` | Busca pelo nickname. O allowlist `[a-z0-9_]` já é minúsculo e sem acento *(per phase-02-auth/TD-10)*, então não leva `lower()` nem `unaccent` |
| índice `videos_listable_published_idx` | `(published_at DESC, id DESC) WHERE published_at IS NOT NULL AND visibility = 'public'` em `videos` | Índice parcial sobre os vídeos listáveis que "cobre home e filtro por categoria" *(per home-busca/TD-03)* |

**`down`** remove os quatro índices, a função e as duas extensões, nessa ordem.

**Entidades.** `Video` e `Channel` declaram esses índices com `@Index('<nome>', { synchronize: false })`, sem colunas. A expressão e o `WHERE` parcial não são representáveis no decorator, e sem a declaração o diff de schema do TypeORM trataria os quatro como índices órfãos a remover. Nenhuma coluna muda.

#### Regra "listável" (consolidada)

Um vídeo entra em listagem quando `published_at IS NOT NULL` **e** `visibility = 'public'`; `unlisted` nunca aparece, nem na home nem na busca *(per video-channel-management/TD-02)*. Hoje a regra está escrita no `VideosService` em `listPublicByChannel`, `countPublicByChannel`, `countPublicByChannels` (query builder agrupado) e `listSuggestions`. A fatia a consolida num ponto só do serviço, reusado por essas consultas e pela listagem global *(per home-busca/TD-01 — "Consolida a regra 'listável' num ponto só, que é o que o princípio de Single Responsibility do projeto pede")*.

#### Casamento da busca

`q` casa com `immutable_unaccent(lower(videos.title))`, com `immutable_unaccent(lower(channels.name))` ou com `channels.nickname`, por `LIKE '%' || <termo normalizado> || '%'` *(per home-busca/TD-04 e home-busca/TD-05 — o termo casa com o título **ou** com o nome/nickname do canal)*. O termo normalizado é `immutable_unaccent(lower(:q))`, depois de escapar `\`, `%` e `_` com `ESCAPE '\'`. _Premissa do build, não vem de TD:_ sem o escape, um `_` digitado (comum em nickname) viraria curinga de um caractere.

### API Contracts

Dois tiers. O **backend tier** (`nestjs-project/`) é a fonte do contrato novo. O **BFF tier** registra que a fatia **não cria Route Handler novo**, conforme o modelo strict-BFF de `next-frontend/CLAUDE.md`.

**Estado no repositório, verificado em 2026-10-11:**
- O `VideosController` (`@Controller('videos')`) não tem rota na raiz: toda rota pública é por `:publicId`. Não existe endpoint de feed, de busca nem parâmetro `category` em listagem.
- `SuggestedVideoListItem` (`src/videos/dto/suggested-videos-response.dto.ts`) já carrega `publicId`, `title`, `thumbnailUrl`, `durationSeconds`, `viewsCount`, `publishedAt` e `channel` (`PublicVideoChannel`: `nickname`, `name`).
- O throttler global conta **por visitante** (`user:<sub>` ou `ip:<ip>`), com default de 120 req/60 s *(per rate-limit-visitor-identity/TD-03 e TD-04)*.

#### Backend tier

#### GET /videos (SI-07.X)

Listagem global: home, filtro por categoria e busca no mesmo endpoint, com filtros opcionais e combináveis *(per home-busca/TD-01)*. `@Public()`, sem `@Throttle` nem `@SkipThrottle` próprio: fica no default global de 120 req/60 s por visitante *(per home-busca/TD-09, Revision de 2026-10-11)*. Nenhuma ramificação de ordenação: com ou sem `q`, a ordem é a mesma *(per home-busca/TD-03 e home-busca/TD-04 — "Os resultados são ordenados por **recência**, como a home")*.

**Request headers:**
- Authorization: Bearer token — opcional e ignorado. A resposta não tem estado pessoal; o `JwtAuthGuard` só anexa `req.user`, e o rastreador do throttler passa a ser `user:<sub>` quando há Bearer válido

**Request query parameters:**
- q: string, opcional — termo de busca, aparado nas pontas; quando presente, mínimo **3** e máximo 100 caracteres *(per home-busca/TD-04, Revision de 2026-10-11 — mínimo de 3)*. _Premissa do build:_ o máximo de 100 não vem de TD; limita o tamanho do padrão `LIKE`
- category: enum `VideoCategory`, opcional — o valor do enum como está (`Música`, `Jogos`, `Educação`, `Entretenimento`, `Notícias`, `Esportes`, `Tecnologia`, `Outros`), sem mapa de slugs *(per home-busca/TD-01 e video-channel-management/TD-01)*
- offset: integer, opcional, `>= 0`, default 0
- limit: integer, opcional, `1..50`, default **12** *(per home-busca/TD-02, Revision de 2026-10-11)*

**Response 200:** `VideoFeedPage`
- items: `SuggestedVideoListItem[]` — o shape do item é reusado como está *(per home-busca/TD-01 — "O item da listagem reutiliza o shape de `SuggestedVideoListItem`, que já carrega o canal")*
- total: number — total de vídeos que satisfazem os filtros, ignorando a página

Ordem: `published_at DESC, id DESC` *(per home-busca/TD-03)*. Só vídeos listáveis (§Data Model → Regra "listável"). Sem `q`, devolve todos os listáveis (filtrados por `category` se houver). Com `q`, devolve os listáveis cujo título, nome do canal ou nickname casa com o termo (§Data Model → Casamento da busca) — só vídeos, nunca canais *(per home-busca/TD-05)*. Lista vazia é resultado legítimo, não erro.

**Error responses:**
- 400 VALIDATION_ERROR: `q` com menos de 3 ou mais de 100 caracteres depois de aparado, `category` fora do enum, `offset` ou `limit` fora da faixa
- 429 RATE_LIMIT_EXCEEDED: acima de 120 requisições em 60 s do mesmo visitante *(per rate-limit-visitor-identity/TD-04)*

---

#### Validation Rules — listagem global

- `q`: opcional; `@Transform` que apara as pontas; quando presente, string com `@Length(3, 100)`. String vazia ou só de espaços depois de aparar é rejeitada com 400; o frontend nunca a envia (§UI Contracts)
- `category`: opcional, `@IsEnum(VideoCategory)`
- `offset`: opcional, inteiro, `>= 0`, default 0 — mesmo padrão de `ListPublicVideosQueryDto`
- `limit`: opcional, inteiro, `1..50`, default 12

#### BFF tier

> _BFF tier — contrato exposto ao browser. O navegador chama a rota same-origin; o Route Handler faz proxy para o upstream NestJS server-side, conforme o modelo strict-BFF de `next-frontend/CLAUDE.md`._

**Nenhum Route Handler novo nesta fatia.** As duas telas leem a listagem no **Server Component**, direto do upstream: o strict-BFF governa o tráfego do **navegador**, e `env.API_URL` é server-only, como `app/channels/[nickname]/page.tsx` já faz. A paginação é por link (`?page=N`) e a busca é navegação (`next/form` para `/results?q=`) *(per home-busca/TD-02 e home-busca/TD-06)*, então nenhum cliente busca dados. **Nenhuma rota BFF é criada sem consumidor no browser.**

**Leituras do Server Component (sem rota BFF):**
- `GET /videos` — HomePage e ResultsPage, pelo cliente `upstream` (que já anexa `X-Client-IP` e `X-Internal-Token`), sem Bearer, porque a resposta não tem estado pessoal. A linha entra no `openapi.json` quando o backend for implementado e o sync do contrato rodar *(derived: project contract source — backend tier desta fase)*.
- `GET /me/channel` — PublicSiteNavbar, por `getViewerChannel()` (`lib/api/viewer-channel.ts`, auth opcional, memoizado por requisição). É a leitura existente da Fase 06; esta fatia passa a usar também o `nickname` *(derived: project contract source)*.

**Rota BFF consumida sem mudança de contrato:**
- `POST /api/auth/logout` — o "Sair" do `UserMenu` e o da `NavigationSheet`, pelo hook compartilhado de logout *(per home-busca/TD-07, Revision de 2026-10-11)*. O contrato é o da Fase 02 *(per phase-02-auth-frontend/TD-05)*.

**Alias de contrato.** `lib/api/contracts.ts` ganha `VideoFeedPage` e `VideoFeedQuery`, derivados de `paths["/videos"]["get"]`. Continua sendo o único importador de `paths` *(per next-frontend-openapi-typing/TD-04)*.

### Authorization Matrix

`Anonymous` = sem `Authorization`, ou com Bearer inválido numa rota `@Public()`: o guard segue anônimo. `Authenticated` = Bearer válido. A listagem global não tem dono nem estado pessoal, então a coluna `Owner` só registra que o dono não é tratado de forma diferente.

| Endpoint / rota | Anonymous | Authenticated | Owner |
|-----------------|-----------|---------------|-------|
| GET /videos | ✓ | ✓ | ✓ |
| `/` (HomePage) | ✓ | ✓ | ✓ |
| `/results` (ResultsPage) | ✓ | ✓ | ✓ |
| Links "Canais seguidos" e "Meus vídeos" na navbar e no sheet | — oculto | ✓ | ✓ |
| `/channel/subscriptions`, `/channel/videos`, `/channel/settings`, `/videos/{publicId}/edit` | ✗ (redirect `/login`, como hoje) | ✓ | ✓ |

O chrome anônimo mostra só os links públicos (Início) e o "Entrar" *(per home-busca/TD-07, Revision de 2026-10-11 — "as rotas do studio ficam ocultas")*. As rotas do studio seguem protegidas pelo layout autenticado como hoje. Esta fatia só troca o chrome desse layout, não a regra de acesso.

### Error Catalog

**Forma do envelope** (herdada de `phase-02-auth/TD-07`, implementada em `src/common/openapi/api-error-envelope.dto.ts`): `{ statusCode, error, message }`. O código de domínio vai no campo **`error`**.

| error | HTTP | Trigger |
|-------|------|---------|
| VALIDATION_ERROR | 400 | Query de `GET /videos` fora das Validation Rules. É emitido pelo `ValidationExceptionFilter`, que já é global |
| RATE_LIMIT_EXCEEDED | 429 | Mais de 120 requisições em 60 s do mesmo visitante em `GET /videos` *(per rate-limit-visitor-identity/TD-04)*. É emitido pelo `ThrottlerExceptionFilter`, que já é global |

**Nenhum código novo.** Lista vazia não é erro, e categoria desconhecida na URL não chega ao upstream. O termo curto também não: o frontend o barra antes da chamada (§UI Contracts).

### UI Contracts

**Navbar única, montada em layout** *(per home-busca/TD-07, Revision de 2026-10-11 — "a navbar desenhada passa a ser o chrome de todas as telas, inclusive as do studio, montada uma vez em layout")*.

Estado atual:
- a watch page e a página do canal renderizam o `<PublicSiteNavbar />` em cada página;
- o layout `(studio)` monta a `SiteNavbar` + `ChannelUserMenu` com `GET /me/channel` por `fetchFromUpstream`;
- `app/page.tsx` é o placeholder do `create-next-app`.

A estrutura de rotas passa a ser:

| Arquivo | Papel |
|---------|-------|
| `app/(site)/layout.tsx` (novo) | Renderiza `<PublicSiteNavbar />` + `<main>` para as telas públicas |
| `app/(site)/(feed)/page.tsx` | HomePage. O inventário a registra como `app/page.tsx`; o conteúdo é reescrito e o arquivo muda de pasta. A URL continua `/` |
| `app/(site)/(feed)/results/page.tsx` (novo) | ResultsPage (`/results`) |
| `app/(site)/(feed)/loading.tsx`, `app/(site)/(feed)/error.tsx` (novos) | Carregamento e erro das duas listagens, sem afetar as outras telas do grupo |
| `app/(site)/videos/[publicId]/…`, `app/(site)/channels/[nickname]/…` | Movidas de `app/videos/…` e `app/channels/…` com os arquivos especiais que já têm. As URLs (`/videos/{publicId}`, `/@{nickname}` pelo rewrite) não mudam. As duas páginas deixam de renderizar a navbar |
| `app/(studio)/layout.tsx` | Mantém o `redirect("/login")` sem sessão e troca `SiteNavbar` + `ChannelUserMenu` pelo mesmo `<PublicSiteNavbar />` |

Ficam sem navbar, como hoje: as telas de `(auth)` (login, cadastro, recuperação) e `/upload`, que nunca tiveram chrome no desenho. _Premissa do build:_ a Revision fala em "todas as telas" e enumera as do studio; essas quatro ficam de fora.

O `loginVariant` do `PublicSiteNavbar` some: o "Entrar" passa a ter uma variante só, `secondary`. Hoje é `secondary` na watch page e `outline` na página do canal.

**Composição da navbar.**
- `PublicSiteNavbar` (Server Component) resolve `getViewerChannel()` e entrega à `SiteNavbar` o objeto `viewer = { name, nickname } | null`.
- `SiteNavbar` (`"use client"`, como hoje, por causa do `usePathname`) é a casca de apresentação. Ela renderiza:
  - **desktop (`≥ lg`):** BrandLogo, depois `SearchForm`, depois os links, depois o controle de sessão;
  - **mobile (`< lg`):** BrandLogo, `SearchToggleButton` e `MenuButton`;
  - **busca expandida no mobile:** `SearchBackButton` + `SearchForm`.
- Links e destinos *(per home-busca/TD-07, Revision de 2026-10-11)*:
  - Início → `/`, sempre visível;
  - Canais seguidos → `/channel/subscriptions` e Meus vídeos → `/channel/videos`, só com `viewer`.
  - O link da rota corrente recebe `aria-current="page"`; em `/results` nenhum fica ativo.
  - O `showSubscriptionsLink` sai: o que decide é a presença de `viewer`.
- Controle de sessão no desktop:
  - **logado:** `UserMenu`, com o avatar como link "Seu canal" para `/@{nickname}` (`aria-label="Seu canal"`) e o "Sair";
  - **anônimo:** "Entrar" para `/login`.
  - _Premissa do build:_ o menu do usuário de hoje é avatar + "Sair", sem dropdown. O "Seu canal" da Revision vira o próprio avatar como link, e o desenho não muda.

**Logout compartilhado** *(per home-busca/TD-07, Revision de 2026-10-11)*. A chamada a `POST /api/auth/logout`, seguida de `router.push("/login")` e `router.refresh()`, sai de `components/layout/channel-user-menu.tsx`. Ela vai para `lib/auth/use-logout.ts` (novo, `"use client"`), que expõe `{ signOut, isSigningOut }`. O "Sair" do `UserMenu` e o da `NavigationSheet` o consomem. O `ChannelUserMenu` deixa de existir: a `SiteNavbar` passa o `signOut` ao `UserMenu`.

**Primitivo de sheet.** `components/ui/sheet.tsx` é novo, criado com `npx shadcn@latest add sheet` (o Sheet do shadcn sobre o Dialog do `radix-ui`, já instalado). Segue o padrão dos outros primitivos de `components/ui` *(per home-busca/TD-07, Revision de 2026-10-11)*. A `NavigationSheet` o compõe; o overlay, o foco preso, o Esc e o toque fora vêm do primitivo.

**Regras responsivas — valem para todas as telas** *(per home-busca/TD-08 — "Regras responsivas escritas, com frames mobile só para o que é novo")*. Breakpoints padrão do Tailwind 4:

| Regra | Abaixo do breakpoint | A partir do breakpoint |
|-------|----------------------|------------------------|
| Chrome (navbar) | Barra fechada + sheet + busca expansível, abaixo de `lg` | Barra completa a partir de `lg` |
| Gutter lateral do conteúdo e da navbar | `px-4` | `px-12` a partir de `lg` (o valor de hoje) |
| Grade de vídeos (home, resultados, canal) | 1 coluna | 2 em `sm`, 3 em `md`, 4 em `lg`. O tamanho de página 12 divide todas *(per home-busca/TD-02)* |
| Sidebars (sugestões da watch page) | Abaixo do conteúdo | Lado a lado a partir de `lg` (o `lg:flex-row` de hoje) |
| Tabelas (painel `/channel/videos`) | Contêiner com rolagem horizontal; a tabela não encolhe colunas | Sem rolagem |
| Formulários (auth, upload, edição, configurações do canal) | Largura cheia do contêiner | Largura máxima atual |
| Alvos de toque | Botões só com ícone em 40×40, a medida do desenho, acima do mínimo de 24×24 do WCAG 2.5.8 | — |
| Faixa de chips de categoria | Rola na horizontal e continua navegável por teclado | Uma linha |

Telas antigas não têm frame mobile. O layout mobile delas é derivado destas regras, e os critérios de aceite são argumentados, não observados *(per home-busca/TD-08 — "o mobile das telas antigas passa a ser derivado por regra, não observado")*.

**`VideoCard` estendido** *(per home-busca/TD-01, Revision de 2026-10-11)*:
- **props novas:** `publicId`, `channel: { name, nickname }` e `size: "desktop" | "mobile"`;
- **links**, irmãos e sem aninhamento: thumbnail e título levam a `/videos/{publicId}`; avatar (iniciais por `initialsOf`) e nome do canal levam a `/@{nickname}`;
- **`sizes`** da thumbnail: segue a variante, com largura cheia no mobile e coluna da grade no desktop;
- **truncamento:** título em até 2 linhas, canal e meta em 1;
- **chamadores atuais:** os três de hoje envolvem o card num `<Link href="/videos/{publicId}">`: a grade de `app/channels/[nickname]/page.tsx`, a sidebar de `app/videos/[publicId]/page.tsx` e `components/videos/sidebar-load-more.tsx`. Com o link dentro do card, eles passam `publicId` e removem o `<Link>` externo; sem isso haveria `<a>` dentro de `<a>`;
- **linha do canal opcional.** _Premissa do build:_ a linha só aparece quando `channel` é passado. A página do canal não o passa, porque seria redundante, e a sidebar da watch page também não, para manter o desenho da Fase 05. Home e resultados passam.

**Termo de busca e estados de URL** *(per home-busca/TD-04, Revision de 2026-10-11)*:
- **`q` ausente ou vazio depois de aparar:** a ResultsPage faz `redirect("/")`.
- **`q` com 1 ou 2 caracteres:** a ResultsPage **não chama** o upstream e mostra o aviso "Digite pelo menos 3 caracteres para buscar", no lugar dos resultados.
- **`category` fora do enum:** a HomePage a ignora e lista sem filtro. O valor vem da URL, editável à mão, e um 400 seria hostil sem ganho, o mesmo critério do `parsePage` em `lib/pagination.ts`.
- **`page`:** normalizado por `parsePage`. Uma página além da última renderiza a grade vazia com a paginação, mesmo comportamento da página do canal.

#### Screen: Página inicial

**Route:** `/`
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=83-127 (node `FetKyb1V02WS5D6VCatK6t:83:127`)
**Purpose:** "Página inicial com grid de vídeos (thumbnail, título, canal, visualizações e tempo de publicação)"

**Auth requirement:** Anonymous _(source: §Authorization Matrix — `GET /videos` e `/` com ✓ para Anonymous; o `GET /me/channel` da navbar é auth opcional)_

**Rendering strategy:** Server Component (RSC). Lê `category` e `page` de `searchParams` e faz uma chamada a `GET /videos` com `offset = toOffset(page, 12)` e `limit = 12`. Repassa os itens à `VideoGrid` _(per home-busca/TD-01, home-busca/TD-02, home-busca/TD-03)_. A sessão chega aos Client Components por Context _(per phase-02-auth-frontend/TD-06)_.

**Reused DS components:**
- `app/page.tsx` — HomePage — Server Component da rota `/`, dono da busca da listagem: lê `category`/`page` de `searchParams`, faz uma chamada (home-busca/TD-01 B, TD-02 A, TD-03 A) e repassa os itens à VideoGrid. Mesmo padrão de `app/channels/[nickname]/page.tsx`. O arquivo existe, mas hoje é o placeholder do `create-next-app` e será reescrito. _Resolvido 2026-10-06 (dono do fetch = página RSC; ver Decisions log do progress)._ — **neste plano o arquivo vai para `app/(site)/(feed)/page.tsx`** (§UI Contracts → Navbar única)
- `components/layout/site-navbar.tsx` — SiteNavbar — Herdado da fase 06 (source: phase-06). **Estendido na Fase 07:** passa a hospedar `nav-links` (83:136) e o SearchForm (83:138), além de BrandLogo e do controle de sessão. Por home-busca/TD-07 (Option A, PENDING) fica só a barra superior, com menu em sheet no mobile, e a navbar passa a ser montada uma vez no layout, e não mais em cada página. Esta frame mostra a variante **anônima**
- `components/layout/public-site-navbar.tsx` — PublicSiteNavbar — Mesmo nó Figma do SiteNavbar, com linha própria. É o wrapper async (Server Component) que chama `getViewerChannel()` e decide entre ChannelUserMenu (logado) e o botão "Entrar" (anônimo). Aqui renderiza o ramo anônimo (`entrar-button` 83:146)
- `components/auth/brand-logo.tsx` — BrandLogo
- `components/icons/streamtube-icon.tsx` — StreamtubeIcon
- `components/layout/search-form.tsx (new)` — SearchForm — Envio explícito via `next/form` para `/results?q=` (home-busca/TD-06, Option A, PENDING). Só navega e não faz I/O próprio: quem busca é a listagem da tela de resultados. Placeholder "Buscar vídeos ou canais" (83:143) e label "Buscar" (83:145) são conteúdo do próprio form. O campo e o botão podem compor `components/ui/input.tsx` e `components/ui/button.tsx`, que já existem
- `components/icons/search-icon.tsx (new)` — search-icon — INSTANCE do componente Figma `search-icon`, glyph dentro de `search-input` (83:139) no SearchForm
- `components/ui/button.tsx` — LoginButton "Entrar" (83:146) — `<Link>` para `/login`, sem mutation
- `components/videos/category-filter.tsx (new)` — CategoryFilter — Linha de 9 chips: "Todos" + as 8 categorias. Navega por URL (`/?category=<valor do enum>`, valor cru e percent-encoded, por home-busca/TD-01 Option B, PENDING) e não filtra dados já carregados no cliente. "Todos" corresponde à home sem `category`. Os 8 rótulos batem, inclusive na ordem, com o enum de categoria do `openapi.json`, então a lista é estática e não precisa de fetch
- `components/videos/category-chip.tsx (new)` — CategoryChip — Variantes `state=default\|selected`. Cada chip é um link de navegação para a categoria e não faz I/O próprio
- `components/videos/video-grid.tsx (new)` — VideoGrid — **Não faz fetch próprio:** recebe da HomePage os itens da listagem e renderiza a grade. Desenhado com 3 linhas × 4 colunas = 12 cards
- `components/videos/video-card.tsx` — VideoCard — Herdado da fase 06 (source: phase-06). **Estendido na Fase 07:** ganha a linha de canal (`channel-avatar` + `channel-name`) e variante de tamanho `desktop\|mobile`, conforme docs/design-identity.md:99-101
- `components/ui/avatar.tsx` — Avatar (`channel-avatar`) — iniciais do canal dentro do VideoCard
- `components/ui/pagination.tsx` — Pagination — "Anterior", "1", "2", "3", "Próxima", alinhada à direita. Navega por URL (`?page=N`, home-busca/TD-02 A, PENDING) sem I/O próprio

_Elementos de mock e layout sem arquivo próprio_: `top-decorative-strip` (83:128), `main-dashed-container` (83:148), `footer-pagination` (83:304) e os três `video-grid-row`. O link "Início" (83:137) fica inline na `SiteNavbar`.

**Server-connected components:**
- `HomePage` (83:127) — verbos: exibir a grade de vídeos publicados mais recentes; filtrar a grade pela categoria selecionada; exibir a página selecionada da listagem | endpoint: RSC → `GET /videos?category&offset&limit` (upstream direto, sem rota BFF — §API Contracts → BFF tier) | reuse: `app/page.tsx`
- `PublicSiteNavbar` (83:129) — verbo: exibir no header o controle de sessão do visitante (Entrar ou avatar) | endpoint: RSC → `GET /me/channel` por `getViewerChannel()` (auth opcional; sem rota BFF) | reuse: `components/layout/public-site-navbar.tsx`
- `VideoCard` (83:170 e mais 11 instâncias) — verbo: exibir cada vídeo da grade com thumbnail, duração, título, canal, visualizações e tempo de publicação | endpoint: nenhum próprio, recebe um item de `GET /videos` por props | reuse: `components/videos/video-card.tsx`

**Behaviors:**

*Rendered states:*
- Loading: `app/(site)/(feed)/loading.tsx` com o skeleton da grade, 12 placeholders no formato do card, e a faixa de chips *(per home-busca/TD-01, Revision de 2026-10-11)*.
- Empty — nenhum vídeo publicado: mensagem "Nenhum vídeo publicado ainda." no lugar da grade, sem paginação.
- Empty — categoria sem vídeos: "Nenhum vídeo em {categoria}." com link "Ver todos os vídeos" para `/`. A faixa de chips continua visível, com a categoria selecionada.
- Success: faixa de chips com a categoria atual selecionada ("Todos" sem `category`), grade de até 12 cards e paginação.
- Error: `app/(site)/(feed)/error.tsx`, com mensagem e botão "Tentar novamente" (`reset()`).
- Paginação: só aparece com mais de uma página. Anterior e Próxima ficam desabilitados nas pontas (`aria-disabled`), e os hrefs preservam o `category` *(per home-busca/TD-02, Revision de 2026-10-11)*.

*Interactions:*
- `CategoryChip` click → navega para `/?category={valor}`, ou para `/` em "Todos", e volta à página 1.
- `Pagination` click → navega para `?page=N`, preservando `category`.
- `SearchForm` submit → navega para `/results?q={termo}`.

**Error Catalog → UX mapping:**

| error (from §Error Catalog) | UX treatment |
|-----------------------------|--------------|
| `RATE_LIMIT_EXCEEDED` | `error.tsx` da listagem, com "Tentar novamente". _TBD — implementer decides per screen_ |
| `VALIDATION_ERROR` | Não deve ocorrer: a página só envia `category` válida e `offset`/`limit` normalizados. Se ocorrer, cai no `error.tsx` |

**Client-side validation mirror:** `q` no `SearchForm` com `required`, `minLength={3}` e `maxLength={100}` (§API Contracts → Validation Rules). O navegador barra o envio de termo curto, e a ResultsPage repete a barreira no servidor.

**Accessibility notes:**
- Os chips são links. O selecionado leva `aria-current="page"` (ou `aria-pressed`, que é semântica de botão), e a faixa rolável continua alcançável por Tab.
- O campo de busca tem `<label>` (pode ser visualmente oculto) e `type="search"`.
- O link ativo da navbar usa `aria-current="page"`. A diferença visual não é observável na projeção do Figma.

#### Screen: Resultados da busca

**Route:** `/results` — termo em `?q=` e página em `?page=N` *(per home-busca/TD-01 e home-busca/TD-02)*
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=83-311 (node `FetKyb1V02WS5D6VCatK6t:83:311`)
**Purpose:** "Barra de busca (pesquisa por título e canal)"

**Auth requirement:** Anonymous _(source: §Authorization Matrix — `GET /videos` e `/results` com ✓ para Anonymous)_

**Rendering strategy:** Server Component (RSC). Lê `q` e `page` de `searchParams`. Com `q` válido, faz uma chamada a `GET /videos?q&offset&limit=12` e repassa os itens à `VideoGrid`, e o termo e o `total` ao `ResultsHeading` _(per home-busca/TD-01, home-busca/TD-04, home-busca/TD-05)_. `generateMetadata` dá o título "Resultados para “{q}”". _Premissa do build:_ nenhum TD fixa o título da aba.

**Reused DS components:**
- `app/results/page.tsx (new)` — ResultsPage — Server Component da rota `/results` (home-busca/TD-01 B), dono da busca: lê `q`/`page` de `searchParams`, faz uma chamada e repassa os itens à VideoGrid e o termo e o total ao ResultsHeading — **neste plano o arquivo é `app/(site)/(feed)/results/page.tsx`**
- `components/layout/site-navbar.tsx` — SiteNavbar — **Estendida na Fase 07** com SearchForm e nav-links. Nesta frame aparece a variante **autenticada** (avatar + "Sair")
- `components/layout/public-site-navbar.tsx` — PublicSiteNavbar — escolhe entre o chrome logado (caso desta frame) e "Entrar"
- `components/auth/brand-logo.tsx` — BrandLogo
- `components/icons/streamtube-icon.tsx` — StreamtubeIcon
- `components/layout/search-form.tsx (new)` — SearchForm — O valor vem preenchido com o `q` atual ("docker" em 83:329), consequência do TD-06 nesta rota
- `components/ui/input.tsx` — search-input — O Input do DS precisa de um slot de ícone à esquerda, ou o agrupamento vira markup do SearchForm
- `components/icons/search-icon.tsx (new)` — SearchIcon
- `components/ui/button.tsx` — search-submit-button "Buscar"
- `components/layout/user-menu.tsx` — UserMenu — Avatar (83:333) + `sair-button` (83:335)
- `components/ui/avatar.tsx` — Avatar
- `components/videos/video-grid.tsx (new)` — VideoGrid — mesmo componente da grade da home, aqui em modo busca
- `components/videos/video-card.tsx` — VideoCard — **Estendido na Fase 07** (linha do canal, variante de tamanho)
- `components/ui/pagination.tsx` — Pagination — "Anterior", "1", "Próxima"; navega por `?page=N` e precisa preservar o `q` no href

_Elementos puro-DOM sem arquivo próprio_:
- `ResultsHeading` (83:338): `<h1>` "Resultados para “{q}”" + `<p>` com a contagem;
- `nav-links` (83:320), com os três links inline na `SiteNavbar`;
- `top-decorative-strip` (83:312), `main-dashed-container` (83:337) e `footer-pagination` (83:432).

**Server-connected components:**
- `ResultsPage` (83:311) — verbos: exibir os vídeos cujo título ou canal casa com o termo buscado; exibir a página selecionada dos resultados | endpoint: RSC → `GET /videos?q&offset&limit` (upstream direto, sem rota BFF — §API Contracts → BFF tier) | reuse: `app/results/page.tsx (new)`
- `PublicSiteNavbar` (83:313) — verbo: exibir no header o controle de sessão do visitante | endpoint: RSC → `GET /me/channel` por `getViewerChannel()` | reuse: `components/layout/public-site-navbar.tsx`
- `VideoCard` (83:343 e mais 7 instâncias) — verbo: exibir cada vídeo encontrado com thumbnail, título, canal, visualizações e tempo de publicação | endpoint: nenhum próprio, recebe um item de `GET /videos` por props | reuse: `components/videos/video-card.tsx`

**Behaviors:**

*Rendered states:*
- Loading: o mesmo `app/(site)/(feed)/loading.tsx` da home.
- Termo curto (1–2 caracteres): aviso "Digite pelo menos 3 caracteres para buscar." no lugar do `ResultsHeading` e da grade, sem chamada ao upstream *(per home-busca/TD-04, Revision de 2026-10-11)*.
- Empty: ver a tela "Resultados da busca — sem resultados".
- Success: `ResultsHeading` com o termo entre aspas tipográficas e a contagem ("1 vídeo" / "N vídeos"), e a grade com até 12 cards, por recência. Casamentos só pelo canal entram como vídeos comuns *(per home-busca/TD-05)*.
- Error: o mesmo `error.tsx` da listagem.
- Paginação: as mesmas regras da home, com `q` preservado nos hrefs.

*Interactions:*
- `SearchForm` submit com termo novo → navega para `/results?q={termo}` e volta à página 1. O campo chega preenchido com o `q` da URL.
- `Pagination` click → `?q={termo}&page=N`.

**Error Catalog → UX mapping:**

| error (from §Error Catalog) | UX treatment |
|-----------------------------|--------------|
| `RATE_LIMIT_EXCEEDED` | `error.tsx` da listagem, com "Tentar novamente". _TBD — implementer decides per screen_ |
| `VALIDATION_ERROR` | Não deve ocorrer: o termo curto é barrado antes da chamada. Se ocorrer, cai no `error.tsx` |

**Client-side validation mirror:** `q` com `required`, `minLength={3}` e `maxLength={100}` no `SearchForm`. O servidor repete a barreira do mínimo sem chamar o upstream.

**Accessibility notes:**
- O termo é eco da URL e é renderizado como texto, nunca como HTML.
- O campo de busca tem `<label>` e `type="search"`.
- Em `/results` nenhum link da navbar recebe `aria-current`.

#### Screen: Resultados da busca — sem resultados

**Route:** `/results` — estado da mesma rota com zero vídeos; não é rota própria
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=83-437 (node `FetKyb1V02WS5D6VCatK6t:83:437`)
**Purpose:** estado vazio de "Barra de busca (pesquisa por título e canal)"

**Auth requirement:** Anonymous _(source: §Authorization Matrix — mesma rota da tela de resultados)_

**Rendering strategy:** Server Component (RSC). É a mesma `ResultsPage`: com `total === 0`, renderiza o `SearchEmptyState` no lugar do `ResultsHeading`, da grade e da paginação _(per home-busca/TD-05)_.

**Reused DS components:**
- `app/results/page.tsx (new)` — ResultsPage — a mesma página no estado de zero resultados — **neste plano, `app/(site)/(feed)/results/page.tsx`**
- `components/layout/site-navbar.tsx` — SiteNavbar — mesma variante autenticada
- `components/layout/public-site-navbar.tsx` — PublicSiteNavbar
- `components/auth/brand-logo.tsx` — BrandLogo
- `components/icons/streamtube-icon.tsx` — StreamtubeIcon
- `components/layout/search-form.tsx (new)` — SearchForm — campo preenchido com o termo da URL ("xyzabc")
- `components/ui/input.tsx` — SearchInput
- `components/icons/search-icon.tsx (new)` — SearchIcon — usado no header (20px) e no badge do estado vazio (28px); um arquivo só
- `components/ui/button.tsx` — SearchSubmitButton "Buscar"
- `components/layout/user-menu.tsx` — UserMenu
- `components/ui/avatar.tsx` — Avatar
- `components/videos/search-empty-state.tsx (new)` — SearchEmptyState — Só é renderizado quando o backend devolve zero vídeos para o termo, e o título repete esse termo. Presentational: quem decide renderizá-lo é a ResultsPage, ao receber zero itens

_Elementos puro-DOM sem arquivo próprio_:
- `empty-icon-badge` (83:465), círculo de 56px em volta do glifo;
- `BackHomeLink` (83:471), `<Link href="/">` "Voltar para o início" dentro do `SearchEmptyState`. É link de texto na cor primária; o `BackLink` de `components/auth/` usa `muted-foreground` e não é generalizado nesta fatia;
- `top-decorative-strip` e `main-dashed-container`.

**Server-connected components:**
- `ResultsPage` (83:437) — verbo: informar que nenhum vídeo casa com o termo buscado | endpoint: RSC → `GET /videos?q` com `total === 0` (sem rota BFF) | reuse: `app/results/page.tsx (new)`

**Behaviors:**

*Rendered states:*
- Empty: badge com o `SearchIcon`, título "Nenhum vídeo encontrado para “{q}”" e o texto de dica do desenho (`empty-hint`, 83:470), mais o link "Voltar para o início". Sem paginação.
- Mobile: o mesmo componente em coluna única, pelas regras responsivas. Não há frame mobile deste estado; o layout é argumentado *(per home-busca/TD-08)*.

*Interactions:*
- `BackHomeLink` click → navega para `/`.

**Error Catalog → UX mapping:** não se aplica — zero resultados não é erro.

**Client-side validation mirror:** a mesma do `SearchForm`.

**Accessibility notes:**
- O `SearchIcon` do badge é decorativo (`aria-hidden`). O título do estado vazio é o `<h1>` da página.

#### Screen: Página inicial — mobile

**Route:** `/` — viewport de 375px
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=84-299 (node `FetKyb1V02WS5D6VCatK6t:84:299`)
**Purpose:** "Layout responsivo para dispositivos móveis"

**Auth requirement:** Anonymous _(source: §Authorization Matrix — mesma rota da Página inicial)_

**Rendering strategy:** a mesma HomePage (RSC). A troca de layout é só CSS (breakpoints de §UI Contracts → Regras responsivas), sem detecção de dispositivo no servidor _(per home-busca/TD-08)_. O estado da busca expandida e o do sheet aberto vivem na `SiteNavbar` (`"use client"`).

**Reused DS components:**
- `app/page.tsx` — HomePage — a mesma página a 375px — **neste plano, `app/(site)/(feed)/page.tsx`**
- `components/layout/site-navbar.tsx` — SiteNavbar — Aqui no **layout mobile**: só BrandLogo e `navbar-actions` (84:308). Sem input de busca, sem links de navegação e sem "Entrar" ou avatar na barra
- `components/layout/public-site-navbar.tsx` — PublicSiteNavbar — esta frame é a **anônima**
- `components/auth/brand-logo.tsx` — BrandLogo
- `components/icons/streamtube-icon.tsx` — StreamtubeIcon
- `components/ui/icon-button.tsx` — SearchToggleButton (84:309) — Botão de ícone 40×40. Expande o input de busca sobre a barra; estado só do cliente
- `components/icons/search-icon.tsx (new)` — SearchIcon
- `components/ui/icon-button.tsx` — MenuButton (84:313) — Botão de ícone 40×40 que abre o sheet de navegação. Abre e fecha só no cliente, sem I/O
- `components/icons/menu-icon.tsx (new)` — MenuIcon — INSTANCE do componente `menu-icon` (3 vetores horizontais, "hambúrguer")
- `components/videos/category-filter.tsx (new)` — CategoryFilter — No mobile tem 341px de largura e **rola na horizontal**
- `components/videos/category-chip.tsx (new)` — CategoryChip
- `components/videos/video-grid.tsx (new)` — VideoGrid — o **mesmo componente em coluna única**
- `components/videos/video-card.tsx` — VideoCard — Variante `size=mobile` (83:110), com o card na largura do contêiner (FILL), não nos 343px fixos do mock
- `components/ui/avatar.tsx` — Avatar
- `components/ui/pagination.tsx` — Pagination — No mobile fica **centralizada**

_Elementos puro-DOM sem arquivo próprio_:
- `navbar-actions` (84:308), o grupo dos dois botões só com ícone, que só existe abaixo de `lg`;
- `top-decorative-strip` (84:300), `main-dashed-container` (84:318) e `footer-pagination` (84:372).

**Server-connected components:**
- `HomePage` (84:299) — verbo: exibir a listagem de vídeos em coluna única no viewport móvel | endpoint: RSC → `GET /videos?category&offset&limit` (sem rota BFF) | reuse: `app/page.tsx`
- Herdados da tela "Página inicial", sem verbo novo aqui: `PublicSiteNavbar` e `VideoCard`.

**Behaviors:**

*Rendered states:*
- Barra fechada: BrandLogo à esquerda, `SearchToggleButton` e `MenuButton` à direita. Sem "Entrar" e sem avatar na barra, para anônimo e para logado; o controle de sessão fica no sheet *(per home-busca/TD-07, Revision de 2026-10-11)*.
- Grade em coluna única, com cards na largura do contêiner.
- Paginação centralizada, com os componentes do DS sem alteração: abaixo de `sm`, "Anterior"/"Próxima" aparecem como chevrons, sem texto. A divergência do frame, que mostra o texto, fica aceita *(per home-busca/TD-02, Revision de 2026-10-11)*.
- Loading, empty e error: os mesmos da tela "Página inicial".

*Interactions:*
- `SearchToggleButton` click → expande a busca sobre a barra (estado da tela "Resultados da busca — mobile") e foca o input.
- `MenuButton` click → abre a `NavigationSheet` (tela "Menu de navegação — mobile").
- `CategoryChip` click e `Pagination` click → os mesmos da tela desktop.

**Error Catalog → UX mapping:** os mesmos da tela "Página inicial".

**Client-side validation mirror:** a mesma do `SearchForm`.

**Accessibility notes:**
- `SearchToggleButton` com `aria-label="Buscar"`, `aria-expanded` e `aria-controls` apontando para o form.
- `MenuButton` com `aria-label="Abrir menu"` e `aria-expanded`.
- Os botões de 40×40 passam do mínimo de 24×24 do WCAG 2.5.8.
- A faixa de chips que rola na horizontal continua navegável por teclado.

#### Screen: Resultados da busca — mobile

**Route:** `/results` — viewport de 375px, com a busca expandida na barra
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=84-379 (node `FetKyb1V02WS5D6VCatK6t:84:379`)
**Purpose:** "Layout responsivo para dispositivos móveis"

**Auth requirement:** Anonymous _(source: §Authorization Matrix — mesma rota da tela de resultados)_

**Rendering strategy:** a mesma ResultsPage (RSC). O estado expandido da busca é da `SiteNavbar` (`"use client"`) _(per home-busca/TD-07, home-busca/TD-08)_.

**Reused DS components:**
- `app/results/page.tsx (new)` — ResultsPage — **neste plano, `app/(site)/(feed)/results/page.tsx`**
- `components/layout/site-navbar.tsx` — SiteNavbar — Aqui no **estado de busca expandida**: a barra inteira (375×65) é ocupada por `search-back-button` + `search-form`
- `components/ui/icon-button.tsx` — SearchBackButton (84:382) — Botão só com ícone, 40×40. Recolhe a busca expandida e volta para a barra fechada
- `components/icons/arrow-back-icon.tsx` — ArrowBackIcon — Glifo dentro de SearchBackButton. **O nome no Figma difere do arquivo:** é o glifo de seta para trás que já existe (`ArrowBackIcon`)
- `components/layout/search-form.tsx (new)` — SearchForm — o mesmo componente do desktop, no layout móvel, com o submit só com ícone no lugar do rótulo "Buscar"
- `components/ui/icon-button.tsx` — SearchSubmitButton (84:389) — `icon-button` 40×40 no mobile, em vez do botão com rótulo
- `components/icons/search-icon.tsx (new)` — SearchIcon
- `components/videos/video-grid.tsx (new)` — VideoGrid — coluna única
- `components/videos/video-card.tsx` — VideoCard — `size=mobile`
- `components/ui/avatar.tsx` — Avatar
- `components/ui/pagination.tsx` — Pagination — centralizada

_Elementos puro-DOM sem arquivo próprio_: `ResultsHeading` (84:394), `top-decorative-strip` (84:380), `main-dashed-container` (84:393) e `footer-pagination` (84:420).

**Server-connected components:**
- `ResultsPage` (84:379) — verbo: exibir os resultados da busca em coluna única no viewport móvel | endpoint: RSC → `GET /videos?q&offset&limit` (sem rota BFF) | reuse: `app/results/page.tsx (new)`

**Behaviors:**

*Rendered states:*
- Busca expandida: `SearchBackButton` + `SearchForm` ocupam a barra inteira. BrandLogo, `SearchToggleButton`, `MenuButton` e o controle de sessão ficam ocultos enquanto a busca estiver expandida.
- Lista em coluna única, cards na largura do contêiner, e paginação centralizada com as regras da home mobile.
- Termo curto, vazio, loading e error: os mesmos da tela desktop, em coluna única. Não há frame mobile desses estados; o layout é argumentado *(per home-busca/TD-08)*.

*Interactions:*
- `SearchBackButton` click → recolhe a busca e devolve a barra fechada da tela "Página inicial — mobile", com o foco de volta no `SearchToggleButton`.
- `SearchForm` submit (ícone) → navega para `/results?q={termo}`.
- Expandir a busca foca o input.

**Error Catalog → UX mapping:** os mesmos da tela "Resultados da busca".

**Client-side validation mirror:** a mesma do `SearchForm`.

**Accessibility notes:**
- `SearchBackButton` é um `<button>` real com `aria-label="Fechar busca"`.
- `SearchSubmitButton` é um `<button type="submit">` com `aria-label="Buscar"`.
- O input tem `<label>` visualmente oculto e `type="search"`.
- O foco vai para o input ao expandir e volta ao `SearchToggleButton` ao recolher.

#### Screen: Menu de navegação — mobile

**Route:** `/` no desenho; o menu é chrome global e abre sobre qualquer rota com navbar
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=84-425 (node `FetKyb1V02WS5D6VCatK6t:84:425`)
**Purpose:** "Header/navbar com logo, barra de busca, botão de login/avatar e navegação"

**Auth requirement:** Mixed — specify manually per screen Observations hint.
_Derivação: o sheet existe para os dois públicos. O frame desenhado é o autenticado, com identidade, links do studio e "Sair"; a variante anônima ("Entrar" + Início) foi fixada no resolve. A heurística do mais restritivo escolheria `Authenticated` por causa do `POST /api/auth/logout`._

**Rendering strategy:** `NavigationSheet` (`"use client"`), composta sobre `components/ui/sheet.tsx`. A identidade chega por props, já resolvida no servidor pelo `PublicSiteNavbar` (`getViewerChannel()`: `name` e `nickname` do canal); o `SessionContext` não carrega nome nem nickname _(per phase-02-auth-frontend/TD-06, home-busca/TD-07)_.

**Reused DS components:**
- `app/page.tsx` — HomePage — fundo do frame; os verbos da página não se repetem aqui
- `components/layout/site-navbar.tsx` — SiteNavbar — fica atrás do overlay e conserva o `menu-button` que abriu o sheet
- `components/layout/public-site-navbar.tsx` — PublicSiteNavbar — **Nesta tela** carrega um verbo novo: repassar à NavigationSheet a identidade que aparece em `sheet-user` (84:495). Hoje passa só `channelName` ao `ChannelUserMenu` e também vai precisar passar o nickname
- `components/auth/brand-logo.tsx` — BrandLogo
- `components/icons/streamtube-icon.tsx` — StreamtubeIcon
- `components/ui/icon-button.tsx` — SearchToggleButton (84:435), MenuButton (84:439) e CloseButton (84:491)
- `components/icons/search-icon.tsx (new)` — SearchIcon
- `components/icons/menu-icon.tsx (new)` — MenuIcon
- `components/icons/x-icon.tsx (new)` — XIcon — ícone dentro de CloseButton
- `components/videos/category-filter.tsx (new)` — CategoryFilter
- `components/videos/category-chip.tsx (new)` — CategoryChip
- `components/videos/video-grid.tsx (new)` — VideoGrid
- `components/videos/video-card.tsx` — VideoCard
- `components/ui/avatar.tsx` — Avatar — do canal no card e do usuário em `sheet-user`
- `components/layout/navigation-sheet.tsx (new)` — NavigationSheet — Painel lateral de 288px ancorado à direita. Abrir e fechar é estado do cliente, sobre o Dialog do `radix-ui`, com foco preso, Esc e toque fora fechando. Não lê nem grava dados: recebe a identidade como props do PublicSiteNavbar e o handler de logout de quem a renderiza — **neste plano, o handler vem do hook `useLogout` (`lib/auth/use-logout.ts`)**
- `components/ui/button.tsx` — SairButton (84:510) — Mesma ação "Sair" do UserMenu do desktop, em outro lugar. Dispara o logout via Route Handler BFF `POST /api/auth/logout`. Variante outline, à esquerda, sem largura total. _Resolvido 2026-10-06: logout **herdado da Fase 02**, sem verbo nesta fatia (mesmo tratamento da Fase 04)._
- `components/ui/sheet.tsx` (new) — Sheet — primitivo shadcn do qual a NavigationSheet é composta *(per home-busca/TD-07, Revision de 2026-10-11)*

_Elementos puro-DOM sem arquivo próprio_, todos internos à NavigationSheet:
- `menu-overlay` (84:487), que é o overlay do primitivo;
- `sheet-header` (84:489), com o título "Menu" como título acessível do diálogo;
- `sheet-user` (84:495), com Avatar, nome e `@nickname`, agora como link "Seu canal" para `/@{nickname}`;
- `divider` (84:501, 84:509) e `sheet-nav` (84:502);
- os links `SheetLinkInicio` (84:503), `SheetLinkCanaisSeguidos` (84:505) e `SheetLinkMeusVideos` (84:507).

**Server-connected components:**
- `PublicSiteNavbar` (84:427) → `NavigationSheet` (84:488) → `sheet-user` (84:495) — verbo: exibir no menu de navegação a identidade do usuário logado (nome e @handle) | endpoint: RSC → `GET /me/channel` por `getViewerChannel()` (`name`, `nickname`; auth opcional, sem rota BFF) | reuse: `components/layout/public-site-navbar.tsx`
- `SairButton` (84:510) — sem verbo nesta fatia (logout herdado da Fase 02) | endpoint: `POST /api/auth/logout` (rota BFF existente, sem mudança de contrato — §API Contracts → BFF tier) | reuse: `components/ui/button.tsx`

**Behaviors:**

*Rendered states:*
- Aberto, logado: header "Menu" + `CloseButton`; `sheet-user` com avatar, nome e `@nickname`; divisor; links Início, Canais seguidos e Meus vídeos (o da rota atual destacado); divisor; "Sair".
- Aberto, anônimo: header "Menu" + `CloseButton`; botão "Entrar" (link para `/login`) no lugar de `sheet-user`; divisor; só o link Início. Sem "Sair" *(per home-busca/TD-07, Revision de 2026-10-11)*. Variante sem desenho, argumentada.
- Saindo: "Sair" desabilitado enquanto o logout está em curso (`isSigningOut`).

*Interactions:*
- `MenuButton` click → abre o sheet. `CloseButton`, Esc ou toque no overlay → fecha.
- Click em link do sheet → navega e fecha o sheet.
- `sheet-user` click → navega para `/@{nickname}` e fecha o sheet.
- "Sair" click → `signOut()` do `useLogout`: `POST /api/auth/logout`, depois `router.push("/login")` e `router.refresh()`.

**Error Catalog → UX mapping:** não se aplica. O hook mantém o comportamento de hoje do `ChannelUserMenu`: a resposta do `POST` não é checada, e só uma falha de rede interrompe a navegação para `/login`.

**Client-side validation mirror:** não se aplica.

**Accessibility notes:**
- O título "Menu" é o título acessível do diálogo.
- O `<nav>` do sheet tem `aria-label` próprio, distinto do `<nav>` da navbar.
- O link da rota corrente leva `aria-current="page"`.
- `MenuButton` com `aria-expanded="true"` enquanto aberto; `CloseButton` com `aria-label="Fechar menu"`.
- O foco fica preso no sheet e volta ao `MenuButton` ao fechar.

### UI ↔ API Traceability Matrix

| Verb | Component | Screen | Endpoint (from API Contracts) | TD ref |
|------|-----------|--------|-------------------------------|--------|
| Exibir no header o controle de sessão do visitante (Entrar ou avatar) | PublicSiteNavbar (83:129) | / | RSC → `GET /me/channel` por `getViewerChannel()` (auth opcional; sem rota BFF) | home-busca/TD-07, phase-02-auth-frontend/TD-06 |
| Exibir a grade de vídeos publicados mais recentes (thumbnail, título, canal, visualizações e tempo de publicação) | HomePage (83:127) | / | RSC → `GET /videos?offset&limit` (upstream direto; sem rota BFF) | home-busca/TD-01, home-busca/TD-03, home-busca/TD-09 |
| Filtrar a grade de vídeos pela categoria selecionada | HomePage (83:127) | / | RSC → `GET /videos?category&offset&limit` | home-busca/TD-01 |
| Exibir a página selecionada da listagem de vídeos | HomePage (83:127) | / | RSC → `GET /videos?offset&limit`, com `offset` derivado de `?page=N` | home-busca/TD-02 |
| Exibir cada vídeo da grade com thumbnail, duração, título, canal (avatar e nome), visualizações e tempo de publicação | VideoCard (83:170) | / | — (item de `GET /videos` recebido por props) | home-busca/TD-01 |
| Exibir no header o controle de sessão do visitante (Entrar ou avatar) | PublicSiteNavbar (83:313) | /results | RSC → `GET /me/channel` por `getViewerChannel()` | home-busca/TD-07, phase-02-auth-frontend/TD-06 |
| Exibir os vídeos cujo título ou canal casa com o termo buscado | ResultsPage (83:311) | /results | RSC → `GET /videos?q&offset&limit` (upstream direto; sem rota BFF) | home-busca/TD-01, home-busca/TD-04, home-busca/TD-05, home-busca/TD-09 |
| Exibir a página selecionada dos resultados da busca | ResultsPage (83:311) | /results | RSC → `GET /videos?q&offset&limit`, com `offset` derivado de `?page=N` | home-busca/TD-02 |
| Exibir cada vídeo encontrado com thumbnail, título, canal, visualizações e tempo de publicação | VideoCard (83:343) | /results | — (item de `GET /videos` recebido por props) | home-busca/TD-05 |
| Informar que nenhum vídeo casa com o termo buscado | ResultsPage (83:437) | /results | RSC → `GET /videos?q` com `total === 0` | home-busca/TD-04, home-busca/TD-05 |
| Exibir a listagem de vídeos em coluna única no viewport móvel | HomePage (84:299), renderizando a VideoGrid (84:338) em coluna única | / | RSC → `GET /videos?category&offset&limit` | home-busca/TD-08 |
| Exibir os resultados da busca em coluna única no viewport móvel | ResultsPage (84:379), renderizando a VideoGrid "video-list" (84:397) em coluna única | /results | RSC → `GET /videos?q&offset&limit` | home-busca/TD-08 |
| Exibir no menu de navegação a identidade do usuário logado (nome e @handle) | PublicSiteNavbar (84:427) → NavigationSheet (84:488) → sheet-user (84:495) | / | RSC → `GET /me/channel` (`name`, `nickname`) por `getViewerChannel()` | home-busca/TD-07 |

_Capabilities marked in `## Non-UI / Deferred Capabilities` are excluded from this matrix._ Nesta fatia a seção está `_None._`, então nenhuma linha foi excluída.

_Nenhuma linha cita rota BFF: todas as leituras são do Server Component, por decisão e não por lacuna. O strict-BFF governa o tráfego do navegador, e paginação e busca são navegação, sem fetch de cliente. O único tráfego do navegador ao BFF nesta fatia é o `POST /api/auth/logout` existente, que não tem verbo aqui porque o logout é herdado da Fase 02._

---

## Dependency Map

```
Backend
SI-07.1 (root) — migration de extensões e índices
└── SI-07.2 — depends on SI-07.1 (a busca usa immutable_unaccent e os índices)
    └── SI-07.3 — depends on SI-07.2 (o controller delega a listFeed)
        └── SI-07.4 — depends on SI-07.3 (a rota precisa existir antes do export do OpenAPI)

Bootstrap e chrome do frontend
SI-07.0.1 (root) — sheet do shadcn
SI-07.0.2 (root) — CategoryChip
SI-07.5 (root) — useLogout
SI-07.6 (root) — VideoCard estendido e chamadores migrados
SI-07.0.3 — depends on SI-07.0.1 (NavigationSheet compõe o sheet)
SI-07.0.4 — depends on SI-07.0.2 (CategoryChip) + SI-07.0.3 (SearchIcon) + SI-07.6 (VideoCard)
SI-07.7 — depends on SI-07.6 (move as páginas que o SI-07.6 editou)
├── SI-07.8 — depends on SI-07.7 + SI-07.0.3 (SearchForm) + SI-07.5 (useLogout)
└── SI-07.9 — depends on SI-07.7 (retrofit sobre as páginas nos route groups)

Telas (audit .0 → visual a → lógica b)
SI-07.10.0 — depends on SI-07.0.2, SI-07.0.3, SI-07.0.4
└── SI-07.10a — depends on SI-07.10.0 + bootstrap + SI-07.7
    └── SI-07.10b — depends on SI-07.10a + SI-07.3 + SI-07.4 + SI-07.8   ← ponto de encontro BE ↔ FE
SI-07.11.0 — depends on SI-07.0.3, SI-07.0.4
└── SI-07.11a — depends on SI-07.11.0 + bootstrap + SI-07.7
    └── SI-07.11b — depends on SI-07.11a + SI-07.3 + SI-07.4 + SI-07.10b (FEED_PAGE_SIZE, error.tsx)
SI-07.12.0 — depends on SI-07.0.3, SI-07.0.4
└── SI-07.12a — depends on SI-07.12.0 + bootstrap + SI-07.11a
    └── SI-07.12b — depends on SI-07.12a + SI-07.3 + SI-07.11b
SI-07.13.0 — depends on SI-07.0.2, SI-07.0.3, SI-07.0.4
└── SI-07.13a — depends on SI-07.13.0 + bootstrap + SI-07.10a
    └── SI-07.13b — depends on SI-07.13a + SI-07.0.3 + SI-07.8 + SI-07.10b
SI-07.14.0 — depends on SI-07.0.3, SI-07.0.4
└── SI-07.14a — depends on SI-07.14.0 + bootstrap + SI-07.11a + SI-07.13a
    └── SI-07.14b — depends on SI-07.14a + SI-07.13b + SI-07.11b
SI-07.15.0 — depends on SI-07.0.1, SI-07.0.2, SI-07.0.3, SI-07.0.4
└── SI-07.15a — depends on SI-07.15.0 + bootstrap + SI-07.13a
    └── SI-07.15b — depends on SI-07.15a + SI-07.5 + SI-07.8 + SI-07.13b
```

"bootstrap" nas linhas `a` são os SIs `SI-07.0.k` listados no `**Dependencies:**` de cada uma.

Ordem de execução sugerida, topológica: SI-07.1 → 07.2 → 07.3 → 07.4 → 07.0.1 → 07.0.2 → 07.5 → 07.6 → 07.0.3 → 07.0.4 → 07.7 → 07.8 → 07.9 → 07.10.0 → 07.10a → 07.10b → 07.11.0 → 07.11a → 07.11b → 07.12.0 → 07.12a → 07.12b → 07.13.0 → 07.13a → 07.13b → 07.14.0 → 07.14a → 07.14b → 07.15.0 → 07.15a → 07.15b.

---

## Deliverables

- [ ] SI-07.0.1 — Infra: install batch shadcn primitives
- [ ] SI-07.0.2 — Custom-business complex: CategoryChip
- [ ] SI-07.0.3 — Custom-business simple group: MenuIcon + SearchIcon + XIcon + NavigationSheet + SearchForm
- [ ] SI-07.0.4 — Custom-business simple group: CategoryFilter + SearchEmptyState + VideoGrid
- [ ] SI-07.1 — Infra: migration de extensões e índices da listagem e da busca
- [ ] SI-07.2 — Consolidar a regra "listável" e implementar a listagem global no VideosService
- [ ] SI-07.3 — Endpoint GET /videos
- [ ] SI-07.4 — Infra: sincronizar o contrato OpenAPI e o mock da listagem global
- [ ] SI-07.5 — Hook de logout compartilhado
- [ ] SI-07.6 — Estender o VideoCard e migrar os chamadores
- [ ] SI-07.7 — Navbar montada em layout: route groups `(site)` e `(feed)`
- [ ] SI-07.8 — Navbar desktop: busca, links por sessão, "Seu canal" e logout pelo hook
- [ ] SI-07.9 — Retrofit responsivo das telas existentes
- [ ] SI-07.10.0 — Drift audit: Página inicial
- [ ] SI-07.10a — Tela de Página inicial (visual shell)
- [ ] SI-07.10b — Tela de Página inicial (lógica & wiring)
- [ ] SI-07.11.0 — Drift audit: Resultados da busca
- [ ] SI-07.11a — Tela de Resultados da busca (visual shell)
- [ ] SI-07.11b — Tela de Resultados da busca (lógica & wiring)
- [ ] SI-07.12.0 — Drift audit: Resultados da busca — sem resultados
- [ ] SI-07.12a — Tela de Resultados da busca — sem resultados (visual shell)
- [ ] SI-07.12b — Tela de Resultados da busca — sem resultados (lógica & wiring)
- [ ] SI-07.13.0 — Drift audit: Página inicial — mobile
- [ ] SI-07.13a — Tela de Página inicial — mobile (visual shell)
- [ ] SI-07.13b — Tela de Página inicial — mobile (lógica & wiring)
- [ ] SI-07.14.0 — Drift audit: Resultados da busca — mobile
- [ ] SI-07.14a — Tela de Resultados da busca — mobile (visual shell)
- [ ] SI-07.14b — Tela de Resultados da busca — mobile (lógica & wiring)
- [ ] SI-07.15.0 — Drift audit: Menu de navegação — mobile
- [ ] SI-07.15a — Tela de Menu de navegação — mobile (visual shell)
- [ ] SI-07.15b — Tela de Menu de navegação — mobile (lógica & wiring)

**Per-screen deliverables** _(ui_in_scope: true)_:

- [ ] Screen Página inicial (`/`) is routable
- [ ] Screen Página inicial (`/`) renders loading, success, empty and error states
- [ ] Screen Página inicial (`/`) passes component tests (per testing-guide-next-frontend layers)
- [ ] Screen Resultados da busca (`/results`) is routable
- [ ] Screen Resultados da busca (`/results`) renders loading, success, short-term and error states
- [ ] Screen Resultados da busca (`/results`) passes component tests (per testing-guide-next-frontend layers)
- [ ] Screen Resultados da busca — sem resultados (`/results` com zero vídeos) renders the empty state
- [ ] Screen Página inicial — mobile (`/` a 375px) renders the closed bar, single column and centered pagination
- [ ] Screen Resultados da busca — mobile (`/results` a 375px) renders the expanded search and single column
- [ ] Screen Menu de navegação — mobile (sheet a 375px) renders the logged-in and anonymous variants
- [ ] Screens Menu de navegação — mobile and Página inicial — mobile pass component tests (per testing-guide-next-frontend layers)

**Full test suites** _(uma suíte de cada vez — nunca backend e frontend em paralelo; o backend sempre com `--runInBand`)_:

- [ ] Backend tests pass (`docker compose exec nestjs-api npm test -- --runInBand`)
- [ ] Backend E2E tests pass (`docker compose exec nestjs-api npm run test:e2e`)
- [ ] Backend type check passes (`docker compose exec nestjs-api npx tsc --noEmit`)
- [ ] Backend lint passes (`docker compose exec nestjs-api npm run lint`)
- [ ] Frontend tests pass (`docker compose exec next-frontend npm test`)
- [ ] Frontend type check passes (`docker compose exec next-frontend npx tsc --noEmit`)
- [ ] Frontend lint passes (`docker compose exec next-frontend npm run lint`)
- [ ] Frontend E2E tests pass on the host (`npx playwright test`, from `next-frontend/`, with the containerized dev server running with `MSW_ENABLED=true` per `next-frontend/CLAUDE.md` § E2E test prerequisites)
- [ ] OpenAPI contract is fresh (rerunning `scripts/sync-openapi.sh` + `npm run openapi:types` produces no diff)
