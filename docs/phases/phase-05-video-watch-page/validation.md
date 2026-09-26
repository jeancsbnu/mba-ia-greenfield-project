---
kind: phase
name: phase-05-video-watch-page
status: dirty
issue_count: 9
sources_mtime:
  docs/phases/phase-05-video-watch-page/context.md: "2026-09-26T10:22:43-03:00"
  docs/decisions/technical-decisions-video-watch-page.md: "2026-09-24T23:15:59-03:00"
issues:
  - id: AMB-1
    status: open
    summary: "Quantidade de sugestões na sidebar não é definida por nenhuma fonte"
  - id: MD-1
    status: open
    summary: "Endpoint público de contagem sem decisão de proteção contra abuso"
  - id: MD-2
    status: open
    summary: "Sem decisão de como os testes fingem os bytes de vídeo do object storage"
  - id: OQ-1
    status: open
    summary: "Re-extração do Figma pendente; node-ids dos filhos ausentes no inventário"
  - id: OQ-2
    status: open
    summary: "Capability da descrição é coberta por componente local, sem verbo"
  - id: OQ-3
    status: open
    summary: "Sem desenho: descrição expandida, sidebar vazia, loading e erro"
  - id: OQ-4
    status: open
    summary: "not-found-card reusa components/ui/card.tsx ou é markup próprio?"
  - id: OQ-5
    status: open
    summary: "Rótulo da sidebar para as 8 categorias e para o valor Outros"
  - id: OQ-6
    status: open
    summary: "TD-02 (6 h) e TD-03 (5 s) marcam os valores como premissa a confirmar"
advisories: []
---

# phase-05-video-watch-page — Validation

## Findings

_Segunda rodada, contra o `context.md` regenerado em 2026-09-26 com `next-frontend-openapi-typing` e `next-frontend-msw-foundation` confirmados no correlator. As 8 issues da rodada anterior seguem abertas e mantêm seus IDs; uma nova (`MD-2`) foi revelada justamente por ter o MSW foundation no contexto._

### Inconsistencies

_None._

Verificado de novo: nenhuma capability do escopo contradiz um TD decidido; os quatro TDs não implicam comportamentos mutuamente exclusivos; todo `Capability:` cita bullet presente no escopo; os sete verbos do `## UI Inventory` citam capabilities presentes em `## Capability Coverage`. A checagem de órfão de subseção não dispara — `video-watch-page/TD-01` tem `Scope: Frontend`, mas o `## UI Inventory` está populado.

Um caso que examinei e **não** é inconsistência: `video-watch-page/TD-02` entrega o arquivo por URL pré-assinada direto do storage, enquanto o modelo BFF estrito diz que o navegador nunca fala com a API NestJS. Não há conflito — o object storage não é a API NestJS, e `upload-processing/TD-08` estabeleceu essa rota de entrega justamente para tirar bytes de vídeo do processo da API.

### Ambiguities

- **AMB-1** — **Quantos vídeos a sidebar de sugestões mostra?** `video-watch-page/TD-04` decide a origem e a ordenação — mesma categoria, `published_at` desc, excluindo o vídeo atual, rascunhos e `unlisted` — mas não o tamanho do recorte, e nenhuma outra fonte o fixa. O Figma desenha quatro cards, o que é evidência de layout, não contrato. `video-channel-management/TD-06` fixou offset/limit, mas o próprio texto vincula a decisão apenas "às listagens desta fase", isto é, às da Fase 04. Sem isso o `plan-build` não consegue escrever nem o contrato do endpoint nem o SI da sidebar, e um implementador teria de perguntar. Explicit choice: fixar o limite (o desenho sugere 4) e dizer se a sidebar pagina ou é lista fechada — por revisão em `video-watch-page/TD-04` ou como parâmetro no contrato do endpoint durante o `plan-build`.

### Missing Decisions

