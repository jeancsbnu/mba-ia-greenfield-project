---
kind: drift-report
phase: phase-07-home-busca
plan_mtime: "2026-10-11T21:53:46Z"
---

# phase-07-home-busca — Drift Report

## Screen: pagina-inicial — audited at SI-07.10.0 (2026-10-11)

**Quick scan:** 9 alinhado · 1 drift menor · 3 drift relevante · 0 ausente

**Fonte do contexto Figma:** `docs/figma-cache/FetKyb1V02WS5D6VCatK6t/83-127.json` + `83-127.png` (frame `83:127`), `83-126.json` (`category-chip`, COMPONENT_SET `state=default|selected`) e `83-121.json` (`video-card-feed`, COMPONENT_SET `size=desktop|mobile`), colhidos pelo `figma-batch` em 2026-10-06. **Nenhuma chamada ao MCP do Figma**, mesmo desenho cache-first das Fases 05 e 06. A projeção é compacta (sem fills, padding nem raio), então os valores visuais vêm do PNG, e a paleta é a de sempre: `#3f72af` → `primary`/`link`, `#1e293b` → `foreground`, `#7a6e65` → `muted-foreground`, `#e2e8f0` → `border`.

**Nota sistêmica, herdada e não reaberta:** a marca do frame é "EstúdioCriador" num glifo azul, e o produto é "StreamTube". As caixas tracejadas (`top-decorative-strip`, `main-dashed-container`, `footer-pagination`) são marcação do arquivo de design, não UI.

- SiteNavbar (`site-navbar.tsx`) → `alinhado`
- PublicSiteNavbar (`public-site-navbar.tsx`) → `alinhado`
- BrandLogo (`brand-logo.tsx`) → `drift relevante` (exception)
- StreamtubeIcon (`streamtube-icon.tsx`) → `drift relevante` (exception)
- SearchForm (`search-form.tsx`) → `alinhado`
- SearchIcon (`search-icon.tsx`) → `alinhado`
- Button (`button.tsx`) → `alinhado`
- CategoryFilter (`category-filter.tsx`) → `alinhado`
- CategoryChip (`category-chip.tsx`) → `alinhado`
- VideoGrid (`video-grid.tsx`) → `drift menor`
- VideoCard (`video-card.tsx`) → `alinhado`
- Avatar (`avatar.tsx`) → `drift relevante` (exception)
- Pagination (`pagination.tsx`) → `alinhado`

### next-frontend/components/layout/site-navbar.tsx — SiteNavbar

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-06.21.0 honored"

A variante anônima do frame (`83:129`) é: marca, depois o link "Início" (`83:137`, em azul por ser a rota atual), depois o campo de busca com o botão "Buscar" e, por fim, "Entrar" (`83:146`). É a ordem que a barra desktop entrega a partir de `lg`. O link ativo usa `aria-[current=page]:text-link`.

### next-frontend/components/layout/public-site-navbar.tsx — PublicSiteNavbar

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

### next-frontend/components/auth/brand-logo.tsx — BrandLogo

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: o `brand-logo` do frame é a marca "EstúdioCriador", não "StreamTube" — mesma decisão das Fases 05 e 06.
- **Prior:** "exception at SI-06.21.0 — 'wordmark de outra marca'"

### next-frontend/components/icons/streamtube-icon.tsx — StreamtubeIcon

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: o glifo no `logo-box` é o da marca "EstúdioCriador"; o ícone do DS é a marca correta do produto — mesma decisão das Fases 05 e 06.
- **Prior:** "exception at SI-06.21.0 — 'glifo de outra marca'"

### next-frontend/components/layout/search-form.tsx — SearchForm

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

O `search-input` (`83:139`) tem lupa à esquerda, placeholder "Buscar vídeos ou canais" (`83:143`) e o botão preenchido "Buscar" (`83:145`) ao lado, e o componente monta exatamente isso. O placeholder do frame é cinza, e o `Input` do DS pinta o placeholder com `text-foreground`. Esse valor é do primitivo `components/ui/input.tsx`, que não está na lista desta tela e é compartilhado com todos os formulários da Fase 02, então não entra aqui e não é sobrescrito no chamador.

