---
kind: phase
name: phase-06-social-interactions
status: dirty
issue_count: 12
sources_mtime:
  docs/phases/phase-06-social-interactions/context.md: "2026-10-03T21:06:23-03:00"
  docs/decisions/technical-decisions-social-interactions.md: "2026-10-01T21:50:20-03:00"
  docs/decisions/technical-decisions-social-interactions-anonymous-gate.md: "2026-10-01T21:50:20-03:00"
sources_hash:
  docs/phases/phase-06-social-interactions/context.md: "c29d3f59be1a"
  docs/decisions/technical-decisions-social-interactions.md: "a1543ab14522"
  docs/decisions/technical-decisions-social-interactions-anonymous-gate.md: "b08d6f49f958"
issues:
  - id: IC-1
    status: resolved
    summary: "TD-08 tem Scope Frontend mas o UI Inventory esta diferido — TD orfa no artefato"
    resolved_by: screen-inventory-phase-06 (UI scope ativo)
  - id: IC-2
    status: resolved
    summary: "Context do TD-05 afirma que TD-06 da Fase 04 fixou offset/limit como padrao do projeto"
    resolved_by: social-interactions/TD-05
  - id: IC-3
    status: resolved
    summary: "anonymous-gate/TD-03 tem Scope Frontend com UI diferida — segundo TD orfao"
    resolved_by: screen-inventory-phase-06 (UI scope ativo)
  - id: IC-4
    status: open
    summary: "Duas linhas do join de UI citam capability da Fase 04, ausente do escopo da Fase 06"
  - id: IC-5
    status: open
    summary: "Bullet diz acesso rapido aos videos; TD-07 entrega lista de canais, videos a dois cliques"
  - id: AMB-1
    status: resolved
    summary: "Capability Interface completa de comentarios, likes e inscricoes nao e decomponivel"
    resolved_by: screen-inventory-phase-06 (superficies enumeradas)
  - id: AMB-2
    status: resolved
    summary: "TD-05 exige limite por raiz e paginacao de raizes sem fixar nenhum numero"
    resolved_by: social-interactions/TD-05
  - id: MD-1
    status: resolved
    summary: "Nenhum TD decide a superficie anonima x autenticada das interacoes na pagina publica"
    resolved_by: social-interactions-anonymous-gate/TD-01
  - id: MD-2
    status: open
    summary: "Decisao de contract-sync existe mas esta como Scope Frontend; gate #29 dispara"
  - id: MD-3
    status: open
    summary: "Nenhum TD decide o orcamento de throttle dos endpoints de escrita social"
  - id: DG-1
    status: resolved
    summary: "Nenhum ponto de entrada de navegacao para a area de canais seguidos"
    resolved_by: social-interactions/TD-07
  - id: OQ-1
    status: resolved
    summary: "TD-01 pending — modelagem das reacoes (like/dislike em videos e comentarios)"
    resolved_by: social-interactions/TD-01
  - id: OQ-2
    status: resolved
    summary: "TD-02 pending — mecanismo de manutencao dos contadores desnormalizados"
    resolved_by: social-interactions/TD-02
  - id: OQ-3
    status: resolved
    summary: "TD-03 pending — superficie publica do dislike"
    resolved_by: social-interactions/TD-03
  - id: OQ-4
    status: resolved
    summary: "TD-04 pending — profundidade e armazenamento dos comentarios aninhados"
    resolved_by: social-interactions/TD-04
  - id: OQ-5
    status: resolved
    summary: "TD-05 pending — ordenacao e carregamento das respostas"
    resolved_by: social-interactions/TD-05
  - id: OQ-6
    status: resolved
    summary: "TD-06 pending — modelagem da inscricao e origem da contagem de inscritos"
    resolved_by: social-interactions/TD-06
  - id: OQ-7
    status: resolved
    summary: "TD-07 pending — o que e a area de canais seguidos"
    resolved_by: social-interactions/TD-07
  - id: OQ-8
    status: resolved
    summary: "TD-08 pending — feedback da interacao na interface"
    resolved_by: social-interactions/TD-08
  - id: OQ-9
    status: resolved
    summary: "anonymous-gate/TD-01 pending — o que o anonimo ve e o que acontece ao agir"
    resolved_by: social-interactions-anonymous-gate/TD-01
  - id: OQ-10
    status: resolved
    summary: "anonymous-gate/TD-02 pending — como o estado pessoal do visitante chega a pagina"
    resolved_by: social-interactions-anonymous-gate/TD-02
  - id: OQ-11
    status: resolved
    summary: "anonymous-gate/TD-03 pending — retorno ao ponto de interacao depois do login"
    resolved_by: social-interactions-anonymous-gate/TD-03
  - id: OQ-12
    status: open
    summary: "Compositor de resposta nao existe no desenho; publicar resposta sem componente"
  - id: OQ-13
    status: open
    summary: "Quatro estados sem desenho na watch page (vazio, erro, em transito, Inscrito)"
  - id: OQ-14
    status: open
    summary: "Estado vazio da area de canais seguidos nao foi desenhado"
  - id: OQ-15
    status: open
    summary: "Variante anonima dos controles novos nao foi desenhada na watch page"
  - id: OQ-16
    status: open
    summary: "Contagem de inscritos tem duas formas de render entre as duas telas"
  - id: OQ-17
    status: open
    summary: "75:62 sem harvest completo; duas linhas do inventario sem node id"
  - id: OQ-18
    status: open
    summary: "Tres nos de comentario colhidos no maxDepth 6; sub-estrutura sem node id"
  - id: OQ-19
    status: open
    summary: "/channel/subscriptions nao existe no repo e a tela altera a site-navbar"
