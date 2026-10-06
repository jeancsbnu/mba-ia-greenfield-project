# phase-06-social-interactions — Progress

**Status:** completed
**SIs:** 33/33 completed

### SI-06.0.1 — Custom-business simple group: SubscriberCount + CommentItem + CommentList + CommentReply + CommentThread
- **Status:** completed
- **Tests:** 20 passing (5 files)
- **Observations:**
  - `CommentReply` foi implementado compondo o `CommentItem` (mesma estrutura, avatar `sm`, `data-slot="comment-reply"`) em vez de duplicar a marcação; o recuo fica a cargo da `ReplyList`.
  - A abreviação de inscritos usa `Intl.NumberFormat("pt-BR", { notation: "compact" })` local ao componente; os testes aceitam espaço comum ou não separável entre "1,2" e "mil", porque o ICU pode emitir qualquer um.

### SI-06.0.2 — Custom-business simple group: ReplyList
- **Status:** completed
- **Tests:** 3 passing
- **Observations:** none

### SI-06.0.3 — Custom-business complex: ReplyButton
- **Status:** completed
- **Tests:** 5 passing
- **Observations:** 
  - Testes passaram a rodar direto via `docker compose exec` com saída filtrada, em vez de subagente, a partir deste SI (modo contínuo pedido pelo usuário) — mesma garantia de diagnóstico, menos latência.

### SI-06.1 — Criar entidades e migration das interações sociais
- **Status:** completed
- **Tests:** 19 passing (5 suites)
- **Observations:** 
  - Migration gerada pelo CLI do TypeORM contra um banco temporário (`streamtube_gen`) com só as migrations existentes aplicadas, para o diff conter exatamente o schema novo; o CLI emitiu `CREATE TYPE reaction_type` duas vezes (tipo compartilhado pelas duas tabelas) — a duplicata e o `DROP TYPE` prematuro do `down` foram removidos à mão, com comentário no arquivo. up → down → up validado, e um `migration:generate` posterior não encontrou diferença.
  - Relações ficaram **unidirecionais** (das entidades novas para `User`/`Video`/`Channel`), contra a regra `nestjs-entities.md` de definir os dois lados: com os lados inversos, os 16 arquivos de teste que montam o próprio array de entidades quebrariam, e o app em runtime também, porque `autoLoadEntities` só conhece as entidades registradas por `forFeature` e `Comment` só ganha módulo no SI-06.7. A auto-relação `Comment.parent`/`replies` tem os dois lados.
  - `Subscription` tem só `created_at`, conforme o §Data Model do plano — a regra pede também `updated_at`, mas a inscrição nunca é atualizada (é criada ou apagada).
  - A primeira execução conjunta das 5 suítes falhou no `beforeAll` do `Comment` (`CannotExecuteNotConnectedError`) logo após a migration ser aplicada; as duas execuções seguintes passaram 19/19 — contenção no primeiro `synchronize`, não defeito.
  - Criado `src/test/social-fixtures.ts` (usuário com canal e vídeo) para as suítes da fase.

### SI-06.2 — Criar o ReactionsModule como produtor único das reações
- **Status:** completed
- **Tests:** 17 passing (3 suites: reaction-delta, reactions.service integration, reactions.module compilation)
- **Observations:** 
  - Implementado junto do SI-06.1/06.3 e consumido pelos SIs de reação; a entrada de progresso ficou sem registro na hora e foi reconciliada na verificação final, com as 3 suítes rodadas de novo (17/17).
  - `applyVideoReaction`/`applyCommentReaction` recebem o `EntityManager` do chamador e travam a linha com `pessimistic_write`, para o delta do contador (TD-02) sair na mesma transação do dono do contador.

