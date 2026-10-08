# phase-07-home-busca — Screen Inventory

> **Phase:** Fase 07 — Página Inicial, Busca e Finalização (fatia `home-busca`)
> **Status:** Validated
> **Date:** 2026-10-06
> **Screens in scope:** 6
> **Figma source:** cache `docs/figma-cache/FetKyb1V02WS5D6VCatK6t/` (harvested 2026-10-06, nas mesmas 2 chamadas `use_figma` que desenharam as telas). MCP calls spent by this run: 0.

---

## Screen: Página inicial

**Route:** `/`
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=83-127 (node `FetKyb1V02WS5D6VCatK6t:83:127`)
**Purpose (from project-plan.md):** "Página inicial com grid de vídeos (thumbnail, título, canal, visualizações e tempo de publicação)"

### Component inventory

| Component (Figma node) | Type | In DS? | Reuse? | Notes |
|---|---|---|---|---|
| HomePage (83:127, `home`) | Server-connected | ✓ | `app/page.tsx` | Server Component da rota `/`, dono da busca da listagem: lê `category`/`page` de `searchParams`, faz uma chamada (home-busca/TD-01 B, TD-02 A, TD-03 A) e repassa os itens à VideoGrid. Mesmo padrão de `app/channels/[nickname]/page.tsx`. O arquivo existe, mas hoje é o placeholder do `create-next-app` e será reescrito. _Resolvido 2026-10-06 (dono do fetch = página RSC; ver Decisions log do progress)._ |
| SiteNavbar (`navbar` 83:129) | Presentational | ✓ | `components/layout/site-navbar.tsx` | Herdado da fase 06 (source: phase-06). **Estendido na Fase 07:** passa a hospedar `nav-links` (83:136) e o SearchForm (83:138), além de BrandLogo e do controle de sessão. Por home-busca/TD-07 (Option A, PENDING) fica só a barra superior, com menu em sheet no mobile, e a navbar passa a ser montada uma vez no layout, e não mais em cada página. Esta frame mostra a variante **anônima** |
| PublicSiteNavbar (`navbar` 83:129) | Server-connected | ✓ | `components/layout/public-site-navbar.tsx` | Mesmo nó Figma do SiteNavbar, com linha própria. É o wrapper async (Server Component) que chama `getViewerChannel()` e decide entre ChannelUserMenu (logado) e o botão "Entrar" (anônimo). Aqui renderiza o ramo anônimo (`entrar-button` 83:146) |
| BrandLogo (`brand-logo` 83:130) | Presentational | ✓ | `components/auth/brand-logo.tsx` | Herdado da fase 06 (source: phase-06). `logo-box` (83:131) e o texto "EstúdioCriador" (83:135) são markup interno e não têm linha |
| StreamtubeIcon (`play-icon` 83:132) | Presentational | ✓ | `components/icons/streamtube-icon.tsx` | Herdado da fase 06 (source: phase-06). Glyph dentro de BrandLogo/logo-box (83:131). Tem linha própria pela regra de granularidade de ícones; `play` (83:133) e `Vector` (83:134) são os vetores do glyph, sem linha |
| nav-link-inicio (83:137) | Local-interactive | ✗ | new | Link "Início" para `/`, dentro de `nav-links` (83:136). Mesmo tratamento do nav-link-canais-seguidos da fase 06: `<Link>` do Next.js escrito inline em `components/layout/site-navbar.tsx`, sem arquivo próprio. É navegação pura. O estado de "link ativo" é cliente (home-busca/TD-06), mas a projeção compacta não carrega fills e não permite ver se ele aparece destacado aqui |
| SearchForm (`search-form` 83:138, com `search-input` 83:139 e `search-submit-button` 83:144) | Local-interactive | ✗ | `components/layout/search-form.tsx (new)` | Envio explícito via `next/form` para `/results?q=` (home-busca/TD-06, Option A, PENDING). Só navega e não faz I/O próprio: quem busca é a listagem da tela de resultados. Placeholder "Buscar vídeos ou canais" (83:143) e label "Buscar" (83:145) são conteúdo do próprio form. O campo e o botão podem compor `components/ui/input.tsx` e `components/ui/button.tsx`, que já existem |
| search-icon (83:140) | Presentational | ✗ | `components/icons/search-icon.tsx (new)` | INSTANCE do componente Figma `search-icon`, glyph dentro de `search-input` (83:139) no SearchForm. Tem linha própria pela regra de ícones. Os dois `Vector` (I83:140;83:83 e I83:140;83:84) são o glyph, sem linha |
| LoginButton "Entrar" (`entrar-button` 83:146) | Local-interactive | ✓ | `components/ui/button.tsx` | Herdado da fase 06 (source: phase-06). `<Link>` do Next.js para `/login`, sem mutation. Label "Entrar" (83:147). É o ramo anônimo do PublicSiteNavbar |
| CategoryFilter (`category-filter` 83:149) | Local-interactive | ✗ | `components/videos/category-filter.tsx (new)` | Linha de 9 chips: "Todos" + as 8 categorias. Navega por URL (`/?category=<valor do enum>`, valor cru e percent-encoded, por home-busca/TD-01 Option B, PENDING) e não filtra dados já carregados no cliente. "Todos" corresponde à home sem `category`. Os 8 rótulos batem, inclusive na ordem, com o enum de categoria do `openapi.json`, então a lista é estática e não precisa de fetch |
| CategoryChip (component set 83:126; 9 instâncias: 83:150 `state=selected` "Todos", e 83:152, 83:154, 83:156, 83:158, 83:160, 83:162, 83:164, 83:166 `state=default`) | Local-interactive | ✗ | `components/videos/category-chip.tsx (new)` | Classificado uma vez para as 9 instâncias. Variantes `state=default\|selected`. `chip-label` é conteúdo do próprio chip. Cada chip é um link de navegação para a categoria e não faz I/O próprio |
| VideoGrid (`video-grid` 83:168, com `video-grid-row` 83:169, 83:214 e 83:259) | Presentational | ✗ | `components/videos/video-grid.tsx (new)` | **Não faz fetch próprio:** recebe da HomePage os itens da listagem e renderiza a grade. _Resolvido 2026-10-06 (dono do fetch = página RSC; ver Decisions log do progress)._ Faz o fetch da listagem: um endpoint com filtros opcionais (home-busca/TD-01 B), ordem mais recentes primeiro (home-busca/TD-03 A) e offset/limit por `?page=N` (home-busca/TD-02 A). Todos PENDING. Desenhado com 3 linhas × 4 colunas = 12 cards, o tamanho de página que o TD-02 sugere (múltiplo de 1, 2, 3 e 4 colunas). Os frames `video-grid-row` são markup de layout, sem linha própria |
| VideoCard (componente `video-card-feed` 83:121, variante `size=desktop` 83:99; primeira instância 83:170, 12 instâncias: 83:170, 83:181, 83:192, 83:203, 83:215, 83:226, 83:237, 83:248, 83:260, 83:271, 83:282, 83:293) | Server-connected | ✓ | `components/videos/video-card.tsx` | Herdado da fase 06 (source: phase-06). **Estendido na Fase 07:** ganha a linha de canal (`channel-avatar` + `channel-name`) e variante de tamanho `desktop\|mobile`, conforme docs/design-identity.md:99-101. O arquivo atual não tem nem uma nem outra. Classificado uma vez para as 12 instâncias. `thumbnail` e `duration-badge`/`duration-text` são markup interno: o overlay de duração já é interno ao card (decisão OQ-20) e não usa o Badge. `title` trunca em 2 linhas; `channel-name` e `meta` truncam em 1 (correção posterior ao PNG). Exibe dados que chegam do VideoGrid |
| Avatar (`channel-avatar` I83:170;83:104, igual nas 12 instâncias do card) | Presentational | ✓ | `components/ui/avatar.tsx` | Herdado da fase 06 (source: phase-06). Avatar do canal com iniciais (`channel-initials` I83:170;83:105, "JC"), dentro do VideoCard. As iniciais são conteúdo do Avatar |
| Pagination (`pagination` 83:305, dentro de `footer-pagination` 83:304) | Local-interactive | ✓ | `components/ui/pagination.tsx` | Herdado da fase 06 (source: phase-06). Mostra "Anterior", "1", "2", "3", "Próxima" (83:306–83:310), alinhada à direita. Navega por URL (`?page=N`, home-busca/TD-02 A, PENDING) sem I/O próprio: quem busca a página é o VideoGrid. Na árvore os controles são TEXT puros, sem glyph de chevron, então não há linha de ícone. O `pagination.tsx` já importa os chevrons existentes |

### Verbs of intent

| Verb | Component | Capability (project-plan.md) |
|---|---|---|
| Exibir no header o controle de sessão do visitante (Entrar ou avatar) | PublicSiteNavbar | "Header/navbar com logo, barra de busca, botão de login/avatar e navegação" |
| Exibir a grade de vídeos publicados mais recentes (thumbnail, título, canal, visualizações e tempo de publicação) | HomePage | "Página inicial com grid de vídeos (thumbnail, título, canal, visualizações e tempo de publicação)" |
| Filtrar a grade de vídeos pela categoria selecionada | HomePage | "Filtro de vídeos por categoria na home" |
| Exibir a página selecionada da listagem de vídeos | HomePage | "Paginação ou scroll infinito nas listagens de vídeos" |
| Exibir cada vídeo da grade com thumbnail, duração, título, canal (avatar e nome), visualizações e tempo de publicação | VideoCard | "Página inicial com grid de vídeos (thumbnail, título, canal, visualizações e tempo de publicação)" |

### Observations