advisories: []
---

# phase-06-social-interactions — Validation

## Findings

### Inconsistencies

- **IC-4** — Duas linhas de `## UI Inventory → UI ↔ Capability Join`, ambas na tela `Página pública do canal` (`/@{nickname}`), têm a coluna Capability preenchida com `— (coberta na Fase 04: "Página pública do canal com informações e listagem de vídeos")`. Essa string não é nenhuma das oito bullets de `## Capability Coverage`. São os dois verbos pré-existentes da tela — exibir as informações do canal e listar seus vídeos —, que a Fase 06 não entrega: ela apenas **estende** a tela com inscrição e contagem. O inventário marcou as linhas de propósito para que a reconciliação não as confundisse com cobertura da Fase 06, e isso foi correto; o problema é a jusante. A matriz de rastreabilidade do `/plan-build` faz join pela capability, então essas duas linhas ou são descartadas em silêncio ou produzem linha malformada. Explicit choice: (a) remover os dois verbos do inventário via extension run do `/screen-inventory`, já que pertencem ao inventário da Fase 04 e não a este; (b) manter e ensinar o `/plan-build` a tratar o marcador `—` como "coberto em fase anterior, não rastrear aqui" — mudança de skill, não de artefato; (c) acrescentar a bullet da Fase 04 ao escopo da Fase 06 no `project-plan.md`, o que seria falso: a fase não reentrega aquela capability.
- **IC-5** — A bullet `"Área de canais seguidos com acesso rápido aos vídeos"` promete acesso **aos vídeos**, e o `social-interactions/TD-07` decidiu (opção A) uma **lista de canais com link para a página pública de cada um** — os vídeos ficam a dois cliques, não a um. O próprio `**Recommendation:**` do TD-07 antecipa o risco por escrito: _"Esta é a recomendação com maior chance de estar errada por leitura de escopo — se 'acesso rápido aos vídeos' significa feed para você, a Option B é defensável"_. O inventário levantou a divergência e delegou o julgamento a este estágio; promovida aqui de open question a inconsistência, porque exige escolha explícita entre dois artefatos e não apenas registro. Explicit choice: (a) reescrever a bullet no `project-plan.md` para refletir o que o TD-07 entrega (lista de canais seguidos com acesso à página de cada um) e rerodar `/plan-context`; (b) supersede do TD-07 para a opção B (feed de vídeos dos canais seguidos), assumindo que isso antecipa a infraestrutura de listagem que a Fase 07 construiria; (c) manter ambos e registrar por escrito no `**Decision:**` do TD-07 que "acesso rápido" é satisfeito pelo link de canal — mesma letra, revisão de prosa.

### Ambiguities

_None._

### Missing Decisions

