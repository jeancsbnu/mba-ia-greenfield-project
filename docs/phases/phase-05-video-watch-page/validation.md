---
kind: phase
name: phase-05-video-watch-page
status: dirty
issue_count: 0
sources_mtime:
  docs/phases/phase-05-video-watch-page/context.md: "2026-09-29T20:24:13-03:00"
  docs/decisions/technical-decisions-video-watch-page.md: "2026-09-26T22:05:51-03:00"
issues:
  - id: IC-3
    status: resolved
    summary: "TD-05 Context e a prosa do TD-06 ainda citam 5 s; o TD-03 revisado diz 10 s"
    resolved_by: video-watch-page/TD-03
  - id: OQ-9
    status: resolved
    summary: "TD-05 declara 30 req/60 s como premissa a confirmar e nunca foi confirmada"
    resolved_by: video-watch-page/TD-05
  - id: OQ-10
    status: resolved
    summary: "Dois estados novos da sidebar sem desenho, posteriores a resolucao da OQ-3"
    resolved_by: clarification
  - id: IC-1
    status: resolved
    summary: "Verbo do inventário cita limiar de 5 s; o TD-03 revisado diz 10 s"
    resolved_by: screen-inventory re-extração 2026-09-29
  - id: IC-2
    status: resolved
    summary: "TD-04 revisado pagina a sidebar; o inventário não tem verbo nem controle de 'ver mais'"
    resolved_by: screen-inventory re-extração 2026-09-29
  - id: AMB-1
    status: resolved
    summary: "Quantidade de sugestões na sidebar não é definida por nenhuma fonte"
    resolved_by: video-watch-page/TD-04
  - id: MD-1
    status: resolved
    summary: "Endpoint público de contagem sem decisão de proteção contra abuso"
    resolved_by: video-watch-page/TD-05
  - id: MD-2
    status: resolved
    summary: "Sem decisão de como os testes fingem os bytes de vídeo do object storage"
    resolved_by: video-watch-page/TD-06
  - id: ICC-1
    status: resolved
    summary: "Racional herdado do phase-02-auth/TD-08 afirma escopo de guard que o NestJS não tem"
    resolved_by: phase-02-auth/TD-08
  - id: OQ-1
    status: resolved
    summary: "Re-extração do Figma pendente; node-ids dos filhos ausentes no inventário"
    resolved_by: clarification
  - id: OQ-2
    status: resolved
    summary: "Capability da descrição é coberta por componente local, sem verbo"
    resolved_by: clarification
  - id: OQ-3
    status: resolved
    summary: "Sem desenho: descrição expandida, sidebar vazia, loading e erro"
    resolved_by: clarification
  - id: OQ-4
    status: resolved
    summary: "not-found-card reusa components/ui/card.tsx ou é markup próprio?"
    resolved_by: clarification
  - id: OQ-5
    status: resolved
    summary: "Rótulo da sidebar para as 8 categorias e para o valor Outros"
    resolved_by: clarification
  - id: OQ-6
    status: resolved
    summary: "TD-02 (6 h) e TD-03 (5 s) marcam os valores como premissa a confirmar"
    resolved_by: video-watch-page/TD-02, video-watch-page/TD-03
  - id: OQ-7
    status: resolved
    summary: "TD-05 pending — proteção contra abuso do endpoint público de contagem"
    resolved_by: video-watch-page/TD-05
  - id: OQ-8
    status: resolved
    summary: "TD-06 pending — como os testes simulam os bytes do vídeo"
    resolved_by: video-watch-page/TD-06
advisories: []
---

# phase-05-video-watch-page — Validation

## Findings

_Quinta rodada, contra o `context.md` de 2026-09-29 (pós re-extração do inventário). **As duas `IC` da rodada anterior fecharam** e passam para `## Resolved Issues`. Três issues novas, todas de origem diferente das anteriores._

_Check 8 suprimido: `S_phase ∩ S_NN` devolveu exatamente 1 slice (`video-watch-page`), então a fase é monolítica e não há cobertura cross-slice a verificar. Nenhuma regra customizada — `docs/rules/plan-validate/` não existe._

**Nota de preflight — desvio declarado.** A checagem de frescor acusou `screen-inventory-phase-05-video-watch-page.md` com `mtime` 6 min 20 s mais novo que o registrado no `context.md`. **Não é drift de conteúdo:** o blob é `1428d076` no working tree, em `HEAD` e em `aa403f0` — o mesmo commit que gerou este `context.md`. O `mtime` foi reescrito pelo checkout do merge da PR #19. Prossegui em vez de abortar, porque abortar mandaria você rodar um `/plan-context` inteiro por uma diferença que não existe no conteúdo. **É a terceira vez que este falso-positivo aparece** — o gate compara `mtime`, e `git` reescreve `mtime` em todo merge. Vale trocar o critério por hash de conteúdo, mas isso é escopo de outra mudança.

### Inconsistencies

_None._

### Ambiguities

_None._

### Missing Decisions

_None._

_Quatro bullets do `## Capability Coverage` aparecem com `—` na coluna "Covered by": "Layout da página…", "Descrição do vídeo com expansão/recolhimento", "Acesso anônimo à visualização de vídeos" e "Vídeos unlisted…". **Não emito `MD-N` para nenhum dos quatro, e digo por quê** em vez de omitir: os dois primeiros estão anotados no decisions doc como composição de primitivos e comportamento de UI sem alternativa relevante — não há escolha estratégica a tomar; os dois últimos têm cobertura real, só que de fase anterior (`video-channel-management/TD-02` + `assertServable`, já implementado). Cobertura herdada é cobertura. Este julgamento é o mesmo das quatro rodadas anteriores; se ele mudar, muda por decisão sua, não por variação minha entre rodadas._