- **Proveniência.** A fonte é só o cache `docs/figma-cache/FetKyb1V02WS5D6VCatK6t/83-127.json` (`fetched_at` 2026-10-06T23:02:00Z, `harvested_by` figma-batch, `maxDepth` 14), mais `83-121.json` (`video-card-feed`) e `83-126.json` (`category-chip`). A frame foi desenhada e colhida na mesma chamada `use_figma`, e esta run fez 0 chamadas MCP. A projeção é **compacta** (id, name, type, size, characters, layout.mode, absolute, mainComponent.name), sem fills, fontes, padding, gap ou radius. Estados visuais que dependem de cor não são observáveis na árvore: link ativo, página atual da paginação e diferença de estilo do chip selecionado além do nome da variante. Nenhum container ficou truncado no `maxDepth` (14): todos os FRAMEs folha são badges ou containers com filhos presentes.
- **Desenho segue recomendações PENDING.** A frame segue a Recommendation de cada TD de `docs/decisions/technical-decisions-home-busca.md`, todos ainda PENDING: home-busca/TD-01 B, TD-02 A, TD-03 A, TD-06 A, TD-07 A e TD-08 B. Se o `/plan-resolve` escolher outra letra, a tela precisa ser revisitada. Casos concretos: TD-02 C troca a Pagination por scroll infinito e remove a linha Pagination; TD-07 B/C muda o chrome; TD-06 B/C dá estado e I/O ao SearchForm e pode reclassificá-lo.
- **Sessão anônima é intencional.** A frame mostra o ramo anônimo do PublicSiteNavbar ("Entrar"), porque a home é pública. A variante logada (ChannelUserMenu/avatar) não aparece nesta frame. Por isso `nav-links` (83:136) tem só "Início" (83:137): os links nav-link-meus-videos e nav-link-canais-seguidos, que dependem de sessão, não estão na árvore e não foram inventariados aqui.
- **Elementos de mock e layout, sem linha** (mesmo critério do inventário da fase 04): `top-decorative-strip` (83:128), `main-dashed-container` (83:148, borda tracejada do mock), `footer-pagination` (83:304, wrapper de alinhamento da Pagination) e os três `video-grid-row`.
- **Overrides de instância parcialmente projetados.** Nos 11 cards repetidos, a árvore registra em `text_overrides` só o `title`. O PNG mostra que canal, iniciais do avatar, contagem de visualizações, tempo de publicação e duração também variam por card (ex.: "Rafa Games"/RG, "Prof. Lia"/PL, "Notícias Já"/NJ). Essas variações aparecem só no screenshot e são dados de exemplo, não estrutura: a estrutura dos filhos é idêntica à de 83:170.
- **Screenshot anterior à correção.** Pelo `_envelope.screenshot_note`, o PNG foi capturado antes da correção do `video-card-feed`. A linha `meta` aparece transbordando a coluna (ex.: "há 1 semana" cortado). No Figma atual o card já trunca `channel-name` e `meta` em 1 linha e `title` em 2, e o `83-121.json` reflete os tamanhos em FILL. Pela nota do `83-126.json`, o chip `state=selected` ganhou stroke e tem hoje altura 32 (a árvore ainda mostra 30 em 83:150).
- **Responsividade (home-busca/TD-08 B).** Esta frame é só desktop: os 12 cards usam `size=desktop`. A variante `size=mobile` (83:110) existe no component set mas não é instanciada aqui, e a capability "Layout responsivo para dispositivos móveis" fica com a frame mobile da home. A barra de busca e o menu em sheet do mobile (home-busca/TD-07 A) também não aparecem nesta frame.
- **Capability da busca sem verbo nesta tela.** "Barra de busca (pesquisa por título e canal)" aparece aqui só como SearchForm, que é Local-interactive e apenas navega para `/results?q=` (home-busca/TD-06 A). O verbo de buscar pertence à listagem da tela de resultados.
- **Sem affordance de navegação no card.** O desenho não mostra hover nem destino de clique no VideoCard, nem em `channel-name`. É provável que o card leve a `/videos/{publicId}` e que o nome do canal leve à página do canal, mas não há nó que comprove nenhum dos dois, então nenhuma linha de link foi inventada.
- **Estados sem desenho.** Faltam o estado vazio (nenhum vídeo, ou nenhum vídeo na categoria selecionada), o de carregamento, o de erro da listagem, e a Pagination com uma página só ou com Anterior/Próxima desabilitados.

---

## Screen: Resultados da busca

**Route:** `/results`. O termo vai em `?q=` e a página em `?page=N` (home-busca/TD-01 B, home-busca/TD-02 A).
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=83-311 (node `FetKyb1V02WS5D6VCatK6t:83:311`)
**Purpose (from project-plan.md):** "Barra de busca (pesquisa por título e canal)"

### Component inventory

| Component (Figma node) | Type | In DS? | Reuse? | Notes |
|---|---|---|---|---|
| ResultsPage (83:311, `resultados-busca`) | Server-connected | ✗ | `app/results/page.tsx (new)` | Server Component da rota `/results` (home-busca/TD-01 B), dono da busca: lê `q`/`page` de `searchParams`, faz uma chamada e repassa os itens à VideoGrid e o termo e o total ao ResultsHeading. Mesmo padrão de `app/channels/[nickname]/page.tsx` e da VideoWatchPage da Fase 05. _Resolvido 2026-10-06 (dono do fetch = página RSC; ver Decisions log do progress)._ |
| top-decorative-strip (83:312) | Presentational | ✗ | new | Faixa decorativa de 32px no topo, igual às telas das fases anteriores |
| SiteNavbar (83:313, `navbar`) | Presentational | ✓ | `components/layout/site-navbar.tsx` | **Estendida na Fase 07** com SearchForm e nav-links. Por home-busca/TD-07 A, a navbar passa a ser montada uma vez no layout, e não mais em cada página. Nesta frame aparece a variante **autenticada** (avatar + "Sair") |
| PublicSiteNavbar (83:313) | Server-connected | ✓ | `components/layout/public-site-navbar.tsx` | O nó do Figma é o mesmo da SiteNavbar, mas a linha é própria. É um Server Component assíncrono: chama `getViewerChannel()` e escolhe entre ChannelUserMenu (logado, caso desta frame) e "Entrar" (anônimo) |
| BrandLogo (83:314) | Presentational | ✓ | `components/auth/brand-logo.tsx` | `logo-box` (83:315) e o wordmark "EstúdioCriador" (83:319) são markup interno |
| StreamtubeIcon (83:316, `play-icon`) | Presentational | ✓ | `components/icons/streamtube-icon.tsx` | Glyph dentro de BrandLogo/logo-box (83:315). O frame `play` (83:317) e o Vector (83:318) são o conteúdo do glyph. Tem linha própria pela regra de granularidade |
| nav-links (83:320) | Presentational | ✗ | new | Frame de layout que agrupa os três links. Faz parte do markup da SiteNavbar |
| nav-link-inicio (83:321) | Local-interactive | ✗ | new | `<Link>` inline em `components/layout/site-navbar.tsx`. "Início". Navegação por `<Link>`. Por home-busca/TD-06 A, o link ativo é uma das duas partes cliente da navbar |
| nav-link-canais-seguidos (83:322) | Local-interactive | ✗ | new | `<Link>` inline em `components/layout/site-navbar.tsx`. "Canais seguidos". Navegação por `<Link>` |
| nav-link-meus-videos (83:323) | Local-interactive | ✗ | new | `<Link>` inline em `components/layout/site-navbar.tsx`. "Meus vídeos". Navegação por `<Link>` |
| SearchForm (83:324, `search-form`) | Local-interactive | ✗ | `components/layout/search-form.tsx (new)` | Navega por `next/form` com envio explícito (home-busca/TD-06 A) e não faz fetch próprio. O valor vem preenchido com o `q` atual ("docker" em 83:329), consequência do TD-06 nesta rota |
| search-input (83:325) | Local-interactive | ✓ | `components/ui/input.tsx` | Campo do termo. O frame agrupa o SearchIcon (83:326) e o texto "docker" (83:329). O Input do DS precisa de um slot de ícone à esquerda, ou o agrupamento vira markup do SearchForm |
| SearchIcon (83:326, `search-icon`) | Presentational | ✗ | `components/icons/search-icon.tsx (new)` | INSTANCE de `search-icon` dentro de search-input. Os Vectors I83:326;83:83 e I83:326;83:84 são o conteúdo do glyph. Tem linha própria pela regra de granularidade |
| search-submit-button (83:330) | Local-interactive | ✓ | `components/ui/button.tsx` | Botão "Buscar" (label 83:331). Dispara o envio do SearchForm (home-busca/TD-06 A: envio explícito, sem busca ao digitar) |
| UserMenu (83:332) | Presentational | ✓ | `components/layout/user-menu.tsx` | Avatar (83:333) + `sair-button` (83:335, label 83:336). O botão "Sair" é markup interno. Quem faz o logout é `components/layout/channel-user-menu.tsx`, e isso fica fora das capabilities desta fatia |
| Avatar (83:333) | Presentational | ✓ | `components/ui/avatar.tsx` | Avatar do usuário logado. As iniciais "JC" (83:334) são conteúdo do próprio Avatar |
| main-dashed-container (83:337) | Presentational | ✗ | new | Contêiner tracejado do conteúdo principal, igual às telas anteriores |
| ResultsHeading (83:338, `results-heading`) | Presentational | ✗ | new | Título "Resultados para “docker”" (83:339) e contagem "8 vídeos" (83:340). Não faz I/O próprio: o termo é eco do `q` da URL e o total vem da mesma resposta da listagem que alimenta a VideoGrid (mesmo tratamento do `comments-count` da Fase 06). O termo e o total chegam da ResultsPage |
| VideoGrid (83:341, `video-grid` + `video-grid-row` 83:342, 83:387) | Presentational | ✗ | `components/videos/video-grid.tsx (new)` | **Não faz fetch próprio:** recebe os itens da ResultsPage. _Resolvido 2026-10-06 (dono do fetch = página RSC; ver Decisions log do progress)._ É o mesmo componente da grade da home, aqui em modo busca: a mesma listagem com `q` (home-busca/TD-01 B). Grade desktop de 2 linhas × 4 colunas. Por home-busca/TD-04 A, a ordem é por recência e não por relevância. Por home-busca/TD-05 A, o resultado traz só vídeos e o termo casa com o título OU com o canal |
| VideoCard (83:343, 83:354, 83:365, 83:376, 83:388, 83:399, 83:410, 83:421) | Server-connected | ✓ | `components/videos/video-card.tsx` | São 8 INSTANCEs de `video-card-feed/size=desktop` (variante 83:99 do set 83:121). **Estendido na Fase 07**: ganha a linha do canal (`channel-name`, 83:108) e a variante de tamanho (desktop 233px / mobile 343px, 83:110). O componente atual não tem nenhuma das duas. Truncamento: título em até 2 linhas, canal e meta em 1 linha cada Thumbnail (I83:343;83:100), overlay de duração (I83:343;83:101/83:102), título (83:107), nome do canal (83:108, **novo na Fase 07** — é ele que torna legíveis os casamentos só por canal) e meta (83:109) são markup interno do card, sem linha própria; o overlay de duração é interno ao card e **não** usa o `Badge` (decisão OQ-20 registrada em `video-card.tsx`). _Consolidado 2026-10-06: as linhas próprias desses cinco nós foram removidas para alinhar com as demais telas e com a OQ-20._ |
| Avatar (I83:343;83:104, `channel-avatar`) | Presentational | ✓ | `components/ui/avatar.tsx` | Avatar do canal dentro do VideoCard. As iniciais (I83:343;83:105, "DB") são conteúdo do Avatar |
| footer-pagination (83:432) | Presentational | ✗ | new | Faixa de layout que alinha a paginação à direita |
| Pagination (83:433) | Local-interactive | ✓ | `components/ui/pagination.tsx` | "Anterior" (83:434), "1" (83:435) e "Próxima" (83:436). Navega por URL com `?page=N` (home-busca/TD-02 A) e precisa preservar o `q` no href |