### next-frontend/components/icons/search-icon.tsx — SearchIcon

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

### next-frontend/components/ui/button.tsx — Button

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-06.21.0 honored"

"Buscar" é preenchido com a cor da marca, a variante `default`. "Entrar" é branco com borda sutil, a variante `secondary` depois do retune da Fase 05.

### next-frontend/components/videos/category-filter.tsx — CategoryFilter

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

O `category-filter` (`83:149`) é horizontal: "Todos" + as 8 categorias, na ordem do enum, com espaçamento de 8px (`gap-2`).

### next-frontend/components/videos/category-chip.tsx — CategoryChip

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

As duas variantes batem com o componente: pílula de 32px de altura, `default` branco com borda e `selected` preenchido com a cor da marca. O stroke de 1px no `selected` vem da correção da chamada 2 do harvest (`83:124`), e a borda `border-primary` reproduz a mesma altura.

### next-frontend/components/videos/video-grid.tsx — VideoGrid

- **Status:** drift menor
- **Decision:** `auto-Edit`
  - retune gap: grid — gap-x-6 gap-y-8 → gap-6
- **Prior:** _(none)_

As três `video-grid-row` do frame têm o mesmo respiro entre colunas e entre linhas, cerca de 24px no PNG. A grade separa as linhas com 32px (`gap-y-8`).

### next-frontend/components/videos/video-card.tsx — VideoCard

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

O `video-card-feed` `size=desktop` (`83:99`) tem a thumbnail com o `duration-badge` no canto e, embaixo, `details` horizontal: avatar de 32px mais `video-info` vertical. O `title` (`83:107`) fica em até 2 linhas e o `channel-name` e o `meta` em 1, como registrado na nota do harvest. O card entrega essa estrutura quando recebe `channel`.

### next-frontend/components/ui/avatar.tsx — Avatar

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: o `channel-avatar` (`83:104`) é preenchido com a cor da marca e iniciais brancas, e o `AvatarFallback` do DS usa `bg-muted`/`text-muted-foreground` em todo o app (cabeçalho do canal, comentários, menu do usuário). Trocar só aqui fragmentaria os avatares de iniciais, e retunar o primitivo mexeria em quatro telas já entregues por uma só.
- **Prior:** "exception at SI-06.21.0 — tamanhos de avatar fora da escala"

### next-frontend/components/ui/pagination.tsx — Pagination

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "auto-Edit at SI-04.x (aria-labels em pt-BR) honored"

"Anterior · 1 · 2 · 3 · Próxima", alinhada à direita, é a mesma composição da página do canal, que já usa o primitivo depois do retune da Fase 04.

## Screen: resultados-da-busca — audited at SI-07.11.0 (2026-10-11)

**Quick scan:** 9 alinhado · 1 drift menor · 3 drift relevante · 0 ausente

**Fonte do contexto Figma:** `docs/figma-cache/FetKyb1V02WS5D6VCatK6t/83-311.json` + `83-311.png` (frame `83:311`, variante **autenticada** do chrome), colhidos em 2026-10-06. Nenhuma chamada ao MCP do Figma.

- SiteNavbar (`site-navbar.tsx`) → `alinhado`
- PublicSiteNavbar (`public-site-navbar.tsx`) → `alinhado`
- BrandLogo (`brand-logo.tsx`) → `drift relevante` (exception)
- StreamtubeIcon (`streamtube-icon.tsx`) → `drift relevante` (exception)
- SearchForm (`search-form.tsx`) → `alinhado`
- Input (`input.tsx`) → `drift menor` (exception)
- SearchIcon (`search-icon.tsx`) → `alinhado`
- Button (`button.tsx`) → `alinhado`
- UserMenu (`user-menu.tsx`) → `alinhado`
- Avatar (`avatar.tsx`) → `drift relevante` (exception)
- VideoGrid (`video-grid.tsx`) → `alinhado`
- VideoCard (`video-card.tsx`) → `alinhado`
- Pagination (`pagination.tsx`) → `alinhado`

