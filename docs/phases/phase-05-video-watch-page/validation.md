---
kind: phase
name: phase-05-video-watch-page
status: dirty
issue_count: 1
sources_mtime:
  docs/phases/phase-05-video-watch-page/context.md: "2026-09-29T21:26:00-03:00"
  docs/decisions/technical-decisions-video-watch-page.md: "2026-09-29T21:26:00-03:00"
sources_hash:
  docs/phases/phase-05-video-watch-page/context.md: "e6fbb76089e3"
  docs/decisions/technical-decisions-video-watch-page.md: "8cde965b9bd0"
issues:
  - id: IC-4
    status: open
    summary: "Verbo do inventário diz 10 s; o TD-03 revertido em 29/09 diz 5 s"
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

_Sexta rodada, contra o `context.md` pós-`/plan-resolve` de 2026-09-29. **Uma issue nova, e apenas uma.** As 17 anteriores seguem resolvidas e preservadas._

_Check 8 suprimido: `S_phase ∩ S_05` = 1 slice. Nenhuma regra customizada em `docs/rules/plan-validate/`._

**Nota de preflight — desvio declarado, quarta ocorrência.** O gate de frescor acusou **duas** fontes: o decisions doc (+11 min 08 s) e o inventário (+6 min 20 s). Nenhuma das duas mudou de conteúdo — os três blobs (working tree, `HEAD`, `cd00e2f`) são idênticos em ambos os arquivos, e `cd00e2f` é o commit que gerou este `context.md`. O merge da PR #23 reescreveu os `mtime`.

A PR #22 existe exatamente para isso, e **não pôde ajudar aqui**: este `context.md` foi gerado antes dela e não carrega `sources_hash`, então o passo 3 caiu no fallback legado. Foi o que eu declarei como limitação naquela PR. O próximo `/plan-context` grava os hashes e encerra o ciclo. Este `validation.md` já sai com `sources_hash` preenchido.

### Inconsistencies

- **IC-4** — **O verbo do inventário diz 10 s; o `TD-03` diz 5 s.** Espelho exato da `IC-1`, com os papéis trocados. O `### UI ↔ Capability Join` traz o verbo verbatim: _"Registrar uma visualização após **10 s** de reprodução efetiva"_. A revisão de 2026-09-29 no `video-watch-page/TD-03`, aplicada pelo `/plan-resolve` ao fechar a `IC-3`, reverteu o limiar para **5 s**.

  A consequência é a mesma de antes e não mudou de gravidade: o verbo é campo load-bearing do Output Contract do `screen-inventory`, e o `/plan-build` o consome **verbatim** no bloco `Verbs covered:` da UI Contract. Deixado como está, o plano final carrega 10 s na UI Contract e 5 s na decisão.

  O `context.md` **já declara** a divergência numa nota sob o `## Decisions Index`, escrita pelo próprio resolve, apontando 5 s como autoritativo. Isso protege o leitor, não o `plan-build` — que lê a tabela do join, não a nota.

  Explicit choice: (a) rodar `/screen-inventory 05` para atualizar o verbo para 5 s — **e desta vez não custa cota**: o `Step 3.5` introduzido na PR #20 serve as duas telas pelo cache em `docs/figma-cache/`, e o verbo é derivado da capability e do TD, não da geometria do Figma; (b) declarar no `/plan-resolve` que o TD é autoritativo e que o `plan-build` deve usar 5 s, aceitando o texto desatualizado no inventário; (c) reverter o `TD-03` de volta para 10 s, o que reabriria as 8 citações do `TD-06`.

  **Antes de escolher, um padrão que vale nomear:** este número já se moveu três vezes (5 → 10 → 5), e a cada movimento uma `IC` nasce do outro lado. O pipeline não propaga valor entre o inventário e os TDs — cada citação é texto solto, e quem move o número paga a reconciliação manual. A opção (b) é a única que quebra o ciclo, ao custo de deixar o inventário permanentemente desalinhado nesse campo.

### Ambiguities

_None._

### Missing Decisions