### Verbs of intent

| Verb | Component | Capability (project-plan.md) |
|---|---|---|
| Exibir no header o controle de sessão do visitante (Entrar ou avatar) | PublicSiteNavbar | "Header/navbar com logo, barra de busca, botão de login/avatar e navegação" |
| Exibir os vídeos cujo título ou canal casa com o termo buscado | ResultsPage | "Barra de busca (pesquisa por título e canal)" |
| Exibir a página selecionada dos resultados da busca | ResultsPage | "Paginação ou scroll infinito nas listagens de vídeos" |
| Exibir cada vídeo encontrado com thumbnail, título, canal, visualizações e tempo de publicação | VideoCard | "Barra de busca (pesquisa por título e canal)" |

### Observations

- **Origem dos dados.** A árvore foi lida do cache `docs/figma-cache/FetKyb1V02WS5D6VCatK6t/83-311.json` (fetched_at 2026-10-06T23:02:00Z, desenhada e colhida na mesma chamada `use_figma`, maxDepth 14), junto com `83-121.json` para o set `video-card-feed`. A projeção é **compacta**: id, name, type, size, characters, layout.mode, absolute, mainComponent.name, sem fills, fontes, padding, gap ou radius. Por isso estado ativo, desabilitado e cores não são observáveis na árvore. Nenhuma chamada ao Figma MCP foi feita. A profundidade máxima na árvore é 7, abaixo do maxDepth 14, então nenhum contêiner foi truncado.
- **A frame segue recomendações ainda PENDING.** Todos os TDs de `docs/decisions/technical-decisions-home-busca.md` estão PENDING. A frame foi desenhada pela Recommendation de cada um: TD-01 B (um endpoint com `q`/`category` opcionais, resultados em `/results`), TD-02 A (`?page=N` numerada), TD-04 A (ILIKE + pg_trgm + unaccent, ordem por recência), TD-05 A (só vídeos), TD-06 A (`next/form` com botão "Buscar") e TD-07 A. Se o `/plan-resolve` escolher outra letra, esta seção precisa ser revisitada. Em especial: TD-01 C eliminaria a rota `/results`, TD-02 B/C trocaria a Pagination por "Carregar mais" ou scroll infinito, TD-05 B/C acrescentaria um bloco ou aba de canais, e TD-06 B/C eliminaria ou alteraria o botão "Buscar".
- **A sessão autenticada é intencional.** A frame mostra avatar "JC" + "Sair" e os links Início, Canais seguidos e Meus vídeos. A variante anônima ("Entrar") é responsabilidade da PublicSiteNavbar e não tem frame nesta tela.
- **Os casamentos só por canal ilustram home-busca/TD-05 A.** Pelo screenshot, três dos 8 cards não têm "docker" no título e aparecem só porque o canal é "Docker Brasil": "Kubernetes ou Compose? Quando migrar", "Imagens menores com multi-stage build" e "Live: perguntas sobre containers". O resultado continua sendo só de vídeos, sem bloco de canais.
- **O que só aparece no screenshot.** Nas instâncias repetidas, `text_overrides` só registra o `title`. Outros nomes de canal ("Tech com Nina", "Dev em Pauta"), as iniciais (TN, DP), a duração e a meta de cada card só aparecem no PNG. A progressão das metas (há 4 dias → há 1 semana → … → há 1 mês) bate com a ordem por recência de home-busca/TD-04 A.
- **O PNG é anterior à correção de truncamento.** Conforme o `_envelope.screenshot_note`, o PNG foi capturado antes da correção no `video-card-feed`. O transbordo da linha meta visível nele (ex.: "há 1 seman") não é defeito do desenho atual: o componente já trunca canal e meta em 1 linha e o título em 2.
- **Paginação de uma página só.** São 8 resultados, então "Anterior 1 Próxima" representa a página 1 de 1. O tamanho de página (múltiplo de 12 por home-busca/TD-02) ainda não foi fixado. A projeção não permite ver se "Anterior" e "Próxima" estão desabilitados, e no PNG os dois têm o mesmo tom neutro. Também não está desenhado se a Pagination deve sumir quando há uma página só.
- **ResultsHeading.** Só o plural ("8 vídeos") está desenhado. O singular ("1 vídeo") e o caso zero ficam para a tela "Resultados da busca — sem resultados" (83:437). O termo aparece entre aspas tipográficas e é eco do `q`, então precisa ser escapado como texto.
- **Quem é dono do fetch — resolvido.** A contagem do ResultsHeading e os cards da VideoGrid saem da mesma resposta, mas são nós irmãos. Resolvido em 2026-10-06 pelo usuário: **a página RSC (`ResultsPage`) é a dona do fetch**, como em `app/channels/[nickname]/page.tsx` e na VideoWatchPage da Fase 05. Os verbos de busca e de paginação passaram da VideoGrid para a ResultsPage, e a VideoGrid virou Presentational, de forma consistente com a seção da Página inicial.
- **O verbo do VideoCard está mapeado para a busca.** O conjunto de campos do card (thumbnail, título, canal, visualizações e tempo de publicação) é o listado em "Página inicial com grid de vídeos (…)", mas nesta tela o card exibe um resultado de busca. Por isso o verbo foi mapeado para "Barra de busca (pesquisa por título e canal)", e a capability da grade da home fica coberta na seção da Página inicial.
- **Responsividade.** Esta é a frame desktop (cards `size=desktop`). A variante mobile da mesma rota é a seção "Resultados da busca — mobile" (84:379), que cobre "Layout responsivo para dispositivos móveis".
- **Links de navegação nesta rota.** `/results` não é destino de nenhum dos três nav-links, então nenhum deveria estar ativo. A projeção compacta não permite confirmar isso no desenho.

---

## Screen: Resultados da busca — sem resultados

**Route:** `/results` — estado sem resultados da mesma rota (`/results?q=…` com zero vídeos). Não é uma rota própria; mesmo precedente do estado not-found `68:62` da Fase 05.
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=83-437 (node `FetKyb1V02WS5D6VCatK6t:83:437`)
**Purpose (from project-plan.md):** estado vazio de "Barra de busca (pesquisa por título e canal)". É o que o usuário vê quando nenhum vídeo casa com o termo buscado.

### Component inventory

