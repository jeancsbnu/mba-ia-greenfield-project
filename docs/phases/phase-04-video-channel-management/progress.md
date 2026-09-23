# phase-04-video-channel-management — Progress

**Status:** in_progress
**SIs:** 28/28 completed

### SI-04.0.1 — Infra: install batch shadcn primitives
- **Status:** completed
- **Tests:** no tests (Infra) — `npx tsc --noEmit` e `npx eslint` nos 6 arquivos passaram (exit 0)
- **Observations:**
  - Ambiente: os containers `bs-postgres`/`bs-minio`/`bs-mailhog` de outro projeto ocupam 5432, 9000-9001, 1025 e 8025, então criei `nestjs-project/compose.override.yaml` (local, fora do git via `.git/info/exclude`) com `name: streamtube`, portas do host db 5433, minio 9100/9101 e mailpit 1026/8026, e `nestjs-api` com `tail -f /dev/null` (sem servidor de dev). A stack roda como projeto `streamtube`; o volume antigo `nestjs-project_minio-data` (uploads da Fase 03) ficou intacto e sem uso, e o novo é `streamtube_minio-data`.
  - O `npx shadcn` falhou três vezes no container por DNS/timeout até `ui.shadcn.com` (`EAI_AGAIN` e `Connect Timeout`), enquanto o host resolvia em 0,3 s. Criei `next-frontend/compose.override.yaml` (local, fora do git) com `dns: [8.8.8.8, 1.1.1.1]`; o que destravou de fato foi `NODE_OPTIONS=--dns-result-order=ipv4first`. Vale manter a variável em novas chamadas de rede dentro desse container.
  - O `pagination` foi instalado numa segunda chamada, respondendo "no" ao prompt de sobrescrever `button.tsx` (o lote inicial parou nesse prompt e instalou só os outros 5). O `button.tsx` do projeto ficou intacto.
  - Correções no código gerado pelo shadcn: os 6 arquivos vinham com `import { cn } from "cn"` (e o CLI chegou a adicionar a dependência `cn` ao `package.json`) — troquei para `@/lib/utils` e removi a dependência com `npm uninstall cn`, deixando o `package.json` sem diff. Os ícones `lucide-react` (`select` e `pagination`) viraram SVG inline local, seguindo a regra do `next-frontend/CLAUDE.md` de não instalar biblioteca de ícones; `CheckIcon` reusa `components/icons/check-icon.tsx`.
  - `pagination.tsx` usava `size="default"` no `Button`, valor inexistente nas variants do projeto (`sm | md | lg | icon`) — trocado para `sm`, que é o default do `Button`.
  - Os arquivos gerados não têm os tokens do design system do projeto (usam utilitários shadcn padrão). O alinhamento visual acontece nas SIs de drift audit (`SI-04.11.0` em diante), que é onde o plano prevê essa comparação.

### SI-04.0.2 — Tests shadcn batch (≤5 files)
- **Status:** completed
- **Tests:** 23 passando (avatar 5, badge 5, pagination 4, radio-group 4, select 5)
- **Observations:**
  - Os testes cobrem só comportamento e acessibilidade (role, `aria-*`, `data-slot`, handlers), sem afirmar classe Tailwind — o guia de testes desaconselha reafirmar o mapeamento de variants do cva.
  - **Causa-raiz do bloqueio de ontem, resolvida:** o `.wslconfig` limitava o WSL a `memory=1GB`, então o container via 898 MB e o pool `forks` do Vitest não conseguia iniciar worker (`Timeout waiting for worker to respond`). Subi para `memory=8GB` (host tem 15,9 GB; backup em `~/.wslconfig.bak-20260922-083329`) e apliquei com `wsl --shutdown`. A suíte passou a rodar em ~150 s sem nenhuma flag de contorno. Se reaparecer `Failed to start forks worker`, checar esse arquivo antes de suspeitar do código.
  - `select.test.tsx` precisou de stubs de `scrollIntoView`, `hasPointerCapture`, `setPointerCapture` e `releasePointerCapture` num `beforeAll`: o Radix Select usa APIs de ponteiro que o jsdom não implementa, e sem elas a lista nunca abre.
  - A asserção de navegação por setas do `radio-group` foi **removida por decisão do usuário** depois de 3 tentativas: o roving focus do Radix depende de eventos de foco que o jsdom não reproduz. Restam 4 testes no arquivo (role, estado marcado, clique disparando `onValueChange`, grupo desabilitado). A navegação por teclado fica coberta pelo E2E da tela de edição de vídeo (`next-frontend/specs/video-edit.plan.md`).
  - **Pendência de regra herdada da SI-04.0.1:** `.claude/rules/next-frontend-ui.md` exige que ícones vivam em `@/components/icons/`, mas eu deixei os SVG inline dentro de `select.tsx` e `pagination.tsx` ao remover o `lucide-react`. A SI-04.0.4 já cria `chevron-down-icon.tsx` e `chevron-left-icon.tsx` — extrair os 5 ícones (down, up, left, right, more-horizontal) para lá e importar nos dois primitives.

### SI-04.0.3 — Tests shadcn batch (textarea)
- **Status:** completed
- **Tests:** 6 passando
- **Observations:**
  - Cobre o que a Fase 04 usa do campo: textbox com `data-slot`, placeholder, valor controlado, `onChange` ao digitar, estado desabilitado e `aria-invalid` para erro de validação. Sem asserção de classe, como nos demais primitives.

