---
kind: phase
name: phase-06-social-interactions
status: dirty
issue_count: 3
sources_mtime:
  docs/phases/phase-06-social-interactions/context.md: "2026-10-04T18:21:21-03:00"
  docs/decisions/technical-decisions-social-interactions.md: "2026-10-03T21:55:58-03:00"
  docs/decisions/technical-decisions-social-interactions-anonymous-gate.md: "2026-10-01T21:50:20-03:00"
sources_hash:
  docs/phases/phase-06-social-interactions/context.md: "06484f0d1796"
  docs/decisions/technical-decisions-social-interactions.md: "5d77800087a5"
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
    status: resolved
    summary: "Bullet diz acesso rapido aos videos; TD-07 entrega lista de canais, videos a dois cliques"
    resolved_by: social-interactions/TD-07 (revision 2026-10-04)
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
    status: resolved
    summary: "Decisao de contract-sync existe mas esta como Scope Frontend; gate #29 dispara"
    resolved_by: next-frontend-openapi-typing/TD-04 (reclassificado para Cross-layer)
  - id: MD-3
    status: resolved
    summary: "Nenhum TD decide o orcamento de throttle dos endpoints de escrita social"
    resolved_by: social-interactions/TD-09 (criado; decisao pendente em OQ-20)
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
    status: resolved
    summary: "Compositor de resposta nao existe no desenho; publicar resposta sem componente"
    resolved_by: clarification
  - id: OQ-13
    status: resolved
    summary: "Quatro estados sem desenho na watch page (vazio, erro, em transito, Inscrito)"
    resolved_by: clarification
  - id: OQ-14
    status: resolved
    summary: "Estado vazio da area de canais seguidos nao foi desenhado"
    resolved_by: clarification
  - id: OQ-15
    status: resolved
    summary: "Variante anonima dos controles novos nao foi desenhada na watch page"
    resolved_by: clarification
  - id: OQ-16
    status: resolved
    summary: "Contagem de inscritos tem duas formas de render entre as duas telas"
    resolved_by: clarification
  - id: OQ-17
    status: open
    summary: "75:62 sem harvest completo; duas linhas do inventario sem node id"
  - id: OQ-18
    status: open
    summary: "Tres nos de comentario colhidos no maxDepth 6; sub-estrutura sem node id"
  - id: OQ-19
    status: resolved
    summary: "/channel/subscriptions nao existe no repo e a tela altera a site-navbar"
    resolved_by: clarification
  - id: OQ-20
    status: resolved
    summary: "TD-09 pending — orcamento de rate limit das rotas sociais de escrita"
    resolved_by: social-interactions/TD-09
advisories: []
---

# phase-06-social-interactions — Validation

## Findings

### Inconsistencies

- **IC-4** — Duas linhas de `## UI Inventory → UI ↔ Capability Join`, ambas na tela `Página pública do canal` (`/@{nickname}`), têm a coluna Capability preenchida com `— (coberta na Fase 04: "Página pública do canal com informações e listagem de vídeos")`. Essa string não é nenhuma das oito bullets de `## Capability Coverage`. São os dois verbos pré-existentes da tela — exibir as informações do canal e listar seus vídeos —, que a Fase 06 não entrega: ela apenas **estende** a tela com inscrição e contagem. O inventário marcou as linhas de propósito para que a reconciliação não as confundisse com cobertura da Fase 06, e isso foi correto; o problema é a jusante. A matriz de rastreabilidade do `/plan-build` faz join pela capability, então essas duas linhas ou são descartadas em silêncio ou produzem linha malformada. Explicit choice: (a) remover os dois verbos do inventário via extension run do `/screen-inventory`, já que pertencem ao inventário da Fase 04 e não a este; (b) manter e ensinar o `/plan-build` a tratar o marcador `—` como "coberto em fase anterior, não rastrear aqui" — mudança de skill, não de artefato; (c) acrescentar a bullet da Fase 04 ao escopo da Fase 06 no `project-plan.md`, o que seria falso: a fase não reentrega aquela capability.

### Ambiguities

_None._

### Missing Decisions

