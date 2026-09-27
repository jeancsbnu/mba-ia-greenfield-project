---
kind: phase
name: phase-05-video-watch-page
status: dirty
issue_count: 0
sources_mtime:
  docs/phases/phase-05-video-watch-page/context.md: "2026-09-26T21:34:33-03:00"
  docs/decisions/technical-decisions-video-watch-page.md: "2026-09-26T21:18:14-03:00"
issues:
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

_Todas as 10 issues abertas foram resolvidas no `/plan-resolve` de 2026-09-26 e migraram para `## Resolved Issues`. O campo `status` continua `dirty` por contrato — só o `/plan-validate` emite veredito; rode-o para reconfirmar._

### Inconsistencies

_None._

### Ambiguities

_None._

### Missing Decisions

_None._

### Dependency Gaps

_None._

**Limite declarado deste check, preservado da rodada anterior.** Este estágio lê apenas o `context.md`. Toda conclusão de Dependency Gap aqui é derivada de documento, não do disco — e a rodada anterior já produziu um falso "já existe" sobre a cadeia do `openapi-typing` e seu CI. As dependências devem ser reconfirmadas contra o repositório no `plan-build`.

### Inherited Constraint Conflicts

_None._

### Unresolved Open Questions

_None._

### UI Coverage Gaps

_None._

## Resolved Issues

- **MD-1** _(resolved_by video-watch-page/TD-05)_ — Endpoint público de contagem sem decisão de proteção contra abuso. Fechada pelo `/research` de 2026-09-26. A investigação derrubou a premissa da issue: o endpoint **já estava protegido** pelo throttler global herdado da Fase 02; a decisão real passou a ser se o limite de 10/60 s, calibrado para login, serve a um endpoint de navegação.
- **MD-2** _(resolved_by video-watch-page/TD-06)_ — Sem decisão de como os testes fingem os bytes de vídeo do object storage. Fechada pelo `/research` de 2026-09-26. A investigação mostrou que o problema é de camada, não de configuração: o MSW do E2E roda no Node do Next e nunca veria uma requisição feita pelo navegador, e o `jsdom` instalado define `play()`, `pause()` e `load()` como `notImplementedMethod` sem disparar `timeupdate`.
- **OQ-7** _(resolved_by video-watch-page/TD-05)_ — TD-05 decidido: **Option B**, `@Throttle()` dedicado na rota com storage em memória, a **30 req/60 s por IP**, sobrepondo o default global de 10/60 s. A Option C (Redis) fica declarada como o caminho para quando houver mais de uma instância — é uma troca do `storage` do módulo, sem tocar nas rotas. Os 30/60 s entram no doc marcados como premissa a confirmar.
- **OQ-8** _(resolved_by video-watch-page/TD-06)_ — TD-06 decidido: **Option A + C**. A fachada de mídia injetável é a base e cobre o gatilho de reprodução do TD-03 na camada de componente, de forma determinística; o `page.route()` na origem do storage se aplica a **um único** E2E de fumaça, não à suíte inteira. Limite aceito junto com a decisão: a fachada é superfície de produção existindo em parte para o teste.
- **AMB-1** _(resolved_by video-watch-page/TD-04)_ — Recorte da sidebar fixado em **4 vídeos por página, com "ver mais" paginando**, registrado como revisão no TD-04 (mesma Option A — origem e ordenação inalteradas). O contrato do endpoint expõe offset/limit, seguindo o padrão de `video-channel-management/TD-06`. Consequência assumida e encaminhada em OQ-3: o estado de "ver mais" e o de sidebar carregando não existem no Figma.
- **ICC-1** _(resolved_by phase-02-auth/TD-08)_ — Revisão anexada ao `phase-02-auth/TD-08` corrigindo a premissa factual: `APP_GUARD` é global independentemente do módulo que o declara, e o escopo efetivo do throttler sempre foi a aplicação inteira. Mesma Option A, sem mudança de decisão. Fecha o ciclo do erro que induziu a MD-1 desta fase.
- **OQ-6** _(resolved_by video-watch-page/TD-02, video-watch-page/TD-03)_ — Os dois valores marcados como premissa foram tratados: a validade de **6 h** da URL pré-assinada foi **confirmada** e deixa de ser premissa (revisão no TD-02); o limiar de reprodução efetiva foi **revisado de 5 s para 10 s** (revisão no TD-03). O critério dos 10 s: exige intenção real de assistir sem penalizar vídeo curto, ao contrário dos 30 s da referência clássica, que zeraria a contagem de qualquer vídeo mais curto que isso.
- **OQ-1** _(resolved_by clarification)_ — Re-extração do Figma **aceita como dívida registrada, sem bloquear a fase**. O `/implement` consome a URL da tela, que existe e está correta; node-ids de filhos não são campo do Output Contract. A re-extração acontece quando a cota do MCP voltar.
- **OQ-2** _(resolved_by clarification)_ — Cobertura por componente **Local-interactive é válida sem verbo de intenção**. A ausência está correta: verbo de intenção descreve ida ao servidor, e expandir texto não vai a lugar nenhum. A tensão com a regra do `screen-inventory` fica registrada, mas não vira trabalho nesta fase.
- **OQ-3** _(resolved_by clarification)_ — Os estados sem desenho serão **implementados seguindo os padrões da Fase 04**, sem passar pelo Figma. São cinco: descrição expandida, sidebar vazia, sidebar paginando (novo, vindo da resolução de AMB-1), loading do player e erro de carregamento. Custo assumido: entram em produção sem revisão visual, e o "ver mais" é interação nova, não variação de componente existente.
- **OQ-4** _(resolved_by clarification)_ — O `not-found-card` **reusa `components/ui/card.tsx`**. Pode exigir override de classe para o radius 16 e a largura 520 do desenho.
- **OQ-5** _(resolved_by clarification)_ — Rótulo da sidebar: **"MAIS EM {CATEGORIA}"** nas sete categorias nomeadas, e **"MAIS VÍDEOS"** quando a categoria é o catch-all "Outros" — "MAIS EM OUTROS" é construção esquisita em pt-BR.