### SI-04.0.4 — Custom-business simple group: channel-edit-form + channel-header + chevron-down-icon + chevron-left-icon + plus-icon
- **Status:** completed
- **Tests:** 13 passando (channel-header 7, channel-edit-form 6); regressão dos primitives OK (40 passando em components/ui) e lint exit 0
- **Observations:**
  - Além dos 3 ícones do plano (`chevron-down`, `chevron-left`, `plus`), criei `chevron-up-icon.tsx`, `chevron-right-icon.tsx` e `more-horizontal-icon.tsx` para **fechar a pendência da SI-04.0.1**: os SVG que eu tinha deixado inline em `select.tsx` e `pagination.tsx` foram extraídos para `@/components/icons/`, como exige `.claude/rules/next-frontend-ui.md`. Os dois primitives agora importam os ícones e não têm mais markup SVG inline.
  - `ChannelHeader` calcula as iniciais do nome para o fallback do `Avatar` (sem upload nesta fase, OQ-21) e trata o singular "1 vídeo".
  - `ChannelEditForm` é só a camada apresentacional: campos pré-preenchidos, prefixo "@" como adorno `aria-hidden` (o `Input` do DS não tem variante com prefixo) e os dois textos de apoio do nickname ligados por `aria-describedby` — inclusive o aviso de que trocar o nickname muda a URL pública (OQ-16). O wiring com react-hook-form + Zod e a mutation ficam na SI-04.13b, como o plano define.
  - O botão "Cancelar" não é fixo no componente: entra como `children` das ações, porque o destino (`/channel/videos`) é decisão da tela, não do formulário.

### SI-04.0.5 — Custom-business simple group: site-navbar + thumbnail-uploader + user-menu + video-card + video-edit-form
- **Status:** completed
- **Tests:** 32 passando (video-edit-form 9, video-card 7, thumbnail-uploader 6, site-navbar 5, user-menu 5); `upload-form` da Fase 03 segue passando; tsc e lint exit 0
- **Observations:**
  - `SiteNavbar` usa `children` como slot da direita: `UserMenu` no layout autenticado, "Entrar" na página pública. Evita uma prop booleana de variante e mantém o navbar sem saber de sessão.
  - `UserMenu` recebe `onSignOut` por prop; a chamada ao `POST /api/auth/logout` é da SI-04.10, que é quem tem acesso ao router.
  - `ThumbnailUploader`: escolher o arquivo só gera preview local com `URL.createObjectURL` (revogado no unmount); o envio vai junto do submit (TD-03, revisão 2026-09-20). O preview usa `<img>` com `eslint-disable` pontual, porque `next/image` não otimiza blob URL — os testes precisaram de stub de `createObjectURL`/`revokeObjectURL`, que o jsdom não implementa.
  - `VideoCard` formata a duração como `m:ss` e as visualizações em pt-BR (`Intl.NumberFormat`); a duração é markup interno, não variante do `Badge` (OQ-20). A thumbnail tem `alt=""` porque o título ao lado já nomeia o card.
  - `VideoEditForm` exporta `VIDEO_CATEGORIES` com os 8 valores do TD-10 — o teste trava contra a regressão de reintroduzir "Tutoriais" do mock (OQ-15). As ações mudam por ciclo de vida: rascunho mostra "Salvar rascunho" + "Publicar"; publicado mostra "Salvar alterações" + "Despublicar"; com `canPublish=false` o "Publicar" fica desabilitado com explicação ligada por `aria-describedby` (TD-02).
  - Os botões de submit carregam `name="intent"` com valores `save`/`publish`/`unpublish`, para a SI-04.12b distinguir qual ação disparou o envio sem estado extra.

### SI-04.0.6 — Custom-business simple group: video-status-badge + video-table + video-visibility-badge
- **Status:** completed
- **Tests:** 18 passando (video-table 8, video-status-badge 6, video-visibility-badge 4). **Suíte completa do frontend: 169 passando em 36 arquivos** (~950 s), sem regressão nas Fases 02/03; tsc e lint exit 0
- **Observations:**
  - Os dois chips recebem `isPublished` em vez de derivar publicação do `status`: os eixos são independentes (TD-02), então um vídeo publicado e reprocessando mostra "Processando", e um `ready` nunca publicado mostra "Rascunho".
  - `VideoVisibilityBadge` tem teste explícito garantindo que o termo em inglês "Unlisted" nunca aparece — trava contra regressão da revisão 2026-08-08 do TD-02.
  - `VideoTable` recebe `formatPublishedAt` por prop (padrão: data absoluta pt-BR). A data relativa ("há 3 dias") vem de `lib/format.ts`, que a SI-04.11b cria; assim o componente não depende de helper inexistente e o `<time>` já carrega `dateTime` e a data absoluta no `title`.
  - O botão "Editar" é um `Link` com `aria-label` "Editar {título}": só "Editar" se repetiria em todas as linhas sem identificar o alvo (OQ-11). A coluna de ações tem `<th>` sr-only "Ações".
  - Rascunho mostra "—" em visibilidade, nos três contadores e na publicação, como o Figma.

**Bloco de bootstrap (SI-04.0.1 a 04.0.6) concluído.** Próxima: SI-04.1, primeira do backend.

### SI-04.1 — Migrar o schema de vídeo (categoria, visibilidade, publicação, thumbnail customizada e contadores)
- **Status:** completed
- **Tests:** 16 passando nos dois arquivos da SI (entidade 11, migrations 5). **Suíte completa do backend: 164 passando em 27 suítes**; tsc exit 0
- **Observations:**
  - Migration `1790081095939-AddVideoCategoryVisibilityPublication` gerada pelo CLI do TypeORM (regra `typeorm-migrations.md`: nunca escrever SQL à mão). Cria os enums antes das colunas e o `down` remove colunas e depois tipos, como o plano exige.
  - **Erro meu, corrigido:** escrevi `src/videos/entities/video.entity.integration-spec.ts` por cima sem verificar, e o arquivo já tinha 3 testes da Fase 03 (unicidade de `public_id`, default de `status`, relação ManyToOne com canal). Recuperei do git e mesclei com os 8 novos; os 11 passam juntos. O `git status` marcando o arquivo como `M` em vez de `??` foi o que denunciou. **Verificar existência antes de criar arquivo, mesmo quando o plano o descreve como novo.**
  - Os blocos da Fase 04 reusam o helper `createChannel()` do arquivo original, com um `buildVideo()` assíncrono próprio — cada teste cria o próprio canal, então nenhum depende de estado compartilhado entre eles.
  - O teste de migration acrescentou um `describe` próprio no arquivo existente: aplica tudo, desfaz a última para simular o estado pré-Fase 04, insere um vídeo, reaplica e confere que o vídeo sobreviveu com os defaults. O `afterAll` reaplica as migrations (regra `typeorm-migrations.md`), deixando o banco compartilhado íntegro.
  - **Gotcha de ambiente:** a primeira execução falhou com `relation "channels" already exists` por causa de schema parcial deixado por uma execução anterior interrompida. Limpar tabelas e tipos resolveu. Se os testes de migration falharem em hook, suspeitar do estado do banco antes do código.
  - **Dívida pré-existente registrada (fora do escopo):** `npm run lint` no backend reporta 208 problemas (168 erros) vindos de arquivos de teste da Fase 03 — confirmado com minhas mudanças no stash, o número é idêntico. Meus arquivos passam limpos. Contraria a Definition of Done do `CLAUDE.md` e merece tarefa própria.