| Component (Figma node) | Type | In DS? | Reuse? | Notes |
|---|---|---|---|---|
| ResultsPage (83:437, `resultados-busca-vazio`) | Server-connected | ✗ | `app/results/page.tsx (new)` | see screen: Resultados da busca. A mesma página no estado de zero resultados: com a resposta vazia, renderiza o SearchEmptyState no lugar da VideoGrid. _Resolvido 2026-10-06 (dono do fetch = página RSC; ver Decisions log do progress)._ |
| top-decorative-strip (`83:438`) | Presentational | ✗ | new | Moldura tracejada da prancha. Não vira arquivo. see screen: Resultados da busca |
| SiteNavbar (`navbar` `83:439`) | Presentational | ✓ | `components/layout/site-navbar.tsx` | see screen: Resultados da busca. Mesma variante autenticada |
| PublicSiteNavbar (`navbar` `83:439`) | Server-connected | ✓ | `components/layout/public-site-navbar.tsx` | see screen: Resultados da busca. O verbo (`getViewerChannel()`) está registrado lá e não se repete aqui |
| BrandLogo (`brand-logo` `83:440`) | Presentational | ✓ | `components/auth/brand-logo.tsx` | see screen: Resultados da busca. Inclui `logo-box` `83:441` e o texto "EstúdioCriador" `83:445` como markup interno |
| StreamtubeIcon (`play-icon` `83:442`) | Presentational | ✓ | `components/icons/streamtube-icon.tsx` | see screen: Resultados da busca. Glifo dentro de BrandLogo |
| NavLinkInicio (`nav-link-inicio` `83:447`) | Local-interactive | ✗ | new | see screen: Resultados da busca. `<Link>` inline em `components/layout/site-navbar.tsx` |
| NavLinkCanaisSeguidos (`nav-link-canais-seguidos` `83:448`) | Local-interactive | ✗ | new | see screen: Resultados da busca. `<Link>` inline em `components/layout/site-navbar.tsx` |
| NavLinkMeusVideos (`nav-link-meus-videos` `83:449`) | Local-interactive | ✗ | new | see screen: Resultados da busca. `<Link>` inline em `components/layout/site-navbar.tsx` |
| SearchForm (`search-form` `83:450`) | Local-interactive | ✗ | `components/layout/search-form.tsx (new)` | see screen: Resultados da busca. Aqui o campo vem preenchido com o termo da URL ("xyzabc") |
| SearchInput (`search-input` `83:451`) | Local-interactive | ✓ | `components/ui/input.tsx` | see screen: Resultados da busca. O texto `search-input-text` `83:455` é markup interno _Consolidado 2026-10-06: alinhado ao mapeamento da tela Resultados da busca._ |
| SearchIcon (`search-icon` `83:452`) | Presentational | ✗ | `components/icons/search-icon.tsx (new)` | see screen: Resultados da busca. Glifo de 20px dentro de SearchInput |
| SearchSubmitButton (`search-submit-button` `83:456`) | Local-interactive | ✓ | `components/ui/button.tsx` | see screen: Resultados da busca. "Buscar"; submissão via `next/form` (TD-06 A) _Consolidado 2026-10-06: alinhado ao mapeamento da tela Resultados da busca._ |
| UserMenu (`user-menu` `83:458`) | Presentational | ✓ | `components/layout/user-menu.tsx` | see screen: Resultados da busca. `sair-button` `83:461` é markup interno; o logout pertence a `channel-user-menu.tsx` |
| Avatar (`avatar` `83:459`) | Presentational | ✓ | `components/ui/avatar.tsx` | see screen: Resultados da busca. Iniciais "JC" (`83:460`) |
| main-dashed-container (`83:463`) | Presentational | ✗ | new | Container de layout da área principal. Não vira arquivo |
| SearchEmptyState (`empty-state` `83:464`) | Presentational | ✗ | `components/videos/search-empty-state.tsx (new)` | Só é renderizado quando o backend devolve zero vídeos para o termo, e o título repete esse termo. `empty-title` `83:469` ("Nenhum vídeo encontrado para “xyzabc”") e `empty-hint` `83:470` são markup interno. Presentational: quem decide renderizá-lo é a ResultsPage, ao receber zero itens. _Resolvido 2026-10-06 (dono do fetch = página RSC; ver Decisions log do progress)._ |
| empty-icon-badge (`83:465`) | Presentational | ✗ | new | Círculo de 56px que envolve o glifo. Markup interno de SearchEmptyState; não vira arquivo (equivale ao `not-found-badge` da Fase 05) |
| SearchIcon (`search-icon` `83:466`) | Presentational | ✗ | `components/icons/search-icon.tsx (new)` | Glifo dentro de `empty-icon-badge` (SearchEmptyState). É uma instância do mesmo componente de `83:452`, reescalada para 28px. O arquivo é um só para as duas linhas |
| BackHomeLink (`back-home-link` `83:471`) | Local-interactive | ✗ | new | "Voltar para o início"; `<Link>` para `/`. Sem mutation. Reuso de `BackLink` discutido nas Observations |

### Verbs of intent

| Verb | Component | Capability (project-plan.md) |
|---|---|---|
| Informar que nenhum vídeo casa com o termo buscado | ResultsPage | "Barra de busca (pesquisa por título e canal)" |

### Observations

- **Proveniência.** A árvore vem do cache `docs/figma-cache/FetKyb1V02WS5D6VCatK6t/83-437.json` (`fetched_at` 2026-10-06T23:02:00Z, `maxDepth` 14). O frame foi desenhado e colhido na mesma chamada `use_figma`. A projeção é compacta: id, name, type, size, characters, layout.mode e mainComponent.name, sem fills, fontes, padding, gap ou radius. Para estilo, ler o Figma vivo ou o script de autoria. Nenhuma chamada MCP foi feita nesta etapa. Nenhum container foi truncado em `maxDepth`. O `children_omitted` de `83:466` é omissão da projeção para uma instância repetida, cujos filhos são idênticos aos de `83:452`, e não truncamento. A `screenshot_note` do envelope (linha meta do `video-card-feed` transbordando) não afeta este frame, que não tem card de vídeo.
- **O frame segue as Recommendations de TDs ainda PENDING** em `docs/decisions/technical-decisions-home-busca.md`: TD-01 B (resultados em `/results`), TD-04 A, TD-05 A (só vídeos, por isso não há bloco de "canais encontrados") e TD-06 A (`next/form` com botão "Buscar" explícito). Se o resolve escolher outra opção, esta tela muda junto.
- **O estado autenticado é intencional.** O avatar "JC" e o botão "Sair" mostram a variante logada do header, igual à tela "Resultados da busca". A variante anônima ("Entrar") vem do mesmo `PublicSiteNavbar` e não precisa de desenho próprio.
- **O estado "termo curto demais" não foi desenhado.** A Recommendation do TD-04 manda fixar no resolve um comprimento mínimo do termo (2 ou 3 caracteres). Nenhum frame mostra o que o usuário vê quando envia um termo abaixo desse mínimo: validação no `SearchForm`, mensagem na página ou este mesmo estado vazio. Também não há variante mobile deste estado (o frame tem 1100px), o que toca "Layout responsivo para dispositivos móveis".
- **SearchEmptyState é Presentational — resolvido.** O sub-agente o havia classificado como Server-connected, porque o frame não tem nenhum nó da listagem para carregar o verbo e o componente só existe como resultado da consulta. Com a resolução de 2026-10-06 (**a página RSC é a dona do fetch**), quem decide renderizar o estado vazio é a `ResultsPage`, que passou a carregar o verbo "Informar que nenhum vídeo casa com o termo buscado". O componente recebe o termo por props e não faz I/O. Diferente do `VideoNotFound` da Fase 05, aqui a decisão é da própria página, não de um `notFound()` de outro segmento.
- **Reuso de `BackLink` a confirmar.** `components/auth/back-link.tsx` já renderiza `<Link>` com texto e ícone opcional. Ele fica em `auth/` e usa cor `muted-foreground`, mas o link desenhado aqui é azul primário. A linha ficou como `new` (DOM puro). Se o plan-build decidir generalizar `BackLink` com `className`, a linha passa a `✓` com esse path. O precedente da Fase 05 usou `components/ui/button.tsx` para um "Voltar para o início" com forma de botão. Aqui a forma é de link de texto, então o Button não se aplica.
- **Ícone novo.** `search-icon` aparece duas vezes no frame (20px no header e 28px no badge), mas é um único arquivo, `components/icons/search-icon.tsx (new)`. O projeto não usa biblioteca de ícones.

---

## Screen: Página inicial — mobile

**Route:** `/` — viewport móvel (375px) da mesma rota da tela "Página inicial"
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=84-299 (node `FetKyb1V02WS5D6VCatK6t:84:299`)
**Purpose (from project-plan.md):** "Layout responsivo para dispositivos móveis"

### Component inventory

| Component (Figma node) | Type | In DS? | Reuse? | Notes |
|---|---|---|---|---|
| HomePage (84:299, `home-mobile`) | Server-connected | ✓ | `app/page.tsx` | see screen: Página inicial. A mesma página a 375px; dona do fetch, repassa os itens à VideoGrid. _Resolvido 2026-10-06 (dono do fetch = página RSC; ver Decisions log do progress)._ |
| top-decorative-strip (84:300) | Presentational | ✗ | new | see screen: Página inicial. Faixa 375×16 sem afordância e sem dado. |
| SiteNavbar (84:301, `navbar`) | Presentational | ✓ | `components/layout/site-navbar.tsx` | see screen: Página inicial (origem: phase-06). Aqui no **layout mobile**: só BrandLogo e `navbar-actions` (84:308). Sem input de busca, sem links de navegação e sem "Entrar" ou avatar na barra: pelo TD-07 A (recomendação, PENDING) a busca vira ícone e os links vão para o sheet. Moldura de layout; o estado de sessão quem decide é o PublicSiteNavbar. |
| PublicSiteNavbar (84:301, mesmo nó `navbar`) | Server-connected | ✓ | `components/layout/public-site-navbar.tsx` | see screen: Página inicial (origem: current). Mesmo nó do SiteNavbar. Lê a sessão para escolher a variante: esta frame é a **anônima**. O verbo está registrado na tela "Página inicial" e não se repete aqui. |
| BrandLogo (84:302) | Presentational | ✓ | `components/auth/brand-logo.tsx` | see screen: Página inicial (origem: phase-06). O wordmark "EstúdioCriador" (84:307, TEXT) é conteúdo do componente. Ocupa 183 dos 375px; ver Observations. |
| StreamtubeIcon (84:304, `play-icon`; logo-box 84:303 + play 84:305/Vector 84:306) | Presentational | ✓ | `components/icons/streamtube-icon.tsx` | see screen: Página inicial (origem: phase-06). É um glifo dentro do BrandLogo e tem linha própria pela regra de granularidade. |
| navbar-actions (84:308) | Presentational | ✗ | new | **Exclusivo do mobile.** Frame horizontal 84×40 que agrupa os dois icon-buttons à direita da barra. É DOM puro dentro do SiteNavbar e não vira arquivo. Ganha linha mesmo assim porque é o nó que só existe abaixo do breakpoint: no desktop a mesma região tem input de busca + links + Entrar/avatar. Sem a linha, a troca responsiva da barra não aparece em lugar nenhum do pipeline. |
| SearchToggleButton (84:309, `search-toggle-button`) | Local-interactive | ✓ | `components/ui/icon-button.tsx` | **Novo nesta tela.** Botão de ícone 40×40. Expande o input de busca sobre a barra, e isso é estado só do cliente: sem backend ele continua funcionando. A consulta em si sai do form de busca (`next/form`, TD-06 A), não deste botão. O estado expandido está desenhado em "Resultados da busca — mobile". |
| SearchIcon (84:310, `search-icon`) | Presentational | ✗ | `components/icons/search-icon.tsx (new)` | see screen: Página inicial (origem: current). INSTANCE do componente `search-icon` (2 vetores). É glifo dentro do SearchToggleButton e tem linha própria mesmo com o pai resolvendo para `icon-button.tsx`, pela regra de granularidade. É o mesmo glifo da barra de busca do desktop: um arquivo só. |
| MenuButton (84:313, `menu-button`) | Local-interactive | ✓ | `components/ui/icon-button.tsx` | **Novo nesta tela.** Botão de ícone 40×40 que abre o sheet de navegação ("Menu de navegação — mobile"). Abre e fecha só no cliente, sem I/O. Na sessão anônima é o único caminho para o login no mobile (ver Observations). |
| MenuIcon (84:314, `menu-icon`) | Presentational | ✗ | `components/icons/menu-icon.tsx (new)` | **Novo nesta tela.** INSTANCE do componente `menu-icon` (3 vetores horizontais, "hambúrguer"). É glifo dentro do MenuButton e tem linha própria pela regra de granularidade. `menu-icon.tsx` não existe em `components/icons/`. |
| main-dashed-container (84:318) | Presentational | ✗ | new | see screen: Página inicial. Contêiner vertical 375×954 com stroke tracejado. Esse stroke causa o transbordo de 2px do card (ver Observations). |
| CategoryFilter (84:319, `category-filter`) | Local-interactive | ✗ | `components/videos/category-filter.tsx (new)` | see screen: Página inicial (origem: current). No mobile tem 341px de largura e **rola na horizontal**: as 9 chips somam ~775px mais os gaps, e só "Todos", "Música", "Jogos" e "Educação" aparecem no screenshot. Navega por URL `/?category=<valor do enum>`, um `<Link>` do framework, por isso é local-interactive. |
| CategoryChip (84:320, 84:322, 84:324, 84:326, 84:328, 84:330, 84:332, 84:334, 84:336 — 9 instâncias de `category-chip`) | Local-interactive | ✗ | `components/videos/category-chip.tsx (new)` | see screen: Página inicial (origem: current). Uma linha cobre as 9 instâncias. 84:320 "Todos" é `state=selected`; as outras 8 são `state=default`, com label só por `text_overrides`: Música, Jogos, Educação, Entretenimento, Notícias, Esportes, Tecnologia, Outros. "Todos" equivale à ausência de `?category=`. O label `chip-label` é conteúdo da chip. |
| VideoGrid (84:338, `video-list`) | Presentational | ✗ | `components/videos/video-grid.tsx (new)` | **Não faz fetch próprio** (recebe os itens da HomePage). _Resolvido 2026-10-06 (dono do fetch = página RSC; ver Decisions log do progress)._ see screen: Página inicial (origem: current). No desktop é o nó `video-grid`; aqui é o **mesmo componente em coluna única** (frame VERTICAL 341 de largura com 3 cards empilhados). Depende da listagem paginada vinda do servidor. Os verbos do desktop estão em "Página inicial"; aqui entra só o verbo responsivo. |
| VideoCard (84:339, 84:350, 84:361 — instâncias de `video-card-feed/size=mobile`) | Server-connected | ✓ | `components/videos/video-card.tsx` | see screen: Página inicial (origem: phase-06; na Fase 07 ganha a linha do canal e a variante de tamanho). Uma linha cobre as 3 instâncias. Variante `size=mobile` (83:110): card 343×258 e thumbnail 343×193. A marcação própria do card não ganha linhas, porque não vira arquivo: thumbnail, `duration-badge`/`duration-text` "8:12", `title`, `channel-name` "Joana Cria" e `meta` "1,2 mil visualizações · há 2 dias" (I84:339;83:111–83:120). O verbo está em "Página inicial". |
| Avatar (I84:339;83:115, `channel-avatar`) | Presentational | ✓ | `components/ui/avatar.tsx` | see screen: Página inicial (origem: phase-06). Avatar 32×32 do canal dentro do VideoCard. As iniciais "JC" (I84:339;83:116) são fallback do próprio Avatar. |
| Pagination (84:372 wrapper `footer-pagination`, 84:373 caixa `pagination`) | Local-interactive | ✓ | `components/ui/pagination.tsx` | see screen: Página inicial (origem: phase-06). Numerada pelo TD-02 A: "Anterior" (84:374), "1" (84:375), "2" (84:376), "3" (84:377), "Próxima" (84:378). No mobile fica **centralizada** num wrapper de 341. Navega por URL (`?page=N`), sem I/O próprio. Há drift com o DS (ver Observations). |