### next-frontend/components/layout/site-navbar.tsx — SiteNavbar

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.10.0 honored"

A variante autenticada (`83:313`) tem marca, `nav-links` com Início, Canais seguidos e Meus vídeos (`83:320`), `search-form` (`83:324`) e `user-menu` (`83:332`), nessa ordem. Nenhum link está ativo em `/results`.

### next-frontend/components/layout/public-site-navbar.tsx — PublicSiteNavbar

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.10.0 honored"

### next-frontend/components/auth/brand-logo.tsx — BrandLogo

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: o `brand-logo` (`83:314`) é a marca "EstúdioCriador", não "StreamTube" — mesma decisão da Página inicial.
- **Prior:** "exception at SI-07.10.0 — 'wordmark de outra marca'"

### next-frontend/components/icons/streamtube-icon.tsx — StreamtubeIcon

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: o glifo no `logo-box` (`83:315`) é o da marca "EstúdioCriador" — mesma decisão da Página inicial.
- **Prior:** "exception at SI-07.10.0 — 'glifo de outra marca'"

### next-frontend/components/layout/search-form.tsx — SearchForm

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.10.0 honored"

O campo chega preenchido com "docker" (`83:329`). Isso é o `defaultValue` vindo do `q` da URL e não muda o componente.

### next-frontend/components/ui/input.tsx — Input

- **Status:** drift menor
- **Decision:** `exception`
  - reason: o `search-input` (`83:325`) tem 40px de altura e o `Input` do DS tem 36px (`h-9`). O primitivo serve todos os formulários das Fases 02 a 06, e retuná-lo por uma tela mudaria todos eles. O slot de ícone que o inventário pedia virou markup do `SearchForm`, como a própria linha do inventário admite.
- **Prior:** _(none)_

### next-frontend/components/icons/search-icon.tsx — SearchIcon

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.10.0 honored"

### next-frontend/components/ui/button.tsx — Button

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.10.0 honored"

### next-frontend/components/layout/user-menu.tsx — UserMenu

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-06.21.0 honored"

Avatar de 32px (`83:333`) mais "Sair" (`83:335`). O avatar é link "Seu canal" sem mudança visual, como fixado pela Revision de 2026-10-11 de home-busca/TD-07.

### next-frontend/components/ui/avatar.tsx — Avatar

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: avatar preenchido com a cor da marca no desenho e `bg-muted` no DS em todo o app — mesma decisão da Página inicial.
- **Prior:** "exception at SI-07.10.0 — cor do fallback de iniciais"

### next-frontend/components/videos/video-grid.tsx — VideoGrid

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "auto-Edit at SI-07.10.0 (gap-6) honored"

### next-frontend/components/videos/video-card.tsx — VideoCard

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.10.0 honored"

O `title` de "Configurando o Docker do zero" (`I83:343;83:107`) ocupa duas linhas (36px), o caso do `line-clamp-2`.

### next-frontend/components/ui/pagination.tsx — Pagination

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.10.0 honored"

"Anterior · 1 · Próxima" (`83:433`) é a mesma `FeedPagination` da home, com uma página só no desenho.

## Screen: resultados-da-busca-sem-resultados — audited at SI-07.12.0 (2026-10-11)

**Quick scan:** 7 alinhado · 1 drift menor · 3 drift relevante · 0 ausente

**Fonte do contexto Figma:** `docs/figma-cache/FetKyb1V02WS5D6VCatK6t/83-437.json` + `83-437.png` (frame `83:437`, chrome autenticado e o estado vazio). Nenhuma chamada ao MCP do Figma.