### SI-04.2 — Endpoint GET /videos/{publicId} (detalhe do dono estendido)
- **Status:** completed
- **Tests:** 11 da SI (4 unit, 3 integration com MinIO real, 4 e2e). **Suítes completas: 171 passando em 29 (unit+integration) e 66 em 7 (e2e)**; tsc e lint dos meus arquivos exit 0
- **Observations:**
  - `resolveThumbnailUrl` devolve `null` quando falta `storage_bucket`, além do caso sem chave nenhuma — o bucket é nullable na entidade e um vídeo pré-upload pode ter chave sem bucket.
  - O teste de integração prova a precedência do TD-04 pelo **conteúdo servido** pela URL pré-assinada (grava dois objetos distintos no MinIO e confere qual deles a URL devolve), não só pela chave escolhida. É o que separa "escolheu a chave certa" de "a URL realmente serve o arquivo certo".
  - O e2e segue `nestjs-project/specs/videos-detail.plan.md` cenário a cenário, com comentário ligando cada `it` ao número do spec.
  - **Gotcha do shell:** heredoc grande com acentos e crases quebra no Git Bash daqui (`unexpected EOF`). Para arquivos extensos, usar a ferramenta de escrita direto em vez de `cat > arquivo <<EOF`.
  - O mock do `sendConfirmationEmail` no e2e foi tipado com uma interface `MailServiceLike` em vez de `as any`/`as never`: o `as never` quebrava o `tsc` e o `async` sem `await` violava `require-await`. Vale como padrão para os próximos e2e que precisarem capturar o token de confirmação.

### SI-04.3 — Endpoint PATCH /videos/{publicId} (edição, thumbnail e publicação)
- **Status:** completed
- **Tests:** 23 da SI (12 unit, 4 integration, 7 e2e). **Suítes completas: 183 em 30 (unit+integration) e 73 em 8 (e2e)**; tsc e lint exit 0
- **Observations:**
  - **Bug de configuração encontrado e corrigido (vale para qualquer teste com upload):** o `FileTypeValidator` do Nest 11 valida por magic numbers importando o pacote `file-type` via ESM dinâmico. Sob o Jest esse import falha e, sem `fallbackToMimetype`, o validador devolve `false` para **todo** arquivo — um PNG válido virava 400. A própria mensagem do Nest sugere a saída: rodar o Jest com `--experimental-vm-modules`. Fixei isso no script `test:e2e` do `package.json`. **Descartei o `fallbackToMimetype: true`** porque ele passaria a confiar no tipo declarado pelo cliente, enfraquecendo justamente a inspeção no servidor que o TD-03 exige.
  - `tsconfig.json` ganhou `"multer"` no array `types`: o array restringia a `["jest", "node"]`, então a augmentação de `Express.Multer.File` do `@types/multer` nunca carregava e o `tsc` quebrava.
  - O e2e usa um PNG 1x1 real em base64, não um buffer de texto — consequência direta da validação por magic numbers.
  - `updateVideo` é idempotente ao publicar (não reescreve `published_at` já preenchido) e despublica sem olhar o `status`, como o TD-02 define. `storeCustomThumbnail` grava só em `custom_thumbnail_key`.
  - O DTO seguiu a regra `nestjs-dtos.md`: sem `@ApiProperty` manual, só `class-validator` + JSDoc, deixando o plugin do Swagger gerar o schema. O `@ApiBody` ficou no controller, que é onde o multipart com arquivo precisa ser descrito à mão.

### SI-04.4 — Endpoint GET /me/videos (painel do canal)
- **Status:** completed
- **Tests:** 8 da SI (4 integration de `listByChannel`, 4 e2e); tsc e lint exit 0
- **Observations:**
  - `ChannelVideosController` vive em `VideosModule`, como o plano manda: `ChannelsModule` não conhece `VideosService`, e inverter criaria dependência circular. O `VideosModule` já importava `ChannelsModule`.
  - `ChannelNotFoundException` (`CHANNEL_NOT_FOUND`, 404) criada aqui e reaproveitada pelas SI-04.5 e 04.6.
  - O item da listagem inclui `category`, que o plano não listava explicitamente no envelope mas o painel precisa para a coluna de categoria — acréscimo aditivo, não muda nenhum campo previsto.
  - O teste de integração cobre o isolamento entre canais criando um segundo canal com vídeo próprio, que é a garantia de que a rota `me` nunca vaza dados de terceiros.

### SI-04.5 — Endpoints GET e PATCH /me/channel (canal do dono)
- **Status:** completed
- **Tests:** 14 da SI (5 unit em `channels.service.spec.ts`, 4 integration em `channels.service.integration-spec.ts`, 5 e2e em `me-channel.e2e-spec.ts`); tsc exit 0
- **Observations:**
  - `ChannelsController` montado em `@Controller('me/channel')` para não colidir com a rota pública `/channels/{nickname}` da SI-04.6 — foi por isso que o plano renomeou as rotas de dono para o prefixo `me`.
  - **Corpo vazio não era detectado por `Object.keys(dto).length === 0`.** Com `useDefineForClassFields` (target ES2023), as propriedades opcionais do DTO *existem* como `undefined` mesmo num `PATCH {}`, então o array de chaves nunca é vazio e o 400 jamais disparava. Troquei por `Object.values(dto).some((v) => v !== undefined)` e cobri com teste de regressão. O mesmo defeito estava no `VideosController` e foi corrigido junto.
  - Troca de nickname é livre (TD-07): sem cooldown, sem histórico. A unicidade é garantida por checagem explícita que levanta `NicknameAlreadyExistsException` (409), não pela violação de constraint — assim o erro chega como domínio, não como 500.
  - `description: ''` normaliza para `null` em vez de string vazia, mantendo um único valor para "sem descrição".