### Verbs of intent

| Verb | Component | Capability (project-plan.md) |
|---|---|---|
| Exibir a listagem de vídeos em coluna única no viewport móvel | HomePage (84:299), renderizando a VideoGrid (84:338) em coluna única | "Layout responsivo para dispositivos móveis" |

### Observations

- **Proveniência.** A classificação vem do cache commitado `docs/figma-cache/FetKyb1V02WS5D6VCatK6t/84-299.json` (`_envelope.fetched_at` 2026-10-06T23:05:00Z, `maxDepth` 14), com `83-121.json` (set `video-card-feed`), `83-126.json` (set `category-chip`) e o screenshot `84-299.png`. Nenhuma chamada ao MCP do Figma. A frame foi desenhada e colhida na mesma chamada `use_figma`. A projeção é **compacta**: traz id, name, type, size, characters, layout.mode e mainComponent, mas não fills, fontes, padding, gap nem radius. Instâncias repetidas vêm com `children_omitted` + `text_overrides`. Nenhum contêiner na profundidade máxima ficou sem filhos e nenhum nó traz `truncated`.
- **A frame segue recomendações PENDING.** Ela aplica o TD-07 A (só barra superior: no mobile a busca vira ícone que expande o input e os links vão para um sheet) e o TD-08 B (regras responsivas escritas para todas as telas, frames mobile só para as novas), além do TD-02 A (paginação numerada) e do TD-06 A. Se o resolve escolher outra opção em qualquer um deles, as linhas de navbar-actions, SearchToggleButton, MenuButton, MenuIcon e Pagination desta seção perdem a base. O breakpoint em que a barra troca de layout não está no Figma e fica para as regras escritas do TD-08 B.
- **Transbordo de 2px do card (`_envelope.layout_note`).** O `video-list` tem 341px de largura e o card mobile tem 343 fixos. Ele transborda 2px por causa do stroke do `main-dashed-container`. É artefato do mock, não intenção: na implementação o card ocupa a largura do container (FILL). Hoje o `video-card.tsx` passa `sizes="233px"` fixo à thumbnail. A variante mobile precisa de um `sizes` coerente com a largura cheia, senão o `next/image` serve imagem subdimensionada no celular.
- **Estados desenhados em outras telas.** O estado com a busca expandida (SearchToggleButton acionado) está em **"Resultados da busca — mobile"**. O menu aberto (MenuButton acionado) está em **"Menu de navegação — mobile"**. Esta frame mostra só o estado recolhido dos dois.
- **Variante anônima do sheet não desenhada.** Esta frame é anônima e a barra mobile não tem "Entrar": o login fica dentro do sheet. Mas o sheet desenhado em "Menu de navegação — mobile" é o **autenticado**, com o bloco do usuário. A variante anônima, com "Entrar" no lugar do bloco do usuário, **não foi desenhada**. Enquanto ela não existir, o caminho do anônimo até o login no mobile é argumentado e não observado.
- **Diferenças que só aparecem no screenshot.** Os `text_overrides` dos cards 84:350 e 84:361 trazem só o `title`. O screenshot mostra também canal, iniciais, meta e duração diferentes em cada um: "Rafa Games"/"RG"/"18 mil visualizações · há 5 horas"/"24:05" e "Prof. Lia"/"PL"/"3,4 mil visualizações · há 1 dia"/"12:40". As thumbnails também têm cores de placeholder diferentes. É conteúdo de exemplo das mesmas instâncias, não componente novo.
- **Drift entre a Pagination do DS e a frame.** No `components/ui/pagination.tsx`, `PaginationPrevious` e `PaginationNext` escondem o texto abaixo de `sm` (`hidden sm:block`) e mostram só `ChevronLeftIcon`/`ChevronRightIcon`. A frame de 375px mostra o **texto** "Anterior"/"Próxima" (TEXT 84:374/84:378) **sem** chevrons. Falta decidir no plano qual dos dois vale no mobile. A projeção compacta (sem fills) e a resolução do PNG também não deixam ver qual página está marcada como ativa.
- **Seleção da chip.** O `_envelope.note` de `83-126.json` registra que, depois da colheita, `state=selected` (83:124) ganhou stroke de 1px para ficar com 32 de altura como o `default`. A instância 84:320 já aparece com 32, coerente com a correção.
- **Drift de marca persiste.** O wordmark continua "EstúdioCriador", diferente da marca implementada em `components/auth/brand-logo.tsx`; a mesma observação foi registrada nas Fases 04 e 05. No mobile o wordmark ocupa 183 dos 375px. Se a marca real for mais longa, a barra pode não caber junto com os 84px de `navbar-actions`.
- **Acessibilidade dos botões de ícone.** `search-toggle-button` e `menu-button` são FRAMEs sem texto: o implement precisa de `aria-label` ("Buscar", "Abrir menu") e de `aria-expanded`/`aria-controls` refletindo o input expandido e o sheet aberto. Os 40×40 passam do mínimo de 24×24 do WCAG 2.5.8, mas ficam abaixo dos 44×44 do 2.5.5. A faixa de chips que rola na horizontal precisa continuar navegável por teclado.
- **Cobertura de capabilities nesta tela.** Só o verbo responsivo do VideoGrid é emitido aqui. As capabilities da home, do filtro, da busca, do header e da paginação já são cobertas pelos verbos da tela "Página inicial", e as linhas marcadas `see screen: Página inicial` não os repetem.

---

## Screen: Resultados da busca — mobile

**Route:** `/results` — viewport móvel (375px) da mesma rota da tela "Resultados da busca", com a busca expandida na navbar
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=84-379 (node `FetKyb1V02WS5D6VCatK6t:84:379`)
**Purpose (from project-plan.md):** "Layout responsivo para dispositivos móveis". É a mesma página de resultados da tela desktop (83:311), desenhada a 375px: lista em coluna única e busca expandida sobre a barra.

### Component inventory

