---
kind: phase
name: phase-06-social-interactions
status: dirty
issue_count: 3
sources_mtime:
  docs/phases/phase-06-social-interactions/context.md: "2026-10-01T20:38:30-03:00"
  docs/decisions/technical-decisions-social-interactions.md: "2026-10-01T20:34:44-03:00"
  docs/decisions/technical-decisions-social-interactions-anonymous-gate.md: "2026-10-01T20:34:44-03:00"
sources_hash:
  docs/phases/phase-06-social-interactions/context.md: "57fb4f1b812a"
  docs/decisions/technical-decisions-social-interactions.md: "57e6e245daea"
  docs/decisions/technical-decisions-social-interactions-anonymous-gate.md: "923b133e7c18"
issues:
  - id: IC-1
    status: open
    summary: "TD-08 tem Scope Frontend mas o UI Inventory esta diferido — TD orfa no artefato"
  - id: IC-2
    status: resolved
    summary: "Context do TD-05 afirma que TD-06 da Fase 04 fixou offset/limit como padrao do projeto"
    resolved_by: social-interactions/TD-05
  - id: IC-3
    status: open
    summary: "anonymous-gate/TD-03 tem Scope Frontend com UI diferida — segundo TD orfao"
  - id: AMB-1
    status: open
    summary: "Capability Interface completa de comentarios, likes e inscricoes nao e decomponivel"
  - id: AMB-2
    status: resolved
    summary: "TD-05 exige limite por raiz e paginacao de raizes sem fixar nenhum numero"
    resolved_by: social-interactions/TD-05
  - id: MD-1
    status: resolved
    summary: "Nenhum TD decide a superficie anonima x autenticada das interacoes na pagina publica"
    resolved_by: social-interactions-anonymous-gate/TD-01
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
advisories: []
---

# phase-06-social-interactions — Validation

## Findings

### Inconsistencies

- **IC-1** — `social-interactions/TD-08` está `decided` como **A** (`useOptimistic` do React 19) com `Scope: Frontend`, mas `## UI Inventory` continua com o placeholder diferido (`_No screen inventory — UI↔API sync deferred._`). Sem escopo de UI ativo o TD é filtrado das subseções voltadas a backend do artefato final (Data Model / API Contracts, por `Scope` mismatch) e a subseção `### UI Contracts` não é emitida — o TD fica órfão no `/plan-build`. Decidir o TD não fecha a issue: o problema é onde ele renderiza, não se ele tem decisão. Explicit choice: (a) mudar o `Scope` do TD para `Cross-layer`; (b) ativar escopo de UI (rodar `/screen-inventory 06` e não escolher "defer" no `/plan-context`); (c) remover o TD; (d) marcar `Renders in: frontend-runtime` e virar o UI Inventory para logic-only via `/plan-resolve`. **Escolha registrada no `/plan-resolve` de 2026-10-01: opção (b).**
- **IC-3** — `social-interactions-anonymous-gate/TD-03` está `decided` como **A** (`returnTo` na query de `/login`) com `Scope: Frontend`, e cai na mesma condição de órfão da IC-1. Explicit choice: as mesmas quatro da IC-1. **Escolha registrada no `/plan-resolve` de 2026-10-01: opção (b)** — a mesma ação fecha IC-1 e IC-3 de uma vez.

### Ambiguities

- **AMB-1** — A capability "Interface completa de comentários, likes e inscrições" continua sem fluxos nem telas listados: `Out of scope` é `_Not specified._`, o `## UI Inventory` está diferido e não existe frame da Fase 06 no Figma. O `social-interactions-anonymous-gate/TD-01` (decidido **A**) fixou o comportamento para o visitante **anônimo**, mas o conjunto de superfícies do usuário **autenticado** segue indefinido — caixa de novo comentário, edição e remoção do próprio comentário, estado vazio, estado de erro, e onde vive o botão de inscrever (card do canal versus página do canal). O `/plan-build` teria de inventá-las. Explicit choice: (a) desenhar as telas, rodar `/screen-inventory 06` e rerodar `/plan-context social-interactions`; (b) enumerar os fluxos no bullet do `project-plan.md` e rerodar o `/plan-context`. **Escolha registrada no `/plan-resolve` de 2026-10-01: opção (a).**

### Missing Decisions