### SI-04.6 — Endpoints GET /channels/{nickname} e GET /channels/{nickname}/videos (canal público)
- **Status:** completed
- **Tests:** 11 da SI (2 unit, 4 integration, 5 e2e em `channels-public.e2e-spec.ts`); tsc exit 0
- **Observations:**
  - As duas rotas são `@Public()` — nenhum cenário de teste usa token, que é o ponto: a vitrine do canal é anônima (TD-08).
  - `videosCount` e a listagem contam **só** publicados e públicos: rascunhos e `unlisted` ficam de fora dos dois, e o e2e semeia exatamente esses três casos para provar que a exclusão vale para o contador e para a lista.
  - `limit` default 8 aqui contra 10 em `/me/videos` — a vitrine pública é grid, o painel do dono é tabela. Por isso existem dois DTOs de query separados.
  - Ordenação por `published_at` desc apoia-se no índice composto `['channel_id','published_at']` criado na SI-04.1.

### SI-04.7 — Assinatura de stream e download respeita rascunho e visibilidade
- **Status:** completed
- **Tests:** 19 da SI (3 unit em `jwt-auth.guard.spec.ts`, 5 unit + 4 integration de `assertServable`, 7 e2e em `videos-stream-visibility.e2e-spec.ts`); tsc exit 0; suítes completas 214/214 e 95/95
- **Observations:**
  - O `JwtAuthGuard` ganhou autenticação **opcional** em rota `@Public()`: com Bearer válido preenche `request.user`, com token ausente ou inválido segue anônimo sem 401. Extraí `tryAttachUser` para que os dois caminhos (público e protegido) usem a mesma verificação e não divirjam.
  - `assertServable` devolve **404 e não 403** para rascunho de terceiro: 403 confirmaria que o vídeo existe. Roda antes de `assertReady` para que o 404 tenha precedência sobre o 409 — há teste de integração dedicado a essa ordem, com um vídeo que é rascunho *e* não está pronto.
  - Rascunho é definido por `published_at` nulo, nunca por `status` — coerente com o TD-02, que trata status e publicação como eixos independentes.
  - **Efeito colateral real em teste da Fase 03:** `videos-stream.e2e-spec.ts` criava vídeos sem `published_at`, ou seja, rascunhos, e seus cenários anônimos passariam a dar 404. Publiquei o fixture em vez de relaxar a regra: aqueles testes descrevem chamador anônimo em vídeo disponível, que é justamente o caso publicado.

### SI-04.8 — Sincronizar o contrato OpenAPI e os mocks do frontend
- **Status:** completed
- **Tests:** sem testes próprios (contrato provado por tsc; handlers exercitados pelos SIs 04.10–04.14). Backend 214/214 e 95/95; frontend 169/169; tsc e lint exit 0 nos dois subprojetos
- **Observations:**
  - **Dois defeitos reais no OpenAPI apareceram ao gerar os tipos, e sem corrigi-los o critério de aceite nº 4 seria falso.** (1) O `200` do `PATCH /videos/{publicId}` não tinha `content` nenhum — resposta impossível de tipar. (2) Todo `schema: { properties: {...} }` inline gera campos **opcionais**, porque não emite `required`; um `name?: string` no frontend não quebra se o backend parar de mandar `name`.
  - A correção seguiu o `nestjs-dtos.md` ("controllers documentam operações, não schemas"): criei `VideoDetailResponse`, `ChannelResponse`/`PublicChannelResponse` e `OwnerVideosPage`/`PublicVideosPage`, registrados em `extraModels`, e troquei todos os schemas inline da Fase 04 por `$ref`. As 7 respostas agora são schemas nomeados com `required` completo.
  - `GET` e `PATCH /videos/{publicId}` passaram a compartilhar um único DTO. Antes o schema estava duplicado inline, e bastava alguém acrescentar um campo num lado para os dois contratos divergirem em silêncio.
  - **A regeneração dos tipos quebrou o `tsc` na fixture antiga** por falta de `category`, `visibility`, `publishedAt` e `thumbnailUrl`. Isso não foi uma falha: foi o critério nº 4 se comprovando na prática — mudança de contrato quebra a compilação.
  - **CORREÇÃO (registrada na SI-04.11b):** ao fechar esta SI afirmei que o contrato estava sincronizado. Isso valia para as **respostas**, que escrevi com `@ApiProperty` explícito, mas **não** para os corpos de requisição nem para os parâmetros de query: o `openapi:export` rodava com `ts-node`, que não aplica o plugin do Swagger (um transformador de compilação do `nest-cli.json`), então `RegisterDto`, `LoginDto` e `UpdateChannelDto` saíam **sem nenhuma propriedade** e os `@Query()` sumiam. Corrigido na SI-04.11b trocando o script para `nest build && node dist/openapi-export.js`.
  - `PublicVideoListItem` não expõe `status` nem `visibility`: a rota só devolve publicados e públicos, então seriam constantes, e expor visibilidade ao anônimo não tem uso legítimo.
  - O handler `PATCH /videos/:publicId` fica registrado **depois** do `PATCH /videos/upload/:uploadId`; o MSW casa na ordem de registro, então o tus continua sendo atendido pelo handler certo.
  - **Erro de processo meu:** rodei `npx prettier --write` no `next-frontend`, onde prettier **não é dependência**. Ele reformatou dezenas de linhas pré-existentes que eu não havia tocado. Revertei o arquivo e reapliquei só a mudança funcional. No backend o prettier é dep e o uso foi legítimo.

