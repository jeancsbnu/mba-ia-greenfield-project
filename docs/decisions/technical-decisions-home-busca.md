---
scope_type: phase
related_phases: [7]
status: pending
date: 2026-10-06
scope_description: "Fatia home-busca da Fase 07: grid de vídeos da página inicial, filtro por categoria, busca por título e canal, header/navbar completo, paginação das listagens globais e layout responsivo"
covers_capabilities:
  - "Página inicial com grid de vídeos (thumbnail, título, canal, visualizações e tempo de publicação)"
  - "Filtro de vídeos por categoria na home"
  - "Barra de busca (pesquisa por título e canal)"
  - "Header/navbar com logo, barra de busca, botão de login/avatar e navegação"
  - "Paginação ou scroll infinito nas listagens de vídeos"
  - "Layout responsivo para dispositivos móveis"
depends_on_slices: []
---

# Technical Decisions — Fase 07, fatia home-busca

_Subprojects in scope:_

- `nestjs-project/` — ganha a primeira listagem **global** de vídeos (hoje toda listagem é escopada por canal ou por vídeo de referência), a busca textual e a política de rate limit dessas rotas públicas. Coberto por TD-01, TD-02, TD-03, TD-04, TD-05 e TD-09.
- `next-frontend/` — substitui o placeholder do `create-next-app` em `app/page.tsx` pela home, cria a página de resultados, completa a navbar (busca + navegação) e torna o layout responsivo. Coberto por TD-01, TD-02, TD-03, TD-05, TD-06, TD-07, TD-08 e TD-09.

**Fora desta fatia:** as bullets "Testes dos fluxos principais da plataforma" e "Ambiente de produção e deploy" da Fase 07 ficam para uma fatia irmã. Nenhum TD abaixo cita essas bullets.

**Decisões herdadas que restringem esta fatia** (não reabrir):

- `video-channel-management/TD-01` e `TD-10`: categoria é enum Postgres com oito valores, e **os valores do enum são os próprios rótulos pt-BR acentuados** (`Música`, `Educação`, `Notícias`…). O frontend lê a lista do `openapi.json` e não tem mapa de rótulos.
- `video-channel-management/TD-02`: um vídeo só é "listável" se estiver publicado (`published_at IS NOT NULL`) **e** público. `unlisted` nunca aparece em listagem, e isso inclui a home e a busca.
- `video-channel-management/TD-06`: offset/limit vincula **apenas** as listagens da Fase 04. O próprio TD diz que o cursor "permanece a escolha certa para o feed global da home". A paginação da home é, portanto, decisão **desta** fatia (TD-02).
- `video-watch-page/TD-04`: as sugestões ficam em "mesma categoria, `published_at` desc", com offset/limit e "ver mais".
- `social-interactions/TD-07`: a área de canais seguidos é uma lista de canais, não um feed. O link "Canais seguidos" já está inline em `components/layout/site-navbar.tsx`, que o inventário da Fase 06 descreve como "navbar completo (busca, variante rica) é escopo da Fase 07".
- `next-frontend-config-base/TD-03`: BFF estrito. Toda chamada ao Nest sai do servidor Next com `API_URL` server-only.
- `phase-02-auth-frontend/TD-06`: a sessão é renderizada no servidor e chega aos Client Components por Context. A navbar decide entre "Entrar" e avatar por aí (`public-site-navbar.tsx` → `getViewerChannel()`).
- `next-frontend-openapi-typing/TD-01` e `TD-04`: o contrato é tipado a partir do `openapi.json`.

**Estado atual relevante** (lido no disco em 2026-10-06):

- **Backend:**
  - Não há endpoint de feed, de busca, nem parâmetro `category` em listagem.
  - Não há extensão (`pg_trgm`, `unaccent`) nem índice GIN.
  - Os índices de `videos` são `(channel_id, published_at)`, `channel_id` e `status`. Não há índice em `published_at` sozinho, em `category` nem em `views_count`.
  - O item mais próximo de um card de home é `SuggestedVideoListItem`, que já traz `channel: {nickname, name}`.