- **MD-1** — **O endpoint público de contagem não tem decisão sobre abuso.** `video-watch-page/TD-03` decidiu `POST /videos/{publicId}/view`, disparado pelo player após 5 s, **sem deduplicação** — e a capability "Acesso anônimo à visualização de vídeos" torna esse endpoint acessível sem autenticação. É o primeiro endpoint de escrita público e não autenticado do projeto. Nada no escopo atual nem herdado o protege: `phase-02-auth/TD-08` escopou o `@nestjs/throttler` **apenas ao `AuthModule`**, via `APP_GUARD` de módulo. Na prática, um laço trivial infla a contagem de qualquer vídeo. Isto é distinto da deduplicação que o TD-03 recusou: aquela era sobre exatidão da métrica, esta é sobre abuso. Explicit choice: rodar `/research video-watch-page` para acrescentar um TD que decida a proteção — throttle por IP no módulo de vídeos, aceitar o risco explicitamente como o TD-03 aceitou a ausência de dedup, ou exigir algum sinal do cliente.

- **MD-2** — **Nenhuma decisão cobre como os testes fingem os bytes do vídeo.** _(Revelada nesta rodada: só ficou visível porque `next-frontend-msw-foundation` entrou no contexto.)_ A fundação de mocks do projeto tem uma fronteira precisa — o MSW finge a **API NestJS upstream**, e `next-frontend-msw-foundation/TD-04` roda com `onUnhandledRequest: "error"`. Mas esta é a primeira fase que reproduz mídia, e por `video-watch-page/TD-02` os bytes vêm do **object storage por URL pré-assinada**, que é outra origem e não passa pelo MSW. O `next-frontend/CLAUDE.md` registra o ponto como literalmente "TBD" ("Media streaming will eventually come from Object Storage (S3/MinIO) — TBD"); esta fase é quem torna o TBD vencido. Sem decisão, o `plan-build` não consegue escrever o SI de teste do player, e o E2E da tela ou tenta buscar uma URL inexistente ou silencia a verificação do player. Explicit choice: rodar `/research video-watch-page` para um TD com `Scope: Cross-layer` — servir um MP4 mínimo de fixture pelo ambiente de teste, apontar a URL pré-assinada para um arquivo local, interceptar a origem do storage no Playwright (permitido: a proibição de interceptação no navegador vale para `/api/**`, não para o storage), ou declarar o player fora do escopo de asserção do E2E.

**Nota sobre as quatro capabilities sem TD em `## Capability Coverage`** _(inalterada em relação à rodada anterior)_. O sub-tipo mecânico "uncovered bullet" encontraria quatro linhas com `—`, mas nenhuma é decisão faltante:

| Capability | Onde se resolve |
|---|---|
| "Layout da página: vídeo principal + informações + sidebar com sugestões" | Composição de primitivos existentes; sem escolha técnica. Coberta por verbo no inventário |
| "Descrição do vídeo com expansão/recolhimento" | Comportamento de UI sem alternativa relevante |
| "Acesso anônimo à visualização de vídeos" | `video-channel-management/TD-02` + `assertServable`, já implementado |
| "Vídeos unlisted acessíveis apenas via link direto" | `video-channel-management/TD-02`; a exclusão da sidebar é regra de `video-watch-page/TD-04` |

**Decisão #29 (sincronização de contrato FE↔BE) — o alerta da rodada anterior está resolvido.** Antes a checagem passava por correspondência acidental de keyword em `video-channel-management/TD-01`, e eu sinalizei que o doc que de fato decide a estratégia estava fora do contexto. Com `next-frontend-openapi-typing` confirmado, a cobertura agora é real e explícita: TD-01 fixa `openapi-typescript` + `openapi-fetch` com `paths` como âncora única de contrato, TD-02 o `openapi.json` commitado mais script de sync, TD-03 a checagem de frescor no CI cobrindo spec e tipos, TD-04 o `lib/api/contracts.ts` como único importador de `paths`, e TD-05 os handlers MSW tipados pelo mesmo símbolo. Os payloads novos desta fase — contagem de view e sugestões — atravessam essa cadeia com as regras visíveis ao `plan-build`.

### Dependency Gaps

_None._

