# phase-07-home-busca — Progress

**Status:** completed
**SIs:** 31/31 completed

### SI-07.1 — Infra: migration de extensões e índices da listagem e da busca
- **Status:** completed
- **Tests:** 3 passing (14 no arquivo)
- **Observations:**
  - Migration criada pelo `migration:create` do CLI e preenchida à mão: o CLI não gera extensão, função nem índice de expressão. Aplicada, revertida e reaplicada no banco de dev.

### SI-07.2 — Consolidar a regra "listável" e implementar a listagem global no VideosService
- **Status:** completed
- **Tests:** 52 passing (escape-like-pattern 3, listFeed 9, consultas por canal 2, mais as suítes existentes de VideosService)
- **Observations:**
  - O termo é escapado em JS e normalizado no próprio SQL, como `'%' || immutable_unaccent(lower(:term)) || '%'`, um parâmetro só para as três colunas. O nickname usa o mesmo padrão em vez de um `:nicknamePattern` separado; como o nickname é [a-z0-9_], o resultado é o mesmo.
  - O mapeamento do item virou `toListItem`, compartilhado por `listSuggestions` e `listFeed`.

### SI-07.3 — Endpoint GET /videos
- **Status:** completed
- **Tests:** 9 passing (test/videos-feed.e2e-spec.ts)
- **Observations:**
  - Os donos e canais do e2e são gravados direto pelo repositório, sem register/confirm/login: a rota é pública e a resposta não depende de sessão.

### SI-07.4 — Infra: sincronizar o contrato OpenAPI e o mock da listagem global
- **Status:** completed
- **Tests:** no tests (Infra); verificação descartável do handler MSW: total 30, q=docker 13 (página 1 termina em Vídeo 26, página 2 = Vídeo 29), q=musica 1, Música 5, Outros e xyzabc vazios, erro-upstream 500
- **Observations:**
  - O `.next` local estava corrompido (validator.ts truncado). Foi apagado, e o `npx next typegen` regenerou o `RouteContext`; sem isso o `tsc --noEmit` falhava em todas as rotas dinâmicas.
  - O `nest build` do `openapi:export` recompila o `dist/`, então o video-worker foi reiniciado.

### SI-07.0.1 — Infra: install batch shadcn primitives
- **Status:** completed
- **Tests:** no tests (Infra)
- **Observations:**
  - O `shadcn add sheet` gerou `import { cn } from "cn"` e o `XIcon` do `lucide-react`, e acrescentou o pacote `cn` ao package.json. O package.json e o lock foram revertidos (`npm ci`), o `cn` passou a vir de `@/lib/utils` e o ícone virou `components/icons/x-icon.tsx`, criado aqui pela regra de ícones (ele estava previsto no SI-07.0.3).
  - O botão fechar do sheet usava `size=\"icon-sm\"`, que o nosso Button não tem. Trocado para `size=\"icon\"`, com rótulo sr-only "Fechar". O shadcn pediu para sobrescrever o `button.tsx` e a resposta foi não.

### SI-07.0.2 — Custom-business complex: CategoryChip
- **Status:** completed
- **Tests:** 3 passing
- **Observations:**
  - O visual (pílula, borda `border-border` no default, `bg-primary` no selected, 32px de altura) foi derivado do PNG em cache (83-127.png) e da árvore 83-126. O cache não traz fills nem padding, e a cota do MCP do Figma é curta, então não houve chamada nova.

### SI-07.5 — Hook de logout compartilhado
- **Status:** completed
- **Tests:** 6 passing (use-logout 2 + wiring do ChannelUserMenu 4, inalterado)
- **Observations:** none

### SI-07.6 — Estender o VideoCard e migrar os chamadores
- **Status:** completed
- **Tests:** 19 passing (video-card 12, sidebar-load-more 7)
- **Observations:**
  - Thumbnail e avatar são links fora da ordem de tabulação (`tabIndex=-1`, `aria-hidden`). Os links nomeados são o título e o nome do canal, que levam aos mesmos destinos; assim o leitor de tela não ouve dois links iguais.
  - O título usa `line-clamp-2` só quando a linha do canal aparece. Sem canal (página do canal, sidebar) ele continua com `truncate` em 1 linha, para não mudar o desenho das Fases 04/05. O `sizes` do desktop continua `233px`; o do mobile é `100vw`.