- **Frontend:**
  - `VideoCard` não tem linha de canal nem variantes de tamanho (`sizes="233px"` fixo).
  - Há dois padrões de paginação, ambos offset:
    - numerada via RSC + `?page=` (página do canal, `lib/pagination.ts`, `components/ui/pagination.tsx`);
    - "carregar mais" via `fetch` do cliente ao BFF (`sidebar-load-more.tsx`, comentários).
  - TanStack Query e SWR **não** estão instalados.
  - A navbar é renderizada por página (o root layout não tem navbar), usa `px-12` fixo e não tem nenhuma variante responsiva nem drawer/sheet.
- **Figma:** o arquivo **não tem frame algum de home, de resultados de busca nem de mobile**. Só existem as telas das Fases 04–06, todas desktop.
- **Rate limit:** há um `ThrottlerGuard` global (`APP_GUARD`) com **10 req/60 s em toda rota** (`auth.module.ts:29,35`), sem `trust proxy` e sem repasse de IP pelo BFF. Ver TD-09.

> **Nota de método.** O MCP **context7 não está disponível nesta sessão**: a busca por ferramentas não o encontrou, como já tinha acontecido nas pesquisas das Fases 04 e 05. As APIs foram verificadas nestas fontes primárias:
> - os docs do Next.js embarcados na versão instalada (`next-frontend/node_modules/next/dist/docs/`, Next 16.2.6: `next/form`, `useSearchParams`, `preserving-ui-state`);
> - a documentação oficial do PostgreSQL 17, que é a versão da imagem em `nestjs-project/compose.yaml`: `pg_trgm` e `unaccent` são extensões *trusted* e o GIN trigram atende `LIKE`/`ILIKE`;
> - os manifests instalados dos dois subprojetos.
>
> O MCP do Postgres recusou autenticação, então a disponibilidade das extensões no banco rodando **não** foi conferida ao vivo. A imagem oficial `postgres:17` traz o `contrib`.

---

## TD-01: Superfície de rotas e contrato da listagem global (home, categoria e busca)

**Scope:** Cross-layer

**Capability:** Transversal — covers: `Página inicial com grid de vídeos (thumbnail, título, canal, visualizações e tempo de publicação)`; `Filtro de vídeos por categoria na home`; `Barra de busca (pesquisa por título e canal)`

**Context:** Três capabilities consomem uma listagem global de vídeos que hoje não existe. A regra "listável" (publicado e público) está escrita duas vezes no `VideosService`, em `listPublicByChannel` e `listSuggestions`, e esta fatia acrescentaria uma terceira e uma quarta cópia. A decisão fixa três coisas:
- quantos endpoints existem no Nest;
- qual URL do frontend guarda o estado (termo, categoria, página);
- se categoria e busca se combinam.

As duas pontas ficam presas ao formato escolhido: query DTO, `openapi.json`, rota BFF e `searchParams` da página.

**Options:**

### Option A: Dois endpoints e duas rotas independentes
- `GET /videos?category=` alimenta a home `/`, e `GET /videos/search?q=` alimenta `/results`. Busca e categoria não se combinam.
- **Pros:** cada endpoint tem uma ordenação só e um query DTO pequeno; nenhuma ramificação no serviço.
- **Cons:** a regra "listável" e o join de canal se duplicam de novo; filtrar resultados de busca por categoria passa a exigir um terceiro caminho.

### Option B: Um endpoint com filtros opcionais e duas rotas no frontend
- `GET /videos?q=&category=&…` é a listagem global, com `q` e `category` opcionais e combináveis. O frontend tem a home em `/` (`?category=`) e os resultados em `/results` (`?q=&category=`), e as duas páginas chamam o mesmo endpoint.
- **Pros:** um só lugar para a regra "listável" e para o shape do item; a combinação categoria + busca sai de graça; páginas distintas no front dão título, metadata e estado vazio próprios para "resultados de X".
- **Cons:** o serviço ramifica a ordenação conforme haja `q` ou não (ver TD-03 e TD-04); o DTO cresce.