| Component (Figma node) | Type | In DS? | Reuse? | Notes |
|---|---|---|---|---|
| ResultsPage (84:379, `resultados-busca-mobile`) | Server-connected | ✗ | `app/results/page.tsx (new)` | see screen: Resultados da busca. A mesma página a 375px; dona do fetch, repassa os itens à VideoGrid. _Resolvido 2026-10-06 (dono do fetch = página RSC; ver Decisions log do progress)._ |
| top-decorative-strip (84:380) | Presentational | ✗ | new | Faixa de 375×16. Mesmo tratamento das Fases 05/06 (linha própria, puro DOM); provavelmente andaime do mock (ver Observations) |
| SiteNavbar (84:381) | Presentational | ✓ | `components/layout/site-navbar.tsx` | see screen: Resultados da busca; herdado da Fase 06. Aqui no **estado de busca expandida**: a barra inteira (375×65) é ocupada por `search-back-button` + `search-form`. `brand-logo`, `search-toggle-button`, `menu-button` e o controle de sessão não aparecem (ver Observations) |
| SearchBackButton "search-back-button" (84:382) | Local-interactive | ✓ | `components/ui/icon-button.tsx` | **Novo nesta tela.** Botão só com ícone, 40×40. Recolhe a busca expandida e volta para a barra fechada (estado de cliente, sem I/O). Funciona sem backend. É o par de `search-toggle-button` (84:309) em "Página inicial — mobile". Precisa de rótulo acessível |
| ArrowBackIcon "arrow-left-icon" (84:383) | Presentational | ✓ | `components/icons/arrow-back-icon.tsx` | Glifo dentro de SearchBackButton, 20×20, instância de `arrow-left-icon` (2 vetores). **O nome no Figma difere do arquivo:** é o glifo de seta para trás que já existe (`ArrowBackIcon`), sem arquivo novo. Linha própria pela regra de ícones |
| SearchForm "search-form" (84:386: `search-input` 84:387 com texto 84:388 "docker" + `search-submit-button` 84:389) | Local-interactive | ✗ | `components/layout/search-form.tsx (new)` | see screen: Resultados da busca. É o mesmo componente do desktop, no layout móvel: 303×40, input 255×39 e submit só com ícone no lugar do rótulo "Buscar". `next/form` (TD-06 A): a submissão é navegação para `/results?q=…`; o form não guarda estado de servidor. O input chega pré-preenchido com o termo da URL e aparece em foco (borda na cor primária, só no screenshot; ver Observations) |
| SearchSubmitButton "search-submit-button" (84:389) | Local-interactive | ✓ | `components/ui/icon-button.tsx` | Parte de SearchForm. Ganha linha própria porque, no mobile, usa um arquivo de DS diferente do desktop: `icon-button` 40×40 em vez do botão com rótulo. Submete o `next/form`, que dispara uma navegação e nenhuma mutation. Precisa de `aria-label` ("Buscar") |
| SearchIcon "search-icon" (84:390) | Presentational | ✗ | `components/icons/search-icon.tsx (new)` | see screen: Resultados da busca. Glifo dentro de SearchSubmitButton, 20×20, instância de `search-icon` (2 vetores). O mesmo glifo aparece em `search-toggle-button` (84:310) na barra fechada |
| main-dashed-container (84:393) | Presentational | ✗ | new | Contêiner vertical 375×688 com borda tracejada (visível no screenshot). Mesmo tratamento das Fases 05/06; provavelmente andaime do mock |
| ResultsHeading "results-heading" (84:394: `heading-title` 84:395 "Resultados para “docker”", `heading-count` 84:396 "8 vídeos") | Presentational | ✗ | new | see screen: Resultados da busca. Puro DOM (`<h1>` + `<p>`). Recebe termo e total por props; não busca nada. No mobile ocupa 341×44 |
| VideoGrid "video-list" (84:397) | Presentational | ✗ | `components/videos/video-grid.tsx (new)` | **Não faz fetch próprio** (recebe os itens da ResultsPage). _Resolvido 2026-10-06 (dono do fetch = página RSC; ver Decisions log do progress)._ see screen: Resultados da busca (os verbos de busca estão lá). Aqui é coluna única de 341px com 2 cards desenhados de 8 resultados. Transborda 2px (ver Observations) |
| VideoCard "video-card-feed" (instâncias 84:398, 84:409; main `video-card-feed/size=mobile`, set 83:121) | Server-connected | ✓ | `components/videos/video-card.tsx` | see screen: Resultados da busca; herdado da Fase 06 e **estendido na Fase 07** (variante `size=mobile`, avatar e nome do canal no card). Classificado uma vez para as 2 instâncias. 343×258, thumbnail em largura total (343×193) com overlay de duração "19:05". O overlay é interno ao card, não variante do `Badge` (comentário OQ-20 em `video-card.tsx`), por isso não tem linha. `title`, `channel-name` e `meta` são camadas de texto, sem linha (conforme a correção registrada no envelope de 83:121: `channel-name`/`meta` em FILL com truncamento de 1 linha, `title` com até 2 linhas) |
| Avatar "channel-avatar" (I84:398;83:115, iniciais I84:398;83:116 "DB") | Presentational | ✓ | `components/ui/avatar.tsx` | see screen: Resultados da busca; herdado da Fase 06. 32×32 no fallback de iniciais, dentro de VideoCard |
| Pagination (84:421 "pagination"; wrapper `footer-pagination` 84:420; `pagination-previous` 84:422, `pagination-page-1` 84:423, `pagination-next` 84:424) | Local-interactive | ✓ | `components/ui/pagination.tsx` | see screen: Resultados da busca; herdado da Fase 06. "Anterior 1 Próxima" centralizado no mobile (176×34), navega por URL (TD-02 A) |

### Verbs of intent

| Verb | Component | Capability (project-plan.md) |
|---|---|---|
| Exibir os resultados da busca em coluna única no viewport móvel | ResultsPage (84:379), renderizando a VideoGrid "video-list" (84:397) em coluna única | "Layout responsivo para dispositivos móveis" |

### Observations

- **Origem da árvore.** Classifiquei as linhas a partir do cache commitado `docs/figma-cache/FetKyb1V02WS5D6VCatK6t/84-379.json` (`_envelope.fetched_at` 2026-10-06T23:05:00Z, `maxDepth` 14), do set `83-121.json` (fetched_at 2026-10-06T23:02:00Z) e do screenshot `84-379.png`. Zero chamadas ao MCP do Figma.
  - A tela foi desenhada e colhida na mesma chamada `use_figma` (2 de 2), então a árvore foi lida do nó depois da escrita.
  - A projeção é **compacta**: traz id, name, type, size, characters, layout.mode e mainComponent. Não traz fills, strokes, fontes, padding, gap nem radius.
  - Nenhum contêiner na profundidade máxima ficou sem filhos, então não há nada truncado.
  - O `children_omitted` de 84:409 vem da projeção (instância repetida), não de truncamento.
- **O frame segue recomendações de TDs ainda PENDING** (`docs/decisions/technical-decisions-home-busca.md`):
  - TD-07 A: no mobile a busca vira um ícone que expande o input sobre a própria barra. Esta tela é esse estado expandido, e `search-back-button` o desfaz.
  - TD-06 A: submissão via `next/form`, que é navegação.
  - TD-01 B: rota `/results`.
  - TD-05 A: só vídeos nos resultados, sem linha de canal.
  - TD-08 B: frame mobile desenhado para home e resultados.
  - Se o TD-07 for decidido como B (drawer) ou C (tab bar inferior), o estado expandido e o `SearchBackButton` mudam ou deixam de existir. Se o TD-06 sair de A, a classificação Local-interactive de SearchForm e SearchSubmitButton precisa ser revista.
- **O controle de sessão fica oculto enquanto a busca está expandida.** A tela está no estado autenticado, mas o avatar do slot de sessão da navbar (PublicSiteNavbar/SiteNavbar) não aparece, porque a busca ocupa a barra inteira.
  - O mesmo vale para `brand-logo`, `search-toggle-button` e `menu-button`. Na barra fechada de "Página inicial — mobile" (84:299: `brand-logo` 84:302 + `navbar-actions` 84:308 com `search-toggle-button` 84:309 e `menu-button` 84:313) o controle de sessão também não fica direto na barra: ele é acessado pelo `menu-button`/sheet.
  - Tocar em `search-back-button` deve devolver exatamente essa barra fechada.
  - 84:299 foi desenhada como **anônima**. A barra fechada no estado autenticado em 375px não tem frame próprio, então o que ela mostra (avatar na barra ou só no sheet) é inferido.
