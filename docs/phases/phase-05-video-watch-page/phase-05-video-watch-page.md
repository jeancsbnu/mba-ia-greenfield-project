---
kind: phase
name: phase-05-video-watch-page
test_specs_aware: true
sources_mtime:
  docs/phases/phase-05-video-watch-page/context.md: "2026-09-29T22:45:01-03:00"
  docs/decisions/technical-decisions-video-watch-page.md: "2026-09-29T21:26:00-03:00"
  docs/decisions/technical-decisions-next-frontend-openapi-typing.md: "2026-06-29T19:03:26-03:00"
  docs/decisions/technical-decisions-next-frontend-msw-foundation.md: "2026-06-29T19:03:26-03:00"
sources_hash:
  docs/phases/phase-05-video-watch-page/context.md: "71f919de97f4"
  docs/decisions/technical-decisions-video-watch-page.md: "8cde965b9bd0"
  docs/decisions/technical-decisions-next-frontend-openapi-typing.md: "dce35a1a5901"
  docs/decisions/technical-decisions-next-frontend-msw-foundation.md: "a53ada59d6a6"
---

# Phase 05 — Página de Visualização do Vídeo

## Objective

Entregar a página pública de visualização do vídeo: player com controles nativos alimentado por URL pré-assinada, informações e descrição do vídeo, sidebar de sugestões paginada da mesma categoria, botão de download e contagem de visualizações — toda ela acessível a visitante anônimo, inclusive para vídeos `unlisted` acessados por link direto.

---

## Step Implementations

### SI-05.0.1 — Custom-business simple: VideoOffIcon

**Description:** Criar o único ícone da fase que não existe em `components/icons/`, antes que a tela de not-found precise dele.

**Technical actions:**

1. Author `components/icons/video-off-icon.tsx` — componente SVG do glifo de câmera cortada (`video-off-icon` `68:77`, 28px), seguindo o padrão dos ícones existentes. O projeto **não usa biblioteca de ícones**: o SVG do Figma vira componente ali, conforme `next-frontend/CLAUDE.md`.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `video-off-icon.tsx` | Unit per testing-guide-next-frontend § "Icon (`components/icons/*`)" | _(nenhum — o guia classifica ícones como "None"; cobertos via consumidores)_ |

**Dependencies:** none

**Acceptance criteria:**

- `components/icons/video-off-icon.tsx` existe e exporta um componente que renderiza um `<svg>`.
- O arquivo compila com `docker compose exec next-frontend npx tsc --noEmit`.
- Nenhuma dependência nova de biblioteca de ícones aparece em `package.json`.

---

### SI-05.1 — Ajustar a emissão das URLs pré-assinadas

**Description:** Levar a validade das URLs de stream e download de 300 s para 6 h e acrescentar `filename` ao download, sem mexer no default do `StorageService`.

**Technical actions:**

1. Em `src/videos/videos.service.ts`, `getStreamUrl` passa a informar `expiresInSeconds` de **6 h** na chamada a `StorageService.getPresignedUrl` (per `video-watch-page/TD-02`). O default de 300 s do `StorageService` **não** muda — o TD é explícito que o prazo curto continua valendo para os demais contextos.
2. Em `getDownloadUrl`, informar a mesma validade de 6 h **e** trocar `responseContentDisposition: 'attachment'` por `attachment; filename="..."`, com o filename derivado do título do vídeo (per `video-watch-page/TD-02`, Clarification de 2026-09-24).
3. Expor a validade como constante nomeada no módulo de vídeos, para que o valor apareça uma vez só e os testes possam asseverá-lo.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `VideosService.getStreamUrl` | Unit: a chamada ao `StorageService` recebe a validade de 6 h (mock do storage) | `src/videos/videos.service.spec.ts` |
| `VideosService.getDownloadUrl` | Unit: validade de 6 h **e** `content-disposition` com `filename` derivado do título | `src/videos/videos.service.spec.ts` |
| `StorageService` | Integration: URL assinada com `responseContentDisposition` contendo `filename` é aceita pelo storage | `src/storage/storage.service.integration-spec.ts` |

**Dependencies:** none

**Acceptance criteria:**

- A URL devolvida por `getStreamUrl` continua válida após 5 min e antes de 6 h; a assinatura expira depois de 6 h.
- A URL devolvida por `getDownloadUrl` carrega `response-content-disposition` com `attachment` **e** um `filename` derivado do título do vídeo.
- URLs pré-assinadas emitidas por outros caminhos do projeto continuam com 300 s — o default do `StorageService` permanece inalterado.

---

### SI-05.2 — Endpoint público de detalhe do vídeo

**Route:** GET /videos/{publicId}/public
**Test Specs:** _pending /plan-test-specs_
**Authorization:** Anonymous para vídeo publicado (`public` ou `unlisted`); Owner para rascunho

**Description:** Servir os dados do vídeo a visitante anônimo — o que nenhuma rota existente faz, já que `GET /videos/{publicId}` é dono-apenas.

**Technical actions:**

1. Criar o handler `GET :publicId/public` em `src/videos/videos.controller.ts` com `@Public()`, `@CurrentUser() user?: JwtPayload` opcional e `assertServable(video, user?.sub)` — mesma guarda de `/stream` e `/download` (per `video-channel-management/TD-02`, revisão de 2026-09-20).
2. Montar a resposta conforme `### API Contracts → GET /videos/{publicId}/public`, reusando `getStreamUrl` e `getDownloadUrl` do `SI-05.1` para as duas URLs pré-assinadas de 6 h.
3. Incluir o bloco do canal dono (nickname + nome de exibição) e `viewsCount` a partir de `views_count`, que já existe na entidade desde a Fase 04 (`video-channel-management/TD-05`).
4. Declarar os decorators OpenAPI (`@ApiOperation`, `@ApiResponse` 200/404/409 com `ApiErrorEnvelope`) — o `openapi.json` commitado é a fonte do tier BFF e o CI de frescor cobre a sincronia.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `VideosController.getPublicVideo` | E2E: 200 anônimo para publicado; 404 para rascunho de terceiro; 200 para rascunho do dono | `test/videos.e2e-spec.ts` |
| `VideosService` | Unit: a projeção pública não vaza campos de dono (`upload_id`, `processing_error`, `storage_key`) | `src/videos/videos.service.spec.ts` |

**Dependencies:** SI-05.1 — as duas URLs pré-assinadas fazem parte desta resposta

**Acceptance criteria:**

- `GET /videos/{publicId}/public` sem `Authorization`, para um vídeo publicado, retorna `200` com `title`, `viewsCount`, `streamUrl` e `downloadUrl`.
- `GET /videos/{publicId}/public` para um vídeo em rascunho, sem token ou com token de outro usuário, retorna `404` com `error: "VIDEO_NOT_FOUND"` — indistinguível de vídeo inexistente.
- `GET /videos/{publicId}/public` para um `unlisted` publicado retorna `200` — a restrição de `unlisted` é ficar fora de listagens, não de acesso direto.
- A resposta não contém `upload_id`, `processing_error` nem `storage_key`.
- `GET /videos/{publicId}` (rota de status da Fase 03) continua exigindo posse e responde como antes.