### SI-04.9 — Generalizar o BackLink (ícone por props)
- **Status:** completed
- **Tests:** 3 da SI (7 no arquivo `back-link.test.tsx`); suíte completa do frontend 172/172 em 36 arquivos; tsc e lint exit 0
- **Observations:**
  - O ícone vai dentro de um `<span aria-hidden="true">` mesmo os ícones do projeto já trazendo `aria-hidden` próprio. Assim o critério "nome acessível não depende do ícone" vale por construção, e não pela confiança de que todo chamador passe um ícone decorativo bem comportado.
  - Sem `icon` nenhum wrapper é emitido — há teste dedicado a isso, que é o que protege as telas de auth da Fase 02 contra regressão silenciosa.

### SI-04.10 — Layout autenticado do canal (chrome, logout e leitura com refresh)
- **Status:** completed
- **Tests:** 14 da SI (5 unit em `server-upstream.test.ts`, 5 integration em `refresh/route.integration.test.ts`, 4 wiring em `user-menu.wiring.test.tsx`); suíte completa 186/186 em 39 arquivos; tsc e lint exit 0
- **Observations:**
  - **Armadilha de teste descoberta aqui, que vale para toda suíte de BFF:** o cliente `openapi-fetch` captura `globalThis.fetch` no momento em que é criado. Se o módulo que importa `upstream` for carregado no topo do arquivo de teste, ele nasce **antes** de o MSW substituir o fetch global, e a chamada escapa para a rede de verdade (`ENOTFOUND nestjs-api`) em vez de ser interceptada. Por isso os imports vão dentro de `beforeAll`, que é o padrão que as suítes de rota da Fase 02 já seguiam — eu havia furado esse padrão e o teste acusou.
  - `REFRESHED_PARAM` e `DEFAULT_RETURN_TO` moram em `lib/auth/refresh-redirect.ts`, não no `route.ts`: importar a constante do módulo de rota arrastaria o handler e suas dependências para dentro do helper de leitura.
  - A proteção de open redirect rejeita `//host` e `/\host` além do óbvio `https://`: as duas formas começam com `/` e passariam por uma checagem ingênua, mas o navegador as trata como URL protocol-relative. Há teste dedicado a cada uma.
  - O layout lê `GET /me/channel` a cada requisição em vez de usar `session.channelSlug` — o login grava esse campo vazio e a troca de nickname é livre (TD-07), então o valor da sessão envelheceria em silêncio (TD-09).
  - `ChannelUserMenu` existe porque o layout é Server Component e não pode passar função como prop; o `UserMenu` segue presencial, com `onSignOut` injetado. O `router.refresh()` após o logout não é enfeite: sem ele a árvore em cache ainda traria o canal de quem acabou de sair.

### SI-04.11.0 — Drift audit: Painel de gerenciamento de vídeos do canal
- **Status:** completed
- **Tests:** n/a (audit-only; o relatório é a entrega)
- **Observations:**
  - Relatório em `frontend-drift-report.md`, seção `## Screen: painel-videos`. 12 componentes: 2 alinhado, 5 drift menor, 5 drift relevante, 0 ausente.
  - **Descoberta que muda o orçamento de Figma da fase:** `get_design_context` devolve o código **e** o screenshot na mesma resposta, então não é preciso chamar `get_screenshot` em separado. Isso derruba o custo de ~2 chamadas por tela para 1 — e a mesma resposta serve para a auditoria (X.0) e para o shell (Xa), que apontam para o mesmo nó. Com o plano Starter limitado a 20 leituras/mês, isso é a diferença entre caber e não caber.
  - Pior drift encontrado: `VideoStatusBadge` usa `variant="default"`, e como `--primary` é `#0f0f0f` o chip "Publicado" renderiza **preto** onde o design pede verde. Os tokens `--success`/`--warning` já existem no `globals.css` — falta só expor as variantes no `Badge`.
  - `BrandLogo` ficou como `exception` consciente: o mock usa "EstúdioCriador" numa caixa azul contra "StreamTube" em vermelho no código. É lacuna de design já registrada como Open Question do inventário; mudar a marca real do produto para casar com um placeholder seria o erro oposto.
  - Os quadros tracejados azuis do frame (`main-dashed-container`, `pagination-dashed-box`, `top-decorative-strip`) são marcação do arquivo de design, não UI, e não geraram linha de drift.
  - Sobre o critério "`git diff --name-only HEAD -- next-frontend` vazio": o comando lista 28 arquivos porque a branch acumula o trabalho não commitado das SIs anteriores. O que o critério quer — que esta SI não edite código — está cumprido: nenhum arquivo de `next-frontend` foi tocado.

### SI-04.11a — Tela de Painel de gerenciamento de vídeos do canal (visual shell)
- **Status:** completed
- **Tests:** shell sem testes próprios (gate de build); `pagination.test.tsx` atualizado para os rótulos pt-BR; tsc e lint exit 0
- **Observations:**
  - **Bug meu da SI-04.0.6 descoberto aqui:** `--spacing-14`, `--spacing-22` e `--spacing-25` não existiam. A escala do projeto é customizada e pula de `--spacing-12` para `--spacing-16`, sem a base `--spacing` do Tailwind v4 que geraria valores intermediários — então o `h-14 w-25` que eu havia escrito para a miniatura (100×56) **nunca resolveu**, e o thumbnail ficava sem dimensão. Os três tokens foram adicionados ao `globals.css`, que é o caminho que `next-frontend-ui.md` manda (nunca valor arbitrário em componente).
  - Segundo achado de token: `--success`, `--warning`, `--success-text` e `--warning-text` existiam em `:root` mas **não estavam mapeados** no `@theme inline`, então `bg-success` e `text-success-text` não geravam utilitário nenhum. O mapeamento foi adicionado; nenhum valor novo foi inventado.
  - Com isso o `Badge` ganhou as variantes `success` e `warning`, e o chip "Publicado" deixou de renderizar preto (`variant="default"` com `--primary: #0f0f0f`) para ficar verde, como o design pede.
  - As decisões `exception` do relatório de drift (BrandLogo, Avatar, PlusIcon) não geraram edição, como previsto.