### Option C: Uma rota só, com todo o estado na query
- `/` atende a home e a busca (`/?q=&category=&page=`) e "vira" resultados quando há `q`, apoiada no mesmo endpoint da Option B.
- **Pros:** um único `page.tsx`; a navbar sempre navega para `/`.
- **Cons:** a home passa a ter dois modos, com metadata, estado vazio e heading diferentes, e isso fica como condicional dentro de uma página; o link "Início" precisa limpar `q` explicitamente; o histórico do navegador mistura home e busca.

**Recommendation:** Option B. Consolida a regra "listável" num ponto só, que é o que o princípio de Single Responsibility do projeto pede (a regra já está duplicada antes desta fase), e mantém a busca como página própria, o destino natural de uma barra presente em todas as telas. A categoria vai na URL **com o valor do enum como está** (`?category=Música`, percent-encoded pelo navegador). Criar um mapa de slugs só para a URL seria a primeira tabela de categorias fora do `openapi.json` e contrariaria o `video-channel-management/TD-01`, cuja vantagem era justamente não ter mapa. O item da listagem reutiliza o shape de `SuggestedVideoListItem`, que já carrega o canal.

**Decision:** _[pending]_

---

## TD-02: Paginação da home e da busca (contrato e padrão de interface)

**Scope:** Cross-layer

**Capability:** Paginação ou scroll infinito nas listagens de vídeos

**Context:** A bullet aceita os dois mecanismos. O `video-channel-management/TD-06` não vincula esta listagem e sugeriu cursor para a home. O código, porém, já tem dois padrões offset prontos e testados: o numerado via RSC na página do canal e o "carregar mais" via cliente na sidebar e nos comentários. O contrato (offset ou cursor) e o padrão de UI (páginas, botão ou scroll) andam juntos: decidir um sem o outro produz par incompatível. Por isso é um TD só. Depende de TD-01 (endpoint) e de TD-03/TD-04 (ordenação).

**Options:**

### Option A: Offset/limit com paginação numerada na URL (`?page=N`)
- A página é RSC, lê `searchParams` e chama o upstream no servidor, exatamente como `app/channels/[nickname]/page.tsx`. Reusa `lib/pagination.ts` e `components/ui/pagination.tsx`.
- **Pros:** zero padrão novo; a URL endereça o estado (voltar, compartilhar, recarregar e E2E determinístico); funciona com qualquer ordenação, inclusive por relevância; nenhum JS de cliente para listar.
- **Cons:** é a experiência menos "feed" das três; sob publicação concorrente um item pode repetir ou sumir na fronteira entre páginas; `COUNT` total a cada página.

### Option B: Offset/limit com "Carregar mais"
- A primeira página vem do RSC; as seguintes chegam por `fetch` do cliente a uma rota BFF e são anexadas com `useState`, no padrão de `sidebar-load-more.tsx`.
- **Pros:** sensação de feed contínuo; reusa um padrão existente; continua offset, compatível com relevância.
- **Cons:** o estado anexado vive só na memória: voltar da página do vídeo perde a posição e os itens carregados; duplicatas sob inserção concorrente exigem deduplicar por `publicId`; não é endereçável por URL.

### Option C: Cursor keyset (`published_at`, `id`) com scroll infinito
- Cursor opaco e sentinela com `IntersectionObserver` que dispara o próximo `fetch` ao BFF.
- **Pros:** estável sob inserção; custo constante por página com índice composto; é o comportamento de referência de uma plataforma de vídeo.
- **Cons:** terceiro formato de paginação no projeto; não serve para a busca ordenada por relevância sem um cursor sobre `(score, id)`; scroll infinito esconde o rodapé e é ruim para teclado e leitor de tela; perde a posição ao voltar; não há biblioteca de data fetching instalada para cuidar disso.

**Recommendation:** Option A. É o único par que serve igualmente à home e à busca, sem um segundo mecanismo, e não acrescenta nenhum padrão novo ao frontend. A perda é a sensação de feed. A instabilidade sob concorrência, que motivou a sugestão de cursor no `video-channel-management/TD-06`, só aparece na fronteira de página, num catálogo que ainda não tem volume para que isso seja frequente. O tamanho de página deve ser múltiplo comum das colunas da grade do TD-08 (12 divide 1, 2, 3 e 4 colunas); o valor exato fica para o resolve. Se a decisão for a Option C, ela obriga a busca a ordenar por recência (TD-04).