---

### SI-05.3 — Endpoint de contagem de visualização

**Route:** POST /videos/{publicId}/view
**Test Specs:** _pending /plan-test-specs_
**Authorization:** Anonymous

**Description:** Primeiro endpoint de escrita público do projeto — incrementa `views_count` quando o player informa que houve reprodução efetiva.

**Technical actions:**

1. Criar o handler `POST :publicId/view` em `src/videos/videos.controller.ts` com `@Public()`, `@HttpCode(204)` e sem corpo (per `video-watch-page/TD-03`, Option B — endpoint dedicado disparado pelo player após o limiar).
2. Aplicar `@Throttle({ default: { limit: 30, ttl: 60000 } })` na rota, sobrepondo o default global de 10/60 s (per `video-watch-page/TD-05`, valor confirmado na Revisions de 2026-09-29). O `ThrottlerModule` e o `APP_GUARD` já existem em `src/auth/auth.module.ts` e valem globalmente — o `APP_GUARD` é global independentemente do módulo declarante, conforme a revisão de `phase-02-auth/TD-08`.
3. Incrementar `views_count` com `UPDATE ... SET views_count = views_count + 1` (incremento atômico no banco, não read-modify-write), após `assertServable`. Sem deduplicação por visitante nesta fase.
4. Padronizar o `429` no envelope `{ statusCode, error, message }` **ou** registrar a divergência: a `ThrottlerException` não é `DomainException`, então hoje não passa pelo `DomainExceptionFilter` e a resposta não carrega o campo `error`. Nenhum TD decide isso — ver `### Error Catalog → Lacuna conhecida no 429`.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `VideosController.registerView` | E2E: 204 anônimo; `views_count` incrementa em 1 | `test/videos.e2e-spec.ts` |
| Throttle da rota | E2E: a 31ª requisição dentro de 60 s do mesmo IP retorna 429 | `test/videos.e2e-spec.ts` |
| `VideosService.registerView` | Integration: incremento atômico sob duas chamadas concorrentes soma 2 | `src/videos/videos.service.integration-spec.ts` |

**Dependencies:** none

**Acceptance criteria:**

- `POST /videos/{publicId}/view` sem `Authorization`, para um vídeo publicado, retorna `204` e o `viewsCount` na leitura seguinte é o anterior + 1.
- A 31ª requisição do mesmo IP dentro de 60 s retorna `429`; a 30ª ainda retorna `204`.
- O orçamento de 30/60 s desta rota não altera o limite de 10/60 s das rotas de autenticação.
- `POST /videos/{publicId}/view` para rascunho de terceiro retorna `404` sem revelar a existência do vídeo.
- Duas chamadas concorrentes incrementam o contador em 2, não em 1.

---

### SI-05.4 — Endpoint de sugestões da sidebar

**Route:** GET /videos/{publicId}/suggestions
**Test Specs:** _pending /plan-test-specs_
**Authorization:** Anonymous

**Description:** Listar vídeos da mesma categoria para a sidebar, paginados, com as exclusões que o TD-04 fixou.

**Technical actions:**

1. Criar o handler `GET :publicId/suggestions` em `src/videos/videos.controller.ts` com `@Public()` e DTO de query com `offset`/`limit` validados per `### API Contracts → Validation Rules`.
2. Implementar a consulta em `src/videos/videos.service.ts`: mesma `category` do vídeo de referência, `published_at` desc, **excluindo** o vídeo atual, rascunhos e `unlisted` (per `video-watch-page/TD-04`).
3. Devolver `{ items, total }` — `total` é o que permite ao `SidebarLoadMore` saber quando não há mais páginas. Paginação offset/limit segue o padrão de `video-channel-management/TD-06`.
4. Declarar os decorators OpenAPI para que o contrato entre no `openapi.json`.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `VideosController.getSuggestions` | E2E: 200 anônimo com `limit` default 4; `offset` pagina corretamente | `test/videos.e2e-spec.ts` |
| Regra de exclusão | Integration: o vídeo de referência, rascunhos e `unlisted` nunca aparecem em `items` | `src/videos/videos.service.integration-spec.ts` |
| Ordenação | Integration: `items` vem em `published_at` desc | `src/videos/videos.service.integration-spec.ts` |
| Validação de query | E2E: `limit=0` e `offset=-1` retornam `400` com `error: "VALIDATION_ERROR"` | `test/videos.e2e-spec.ts` |

**Dependencies:** none

**Acceptance criteria:**

- `GET /videos/{publicId}/suggestions` sem parâmetros retorna `200` com no máximo 4 itens e um `total`.
- Nenhum item retornado é o próprio vídeo de referência, nem rascunho, nem `unlisted`.
- Os itens vêm ordenados por data de publicação decrescente.
- `offset=4` devolve a página seguinte sem repetir itens da primeira.
- Uma categoria sem outros vídeos publicados retorna `200` com `items: []` e `total: 0` — não é erro.
- `limit=0` retorna `400` com `error: "VALIDATION_ERROR"`.

---

### SI-05.5 — Route Handlers BFF da watch page

**Route:** GET /api/videos/{publicId} · POST /api/videos/{publicId}/view · GET /api/videos/{publicId}/suggestions
**Authorization:** Anonymous nas três

**Description:** Expor as três rotas same-origin que o browser consome, fazendo proxy para o upstream NestJS server-side conforme o modelo strict-BFF.

**Technical actions:**

1. Criar `app/api/videos/[publicId]/route.ts` — `GET` que faz proxy para `GET /videos/{publicId}/public` lendo a base em `env.API_URL` (server-only), pass-through da projeção pública (per `### API Contracts` → BFF tier).
2. Criar `app/api/videos/[publicId]/view/route.ts` — `POST` sem corpo, pass-through do `204` e do `429`.
3. Criar `app/api/videos/[publicId]/suggestions/route.ts` — `GET` com pass-through de `offset`/`limit` e de `{ items, total }`.
4. Tipar requests e respostas a partir de `paths` em `lib/api/types.gen.ts` via `lib/api/contracts.ts`, sem duplicar DTO à mão (per `next-frontend-openapi-typing/TD-01` e `TD-04`). Os três contratos só existem em `types.gen.ts` **depois** que `SI-05.2`/`SI-05.3`/`SI-05.4` entrarem no `openapi.json` e o `npm run openapi:types` rodar.
5. Acrescentar os handlers MSW de upstream em `mocks/` para as três rotas, reusando o conjunto compartilhado entre Vitest e instrumentation (per `next-frontend-msw-foundation/TD-01`).

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `app/api/videos/[publicId]/route.ts` | Integration per testing-guide-next-frontend § "Route handler" — handler chamado como função, MSW interceptando o upstream | `app/api/videos/[publicId]/__tests__/route.integration.test.ts` |
| `app/api/videos/[publicId]/view/route.ts` | Integration: pass-through de 204 e de 429 | `app/api/videos/[publicId]/view/__tests__/route.integration.test.ts` |
| `app/api/videos/[publicId]/suggestions/route.ts` | Integration: pass-through de `offset`/`limit` e de `{ items, total }` | `app/api/videos/[publicId]/suggestions/__tests__/route.integration.test.ts` |