Verificado: `views_count` existe desde a Fase 04 (`video-channel-management/TD-05`, criado sem incremento, e esta fase é a dona do incremento); a assinatura de URL já respeita rascunho e visibilidade (revisão de 2026-09-20 em `video-channel-management/TD-02`); a rota `/@{nickname}` existe desde a Fase 04 (`TD-08`); `components/videos/video-card.tsx` está em disco. Com o `openapi-typing` agora no contexto, conferi também a cadeia que ele exige — `openapi.json` commitado, script de sync e workflow de frescor no CI — e ela já existe. O índice por categoria que o `TD-04` menciona e o `response-content-disposition` que o `TD-02` exige não existem ainda, mas são trabalho **desta** fase, não pendência de fase anterior.

### Inherited Constraint Conflicts

_None._

Reexaminado contra os dois docs recém-incorporados. `next-frontend-openapi-typing/TD-04` exige que só `lib/api/contracts.ts` importe `paths` — os contratos novos desta fase se acomodam nisso sem atrito. `next-frontend-msw-foundation/TD-01` pede um arquivo de handlers por domínio, e os endpoints desta fase caem no domínio `videos`, que já existe. O ponto mais próximo de conflito continua sendo `video-watch-page/TD-02` elevar a validade da URL pré-assinada de 300 s para 6 h sobre `upload-processing/TD-08`: não é conflito, porque o TD-08 decidiu o **mecanismo** e explicitamente não fixou prazo.

A tensão entre a fronteira do MSW e os bytes vindos do storage **não** foi classificada aqui: não é contradição entre decisões, é ausência de decisão — está em `MD-2`.

### Unresolved Open Questions

- **OQ-1** — Re-extração do Figma pendente: confirmar as duas tabelas do inventário contra `get_design_context` quando a cota voltar, e preencher os node-ids dos filhos. O `Status` foi marcado `Validated` porque os sete campos do Output Contract estão presentes, mas a confirmação independente segue devendo. Resolution: resolver via `/plan-resolve video-watch-page`, ou re-extrair antes.
- **OQ-2** — "Descrição do vídeo com expansão/recolhimento" é atendida por componente Local-interactive e portanto **não gera verbo de intenção**. A regra `UIG-N` não dispara aqui (ver UI Coverage Gaps), mas a questão de fundo — a regra do `screen-inventory` que espera um verbo por capability — continua aberta em nível de pipeline. Resolution: resolver via `/plan-resolve video-watch-page`.
- **OQ-3** — Estados sem desenho: descrição expandida, sidebar vazia, loading do player e erro de carregamento. Os dois primeiros são exigidos por capability e por `TD-04`; os dois últimos repetem a omissão da Fase 04. Resolution: resolver via `/plan-resolve video-watch-page`, ou desenhar no Figma e rodar `/screen-inventory 05` em extension run.
- **OQ-4** — O `not-found-card` reusa `components/ui/card.tsx` ou é markup próprio? Resolution: resolver via `/plan-resolve video-watch-page`.
- **OQ-5** — Rótulo da categoria na sidebar: o desenho traz "MAIS EM EDUCAÇÃO" com a categoria interpolada; confirmar o texto para as oito categorias do `video-channel-management/TD-10` e o que aparece quando a categoria é "Outros". Resolution: resolver via `/plan-resolve video-watch-page`.
- **OQ-6** — Dois valores decididos estão marcados no próprio decisions doc como **"premissa a confirmar"**: a validade de **6 h** da URL pré-assinada (`TD-02`) e o limiar de **5 s** de reprodução efetiva (`TD-03`). Os TDs estão `decided`, então não são pendências de decisão, mas o texto pede confirmação explícita e os dois números entram direto na implementação. Resolution: confirmar ou ajustar via `/plan-resolve video-watch-page`, que registra o resultado como revisão nos TDs.

### UI Coverage Gaps

_None._

A checagem roda — o `## UI Inventory` está populado —, e nenhuma capability satisfaz as três condições. Vale explicitar o caso que parece gap e não é: **"Descrição do vídeo com expansão/recolhimento" não tem verbo**, mas também **não tem TD**, e a condição 1 do `UIG-N` exige cobertura por TD decidido. A preocupação levantada pelo inventário fica registrada como `OQ-2`, não como lacuna de cobertura de UI.

_(`## Capability Consistency` e `## Cross-slice Advisories` omitidas: a Fase 05 tem exatamente um slice — `S_phase ∩ S_5` = 1 — então a Check 8 é suprimida por construção.)_

## Resolved Issues

_No issues resolved yet._