### SI-07.0.3 — Custom-business simple group: MenuIcon + SearchIcon + XIcon + NavigationSheet + SearchForm
- **Status:** completed
- **Tests:** 10 passing (navigation-sheet 6, search-form 4)
- **Observations:**
  - A `NavigationSheet` carrega o próprio `MenuButton` como `SheetTrigger`, então o `aria-expanded` e a devolução de foco vêm do Radix. A navbar só posiciona o componente (`className`).
  - O `XIcon` já tinha sido criado no SI-07.0.1, exigido pela regra de ícones na instalação do sheet.
  - O `SearchForm` remonta o input com `key={defaultValue}`, porque a navbar sobrevive à navegação entre buscas. A cor do placeholder ficou com o `Input` do DS: sobrescrevê-la no chamador viola a regra de identidade visual, e o drift é assunto das auditorias .0.

### SI-07.0.4 — Custom-business simple group: CategoryFilter + SearchEmptyState + VideoGrid
- **Status:** completed
- **Tests:** 4 passing (category-filter)
- **Observations:**
  - O `CategoryFilter` reusa `VIDEO_CATEGORIES` de `lib/videos/edit-schema.ts`, que já é a lista do enum checada por `satisfies` contra o contrato. Não foi criada uma segunda lista.
  - O texto de dica do `SearchEmptyState` foi tirado da árvore em cache 83-437 (`empty-hint`).

### SI-07.7 — Navbar montada em layout: route groups `(site)` e `(feed)`
- **Status:** completed
- **Tests:** 19 passing (E2E de regressão: video-watch-page 7, channel-public 6, channel-videos 6)
- **Observations:**
  - As páginas movidas trocaram o `<main>` próprio por `<div>`, porque o `<main>` e o gutter (`px-4 lg:px-12`) agora são do layout `(site)`. O `not-found` da watch page deixou de renderizar uma `SiteNavbar` própria, e o `error`/`not-found` do canal trocaram `min-h-screen` por `flex-1`.
  - O layout `(studio)` perdeu o `fetchFromUpstream` de `/me/channel`, que servia só ao nome no chrome, e passa pelo `getViewerChannel` do `PublicSiteNavbar`. Com isso, falhar ao ler o canal degrada para o chrome anônimo em vez de redirecionar ao refresh. As páginas do studio continuam com o próprio guard.
  - Boot do dev server: as duas primeiras subidas com MSW_ENABLED vazaram para o upstream (`fetch failed`) e a terceira registrou o MSW. É a instabilidade sem causa raiz já conhecida.

### SI-07.8 — Navbar desktop: busca, links por sessão, "Seu canal" e logout pelo hook
- **Status:** completed
- **Tests:** 22 passing (components/layout: site-navbar 5, user-menu 5, user-menu.wiring 2, navigation-sheet 6, search-form 4); E2E de regressão do chrome: 38 passing
- **Observations:**
  - A ordem dos elementos segue o PNG da tela (83-311): logo, links, busca, sessão. O texto do SI diz "BrandLogo, depois SearchForm, depois os links"; foi seguido o desenho.
  - A parte desktop da barra fica em `hidden lg:flex`. Abaixo de `lg` só aparece a marca até o SI-07.13a, que traz a barra mobile.
  - O `user-menu.wiring.test.tsx` passou a montar a `SiteNavbar`, que é quem liga o `useLogout` ao `UserMenu`, porque o `ChannelUserMenu` foi apagado.
  - O `channel-settings` (Fase 04) falhou de forma intermitente: o `fill` antes da hidratação era apagado pelo `register` do react-hook-form. A navbar cliente deixou a hidratação mais lenta. Entrou o `waitForHydration(page, selector)` em `tests/fixtures.ts`, que espera as `__reactProps` no nó, aplicado no `beforeEach` desse spec. Sem esse helper, `channel-subscriptions` 1.1 e `video-watch-social` 3.1 também falharam uma vez com 2 workers; passaram isolados e na rodada seguinte.