**Decision:** _[pending]_

---

## TD-03: Ordenação da home

**Scope:** Cross-layer

**Capability:** Página inicial com grid de vídeos (thumbnail, título, canal, visualizações e tempo de publicação)

**Context:** A grade precisa de uma ordem, e é a ordem que decide qual índice a listagem global exige: hoje não há índice útil para uma consulta sem `channel_id`. As sugestões (`video-watch-page/TD-04`) usam recência. Uma ordem por popularidade depende de `views_count`, que só passou a ser incrementado na Fase 05. Se a home expuser mais de uma ordem, o parâmetro e o controle de UI viram contrato, e por isso o Scope é Cross-layer.

**Options:**

### Option A: Mais recentes primeiro (`published_at` desc)
- A mesma ordenação das sugestões, desempatada por `id`.
- **Pros:** determinística, portanto testável sem semente; um índice parcial `published_at` desc sobre os vídeos listáveis cobre home e filtro por categoria; coerente com o resto da plataforma.
- **Cons:** conteúdo bom mas antigo some da primeira página; nenhum sinal de qualidade.

### Option B: Mais vistos primeiro (`views_count` desc)
- Ordena pelo contador desnormalizado, com desempate por `published_at`.
- **Pros:** a primeira página mostra o que já provou interesse.
- **Cons:** "rico fica mais rico" sem janela de tempo, porque não há histórico de visualizações por período, só o total acumulado; um vídeo novo quase nunca chega à primeira página; a ordem muda a cada view, o que agrava a instabilidade do offset (TD-02).

### Option C: As duas, com alternância "Recentes | Populares" (`?sort=`)
- O endpoint aceita `sort` e a home mostra o controle.
- **Pros:** o usuário escolhe; cobre os dois usos.
- **Cons:** dois índices, um parâmetro de contrato a mais e um controle de UI sem desenho no Figma; a Option B continua com os mesmos defeitos, só que opcional.

**Recommendation:** Option A. Reproduz a escolha do `video-watch-page/TD-04` pelo mesmo motivo: determinismo vale mais que variedade enquanto `views_count` não tiver histórico. Uma ordem por "em alta" só fica honesta com contagem por janela de tempo, que não existe no modelo. A Option C pode entrar depois como Revision barata, acrescentando `sort` sem quebrar o contrato.

**Decision:** _[pending]_

---

## TD-04: Mecanismo de busca textual (título e canal)

**Scope:** Backend

**Capability:** Barra de busca (pesquisa por título e canal)

**Context:** O conteúdo é pt-BR, e o usuário digita sem acento e sem caixa ("musica", "educacao"). A busca cobre `videos.title` e o canal, que vive em outra tabela (`channels.name` e `channels.nickname`, este no padrão `[a-z0-9_]`). Hoje não existe extensão nem índice de texto. A escolha decide a migration, a semântica de casamento (substring ou palavra), a possibilidade de ordenar por relevância (que impacta o TD-02) e se entra infraestrutura nova no compose.

**Options:**

### Option A: `ILIKE` com `pg_trgm` e `unaccent`
- Casamento por substring sem acento e sem caixa, `unaccent(lower(col)) LIKE '%' || unaccent(lower(:q)) || '%'`, com índices GIN `gin_trgm_ops` sobre a expressão em `videos.title` e `channels.name`/`nickname`.
- **Pros:** acha trechos de palavra ("matem" acha "matemática") e nicknames com `_`; duas extensões *trusted* do PG 17, sem serviço novo; semântica previsível para títulos e nomes curtos.
- **Cons:** sem stemming nem ranking linguístico; termos com menos de 3 caracteres não geram trigramas e degradam para varredura do índice; `unaccent()` é `STABLE`, e o índice de expressão exige um wrapper `IMMUTABLE` com o dicionário qualificado por schema.