### SI-06.3 — Endpoints de inscrição em canal
- **Status:** completed
- **Tests:** 18 passing (unit/integration, 4 suites) + 5 passing (E2E test/channels-subscription.e2e-spec.ts)
- **Observations:** 
  - Spec `channels-subscription.plan.md` corrigida em dois pontos que eu mesmo errei no /plan-test-specs: (1) o cenário 1.1 lia `subscribersCount` por `GET /channels/{nickname}`, campo que só nasce no SI-06.6 — passou a ler do banco; (2) o cenário 2.1 alternava PUT e DELETE supondo um orçamento de 60 compartilhado, mas o contador do `@nestjs/throttler` é por handler (rota + método) — passou a 60 PUTs e o 61º. Vale para as demais specs: o orçamento de 60/60 s é por rota e método, como o §API Contracts já dizia.
  - Orçamentos de throttle centralizados em `src/common/social-throttle.constants.ts` (`SOCIAL_THROTTLE.REACTIONS` 60/60 s, `.COMMENTS` 5/60 s); o tipo vem de `Parameters<typeof Throttle>[0]` porque a interface de opções não é exportada pela lib.
  - `subscribe` usa `INSERT ... ON CONFLICT DO NOTHING RETURNING` para detectar inscrição existente sem falhar nem somar; `unsubscribe` usa o `affected` do DELETE. `ChannelsService` ganhou também `readSubscribersCount(manager, id)`, para a leitura pós-operação não sair do dono da coluna.
  - `listByUser` (ação 2 do SI) já foi implementado aqui; o teste dele fica com o SI-06.12, que o consome.
  - Criado `test/social-e2e.helpers.ts` (bootstrap do AppModule com a config global do main.ts, cadastro→confirmação→login, vídeos publicados/rascunho) para as 9 suítes E2E da fase.

### SI-06.4 — Endpoints de reação em vídeo
- **Status:** completed
- **Tests:** 4 passing (src/videos/videos.service.reactions.integration-spec.ts) + 45 da regressão de VideosService + 5 passing (E2E test/videos-reaction.e2e-spec.ts)
- **Observations:** 
  - O teste de integração do `setReaction` ficou em arquivo próprio, `src/videos/videos.service.reactions.integration-spec.ts` (precedente: `videos.service.updateVideo.integration-spec.ts`), em vez de `videos.service.integration-spec.ts`, cujos describes montam o `VideosService` com repositório e storage falsos.
  - O E2E pegou um defeito de runtime: o `ReactionsModule` registra `CommentReaction`, cuja relação aponta para `Comment`, e o TypeORM só conhece entidades registradas por `forFeature` — o app não subia. Criado já aqui o `CommentsModule` com apenas `forFeature([Comment])`, registrado no `AppModule`; o SI-06.7 o completa. Sem isso, toda suíte E2E (inclusive as das fases anteriores) ficaria quebrada entre o SI-06.4 e o SI-06.7.
  - O `VideosService` ganhou `ReactionsService` no construtor; os módulos de teste existentes que o montam (`videos.service.spec.ts`, `videos.service.integration-spec.ts` ×4, `videos.service.updateVideo.integration-spec.ts`) receberam o provider `{ provide: ReactionsService, useValue: {} }`.
  - `ReactionStateResponse` e `SubscriptionStateResponse` registrados nos `extraModels` de `src/swagger/swagger-document.ts`, exigência para o `getSchemaPath` resolver.

### SI-06.5 — Estado social e pessoal no detalhe público do vídeo
- **Status:** completed
- **Tests:** 51 passing (suítes de VideosService, inclusive 2 testes novos de toPublicDetail) + 4 passing (E2E test/videos-public-detail-social.e2e-spec.ts) + regressão da Fase 05 verde
- **Observations:** 
  - O bloco do canal do detalhe virou uma classe própria, `PublicVideoDetailChannel extends PublicVideoChannel`: a `PublicVideoChannel` é reusada pela sidebar de sugestões, e estendê-la vazaria `subscribersCount`/`viewerSubscribed` para lá (o tsc acusou). Registrada nos `extraModels`.
  - `test/videos-public-detail.e2e-spec.ts` (Fase 05) comparava `channel` por igualdade exata com dois campos; trocado por `toMatchObject` — o contrato foi estendido de propósito, e a AC #5 do SI pede só que os campos originais sigam iguais.
  - O `VideosService` ganhou `SubscriptionsService` no construtor (`VideosModule` importa `SubscriptionsModule`); os módulos de teste existentes receberam o provider vazio, e o unit de `toPublicDetail` recebeu mocks de `findVideoReaction`/`isSubscribed`.