### SI-04.11b — Tela de Painel de gerenciamento de vídeos do canal (lógica & wiring)
- **Status:** completed
- **Tests:** 25 da SI (17 em `pagination.test.ts`, 8 em `format.test.ts`) + 4 guardas novos em `openapi-export.integration-spec.ts`; frontend 211/211 em 41 arquivos; tsc e lint exit 0
- **Observations:**
  - **Defeito grave do pipeline de contrato, encontrado aqui.** O wiring não compilava porque `/me/videos` não declarava `offset`/`limit`. A causa não era o DTO: o `openapi:export` rodava com `ts-node`, e o plugin do Swagger é um transformador de **compilação** declarado no `nest-cli.json`. Sob `ts-node` ele não atua, então todo DTO de requisição saía sem propriedades e todo `@Query()` desaparecia do spec. Script trocado para `nest build && node dist/openapi-export.js`.
  - **Por que ninguém viu antes:** a asserção `'includes non-empty components.schemas from DTO inference'` só checava `Object.keys(schemas).length > 0`, o que passa mesmo com todos os schemas vazios, porque o `ApiErrorEnvelope` é escrito à mão. O comentário `// RegisterDto has no declared properties in the contract source yet` em `signup-form.tsx` mostra que a Fase 02 conviveu com o sintoma, lendo-o como "o spec ainda vai crescer".
  - O guarda novo verifica o **`openapi.json` commitado**, não o export em processo: sob ts-jest o plugin também não roda, então um teste in-process jamais poderia cobrir isso. É o artefato commitado que o frontend consome para gerar `types.gen.ts`.
  - Bug real em `formatRelativeDate`: `Intl.DateTimeFormat.format` lança `RangeError` com data inválida em vez de devolver "Invalid Date", então a validação tinha de vir **antes** da formatação. O teste pegou.
  - `parsePage` rejeita `"1e3"`, `"0x10"` e `" 2 "` com checagem de dígitos em vez de confiar no `Number()`, que aceita as três formas. Entrada inválida cai na página 1 em vez de virar 400 — o valor vem da URL, que o usuário edita à mão.
  - O `returnTo` passado ao helper de leitura carrega a página atual, para que depois de renovar a sessão o usuário volte ao mesmo recorte da lista, não ao começo.

### SI-04.12.0 — Drift audit: Tela de edição de vídeo
- **Status:** completed
- **Tests:** n/a (audit-only; o relatório é a entrega). Backend revalidado na mesma rodada: 218/218 e 95/95
- **Observations:**
  - Seção `## Screen: edicao-video` no `frontend-drift-report.md`. 12 componentes: 3 alinhado, 7 drift menor, 2 drift relevante, 0 ausente.
  - **Dívida minha da SI-04.0.1, descoberta aqui:** `textarea.tsx`, `select.tsx` e `radio-group.tsx` foram instalados via shadcn e **nunca reconciliados** com os tokens do projeto. Ficaram com `rounded-lg`, `border-input`, `text-base`/`text-sm` e overrides `dark:` que os tokens semânticos já cobrem. O `input.tsx` e o `button.tsx`, herdados da Fase 02, estão corretos — o contraste entre eles é a evidência. `next-frontend-ui.md` § Shadcn primitives exige essa reconciliação no momento do install.
  - **Pior caso: `select.tsx` referencia `var(--radius-md)`, que não existe neste projeto** (a escala é `--radius-0-5`…`--radius-6`). A expressão `min(var(--radius-md),10px)` cai no fallback, então o raio do trigger em tamanho `sm` está indefinido hoje.
  - Cinco decisões ficaram `exception` porque o alvo é compartilhado com as telas de auth da Fase 02, já auditadas e entregues (`BackLink` azul, `Card` raio 16, `Label` bold, `Input` raio 10). Alinhar só esta tela quebraria a consistência entre formulários — é decisão de design system, não drift de tela.
  - Mantive `aspect-video` no `ThumbnailUploader` em vez da altura fixa de 160px do mock: a proporção é o que o próprio texto de apoio promete ("16:9 recomendada") e se adapta à largura da coluna.
  - Não são UI e não geraram linha: a moldura de navegador do topo (bolinhas + barra de URL) e a fonte `Manrope`, que não existe no projeto (Inter + Geist Mono). A categoria "Tutoriais" do mock não pertence ao enum do TD-10 — Open Question já registrada no inventário.
  - **Economia de orçamento Figma:** 1 leitura para esta tela, confirmando o padrão descoberto na SI-04.11.0. Total da fase até aqui: 2 leituras para 2 telas.

### SI-04.12a — Tela de edição de vídeo (visual shell)
- **Status:** completed
- **Tests:** shell sem testes próprios (gate de build); tsc exit 0
- **Observations:**
  - Aplicadas as decisões `auto-Edit` da auditoria. O caso mais importante foi o **`select.tsx` com `min(var(--radius-md),10px)`**: a variável não existe neste projeto, então a expressão caía no fallback e o raio do trigger `sm` ficava indefinido. Trocado por `--radius-2`.
  - `textarea.tsx` e `radio-group.tsx` reconciliados com os tokens do projeto (`border-border`, `bg-input-background`, `text-body-lg`, raio por token) e sem os overrides `dark:` que os tokens semânticos já cobrem — agora espelham o `input.tsx`.
  - As cinco decisões `exception` (BrandLogo, Card, Label, Input, PlusIcon) não geraram edição, como previsto.

### SI-04.12b — Tela de edição de vídeo (lógica & wiring)
- **Status:** completed
- **Tests:** 33 da SI (15 em `edit-schema.test.ts`, 11 em `video-edit-form.wiring.test.tsx`, 4 novos em `route.integration.test.ts`, mais os 8 de apresentação adaptados); tsc exit 0, lint 0 erros
- **Observations:**
  - **O corpo do request é lido antes do fetcher**, não dentro dele: o `withRefresh` pode reexecutar o fetcher depois de renovar a sessão, e um `Request` já consumido não pode ser lido de novo. Há teste que prova o retry (`attempts === 2`).
  - O `PATCH` do BFF **não** define `Content-Type`: o boundary do multipart é gerado pelo fetch a partir do `FormData`, e fixá-lo à mão quebraria o parsing no upstream. O teste verifica que o header chega com `boundary=`.
  - "Salvar" **omite** `published` em vez de enviar `false`: omitir preserva o estado atual, enquanto `false` despublicaria sem o usuário pedir (TD-02). Há teste dedicado a essa ausência.
  - O intent do submit vive numa ref, não no estado: o evento de submit não sobrevive ao `await` do handler.
  - Erros de thumbnail (400/413) sobem pelo callback `onThumbnailError` e aparecem **sob o uploader**, não junto dos campos de texto — há teste garantindo que nesse caso nenhum `role="alert"` global é renderizado.
  - `VideoEditPanel` nasceu porque o arquivo escolhido no uploader precisa viajar no submit do formulário (TD-03): é o dono do estado que as duas colunas compartilham.