### Option B: Full-text search do Postgres (`tsvector` + `websearch_to_tsquery`)
- Coluna gerada `tsvector` com uma configuração de texto `portuguese` + `unaccent`, índice GIN e ordenação por `ts_rank`.
- **Pros:** stemming ("vídeos" acha "vídeo"), várias palavras e frases, ranking por relevância.
- **Cons:**
  - Não acha prefixo nem trecho de palavra sem tratar o último termo com `:*`.
  - O stemming faz pouco sentido para nicknames.
  - O nome do canal está em outra tabela: ou entra um segundo vetor com `OR` entre tabelas, ou ele é desnormalizado em `videos` e precisa ser reescrito a cada troca de nickname (`video-channel-management/TD-07` permite troca livre).
  - A migration precisa criar uma configuração de texto customizada.

### Option C: Motor de busca externo (ex.: Meilisearch)
- Um serviço novo no compose, indexado no publicar, no editar e no renomear o canal.
- **Pros:** tolerância a erro de digitação, relevância e prefixo prontos.
- **Cons:** container novo, sincronização eventual e um caminho de falha a mais; aumenta a superfície do deploy da fatia irmã; desproporcional para buscar em dois campos curtos.

**Recommendation:** Option A. "Título e canal" são campos curtos e nomes próprios, onde casar trecho importa mais que stemming, e o nickname `[a-z0-9_]` é literalmente uma string a casar. Os resultados são ordenados por **recência**, como a home (TD-03), e não por relevância. Isso mantém a busca compatível com qualquer escolha do TD-02, ao custo de não promover o melhor casamento ao topo. Cabe fixar no resolve um comprimento mínimo do termo, 2 ou 3 caracteres, para não cair em varredura. A Option B é o passo natural se a busca um dia incluir a descrição, que é texto corrido e se beneficia de stemming.

**Decision:** _[pending]_

---

## TD-05: Forma do resultado quando o termo casa com um canal

**Scope:** Cross-layer

**Capability:** Barra de busca (pesquisa por título e canal)

**Context:** "Pesquisa por título e canal" admite duas leituras. Na primeira, o canal é um **critério** que traz vídeos daquele canal. Na segunda, o canal é um **tipo de resultado** que leva à página do canal. A escolha define o shape da resposta, ou seja, se a lista é única ou tem seções, quais componentes a página de resultados tem e quantas consultas a busca faz.

**Options:**

### Option A: Só vídeos
- O termo casa com o título **ou** com o nome/nickname do canal, e a resposta é uma lista paginada de vídeos, no mesmo shape da home.
- **Pros:** um card, uma lista, uma paginação, o mesmo endpoint do TD-01; nenhum componente novo.
- **Cons:** quem procura um canal não acha um atalho para a página dele, só os vídeos dele misturados aos demais resultados.

### Option B: Bloco de canais no topo, seguido dos vídeos
- Na primeira página, até N canais correspondentes, com link para `/@{nickname}`; abaixo, a lista paginada de vídeos.
- **Pros:** dá descoberta de canais; pode reaproveitar o item visual de `subscribed-channel-list.tsx` (Fase 06), que já é uma lista de canais com link.
- **Cons:** duas consultas e uma resposta com seções; o bloco só existe na página 1; um elemento sem desenho no Figma.

### Option C: Abas "Vídeos | Canais"
- Duas listas paginadas independentes, selecionadas por `?type=`.
- **Pros:** separação limpa; cada lista com a sua paginação.
- **Cons:** o máximo de superfície das três (parâmetro de contrato, controle de aba, duas paginações) para um catálogo que ainda é pequeno.

**Recommendation:** Option A. Atende a bullet literalmente com a menor superfície e mantém a busca como um modo da mesma listagem do TD-01. **É a recomendação com maior chance de estar errada por leitura de escopo:** se "pesquisar por canal" significa "encontrar o canal", a Option B é defensável e barata, porque o componente de lista de canais já existe.

**Decision:** _[pending]_

---

## TD-06: Modelo de interação da barra de busca

**Scope:** Frontend

**Capability:** Transversal — covers: `Barra de busca (pesquisa por título e canal)`; `Header/navbar com logo, barra de busca, botão de login/avatar e navegação`

**Context:** A barra fica na navbar e, portanto, em todas as telas, inclusive fora de `/results`. A decisão define quando a busca dispara (envio ou digitação), quantas requisições por busca chegam ao Nest, o que interage com o TD-09, e quanto da navbar vira Client Component. Hoje a `SiteNavbar` só é cliente por causa do `usePathname`.