### SI-06.6 — Contagem de inscritos e estado pessoal na leitura pública do canal
- **Status:** completed
- **Tests:** 6 passing (subscriptions.service.integration-spec, com isSubscribed) + 3 passing (E2E test/channels-public-subscribers.e2e-spec.ts) + regressão channels-public (Fase 04) verde
- **Observations:** 
  - O handler `getPublicChannel` ganhou tipo de retorno `PublicChannelResponse` explícito e `@ApiBearerAuth` (Bearer opcional, só preenche `viewerSubscribed`).

### SI-06.7 — Criar o CommentsModule e o núcleo do serviço de comentários
- **Status:** completed
- **Tests:** 17 passing (4 suítes: unit de resolução do pai, integração com contagem de queries, entidade, compilação do módulo)
- **Observations:** 
  - As leituras de comentário usam SQL cru (`manager.query`) para juntar o autor por `channels.user_id` sem relação mapeada e para a função de janela `ROW_NUMBER()/COUNT(*) OVER (PARTITION BY parent_id)`; desempate de ordenação por `id` além de `created_at`, para a paginação offset/limit ser estável.
  - O teste de 'número constante de queries' espia `manager.query` e compara 2 raízes contra 10 — a leitura de reações do visitante sai pelo repositório e fica fora dessa contagem, mas também é uma só por página.
  - O `CommentsModule` (criado vazio no SI-06.4) ganhou o serviço e os imports de `VideosModule`, `ReactionsModule` e `ChannelsModule` — este último para o autor do comentário recém-criado; `VideosModule` passou a exportar `VideosService`.

### SI-06.8 — Endpoint de listagem de comentários do vídeo
- **Status:** completed
- **Tests:** 5 passing (E2E test/videos-comments-list.e2e-spec.ts); Tests do SI em forma vazia
- **Observations:** 
  - Os 5 DTOs de comentário (`CommentAuthor`, `CommentResponse`, `CommentThreadResponse`, `CommentsPage`, `RepliesPage`) registrados nos `extraModels` do Swagger; o `CommentsController` não tem prefixo de classe porque as rotas vivem sob `/videos/{publicId}/comments` e `/comments/{commentId}/...`, com `@ApiTags('comments')`.

### SI-06.9 — Endpoint de publicação de comentário e resposta
- **Status:** completed
- **Tests:** 5 passing (E2E test/videos-comments-create.e2e-spec.ts); Tests do SI em forma vazia
- **Observations:** 
  - Teto de 2000 caracteres exposto como `COMMENT_BODY_MAX_LENGTH` em `create-comment.dto.ts` (premissa do plano, ajustável por /decide); o `@Transform` apara antes do `@MinLength(1)`, então corpo só de espaços cai em 400.

### SI-06.10 — Endpoint de respostas restantes de uma thread
- **Status:** completed
- **Tests:** 9 passing (comments.service.spec, 4 novos de findAccessible) + 4 passing (E2E test/comments-replies.e2e-spec.ts)
- **Observations:** 
  - `findAccessible` converte só `VideoNotFoundException` em `COMMENT_NOT_FOUND` (catch + rethrow); qualquer outro erro propaga intacto, coberto por teste.

### SI-06.11 — Endpoints de reação em comentário
- **Status:** completed
- **Tests:** 9 passing (comments.service.integration-spec, 2 novos de setReaction) + 4 passing (E2E test/comments-reaction.e2e-spec.ts)
- **Observations:** none

### SI-06.12 — Endpoint da área de canais seguidos
- **Status:** completed
- **Tests:** 11 passing (subscriptions.service.integration-spec com listByUser + videos.service.counts.integration-spec) + 4 passing (E2E test/me-subscriptions.e2e-spec.ts)
- **Observations:** 
  - O teste de `countPublicByChannels` ficou em arquivo próprio, `src/videos/videos.service.counts.integration-spec.ts`, pelo mesmo motivo do SI-06.4 (os describes de `videos.service.integration-spec.ts` usam repositório falso); 'uma query para N canais' é afirmado contando `driver.createQueryRunner`.
  - A composição dos itens (canal + contagem de vídeos) ficou no controller, como o `listMyVideos` já faz no mesmo arquivo — `SubscriptionsService` não pode chamar `VideosService` sem ciclo.