_None._

_Os mesmos quatro bullets do `## Capability Coverage` seguem com `—`, e pelas mesmas razões das rodadas anteriores: "Layout da página…" e "Descrição do vídeo com expansão/recolhimento" não têm escolha estratégica a tomar; "Acesso anônimo…" e "Vídeos unlisted…" têm cobertura real de fase anterior (`video-channel-management/TD-02`). Julgamento inalterado entre rodadas, por consistência._

_Decisão #29 não dispara: `next-frontend-openapi-typing/TD-02` e `TD-03`, herdados, decidem a sincronização FE↔BE._

### Dependency Gaps

_None._

### Inherited Constraint Conflicts

_None._

### Unresolved Open Questions

_None._

_As quatro entradas de `### Open Questions from Inventory` casam, uma a uma, com issues já resolvidas — `OQ-2`, `OQ-10`, `OQ-4` e `OQ-5` — e são descartadas pela regra de merge do Step 3. Nenhum TD está `pending`._

### UI Coverage Gaps

_None._

_Toda capability com cobertura de TD tem verbo no join. A sidebar segue com dois verbos desde a entrada do `SidebarLoadMore`._

### Custom rule findings

_(nenhuma regra carregada — `docs/rules/plan-validate/` não existe)_

## Resolved Issues

- **IC-1** _(resolved_by screen-inventory re-extração 2026-09-29)_ — o verbo do inventário citava 5 s contra os 10 s do `TD-03` revisado. A re-extração corrigiu o verbo para 10 s. _(Reaberta em sentido inverso como `IC-4` depois que o `TD-03` foi revertido.)_
- **IC-2** _(resolved_by screen-inventory re-extração 2026-09-29)_ — `SidebarLoadMore` (`72:62`) desenhado no Figma e registrado no inventário, com verbo próprio.
- **IC-3** _(resolved_by video-watch-page/TD-03)_ — as três fontes alinhadas em 5 s, revertendo o `TD-03`. O `TD-05` e o `TD-06` já diziam 5 s e não precisaram de edição.
- **AMB-1** _(resolved_by video-watch-page/TD-04)_ — sidebar fixada em 4 vídeos por página com "ver mais".
- **MD-1** _(resolved_by video-watch-page/TD-05)_ — proteção contra abuso decidida como `@Throttle()` dedicado.
- **MD-2** _(resolved_by video-watch-page/TD-06)_ — fachada de mídia injetável + um E2E de fumaça com `page.route()`.
- **ICC-1** _(resolved_by phase-02-auth/TD-08)_ — revisão corrigindo a premissa falsa sobre o escopo do `APP_GUARD`.
- **OQ-1** _(resolved_by clarification)_ — re-extração do Figma concluída; node-ids dos filhos preenchidos.
- **OQ-2** _(resolved_by clarification)_ — cobertura da descrição por componente Local-interactive aceita como correta.
- **OQ-3** _(resolved_by clarification)_ — estados sem desenho de 2026-09-26 implementados seguindo os padrões da Fase 04.
- **OQ-4** _(resolved_by clarification)_ — `not-found-card` reusa o primitivo `components/ui/card.tsx`.
- **OQ-5** _(resolved_by clarification)_ — "MAIS EM {CATEGORIA}" nas sete categorias nomeadas, "MAIS VÍDEOS" no catch-all.
- **OQ-6** _(resolved_by video-watch-page/TD-02, video-watch-page/TD-03)_ — 6 h confirmadas; limiar levado a 10 s _(depois revertido a 5 s pela `IC-3`)_.
- **OQ-7** _(resolved_by video-watch-page/TD-05)_ — `TD-05` decidido.
- **OQ-8** _(resolved_by video-watch-page/TD-06)_ — `TD-06` decidido.
- **OQ-9** _(resolved_by video-watch-page/TD-05)_ — 30 req/60 s por IP confirmadas; deixam de ser premissa.
- **OQ-10** _(resolved_by clarification)_ — os dois estados novos da sidebar seguem a decisão da `OQ-3`.