**Options:**

### Option A: Envio explícito via `next/form`
- `<Form action="/results">` com `<input name="q">`; o envio navega no cliente para `/results?q=…`, que renderiza no servidor.
- **Pros:** uma requisição por busca; funciona sem JS (progressive enhancement); é o caso de uso documentado do `next/form` no Next 16.2.6; o estado fica na URL.
- **Cons:** sem resultado enquanto digita; para o input aparecer preenchido em `/results`, a navbar precisa ler `q` (`useSearchParams` sob `<Suspense>`, ou o valor passado pela página).

### Option B: Busca ao digitar com debounce
- `onChange` com debounce de cerca de 300 ms faz `router.replace('/results?q=…')`.
- **Pros:** resposta imediata; padrão comum em tutoriais do App Router.
- **Cons:** várias requisições por busca, que consomem o orçamento do TD-09; fora de `/results`, a primeira tecla causa uma navegação de página; histórico e foco ficam mais difíceis de acertar; exige `"use client"` e `<Suspense>`.

### Option C: Autocomplete com sugestões e envio
- Dropdown com os primeiros títulos ou canais enquanto digita; Enter leva a `/results`.
- **Pros:** é a experiência mais rica; ajuda a descobrir canais (conversa com o TD-05).
- **Cons:** endpoint de sugestões a mais, combobox acessível (padrão ARIA, navegação por teclado), cancelamento de requisição em voo; o maior custo das três para um componente sem desenho.

**Recommendation:** Option A. Uma barra presente em toda tela pede o modelo que não depende de estar numa página específica, e o `next/form` entrega navegação no cliente com prefetch sem estado próprio. Com a Option A, a navbar continua quase toda servidor: só o form e o link ativo são cliente. As Options B e C são incrementos possíveis sobre a A, sem trocar a rota nem o contrato.

**Decision:** _[pending]_

---

## TD-07: Estrutura da navegação global e comportamento do chrome no mobile

**Scope:** Frontend

**Capability:** Transversal — covers: `Header/navbar com logo, barra de busca, botão de login/avatar e navegação`; `Layout responsivo para dispositivos móveis`

**Context:** A navbar atual tem logo, um link opcional ("Canais seguidos") e o slot do usuário. Ela é renderizada **por página**, com `px-12` fixo. Esta fatia acrescenta busca e "navegação" (Início, Canais seguidos, Seu canal, Enviar vídeo) e precisa caber num celular. A estrutura escolhida afeta a largura útil de **todas** as telas existentes; a página do vídeo, por exemplo, já divide o espaço com a sidebar de 233 px. Não há componente de sheet/drawer em `components/ui`, mas `radix-ui` está instalado.

**Options:**

### Option A: Só barra superior, com menu no mobile
- Desktop: logo | busca | links + Entrar/avatar. Mobile: a busca vira um ícone que expande o input sobre a própria barra, e os links vão para um menu (sheet ou dropdown do avatar).
- **Pros:** não altera a largura do conteúdo de nenhuma tela existente; evolução direta da `SiteNavbar` atual; um primitivo novo só (sheet ou dropdown, via Radix).
- **Cons:** os destinos de navegação ficam a um toque no mobile; pouco espaço se a lista de links crescer.

### Option B: Barra superior com sidebar de navegação à esquerda (estilo "guia")
- Sidebar fixa em `lg`, recolhida a ícones em `md`, drawer no mobile.
- **Pros:** espaço para muitos destinos (e para as categorias, se quiserem); padrão reconhecível de plataforma de vídeo.
- **Cons:** reduz a largura de conteúdo de todas as telas, o que obriga a reavaliar a grade 4×2 do canal e o layout vídeo + sidebar da watch page; é o maior retrofit das três para 4 destinos.

### Option C: Barra superior com tab bar inferior no mobile
- No mobile, Início / Busca / Enviar / Conta numa barra fixa embaixo.
- **Pros:** alcance do polegar; destinos sempre visíveis.
- **Cons:** duas superfícies de navegação para manter em sincronia; uma barra fixa embaixo disputa espaço com os controles nativos do `<video>` (`video-watch-page/TD-01`) e com teclado virtual.