### SI-07.9 — Retrofit responsivo das telas existentes
- **Status:** completed
- **Tests:** 5 passing (tests/responsive-retrofit.e2e-spec.ts)
- **Observations:**
  - O gutter fixo das telas de `(studio)`, `(auth)` e `/upload` passou a `px-4` no mobile e o valor de antes a partir de `lg`. A grade do canal ganhou `md:grid-cols-3`. A tabela do painel ficou com `relative overflow-x-auto` e `min-w-max`; sem o `relative`, o `<th class=sr-only>` (absolute) escapava do contêiner e fazia a página inteira rolar até 1005px.
  - Causa raiz do boot "sem MSW" achada e corrigida no `instrumentation.ts`: o `resetFetch()` do Next dev (`router-server.js`) restaura o fetch nativo a cada recompilação e apaga o interceptor. O `keepInterceptorAcrossFetchResets` mantém o fetch interceptado. É mudança de infraestrutura de teste fora do escopo do SI, e vai num commit separado.
  - O `next dev` do container não vê edições feitas no host (bind mount do Windows), então o servidor precisa reiniciar depois de editar código antes de rodar o Playwright.

### SI-07.10.0 — Drift audit: Página inicial
- **Status:** completed
- **Tests:** no tests (audit-only)
- **Observations:**
  - A auditoria foi feita a partir do cache do Figma (`docs/figma-cache/.../83-127.*`, `83-126`, `83-121`), sem chamada ao MCP: a conta tem cota curta, e as Fases 05/06 já trabalham cache-first. Resultado: 13 componentes, sendo 9 alinhado, 1 drift menor (gap da VideoGrid) e 3 drift relevante como exception (marca, glifo e cor do Avatar).

### SI-07.10a — Tela de Página inicial (visual shell)
- **Status:** completed
- **Tests:** no tests (visual shell)
- **Observations:**
  - Aplicada a única decisão auto-Edit do relatório: VideoGrid com `gap-x-6 gap-y-8` → `gap-6`.
  - Criado `components/videos/feed-pagination.tsx`, a paginação numerada "Anterior · 1 · 2 · 3 · Próxima" do desenho, reusada pela home e pelos resultados. O arquivo não estava listado no plano; a página do canal mostra só a página atual, e o desenho pede a janela numerada.
  - O shell foi escrito com a leitura sem filtros e a paginação fixa; o SI-07.10b ligou searchParams, categoria, estados vazios e error.tsx.

### SI-07.10b — Tela de Página inicial (lógica & wiring)
- **Status:** completed
- **Tests:** pagination 1 novo + error.tsx 2 (unit); E2E tests/pagina-inicial.e2e-spec.ts 6 passing
- **Observations:**
  - A thumbnail `desktop` passou a `sizes` responsivo (`(min-width: 1024px) 233px, (min-width: 640px) 50vw, 100vw`): a grade usa um card só em todas as larguras, e 233px fixos serviriam imagem pequena no mobile. O `mobile` continua `100vw`.
  - O E2E usa `waitForHydration` antes dos cliques em `<Link>`: sem isso, o clique na grade se perdia. O spec 1.1 depende do aquecimento de rotas do globalSetup, porque a primeira navegação para `/videos/[publicId]` passa de 5 s num dev frio.
  - A asserção de meta do card aceita qualquer tempo relativo ("ontem", "há…"): o catálogo tem data fixa.

### SI-07.11.0 — Drift audit: Resultados da busca
- **Status:** completed
- **Tests:** no tests (audit-only)
- **Observations:**
  - Feita a partir do cache (83-311), sem MCP. Resultado: 13 componentes, sendo 9 alinhado, 1 drift menor (`Input` 40px no desenho contra 36px no DS, registrado como exception por ser primitivo compartilhado) e 3 exceptions herdadas.

### SI-07.11a — Tela de Resultados da busca (visual shell)
- **Status:** completed
- **Tests:** no tests (visual shell)
- **Observations:**
  - O relatório não tem auto-Edit para esta tela; só o shell foi escrito. O `ResultsHeading` é markup da página: `<h1>` `text-h2` com o termo e a contagem em `text-caption`.

