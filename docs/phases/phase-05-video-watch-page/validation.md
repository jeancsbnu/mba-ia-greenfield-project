---
kind: phase
name: phase-05-video-watch-page
status: dirty
issue_count: 2
sources_mtime:
  docs/phases/phase-05-video-watch-page/context.md: "2026-09-26T22:09:00-03:00"
  docs/decisions/technical-decisions-video-watch-page.md: "2026-09-26T22:05:51-03:00"
issues:
  - id: IC-1
    status: open
    summary: "Verbo do inventário cita limiar de 5 s; o TD-03 revisado diz 10 s"
  - id: IC-2
    status: open
    summary: "TD-04 revisado pagina a sidebar; o inventário não tem verbo nem controle de 'ver mais'"
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

_Quarta rodada, contra o `context.md` pós-`/plan-resolve`. As 12 issues das rodadas anteriores continuam resolvidas e preservadas em `## Resolved Issues`._

_**Duas issues novas, ambas criadas pelas próprias resoluções.** Isso é o comportamento previsto pela semântica de rerun do skill ("may find new issues introduced by the resolution"), não uma falha do resolve. As duas têm a mesma origem: o `/plan-resolve` **não edita arquivos de inventário** — é regra explícita —, então revisões que mudam o que a tela faz deixam o digest do inventário defasado._

_Check 8 suprimido (1 slice). Nenhuma regra customizada em `docs/rules/plan-validate/`._

### Inconsistencies

- **IC-1** — **O verbo do inventário cita 5 s; o TD-03 agora diz 10 s.** O `## UI Inventory → UI ↔ Capability Join` traz o verbo verbatim: _"Registrar uma visualização após **5 s** de reprodução efetiva"_. A revisão de 2026-09-26 no `video-watch-page/TD-03`, aplicada pelo `/plan-resolve` ao fechar a `OQ-6`, alterou o limiar para **10 s**. Duas fontes do mesmo `context.md` afirmam números diferentes para a mesma regra.

  Isto não é cosmético: o verbo é campo load-bearing do Output Contract do `screen-inventory` e o `/plan-build` o consome **verbatim** no bloco `Verbs covered:` da UI Contract. Deixado como está, o plano final carrega 5 s na UI Contract e 10 s na decisão, e o implementador escolhe um dos dois.

  Explicit choice: (a) rodar `/screen-inventory 05` em extension run para atualizar o verbo para 10 s — caro, porque exige cota do MCP do Figma; (b) declarar no `/plan-resolve` que o TD é a fonte autoritativa para o valor e que o `plan-build` deve usar 10 s, aceitando que o texto do inventário fica desatualizado nesse ponto; (c) reverter o limiar para 5 s, o que descartaria a decisão que você acabou de tomar.

- **IC-2** — **O TD-04 revisado pagina a sidebar; o inventário descreve uma sidebar estática.** A revisão de 2026-09-26 no `video-watch-page/TD-04`, fechando a `AMB-1`, fixou **4 vídeos por página com "ver mais" carregando as próximas**. O inventário, porém, descreve a mesma superfície sem nenhum controle: o único verbo é _"Exibir sugestões de vídeos da mesma categoria, excluindo o vídeo atual, rascunhos e `unlisted`"_, e `### Server-connected Components` lista apenas `VideoWatchPage`, `VideoPlayer` e `VideoCard` — não há controle de carregar-mais.

  Duas fontes descrevem a mesma tela de formas diferentes. A consequência prática é no `/plan-build`: ele monta a UI Contract a partir dos verbos e da lista de componentes, então a interação de paginação não teria de onde ser derivada.

  Vale registrar por que isto **não** é `UIG-N`: aquela checagem é por capability, e "Sugestões de vídeos da mesma categoria na sidebar" **tem** verbo. A lacuna é de interação dentro de uma capability já coberta — nível que o `UIG-N` não enxerga por construção.

  Explicit choice: (a) rodar `/screen-inventory 05` em extension run para acrescentar o verbo de carregar-mais e o componente de controle; (b) declarar no `/plan-resolve` que o `plan-build` deriva a paginação da revisão do TD-04, tratando o inventário como incompleto nesse ponto; (c) reverter para lista fechada de 4, o que descartaria a resolução da `AMB-1`.

### Ambiguities

_None._ A `AMB-1` foi fechada pela revisão no `TD-04`, que fixou o recorte em 4 por página com paginação.

### Missing Decisions

_None._ Os seis TDs da fase estão decididos.

**Nota sobre as quatro capabilities sem TD em `## Capability Coverage`** _(inalterada desde a segunda rodada)_. O sub-tipo mecânico "uncovered bullet" encontraria quatro linhas com `—`, mas nenhuma é decisão faltante, e o `context.md` carrega a justificativa na própria célula: "Layout da página" é composição de primitivos; "Descrição do vídeo com expansão/recolhimento" é comportamento de UI sem alternativa relevante; "Acesso anônimo" e "Vídeos unlisted" são resolvidas por `video-channel-management/TD-02`, já implementado.

**Decisão #29 — não dispara, mas por julgamento, e a ressalva permanece.** A cobertura substantiva é inequívoca: `next-frontend-openapi-typing/TD-01..TD-05` decidem a cadeia inteira, e desde a PR #8 existe um workflow de CI que falha o build quando spec e tipos divergem. **Lida ao pé da letra, porém, a checagem dispararia:** a condição 3 exige um TD com `Scope: Cross-layer | Repo-wide`, e os cinco do `openapi-typing` são `Scope: Frontend`. Pior, o `## Inherited Decisions Detail` **não carrega coluna de Scope**, então o estágio não teria como aplicar esse filtro a TDs herdados nem que quisesse. Não emiti a `MD` porque seria falso positivo; registro a fragilidade pela terceira rodada seguida.