- SiteNavbar (`site-navbar.tsx`) → `alinhado`
- PublicSiteNavbar (`public-site-navbar.tsx`) → `alinhado`
- BrandLogo (`brand-logo.tsx`) → `drift relevante` (exception)
- StreamtubeIcon (`streamtube-icon.tsx`) → `drift relevante` (exception)
- SearchForm (`search-form.tsx`) → `alinhado`
- Input (`input.tsx`) → `drift menor` (exception)
- SearchIcon (`search-icon.tsx`) → `alinhado`
- Button (`button.tsx`) → `alinhado`
- UserMenu (`user-menu.tsx`) → `alinhado`
- Avatar (`avatar.tsx`) → `drift relevante` (exception)
- SearchEmptyState (`search-empty-state.tsx`) → `alinhado`

### next-frontend/components/layout/site-navbar.tsx — SiteNavbar

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.11.0 honored"

### next-frontend/components/layout/public-site-navbar.tsx — PublicSiteNavbar

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.11.0 honored"

### next-frontend/components/auth/brand-logo.tsx — BrandLogo

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: marca "EstúdioCriador" no frame (`83:437`), não "StreamTube" — mesma decisão das telas anteriores.
- **Prior:** "exception at SI-07.11.0 — 'wordmark de outra marca'"

### next-frontend/components/icons/streamtube-icon.tsx — StreamtubeIcon

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: glifo da marca "EstúdioCriador" — mesma decisão das telas anteriores.
- **Prior:** "exception at SI-07.11.0 — 'glifo de outra marca'"

### next-frontend/components/layout/search-form.tsx — SearchForm

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.11.0 honored"

### next-frontend/components/ui/input.tsx — Input

- **Status:** drift menor
- **Decision:** `exception`
  - reason: o campo do desenho tem 40px de altura e o primitivo 36px; o `Input` serve todos os formulários do app — mesma decisão de Resultados da busca.
- **Prior:** "exception at SI-07.11.0 — altura do primitivo compartilhado"

### next-frontend/components/icons/search-icon.tsx — SearchIcon

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.11.0 honored"

### next-frontend/components/ui/button.tsx — Button

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.11.0 honored"

### next-frontend/components/layout/user-menu.tsx — UserMenu

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.11.0 honored"

### next-frontend/components/ui/avatar.tsx — Avatar

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: avatar preenchido com a cor da marca no desenho, `bg-muted` no DS em todo o app — mesma decisão das telas anteriores.
- **Prior:** "exception at SI-07.11.0 — cor do fallback de iniciais"

### next-frontend/components/videos/search-empty-state.tsx — SearchEmptyState

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

O bloco do frame (`83:437`) é um cartão branco centrado com o `empty-icon-badge` (círculo de 56px com a lupa), `empty-title` "Nenhum vídeo encontrado para “xyzabc”", `empty-hint` e o `back-home-link` em azul. O componente foi escrito a partir desse frame no SI-07.0.4 e entrega os quatro elementos na mesma ordem e no mesmo alinhamento.

## Screen: pagina-inicial-mobile — audited at SI-07.13.0 (2026-10-11)

**Quick scan:** 9 alinhado · 0 drift menor · 4 drift relevante · 0 ausente

**Fonte do contexto Figma:** `docs/figma-cache/FetKyb1V02WS5D6VCatK6t/84-299.json` + `84-299.png` (frame `84:299`, 375px, chrome anônimo). Nenhuma chamada ao MCP do Figma.

- SiteNavbar (`site-navbar.tsx`) → `drift relevante`
- PublicSiteNavbar (`public-site-navbar.tsx`) → `alinhado`
- BrandLogo (`brand-logo.tsx`) → `drift relevante` (exception)
- StreamtubeIcon (`streamtube-icon.tsx`) → `drift relevante` (exception)
- IconButton (`icon-button.tsx`) → `alinhado`
- SearchIcon (`search-icon.tsx`) → `alinhado`
- MenuIcon (`menu-icon.tsx`) → `alinhado`
- CategoryFilter (`category-filter.tsx`) → `alinhado`
- CategoryChip (`category-chip.tsx`) → `alinhado`
- VideoGrid (`video-grid.tsx`) → `alinhado`
- VideoCard (`video-card.tsx`) → `alinhado`
- Avatar (`avatar.tsx`) → `drift relevante` (exception)
- Pagination (`pagination.tsx`) → `alinhado`