**Recommendation:** Option A. Com quatro destinos, a sidebar da Option B custa um retrofit de largura em todas as telas sem ter o que preencher, e a Option C duplica a navegação e colide com o player. A Option A é a única que muda **só** o chrome. Consequência assumida: a navbar passa a ser montada uma vez em layout, e não mais por página, para que busca e navegação não precisem ser repetidas nas telas.

**Decision:** _[pending]_

---

## TD-08: Estratégia de responsividade (origem do layout mobile e alcance do retrofit)

**Scope:** Frontend

**Capability:** Layout responsivo para dispositivos móveis

**Context:** "Layout responsivo" vale para a plataforma inteira, não só para as telas novas. Três fatos pesam aqui:
- O código quase não usa breakpoints: a grade do canal (`sm:grid-cols-2 lg:grid-cols-4`), o `lg:flex-row` da watch page e um `sm:block` na paginação.
- O Figma só tem frames desktop, e nem a home nem os resultados estão desenhados.
- A conta do Figma é Starter, com cota mensal pequena.

A decisão define de onde vem a especificação mobile que o `screen-inventory` e o `plan-build` vão consumir, e quais telas entram no escopo. `docs/design-system-pillars.md:508-511` recomenda tokens de breakpoint e container queries para componentes reusados em sidebar e em grade, que é o caso do `VideoCard`.

**Options:**

### Option A: Frames mobile no Figma para todas as telas, antes de implementar
- Desenhar a variante mobile de home, resultados e de cada tela existente (auth, canal, watch, studio, upload) e inventariá-las.
- **Pros:** cada layout mobile é observado, não argumentado; o pipeline de inventário funciona como nas outras fases.
- **Cons:** cerca de 10 telas a mais para desenhar e colher, contra uma cota que já acabou em fases anteriores; é o maior atraso das três.

### Option B: Regras responsivas escritas, com frames mobile só para o que é novo
- Um conjunto curto de regras aplicadas a todas as telas: breakpoints padrão do Tailwind 4, gutter lateral reduzido no mobile, grades que perdem colunas, sidebars que descem para baixo do conteúdo e alvos de toque mínimos.
- Frames mobile desenhados só para navbar, home e resultados.
- **Pros:** cobre a plataforma inteira com uma regra só e cabe na cota (um batch do `figma-batch` para as telas novas).
- **Cons:** o mobile das telas antigas passa a ser derivado por regra, não observado, e os critérios de aceite delas ficam argumentados.

### Option C: Responsividade só nas telas novas desta fatia
- Home, resultados e navbar responsivos; as telas existentes continuam desktop até uma task separada.
- **Pros:** o menor escopo; nenhuma tela antiga muda.
- **Cons:** não entrega a bullet como escrita; o usuário mobile navega de uma home responsiva para uma watch page quebrada.

**Recommendation:** Option B. É a única que entrega "layout responsivo" para a plataforma toda sem trocar a cota do Figma por frames de telas que, no mobile, só empilham o que já existe. O ponto em que a Option B é mais fraca, mobile argumentado e não observado, já foi aceito antes no projeto: na Fase 05, estados sem desenho foram implementados por padrão. A recomendação vem com um alerta de processo: home e resultados **também** não têm frame desktop. O `screen-inventory` desta fatia depende de desenhá-los de qualquer forma, então os frames mobile delas entram no mesmo lote.

**Decision:** _[pending]_

---

## TD-09: Rate limit das listagens públicas de alto tráfego (home e busca)

**Scope:** Cross-layer

**Capability:** Transversal — covers: `Página inicial com grid de vídeos (thumbnail, título, canal, visualizações e tempo de publicação)`; `Barra de busca (pesquisa por título e canal)`

**Context:** O `ThrottlerGuard` é global (`APP_GUARD` em `auth.module.ts:35`) com `ttl: 60000, limit: 10` (`:29`), então **toda** rota sem `@Throttle`/`@SkipThrottle` próprio fica limitada a 10 requisições por minuto por IP.