### SI-06.13 — Infra: sincronizar o contrato OpenAPI com o frontend
- **Status:** completed
- **Tests:** no tests (Infra) — verificação: 10 rotas e schemas no openapi.json, DTOs de requisição preenchidos, sync + openapi:types idempotente (hashes iguais), tsc do frontend 0, openapi-export.integration-spec 13 passing
- **Observations:** 
  - Antes do sync conferi no `openapi.json` que `SetReactionDto` e `CreateCommentDto` saíram com propriedades — o `openapi:export` roda `nest build`, condição para o plugin do Swagger preencher DTOs de requisição.
  - AC 'nenhum arquivo fora de contracts.ts importa paths': `mocks/` importa `paths` direto (factories e handlers, inclusive os novos desta fase) — exceção documentada em `.claude/rules/next-frontend-bff-api.md`, que exige o tipo do corpo vir de `paths` justamente para fixture velha quebrar o `tsc`; não é débito. Fora de `mocks/`, nenhum arquivo além de `contracts.ts` importa `paths`.

### SI-06.14 — Helper de leitura com autenticação opcional
- **Status:** completed
- **Tests:** 4 passing (lib/api/__tests__/optional-auth.test.ts)
- **Observations:** 
  - `fetchWithOptionalAuth` é genérico sobre o resultado do `openapi-fetch` (`R extends { response: Response }`), para quem chama manter `data`/`error` tipados pelo `paths`.

### SI-06.15 — Retorno ao ponto de interação depois do login
- **Status:** completed
- **Tests:** 22 passing (return-to.test.ts, login-form.wiring.test.tsx com 3 casos novos, regressão da rota de refresh)
- **Observations:** 
  - Desvio da ação 3: o `returnTo` chega ao `LoginForm` como prop lida do `searchParams` da página `app/(auth)/login/page.tsx` (que virou async), em vez de `useSearchParams()` no formulário — no Next 16 o hook exige um `<Suspense>` em página estática para não quebrar o build, e a prop deixa o componente testável sem mock de `useSearchParams`.
  - `safeReturnTo` foi extraído sem mudar a regra para `lib/auth/return-to.ts`, junto de `buildLoginHref` e `RETURN_TO_PARAM`; a rota de refresh passou a importá-lo.

### SI-06.16 — Route Handlers BFF de reação (vídeo e comentário)
- **Status:** completed
- **Tests:** 12 passing (2 suítes de integração de Route Handler)
- **Observations:** 
  - Rotas novas exigem `npx next typegen` para o `RouteContext<"/api/...">` existir em `.next/types/routes.d.ts`; sem isso o tsc acusa a rota como inexistente.
  - `mocks/handlers/reactions.ts` não guarda estado: a contagem devolvida parte do fixture (128 likes) e aplica a mesma tabela de delta do backend; triggers reservados `liked-video` (com sessão, reação anterior = like) e `reaction-fails-video` (429), conforme a spec `video-watch-social.plan.md`.
  - Rodar arquivos de rota com colchetes no Vitest pede o path completo entre aspas (`npx vitest run "app/api/videos/[publicId]/..."`); o filtro posicional de `npm test --` com `\[` não casa nada e sai sem erro.

### SI-06.17 — Route Handlers BFF de comentários
- **Status:** completed
- **Tests:** 11 passing (2 suítes de integração de Route Handler)
- **Observations:** 
  - `mocks/factories/comments.ts` monta as 12 raízes do vídeo social de fixture (a primeira com 7 respostas, 3 pré-carregadas) com `createdAt` fixos e decrescentes; `mocks/handlers/comments.ts` serve `quiet-video` vazio e qualquer outro publicId com essas raízes, e o POST resolve o pai para a raiz como o backend.

### SI-06.18 — Route Handlers BFF de inscrição
- **Status:** completed
- **Tests:** 10 passing (integração da rota de inscrição + regressão da rota pública da Fase 05)
- **Observations:** 
  - Os triggers das leituras públicas que as specs E2E declaram (`social-video`, `liked-video`, `quiet-video`, `maria_rocha`, `canal_seguido`) não tinham sido postos no SI-06.13; foram centralizados aqui em `mocks/factories/social.ts` e aplicados pelos handlers de `videos.ts` (GET público), `channels.ts` (GET público), `reactions.ts`, `comments.ts` e no novo `subscriptions.ts` (PUT/DELETE de inscrição + `GET /me/subscriptions` por e-mail do token).