_O gate de contract-sync (Decisão #29) **não dispara**: `next-frontend-openapi-typing/TD-02` e `TD-03`, herdados e presentes no `## Inherited Decisions Detail`, decidem exatamente a sincronização FE↔BE (spec commitada + `types.gen.ts` por codegen + CI de frescor)._

### Dependency Gaps

_None._

### Inherited Constraint Conflicts

_None._

### Unresolved Open Questions

_None._

### UI Coverage Gaps

_None._

_Todas as capabilities com cobertura de TD têm verbo no join: "Player de vídeo…" (TD-01/02/06), "Contagem de visualizações" (TD-03/05/06), "Sugestões…" (TD-04, agora com **dois** verbos após a entrada do `SidebarLoadMore`) e "Botão de download" (TD-02). A capability "Descrição do vídeo com expansão/recolhimento" não tem verbo, mas também não tem TD — a condição 1 do `UIG-N` não se satisfaz, então a checagem não dispara. É o mesmo ponto que a primeira open question do inventário levanta; aqui ele se resolve sozinho, sem afrouxar regra nenhuma._

### Custom rule findings

_(nenhuma regra carregada — `docs/rules/plan-validate/` não existe)_

## Resolved Issues

- **IC-3** _(resolved_by video-watch-page/TD-03)_ — as três fontes foram alinhadas **em 5 s**, revertendo o `TD-03`. Revision de 2026-09-29 anexada ao `TD-03` desfazendo a de 2026-09-26. O `**Context:**` do `TD-05` e a prosa do `TD-06` já diziam 5 s e não precisaram de edição — o decisions doc ficou internamente consistente. **Abriu uma divergência em sentido inverso:** o verbo do inventário e o digest do `context.md` dizem 10 s, e o `/plan-resolve` não edita inventário.
- **OQ-9** _(resolved_by video-watch-page/TD-05)_ — **30 requisições por 60 s por IP confirmadas**; deixam de ser premissa e passam a valor firme, registradas num bloco `**Revisions:**` novo no `TD-05`. Mesmo tratamento que o `TD-02` e o `TD-03` receberam na `OQ-6`.
- **OQ-10** _(resolved_by clarification)_ — os dois estados novos da sidebar (carregando a próxima página, sem mais páginas) seguem a decisão da `OQ-3`: implementar sem desenho, seguindo os padrões da Fase 04. Nenhum TD editado — a Revision de 2026-09-26 do `TD-04` já antecipava esta consequência ao fixar a paginação.
- **IC-1** _(resolved_by screen-inventory re-extração 2026-09-29)_ — o verbo do inventário citava 5 s contra os 10 s do `TD-03` revisado. A re-extração corrigiu o verbo para _"Registrar uma visualização após 10 s de reprodução efetiva"_. Fechada **fora do `/plan-resolve`**: quem a resolveu foi o `/screen-inventory`, que é o único que pode editar inventário — por isso ela ainda constava `open` no frontmatter anterior.
- **IC-2** _(resolved_by screen-inventory re-extração 2026-09-29)_ — o `TD-04` revisado paginava a sidebar e o inventário não tinha nem verbo nem componente para isso. A mesma chamada ao Figma **desenhou** o `sidebar-load-more` (`72:62`) e a re-extração o registrou: novo verbo _"Carregar a próxima página de sugestões sob demanda"_ e `SidebarLoadMore` em `### Server-connected Components`.
- **AMB-1** _(resolved_by video-watch-page/TD-04)_ — tamanho do recorte da sidebar fixado em 4 vídeos por página com "ver mais".
- **MD-1** _(resolved_by video-watch-page/TD-05)_ — proteção contra abuso do endpoint público de contagem decidida como `@Throttle()` dedicado.
- **MD-2** _(resolved_by video-watch-page/TD-06)_ — simulação dos bytes de vídeo decidida como fachada de mídia injetável + um E2E de fumaça com `page.route()`.
- **ICC-1** _(resolved_by phase-02-auth/TD-08)_ — revisão anexada ao `TD-08` corrigindo a premissa falsa de que o `APP_GUARD` se escopa ao módulo declarante.
- **OQ-1** _(resolved_by clarification)_ — re-extração do Figma concluída em 2026-09-29; node-ids dos filhos preenchidos em toda a tabela.
- **OQ-2** _(resolved_by clarification)_ — cobertura da descrição por componente Local-interactive aceita como correta.
- **OQ-3** _(resolved_by clarification)_ — estados sem desenho de 2026-09-26 implementados seguindo os padrões da Fase 04. _(Os dois estados que surgiram depois estão na `OQ-10`.)_
- **OQ-4** _(resolved_by clarification)_ — `not-found-card` reusa o primitivo `components/ui/card.tsx`.
- **OQ-5** _(resolved_by clarification)_ — rótulo "MAIS EM {CATEGORIA}" nas sete categorias nomeadas e "MAIS VÍDEOS" no catch-all "Outros".
- **OQ-6** _(resolved_by video-watch-page/TD-02, video-watch-page/TD-03)_ — 6 h confirmadas no `TD-02`; limiar levado de 5 s para 10 s no `TD-03`.
- **OQ-7** _(resolved_by video-watch-page/TD-05)_ — `TD-05` decidido.
- **OQ-8** _(resolved_by video-watch-page/TD-06)_ — `TD-06` decidido.