_None._ _(As oito capabilities estão cobertas por ≥1 TD, e os 11 TDs de escopo corrente estão `decided`. A sub-checagem de contract-sync da Decisão #29 não dispara porque `ui_in_scope` está diferido — ela volta a valer no ciclo em que o inventário for criado.)_

### Dependency Gaps

_None._

### Inherited Constraint Conflicts

_None._ _(Primeira rodada em que o Check 5 tem o que examinar — os 11 TDs passaram a `decided`. Verificados em particular três pares: `TD-02`/`TD-06` contra `video-channel-management/TD-05`, que exige incremento "na mesma transação do evento que o origina" — as duas decisões cumprem; `TD-05` contra `video-channel-management/TD-06`, que se auto-limita a "apenas as listagens desta fase" e portanto não constrange a Fase 06, com a divergência já registrada por escrito no `**Decision:**` do TD-05; e `anonymous-gate/TD-02` contra `phase-02-auth-frontend/TD-01` e `/TD-03`, que já preveem leitura autenticada a partir de Server Component via `fetchFromUpstream` — o helper novo é irmão daquele, não contradição.)_

### Unresolved Open Questions

_None._ _(Nenhum TD `pending`: os 11 foram decididos no `/plan-resolve` de 2026-10-01.)_

### UI Coverage Gaps

_None._ _(O `## UI Inventory` carrega o placeholder diferido; o Check 7 é pulado por construção.)_

## Resolved Issues

- **MD-1** _(resolved_by social-interactions-anonymous-gate/TD-01)_ — Nenhum TD decidia a superfície anônima versus autenticada das interações sociais na página pública de vídeo. Fechada pelo `/research` que criou `docs/decisions/technical-decisions-social-interactions-anonymous-gate.md` (ad-hoc, `related_phases: [6]`).
- **IC-2** _(resolved_by social-interactions/TD-05)_ — O `**Context:**` do TD-05 afirmava que `video-channel-management/TD-06` fixou offset/limit como padrão do projeto, contra o texto do próprio TD-06. Mantido offset/limit, e o `**Decision:**` do TD-05 registra por escrito que a paginação é decisão **desta** fase, não herança, com o trade-off de concorrência assumido.
- **AMB-2** _(resolved_by social-interactions/TD-05)_ — O recorte da listagem de comentários estava indefinido. Fixado no `**Decision:**` do TD-05: **10 comentários-raiz por página e até 3 respostas pré-carregadas por raiz**, com "ver mais" dentro da thread acima disso.
- **DG-1** _(resolved_by social-interactions/TD-07)_ — A "área de canais seguidos" não tinha ponto de entrada de navegação. O `**Decision:**` do TD-07 inclui o link no chrome autenticado entregue na Fase 04 (`SiteNavbar` / `UserMenu`), que hoje não tem link algum.
- **OQ-1** _(resolved_by social-interactions/TD-01)_ — Decidido **A**: duas tabelas dedicadas (`video_reactions` e `comment_reactions`), cada uma com FK real.
- **OQ-2** _(resolved_by social-interactions/TD-02)_ — Decidido **A**: delta calculado no serviço, dentro da mesma transação do evento que o origina.
- **OQ-3** _(resolved_by social-interactions/TD-03)_ — Decidido **A**: expor só o estado do próprio usuário; sem coluna `dislikes_count` e sem contagem de dislikes na API.
- **OQ-4** _(resolved_by social-interactions/TD-04)_ — Decidido **A**: profundidade 1, `parent_id` nulável; comentários e respostas, sem aninhar além disso.
- **OQ-5** _(resolved_by social-interactions/TD-05)_ — Decidido **B**: mais recentes primeiro, respostas pré-carregadas junto da página de raízes. Parâmetros vindos da AMB-2 e registro da premissa, da IC-2 — as três resolvem no mesmo campo.
- **OQ-6** _(resolved_by social-interactions/TD-06)_ — Decidido **B**: `subscribers_count` desnormalizado em `channels`, mantido na mesma transação do inscrever/desinscrever.
- **OQ-7** _(resolved_by social-interactions/TD-07)_ — Decidido **A**: lista de canais seguidos com link para a página pública de cada um, não feed. Inclui o ponto de entrada de navegação exigido pela DG-1.
- **OQ-8** _(resolved_by social-interactions/TD-08)_ — Decidido **A**: `useOptimistic` do React 19. Nenhuma biblioteca nova — a primitiva está na versão instalada (`react@19.2.4`).
- **OQ-9** _(resolved_by social-interactions-anonymous-gate/TD-01)_ — Decidido **A**: leitura pública; os controles de ação renderizam para o anônimo e o clique leva ao login.
- **OQ-10** _(resolved_by social-interactions-anonymous-gate/TD-02)_ — Decidido **A**: endpoint público com auth opcional — um payload só, com os campos pessoais preenchidos quando há Bearer válido.
- **OQ-11** _(resolved_by social-interactions-anonymous-gate/TD-03)_ — Decidido **A**: `returnTo` na query de `/login`, validado pelo mesmo `safeReturnTo` da rota de refresh.