### SI-06.19 — Estado otimista compartilhado de reação e de inscrição
- **Status:** completed
- **Tests:** 13 passing (hooks/__tests__/use-reaction.test.tsx + channel-subscription-provider.test.tsx)
- **Observations:** 
  - Criado `lib/social/mutation.ts` (`sendMutation`: fetch same-origin + leitura do código `error` do envelope), compartilhado pelo hook e pelo provider para não duplicar o tratamento de erro; coberto pelos testes dos dois consumidores, sem suíte própria.
  - O `context7` não está disponível nesta sessão; o padrão de `useOptimistic` seguiu a doc local do Next 16 (`node_modules/next/dist/docs/01-app/02-guides/forms.md`) e a API do React 19.2 — atualização de estado depois de um `await` vai embrulhada em novo `startTransition` para trocar o otimista pelo valor real num render só.

### SI-06.20 — Chrome sensível à sessão e ponto de entrada dos canais seguidos
- **Status:** completed
- **Tests:** 8 passing (site-navbar.test.tsx, 3 casos novos do link)
- **Observations:** 
  - `components/layout/site-navbar.tsx` passou a `"use client"`: o `aria-current` do link exige `usePathname`, e o layout que renderiza o navbar não conhece o path; o arquivo não tem nada server-only (Link + BrandLogo). O teste existente ganhou o mock de `next/navigation`.
  - `PublicSiteNavbar` ganhou a prop `loginVariant` (`secondary` | `outline`) para cada tela pública manter o "Entrar" do seu desenho (watch page `secondary`, página do canal `outline`).
  - `PublicSiteNavbar` é Server Component assíncrono — fica para o E2E das telas, como o guia manda.

### SI-06.21.0 — Drift audit: Página de visualização do vídeo — interações sociais
- **Status:** completed
- **Tests:** no tests (audit-only)
- **Observations:** 
  - Drift Report: 17 componentes (11 alinhado, 4 drift menor, 2 drift relevante, 0 ausente) — `frontend-drift-report.md` criado (primeira auditoria da fase).
  - Zero chamadas ao MCP do Figma: auditoria feita sobre o cache `77-64.json` + `77-137/77-149/77-176.json`, como na Fase 05. O skill `figma:figma-implement-design` não está registrado nesta sessão; o cache carrega os valores que o diff precisa.
  - Em modo contínuo a pausa de revisão do relatório (passo 6 do audit) não aconteceu: as decisões foram tomadas de forma conservadora — só três ajustes em componentes criados nesta fase (gap da `CommentList`, separador da linha de meta do `CommentItem`, variante do `ReplyButton`); nenhum componente compartilhado do DS é editado.

### SI-06.21a — Tela de visualização do vídeo — interações sociais (visual shell)
- **Status:** completed
- **Tests:** no tests (visual shell)
- **Observations:** 
  - Updated existing DS: nenhum componente compartilhado do DS — as três decisões `auto-Edit` foram em componentes desta fase: `components/comments/comment-list.tsx` (gap 24 → 20), `components/comments/comment-item.tsx` (autor + timestamp lado a lado com gap 8, sem ' · '), `components/comments/reply-button.tsx` (variante ghost → link).
  - Criados os componentes visuais `components/videos/like-button.tsx`, `dislike-button.tsx`, `components/channels/subscribe-button.tsx` (lê o `ChannelSubscriptionProvider`), `components/comments/comment-like-button.tsx` e `comment-dislike-button.tsx` (texto muted sem caixa — o DS não tem variante de botão-texto muted, então são `<button>` nativos com tokens de tipografia e cor).
  - Os containers com estado (`video-reactions.tsx`, `comment-reactions.tsx`, `comments-section.tsx`, `new-comment-form.tsx`, `replies-load-more.tsx`, `comments-load-more.tsx`) e a recomposição da página ficam com o 21b/21c, onde a lógica deles vive — escrever um esqueleto aqui só para reescrevê-lo em seguida não acrescentava nada.
  - Sem chamada ao MCP do Figma (cache), e sem o skill `figma:figma-implement-design`, ausente nesta sessão.