_None._ _(Esta é a primeira rodada em que a categoria fecha. As duas `MD` que estavam abertas foram atendidas entre a rodada anterior e esta, por caminhos diferentes, e migraram para `## Resolved Issues`: a `MD-2` pela reclassificação do `next-frontend-openapi-typing/TD-04` para `Scope: Cross-layer`, e a `MD-3` pela criação do `social-interactions/TD-09`. O TD-09 está `pending`, e a regra do Check 3 é explícita — "distinguish 'missing TD' from 'TD pending decision': a pending TD goes to `OQ-N`, not `MD-N`" —, então a pergunta continua aberta, mas sob `OQ-20`, que é onde ela pertence. O gate de contract-sync da Decisão #29 não dispara mais: a condição 3 pede ≥1 TD de escopo `Cross-layer` ou `Repo-wide` cobrindo a estratégia, e o `openapi-typing/TD-04` ("Type Sharing Between BFF Layer and Components Layer") agora satisfaz as duas metades — o escopo e o conteúdo.)_

> **Limitação deste estágio, registrada e não contornada.** Decidir o gate #29 exige o `Scope` dos TDs **herdados**, e `## Inherited Decisions Detail` carrega apenas `Recommendation` + `Libraries` — o campo `Scope` não atravessa o `context.md`. Como na rodada anterior, a verificação do `Scope: Cross-layer` do `openapi-typing/TD-04` foi feita no doc de origem (`docs/decisions/technical-decisions-next-frontend-openapi-typing.md:171`), o que contraria a regra "No decisions-doc reads" deste estágio. A alternativa seria inferir pela prosa, que é exatamente o tipo de premissa não verificada que já produziu afirmação falsa aqui antes. O conserto estrutural é o `decisions-detail-reader` / o Step 4 do `/plan-context` passarem a emitir o `Scope` por TD herdado; enquanto não emitirem, o gate #29 é indecidível a partir do `context.md` sozinho.

### Dependency Gaps

_None._ _(Os pré-requisitos das oito capabilities estão entregues: autenticação na Fase 02, vídeos nas Fases 03/04, a página de visualização na Fase 05, e os contadores `likes_count`/`comments_count` em `videos` desde a Fase 04 — hoje em zero, e é esta fase que passa a incrementá-los, conforme `video-channel-management/TD-05`. O `subscribers_count` é coluna nova e pertence ao `TD-06` desta fase, não a uma fase anterior. O link de navegação exigido pelo `TD-07` modifica a `SiteNavbar` entregue na Fase 04, que existe — modificar entregável anterior não é lacuna de dependência.)_

### Inherited Constraint Conflicts

_None._ _(Quatro pares verificados em particular. `TD-02` e `TD-06` contra `video-channel-management/TD-05`, que exige incremento "na mesma transação do evento que o origina" — as duas decisões cumprem textualmente. `TD-05` contra `video-channel-management/TD-06`, cuja auto-limitação a "apenas as listagens desta fase" já está registrada por escrito no `**Decision:**` do TD-05. `anonymous-gate/TD-02` contra `phase-02-auth-frontend/TD-06`, que rejeitou flicker de primeira pintura no chrome autenticado — o `**Recommendation:**` do TD-02 cita a rejeição e escolhe a opção que a respeita. `TD-08` (`useOptimistic`) contra `phase-02-auth-frontend/TD-05`, que fixou Route Handler + `fetch` como caminho de mutação — `useOptimistic` é primitiva de feedback de UI e não substitui o caminho de mutação; convivem. O `TD-09`, decidido no resolve de 2026-10-04, passou a entrar nesta checagem e foi verificado contra dois herdados: `video-watch-page/TD-05`, que fixou `@Throttle` dedicado por rota e storage em memória com Redis declarado para multi-instância — a Option B usa o mesmo mecanismo e registra por escrito que o storage é herança e não se reabre; e `phase-02-auth/TD-08`, que escolheu `@nestjs/throttler` com `APP_GUARD` no `AuthModule` — a Option B só acrescenta decorators por rota, sem tocar o `forRoot`. Nenhum conflito. Os três TDs novos de `openapi-docs-nestjs` que entraram no bloco herdado nesta rodada decidem tooling, artefato e exposição do spec OpenAPI; nenhum colide com decisão desta fase — ao contrário, fecham a cadeia de contrato que a `MD-2` discutia.)_

### Unresolved Open Questions

Nenhum TD está `pending` — o `TD-09` foi decidido neste resolve (Option B), fechando a `OQ-20`. Das nove entradas do inventário, seis foram resolvidas por argumento neste mesmo ciclo (`OQ-12` a `OQ-16` e `OQ-19`) e uma segue promovida a `IC-5`, agora resolvida. Restam as duas que dependem de uma colheita do Figma, indivisíveis entre si:

- **OQ-17** — `75:62` não tem harvest completo. O frame foi criado por script e a colheita truncou antes de terminar o nó, então o cache traz `known_child_ids` parcial em vez de árvore; duas linhas do inventário (`Avatar` dentro de `channel-row`, `SubscriptionToggleButton`) estão sem node id, e o `/implement` precisa de id para mirar o `figma-implement-design`. Resolution: resolver via `/plan-resolve social-interactions` — resolve junto com OQ-18 numa colheita só.
- **OQ-18** — Três nós da watch page ficaram no limite de profundidade. `comment-root` (`77:137`, `77:176`) e `reply-list` (`77:149`) foram colhidos a `maxDepth` 6 e vieram sem filhos; toda a sub-estrutura de comentário foi lida do screenshot e está sem node id. Mesma consequência para o `/implement`. Resolution: resolver via `/plan-resolve social-interactions` — uma colheita com `maxDepth` maior cobrindo esses três nós e o `75:62` da OQ-17 fecha as duas de uma vez.

### UI Coverage Gaps

_None._ _(O `## UI Inventory` está populado com 3 telas e 16 linhas de junção, e as oito capabilities da fase têm ≥1 verbo cobrindo — likes e dislikes de vídeo por `LikeButton`/`DislikeButton`, comentários por `NewCommentForm`, respostas por `RepliesLoadMore`, reações a comentários por `CommentLikeButton`/`CommentDislikeButton`, inscrição por `SubscribeButton` e `SubscriptionToggleButton`, a área de canais por `channel-list`, a contagem por `ChannelHeader`, e a interface completa por `CommentsSection`/`CommentsLoadMore`. A cobertura parcial de "Respostas a comentários" — só o lado de leitura — **não** dispara UIG-N, porque a condição do check é ausência de verbo e o verbo existe; a lacuna de publicação está em `OQ-12`, que é onde ela pertence. `## Non-UI / Deferred Capabilities` está em `_None._`, então a terceira condição do check não suprime nada.)_

## Resolved Issues

- **IC-5** _(resolved_by social-interactions/TD-07, revision 2026-10-04)_ — A bullet do plano promete "acesso rápido aos vídeos" e o TD-07 entrega lista de canais. Das três formas de alinhar as duas fontes, a escolhida foi a revisão de prosa: um `**Revisions:**` no TD-07 registra que "acesso rápido" é satisfeito pelo link para a página pública do canal, com os vídeos a dois cliques. Mesma Option A, nenhuma mudança de mecanismo; o `project-plan.md` não foi tocado e o feed da Fase 07 não foi antecipado.
- **OQ-12** _(resolved_by clarification)_ — O `ReplyForm` é o `NewCommentForm` reusado com `parent_id`. Fecha o lado de publicação de "Respostas a comentários" sem desenhar estado novo nem gastar cota do Figma, e é coerente com o TD-04 (profundidade 1 — resposta é comentário com pai).
- **OQ-13** _(resolved_by clarification)_ — Os quatro estados sem desenho na watch page (lista vazia, erro de envio, comentário em trânsito, `SubscribeButton` "Inscrito") seguem os padrões de vazio/erro/carregando entregues na Fase 04. Mesmo precedente que o `video-watch-page/TD-04` já assumiu por escrito para o "ver mais" e a sidebar carregando.
- **OQ-14** _(resolved_by clarification)_ — Os estados vazio, carregando e erro da área de canais seguidos seguem os mesmos padrões da Fase 04; o vazio é estruturalmente idêntico aos já entregues, com cópia própria.
- **OQ-15** _(resolved_by clarification)_ — A variante anônima dos controles novos deriva do `anonymous-gate/TD-01` + `TD-03`, que já decidiram a regra e são uniformes: controle visível, clique leva ao login com `returnTo`. A `59:2` demonstra a regra para o `SubscribeButton`; `LikeButton`, `DislikeButton`, `NewCommentForm` e os controles de comentário seguem a mesma.
- **OQ-16** _(resolved_by clarification)_ — A contagem de inscritos é unificada no `subscriber-count.tsx`: a página de canal passa a usar o mesmo componente da watch page, que já carrega o comportamento otimista de que ela também precisa. A linha do `ChannelMeta` muda de forma 3 para forma 2 no inventário — mudança que entra no mesmo extension run exigido pela `IC-4`.
- **OQ-19** _(resolved_by clarification)_ — Nota de escopo registrada: `/channel/subscriptions` nasce em `next-frontend/app/(studio)/`, seguindo a convenção das irmãs `/channel/videos` e `/channel/settings`, e a alteração de `components/layout/site-navbar.tsx` — entregável da Fase 04 — é escopo explícito desta fase, porque a entrada de navegação do TD-07 é um `<Link>` inline ali.
- **OQ-20** _(resolved_by social-interactions/TD-09)_ — Decidido **B**: dois orçamentos de throttle por perfil de abuso, via `@Throttle({ default: ... })` por rota com rastreador por IP — 60/60 s para reagir a vídeo, reagir a comentário e inscrever-se; 5/60 s para criar comentário e resposta. A Option C (rastreador por usuário) fica declarada como Revision futura, sem trocar a letra, se aparecer colisão por NAT. Storage em memória é herança do `video-watch-page/TD-05` e não foi reaberto.

- **IC-1** _(resolved_by screen-inventory-phase-06)_ — `social-interactions/TD-08` tem `Scope: Frontend` e o `## UI Inventory` estava diferido, o que tornaria o TD órfão no artefato final. O inventário da Fase 06 foi criado e validado, o escopo de UI está ativo, e a checagem de órfão não dispara mais para `Scope: Frontend` quando há inventário populado.
- **IC-2** _(resolved_by social-interactions/TD-05)_ — O `**Context:**` do TD-05 afirmava que `video-channel-management/TD-06` fixou offset/limit como padrão do projeto, contra o texto do próprio TD-06. O `**Decision:**` do TD-05 registra por escrito que a paginação é decisão desta fase, não herança, com o trade-off de concorrência assumido.
- **IC-3** _(resolved_by screen-inventory-phase-06)_ — `social-interactions-anonymous-gate/TD-03` caía na mesma condição de órfão da IC-1; fechada pela mesma ativação do escopo de UI.
- **AMB-1** _(resolved_by screen-inventory-phase-06)_ — A capability "Interface completa de comentários, likes e inscrições" não tinha fluxos nem telas listados. O inventário enumerou as superfícies: caixa de novo comentário, lista paginada de raízes, respostas pré-carregadas, controles de reação em vídeo e em comentário, e os dois pontos onde vive o botão de inscrever.
- **AMB-2** _(resolved_by social-interactions/TD-05)_ — Fixado no `**Decision:**` do TD-05: 10 comentários-raiz por página e até 3 respostas pré-carregadas por raiz, com "ver mais" dentro da thread acima disso.
- **MD-1** _(resolved_by social-interactions-anonymous-gate/TD-01)_ — Nenhum TD decidia a superfície anônima versus autenticada das interações na página pública. Fechada pelo `/research` que criou o doc ad-hoc `technical-decisions-social-interactions-anonymous-gate.md`.
- **MD-2** _(resolved_by next-frontend-openapi-typing/TD-04)_ — O gate de contract-sync (Decisão #29) disparava porque os cinco TDs de `next-frontend-openapi-typing` estavam todos marcados `Scope: Frontend`, e o gate exige `Cross-layer` ou `Repo-wide`. A opção (a) da rodada anterior foi executada: o `TD-04` ("Type Sharing Between BFF Layer and Components Layer") foi reclassificado para `Scope: Cross-layer`, seguindo o precedente registrado em `video-channel-management/TD-08`. Os outros quatro seguem `Frontend`, o que é consistente — decidem tooling, sourcing, política de commit e tipagem de MSW, todos internos ao frontend; o que atravessa as duas camadas é o compartilhamento de tipos, e é esse que mudou de rótulo.
- **MD-3** _(resolved_by social-interactions/TD-09)_ — Nenhum TD decidia o orçamento de rate limit das rotas de escrita desta fase, que herdavam em silêncio o `ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])` global. A opção (a) foi executada: o `/research` acrescentou o `social-interactions/TD-09`, com `Capability: Transversal` cobrindo as cinco bullets de escrita. A **existência** do TD fecha esta MD; a **decisão** segue aberta em `OQ-20`.
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