### SI-07.11b — Tela de Resultados da busca (lógica & wiring)
- **Status:** completed
- **Tests:** lib/search 8 passing; E2E tests/resultados-da-busca.e2e-spec.ts 5 passing
- **Observations:**
  - `parseSearchTerm` ganhou o caso `long` (mais de 100 caracteres), que só seria alcançado editando a URL. Ele vira aviso sem chamada ao upstream, assim como o `short`, porque o backend responderia 400. O SI pedia só empty/short/valid.
  - Os limites 3/100 saíram do `SearchForm` e passaram a morar em `lib/search.ts`, usados pelo formulário e pela página.
  - O título da aba (`generateMetadata`) é "Resultados para “{q}” · StreamTube".

### SI-07.12.0 — Drift audit: Resultados da busca — sem resultados
- **Status:** completed
- **Tests:** no tests (audit-only)
- **Observations:**
  - Feita a partir do cache (83-437), sem MCP. Resultado: 11 componentes, sendo 7 alinhado, 1 drift menor (Input, exception) e 3 exceptions herdadas. Nenhum auto-Edit.

### SI-07.12a — Tela de Resultados da busca — sem resultados (visual shell)
- **Status:** completed
- **Tests:** no tests (visual shell)
- **Observations:**
  - Sem decisão a aplicar: o `SearchEmptyState` (alvo do SI) já tinha sido escrito a partir do frame 83:437 no SI-07.0.4, e a auditoria o deu como alinhado. Nada a editar no shell.

### SI-07.12b — Tela de Resultados da busca — sem resultados (lógica & wiring)
- **Status:** completed
- **Tests:** E2E tests/resultados-da-busca-sem-resultados.e2e-spec.ts 3 passing
- **Observations:** none

### SI-07.13.0 — Drift audit: Página inicial — mobile
- **Status:** completed
- **Tests:** no tests (audit-only)
- **Observations:**
  - Feita a partir do cache (84-299), sem MCP. Resultado: 13 componentes, sendo 9 alinhado e 4 drift relevante. Um deles é auto-Edit: a barra fechada `navbar-actions` (busca + menu) falta na `SiteNavbar`. Os outros três são exceptions herdadas.

### SI-07.13a — Tela de Página inicial — mobile (visual shell)
- **Status:** completed
- **Tests:** no tests (visual shell)
- **Observations:**
  - Aplicado o auto-Edit do relatório: a `SiteNavbar` ganhou a barra fechada abaixo de `lg` (`data-slot=navbar-actions`), com o `IconButton` ghost 40×40 "Buscar" e a `NavigationSheet`, que traz o botão "Abrir menu". O header passou a `px-4 py-3` no mobile e `lg:px-12 lg:py-5` a partir de `lg`. As classes responsivas da home (faixa rolável, coluna única, paginação centralizada) já vinham do SI-07.0.4, do `FeedPagination` e do SI-07.10a.

### SI-07.13b — Tela de Página inicial — mobile (lógica & wiring)
- **Status:** completed
- **Tests:** site-navbar 9 passing (5 + 4 da barra mobile); search-form 5; E2E tests/pagina-inicial-mobile.e2e-spec.ts 4 passing
- **Observations:**
  - O botão "Buscar" da barra mobile é um só elemento. Fechado, ele abre a busca (`aria-expanded`/`aria-controls`). Aberto, vira o submit do form pelo atributo `form`, e por isso a variante mobile do `SearchForm` deixou de renderizar botão próprio. Isso mudou o contrato do SI-07.0.3, e o teste do `SearchForm` foi ajustado.
  - A busca mobile já nasce aberta em /results, sem roubar o foco; a busca aberta pelo botão foca o campo. Ao trocar de rota, o estado volta ao padrão da rota nova (ajuste durante o render, sem efeito). Isso já adianta a lógica do SI-07.14b.
  - Com o sheet aberto, o Radix põe `aria-hidden` no resto da árvore. O E2E lê o `aria-expanded` do "Abrir menu" por seletor CSS, não por papel.

### SI-07.14.0 — Drift audit: Resultados da busca — mobile
- **Status:** completed
- **Tests:** no tests (audit-only)
- **Observations:**
  - Feita a partir do cache (84-379), sem MCP. Resultado: 9 componentes, sendo 8 alinhado e 1 drift relevante (Avatar, exception herdada). Nenhum auto-Edit: o estado expandido já tinha saído no SI-07.13b.