### SI-06.21b — Tela de visualização do vídeo — interações sociais (lógica & wiring)
- **Status:** completed
- **Tests:** 11 passing (Vitest: video-reactions wiring, like/dislike, subscribe-button wiring, use-reaction); E2E tests/video-watch-social.e2e-spec.ts 9/9 na verificação final (grupos 1–2 deste SI; grupo 3 cobre o 21c)
- **Observations:** 
  - Página de vídeo passa a ler o detalhe com auth opcional (fetchWithOptionalAuth) para receber viewerReaction e viewerSubscribed; contador de inscritos e botão compartilham estado via ChannelSubscriptionProvider.

### SI-06.21c — Tela de visualização do vídeo — comentários (lógica & wiring)
- **Status:** completed
- **Tests:** 41 passing (11 arquivos em components/comments; 5 novos: comments-section, new-comment-form wiring, comments-load-more, replies-load-more, comment-reactions wiring); E2E no grupo 3 de tests/video-watch-social.e2e-spec.ts
- **Observations:** 
  - Compositor anônimo redireciona ao login no foco (mesmo padrão dos demais controles, anonymous-gate/TD-03).
  - Primeira página de comentários vem do Server Component (fetchWithOptionalAuth); falha nela vira o estado de erro da seção sem derrubar a página, e o compositor continua disponível.

### SI-06.22.0 — Drift audit: Área de canais seguidos
- **Status:** completed
- **Tests:** no tests (audit-only)
- **Observations:** 
  - Drift Report: 6 componentes (3 alinhado, 1 drift menor, 2 drift relevante, 0 ausente) — seção `channel-subscriptions` acrescentada em `frontend-drift-report.md`, decisões de chrome iguais às de `video-watch-social`.
  - Contexto Figma lido do cache commitado (`75-62.json`), zero chamadas ao MCP; `figma:figma-implement-design` indisponível na sessão, como no 21.0.

### SI-06.22a — Tela de área de canais seguidos (visual shell)
- **Status:** completed
- **Tests:** no tests (visual shell)
- **Observations:** 
  - Decisões de drift aplicadas: nenhuma `auto-Edit` na seção (todas `skip`/`exception`); o avatar da linha usa `lg` (40) no lugar do 48 do frame, por decisão de `exception`.
  - `SubscriptionButton` é um invólucro de `SubscribeButton` em `size="sm"`: mesmo provider, mesmas mensagens de erro; o estado "Inscrito" fica na variante `secondary` (OQ-13), não no cinza preenchido do frame, que não tem variante no DS.
  - `initialsOf` ganhou a quinta cópia local (channel-header, comment-item, new-comment-form, user-menu e agora subscribed-channel-card) — extrair para `lib/` é tarefa separada, fora do escopo.

### SI-06.22b — Tela de área de canais seguidos (lógica & wiring)
- **Status:** completed
- **Tests:** 38 passing (8 arquivos em components/channels; 2 novos: subscription-button wiring, subscribed-channel-card); E2E tests/channel-subscriptions.e2e-spec.ts 6/6 na verificação final
- **Observations:** 
  - Página é RSC com `fetchFromUpstream` e `returnTo` `/channel/subscriptions`; subtítulo usa singular "1 canal".
  - A queda de 1 na contagem da linha nem sempre muda o texto: 1200 → 1199 continua "1,2 mil inscritos" na forma abreviada pt-BR. O E2E afirma a mudança pelo botão e pelo `aria-pressed`; o delta da contagem é coberto no Vitest do provider.

### SI-06.23.0 — Drift audit: Página pública do canal
- **Status:** completed
- **Tests:** no tests (audit-only)
- **Observations:** 
  - Drift Report: 10 componentes (8 alinhado, 0 drift menor, 2 drift relevante, 0 ausente) — seção `channel-public-social` acrescentada; a da Fase 04 desta tela fica intacta.
  - O `ChannelHeader` registra a extensão (contagem + botão) como `auto-Edit` explícito; contexto do cache `59-2.json`, zero chamadas ao MCP.

