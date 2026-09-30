---
kind: phase
name: phase-05-video-watch-page
status: clean
issue_count: 0
sources_mtime:
  docs/phases/phase-05-video-watch-page/context.md: "2026-09-29T22:45:01-03:00"
  docs/decisions/technical-decisions-video-watch-page.md: "2026-09-29T21:26:00-03:00"
sources_hash:
  docs/phases/phase-05-video-watch-page/context.md: "71f919de97f4"
  docs/decisions/technical-decisions-video-watch-page.md: "8cde965b9bd0"
issues:
  - id: IC-1
    status: resolved
    summary: "Verbo do inventário cita limiar de 5 s; o TD-03 revisado diz 10 s"
    resolved_by: screen-inventory re-extração 2026-09-29
  - id: IC-2
    status: resolved
    summary: "TD-04 revisado pagina a sidebar; o inventário não tem verbo nem controle de 'ver mais'"
    resolved_by: screen-inventory re-extração 2026-09-29
  - id: IC-3
    status: resolved
    summary: "TD-05 Context e a prosa do TD-06 ainda citam 5 s; o TD-03 revisado diz 10 s"
    resolved_by: video-watch-page/TD-03
  - id: IC-4
    status: resolved
    summary: "Verbo do inventário diz 10 s; o TD-03 revertido em 29/09 diz 5 s"
    resolved_by: screen-inventory emenda 2026-09-29
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
  - id: OQ-9
    status: resolved
    summary: "TD-05 declara 30 req/60 s como premissa a confirmar e nunca foi confirmada"
    resolved_by: video-watch-page/TD-05
  - id: OQ-10
    status: resolved
    summary: "Dois estados novos da sidebar sem desenho, posteriores a resolucao da OQ-3"
    resolved_by: clarification
advisories: []
---

# phase-05-video-watch-page — Validation

## Findings

**`status: clean`.** Sétima rodada, contra o `context.md` regenerado de 2026-09-29. Nenhuma issue aberta; as 18 da trilha estão todas resolvidas.

_Check 8 suprimido: `S_phase ∩ S_05` = 1 slice. Nenhuma regra customizada em `docs/rules/plan-validate/`._

**O limiar, que ocupou quatro rodadas, está fechado.** As três fontes concordam em **5 s**: o `TD-03` (revertido em 29/09), o `**Context:**` do `TD-05` mais a prosa do `TD-06` (que nunca deixaram de dizer 5 s), e o verbo do inventário mais o `### UI ↔ Capability Join` (alinhados na emenda de 29/09). Verifiquei o `context.md` inteiro: **não sobrou nenhuma menção operativa a "10 s"** — as três que existem estão dentro de blocos `Revisions`, descrevendo a própria mudança, que é onde devem estar.

**Nota de preflight — o gate de frescor não foi exercitado.** Este é o primeiro `context.md` com `sources_hash`, e eu disse que esta seria a primeira prova em produção da PR #22. **Não foi:** as 12 fontes passaram no passo 2, com `mtime` não-derivado, então o passo 3 nunca rodou. O gate está armado e correto por construção, mas continua sem uma execução real contra drift. A próxima vez que um merge reescrever timestamps é que vai dizer.

### Inconsistencies

_None._

_A `IC-4` fechou: o verbo diz "Registrar uma visualização após **5 s** de reprodução efetiva" e o `TD-03` diz 5 s. Os 8 verbos do join citam capabilities presentes no `## Capability Coverage`. O orphan check não dispara — `TD-01` e `TD-06` são `Scope: Frontend`, mas o `## UI Inventory` está populado._

### Ambiguities

_None._

### Missing Decisions

_None._

_Quatro bullets do `## Capability Coverage` seguem com `—`, e pelo quinto validate consecutivo a razão é a mesma: "Layout da página…" e "Descrição do vídeo com expansão/recolhimento" não têm escolha estratégica a tomar; "Acesso anônimo…" e "Vídeos unlisted…" têm cobertura real de fase anterior (`video-channel-management/TD-02`, já implementado). Mantenho o julgamento inalterado por consistência entre rodadas, e o declaro em vez de omitir._