### SI-07.14a — Tela de Resultados da busca — mobile (visual shell)
- **Status:** completed
- **Tests:** no tests (visual shell)
- **Observations:**
  - Sem decisão a aplicar. O estado expandido da `SiteNavbar` (`SearchBackButton` "Fechar busca" com `ArrowBackIcon` + `SearchForm` mobile) e as classes da `ResultsPage` (o mesmo heading, a `VideoGrid` em coluna única e o `FeedPagination` centralizado abaixo de `sm`) já existem.

### SI-07.14b — Tela de Resultados da busca — mobile (lógica & wiring)
- **Status:** completed
- **Tests:** E2E tests/resultados-da-busca-mobile.e2e-spec.ts 3 passing; unit da SiteNavbar já cobre /results expandido, a recolha com foco e o padrão recolhido fora de /results (SI-07.13b)
- **Observations:**
  - A lógica (estado inicial em /results, "Fechar busca" devolvendo o foco ao toggle, submit pelo ícone) foi escrita junto da barra mobile no SI-07.13b, porque é o mesmo estado da `SiteNavbar`. Este SI só acrescentou o E2E.

### SI-07.15.0 — Drift audit: Menu de navegação — mobile
- **Status:** completed
- **Tests:** no tests (audit-only)
- **Observations:**
  - Feita a partir do cache (84-425), sem MCP. Resultado: 16 componentes, sendo 11 alinhado, 1 drift menor e 4 drift relevante. Há dois auto-Edit: na NavigationSheet, o inset do divisor e o padding dos links; no Sheet, o overlay `bg-black/10` → `bg-overlay/40`. As outras três são exceptions herdadas.

### SI-07.15a — Tela de Menu de navegação — mobile (visual shell)
- **Status:** completed
- **Tests:** no tests (visual shell)
- **Observations:**
  - Aplicados os auto-Edit do relatório. NavigationSheet: divisores com `mx-4`, e `sheet-nav` de `p-2` para `px-4 py-2`. Sheet: overlay de `bg-black/10` para `bg-overlay/40`. A checagem de variantes não achou irmão `dark:`/estado sobre `bg` no overlay.
  - Updated existing DS: `components/ui/sheet.tsx` (+variant 'overlay' (retuned)).

### SI-07.15b — Tela de Menu de navegação — mobile (lógica & wiring)
- **Status:** completed
- **Tests:** navigation-sheet 7 (+1 fechar ao navegar) e navigation-sheet.wiring 2 (unit); E2E tests/menu-de-navegacao-mobile.e2e-spec.ts 5 passing
- **Observations:**
  - Faltava o mapeamento `--color-overlay: var(--overlay)` no `@theme inline` do `globals.css`, então `bg-overlay` não gerava nada. Foi registrado para o overlay do sheet. Efeito colateral: o badge de duração do `VideoCard` (Fase 04) também usava `bg-overlay` e estava transparente; agora tem o fundo escuro do desenho.

## Final verification (2026-10-11)

- Backend unit + integração (`npm test -- --runInBand`): 51 suítes, 338/338.
- Backend e2e (`npm run test:e2e`): 171/172 na rodada completa. A falha foi timeout de 5 s em `videos-upload` (Fase 03, intocado), com a suíte levando 890 s contra ~200 s no normal. O arquivo isolado passou 3/3 (2,9 s).
- Backend `tsc --noEmit`: exit 0. `npm run lint`: 0 erros e 1 warning antigo (`auth.service.integration-spec.ts`).
- Frontend Vitest (`npm test`): 89 arquivos, 478/478. `tsc --noEmit`: exit 0, depois do `next typegen`. `npm run lint`: 0 erros e 3 warnings antigos (react-hooks/incompatible-library em signup-form, new-comment-form e video-edit-form).
- Frontend Playwright: 96/96 na segunda rodada. Na primeira deu 95/96: `channel-videos` 1.3 usava um seletor `[aria-current='page']` sem escopo, que passou a casar também com o link "Meus vídeos" da navbar nova. O seletor foi escopado na paginação.
- Frescor do OpenAPI: `openapi:export` + `sync-openapi.sh` + `openapi:types` deixam os três arquivos byte-idênticos.