- **MD-2** — O gate de contract-sync (Decisão #29) dispara, mas **a decisão existe** — o que falta é o rótulo de `Scope` que a torna visível às duas camadas. Os cinco TDs de `next-frontend-openapi-typing` decidem tooling de codegen, sourcing do spec sob bind-mount, política de commit do output, compartilhamento de tipos BFF↔componentes e tipagem dos handlers de MSW; todos estão em `## Inherited Decisions Detail` e todos estão marcados **`Scope: Frontend`** (verificado no doc de origem, não inferido). O gate exige `Cross-layer` ou `Repo-wide`, e com razão: a geração do spec é do backend (`openapi-docs-nestjs`), o consumo é do frontend, e um TD rotulado Frontend é filtrado das subseções voltadas a backend do artefato final. Esta fase acrescenta três grupos de rotas novas — reações, comentários, inscrições — que precisam atravessar essa cadeia. **Não escrever "nenhum TD decide contract-sync": seria falso.** Há precedente direto no repo para a correção: `video-channel-management/TD-08` foi reclassificado de Frontend para Cross-layer em 2026-07-31 por exatamente este motivo, e a entrada de `**Revisions:**` registra o rationale. Explicit choice: (a) reclassificar `next-frontend-openapi-typing/TD-04` (compartilhamento de tipos — o mais cross-layer dos cinco) para `Scope: Cross-layer` via `/decide`, seguindo o precedente do TD-08; (b) reclassificar os cinco; (c) criar um TD novo de escopo `Repo-wide` que declare a cadeia de contrato ponta a ponta e referencie os cinco existentes; (d) registrar que a cadeia é conhecida e aceita como Frontend-only, assumindo por escrito que as subseções de backend do `/plan-build` não a verão.
- **MD-3** — Nenhum TD decide o orçamento de rate limit das rotas de **escrita** que esta fase cria: criar comentário, reagir a vídeo, reagir a comentário, inscrever-se. Verificado no disco, não suposto: `nestjs-project/src/auth/auth.module.ts:29` registra `ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])` e a linha 35 provê `ThrottlerGuard` como `APP_GUARD`, isto é, **global** — as rotas novas herdam 10 requisições por 60 s sem ninguém ter decidido isso para elas. O projeto já tratou esse tipo de escolha como digna de TD: `video-watch-page/TD-05` decidiu `@Throttle({ limit: 30, ttl: 60000 })` dedicado para a rota de contagem de visualização (hoje em `videos.controller.ts:224`), justamente porque o orçamento de navegação não é o de autenticação. Criação de comentário é o alvo clássico de spam e tem perfil diferente dos dois. Explicit choice: (a) rodar `/research social-interactions` para acrescentar um TD que fixe o orçamento das rotas sociais de escrita; (b) decidir por argumento no `/plan-resolve` que o default global de 10/60 s basta e registrar isso por escrito, de modo que a próxima leitura não reabra a pergunta.

### Dependency Gaps

_None._ _(Os pré-requisitos das oito capabilities estão entregues: autenticação na Fase 02, vídeos nas Fases 03/04, a página de visualização na Fase 05, e os contadores `likes_count`/`comments_count` em `videos` desde a Fase 04 — hoje em zero, e é esta fase que passa a incrementá-los, conforme `video-channel-management/TD-05`. O `subscribers_count` é coluna nova e pertence ao `TD-06` desta fase, não a uma fase anterior. O link de navegação exigido pelo `TD-07` modifica a `SiteNavbar` entregue na Fase 04, que existe — modificar entregável anterior não é lacuna de dependência.)_

### Inherited Constraint Conflicts

_None._ _(Quatro pares verificados em particular. `TD-02` e `TD-06` contra `video-channel-management/TD-05`, que exige incremento "na mesma transação do evento que o origina" — as duas decisões cumprem textualmente. `TD-05` contra `video-channel-management/TD-06`, cuja auto-limitação a "apenas as listagens desta fase" já está registrada por escrito no `**Decision:**` do TD-05. `anonymous-gate/TD-02` contra `phase-02-auth-frontend/TD-06`, que rejeitou flicker de primeira pintura no chrome autenticado — o `**Recommendation:**` do TD-02 cita a rejeição e escolhe a opção que a respeita. `TD-08` (`useOptimistic`) contra `phase-02-auth-frontend/TD-05`, que fixou Route Handler + `fetch` como caminho de mutação — `useOptimistic` é primitiva de feedback de UI e não substitui o caminho de mutação; convivem.)_

### Unresolved Open Questions

Nenhum TD está `pending` — os 11 têm `**Decision:**` concreto. As entradas abaixo vêm de `### Open Questions from Inventory`, ingeridas do digest em `context.md` sem ler o arquivo de inventário.

- **OQ-12** — O compositor de resposta não existe no desenho. O controle "Responder" aparece na raiz e em cada resposta, mas nenhuma frame desenha o campo aberto; decidido que o `ReplyButton` é Local-interactive e que um `ReplyForm` à parte publica, mas esse componente não está em frame nenhum e por isso não foi inventariado. A capability "Respostas a comentários (comentários aninhados)" fica coberta só pelo lado de leitura. Resolution: resolver via `/plan-resolve social-interactions`, que apresentará AskUserQuestion — desenhar o estado e rodar extension run, ou decidir por argumento que o `ReplyForm` é o `NewCommentForm` reusado com `parent_id`.
- **OQ-13** — Quatro estados sem desenho na watch page: lista de comentários vazia, erro de envio, comentário em trânsito (o estado pendente do `useOptimistic` do `TD-08`) e o `SubscribeButton` no estado "Inscrito" — o botão só existe como "Inscrever-se" nas duas telas onde aparece. Resolution: resolver via `/plan-resolve social-interactions`.
- **OQ-14** — Estado vazio da área de canais seguidos não desenhado. A frame mostra só o estado povoado com 3 canais; não há desenho para "o usuário não segue nenhum canal", nem para carregamento ou erro da lista. Resolution: resolver via `/plan-resolve social-interactions`.
- **OQ-15** — A variante anônima dos controles novos não foi desenhada. O `anonymous-gate/TD-01` decidiu que os controles de ação renderizam para o anônimo e o clique leva ao login; a `59:2` mostra isso para o `SubscribeButton`, mas a watch page da Fase 06 é só o estado autenticado. Como `LikeButton`, `DislikeButton`, `NewCommentForm` e os controles de comentário aparecem para o visitante anônimo terá de ser derivado por argumento, não observado. Resolution: resolver via `/plan-resolve social-interactions`.
- **OQ-16** — A contagem de inscritos tem duas formas de render entre telas: arquivo próprio na watch page (`components/channels/subscriber-count.tsx (new)`, porque precisa acompanhar o valor otimista do `SubscribeButton`) e texto corrido dentro de `ChannelMeta` na página de canal. O mesmo número, dois tratamentos. Resolution: resolver via `/plan-resolve social-interactions` — se a página de canal passar a usar o mesmo componente, a linha de `ChannelMeta` muda de forma 3 para forma 2 no inventário.
- **OQ-17** — `75:62` não tem harvest completo. O frame foi criado por script e a colheita truncou antes de terminar o nó, então o cache traz `known_child_ids` parcial em vez de árvore; duas linhas do inventário (`Avatar` dentro de `channel-row`, `SubscriptionToggleButton`) estão sem node id, e o `/implement` precisa de id para mirar o `figma-implement-design`. Resolution: resolver via `/plan-resolve social-interactions` — resolve junto com OQ-18 numa colheita só.
- **OQ-18** — Três nós da watch page ficaram no limite de profundidade. `comment-root` (`77:137`, `77:176`) e `reply-list` (`77:149`) foram colhidos a `maxDepth` 6 e vieram sem filhos; toda a sub-estrutura de comentário foi lida do screenshot e está sem node id. Mesma consequência para o `/implement`. Resolution: resolver via `/plan-resolve social-interactions` — uma colheita com `maxDepth` maior cobrindo esses três nós e o `75:62` da OQ-17 fecha as duas de uma vez.
- **OQ-19** — `/channel/subscriptions` ainda não existe no repositório; as irmãs do grupo autenticado (`/channel/videos`, `/channel/settings`) vivem em `next-frontend/app/(studio)/`, que é onde esta rota deve nascer. A implementação desta tela também **altera** `components/layout/site-navbar.tsx`, porque o ponto de entrada de navegação exigido pelo `TD-07` é um `<Link>` inline ali. Resolution: resolver via `/plan-resolve social-interactions` — é mais nota de escopo para o `/plan-build` do que pergunta aberta, mas a alteração de um componente entregue em fase anterior merece ficar explícita antes do build.

_A nona entrada do inventário — a divergência entre a bullet "acesso rápido aos vídeos" e o que o `TD-07` entrega — foi **promovida a `IC-5`** em vez de ingerida como OQ. O inventário delegou explicitamente o julgamento a este estágio, e a divergência exige escolha entre dois artefatos, não apenas registro._

### UI Coverage Gaps

_None._ _(Primeira rodada em que o Check 7 tem o que examinar: o `## UI Inventory` está populado com 3 telas e 16 linhas de junção. As oito capabilities da fase têm ≥1 verbo cobrindo — likes e dislikes de vídeo por `LikeButton`/`DislikeButton`, comentários por `NewCommentForm`, respostas por `RepliesLoadMore`, reações a comentários por `CommentLikeButton`/`CommentDislikeButton`, inscrição por `SubscribeButton` e `SubscriptionToggleButton`, a área de canais por `channel-list`, a contagem por `ChannelHeader`, e a interface completa por `CommentsSection`/`CommentsLoadMore`. A cobertura parcial de "Respostas a comentários" — só o lado de leitura — **não** dispara UIG-N, porque a condição do check é ausência de verbo e o verbo existe; a lacuna de publicação está em `OQ-12`, que é onde ela pertence.)_

## Resolved Issues

- **IC-1** _(resolved_by screen-inventory-phase-06)_ — `social-interactions/TD-08` tem `Scope: Frontend` e o `## UI Inventory` estava diferido, o que tornaria o TD órfão no artefato final. O inventário da Fase 06 foi criado e validado, o escopo de UI está ativo, e a checagem de órfão não dispara mais para `Scope: Frontend` quando há inventário populado.
- **IC-2** _(resolved_by social-interactions/TD-05)_ — O `**Context:**` do TD-05 afirmava que `video-channel-management/TD-06` fixou offset/limit como padrão do projeto, contra o texto do próprio TD-06. O `**Decision:**` do TD-05 registra por escrito que a paginação é decisão desta fase, não herança, com o trade-off de concorrência assumido.
- **IC-3** _(resolved_by screen-inventory-phase-06)_ — `social-interactions-anonymous-gate/TD-03` caía na mesma condição de órfão da IC-1; fechada pela mesma ativação do escopo de UI.
- **AMB-1** _(resolved_by screen-inventory-phase-06)_ — A capability "Interface completa de comentários, likes e inscrições" não tinha fluxos nem telas listados. O inventário enumerou as superfícies: caixa de novo comentário, lista paginada de raízes, respostas pré-carregadas, controles de reação em vídeo e em comentário, e os dois pontos onde vive o botão de inscrever.
- **AMB-2** _(resolved_by social-interactions/TD-05)_ — Fixado no `**Decision:**` do TD-05: 10 comentários-raiz por página e até 3 respostas pré-carregadas por raiz, com "ver mais" dentro da thread acima disso.
- **MD-1** _(resolved_by social-interactions-anonymous-gate/TD-01)_ — Nenhum TD decidia a superfície anônima versus autenticada das interações na página pública. Fechada pelo `/research` que criou o doc ad-hoc `technical-decisions-social-interactions-anonymous-gate.md`.
- **DG-1** _(resolved_by social-interactions/TD-07)_ — A área de canais seguidos não tinha ponto de entrada de navegação. O `**Decision:**` do TD-07 inclui o link no chrome autenticado entregue na Fase 04.
- **OQ-1** _(resolved_by social-interactions/TD-01)_ — Decidido **A**: duas tabelas dedicadas (`video_reactions` e `comment_reactions`), cada uma com FK real.
- **OQ-2** _(resolved_by social-interactions/TD-02)_ — Decidido **A**: delta calculado no serviço, dentro da mesma transação do evento que o origina.
- **OQ-3** _(resolved_by social-interactions/TD-03)_ — Decidido **A**: expor só o estado do próprio usuário; sem coluna `dislikes_count` e sem contagem de dislikes na API.
- **OQ-4** _(resolved_by social-interactions/TD-04)_ — Decidido **A**: profundidade 1, `parent_id` nulável.
- **OQ-5** _(resolved_by social-interactions/TD-05)_ — Decidido **B**: mais recentes primeiro, respostas pré-carregadas junto da página de raízes.
- **OQ-6** _(resolved_by social-interactions/TD-06)_ — Decidido **B**: `subscribers_count` desnormalizado em `channels`.
- **OQ-7** _(resolved_by social-interactions/TD-07)_ — Decidido **A**: lista de canais seguidos com link para a página pública de cada um.
- **OQ-8** _(resolved_by social-interactions/TD-08)_ — Decidido **A**: `useOptimistic` do React 19.
- **OQ-9** _(resolved_by social-interactions-anonymous-gate/TD-01)_ — Decidido **A**: leitura pública; os controles de ação renderizam para o anônimo e o clique leva ao login.
- **OQ-10** _(resolved_by social-interactions-anonymous-gate/TD-02)_ — Decidido **A**: endpoint público com auth opcional, um payload só.
- **OQ-11** _(resolved_by social-interactions-anonymous-gate/TD-03)_ — Decidido **A**: `returnTo` na query de `/login`, validado pelo mesmo `safeReturnTo` da rota de refresh.