- **Foco do input aparece só no screenshot.** No `search-input` (84:387), a borda arredondada na cor primária (#3f72af pela paleta do envelope) indica foco. A projeção não carrega strokes, então isso vem só do PNG. A implementação precisa:
  - focar o input ao expandir a busca;
  - devolver o foco ao `search-toggle-button` ao recolher.
- **Overflow de 2px no card** (`_envelope.layout_note`). `video-list` tem 341px de largura e o card `size=mobile` tem 343px fixos, então transborda 2px por causa do stroke de `main-dashed-container`. Na implementação o card deve usar a largura do contêiner (FILL), não 343 fixos.
- **`text_overrides` incompletos na 2ª instância.** O cache de 84:409 traz só `title: "Docker Compose na prática"`. O screenshot mostra outros valores além desse: canal "Tech com Nina", iniciais "TN", "5,3 mil visualizações · há 1 semana", duração "21:40" e uma thumbnail de outra cor. A projeção cobre só parte dos overrides, então não tirei nada da árvore sobre essa instância além do título.
- **Paginação desenhada sem estados.** Com 8 resultados e página de 12 (recomendação do TD-02, valor exato pendente no resolve), existe uma página só. "Anterior" e "Próxima" deveriam estar desabilitados, mas aparecem com o mesmo estilo. O frame não desenha o estado desabilitado.
- **Verbos.** Esta seção emite só o verbo de layout da VideoGrid. Os verbos de dados da busca (VideoGrid e VideoCard) estão na tela "Resultados da busca" (83:311). VideoCard é Server-connected, mas aqui não ganha verbo: o que esta tela acrescenta a ele é só a variante `size=mobile`, coberta pelo verbo da VideoGrid. SearchForm, SearchSubmitButton e SearchBackButton são Local-interactive e não levam verbo.
- **Estados não desenhados no mobile:** busca sem resultados, carregando e erro. Também não há termo vazio nem termo abaixo do comprimento mínimo (TD-04, a fixar no resolve).
- **Acessibilidade.**
  - Os dois botões só com ícone (84:382 e 84:389) são FRAMEs sem semântica de botão no export. Precisam de `<button>` real com rótulo acessível ("Fechar busca"/"Voltar" e "Buscar").
  - O `search-input` precisa de `<label>` (pode ser visualmente oculto) e `type="search"`.
- **Elementos provavelmente de mock.** `top-decorative-strip` (84:380) e a borda tracejada de `main-dashed-container` (84:393) receberam linha seguindo o precedente das Fases 05/06. A Fase 04 os tratou como andaime do mock e não os inventariou.
- **Fora da árvore e do screenshot.** Todos os elementos do screenshot estão na árvore, e vice-versa. As únicas divergências são os overrides de texto da 2ª instância e o stroke de foco, descritos acima.

---

## Screen: Menu de navegação — mobile

**Route:** `/` — viewport móvel (375px) com o menu de navegação aberto; o menu é chrome global e abre sobre qualquer rota, desenhado aqui sobre a home
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=84-425 (node `FetKyb1V02WS5D6VCatK6t:84:425`)
**Purpose (from project-plan.md):** "Header/navbar com logo, barra de busca, botão de login/avatar e navegação"

### Component inventory

| Component (Figma node) | Type | In DS? | Reuse? | Notes |
|---|---|---|---|---|
| HomePage (84:425, `menu-navegacao-mobile`) | Server-connected | ✓ | `app/page.tsx` | see screen: Página inicial — mobile. Raiz do frame = a home a 375px. Aqui serve só de fundo para o menu aberto; os verbos da página não se repetem nesta tela |
| top-decorative-strip (84:426) | Presentational | ✗ | new | see screen: Página inicial — mobile |
| SiteNavbar (84:427, `navbar`) | Presentational | ✓ | `components/layout/site-navbar.tsx` | see screen: Página inicial — mobile. Fica atrás do overlay e conserva o `menu-button` que abriu o sheet |
| PublicSiteNavbar (84:427, `navbar`) | Server-connected | ✓ | `components/layout/public-site-navbar.tsx` | see screen: Página inicial — mobile. É o Server Component que lê `getViewerChannel()` (GET /me/channel, nome + nickname) e decide entre chrome logado e anônimo. **Nesta tela** carrega um verbo novo: repassar à NavigationSheet a identidade que aparece em `sheet-user` (84:495). Hoje passa só `channelName` ao `ChannelUserMenu` e também vai precisar passar o nickname |
| BrandLogo (84:428) | Presentational | ✓ | `components/auth/brand-logo.tsx` | see screen: Página inicial — mobile. `logo-box` (84:429) e o texto (84:433) são markup interno do BrandLogo |
| StreamtubeIcon (84:430, `play-icon`) | Presentational | ✓ | `components/icons/streamtube-icon.tsx` | see screen: Página inicial — mobile. Ícone dentro de BrandLogo/logo-box. Ganha linha própria pela regra de granularidade |
| navbar-actions (84:434) | Presentational | ✗ | new | see screen: Página inicial — mobile. Frame de layout que agrupa os dois botões-ícone |
| SearchToggleButton (84:435, `search-toggle-button`) | Local-interactive | ✓ | `components/ui/icon-button.tsx` | see screen: Página inicial — mobile |
| SearchIcon (84:436, `search-icon`) | Presentational | ✗ | `components/icons/search-icon.tsx (new)` | see screen: Página inicial — mobile. Ícone dentro de SearchToggleButton |
| MenuButton (84:439, `menu-button`) | Local-interactive | ✓ | `components/ui/icon-button.tsx` | see screen: Página inicial — mobile. Nesta tela é o gatilho (Dialog.Trigger) da NavigationSheet, no estado aberto (`aria-expanded="true"`). Não faz I/O |
| MenuIcon (84:440, `menu-icon`) | Presentational | ✗ | `components/icons/menu-icon.tsx (new)` | see screen: Página inicial — mobile. Ícone dentro de MenuButton |
| main-dashed-container (84:444) | Presentational | ✗ | new | see screen: Página inicial — mobile |
| CategoryFilter (84:445, `category-filter`) | Local-interactive | ✗ | `components/videos/category-filter.tsx (new)` | see screen: Página inicial — mobile |
| CategoryChip (84:446, 84:448, 84:450, 84:452, 84:454, 84:456, 84:458, 84:460, 84:462) | Local-interactive | ✗ | `components/videos/category-chip.tsx (new)` | see screen: Página inicial — mobile. 9 instâncias; "Todos" (84:446) usa `state=selected` e as demais `state=default`. Os rótulos de 84:450–84:462 vêm de `text_overrides` (projeção compacta) |
| VideoGrid (84:464, `video-list`) | Presentational | ✗ | `components/videos/video-grid.tsx (new)` | **Não faz fetch próprio** (recebe os itens da HomePage). _Resolvido 2026-10-06 (dono do fetch = página RSC; ver Decisions log do progress)._ see screen: Página inicial — mobile. Para o transbordo de 2px registrado em `_envelope.layout_note`, ver Observations |
| VideoCard (84:465, 84:476, `video-card-feed/size=mobile`) | Server-connected | ✓ | `components/videos/video-card.tsx` | see screen: Página inicial — mobile. Dois cards de contexto. `thumbnail`, `duration-badge` e `details` são markup interno do VideoCard. 84:476 traz só o override de título |
| Avatar (I84:465;83:115, `channel-avatar`) | Presentational | ✓ | `components/ui/avatar.tsx` | see screen: Página inicial — mobile. Avatar do canal dentro do VideoCard, com as iniciais "JC" |
| NavigationSheet (84:488, `navigation-sheet`) | Local-interactive | ✗ | `components/layout/navigation-sheet.tsx (new)` | **Nova nesta tela.** Painel lateral de 288px ancorado à direita (`absolute`). Abrir e fechar é estado do cliente, sobre o Dialog do `radix-ui`, com foco preso, Esc e toque fora fechando. Não lê nem grava dados: recebe a identidade como props do PublicSiteNavbar e o handler de logout de quem a renderiza. Só sem backend o logout dentro dela pararia; o componente em si continua funcionando. Mesmo critério de "dialog que envolve uma server action sem executá-la" |
| menu-overlay (84:487) | Presentational | ✗ | new | Backdrop da NavigationSheet: RECTANGLE `absolute` de 375×760, irmão do sheet na raiz do frame e não filho dele. Ganha linha própria para o nó não sumir, mas **não vira arquivo**: é o `Dialog.Overlay` renderizado dentro de `navigation-sheet.tsx`. O fechamento por toque fora é comportamento da NavigationSheet, e o nó em si não tem estado nem variante interativa no Figma |
| sheet-header (84:489) | Presentational | ✗ | new | Markup interno da NavigationSheet. O título "Menu" (84:490) é texto do próprio header e deve ser o `Dialog.Title`, nome acessível do diálogo |
| CloseButton (84:491, `close-button`) | Local-interactive | ✓ | `components/ui/icon-button.tsx` | Fecha a NavigationSheet (`Dialog.Close`), sem I/O. 40×40, mesmo tamanho dos botões-ícone da navbar |
| XIcon (84:492, `x-icon`) | Presentational | ✗ | `components/icons/x-icon.tsx (new)` | Ícone dentro de CloseButton. A linha existe porque o pai resolve para um componente do DS: é o caso do `download-icon` perdido na Fase 05 |
| sheet-user (84:495) | Presentational | ✗ | new | Markup interno da NavigationSheet: Avatar + `sheet-user-info` (84:498) com `user-name` "Joana Cria" (84:499) e `user-handle` "@joana.cria" (84:500). Mostra props já resolvidas no servidor e não busca nada. A dependência de sessão fica no PublicSiteNavbar (ver Observations). Mesmo critério do UserMenu/Avatar na Fase 06 (Presentational) |
| Avatar (84:496, `avatar`) | Presentational | ✓ | `components/ui/avatar.tsx` | Avatar do usuário dentro de sheet-user. As iniciais "JC" (84:497) são conteúdo do Avatar (`AvatarFallback` + `initialsOf`) |
| divider (84:501, 84:509) | Presentational | ✗ | new | Dois separadores de 1px dentro da NavigationSheet: entre identidade e links, e entre links e "Sair". `components/ui` não tem primitivo separator. É markup interno do sheet |
| sheet-nav (84:502) | Presentational | ✗ | new | Markup interno da NavigationSheet: o `<nav>` que agrupa os três links. Pede `aria-label` próprio para não colidir com o `<nav>` da navbar |
| SheetLinkInicio (84:503, `sheet-link-inicio`) | Local-interactive | ✗ | new | `<Link href="/">` do Next.js dentro da NavigationSheet, rótulo "Início" (84:504). Variante **ativa** na tela (fundo destacado, texto na cor primária): pede `aria-current="page"` pela rota corrente. Navegar fecha o sheet |
| SheetLinkCanaisSeguidos (84:505, `sheet-link-canais-seguidos`) | Local-interactive | ✗ | new | `<Link>` para a rota existente `/channel/subscriptions`, a mesma do `nav-link-canais-seguidos` da `SiteNavbar` na Fase 06. Rótulo "Canais seguidos" (84:506) |
| SheetLinkMeusVideos (84:507, `sheet-link-meus-videos`) | Local-interactive | ✗ | new | `<Link>` para a rota existente `/channel/videos`. Rótulo "Meus vídeos" (84:508) |
| SairButton (84:510, `sair-button`) | Server-connected | ✓ | `components/ui/button.tsx` | Mesma ação "Sair" do UserMenu do desktop, em outro lugar. Dispara o logout, uma mutation via Route Handler BFF `POST /api/auth/logout`, como o SairButton da Fase 04. O rótulo "Sair" (84:511) é conteúdo do botão. Variante outline, à esquerda, sem largura total. _Resolvido 2026-10-06: logout **herdado da Fase 02**, sem verbo nesta fatia (mesmo tratamento da Fase 04)._ |

### Verbs of intent

| Verb | Component | Capability (project-plan.md) |
|---|---|---|
| Exibir no menu de navegação a identidade do usuário logado (nome e @handle) | PublicSiteNavbar (84:427) → NavigationSheet (84:488) → sheet-user (84:495) | "Header/navbar com logo, barra de busca, botão de login/avatar e navegação" |

### Observations

- **Proveniência.** Tudo veio do cache `docs/figma-cache/FetKyb1V02WS5D6VCatK6t/84-425.json` (`fetched_at` 2026-10-06T23:05:00Z, `maxDepth` 14) e do `84-425.png`. O frame foi desenhado e colhido na mesma chamada `use_figma`, e a árvore foi lida do nó depois da escrita. A projeção é **compacta**: sem fills, fontes, padding, gap nem radius. As instâncias repetidas (chips 84:450–84:462 e o card 84:476) chegam com `children_omitted` + `text_overrides`. Nenhuma chamada MCP nesta tela. Nenhum container no `maxDepth` ficou sem filhos e não há truncamento a registrar.
- **TDs pendentes.** O frame segue as recomendações dos **TD-07 e TD-08, ambos PENDING** em `docs/decisions/technical-decisions-home-busca.md`:
  - TD-07 A: barra superior só no desktop; no mobile a busca vira ícone e os links vão para um menu (aqui, sheet).
  - TD-08 B: frames mobile só para o que é novo.
  - Se algum dos dois for decidido de outro jeito, esta tela inteira perde a base.
- **Estado autenticado intencional.** O frame mostra o estado logado de propósito: identidade, links de área autenticada e "Sair". **A variante ANÔNIMA do sheet NÃO foi desenhada.** Nela, "Entrar" substituiria `sheet-user` e `sair-button`. Também falta definir se "Canais seguidos" e "Meus vídeos", que levam a rotas de `(studio)`, somem para o anônimo. Hoje a `SiteNavbar` só mostra "Canais seguidos" com `showSubscriptionsLink`. A variante anônima terá de ser argumentada, não observada.
- **Onde fica a dependência de sessão.** `sheet-user` foi classificado como Presentational e não como Server-connected por três motivos:
  - Ele não busca dados.
  - Ele não decide sozinho se renderiza.
  - Ele mostra props que o servidor já resolveu, como o UserMenu/Avatar da Fase 06.
  
  Quem depende do estado do servidor é o **PublicSiteNavbar**, que lê `getViewerChannel()` e escolhe o chrome logado ou anônimo. Por isso o verbo de identidade foi atribuído a ele. **Correção de premissa:** nome e @handle **não** vêm do `SessionContext` do auth-frontend TD-06, cujo `SessionState` só tem `userId`, `email`, `channelSlug` e `isLoggedIn`. Vêm do `Channel` de `GET /me/channel`, que traz `name` e `nickname`, lido pelo PublicSiteNavbar. "Joana Cria" / "@joana.cria" são o nome e o nickname do canal do espectador.
- **Logout fora da fatia.** O "Sair" do sheet repete o logout do UserMenu. A capability "Logout" é da Fase 02 e já foi tratada como herdada na Fase 04. _Resolvido 2026-10-06 pelo usuário: herdado da Fase 02, sem verbo nesta fatia._ **Nota de responsabilidade única para o plan-build:** hoje a chamada a `POST /api/auth/logout`, com `router.push("/login")` e `router.refresh()`, fica dentro de `components/layout/channel-user-menu.tsx`. Com dois pontos de logout (UserMenu no desktop e NavigationSheet no mobile), essa lógica precisa sair dali para um lugar compartilhado e não pode ser duplicada no sheet. Isso não é componente do Figma e não ganha linha.
- **Responsividade só estrutural.** "Layout responsivo para dispositivos móveis" é coberta nesta tela **só na estrutura**: o sheet é a forma como a navegação existe no mobile. Ele é Local-interactive, então não carrega verbo, e nenhum verbo foi forçado para essa capability aqui.
- **Falta o primitivo de sheet.** `components/ui` ainda não tem sheet nem drawer (TD-07 Context), mas o `radix-ui` está instalado. Fica em aberto se a `NavigationSheet` usa o `Dialog` do Radix direto ou se nasce antes um primitivo genérico, como `components/ui/sheet.tsx` no padrão shadcn. Nenhum nó do Figma separa as duas camadas, então nenhuma linha foi criada para o primitivo. Decidir no plan-build.
- **Destinos diferentes do TD-07.** O sheet tem **Início / Canais seguidos / Meus vídeos**, mas o Context do TD-07 lista "Início, Canais seguidos, Seu canal, Enviar vídeo". O desenho não tem "Seu canal" nem "Enviar vídeo" (`/upload` existe), e "Meus vídeos" não está na lista do TD. Confirmar qual conjunto vale.
- **Só no screenshot.** A largura e a cor do overlay, o destaque do link ativo (fundo azul-claro, texto primário) e a sombra do painel aparecem só no PNG, porque a projeção não traz fills. No PNG o logo da navbar parece cortado pelo overlay. O texto do BrandLogo no nó 84:433 é "EstúdioCriador", enquanto `components/auth/brand-logo.tsx` renderiza "StreamTube". Fica registrado para a tela "Página inicial — mobile".
- **Transbordo do card.** Pelo `_envelope.layout_note`, o `video-list` tem 341px e o card mobile tem 343px fixos: transborda 2px por causa do stroke do container. Na implementação o card ocupa a largura do container (FILL). Afeta só o fundo de contexto.

---

## Reconciliation summary

| Capability (project-plan.md) | Covered by | Screens |
|------------------------------|------------|---------|
| "Página inicial com grid de vídeos (thumbnail, título, canal, visualizações e tempo de publicação)" | HomePage (dona do fetch), VideoCard | `/` (Página inicial) |
| "Filtro de vídeos por categoria na home" | HomePage (lê `?category=`; CategoryFilter/CategoryChip só navegam) | `/` (Página inicial) |
| "Barra de busca (pesquisa por título e canal)" | ResultsPage (dona do fetch, inclusive do estado vazio), VideoCard; SearchForm só navega para `/results?q=` | `/results` (Resultados da busca; Resultados da busca — sem resultados) |
| "Header/navbar com logo, barra de busca, botão de login/avatar e navegação" | PublicSiteNavbar (controle de sessão no header e identidade no menu mobile) | `/` (Página inicial; Menu de navegação — mobile), `/results` (Resultados da busca) |
| "Paginação ou scroll infinito nas listagens de vídeos" | HomePage, ResultsPage (leem `?page=N`; Pagination só navega) | `/` (Página inicial), `/results` (Resultados da busca) |
| "Layout responsivo para dispositivos móveis" | HomePage e ResultsPage renderizando a VideoGrid em coluna única; estruturalmente também NavigationSheet, SearchToggleButton e MenuButton (Local-interactive, sem verbo) | `/` (Página inicial — mobile; Menu de navegação — mobile), `/results` (Resultados da busca — mobile) |

## Open questions

- **As 6 telas seguem Recommendations de TDs ainda PENDING.** As decisões são `home-busca/TD-01` B (`/results`), TD-02 A (paginação numerada em `?page=N`), TD-03 A (mais recentes primeiro), TD-05 A (só vídeos), TD-06 A (`next/form` com botão "Buscar"), TD-07 A (barra superior e sheet no mobile) e TD-08 B (frames mobile só do que é novo). Se o `/plan-resolve` escolher outra letra em qualquer uma delas, as telas correspondentes precisam ser redesenhadas e reinventariadas. Exemplos: TD-02 C troca a Pagination por scroll infinito; TD-05 B acrescenta um bloco de canais; TD-07 B põe uma sidebar em todas as telas.
- **Variante anônima do menu mobile não desenhada.** O frame `84:425` é autenticado. Para o anônimo faltam três definições: o bloco "Entrar" no lugar de `sheet-user` e `sair-button`, quais links aparecem (Canais seguidos e Meus vídeos levam a rotas de `(studio)`), e se a barra mobile fechada do usuário autenticado mostra o avatar ou deixa tudo no sheet. Como a barra mobile anônima (`84:299`) não tem "Entrar", o caminho do anônimo até o login no mobile é **argumentado, não observado**.
- **Destinos da navegação divergem do `home-busca/TD-07`.** O desenho tem Início / Canais seguidos / Meus vídeos. O Context do TD-07 lista Início, Canais seguidos, Seu canal e Enviar vídeo: não há "Enviar vídeo" (`/upload` existe) e "Meus vídeos" não está na lista. É preciso confirmar o conjunto antes do plan-build.
- **A Pagination do DS diverge do desenho no mobile.** `components/ui/pagination.tsx` esconde o texto de Anterior/Próxima abaixo de `sm` e mostra só os chevrons; os frames de 375px mostram o texto, sem chevrons. Também não estão desenhados o estado desabilitado de Anterior/Próxima nem o que acontece quando há uma página só (esconder a paginação ou não).
- **Estados sem desenho.** Não há frame para:
  - carregamento e erro da listagem;
  - home sem vídeos, ou sem vídeos na categoria selecionada;
  - busca vazia no mobile;
  - termo abaixo do comprimento mínimo que `home-busca/TD-04` manda fixar no resolve.

  O plan-build terá de derivar esses estados pelos padrões das Fases 04–06 (`loading.tsx`, estados vazios existentes).
- **Logout passa a ter dois pontos de entrada.** São o UserMenu no desktop e a NavigationSheet no mobile. Hoje a chamada a `POST /api/auth/logout` vive em `components/layout/channel-user-menu.tsx`. Pelo princípio de responsabilidade única ela precisa ir para um lugar compartilhado, sem duplicar no sheet. O verbo foi registrado como herdado da Fase 02 (Decisions log).
- **Falta o primitivo de sheet.** `components/ui` não tem sheet/drawer, mas `radix-ui` está instalado. Fica para o plan-build decidir entre a `NavigationSheet` usar o `Dialog` do Radix direto ou criar antes um `components/ui/sheet.tsx` genérico.
- **O `VideoCard` estendido muda de contrato.** Além da linha de canal e da variante `size=desktop|mobile`, o `sizes="233px"` fixo da thumbnail precisa acompanhar a variante mobile (largura cheia), senão o `next/image` serve imagem subdimensionada. O desenho também não mostra destino de clique no card nem no nome do canal (presumivelmente `/videos/{publicId}` e `/@{nickname}`).