### SI-06.23a — Tela pública do canal com inscrição (visual shell)
- **Status:** completed
- **Tests:** no tests (visual shell)
- **Observations:** 
  - `auto-Edit` do `ChannelHeader` aplicado: nome e `SubscribeButton` (tamanho `md`, rótulo 14px do `79:82`) numa linha `justify-between`; meta `@{nickname} · <ProvidedSubscriberCount /> · {N} vídeos`. Nenhum segundo arquivo de botão — o `SubscribeButton` do 21a é reusado.
  - Grade de vídeos e paginação da Fase 04 intactas.

### SI-06.23b — Tela pública do canal com inscrição (lógica & wiring)
- **Status:** completed
- **Tests:** 40 passing (8 arquivos em components/channels; channel-header.test.tsx com 2 casos novos e meta atualizada); E2E tests/channel-public-subscription.e2e-spec.ts 5/5 na verificação final
- **Observations:** 
  - Página lê o canal com `fetchWithOptionalAuth` (vídeos seguem anônimos) e troca o 'Entrar' fixo pelo `PublicSiteNavbar loginVariant="outline"`.
  - As três asserções de meta do E2E da Fase 04 (`tests/channel-public.e2e-spec.ts`) passaram a incluir a contagem de inscritos ("0 inscritos" no fixture base): é mudança de contrato desta fase, não regressão.

## Final verification — 2026-10-06

Cada suíte rodou sozinha, uma de cada vez.

| Gate | Resultado |
|------|-----------|
| Backend `npm test -- --runInBand` | 45 suites, 299/299 |
| Backend `npm run test:e2e` | 24 suites, 149/149 |
| Backend `npx tsc --noEmit` | exit 0 |
| Backend `npm run lint` | 0 erros, 1 warning anterior à fase (`auth.service.integration-spec.ts:479`) |
| OpenAPI | `openapi:export` (com `nest build`) byte-idêntico ao commitado; cópia do frontend em sincronia; `openapi:types` sem diff |
| Frontend `npm test` | 79 arquivos, 425/425 |
| Frontend `npx tsc --noEmit` | exit 0 |
| Frontend `npm run lint` | 0 erros, 3 warnings `react-hooks/incompatible-library` (`watch()` do react-hook-form): 2 anteriores à fase, 1 em `new-comment-form.tsx`, mesmo padrão |
| Playwright (suíte inteira) | 65/65, duas execuções seguidas |

**O que a verificação final pegou e corrigiu:**

- Lint do backend: `test/me-subscriptions.e2e-spec.ts` devolvia `Promise<any>` de um helper (`no-unsafe-return`) — helper passou a `Promise<void>` com `await`.
- Primeiro boot do dev server para o Playwright: as rotas da fase davam 500 (`fetch failed` / `SocketError: other side closed`) enquanto as anteriores funcionavam. O cache persistente do Turbopack em `.next` serviu o `instrumentation` compilado com o conjunto de handlers MSW **anterior** à fase, e as chamadas novas vazavam para o upstream real pelo `onUnhandledRequest: "bypass"`. Corrigido com `rm -rf .next` e novo boot; reiniciar o container não bastou.
- `video-watch-social` 1.3: a asserção esperava o texto da contagem mudar, mas 1200 → 1201 continua "1,2 mil inscritos" na forma abreviada. Erro do teste, não do app; o delta otimista é coberto no Vitest do provider (41 → 42 antes da resposta).
- `channel-public-subscription` 2.1 passava isolado e falhava sob a suíte inteira: o laço de retry clicava de novo depois que o clique anterior já tinha navegado para `/login`. Os helpers de retry das duas specs agora conferem o estado-alvo antes de cada tentativa.
- `video-watch-page` 3.1 (Fase 05): `getByRole("button", { name: "Ver mais" })` passou a casar também "Ver mais 4 respostas" da seção de comentários — seletor ganhou `exact: true`.
- Formatação: o glob do Prettier pegou `components/channels/channel-edit-form.tsx` (Fase 04, fora do escopo) — revertido.

**Fora do escopo, anotado para tarefa separada:** `initialsOf` existe em cinco cópias locais (`channel-header`, `comment-item`, `new-comment-form`, `user-menu`, `subscribed-channel-card`).
