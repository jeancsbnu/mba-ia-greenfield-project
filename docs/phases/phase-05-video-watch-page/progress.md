# phase-05-video-watch-page — Progress

**Status:** completed
**SIs:** 11/11 completed

### SI-05.0.1 — Custom-business simple: VideoOffIcon
- **Status:** completed
- **Tests:** no tests
- **Observations:**
  - O cache do Figma (`docs/figma-cache/.../68-62.json`) traz a estrutura do no `68:77` (frame de 28px, tres VECTOR com stroke `#7a6e65`) mas nao a geometria dos paths. Autorei o glifo na composicao Lucide `video-off` (corpo + cunha + barra), que casa com os tres vetores, seguindo o precedente ja em repo de `components/icons/eye-off-icon.tsx` — que tambem e geometria Lucide stroke-based. Nenhuma chamada nova ao MCP do Figma foi gasta.
  - `viewBox` 0 0 24 24 e `stroke="currentColor"` seguem o padrao dos icones stroke-based do projeto; o Figma desenha a 28px e a cor vem do token no call site.
  - Os containers do projeto estavam parados; subi `next-frontend` via `docker compose up -d` a partir de `next-frontend/` (os compose files sao por subprojeto, nao ha um na raiz). Os containers `bs-*` de outro projeto nao foram tocados.

### SI-05.1 — Ajustar a emissao das URLs pre-assinadas
- **Status:** completed
- **Tests:** 25 passing (21 em `videos.service.spec.ts`, 4 em `storage.service.integration-spec.ts`) — 5 deles novos deste SI
- **Observations:**
  - A constante da validade virou `src/videos/videos.constants.ts` (`PLAYBACK_URL_TTL_SECONDS`), seguindo a convencao ja existente de `src/auth/auth.constants.ts` e `src/mail/mail.constants.ts`.
  - O plano nao especifica como derivar o filename do titulo. Implementei `buildDownloadFilename` como funcao de modulo em `videos.service.ts`: NFD + remocao de diacriticos, nao-alfanumerico vira hifen, corte em 100 chars, extensao vinda da `storage_key`, e fallback para o `public_id` quando o titulo nao tem nenhum caractere utilizavel. As tres regras estao cobertas por teste.
  - O default de 300 s do `StorageService` nao foi tocado — quem informa a validade longa e a chamada, conforme o TD-02.

### SI-05.2 — Endpoint publico de detalhe do video
- **Status:** completed
- **Tests:** 27 passing (22 em `videos.service.spec.ts`, 5 em `test/videos-public-detail.e2e-spec.ts`)
- **Observations:**
  - A linha E2E da Tests table do SI aponta para `test/videos.e2e-spec.ts`, **que nao existe no repo** — a pasta `test/` usa um arquivo por fluxo (`videos-detail`, `videos-stream-visibility`, ...). Os tres casos que essa linha pedia (200 anonimo, 404 rascunho de terceiro, 200 rascunho do dono) estao cobertos pelos cenarios 1.1 e 1.3 do spec, no `target_file` correto `test/videos-public-detail.e2e-spec.ts`. Nao dupliquei: a linha inline estava obsoleta diante do spec.
  - A projecao publica virou `VideosService.toPublicDetail` com um DTO proprio (`PublicVideoDetailResponse`), separado do `VideoDetailResponse` do dono. Unificar os dois faria um campo acrescentado no painel do dono vazar na pagina publica.
  - Precisei de `ChannelsService.findByIdOrFail` — nao havia lookup de canal por id, so por nickname e por user. Fica no modulo de canais, nao no de videos, por responsabilidade unica.
  - Os dois DTOs novos foram registrados em `extraModels` do `swagger-document.ts`; sem isso o `getSchemaPath` nao resolve e o `openapi.json` sai sem o schema.
  - O `openapi.json` **ainda nao foi regerado** — a regeneracao acontece no SI-05.5, quando as tres rotas desta fase ja existirem, conforme o Dependency Map.