### next-frontend/components/layout/site-navbar.tsx — SiteNavbar

- **Status:** drift relevante
- **Decision:** `auto-Edit`
  - +navbar-actions 'SearchToggleButton + MenuButton' from Figma demand (`84:308`, só abaixo de `lg`)
- **Prior:** "alinhado at SI-07.11.0 (barra desktop)"

Abaixo de `lg`, o frame (`84:301`) mostra só a marca e o grupo `navbar-actions` (`84:308`), com o `SearchToggleButton` (`84:309`) e o `MenuButton` (`84:313`), botões de ícone 40×40 sem caixa. A `SiteNavbar` ainda não tem essa barra: abaixo de `lg` hoje sobra só a marca, porque a parte desktop está em `hidden lg:flex`. Isso é superfície ausente.

### next-frontend/components/layout/public-site-navbar.tsx — PublicSiteNavbar

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.12.0 honored"

### next-frontend/components/auth/brand-logo.tsx — BrandLogo

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: marca "EstúdioCriador" no frame (`84:302`), não "StreamTube" — mesma decisão das telas desktop.
- **Prior:** "exception at SI-07.12.0 — 'wordmark de outra marca'"

### next-frontend/components/icons/streamtube-icon.tsx — StreamtubeIcon

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: glifo da marca "EstúdioCriador" — mesma decisão das telas desktop.
- **Prior:** "exception at SI-07.12.0 — 'glifo de outra marca'"

### next-frontend/components/ui/icon-button.tsx — IconButton

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

Os dois botões do frame são glifos sem fundo nem borda, em 40×40: a variante `ghost` no tamanho `lg` (`size-10`), sem mudança no primitivo.

### next-frontend/components/icons/search-icon.tsx — SearchIcon

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.12.0 honored"

### next-frontend/components/icons/menu-icon.tsx — MenuIcon

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

O `menu-icon` tem três vetores horizontais de mesmo comprimento, como o glifo do componente.

### next-frontend/components/videos/category-filter.tsx — CategoryFilter

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.10.0 honored"

A faixa do frame (341px) corta o quarto chip na borda, o sinal de rolagem horizontal, e o componente rola abaixo de `sm`.

### next-frontend/components/videos/category-chip.tsx — CategoryChip

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.10.0 honored"

### next-frontend/components/videos/video-grid.tsx — VideoGrid

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "auto-Edit at SI-07.10.0 (gap-6) honored"

Coluna única abaixo de `sm`.

### next-frontend/components/videos/video-card.tsx — VideoCard

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.11.0 honored"

O `size=mobile` (`83:110`) tem a mesma estrutura do desktop, com a thumbnail na largura cheia. O card ocupa a largura do contêiner (FILL), e a thumbnail é servida em `100vw` abaixo de `sm`.

### next-frontend/components/ui/avatar.tsx — Avatar

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: avatar preenchido com a cor da marca no desenho e `bg-muted` no DS em todo o app — mesma decisão das telas desktop.
- **Prior:** "exception at SI-07.12.0 — cor do fallback de iniciais"

### next-frontend/components/ui/pagination.tsx — Pagination

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.11.0 honored"

Centralizada abaixo de `sm`. O frame mostra "Anterior"/"Próxima" por extenso, e o DS mostra só os chevrons abaixo de `sm`; a divergência foi aceita pela Revision de 2026-10-11 de home-busca/TD-02.

## Screen: resultados-da-busca-mobile — audited at SI-07.14.0 (2026-10-11)

**Quick scan:** 8 alinhado · 0 drift menor · 1 drift relevante · 0 ausente

**Fonte do contexto Figma:** `docs/figma-cache/FetKyb1V02WS5D6VCatK6t/84-379.json` + `84-379.png` (frame `84:379`, 375px, busca expandida). Nenhuma chamada ao MCP do Figma.