### SI-04.13.0 — Drift audit: Tela de edição do canal
- **Status:** completed
- **Tests:** n/a (audit-only; o relatório é a entrega)
- **Observations:**
  - Seção `## Screen: edicao-canal`. 6 componentes: 2 alinhado, 3 drift menor, 1 drift relevante.
  - Único drift relevante: o `@` do nickname fica **dentro** da caixa com borda no Figma, formando um campo único, enquanto em disco era um `<span>` irmão do `Input`, fora da borda — apareciam duas caixas onde o design mostra uma.
  - `Textarea` entrou como `alinhado` justamente porque a SI-04.12a já aplicou a reconciliação detectada na auditoria anterior; é a cadeia de `Prior` funcionando.
  - O nickname `joana.cria` do mock viola o allowlist `^[a-z0-9_]+$` do backend — Open Question já registrada, não drift.

### SI-04.13a — Tela de edição do canal (visual shell)
- **Status:** completed
- **Tests:** shell sem testes próprios (gate de build); tsc exit 0
- **Observations:**
  - O prefixo `@` passou para dentro de um wrapper que desenha a borda, com o `Input` sem borda própria. O anel de foco é preservado via `focus-within` no wrapper — sem isso o campo ficaria sem indicação visível de foco, que seria uma regressão de acessibilidade em troca de fidelidade visual.

### SI-04.13b — Tela de edição do canal (lógica & wiring)
- **Status:** completed
- **Tests:** 25 da SI (15 em `channels/edit-schema.test.ts`, 6 em `channel-edit-form.wiring.test.tsx`, 4 em `me/channel/route.integration.test.ts`); tsc exit 0
- **Observations:**
  - A allowlist `^[a-z0-9_]+$` é validada no cliente antes do envio, então "joana.cria" — o próprio exemplo do Figma — é barrado sem round-trip. Há teste com esse valor exato.
  - `NICKNAME_ALREADY_EXISTS` vira erro **inline no campo** via `setError`, não alerta global; o teste verifica que nenhum `role="alert"` é renderizado nesse caso.
  - Após salvar, `router.refresh()` é obrigatório: o layout `(studio)` lê `GET /me/channel` a cada requisição, e sem o refresh a navbar seguiria com o nome antigo.

### SI-04.14.0 — Drift audit: Página pública do canal
- **Status:** completed
- **Tests:** n/a (audit-only; o relatório é a entrega)
- **Observations:**
  - Seção `## Screen: pagina-publica-canal`. 8 componentes: 4 alinhado, 2 drift menor, 2 drift relevante.
  - Quatro componentes entraram como `alinhado` **porque as auditorias anteriores já os corrigiram** (SiteNavbar, Pagination) ou porque a decisão anterior se mantém (StreamTubeIcon, Button). A coluna `Prior` é o que torna isso rastreável.
  - `Avatar` recebeu `auto-Edit` aqui depois de ter recebido `exception` na SI-04.11.0, e isso **não é contradição**: lá a diferença era de 4px sobre um degrau existente; aqui o mock pede 80px, o dobro do maior degrau, para um uso estruturalmente diferente — o retrato do canal, não um adorno de navbar. A justificativa está escrita no relatório.
  - `VideoCard` exibia "1.200" onde o design escreve "1,2 mil": faltava `notation: "compact"`.

### SI-04.14a — Tela de Página pública do canal (visual shell)
- **Status:** completed
- **Tests:** shell sem testes próprios (gate de build); tsc exit 0
- **Observations:**
  - `Avatar` ganhou o degrau `xl` (80px) e a união de tipos foi ampliada junto — sem isso o `size="xl"` compilaria como erro.
  - `ChannelHeader` passou a consumir `formatVideosCount`, que centraliza o singular "1 vídeo".

## E2E — verificação de ponta a ponta (2026-09-22, após o fechamento das 28 SIs)

Ao fechar as SIs eu havia declarado os critérios de fluxo completo como **não verificados**,
porque acreditava que o Playwright não estava instalado. **Estava errado:** ele já existia, com
config, `instrumentation.ts` e 4 specs das Fases 02/03. O que não existia era funcionamento — a
suíte **nunca havia passado neste repositório**.

**Causa raiz encontrada:** o Turbopack empacotava `msw` e `@mswjs/interceptors`, que então
patcheavam cópias dos módulos em vez das instâncias reais usadas pelo fetch de servidor do Next.
Os interceptors se instalavam (confirmado por `Object.getOwnPropertySymbols(globalThis)`), mas
ficavam mudos, e toda chamada escapava para o host real (`SocketError: other side closed`).

**Correção:** `serverExternalPackages: ["msw", "@mswjs/interceptors"]` no `next.config.ts`.

**Armadilha operacional:** a mudança só vale após `rm -rf .next`. Um `restart` sozinho mantém os
bundles antigos e o sintoma reaparece de forma aparentemente intermitente — cheguei a
diagnosticar erroneamente como condição de corrida por causa disso.

**Hipóteses testadas e DESCARTADAS por medição** (registradas para não serem refeitas): captura
de `globalThis.fetch` pelo `openapi-fetch`; MSW e rotas em processos diferentes (mesmo PID);
existência de um `_nextOriginalFetch` acessível. A correção do `upstream.ts` foi mantida mesmo
não sendo a causa, porque conserta uma fragilidade real de ordem de import no Vitest.