O rastreador padrão usa `req.ip`. O Nest não configura `trust proxy`, e o BFF não repassa o IP do visitante (nenhuma ocorrência de `X-Forwarded-For` em `next-frontend/lib` ou `app`). Pela leitura do código, isto é derivação e não comportamento observado, toda chamada vinda do servidor Next chega com o mesmo IP, o do container. A home e a busca herdariam, portanto, um teto **de 10 req/min para o site inteiro**. Elas são as rotas de maior tráfego da plataforma, e a busca é a única que executa um `ILIKE`.

O problema de fundo, o IP real ausente, é anterior a esta fase e afeta as rotas das Fases 02, 05 e 06. Este TD decide só o orçamento das rotas novas.

**Options:**

### Option A: Isentar home e busca do throttler (`@SkipThrottle()`)
- Ambas são leituras públicas e idempotentes. A proteção de custo fica no próprio contrato: `limit` máximo, comprimento mínimo e máximo do termo (TD-04) e paginação obrigatória.
- **Pros:** nenhuma mudança cross-layer; evita o teto global; tem precedente no `@SkipThrottle()` do `app.controller.ts`.
- **Cons:** a busca fica sem nenhum freio contra varredura; o freio real depende de algo antes do Nest (proxy/CDN), que é assunto da fatia de deploy.

### Option B: Orçamento dedicado por rota, com o rastreador atual
- `@Throttle({ default: { limit: N, ttl: 60000 } })` com N alto, no padrão de `video-watch-page/TD-05`.
- **Pros:** segue o padrão já usado; uma linha por rota.
- **Cons:** enquanto o rastreador vir o IP do BFF, N é um teto **global**: um único cliente abusivo esgota a home de todos. Protege o banco, não os usuários.

### Option C: Propagar o IP real e aplicar orçamento por visitante
- O BFF repassa `X-Forwarded-For` ao upstream, o Nest liga `trust proxy` restrito à rede do compose, e a home e a busca ganham orçamento dedicado por IP real.
- **Pros:** é o único desenho em que o limite protege o serviço sem punir usuários legítimos; conserta de quebra a premissa de `social-interactions/TD-09` e `video-watch-page/TD-05`.
- **Cons:** muda o comportamento de **todas** as rotas com throttle, o que é escopo sistêmico, não desta fatia; um `trust proxy` mal configurado permite forjar IP.

**Recommendation:** Option A nesta fatia, com a propagação do IP real (Option C) registrada como task separada. A Option B parece prudente, mas na topologia atual troca abuso por indisponibilidade geral. A Option C é a correção certa, mas o alcance é o throttler inteiro, e misturá-la aqui viola a regra de um escopo por vez. Quando ela existir, acrescentar `@Throttle` à home e à busca é uma Revision barata deste TD.

**Decision:** _[pending]_

---

## Decisions Summary

| ID | Scope | Decision | Recommendation | Choice |
|----|-------|----------|---------------|--------|
| TD-01 | Cross-layer | Superfície de rotas e contrato da listagem global | B (um endpoint com `q`/`category` opcionais; rotas `/` e `/results`) | _[pending]_ |
| TD-02 | Cross-layer | Paginação da home e da busca | A (offset/limit + paginação numerada na URL) | _[pending]_ |
| TD-03 | Cross-layer | Ordenação da home | A (mais recentes primeiro) | _[pending]_ |
| TD-04 | Backend | Mecanismo de busca textual | A (`ILIKE` + `pg_trgm` + `unaccent`, ordem por recência) | _[pending]_ |
| TD-05 | Cross-layer | Forma do resultado quando o termo casa com um canal | A (só vídeos) | _[pending]_ |
| TD-06 | Frontend | Modelo de interação da barra de busca | A (envio via `next/form`) | _[pending]_ |
| TD-07 | Frontend | Navegação global e chrome no mobile | A (só barra superior, menu no mobile) | _[pending]_ |
| TD-08 | Frontend | Estratégia de responsividade | B (regras escritas + frames mobile só do que é novo) | _[pending]_ |
| TD-09 | Cross-layer | Rate limit da home e da busca | A (`@SkipThrottle`, IP real como task separada) | _[pending]_ |