- SiteNavbar (`site-navbar.tsx`) → `alinhado`
- IconButton (`icon-button.tsx`) → `alinhado`
- ArrowBackIcon (`arrow-back-icon.tsx`) → `alinhado`
- SearchForm (`search-form.tsx`) → `alinhado`
- SearchIcon (`search-icon.tsx`) → `alinhado`
- VideoGrid (`video-grid.tsx`) → `alinhado`
- VideoCard (`video-card.tsx`) → `alinhado`
- Avatar (`avatar.tsx`) → `drift relevante` (exception)
- Pagination (`pagination.tsx`) → `alinhado`

### next-frontend/components/layout/site-navbar.tsx — SiteNavbar

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "auto-Edit at SI-07.13.0 (+navbar-actions) honored"

O estado de busca expandida do frame (`84:381`, 375×65) é `search-back-button` (`84:382`) + `search-form`, com a marca, o menu e o controle de sessão ocultos. A `SiteNavbar` já entrega esse estado: a barra mobile do SI-07.13b expande a busca sobre si mesma, e em `/results` ela já nasce aberta.

### next-frontend/components/ui/icon-button.tsx — IconButton

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.13.0 honored"

`SearchBackButton` (`84:382`) e `SearchSubmitButton` (`84:389`) são glifos 40×40 sem caixa: `ghost` `lg`.

### next-frontend/components/icons/arrow-back-icon.tsx — ArrowBackIcon

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

Mesmo glifo de seta para trás que o DS já tem; muda só o nome do componente no Figma.

### next-frontend/components/layout/search-form.tsx — SearchForm

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.12.0 honored"

Na variante `mobile`, o form é só o campo com lupa à esquerda, e o submit de ícone é o botão "Buscar" da barra, ligado pelo atributo `form`. No frame (`84:383`) o campo vem preenchido com "docker".

### next-frontend/components/icons/search-icon.tsx — SearchIcon

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.13.0 honored"

### next-frontend/components/videos/video-grid.tsx — VideoGrid

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.13.0 honored"

### next-frontend/components/videos/video-card.tsx — VideoCard

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.13.0 honored"

### next-frontend/components/ui/avatar.tsx — Avatar

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: avatar preenchido com a cor da marca no desenho e `bg-muted` no DS em todo o app — mesma decisão das outras telas.
- **Prior:** "exception at SI-07.13.0 — cor do fallback de iniciais"

### next-frontend/components/ui/pagination.tsx — Pagination

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.13.0 honored"

Centralizada, com os chevrons abaixo de `sm` (divergência de texto aceita pela Revision de home-busca/TD-02).

## Screen: menu-de-navegacao-mobile — audited at SI-07.15.0 (2026-10-11)

**Quick scan:** 11 alinhado · 1 drift menor · 4 drift relevante · 0 ausente

**Fonte do contexto Figma:** `docs/figma-cache/FetKyb1V02WS5D6VCatK6t/84-425.json` + `84-425.png` (frame `84:425`, 375px, variante autenticada do sheet). Nenhuma chamada ao MCP do Figma. O `@joana.cria` do frame viola o allowlist `[a-z0-9_]` (Open Question já registrada na Fase 04); o componente mostra o nickname real.

- SiteNavbar (`site-navbar.tsx`) → `alinhado`
- PublicSiteNavbar (`public-site-navbar.tsx`) → `alinhado`
- BrandLogo (`brand-logo.tsx`) → `drift relevante` (exception)
- StreamtubeIcon (`streamtube-icon.tsx`) → `drift relevante` (exception)
- IconButton (`icon-button.tsx`) → `alinhado`
- SearchIcon (`search-icon.tsx`) → `alinhado`
- MenuIcon (`menu-icon.tsx`) → `alinhado`
- XIcon (`x-icon.tsx`) → `alinhado`
- CategoryFilter (`category-filter.tsx`) → `alinhado`
- CategoryChip (`category-chip.tsx`) → `alinhado`
- VideoGrid (`video-grid.tsx`) → `alinhado`
- VideoCard (`video-card.tsx`) → `alinhado`
- Avatar (`avatar.tsx`) → `drift relevante` (exception)
- NavigationSheet (`navigation-sheet.tsx`) → `drift menor` (2 changes)
- Button (`button.tsx`) → `alinhado`
- Sheet (`sheet.tsx`) → `drift relevante`