### SI-05.3 — Endpoint de contagem de visualizacao
- **Status:** completed
- **Tests:** 14 passing (1 em `throttler-exception.filter.spec.ts`, 9 em `videos.service.integration-spec.ts`, 4 em `test/videos-view-count.e2e-spec.ts`)
- **Observations:**
  - **Acao tecnica 4 — decisao do usuario: padronizar.** Criei `src/common/filters/throttler-exception.filter.ts`, registrado em `main.ts`, mapeando `ThrottlerException` para `{ statusCode: 429, error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }`. Alcance e global (inclui as rotas de auth); nenhum teste existente afirmava a forma do corpo do 429, so o status, entao nada quebrou. Fecha a "Lacuna conhecida no 429" do Error Catalog. **O Error Catalog do plano ainda registra a lacuna como aberta** — vale corrigir num passe de documentacao.
  - Os e2e que reproduzem a config do `main.ts` precisam agora incluir o `ThrottlerExceptionFilter` tambem. Fiz isso no arquivo novo; os e2e antigos nao foram tocados porque so afirmam o status 429.
  - A linha E2E da Tests table aponta de novo para `test/videos.e2e-spec.ts`, inexistente — mesmo caso do SI-05.2. Os dois casos pedidos (204 + incremento; 31a requisicao 429) sao os cenarios 1.1 e 2.1 do spec, em `test/videos-view-count.e2e-spec.ts`.
  - **Limite do teste de concorrencia (AC #5).** O teste de integracao dispara dois `registerView` em `Promise.all` e afirma soma 2; o `pg` emitiu um DeprecationWarning de `client.query()` concorrente, o que indica que as duas queries podem ter sido serializadas no mesmo client do pool. Ele prova que o incremento e aditivo (nao um read-modify-write com valor velho em JS), que e o modo de falha real; a atomicidade sob conexoes paralelas vem do proprio `UPDATE ... SET views_count = views_count + 1`, por construcao, nao da observacao do teste.

### SI-05.4 — Endpoint de sugestoes da sidebar
- **Status:** completed
- **Tests:** 17 passing (11 em `videos.service.integration-spec.ts`, 6 em `test/videos-suggestions.e2e-spec.ts`) — passaram de primeira
- **Observations:**
  - **O `limit` ficou sem teto.** As Validation Rules do plano dizem so `>= 1`, sem `Max`; as outras paginacoes do projeto (`ListVideosQueryDto`, `ListPublicVideosQueryDto`) usam `@Max(50)`. Segui o contrato a letra em vez de inventar um teto, mas numa rota publica e anonima isso permite `?limit=100000`. A protecao hoje e so o throttler global de 10/60 s. Vale uma decisao explicita.
  - A resposta e `{ items, total }` sem `offset`/`limit` no corpo, ao contrario de `OwnerVideosPage`/`PublicVideosPage` — e o que o contrato desta rota pede.
  - `SuggestedVideoListItem` carrega o canal, o que `PublicVideoListItem` nao faz: a vitrine ja esta dentro de um canal, a sidebar mistura canais e precisa creditar cada sugestao.
  - A linha E2E da Tests table aponta pela terceira vez para `test/videos.e2e-spec.ts`, inexistente. Coberto pelos cenarios 1.1, 2.1 e 2.3 do spec.

### SI-05.5 — Route Handlers BFF da watch page
- **Status:** completed
- **Tests:** 13 passing (4 + 4 + 5 nos tres `route.integration.test.ts`); lint do frontend em 0 erros
- **Observations:**
  - **Conflito plano x repo, decidido pelo usuario: rota irma.** A acao 1 mandava criar `GET /api/videos/{publicId}` com proxy para `/videos/{publicId}/public`, mas esse arquivo ja existia e seu GET serve o painel do dono — `components/videos/upload-form.tsx:56` faz polling de status nele, e `video-edit-form.tsx` usa o PATCH do mesmo arquivo. Repropor o GET quebraria a Fase 03. A rota nova e `app/api/videos/[publicId]/public/route.ts`, espelhando o nome do backend. **Corrigi o plano e o spec de E2E** (12 + 1 ocorrencias de `/api/videos/{publicId}` -> `/api/videos/{publicId}/public`, so as do detalhe; `/view` e `/suggestions` ficaram como estavam).
  - As tres rotas sao anonimas: sem `getSession`, sem header `Authorization` e sem `withRefresh`, ao contrario de todo Route Handler ja existente no projeto. Ha teste afirmando que nenhuma manda `Authorization` para o upstream.
  - O 204 do `/view` devolve `new Response(null, ...)`, nao `NextResponse.json` — um 204 com corpo e rejeitado pelo fetch do browser.
  - `offset`/`limit` so vao ao upstream quando o browser os mandou; mandar `offset=` em branco faria a validacao do upstream recusar. Ha teste para isso.
  - **`npx next typegen` foi necessario**: `RouteContext<"...">` vem do manifesto de rotas tipadas do Next 16, e sem regerar o `tsc` acusava as tres rotas novas como inexistentes. Nao esta documentado no `next-frontend/CLAUDE.md`.
  - **Atualizei o Error Catalog do plano**: a linha do 429 passou de `_(sem codigo de dominio)_` para `RATE_LIMIT_EXCEEDED`, e a "Lacuna conhecida no 429" foi reescrita como fechada no SI-05.3. Sem isso o SI-05.6b mapearia o erro pela forma errada.
  - Cadeia de contrato regerada: `openapi.json` (+335 linhas), `next-frontend/openapi.json` e `lib/api/types.gen.ts` (+222).
  - **Erro meu, corrigido:** uma substituicao em Python com `s[a:b]` invertido devolveu string vazia e `replace('')` inseriu um paragrafo antes do frontmatter do plano. Detectado na conferencia seguinte e revertido; estrutura do plano reconferida (5 secoes de topo, 11 SIs, mesmas linhas).

### SI-05.6.0 — Drift audit: Pagina de visualizacao do video
- **Status:** completed
- **Tests:** no tests (audit-only)
- **Observations:**
  - **Zero chamadas ao MCP do Figma.** O cache `docs/figma-cache/FetKyb1V02WS5D6VCatK6t/66-42.json` (colhido pelo `figma-batch` em 2026-09-29, 74 nos, maxDepth 6) carrega `size`, `layout`, `fills`, `strokes`, `radius`, `font` e `fontSize` — exatamente o que o diff de valor precisa. A skill manda invocar `figma:figma-implement-design`; usei o cache, conforme o desenho cache-first da PR #20 e a restricao de cota.
  - Nao existe `.claude/rules/design-system.md`, entao o alias map esta vazio e vale o fallback aditivo da regra das 3 formas.
  - **A regra das 3 formas degenera neste arquivo.** O Figma nao tem Variables nem componentes de botao — os nos sao frames soltos cujos nomes (`sair-button`, `download-button`) sao nomes de instancia na tela, nao de variante. Inventar nome a partir do contexto da tela e proibido pela propria regra, entao emiti um retune da variante que ja ocupa o papel semantico (`secondary`) em vez de um aditivo sem nome legitimo.
  - A divergencia de paleta (slate/azul no Figma contra neutra no DS) **nao** foi tratada como achado: o arquivo Figma nao tem tokens, e a Fase 04 ja estabeleceu que as cores sao mapeadas a mao para os tokens do `globals.css`. Registrado como nota sistemica no relatorio.
  - A AC "git diff --name-only HEAD -- next-frontend vazio" so vale com commit por SI; as mudancas pendentes ali sao do SI-05.5. A auditoria em si nao tocou nenhum arquivo de `next-frontend/`.

### SI-05.6a — Tela de visualizacao do video (visual shell)
- **Status:** completed
- **Tests:** no tests (visual shell)
- **Observations:**
  - As tres decisoes do drift report foram aplicadas e confirmadas pelo usuario: `button.tsx` variante `secondary` de `bg-secondary` para `bg-card`; `--text-overlay` de 16/20/400 para 11/16/700; `--overlay` de `#00000080` para `#0f0f0f`. O `--overlay` existe em duas ocorrencias (`:root` e dark) com o mesmo valor — mudei as duas para preservar a propriedade de ser igual nos dois modos.
  - **Lacuna da cadeia inventario -> B2.6 -> audit: o icone de download.** O frame tem `download-icon` (`67:68`, 14px, stroke) dentro do botao, mas o inventario dobrou o glifo na linha do `DownloadButton`, que aponta para `components/ui/button.tsx` — nenhum marcador `(new)` foi emitido, nenhum SI de bootstrap foi gerado e a lista Reused DS do audit nao o incluiu. Criei `components/icons/download-icon.tsx` sob a excecao de escopo do SI-Xa (`create` de icone), mas a lacuna esta nos tres estagios anteriores.
  - **Nenhuma chamada ao MCP do Figma** — shell construido do mesmo cache do audit.
  - Os controles do player NAO foram implementados: `<video controls>` nativo, conforme TD-01. Os sete nos de controle do frame sao ilustrativos.
  - **Dois estados sem desenho, resolvidos aqui e sujeitos a revisao se o desenho aparecer:** a descricao expandida cresce no fluxo empurrando o que vem abaixo, sem scroll proprio e sem deslocar a sidebar; e o "Ver mais" some quando acaba, em vez de ficar inerte, para nao deixar um alvo que nao faz nada — com `aria-live` anunciando as duas transicoes.
  - **Duas violacoes minhas das regras de UI, corrigidas:** usei `w-[233px]` (valor arbitrario) e `font-bold` (nao e o utilitario de peso do projeto). Virou um token novo `--width-suggestions-sidebar: 233px` no `globals.css` — a escala de spacing para em 100px e isso e medida de layout — e `font-weight-700`.
  - `publishedAt` e `string | null`: o dono vendo o proprio rascunho e o unico caminho em que a rota serve um nao-publicado. A linha de meta omite a data nesse caso em vez de fazer cast.
  - A pagina ainda renderiza de constantes de composicao (`PLACEHOLDER_VIDEO`/`PLACEHOLDER_SUGGESTIONS`); a busca real, o `notFound()` e o mapeamento de erro entram no SI-05.6b.

### SI-05.6b — Tela de visualizacao do video (logica & wiring)
- **Status:** completed
- **Tests:** 23 passing (16 unit nos tres `__tests__` + 7 E2E em `tests/video-watch-page.e2e-spec.ts`); a suite de componentes de videos inteira fecha 71/71
- **Observations:**
  - **Desvio do plano, mesma razao do SI-05.5:** a acao 1 manda o Server Component buscar `GET /api/videos/{publicId}/public`, mas RSC chamando a propria rota BFF e um hop extra que exige URL absoluta, e o `next-frontend/CLAUDE.md` autoriza explicitamente RSC falar com o upstream via `env.API_URL`. Segui o precedente de `app/channels/[nickname]/page.tsx`. **Consequencia a registrar: a rota `/api/videos/{publicId}/public` nao tem consumidor no browser hoje** — existe porque o BFF tier a especifica e e por onde um refresh client-side passaria.
  - A fachada de mídia do TD-06 ficou como `MediaTimeSource` em `video-player.tsx`: um `subscribe` so. O default liga no `timeupdate` do elemento; o teste injeta tempos. Deltas acima de 1 s sao ignorados — e busca na barra, nao reproducao, e sem isso arrastar ate o fim contaria visualizacao.
  - `SidebarLoadMore` e dono so das paginas SEGUINTES; a primeira vem do RSC. Evita puxar a primeira pagina para o cliente so para poder paginar.
  - **`SUGGESTIONS_PAGE_SIZE` teve de sair do componente para `lib/pagination.ts`:** importar um valor de um modulo `"use client"` dentro de um Server Component devolve referencia de cliente, nao o numero.
  - **Tres bugs meus nos testes, corrigidos:** atributo JSX entre aspas nao interpreta `
`; `toHaveJSProperty` nao aceita matcher assimetrico; e `getByText(/visualizações/)` violava strict mode depois que a sidebar passou a renderizar — os cards tambem dizem "visualizacoes".
  - **`getByRole("alert")` casa com o route announcer do Next** (`#__next-route-announcer__`), que existe sempre e vazio. Ja estava documentado em `tests/video-upload.e2e-spec.ts`; escopei em `main [role='alert']`. Vale virar regra.
  - O E2E avanca o tempo de midia despachando `timeupdate` com `currentTime` redefinido, em passos de 0,25 s — exercita o caminho real da fachada sem depender de reproducao em headless. O `page.route()` e so na origem do storage, a excecao do TD-06 Option C.
  - O gatilho so arma depois da hidratacao, entao o cenario 1.2 reavanca a midia dentro de um `expect.poll`. E seguro justamente pelo que ele afirma: dispara uma vez por montagem.

**Lacunas de ambiente encontradas (nao sao do codigo, e nao estao no `next-frontend/CLAUDE.md`):**
  - `pkill` **nao existe** no container; os passos de "reinicie o dev server" falham em silencio. Matar pelo PID que o proprio Next imprime, ou `docker compose restart`.
  - Handlers do MSW sao registrados **uma unica vez** no boot pelo `instrumentation.ts`. Editar `mocks/` NAO recarrega — exige reiniciar o dev server, ou o E2E roda contra handlers velhos.
  - `docker compose exec -d ... npm run dev` **no mesmo comando** que o `docker compose restart` sobe um servidor em que a instrumentation nao compila: o MSW nao intercepta, o fetch do RSC vaza para `host.docker.internal:3000` e a pagina da 500. Separar em dois passos resolve. Perdi varias iteracoes nisso antes de perceber que a sidebar vazia era ambiente, nao codigo.

### SI-05.7.0 — Drift audit: Video nao encontrado
- **Status:** completed
- **Tests:** no tests (audit-only)
- **Observations:**
  - Zero chamadas ao MCP do Figma — cache `68-62.json`, mesma colheita de 2026-09-29.
  - **Nenhum CONFLICT.** O frame desenha os dois navbars no a no identicos (76px, `padding: [20, 48, 20, 48]`, `sair-button` 74x33 `r=10`), entao as quatro decisoes de chrome reproduzem o registrado no SI-05.6.0. `brand-logo` e `streamtube-icon` foram reclassificados do zero, como a regra manda para decisoes `exception` — nenhuma edicao fora aplicada la, o arquivo esta no estado original — e chegaram ao mesmo lugar.
  - **`components/ui/card.tsx` ganhou decisao aditiva, nao retune:** o primitivo tem cinco consumidores (`login`, `signup`, `forgot-password`, `channel-edit-form`, `thumbnail-uploader`) com a densidade atual. O `not-found-card` e tratamento de heroi (48px de respiro, raio 16) e retunar a base mudaria aquelas cinco telas. Padding e raio sao identidade intrinseca, entao override no call site esta fora pela regra anti-pattern. O nome `lg` nao vem do contexto da tela: e o degrau que falta na escala que o DS ja declara com `sm`.
  - O `VideoOffIcon` foi encontrado em disco, como o Dependency Map previa — o SI-05.0.1 evitou o falso `componente ausente`.

### SI-05.7a — Tela de video nao encontrado (visual shell)
- **Status:** completed
- **Tests:** no tests (visual shell)
- **Observations:**
  - Decisao do relatorio aplicada: `components/ui/card.tsx` ganhou `size="lg"` (`gap-5`, `py-12`, `rounded-[var(--radius-4)]` no root; `px-12` no header e no content). Aditivo — os cinco consumidores existentes nao mudam.
  - Nenhuma chamada ao MCP do Figma — shell construido do cache `68-62.json`.
  - O texto do corpo foi transcrito do frame **como regra de seguranca**, com comentario no codigo explicando por que: o TD-09 exige que video inexistente e rascunho de terceiro sejam indistinguiveis, e "nao existe" revelaria por contraste que o outro existe.
  - **AC verificada parcialmente, e vale ser explicito:** confirmei que um `publicId` inexistente renderiza esta tela com 404 e o texto exato. A clausula "rascunho de terceiro renderiza a MESMA tela" nao foi *observada* — o handler MSW so 404 para o trigger `missing-video`, e nao criei trigger novo para rascunho alheio. A indistinguibilidade e estrutural: existe uma unica tela e um unico texto, sem ramificacao por causa, e o backend ja devolve 404 `VIDEO_NOT_FOUND` byte-identico nos dois casos (provado no cenario 1.3 de `test/videos-public-detail.e2e-spec.ts`).
  - **Arquivo especial novo exige reiniciar o dev server:** o Turbopack nao registrou `not-found.tsx` na arvore de rotas por HMR — ate reiniciar, o `notFound()` caia no not-found global do Next.