Sem linha de E2E: estes SIs de Route Handler são cobertos por teste de integração inline com MSW, não por spec externa — por isso também não carregam `**Test Specs:**`.

**Dependencies:** SI-05.2, SI-05.3, SI-05.4 — os três contratos precisam existir no `openapi.json` antes de `types.gen.ts` poder tipá-los

**Acceptance criteria:**

- `GET /api/videos/{publicId}` devolve a mesma projeção pública do upstream, com `streamUrl` e `downloadUrl` presentes.
- `POST /api/videos/{publicId}/view` devolve `204` no caminho feliz e repassa `429` sem transformá-lo.
- `GET /api/videos/{publicId}/suggestions?offset=4&limit=4` repassa os parâmetros e devolve `{ items, total }`.
- Nenhum dos três handlers expõe a URL do upstream ao cliente — `env.API_URL` é lido apenas server-side.
- `git grep` não encontra nenhuma chamada direta à API NestJS a partir de Client Component nesta fase.

---

### SI-05.6.0 — Drift audit: Página de visualização do vídeo

**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=66-42
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Página de visualização do vídeo`

**Technical actions:**

1. **Drift audit** — invocar `figma:figma-implement-design` (handoff estreito) com:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=66-42
   - Reused DS components: `components/layout/site-navbar.tsx`, `components/auth/brand-logo.tsx`, `components/icons/streamtube-icon.tsx`, `components/ui/button.tsx`, `components/ui/avatar.tsx`, `components/icons/chevron-down-icon.tsx`, `components/videos/video-card.tsx`
   - Server-connected component names: `VideoWatchPage`, `VideoPlayer`, `VideoCard`, `SidebarLoadMore`
   - Target paths (contexto read-only): `app/videos/[publicId]/page.tsx` + `components/videos/*.tsx`

   Para cada componente da lista, diff de valor contra o arquivo em disco e classificação no enum de 4 valores. Escrever a seção `## Screen: video-watch-page — audited at SI-05.6.0` em `frontend-drift-report.md`. **Sem edição de código.**

   **Duas entradas que a auditoria já sabe que vai encontrar, e não deve tratar como descoberta:** o wordmark do `BrandLogo` no Figma é "EstúdioCriador", diferente da marca implementada — decidir `exception` e reusar o componente do DS; e os sete nós de controle do player (`67:45`, `67:48`, `67:49`, `67:54`, `67:55`, `67:50`, `67:5x`) são **ilustrativos**, não devem gerar componente nenhum (per `video-watch-page/TD-01`).

**Dependencies:** none

**Tests:** _(empty — audit-only; the report is the deliverable)_

**Acceptance criteria:**

- `frontend-drift-report.md` existe na pasta do plano com a seção `## Screen: video-watch-page` datada desta execução.
- Cada um dos 7 componentes da lista Reused DS tem exatamente uma linha na tabela, com Decision preenchida.
- Toda decisão `exception` carrega justificativa de uma linha.
- `git diff --name-only HEAD -- next-frontend` está vazio ao fim do SI.

---

### SI-05.6a — Tela de visualização do vídeo (visual shell)

**Route:** /videos/{publicId}
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=66-42
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Página de visualização do vídeo`
**Drift Report:** see `frontend-drift-report.md` → `## Screen: video-watch-page`

**Technical actions:**

1. **Aplicar as decisões de drift** — ler a seção do relatório para esta tela e aplicar cada linha mecanicamente (`auto-Edit`, `create`, `exception`/`skip`). Sem novo julgamento: a análise foi feita no `SI-05.6.0`.
2. **Geração do shell visual** — invocar `figma:figma-implement-design` com a URL do frame, a lista Reused DS (já refletindo as edições da ação 1), os nomes dos componentes server-connected e os target paths `app/videos/[publicId]/page.tsx` + `components/videos/video-player.tsx` + `components/videos/video-description.tsx` + `components/videos/sidebar-load-more.tsx`.

   **Não implementar os controles do player.** Os sete nós de controle no Figma são ilustrativos; o `<video controls>` nativo entrega play/pause, volume e progresso pelo navegador, e a parity visual não se aplica a essa faixa (per `video-watch-page/TD-01`).

**Dependencies:** SI-05.6.0

**Tests:** _(empty — shell smoke-gated by build AC; Unit tests live in SI-05.6b; E2E in /plan-test-specs spec)_

**Acceptance criteria:**

- `app/videos/[publicId]/page.tsx` e os três componentes sob `components/videos/` existem, exportam os componentes esperados e compilam com `docker compose exec next-frontend npx tsc --noEmit`.
- A renderização corresponde ao frame `66:42` dentro da tolerância do design system, **exceto** a faixa de controles do player, que é nativa do navegador por decisão.
- Nenhum import de runtime além da lista Reused DS.
- O wordmark exibido é o do componente do DS, não o texto "EstúdioCriador" do frame.

---

### SI-05.6b — Tela de visualização do vídeo (lógica & wiring)

**Test Specs:** _pending /plan-test-specs_
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Página de visualização do vídeo`

**Technical actions:**

1. **Estratégia de renderização** — `app/videos/[publicId]/page.tsx` fica Server Component: busca `GET /api/videos/{publicId}` server-side e recebe as duas URLs pré-assinadas. `VideoPlayer`, `VideoDescription` e `SidebarLoadMore` recebem `"use client"`; o player é a única fronteira de cliente **obrigatória**, porque o disparo da contagem depende do evento `timeupdate` (per `video-watch-page/TD-03`).
2. **Gatilho da contagem** — no `VideoPlayer`, acumular tempo de **mídia avançada** (não tempo de página aberta) e disparar `POST /api/videos/{publicId}/view` **uma única vez por montagem** ao cruzar **5 s**. Implementar atrás de uma **fachada de mídia injetável** sobre o elemento, para que o teste possa afirmar "logo abaixo do limiar não chama, logo acima chama uma vez só" sem depender de relógio real (per `video-watch-page/TD-06`, Option A). A fachada é um ponto fino de indireção — se começar a reimplementar o player, a decisão está sendo mal aplicada.
3. **Download sem chamada em tempo de clique** — o `DownloadButton` é um `<a>` sobre a `downloadUrl` que **já veio com a página**. Não emitir nada no clique (per `video-watch-page/TD-02`, Clarification de 2026-09-24).
4. **Paginação da sidebar** — `SidebarLoadMore` busca `GET /api/videos/{publicId}/suggestions?offset&limit=4` e **acrescenta** cards; some ou fica inerte quando `items.length` acumulado atinge `total`. Rótulo do heading: "MAIS EM {CATEGORIA}" nas sete categorias nomeadas, "MAIS VÍDEOS" no catch-all "Outros".
5. **Estados sem desenho** — implementar loading do player, sidebar vazia, sidebar carregando, sidebar sem mais páginas e erro de carregamento seguindo os padrões da Fase 04. Falha em `/suggestions` degrada a sidebar sem derrubar o player; `429` no `/view` é silencioso — a contagem é métrica, não função da página.

**Dependencies:** SI-05.6a + SI-05.5

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `components/videos/video-player.tsx` | Unit per testing-guide-next-frontend § "Client component" — com a fachada de mídia: abaixo do limiar não dispara; acima dispara exatamente uma vez; remontagem redispara | `components/videos/__tests__/video-player.test.tsx` |
| `components/videos/video-description.tsx` | Unit: alterna expandido/recolhido e reflete em `aria-expanded` | `components/videos/__tests__/video-description.test.tsx` |
| `components/videos/sidebar-load-more.tsx` | Unit: acrescenta página, estado carregando, e some ao atingir `total` | `components/videos/__tests__/sidebar-load-more.test.tsx` |

O E2E da página — inclusive o teste de fumaça com `page.route()` na **origem do storage** decidido no `video-watch-page/TD-06` (Option C) — é autorado externamente pelo `/plan-test-specs`. Esse `page.route()` mira o storage, **não** `/api/**`: o `next-frontend/CLAUDE.md` proíbe interceptar `/api/**` no browser porque isso curto-circuita os Route Handlers, e a proibição não alcança a origem do storage.

**Acceptance criteria:**

- Com reprodução acumulada abaixo de 5 s, nenhuma requisição a `/api/videos/{publicId}/view` é emitida; ao cruzar 5 s, exatamente uma é emitida.
- Uma segunda travessia do limiar na mesma montagem do player **não** emite nova requisição.
- Clicar em "Baixar vídeo" navega para a URL de download sem emitir requisição à API, e o arquivo salvo tem o nome derivado do título.
- "Ver mais" acrescenta até 4 cards por clique e desaparece quando o total acumulado atinge `total`.
- Uma categoria sem outros vídeos publicados renderiza o estado vazio da sidebar sem erro visível.
- Falha em `/api/videos/{publicId}/suggestions` mantém o player funcional.
- Um `429` em `/api/videos/{publicId}/view` não produz erro visível ao espectador.

---

### SI-05.7.0 — Drift audit: Vídeo não encontrado

**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=68-62
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Vídeo não encontrado`

**Technical actions:**

1. **Drift audit** — invocar `figma:figma-implement-design` (handoff estreito) com:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=68-62
   - Reused DS components: `components/layout/site-navbar.tsx`, `components/auth/brand-logo.tsx`, `components/icons/streamtube-icon.tsx`, `components/ui/button.tsx`, `components/ui/card.tsx`, `components/icons/video-off-icon.tsx`
   - Server-connected component names: _(nenhum)_
   - Target paths (contexto read-only): `app/videos/[publicId]/not-found.tsx`

   Escrever a seção `## Screen: video-not-found — audited at SI-05.7.0` em `frontend-drift-report.md`, consultando as decisões já registradas para `video-watch-page` (os quatro componentes de chrome são os mesmos — divergir aqui seria CONFLICT). **Sem edição de código.**

   O `not-found-card` entra na auditoria como `components/ui/card.tsx` porque a `OQ-4` resolveu reusar o primitivo; o inventário ainda marca `✗ / new` e é este plano que fixa o path.

**Dependencies:** SI-05.0.1 — o `VideoOffIcon` precisa existir em disco, senão a auditoria o classifica como `componente ausente` falso

**Tests:** _(empty — audit-only; the report is the deliverable)_

**Acceptance criteria:**

- `frontend-drift-report.md` ganha a seção `## Screen: video-not-found` datada desta execução, sem sobrescrever a seção da outra tela.
- Cada um dos 6 componentes tem exatamente uma linha com Decision preenchida.
- As decisões para os 4 componentes de chrome coincidem com as registradas em `## Screen: video-watch-page`, ou a linha carrega `CONFLICT` com justificativa.
- `git diff --name-only HEAD -- next-frontend` está vazio ao fim do SI.

---

### SI-05.7a — Tela de vídeo não encontrado (visual shell)

**Route:** /videos/{publicId} — estado not-found da rota (`not-found.tsx`), não uma rota própria
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=68-62
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Vídeo não encontrado`
**Drift Report:** see `frontend-drift-report.md` → `## Screen: video-not-found`

_Tela sem `SI-Xb` por aplicação da Decisão #33: os quatro critérios se verificam — nenhum componente server-connected, `Auth requirement: Anonymous`, mapping de Error Catalog vazio (esta tela **é** o tratamento de erro) e renderização RSC passiva sem estado nem I/O próprio._

**Technical actions:**

1. **Aplicar as decisões de drift** — ler a seção do relatório para esta tela e aplicar cada linha mecanicamente. Sem novo julgamento.
2. **Geração do shell visual** — invocar `figma:figma-implement-design` com a URL do frame `68:62`, a lista Reused DS e o target path `app/videos/[publicId]/not-found.tsx`.

   **O texto do corpo é regra de segurança, não copy.** Por `video-channel-management/TD-09`, o 404 (vídeo inexistente) e o 403 (rascunho de outro canal) precisam ser indistinguíveis — um erro específico revelaria que o vídeo existe em outro canal. Transcrever o texto desenhado, que cobre as três causas sem dizer qual se aplica. **Não criar variante por causa** e não trocar por "vídeo não existe".

**Dependencies:** SI-05.7.0 + SI-05.0.1

**Tests:** _(empty — pure presentational, smoke-gated by build/compile)_

**Acceptance criteria:**

- `app/videos/[publicId]/not-found.tsx` existe, exporta o componente padrão e compila com `docker compose exec next-frontend npx tsc --noEmit`.
- Um `GET /videos/{publicId}` para um `publicId` inexistente renderiza esta tela.
- Um `GET /videos/{publicId}` para um rascunho de outro canal renderiza **a mesma** tela, com **o mesmo** texto — sem nenhuma diferença observável em relação ao caso de vídeo inexistente.
- O botão "Voltar para o início" navega para `/`.
- A renderização corresponde ao frame `68:62` dentro da tolerância do design system.

---

## Technical Specifications

### API Contracts

Dois tiers. O **backend tier** (`nestjs-project/`) é a fonte dos contratos; o **BFF tier** (`next-frontend/`) é a projeção que o browser consome, conforme o modelo strict-BFF documentado em `next-frontend/CLAUDE.md`.

**Estado no repositório, verificado em 2026-09-29:** `GET /videos/{publicId}/stream` e `GET /videos/{publicId}/download` já existem e são `@Public()`. `GET /videos/{publicId}` existe mas é dono-apenas (`assertOwnership`, sumário "Get video status" — endpoint do fluxo de upload da Fase 03) e **não** serve a watch page. `POST /videos/{publicId}/view` e `GET /videos/{publicId}/suggestions` não existem.

#### Backend tier

#### GET /videos/{publicId}/public (SI-05.X)

Endpoint novo. Leitura pública do vídeo para visitante anônimo — a capability "Acesso anônimo à visualização de vídeos" e o verbo "Exibir o vídeo publicado e seus dados a qualquer visitante, sem exigir autenticação" não são servidos por nenhuma rota existente. Guardado por `assertServable` (mesma regra de `/stream` e `/download`, per `video-channel-management/TD-02` revisão de 2026-09-20): publicado `public` ou `unlisted` para qualquer chamador; rascunho só para o dono.

**Request headers:**
- Authorization: Bearer token — opcional; identifica o dono, que pode ler o próprio rascunho

**Response 200:**
- publicId: string
- title: string
- description: string | null
- durationSeconds: number | null
- category: string
- visibility: string
- publishedAt: string (ISO-8601) | null
- viewsCount: number
- thumbnailUrl: string | null
- channel: objeto com nickname e nome de exibição do canal dono
- streamUrl: string — URL pré-assinada, validade 6 h, entrega inline; consumida pelo `src` do `<video>`
- downloadUrl: string — URL pré-assinada sobre a **mesma chave de objeto**, validade 6 h, assinada com `response-content-disposition: attachment; filename="..."`

**As duas URLs vêm juntas nesta resposta, por decisão explícita** *(per video-watch-page/TD-02, Clarification de 2026-09-24)* — nenhuma chamada extra em tempo de clique. O motivo é restrição do navegador, não preferência: o atributo `download` do HTML **é ignorado em cross-origin**, e o arquivo vem do storage, que é outra origem. Só o `content-disposition` no lado do storage resolve, e como a assinatura cobre os query params isso obriga a duas URLs distintas. Consequência no frontend: o botão de download é **Local-interactive** — um `<a>` sobre uma URL que já veio com a página — e o verbo de emissão pertence ao Server Component.

**Error responses:**
- 404 quando o vídeo não existe, ou é rascunho pedido por quem não é o dono
- 409 quando o vídeo não está pronto para exibição

---

#### POST /videos/{publicId}/view (SI-05.X)

Endpoint novo, per `video-watch-page/TD-03` (Option B — endpoint dedicado disparado pelo player após o limiar). Público e não autenticado: é o primeiro endpoint de **escrita público** do projeto, o que motivou o `video-watch-page/TD-05`.

**Request headers:** nenhum obrigatório.

**Request body:** nenhum.

**Response 204:** No content.

**Rate limit:** `@Throttle()` dedicado na rota com **30 requisições por 60 s por IP** *(per video-watch-page/TD-05, Revisions de 2026-09-29 — valor confirmado)*, sobrepondo o default global de 10/60 s já registrado em `auth.module.ts` via `ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])` + `APP_GUARD`. Storage em memória; Redis fica declarado como caminho para quando houver mais de uma instância.

**Error responses:**
- 404 quando o vídeo não existe, ou é rascunho pedido por quem não é o dono
- 429 quando o limite de 30/60 s por IP é excedido

Sem deduplicação por visitante nesta fase, conforme a Option B escolhida.

---

#### GET /videos/{publicId}/suggestions (SI-05.X)

Endpoint novo, per `video-watch-page/TD-04`. Mesma categoria do vídeo atual, `published_at` desc, excluindo o vídeo atual, rascunhos e `unlisted`. Paginação offset/limit seguindo o padrão de `video-channel-management/TD-06`.

**Request query parameters:**
- offset: number, opcional — default 0
- limit: number, opcional — default **4** *(per video-watch-page/TD-04, Revisions de 2026-09-26 — 4 vídeos por página com "ver mais")*

**Response 200:**
- items: lista de vídeos com publicId, title, thumbnailUrl, durationSeconds, viewsCount, publishedAt e o canal dono
- total: number — total de sugestões elegíveis, para a paginação saber quando não há mais páginas

**Error responses:**
- 404 quando o vídeo de referência não existe, ou é rascunho pedido por quem não é o dono

---

#### Emissão das URLs pré-assinadas — deltas em `VideosService` (SI-05.X)

`getStreamUrl` e `getDownloadUrl` **já existem** e alimentam as rotas 302 `GET /videos/{publicId}/stream` e `/download` criadas na Fase 03. Esta fase não muda a assinatura nem o contrato dessas rotas, mas muda **dois parâmetros da emissão**, e passa a reusar os mesmos dois métodos na resposta de `/public`.

**Delta 1 — validade.** Hoje ambos usam o default de `StorageService.getPresignedUrl`, que é **`expiresInSeconds = 300`** (5 minutos). Passam a emitir com **6 h** *(per video-watch-page/TD-02, Revisions de 2026-09-26)*. O TD é explícito que **o prazo curto de 300 s continua valendo para os demais contextos** de URL pré-assinada — o prazo longo é específico da entrega ao player, então o default do `StorageService` **não** muda; quem passa a informar a validade é a chamada.

**Delta 2 — nome do arquivo no download.** Hoje `getDownloadUrl` passa o literal `responseContentDisposition: 'attachment'`, **sem `filename`**. O TD-02 especifica `attachment; filename="..."`, e o verbo do inventário pede a URL "assinada para forçar o salvamento **com o nome correto**". Passa a incluir um filename derivado do título do vídeo.

**Rotas 302 existentes:** contrato inalterado (404, 409 como hoje); herdam a validade de 6 h por serem os mesmos métodos. A watch page **não** as consome — ela usa as URLs que já vieram em `/public`.

---

#### BFF tier

> _BFF tier — contrato exposto ao browser. O navegador chama a rota same-origin; o Route Handler faz proxy para o upstream NestJS server-side, conforme o modelo strict-BFF de `next-frontend/CLAUDE.md`._

**Nota de proveniência.** A cadeia de contrato do projeto é `openapi.json` → `lib/api/types.gen.ts` → `paths` (`next-frontend/CLAUDE.md`). Para `/stream` e `/download` as linhas `*(derived: project contract source)*` vêm do `openapi.json` commitado, que já os contém. Para os três endpoints **novos** desta fase, a fonte derivada é o **backend tier acima** — eles entram no `openapi.json` quando forem implementados, e o CI de frescor (`.github/workflows/openapi-freshness.yml`) passa a cobri-los a partir daí.

#### GET /api/videos/{publicId} (SI-05.X)

**forwards-to:** `GET /videos/{publicId}/public` *(derived: project contract source — backend tier desta fase)*

**Request headers:** nenhum obrigatório do browser *(derived: project contract source)*

**Response 200 (FE-facing):** pass-through da projeção pública *(derived: project contract source; reshape: none)*

**Error responses (FE-facing):**
- 404: pass-through *(derived: project contract source)*
- 409: pass-through *(derived: project contract source)*

---

#### POST /api/videos/{publicId}/view (SI-05.X)

**forwards-to:** `POST /videos/{publicId}/view` *(derived: project contract source — backend tier desta fase)*

**Request body:** nenhum *(derived: project contract source)*

**Response 204 (FE-facing):** pass-through *(derived: project contract source; reshape: none)*

**Error responses (FE-facing):**
- 429: pass-through *(derived: project contract source)*
- 404: pass-through *(derived: project contract source)*

---

#### GET /api/videos/{publicId}/suggestions (SI-05.X)

**forwards-to:** `GET /videos/{publicId}/suggestions` *(derived: project contract source — backend tier desta fase)*

**Request query parameters:** `offset`, `limit` — pass-through *(derived: project contract source)*

**Response 200 (FE-facing):** pass-through de `{ items, total }` *(derived: project contract source; reshape: none)*

**Error responses (FE-facing):**
- 404: pass-through *(derived: project contract source)*

---

_Não há rota BFF para stream nem para download._ As duas URLs pré-assinadas chegam ao cliente dentro de `GET /api/videos/{publicId}`, por decisão explícita do `video-watch-page/TD-02` (Clarification de 2026-09-24: "nenhuma chamada extra em tempo de clique"). O `<video src>` e o `<a href>` apontam **direto ao storage**, que é outra origem — o modelo strict-BFF do `next-frontend/CLAUDE.md` governa o tráfego para a **API**, e o `upload-processing/TD-08` já decidiu que os **bytes do vídeo** não passam pela API nem pelo BFF.

---

#### Validation Rules — GET /videos/{publicId}/suggestions

- `offset`: opcional, inteiro, `>= 0`, default 0
- `limit`: opcional, inteiro, `>= 1`, default 4

### Authorization Matrix

`Anonymous` = sem `Authorization`. `Owner` = token válido cujo `sub` é dono do canal do vídeo. O guard global é `@Public()`-opt-out; `assertServable` (per `video-channel-management/TD-02`, revisão de 2026-09-20) é quem distingue rascunho de publicado.

| Endpoint | Anonymous | Authenticated | Owner |
|----------|-----------|---------------|-------|
| GET /videos/{publicId}/public — vídeo publicado (`public` ou `unlisted`) | ✓ | ✓ | ✓ |
| GET /videos/{publicId}/public — rascunho | ✗ | ✗ | ✓ |
| POST /videos/{publicId}/view | ✓ | ✓ | ✓ |
| GET /videos/{publicId}/suggestions | ✓ | ✓ | ✓ |
| GET /videos/{publicId}/stream — publicado | ✓ | ✓ | ✓ |
| GET /videos/{publicId}/stream — rascunho | ✗ | ✗ | ✓ |
| GET /videos/{publicId}/download — publicado | ✓ | ✓ | ✓ |
| GET /videos/{publicId}/download — rascunho | ✗ | ✗ | ✓ |
| GET /videos/{publicId} — "Get video status" (Fase 03, fora do escopo desta fase) | ✗ | ✗ | ✓ |

`unlisted` não tem coluna própria: a regra é "publicado, acessível a quem tiver o `publicId`" — a restrição de `unlisted` é ficar fora de **listagens**, o que nesta fase se materializa na exclusão feita pelo `/suggestions` (per `video-watch-page/TD-04`), não num controle de acesso.

---

### Error Catalog

**Forma do envelope** (herdada de `phase-02-auth/TD-07`, já implementada em `src/common/openapi/api-error-envelope.dto.ts`): `{ statusCode, error, message }`. O código de domínio vai no campo **`error`** — não `errorCode`. O rótulo `errorCode` na coluna abaixo nomeia o *conceito*; o campo no fio é `error`.

| error | HTTP | Trigger |
|-------|------|---------|
| VIDEO_NOT_FOUND | 404 | Vídeo inexistente, ou rascunho pedido por quem não é o dono, em qualquer das cinco rotas |
| VIDEO_NOT_READY | 409 | Vídeo existe mas não está pronto para exibição (processamento incompleto) |
| VALIDATION_ERROR | 400 | `offset` ou `limit` fora das Validation Rules em `/suggestions` |
| _(sem código de domínio)_ | 429 | Mais de 30 requisições por 60 s por IP em `POST /videos/{publicId}/view` |

**Lacuna conhecida no 429.** Os quatro primeiros passam pelo `DomainExceptionFilter`, que preenche `error` a partir do `errorCode` da `DomainException`. A `ThrottlerException` do `@nestjs/throttler` **não** é uma `DomainException`, então cai no filtro padrão do Nest e a resposta **não carrega** o campo `error` no formato acima. Nenhum TD decide isso — o `video-watch-page/TD-05` decidiu o mecanismo de limite, não a forma do erro. O SI correspondente deve padronizar o 429 no envelope ou registrar a divergência explicitamente; não inventei um código aqui.

### UI Contracts

#### Screen: Página de visualização do vídeo

**Route:** `/videos/{publicId}`
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=66-42 (node `FetKyb1V02WS5D6VCatK6t:66:42`)
**Purpose:** "Layout da página: vídeo principal + informações + sidebar com sugestões"

**Auth requirement:** Anonymous _(source: §Authorization Matrix — todas as rotas desta tela são ✓ para Anonymous no caso publicado; a linha de rascunho é Owner-only mas o caminho anônimo é o primário desta tela)_

**Rendering strategy:** Server Component (RSC) para a página, que busca o detalhe e recebe as duas URLs pré-assinadas. `VideoPlayer` é a **única fronteira `"use client"` obrigatória** da tela — o disparo da contagem depende do evento `timeupdate` do elemento _(per video-watch-page/TD-03, registrado nas Observations do inventário)_. `VideoDescription` e `SidebarLoadMore` também são client, por estado local e por interação, respectivamente.

**Reused DS components:**
- `components/layout/site-navbar.tsx` — SiteNavbar, herdado da fase 04, aqui na **variante anônima**
- `components/auth/brand-logo.tsx` — BrandLogo. **Drift de marca:** o wordmark no Figma é "EstúdioCriador", diferente da marca implementada; reusar o componente do DS, não o texto do frame
- `components/icons/streamtube-icon.tsx` — StreamtubeIcon
- `components/ui/button.tsx` — EntrarButton e DownloadButton
- `components/ui/avatar.tsx` — Avatar do canal; sem upload de avatar nesta fase, renderiza iniciais
- `components/icons/chevron-down-icon.tsx` — ChevronDownIcon
- `components/videos/video-card.tsx` — VideoCard, herdado da fase 04
- `app/videos/[publicId]/page.tsx (new)` — VideoWatchPage — Server Component dono da busca do detalhe e das duas URLs pré-assinadas
- `components/videos/video-player.tsx (new)` — VideoPlayer — `<video controls>` nativo com `src` na URL pré-assinada; dono do disparo da contagem, o que exige `"use client"`
- `components/videos/video-description.tsx (new)` — VideoDescription — expansão/recolhimento é estado puramente de cliente
- `components/videos/sidebar-load-more.tsx (new)` — SidebarLoadMore — novo no frame (2026-09-29), exigido pela revisão do TD-04

**Server-connected components:**
- `VideoWatchPage` — verbos: exibir o vídeo a qualquer visitante; compor a página; servir `unlisted` via link direto; emitir a URL pré-assinada de download | endpoint: `GET /api/videos/{publicId}` (§API Contracts → BFF tier) | reuse: `app/videos/[publicId]/page.tsx (new)`
- `VideoPlayer` — verbos: reproduzir o arquivo a partir da URL pré-assinada; registrar uma visualização após 5 s de reprodução efetiva | endpoints: `streamUrl` vinda de `GET /api/videos/{publicId}`; `POST /api/videos/{publicId}/view` (§API Contracts → BFF tier) | reuse: `components/videos/video-player.tsx (new)`
- `VideoCard` — verbo: exibir sugestões da mesma categoria, excluindo o vídeo atual, rascunhos e `unlisted` | endpoint: `GET /api/videos/{publicId}/suggestions` (§API Contracts → BFF tier) | reuse: `components/videos/video-card.tsx`
- `SidebarLoadMore` — verbo: carregar a próxima página de sugestões sob demanda | endpoint: `GET /api/videos/{publicId}/suggestions` com `offset`/`limit` (§API Contracts → BFF tier) | reuse: `components/videos/sidebar-load-more.tsx (new)`

**Behaviors:**

*Rendered states:*
- Loading: **sem desenho.** Não há skeleton do player nem das sugestões no frame — implementar seguindo os padrões da Fase 04 (decisão da `OQ-3`, estendida aos estados da sidebar pela `OQ-10`).
- Empty: **sem desenho.** Sidebar sem sugestões é alcançável de verdade, não caso de borda raro: o `TD-04` exclui o vídeo atual, rascunhos e `unlisted`, então uma categoria com um único vídeo publicado produz lista vazia.
- Success: player com `<video controls>` nativo, título, meta ("N visualizações · data"), faixa do canal, descrição recolhida, sidebar com 4 sugestões e o controle "Ver mais".
- Error: `notFound()` no segmento de rota leva à tela "Vídeo não encontrado" abaixo. Falha ao carregar sugestões **não** derruba a página — degrada a sidebar.

*Interactions:*
- `description-toggle` ("Mostrar mais") click → expande/recolhe `VideoDescription`. **Estado expandido sem desenho:** falta definir se a caixa cresce empurrando a sidebar, se ganha scroll próprio, e qual o rótulo aberto ("Mostrar menos").
- `SidebarLoadMore` click → busca a próxima página e **acrescenta** cards à sidebar. **Sem desenho** para o estado carregando (spinner, rótulo alternativo, botão desabilitado) nem para "não há mais páginas" (botão some ou fica inerte).
- `<video>` `timeupdate` acumulando 5 s de reprodução efetiva → dispara `POST /api/videos/{publicId}/view` **uma única vez** por montagem do player.
- `DownloadButton` click → navega para `downloadUrl`, que **já veio com a página**. Sem mutation, sem chamada em tempo de clique — é por isso que o componente é Local-interactive apesar de o download ser uma capability.

**Error Catalog → UX mapping:**

| error (from §Error Catalog) | UX treatment |
|-----------------------------|--------------|
| `VIDEO_NOT_FOUND` | `notFound()` → tela "Vídeo não encontrado" |
| `VIDEO_NOT_READY` | `notFound()` → mesma tela; o texto cobre "ainda não publicado" sem revelar a causa |
| _(429 no `/view`)_ | Silencioso. A contagem é métrica, não função da página — falhar o registro **não** deve produzir erro visível ao espectador |
| _(falha no `/suggestions`)_ | _TBD — implementer decides per screen_; a sidebar degrada sem derrubar o player |

**Client-side validation mirror:** não se aplica — nenhuma entrada de usuário nesta tela. Os únicos parâmetros validados (`offset`, `limit` em `/suggestions`) são gerados pelo próprio `SidebarLoadMore`, não digitados.

**Accessibility notes:**
- `<video controls>` nativo entrega a semântica de mídia do navegador — **não** reimplementar os controles. Os sete nós de controle no Figma (`player-controls` `67:45`, `progress-track` `67:48`, `progress-played` `67:49`, `play-affordance` `67:54`, `play-glyph` `67:55`, `volume-icon` `67:50`, `time-t…`) são **ilustrativos**; implementá-los contrariaria o `TD-01`. **Parity visual com o Figma não se aplica a essa faixa** — a aparência varia entre Chrome, Firefox e Safari por construção.
- `description-toggle` precisa de `aria-expanded` e controlar a região da descrição.
- `SidebarLoadMore` precisa anunciar o carregamento e o fim da lista a leitor de tela — os dois estados que não têm desenho.

---

#### Screen: Vídeo não encontrado

**Route:** `/videos/{publicId}` — estado not-found da rota de visualização (`not-found.tsx`), não uma rota própria
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=68-62 (node `FetKyb1V02WS5D6VCatK6t:68:62`)
**Purpose:** estado de erro de "Acesso anônimo à visualização de vídeos" — o que o visitante vê quando o vídeo pedido não pode ser mostrado

**Auth requirement:** Anonymous _(sem endpoint próprio; a decisão que traz o visitante até aqui é do segmento pai)_

**Rendering strategy:** Server Component (RSC). Nenhum estado, nenhum I/O próprio — renderizada pelo `notFound()` do segmento pai.

**Reused DS components:**
- `components/layout/site-navbar.tsx`, `components/auth/brand-logo.tsx`, `components/icons/streamtube-icon.tsx`, `components/ui/button.tsx` — todos `see screen: Página de visualização do vídeo`
- `components/ui/card.tsx` — para o `not-found-card`. O inventário marca `✗ / new`, mas a `OQ-4` resolveu **reusar o primitivo**, que já existe em disco; este plano fixa o path e a linha passa a `✓`
- `app/videos/[publicId]/not-found.tsx (new)` — VideoNotFound — renderizada pelo `notFound()` do segmento pai; não faz I/O próprio
- `components/icons/video-off-icon.tsx (new)` — VideoOffIcon — único ícone desta fase que não existe em `components/icons/`. O projeto **não usa biblioteca de ícones**: o SVG vira componente ali, conforme `next-frontend/CLAUDE.md`

**Server-connected components:** nenhum. A tabela de verbos do inventário está vazia por decisão explícita — nenhum elemento aqui lê ou escreve no backend, e inventar um verbo para preencher a tabela criaria um contrato falso.

**Behaviors:**

*Rendered states:*
- Success: card centralizado com badge, `VideoOffIcon`, heading "VÍDEO NÃO ENCONTRADO", texto de apoio e botão "Voltar para o início".

*Interactions:*
- `BackHomeButton` click → `<Link>` para `/`. Sem mutation.

**Error Catalog → UX mapping:** não se aplica — esta tela **é** o tratamento de erro.

**Client-side validation mirror:** não se aplica.

**Accessibility notes:**
- **O texto do corpo é regra de segurança, não copy.** Por `video-channel-management/TD-09`, o 404 (vídeo inexistente) e o 403 (rascunho de outro canal) precisam ser **indistinguíveis** — um erro específico revelaria que o vídeo existe em outro canal. O texto desenhado cobre as três causas (não existe, foi removido, ainda não publicado) sem dizer qual se aplica. **Não criar variante por causa** e não trocar o texto por "vídeo não existe".

---

### UI ↔ API Traceability Matrix

| Verb | Component | Screen | Endpoint (from API Contracts) | TD ref |
|------|-----------|--------|-------------------------------|--------|
| Exibir o vídeo publicado e seus dados a qualquer visitante, sem exigir autenticação | VideoWatchPage | /videos/{publicId} | `GET /api/videos/{publicId}` → forwards-to `GET /videos/{publicId}/public` | video-channel-management/TD-02 |
| Compor a página com o vídeo principal, suas informações e a sidebar de sugestões | VideoWatchPage | /videos/{publicId} | `GET /api/videos/{publicId}` → forwards-to `GET /videos/{publicId}/public` | — |
| Servir um vídeo `unlisted` quando acessado pelo link direto, mantendo-o fora das listagens | VideoWatchPage | /videos/{publicId} | `GET /api/videos/{publicId}` → forwards-to `GET /videos/{publicId}/public` | video-channel-management/TD-02, video-watch-page/TD-04 |
| Reproduzir o arquivo do vídeo a partir da URL pré-assinada | VideoPlayer | /videos/{publicId} | `streamUrl` no corpo de `GET /api/videos/{publicId}`; o `<video src>` aponta direto ao storage | video-watch-page/TD-01, video-watch-page/TD-02 |
| Registrar uma visualização após 5 s de reprodução efetiva | VideoPlayer | /videos/{publicId} | `POST /api/videos/{publicId}/view` → forwards-to `POST /videos/{publicId}/view` | video-watch-page/TD-03, video-watch-page/TD-05 |
| Exibir sugestões de vídeos da mesma categoria, excluindo o vídeo atual, rascunhos e `unlisted` | VideoCard na suggestions-sidebar | /videos/{publicId} | `GET /api/videos/{publicId}/suggestions` → forwards-to `GET /videos/{publicId}/suggestions` | video-watch-page/TD-04 |
| Carregar a próxima página de sugestões sob demanda | SidebarLoadMore | /videos/{publicId} | `GET /api/videos/{publicId}/suggestions?offset&limit` → forwards-to `GET /videos/{publicId}/suggestions` | video-watch-page/TD-04, video-channel-management/TD-06 |
| Emitir a URL pré-assinada de download do arquivo, assinada para forçar o salvamento com o nome correto | VideoWatchPage | /videos/{publicId} | `downloadUrl` no corpo de `GET /api/videos/{publicId}` | video-watch-page/TD-02 |

_Capabilities marked in `## Non-UI / Deferred Capabilities` are excluded from this matrix._ Nesta fase a seção está `_None._`, então nenhuma linha foi excluída.

_Duas linhas não citam rota BFF própria por decisão, não por lacuna: as URLs de stream e download chegam no corpo do detalhe (`video-watch-page/TD-02`, Clarification de 2026-09-24) e apontam direto ao storage (`upload-processing/TD-08`)._

---

## Dependency Map

```
SI-05.0.1 (root — bootstrap: VideoOffIcon)
└── SI-05.7.0 — depends on SI-05.0.1 (o ícone precisa existir em disco, senão a auditoria o vê como ausente)
    └── SI-05.7a — depends on SI-05.7.0 + SI-05.0.1

SI-05.1 (root — validade de 6 h + filename)
└── SI-05.2 — depends on SI-05.1 (as duas URLs pré-assinadas compõem a resposta de detalhe)

SI-05.3 (root — endpoint de contagem + @Throttle)
SI-05.4 (root — endpoint de sugestões)

SI-05.5 — depends on SI-05.2 + SI-05.3 + SI-05.4
          (os três contratos entram no openapi.json antes de types.gen.ts poder tipá-los)

SI-05.6.0 (root — drift audit da watch page)
└── SI-05.6a — depends on SI-05.6.0
    └── SI-05.6b — depends on SI-05.6a + SI-05.5
```

**Caminho crítico:** `SI-05.1 → SI-05.2 → SI-05.5 → SI-05.6b`. As quatro raízes (`SI-05.0.1`, `SI-05.1`, `SI-05.3`, `SI-05.4`, `SI-05.6.0`) são independentes entre si e podem correr em paralelo.

**Fronteira entre subprojetos:** `SI-05.1` a `SI-05.4` são `nestjs-project/`; `SI-05.0.1` e `SI-05.5` em diante são `next-frontend/`. A única aresta que cruza é `SI-05.5 → SI-05.{2,3,4}`, e ela é real, não convencional: `lib/api/types.gen.ts` é gerado a partir do `openapi.json`, que só ganha as três rotas quando o backend as expõe.

---

## Deliverables

- [ ] SI-05.0.1 — Custom-business simple: VideoOffIcon
- [ ] SI-05.1 — Ajustar a emissão das URLs pré-assinadas
- [ ] SI-05.2 — Endpoint público de detalhe do vídeo
- [ ] SI-05.3 — Endpoint de contagem de visualização
- [ ] SI-05.4 — Endpoint de sugestões da sidebar
- [ ] SI-05.5 — Route Handlers BFF da watch page
- [ ] SI-05.6.0 — Drift audit: Página de visualização do vídeo
- [ ] SI-05.6a — Tela de visualização do vídeo (visual shell)
- [ ] SI-05.6b — Tela de visualização do vídeo (lógica & wiring)
- [ ] SI-05.7.0 — Drift audit: Vídeo não encontrado
- [ ] SI-05.7a — Tela de vídeo não encontrado (visual shell)

**Per-screen deliverables:**

- [ ] Página de visualização do vídeo (`/videos/{publicId}`) é roteável
- [ ] Página de visualização do vídeo renderiza os estados de loading, sucesso e erro — inclusive os cinco que não têm desenho (descrição expandida, sidebar vazia, sidebar carregando, sidebar sem mais páginas, loading/erro do player)
- [ ] Página de visualização do vídeo passa nos testes de componente (`components/videos/__tests__/*.test.tsx`)
- [ ] Vídeo não encontrado renderiza pelo `notFound()` do segmento pai, com texto indistinguível entre 404 e rascunho de terceiro

**Full test suites:**

- [ ] Backend tests pass (`docker compose exec nestjs-api npm test -- --runInBand`)
- [ ] Backend E2E tests pass (`docker compose exec nestjs-api npm run test:e2e`)
- [ ] Backend type-check passes (`docker compose exec nestjs-api npx tsc --noEmit`)
- [ ] Backend lint passes (`docker compose exec nestjs-api npm run lint`)
- [ ] Frontend tests pass (`docker compose exec next-frontend npm test`)
- [ ] Frontend type-check passes (`docker compose exec next-frontend npx tsc --noEmit`)
- [ ] Frontend lint passes (`docker compose exec next-frontend npm run lint`)
- [ ] Frontend E2E pass (`npx playwright test` — **no host**, não dentro de container)
- [ ] `openapi.json` e `lib/api/types.gen.ts` em dia (`scripts/sync-openapi.sh` + `npm run openapi:types` sem diff — o mesmo que `.github/workflows/openapi-freshness.yml` verifica)

_As suítes de backend e frontend nunca rodam em paralelo, e a de backend exige `--runInBand`: as suítes de integração e e2e compartilham um único banco de teste._