### next-frontend/components/layout/site-navbar.tsx — SiteNavbar

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.14.0 honored"

Atrás do overlay fica a barra fechada, com o `menu-button` (`84:439`) que abriu o sheet.

### next-frontend/components/layout/public-site-navbar.tsx — PublicSiteNavbar

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.12.0 honored"

Repassa `name` e `nickname` do canal à `SiteNavbar`, que os entrega à `NavigationSheet`.

### next-frontend/components/auth/brand-logo.tsx — BrandLogo

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: marca "EstúdioCriador" no frame (`84:433`) — mesma decisão das outras telas.
- **Prior:** "exception at SI-07.13.0 — 'wordmark de outra marca'"

### next-frontend/components/icons/streamtube-icon.tsx — StreamtubeIcon

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: glifo da marca "EstúdioCriador" — mesma decisão das outras telas.
- **Prior:** "exception at SI-07.13.0 — 'glifo de outra marca'"

### next-frontend/components/ui/icon-button.tsx — IconButton

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.14.0 honored"

`menu-button` (`84:439`) e `close-button` (`84:491`): glifos 40×40 sem caixa, `ghost` `lg`.

### next-frontend/components/icons/search-icon.tsx — SearchIcon

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.14.0 honored"

### next-frontend/components/icons/menu-icon.tsx — MenuIcon

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.13.0 honored"

### next-frontend/components/icons/x-icon.tsx — XIcon

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

Glifo de "x" em dois traços, dentro do `close-button`.

### next-frontend/components/videos/category-filter.tsx — CategoryFilter

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.13.0 honored"

### next-frontend/components/videos/category-chip.tsx — CategoryChip

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.13.0 honored"

### next-frontend/components/videos/video-grid.tsx — VideoGrid

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.14.0 honored"

### next-frontend/components/videos/video-card.tsx — VideoCard

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.14.0 honored"

### next-frontend/components/ui/avatar.tsx — Avatar

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: avatar preenchido com a cor da marca no desenho (`sheet-user`, `84:495`) e `bg-muted` no DS em todo o app — mesma decisão das outras telas. O tamanho de 40px é o `lg` da escala.
- **Prior:** "exception at SI-07.14.0 — cor do fallback de iniciais"

### next-frontend/components/layout/navigation-sheet.tsx — NavigationSheet

- **Status:** drift menor
- **Decision:** `auto-Edit`
  - retune divider inset — full width → mx-4 (os `divider` `84:501`/`84:509` têm 256px dentro do painel de 288)
  - retune padding: sheet-nav — p-2 → px-4 py-2 (os links `84:503`–`84:507` têm 256px, a largura útil do painel)
- **Prior:** _(none)_

A estrutura confere: `sheet-header` com "Menu" e fechar, `sheet-user` (avatar, nome e handle), divisor, três links com o atual realçado, divisor e "Sair" `outline` à esquerda, sem largura total. Divergem só as medidas horizontais do divisor e dos links.

### next-frontend/components/ui/button.tsx — Button

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-07.12.0 honored"

"Sair" (`84:510`) é `outline`, como no `UserMenu`; "Entrar" da variante anônima é `secondary`, como na barra desktop.

### next-frontend/components/ui/sheet.tsx — Sheet

- **Status:** drift relevante
- **Decision:** `auto-Edit`
  - retune overlay background — bg-black/10 → bg-overlay/40
- **Prior:** _(none)_

O `menu-overlay` (`84:487`) escurece a página atrás do painel. O primitivo recém-instalado usa `bg-black/10`, cor crua de paleta e quase transparente, e o projeto tem o token semântico `--overlay` para isso. Também há quebra de sistema: a cor vem de fora dos tokens. O painel (`bg-popover`, branco) confere com o desenho.