_Decisão #29 não dispara: a heurística de palavras-chave encontra `contract`, `shape`, `schema`, `sync` e `DTO` no `## Decisions Detail` + `## Inherited Decisions Detail`, via `next-frontend-openapi-typing/TD-02` e `TD-03`, que decidem a sincronização FE↔BE._

### Dependency Gaps

_None._

### Inherited Constraint Conflicts

_None._

### Unresolved Open Questions

_None._

_Nenhum TD está `pending` — os 6 do escopo estão decididos. As quatro entradas de `### Open Questions from Inventory` casam, uma a uma, com `OQ-2`, `OQ-10`, `OQ-4` e `OQ-5`, já resolvidas, e são descartadas pela regra de merge do Step 3._

### UI Coverage Gaps

_None._

_Toda capability com cobertura de TD tem verbo no join. "Descrição do vídeo com expansão/recolhimento" não tem verbo, mas também não tem TD — a condição 1 do `UIG-N` não se satisfaz, então a checagem não dispara. É o mesmo ponto que a primeira open question do inventário levanta desde a primeira rodada, e ele se resolve sozinho: nunca foi uma lacuna, era a regra funcionando._

### Custom rule findings

_(nenhuma regra carregada — `docs/rules/plan-validate/` não existe)_

## Resolved Issues

- **IC-1** _(resolved_by screen-inventory re-extração 2026-09-29)_ — o verbo citava 5 s contra os 10 s do `TD-03` então revisado; a re-extração o levou a 10 s.
- **IC-2** _(resolved_by screen-inventory re-extração 2026-09-29)_ — `SidebarLoadMore` (`72:62`) desenhado no Figma e registrado no inventário, com verbo próprio.
- **IC-3** _(resolved_by video-watch-page/TD-03)_ — as três fontes alinhadas em 5 s, revertendo o `TD-03`. O `TD-05` e o `TD-06` já diziam 5 s e não precisaram de edição.
- **IC-4** _(resolved_by screen-inventory emenda 2026-09-29)_ — o espelho da `IC-1`: depois da reversão, o inventário é que ficou em 10 s. A emenda alinhou os dois lugares que citavam o valor — o verbo **e** a célula `Notes` do `VideoPlayer` — sem gastar cota do Figma, porque o limiar vem do TD e não da árvore do frame.
- **AMB-1** _(resolved_by video-watch-page/TD-04)_ — sidebar fixada em 4 vídeos por página com "ver mais".
- **MD-1** _(resolved_by video-watch-page/TD-05)_ — proteção contra abuso decidida como `@Throttle()` dedicado na rota.
- **MD-2** _(resolved_by video-watch-page/TD-06)_ — fachada de mídia injetável + um E2E de fumaça com `page.route()`.
- **ICC-1** _(resolved_by phase-02-auth/TD-08)_ — revisão corrigindo a premissa falsa de que o `APP_GUARD` se escopa ao módulo declarante.
- **OQ-1** _(resolved_by clarification)_ — re-extração do Figma concluída; node-ids dos filhos preenchidos em toda a tabela.
- **OQ-2** _(resolved_by clarification)_ — cobertura da descrição por componente Local-interactive aceita como correta.
- **OQ-3** _(resolved_by clarification)_ — estados sem desenho de 2026-09-26 implementados seguindo os padrões da Fase 04.
- **OQ-4** _(resolved_by clarification)_ — `not-found-card` reusa o primitivo `components/ui/card.tsx`.
- **OQ-5** _(resolved_by clarification)_ — "MAIS EM {CATEGORIA}" nas sete categorias nomeadas, "MAIS VÍDEOS" no catch-all "Outros".
- **OQ-6** _(resolved_by video-watch-page/TD-02, video-watch-page/TD-03)_ — 6 h confirmadas no `TD-02`; limiar levado a 10 s no `TD-03` _(depois revertido a 5 s pela `IC-3`)_.
- **OQ-7** _(resolved_by video-watch-page/TD-05)_ — `TD-05` decidido.
- **OQ-8** _(resolved_by video-watch-page/TD-06)_ — `TD-06` decidido.
- **OQ-9** _(resolved_by video-watch-page/TD-05)_ — 30 req/60 s por IP confirmadas; deixam de ser premissa.
- **OQ-10** _(resolved_by clarification)_ — os dois estados novos da sidebar seguem a decisão da `OQ-3`.