**Resultado:** suíte de 34 cenários verdes. As 4 telas da Fase 04 verificadas em navegador real
(`channel-public` 6/6, `channel-videos` 6/6, `channel-settings` 6/6, `video-edit` 7/7),
**incluindo a rota `/@{nickname}` via rewrite**, que nenhum teste de Vitest alcança e que eu
havia marcado explicitamente como não verificável.

**Pendência resolvida em seguida:** as 4 falhas de `video-upload.e2e-spec.ts` (Fase 03) também
foram corrigidas. **Suíte de E2E completa: 38/38.** A suposição de que aquele fluxo estava "fora
do alcance da correção do MSW" era falsa — ele já era interceptado normalmente. As causas reais,
todas na camada de teste e nenhuma no código de produção, foram quatro:

1. **`getByRole("alert")` casava com o route announcer do Next** (`#__next-route-announcer__`),
   que existe vazio desde o carregamento e conta como visível: o `toBeVisible()` passava de
   imediato contra o elemento errado e o `toContainText` expirava. Escopado no `data-slot` da
   aplicação.
2. **O mock tus nunca devolvia `X-Video-Public-Id`.** O formulário lê esse header no
   `onAfterResponse` do POST para saber qual vídeo consultar; sem ele o polling batia em
   `/api/videos/` com id vazio (308 → 404) e a tela ficava presa em "enviando" para sempre,
   embora o upload completasse corretamente.
3. **Contadores em variáveis de módulo** (`pollTransitionCallCount`, `flakyPatchHasFailedOnce`).
   No Vitest isso é inofensivo porque cada arquivo recarrega os módulos, mas no E2E o dev server
   é um processo de longa duração: o estado sobrevivia entre execuções inteiras. Consequência
   grave: **o teste de retomada passava sem testar nada** — o gatilho de falha já tinha sido
   consumido numa execução anterior e nunca mais era injetado. Agora reiniciam a cada upload.
4. **O mock tus estava incorreto quanto ao protocolo:** o `HEAD` devolvia `Upload-Offset: 0` fixo
   e omitia `Upload-Length`. É a resposta do HEAD que diz ao cliente de onde retomar; sem o
   tamanho o tus repete HEAD e desiste. O mock passou a manter estado por upload.

Os itens 3 e 4 se escondiam mutuamente: o único teste capaz de provar o defeito de protocolo era
o mesmo que passava por acidente.

**Sobre a asserção de progresso:** o cenário exige que o progresso avance por chunk. Observar
`aria-valuenow` não funcionava — é detalhe interno do primitivo Radix. Passou a observar o texto
`N% enviado`, que o próprio `upload-form` renderiza, o que é mais fiel (verifica o que o usuário
lê) e resolveu de imediato. O critério original foi mantido, não afrouxado.

**Defeitos meus corrigidos no caminho:**
- **SI-04.8:** escrevi os gatilhos MSW sem ler os `.plan.md` que os consomem (`nickname_ocupado`
  em vez de `nickname_em_uso`, etc.), e faltava o mecanismo que permite variar por usuário — o
  token de login precisou passar a carregar a identidade.
- **Fixtures com `thumbnailUrl: null`** nas factories pública e do painel. Um vídeo publicado
  sempre tem thumbnail, nem que seja a auto-gerada pelo worker (TD-04); o `null` não representava
  nenhum caso real e escondia o `<img>` que as telas devem mostrar.

**Achado de acessibilidade que só o E2E revela:** a tela do painel vazio tem **dois** links
"Criar novo vídeo" com nome acessível idêntico e mesmo destino — um no cabeçalho, outro no estado
vazio. O Playwright barrou em *strict mode*. Os dois são pedidos pelo plano; marquei o estado
vazio com `data-slot` para a asserção poder ser específica. Nenhum teste de componente pegaria
isso, porque a duplicação só existe na composição da página.

**Sobre as asserções de multipart:** o Playwright não expõe o corpo de um `FormData` montado no
navegador (`postData()` e `postDataBuffer()` vêm vazios). Os campos enviados já são cobertos
campo a campo em `video-edit-form.wiring.test.tsx` — inclusive a AUSÊNCIA de `published` ao salvar
rascunho. No E2E a verificação passou a ser sobre o efeito observável, que é o que aquela camada
realmente consegue provar.

---

### SI-04.14b — Tela de Página pública do canal (lógica & wiring)
- **Status:** completed
- **Tests:** 4 da SI (`formatVideosCount` em `format.test.ts`) + `video-card.test.tsx` atualizado para a notação compacta; tsc exit 0, lint 0 erros
- **Observations:**
  - A rota `/@{nickname}` é servida por `rewrites` no `next.config.ts`, e não por uma pasta `app/@nickname`: no App Router uma pasta iniciada por `@` é **slot de rota paralela**, não segmento de URL. A sintaxe foi conferida em `node_modules/next/dist/docs/01-app/.../rewrites.md`, como o plano pede.
  - **Limite de verificação, dito explicitamente:** um `rewrite` não é exercitado por teste unitário nem pelo Vitest — só um E2E de navegador prova que `/@joana_cria` chega em `app/channels/[nickname]`. O spec existe (`next-frontend/specs/channel-public.plan.md`), mas **o Playwright ainda não está instalado** neste subprojeto. Então a rota está escrita conforme a doc, e **não** verificada em execução. Não considero esse critério de aceite comprovado.
  - A página não usa o helper `fetchFromUpstream`: ela é anônima (TD-08), e o helper redireciona para `/login` quando não há sessão — o que quebraria justamente o caso principal. Chama o `upstream` direto, sem Bearer.
  - As duas chamadas (canal e vídeos) vão em `Promise.all`: são independentes, e encadeá-las dobraria a latência da primeira pintura.
  - Só o erro do **canal** vira `notFound()`. Se a listagem falhar mas o canal existir, a página ainda renderiza o cabeçalho com a vitrine vazia, em vez de dizer que o canal não existe.
  - `VideoCard` passou à notação compacta ("1,3 mil" no lugar de "1.284"), e o teste que fixava o formato antigo foi atualizado junto — mudança de comportamento deliberada, vinda da auditoria de drift.