### Dependency Gaps

_None._

Reverificado com os dois TDs novos decididos: o `@nestjs/throttler` que o `TD-05` usa está instalado e configurado desde a Fase 02 — e, como o `ICC-1` estabeleceu, seu guard já é global; o `@playwright/test` que o `TD-06` usa está instalado no `next-frontend`, com 9 specs E2E em `tests/`; a fundação de MSW está decidida em `next-frontend-msw-foundation`. `views_count` existe desde a Fase 04; a assinatura de URL já respeita rascunho e visibilidade.

**Limite declarado deste check, mantido das rodadas anteriores.** Este estágio lê apenas o `context.md`. Toda conclusão aqui é derivada de documento, não do disco — e a segunda rodada já produziu um falso "já existe" sobre a cadeia do `openapi-typing` e seu CI. As dependências devem ser reconfirmadas contra o repositório no `plan-build`.

### Inherited Constraint Conflicts

_None._

A `ICC-1` foi fechada pela revisão anexada ao `phase-02-auth/TD-08`. Reexaminados os seis TDs decididos contra as convenções e os TDs herdados: o `TD-05` agora **concorda** com o `TD-08` corrigido, porque adota o mesmo `@nestjs/throttler` e parte do escopo global real. O `TD-02` elevar a validade da URL para 6 h sobre o `upload-processing/TD-08` segue não sendo conflito — aquele TD decidiu o mecanismo e explicitamente não fixou prazo.

### Unresolved Open Questions

_None._

Os seis TDs estão decididos, então a sub-checagem de TD pendente não produz nada. As cinco Open Questions do inventário continuam no digest do `context.md` — o resolve não edita arquivos de inventário —, mas todas as cinco constam como `resolved` no frontmatter desta revisão, então a regra de merge do Step 3 as descarta em vez de reemiti-las.

### UI Coverage Gaps

_None._

Reexaminada contra os seis TDs decididos. As três capabilities cobertas por TD decidido — "Player de vídeo…", "Contagem de visualizações" e "Sugestões de vídeos da mesma categoria na sidebar" — têm verbo no join. "Botão de download do vídeo", coberta pelo `TD-02`, também tem. As quatro sem TD não satisfazem a condição 1.

O caso do "ver mais" **não** cai aqui, pelo motivo explicado em `IC-2`: a capability tem verbo; o que falta é uma interação dentro dela.

## Resolved Issues

- **MD-1** _(resolved_by video-watch-page/TD-05)_ — Endpoint público de contagem sem decisão de proteção contra abuso. Fechada pelo `/research` de 2026-09-26. A investigação derrubou a premissa da issue: o endpoint **já estava protegido** pelo throttler global herdado da Fase 02.
- **MD-2** _(resolved_by video-watch-page/TD-06)_ — Sem decisão de como os testes fingem os bytes de vídeo do object storage. Fechada pelo `/research` de 2026-09-26. O problema era de camada, não de configuração: o MSW do E2E roda no Node do Next e nunca veria uma requisição do navegador, e o `jsdom` define `play()`, `pause()` e `load()` como `notImplementedMethod`.
- **OQ-7** _(resolved_by video-watch-page/TD-05)_ — TD-05 decidido: **Option B**, `@Throttle()` na rota a 30 req/60 s por IP, storage em memória. Redis declarado como caminho para multi-instância.
- **OQ-8** _(resolved_by video-watch-page/TD-06)_ — TD-06 decidido: **Option A + C**. Fachada de mídia injetável cobre o gatilho na camada de componente; `page.route()` na origem do storage em **um único** E2E de fumaça.
- **AMB-1** _(resolved_by video-watch-page/TD-04)_ — Recorte da sidebar fixado em 4 por página com "ver mais" paginando, por revisão no TD-04. _Efeito colateral que virou `IC-2` nesta rodada: o inventário não descreve o controle de paginação._
- **ICC-1** _(resolved_by phase-02-auth/TD-08)_ — Revisão anexada corrigindo a premissa factual: `APP_GUARD` é global independentemente do módulo que o declara. Fecha o ciclo do erro que induziu a MD-1.
- **OQ-6** _(resolved_by video-watch-page/TD-02, video-watch-page/TD-03)_ — Validade de 6 h **confirmada**; limiar de reprodução **revisado de 5 s para 10 s**. _Efeito colateral que virou `IC-1` nesta rodada: o verbo do inventário ainda cita 5 s._
- **OQ-1** _(resolved_by clarification)_ — Re-extração do Figma aceita como dívida registrada, sem bloquear a fase.
- **OQ-2** _(resolved_by clarification)_ — Cobertura por componente Local-interactive é válida sem verbo de intenção.
- **OQ-3** _(resolved_by clarification)_ — Estados sem desenho implementados seguindo os padrões da Fase 04. São cinco, incluindo a sidebar paginando, acrescentada pela resolução da AMB-1.
- **OQ-4** _(resolved_by clarification)_ — O `not-found-card` reusa `components/ui/card.tsx`.
- **OQ-5** _(resolved_by clarification)_ — Rótulo "MAIS EM {CATEGORIA}" nas sete categorias nomeadas, "MAIS VÍDEOS" no catch-all "Outros".
