---
kind: phase
name: phase-06-social-interactions
test_specs_aware: true
sources_mtime:
  docs/phases/phase-06-social-interactions/context.md: "2026-10-04T20:51:04-03:00"
  docs/decisions/technical-decisions-social-interactions.md: "2026-10-04T18:59:57-03:00"
  docs/decisions/technical-decisions-social-interactions-anonymous-gate.md: "2026-10-01T21:50:20-03:00"
  docs/decisions/technical-decisions-next-frontend-openapi-typing.md: "2026-10-03T21:48:21-03:00"
  docs/decisions/technical-decisions-next-frontend-msw-foundation.md: "2026-06-29T19:03:26-03:00"
  docs/decisions/technical-decisions-openapi-docs-nestjs.md: "2026-06-29T19:03:26-03:00"
sources_hash:
  docs/phases/phase-06-social-interactions/context.md: "8732f61e249e"
  docs/decisions/technical-decisions-social-interactions.md: "6383d9ab58c1"
  docs/decisions/technical-decisions-social-interactions-anonymous-gate.md: "b08d6f49f958"
  docs/decisions/technical-decisions-next-frontend-openapi-typing.md: "371ec55c2f2a"
  docs/decisions/technical-decisions-next-frontend-msw-foundation.md: "a53ada59d6a6"
  docs/decisions/technical-decisions-openapi-docs-nestjs.md: "7696624c8b2f"
---

# Phase 06 — Interações Sociais (Likes, Comentários, Inscrições)

## Objective

Entregar as interações sociais da plataforma — like e dislike em vídeos e em comentários, comentários com respostas aninhadas, inscrição em canais (seguir/deixar de seguir), a área de canais seguidos com acesso rápido à página de cada canal e a contagem de inscritos na página do canal —, com a interface completa de comentários, likes e inscrições na watch page e na página pública do canal, leitura aberta ao visitante anônimo e ações restritas a usuários autenticados.

---

## Step Implementations

### SI-06.0.1 — Custom-business simple group: SubscriberCount + CommentItem + CommentList + CommentReply + CommentThread

**Description:** Author business components sem state/scoring — pure presentational. Todos recebem dados por props e não fazem I/O; os controles de ação que eles hospedam chegam como `children`/slots, criados nas SIs das telas.

**Technical actions:**

1. Author `components/channels/subscriber-count.tsx` per UI Contract — recebe `count: number` e renderiza "N inscritos" em forma abreviada pt-BR ("1,2 mil inscritos"; singular "1 inscrito"), com `aria-live="polite"` para anunciar a mudança. Sem `"use client"` próprio: quem passa o valor otimista é o provider da inscrição.
2. Author `components/comments/comment-item.tsx` per UI Contract — avatar de iniciais, autor (`name` do canal), timestamp relativo e corpo; slot para a linha de ações (`comment-actions`).
3. Author `components/comments/comment-list.tsx` per UI Contract — renderiza as threads recebidas, sem buscar nada.
4. Author `components/comments/comment-reply.tsx` per UI Contract — item de resposta recuado, mesma estrutura do `CommentItem`.
5. Author `components/comments/comment-thread.tsx` per UI Contract — raiz + slot para a `ReplyList`; thread sem respostas não renderiza a lista.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `subscriber-count.tsx` | Unit per testing-guide-next-frontend § "Client Components" — abreviação pt-BR, singular, `aria-live` | `components/channels/__tests__/subscriber-count.test.tsx` |
| `comment-item.tsx` | Unit per testing-guide-next-frontend § "Client Components" | `components/comments/__tests__/comment-item.test.tsx` |
| `comment-list.tsx` | Unit per testing-guide-next-frontend § "Client Components" | `components/comments/__tests__/comment-list.test.tsx` |
| `comment-reply.tsx` | Unit per testing-guide-next-frontend § "Client Components" | `components/comments/__tests__/comment-reply.test.tsx` |
| `comment-thread.tsx` | Unit per testing-guide-next-frontend § "Client Components" | `components/comments/__tests__/comment-thread.test.tsx` |

**Dependencies:** none

**Acceptance criteria:**

- Each business component exists at its declared path and matches its UI Contract.
- Unit tests exercise rendering + props.
- `SubscriberCount` com `1234` exibe "1,2 mil inscritos" e com `1` exibe "1 inscrito".
- `CommentThread` sem respostas não renderiza nenhum elemento de lista de respostas.

---

### SI-06.0.2 — Custom-business simple group: ReplyList

**Description:** Author business components sem state/scoring — pure presentational. A lista de respostas de uma thread, separada do grupo anterior pelo teto de 5 por SI.

**Technical actions:**

1. Author `components/comments/reply-list.tsx` per UI Contract — renderiza as respostas recebidas (até 3 pré-carregadas, mais as que o "ver mais" acrescentar) e um slot no fim para o `RepliesLoadMore`.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `reply-list.tsx` | Unit per testing-guide-next-frontend § "Client Components" | `components/comments/__tests__/reply-list.test.tsx` |

**Dependencies:** none

**Acceptance criteria:**

- `components/comments/reply-list.tsx` exists and matches its UI Contract.
- Unit tests exercise rendering + props.
- A lista renderiza as respostas na ordem recebida, sem reordenar.

---

### SI-06.0.3 — Custom-business complex: ReplyButton

**Description:** Author `components/comments/reply-button.tsx` — business component com state per Notes "o botão só abre o compositor; quem publica é um `ReplyForm` à parte, irmão do `NewCommentForm` — mesma separação que a tela já usa entre o botão "Comentar" (Local-interactive) e o `NewCommentForm` (Server-connected)".

**Technical actions:**

1. Author `components/comments/reply-button.tsx` per UI Contract — `"use client"`; botão "Responder" que alterna a abertura do compositor de resposta por callback (`onToggle`) e expõe `aria-expanded`. Não publica nada: o I/O é do `NewCommentForm` reusado com `parentId` (OQ-12).

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `reply-button.tsx` | Unit per testing-guide-next-frontend § "Client Components" baseline | `components/comments/__tests__/reply-button.test.tsx` |
| `reply-button.tsx` | Unit: toggle assertions per Notes signal — clique alterna aberto/fechado e reflete em `aria-expanded` | (same file) |

**Dependencies:** none

**Acceptance criteria:**

- `components/comments/reply-button.tsx` exists and matches the UI Contract.
- Unit tests cover baseline rendering + the signal-driven logic (state transitions).
- Clicar em "Responder" alterna `aria-expanded` entre `false` e `true` e chama o callback de abertura.
- O componente não emite nenhuma requisição de rede.

---

### SI-06.1 — Criar entidades e migration das interações sociais

**Description:** Materializar o modelo de dados da fase — as duas tabelas de reação, comentários, inscrições e a contagem de inscritos no canal — antes de qualquer serviço que as use.

**Technical actions:**

1. Criar `src/reactions/entities/video-reaction.entity.ts` e `src/reactions/entities/comment-reaction.entity.ts`, com o enum `ReactionType` (`like`, `dislike`) e PK composta, conforme `### Data Model` → `VideoReaction` e `CommentReaction` (per `social-interactions/TD-01`).
2. Criar `src/comments/entities/comment.entity.ts` com `parent_id` nulável e auto-relação, `likes_count` default 0 e os dois índices compostos, conforme `### Data Model` → `Comment` (per `social-interactions/TD-04`). Sem `dislikes_count` (per `social-interactions/TD-03`).
3. Criar `src/subscriptions/entities/subscription.entity.ts` com PK composta (`user_id`, `channel_id`) e índice (`user_id`, `created_at`), conforme `### Data Model` → `Subscription` (per `social-interactions/TD-06`).
4. Acrescentar `subscribers_count` (`int`, not null, default 0) a `src/channels/entities/channel.entity.ts` (per `social-interactions/TD-06`, Option B).
5. Gerar a migration em `src/database/migrations/` que cria o tipo `reaction_type`, as quatro tabelas com FKs `ON DELETE CASCADE` e índices, e a coluna em `channels` — com `down` que desfaz tudo na ordem inversa.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `VideoReaction` | Integration: PK composta rejeita segunda reação do mesmo usuário no mesmo vídeo; cascade ao apagar o vídeo | `src/reactions/entities/video-reaction.entity.integration-spec.ts` |
| `CommentReaction` | Integration: PK composta; cascade ao apagar o comentário | `src/reactions/entities/comment-reaction.entity.integration-spec.ts` |
| `Comment` | Integration: `parent_id` nulável, `likes_count` default 0, cascade de vídeo e de raiz para respostas | `src/comments/entities/comment.entity.integration-spec.ts` |
| `Subscription` | Integration: PK composta rejeita inscrição duplicada; cascade de canal e de usuário | `src/subscriptions/entities/subscription.entity.integration-spec.ts` |
| `Channel` | Integration: `subscribers_count` nasce 0 | `src/channels/entities/channel.entity.integration-spec.ts` |

**Dependencies:** none

**Acceptance criteria:**

- Inserir uma segunda reação para o mesmo par (usuário, vídeo) viola a PK; trocar o `type` da linha existente é aceito.
- Inserir uma inscrição duplicada para o mesmo par (usuário, canal) viola a PK.
- Apagar um vídeo remove suas reações e seus comentários; apagar um comentário-raiz remove suas respostas e as reações de todos eles.
- Um canal novo tem `subscribers_count = 0`; um comentário novo tem `likes_count = 0`.
- A migration sobe e desce sem erro sobre o schema atual, e a suíte existente `src/database/migrations.integration-spec.ts` continua passando.

---

### SI-06.2 — Criar o ReactionsModule como produtor único das reações

**Description:** Concentrar a escrita das duas tabelas de reação num único serviço e isolar a aritmética do toggle numa função pura — a mitigação que o TD-02 exige para a Option A.

**Technical actions:**

1. Criar `src/reactions/reaction-delta.ts` — função pura `likesDelta(previous, next)` que implementa a tabela de `### Data Model` → "Manutenção dos contadores", sem dependência de banco (per `social-interactions/TD-02`).
2. Criar `src/reactions/reactions.service.ts` — `applyVideoReaction(manager, videoId, userId, next)` e `applyCommentReaction(manager, commentId, userId, next)`, que gravam, trocam ou apagam a reação (`next = null` apaga) **dentro do `EntityManager` recebido** e devolvem a reação anterior; e as leituras `findVideoReaction(videoId, userId)` e `findCommentReactions(commentIds, userId)` (mapa por id, uma query só). É o **único** produtor das duas tabelas (per `social-interactions/TD-02`).
3. Criar `src/reactions/reactions.module.ts` com `TypeOrmModule.forFeature([VideoReaction, CommentReaction])`, exportando `ReactionsService`. Não importa nenhum módulo de domínio (ver `### Data Model` → grafo de módulos).
4. Criar `src/reactions/dto/set-reaction.dto.ts` (`type` required, enum `like` | `dislike`) e `src/reactions/dto/reaction-state-response.dto.ts` (`viewerReaction`, `likesCount`), conforme `### API Contracts` → `PUT /videos/{publicId}/reaction`. Os dois DTOs servem a rota de vídeo e a de comentário.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `likesDelta` | Unit: as sete linhas da tabela de delta, inclusive as idempotentes | `src/reactions/reaction-delta.spec.ts` |
| `ReactionsService` | Integration: grava, troca de `like` para `dislike`, apaga e devolve a reação anterior em cada caso; repetir a mesma reação não cria linha | `src/reactions/reactions.service.integration-spec.ts` |
| `ReactionsModule` | Unit: compilation test | `src/reactions/reactions.module.spec.ts` |

**Dependencies:** SI-06.1 — as entidades de reação precisam existir

**Acceptance criteria:**

- `likesDelta` devolve `+1` para nenhuma → `like`, `−1` para `like` → `dislike` e `0` para qualquer → a mesma.
- Aplicar `like` sobre uma reação `dislike` existente deixa uma única linha com `type = like` e devolve `dislike` como anterior.
- Aplicar `null` sobre um par sem reação não falha e devolve `null` como anterior.
- `findCommentReactions` para N ids emite uma única query e devolve só os pares com reação.

---

### SI-06.3 — Endpoints de inscrição em canal

**Route:** PUT /channels/{nickname}/subscription · DELETE /channels/{nickname}/subscription
**Test Specs:** see `nestjs-project/specs/channels-subscription.plan.md`
**Authorization:** Authenticated

**Description:** Seguir e deixar de seguir um canal, mantendo `channels.subscribers_count` na mesma transação — o núcleo da capability "Inscrição em canais (seguir/deixar de seguir)".

**Technical actions:**

1. Acrescentar a `src/channels/channels.service.ts` o método `adjustSubscribersCount(manager, channelId, delta)` — `UPDATE … SET subscribers_count = subscribers_count + :delta` no `EntityManager` recebido; `ChannelsService` é o único que escreve essa coluna (ver `### Data Model` → "Quem escreve cada contador").
2. Criar `src/subscriptions/subscriptions.service.ts` — `subscribe(userId, channel)` e `unsubscribe(userId, channel)` abrem a transação, criam ou apagam a inscrição e chamam `adjustSubscribersCount` com `+1`/`−1`, ou **0** quando a inscrição já existia / não existia; devolvem `{ subscribed, subscribersCount }` lido na mesma transação (per `social-interactions/TD-06`). Mais `isSubscribed(userId, channelId)` e `listByUser(userId, offset, limit)`, consumidos por SIs seguintes.
3. Criar `src/subscriptions/subscriptions.controller.ts` com `PUT` e `DELETE channels/:nickname/subscription`, resolvendo o canal por `ChannelsService.findByNicknameOrFail`, com `@Throttle({ default: { limit: 60, ttl: 60000 } })` (per `social-interactions/TD-09`) e decorators OpenAPI (`@ApiBearerAuth`, `@ApiResponse` 200/401/404/429 com `ApiErrorEnvelope`). Resposta em `src/subscriptions/dto/subscription-state-response.dto.ts`, conforme `### API Contracts` → `PUT /channels/{nickname}/subscription`.
4. Criar `src/subscriptions/subscriptions.module.ts` (`forFeature([Subscription])`, importa `ChannelsModule`, exporta `SubscriptionsService`) e registrá-lo em `AppModule`.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `SubscriptionsService` | Integration: inscrever soma 1; repetir não soma; cancelar subtrai 1; cancelar sem inscrição não subtrai; falha no meio da transação não deixa contador desviado | `src/subscriptions/subscriptions.service.integration-spec.ts` |
| `ChannelsService.adjustSubscribersCount` | Integration: incremento atômico sob duas chamadas concorrentes soma 2 | `src/channels/channels.service.integration-spec.ts` |
| `SubscriptionsModule` | Unit: compilation test | `src/subscriptions/subscriptions.module.spec.ts` |

**Dependencies:** SI-06.1 — entidade `Subscription` e coluna `subscribers_count`

**Acceptance criteria:**

- `PUT /channels/{nickname}/subscription` com Bearer válido retorna `200` com `subscribed: true` e `subscribersCount` acrescido de 1.
- Repetir o mesmo `PUT` retorna `200` com o **mesmo** `subscribersCount` — o contador não soma duas vezes.
- `DELETE /channels/{nickname}/subscription` retorna `200` com `subscribed: false` e o contador decrescido de 1; repetir não decresce de novo.
- Sem Bearer, as duas rotas retornam `401`; com nickname inexistente, `404` com `error: "CHANNEL_NOT_FOUND"`.
- A 61ª chamada do mesmo IP em 60 s retorna `429` com `error: "RATE_LIMIT_EXCEEDED"`; o orçamento de 10/60 s das rotas de autenticação não muda.

---

### SI-06.4 — Endpoints de reação em vídeo

**Route:** PUT /videos/{publicId}/reaction · DELETE /videos/{publicId}/reaction
**Test Specs:** see `nestjs-project/specs/videos-reaction.plan.md`
**Authorization:** Authenticated para vídeo publicado; Owner para rascunho

**Description:** Registrar, trocar e retirar o like ou dislike do usuário num vídeo, mantendo `videos.likes_count` na mesma transação — e passar a incrementar um contador que está em zero desde a Fase 04.

**Technical actions:**

1. Acrescentar a `src/videos/videos.service.ts` o método `setReaction(video, userId, next)`: abre a transação, chama `ReactionsService.applyVideoReaction`, aplica `likesDelta(previous, next)` com `UPDATE … SET likes_count = likes_count + :delta` e devolve `{ viewerReaction, likesCount }` lido na mesma transação (per `social-interactions/TD-02`). `VideosService` é o único que escreve `likes_count`.
2. Criar em `src/videos/videos.controller.ts` os handlers `PUT :publicId/reaction` (corpo `SetReactionDto`) e `DELETE :publicId/reaction`, ambos guardados por `assertServable(video, user.sub)` — mesma regra das demais rotas do vídeo — e com `@Throttle({ default: { limit: 60, ttl: 60000 } })` (per `social-interactions/TD-09`).
3. Declarar os decorators OpenAPI (`@ApiBearerAuth`, `@ApiBody`, `@ApiResponse` 200 com `ReactionStateResponse` e 400/401/404/429 com `ApiErrorEnvelope`), conforme `### API Contracts` → `PUT /videos/{publicId}/reaction`.
4. Importar `ReactionsModule` em `VideosModule`.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `VideosService.setReaction` | Integration: sequência nenhuma → `like` → `dislike` → nenhuma deixa `likes_count` em 0; repetir `like` não soma; erro dentro da transação não desvia o contador | `src/videos/videos.service.integration-spec.ts` |

**Dependencies:** SI-06.2 — `ReactionsService` e `likesDelta`

**Acceptance criteria:**

- `PUT /videos/{publicId}/reaction` com `{ "type": "like" }` retorna `200` com `viewerReaction: "like"` e `likesCount` acrescido de 1.
- Em seguida, `PUT` com `{ "type": "dislike" }` retorna `200` com `viewerReaction: "dislike"` e `likesCount` de volta ao valor original.
- `DELETE /videos/{publicId}/reaction` retorna `200` com `viewerReaction: null`; repetir o `DELETE` retorna `200` sem alterar `likesCount`.
- `PUT` com `type` fora do enum retorna `400` com `error: "VALIDATION_ERROR"`; sem Bearer, `401`.
- `PUT` sobre rascunho de outro canal retorna `404` com `error: "VIDEO_NOT_FOUND"`, indistinguível de vídeo inexistente.
- Nenhuma resposta das duas rotas contém contagem de dislikes.

---

### SI-06.5 — Estado social e pessoal no detalhe público do vídeo

**Route:** GET /videos/{publicId}/public
**Test Specs:** see `nestjs-project/specs/videos-public-detail-social.plan.md`
**Authorization:** Anonymous para vídeo publicado (estado pessoal só com Bearer válido); Owner para rascunho

**Description:** Acrescentar ao detalhe público os contadores sociais e o estado do próprio visitante, para que a watch page pinte like, dislike e inscrição corretos já na primeira resposta.

**Technical actions:**

1. Estender `src/videos/dto/public-video-detail-response.dto.ts` com `likesCount`, `commentsCount` e `viewerReaction` (`like` | `dislike` | null), e `PublicVideoChannel` com `subscribersCount` e `viewerSubscribed`, conforme `### API Contracts` → `GET /videos/{publicId}/public` (per `social-interactions-anonymous-gate/TD-02`). Sem contagem de dislikes (per `social-interactions/TD-03`).
2. `VideosService.toPublicDetail(video, viewerId?)` passa a receber o id do visitante e a preencher `viewerReaction` por `ReactionsService.findVideoReaction` e `viewerSubscribed` por `SubscriptionsService.isSubscribed`; sem visitante, `null` e `false` sem consultar nada. `subscribersCount` vem do canal já carregado.
3. O handler `getPublicVideo` repassa `user?.sub` a `toPublicDetail`; importar `SubscriptionsModule` em `VideosModule`.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `VideosService.toPublicDetail` | Unit: sem visitante, `viewerReaction: null` e `viewerSubscribed: false` sem chamar `ReactionsService` nem `SubscriptionsService` (mocks) | `src/videos/videos.service.spec.ts` |

**Dependencies:** SI-06.2 — `ReactionsService.findVideoReaction` · SI-06.3 — `SubscriptionsService.isSubscribed`

**Acceptance criteria:**

- `GET /videos/{publicId}/public` sem `Authorization` retorna `200` com `likesCount`, `commentsCount`, `viewerReaction: null`, `channel.subscribersCount` e `channel.viewerSubscribed: false`.
- Com Bearer de um usuário que deu like e segue o canal, a mesma rota retorna `viewerReaction: "like"` e `channel.viewerSubscribed: true`.
- Com Bearer inválido, a rota segue anônima e retorna `200` com o estado pessoal neutro — nunca `401`.
- A resposta não contém nenhum campo de contagem de dislikes.
- Os campos existentes da Fase 05 (`streamUrl`, `downloadUrl`, `viewsCount`, …) continuam presentes e inalterados.

---

### SI-06.6 — Contagem de inscritos e estado pessoal na leitura pública do canal

**Route:** GET /channels/{nickname}
**Test Specs:** see `nestjs-project/specs/channels-public-subscribers.plan.md`
**Authorization:** Anonymous (estado pessoal só com Bearer válido)

**Description:** Expor a contagem de inscritos na página do canal — a capability "Contagem de inscritos na página do canal" — e se o visitante já segue o canal.

**Technical actions:**

1. Estender `PublicChannelResponse` em `src/channels/dto/channel-response.dto.ts` com `subscribersCount` e `viewerSubscribed`, conforme `### API Contracts` → `GET /channels/{nickname}` (per `social-interactions/TD-06` e `social-interactions-anonymous-gate/TD-02`).
2. O handler `getPublicChannel` em `src/videos/channel-videos.controller.ts` ganha `@CurrentUser() user?: JwtPayload` e `@ApiBearerAuth('access-token')`, lê `subscribers_count` do canal e `viewerSubscribed` por `SubscriptionsService.isSubscribed` — só quando há visitante.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `SubscriptionsService.isSubscribed` | Integration: verdadeiro só para o par inscrito; falso para outro usuário do mesmo canal | `src/subscriptions/subscriptions.service.integration-spec.ts` |

**Dependencies:** SI-06.3 — `SubscriptionsService` e a coluna mantida

**Acceptance criteria:**

- `GET /channels/{nickname}` sem `Authorization` retorna `200` com `subscribersCount` e `viewerSubscribed: false`.
- Com Bearer de um inscrito, retorna `viewerSubscribed: true`; com Bearer de outro usuário, `false`.
- Depois de um `PUT /channels/{nickname}/subscription`, o `subscribersCount` desta leitura reflete o valor novo.
- `videosCount` e os demais campos da Fase 04 continuam presentes e inalterados.

---

### SI-06.7 — Criar o CommentsModule e o núcleo do serviço de comentários

**Description:** Concentrar em `CommentsService` a criação de comentários e respostas (profundidade 1, contador na mesma transação) e as duas leituras paginadas sem N+1 — a base das quatro rotas de comentário que seguem.

**Technical actions:**

1. Acrescentar `CommentNotFoundException` (`COMMENT_NOT_FOUND`, 404) a `src/common/exceptions/domain.exception.ts`, conforme `### Error Catalog`; e a `src/videos/videos.service.ts` o método `adjustCommentsCount(manager, videoId, delta)` — `VideosService` continua o único que escreve `comments_count`.
2. Criar `src/comments/comments.service.ts` com `create(video, userId, body, parentId?)`: resolve `parentId` para a **raiz** (resposta a resposta vira irmã — per `social-interactions/TD-04`), rejeita pai inexistente ou de outro vídeo com `COMMENT_NOT_FOUND`, grava e chama `adjustCommentsCount(+1)` na mesma transação (per `social-interactions/TD-02`).
3. Em `CommentsService`, `listThreads(videoId, offset, limit, viewerId?)` e `listReplies(rootId, offset, limit, viewerId?)` conforme `### API Contracts` → `GET /videos/{publicId}/comments` → "Consultas — sem N+1": raízes mais recentes primeiro, até 3 respostas por raiz por função de janela com o `repliesCount` no mesmo passo, e uma única leitura de `ReactionsService.findCommentReactions` quando há visitante (per `social-interactions/TD-05`). Autor = `name` e `nickname` do canal de quem comentou.
4. Criar `src/comments/dto/comment-response.dto.ts` com `CommentResponse`, `CommentThreadResponse`, `CommentsPage` e `RepliesPage`, campos byte-verbatim de `### API Contracts`.
5. Criar `src/comments/comments.module.ts` (`forFeature([Comment])`, importa `VideosModule` e `ReactionsModule`) e registrá-lo em `AppModule`; `VideosModule` passa a exportar `VideosService`.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `CommentsService.create` | Unit: resolução do pai — raiz, resposta (vira filho da raiz), inexistente e de outro vídeo (`COMMENT_NOT_FOUND`) com repositório mockado | `src/comments/comments.service.spec.ts` |
| `CommentsService` | Integration: `listThreads` devolve no máximo 3 respostas por raiz, as mais recentes, com `repliesCount` correto; `create` incrementa `comments_count` para raiz e para resposta; `viewerReaction` preenchido só com visitante | `src/comments/comments.service.integration-spec.ts` |
| `CommentsModule` | Unit: compilation test | `src/comments/comments.module.spec.ts` |

**Dependencies:** SI-06.2 — `ReactionsService.findCommentReactions`

**Acceptance criteria:**

- Criar uma resposta com `parentId` de uma **resposta** grava o comentário com `parent_id` igual ao da raiz dela — nenhum comentário no banco tem pai que seja resposta.
- Criar com `parentId` de comentário de outro vídeo lança `COMMENT_NOT_FOUND` e não altera `comments_count`.
- Uma raiz com 7 respostas aparece em `listThreads` com exatamente 3 respostas (as 3 mais recentes) e `repliesCount: 7`.
- `listThreads` para uma página de 10 raízes executa um número de queries constante, independente do número de raízes e respostas.
- Cada comentário publicado — raiz ou resposta — soma exatamente 1 a `videos.comments_count`.

---

### SI-06.8 — Endpoint de listagem de comentários do vídeo

**Route:** GET /videos/{publicId}/comments
**Test Specs:** see `nestjs-project/specs/videos-comments-list.plan.md`
**Authorization:** Anonymous para vídeo publicado (estado pessoal só com Bearer válido); Owner para rascunho

**Description:** Expor a página de comentários-raiz com as respostas pré-carregadas — a leitura que a watch page faz no render e o "Carregar mais comentários" repete.

**Technical actions:**

1. Criar `src/comments/comments.controller.ts` com o handler `GET videos/:publicId/comments`, `@Public()`, `@CurrentUser() user?: JwtPayload`, resolvendo o vídeo por `VideosService.findByPublicIdOrFail` e guardando por `assertServable(video, user?.sub)`.
2. Criar `src/comments/dto/list-comments-query.dto.ts` com `offset` (`>= 0`, default 0) e `limit` (`1..50`, default **10**), conforme `### API Contracts` → Validation Rules (per `social-interactions/TD-05`); o handler delega a `CommentsService.listThreads`.
3. Declarar os decorators OpenAPI (`@ApiBearerAuth`, `@ApiResponse` 200 com `CommentsPage` e 400/404 com `ApiErrorEnvelope`).

**Tests:** _(empty — controller sem lógica própria; E2E na spec de `/plan-test-specs`, a consulta já é coberta no SI-06.7)_

**Dependencies:** SI-06.7 — `CommentsService.listThreads`

**Acceptance criteria:**

- `GET /videos/{publicId}/comments` sem parâmetros retorna `200` com no máximo 10 raízes, ordenadas da mais recente para a mais antiga, e `total` igual ao número de raízes do vídeo.
- `offset=10` devolve a página seguinte sem repetir raízes da primeira.
- Um vídeo sem comentários retorna `200` com `items: []` e `total: 0`.
- Com Bearer válido, cada comentário e resposta traz `viewerReaction` do visitante; sem Bearer, todos trazem `null`.
- `limit=0` ou `limit=51` retorna `400` com `error: "VALIDATION_ERROR"`; rascunho de outro canal retorna `404` com `error: "VIDEO_NOT_FOUND"`.

---

### SI-06.9 — Endpoint de publicação de comentário e resposta

**Route:** POST /videos/{publicId}/comments
**Test Specs:** see `nestjs-project/specs/videos-comments-create.plan.md`
**Authorization:** Authenticated para vídeo publicado; Owner para rascunho

**Description:** Publicar um comentário-raiz ou uma resposta pela mesma rota — o `ReplyForm` é o `NewCommentForm` reusado com `parentId` (OQ-12).

**Technical actions:**

1. Criar `src/comments/dto/create-comment.dto.ts` — `body` required, **aparado nas pontas** antes da validação, 1 a 2000 caracteres; `parentId` opcional, uuid — conforme `### API Contracts` → Validation Rules.
2. Criar em `src/comments/comments.controller.ts` o handler `POST videos/:publicId/comments` com `@HttpCode(201)`, `assertServable(video, user.sub)` e `@Throttle({ default: { limit: 5, ttl: 60000 } })` (per `social-interactions/TD-09`), delegando a `CommentsService.create`.
3. Declarar os decorators OpenAPI (`@ApiBearerAuth`, `@ApiBody`, `@ApiResponse` 201 com `CommentResponse` e 400/401/404/429 com `ApiErrorEnvelope`).

**Tests:** _(empty — DTO coberto pela spec E2E, per testing-guide-nestjs-project § "DTO"; criação já coberta no SI-06.7)_

**Dependencies:** SI-06.7 — `CommentsService.create` e `COMMENT_NOT_FOUND`

**Acceptance criteria:**

- `POST /videos/{publicId}/comments` com `{ "body": "Ótimo vídeo" }` retorna `201` com `parentId: null`, `likesCount: 0`, `viewerReaction: null` e o autor; o `commentsCount` do detalhe público sobe 1.
- Com `parentId` de uma resposta, retorna `201` com `parentId` igual ao id da **raiz**.
- `{ "body": "   " }` e um corpo de 2001 caracteres retornam `400` com `error: "VALIDATION_ERROR"`.
- `parentId` de outro vídeo retorna `404` com `error: "COMMENT_NOT_FOUND"`; sem Bearer, `401`.
- O 6º `POST` do mesmo IP em 60 s retorna `429` com `error: "RATE_LIMIT_EXCEEDED"`, sem afetar o orçamento de 60/60 s das reações.

---

### SI-06.10 — Endpoint de respostas restantes de uma thread

**Route:** GET /comments/{commentId}/replies
**Test Specs:** see `nestjs-project/specs/comments-replies.plan.md`
**Authorization:** Anonymous quando o vídeo do comentário é publicado; Owner quando é rascunho

**Description:** Servir o "Ver mais N respostas" — as respostas de uma raiz além das 3 pré-carregadas, na mesma ordenação.

**Technical actions:**

1. Criar em `src/comments/comments.controller.ts` o handler `GET comments/:commentId/replies`, `@Public()`, com `ParseUUIDPipe` no `commentId` e query DTO `src/comments/dto/list-replies-query.dto.ts` (`offset >= 0` default 0; `limit 1..50` default 10), conforme `### API Contracts` → Validation Rules.
2. Em `CommentsService`, `findAccessible(commentId, viewerId?)`: carrega o comentário (raiz ou resposta) e aplica `VideosService.assertServable` ao vídeo dele, convertendo o 404 de vídeo em `COMMENT_NOT_FOUND` — o caminho lateral não revela rascunho; o handler então delega a `listReplies` (per `social-interactions/TD-05`).
3. Declarar os decorators OpenAPI (`@ApiBearerAuth`, `@ApiResponse` 200 com `RepliesPage` e 400/404 com `ApiErrorEnvelope`).

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `CommentsService.findAccessible` | Unit: comentário de rascunho alheio vira `COMMENT_NOT_FOUND`, não `VIDEO_NOT_FOUND` | `src/comments/comments.service.spec.ts` |

**Dependencies:** SI-06.7 — `CommentsService.listReplies`

**Acceptance criteria:**

- `GET /comments/{commentId}/replies?offset=3` para uma raiz com 7 respostas retorna `200` com as 4 restantes, da mais recente para a mais antiga, e `total: 7`.
- O mesmo pedido sobre o id de uma **resposta** retorna `200` com `items: []` e `total: 0`.
- `commentId` que não é uuid retorna `400` com `error: "VALIDATION_ERROR"`; uuid inexistente, `404` com `error: "COMMENT_NOT_FOUND"`.
- Comentário de vídeo em rascunho de outro canal retorna `404` com `error: "COMMENT_NOT_FOUND"` — a resposta não revela que o vídeo existe.

---

### SI-06.11 — Endpoints de reação em comentário

**Route:** PUT /comments/{commentId}/reaction · DELETE /comments/{commentId}/reaction
**Test Specs:** see `nestjs-project/specs/comments-reaction.plan.md`
**Authorization:** Authenticated quando o vídeo do comentário é publicado; Owner quando é rascunho

**Description:** Like e dislike em comentários e respostas — mesmo contrato das reações em vídeo, com `comments.likes_count` mantido pelo `CommentsService`.

**Technical actions:**

1. Acrescentar a `CommentsService` o método `setReaction(comment, userId, next)`: abre a transação, chama `ReactionsService.applyCommentReaction`, aplica `likesDelta` com `UPDATE … SET likes_count = likes_count + :delta` em `comments` e devolve `{ viewerReaction, likesCount }` (per `social-interactions/TD-02`). `CommentsService` é o único que escreve `comments.likes_count`.
2. Criar em `src/comments/comments.controller.ts` os handlers `PUT comments/:commentId/reaction` (corpo `SetReactionDto`) e `DELETE comments/:commentId/reaction`, com `ParseUUIDPipe`, resolução do comentário por `CommentsService.findAccessible` (SI-06.10), que aplica a regra de rascunho, e `@Throttle({ default: { limit: 60, ttl: 60000 } })` (per `social-interactions/TD-09`).
3. Declarar os decorators OpenAPI (`@ApiBearerAuth`, `@ApiBody`, `@ApiResponse` 200 com `ReactionStateResponse` e 400/401/404/429 com `ApiErrorEnvelope`).

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `CommentsService.setReaction` | Integration: sequência nenhuma → `like` → `dislike` → nenhuma deixa `comments.likes_count` em 0; reagir a uma resposta não altera a raiz | `src/comments/comments.service.integration-spec.ts` |

**Dependencies:** SI-06.10 — `CommentsService.findAccessible`

**Acceptance criteria:**

- `PUT /comments/{commentId}/reaction` com `{ "type": "like" }` retorna `200` com `viewerReaction: "like"` e o `likesCount` do comentário acrescido de 1.
- O `likesCount` do comentário aparece atualizado na leitura seguinte de `GET /videos/{publicId}/comments`.
- `DELETE /comments/{commentId}/reaction` retorna `200` com `viewerReaction: null`; repetir não altera `likesCount`.
- Sem Bearer, `401`; uuid inexistente, `404` com `error: "COMMENT_NOT_FOUND"`.
- Reagir a um comentário não altera `videos.likes_count`.

---

### SI-06.12 — Endpoint da área de canais seguidos

**Route:** GET /me/subscriptions
**Test Specs:** see `nestjs-project/specs/me-subscriptions.plan.md`
**Authorization:** Authenticated

**Description:** Listar os canais que o usuário segue, com contagem de inscritos e de vídeos públicos — a leitura da área de canais seguidos (per `social-interactions/TD-07`).

**Technical actions:**

1. Em `SubscriptionsService.listByUser(userId, offset, limit)`: canais seguidos com `name`, `nickname` e `subscribers_count`, ordenados por inscrição mais recente, mais o `total`.
2. Acrescentar a `src/videos/videos.service.ts` o método `countPublicByChannels(channelIds)` — **uma** query agrupada por canal, mesma regra de `countPublicByChannel` (só publicados e públicos); canal sem vídeo entra com 0.
3. Criar o handler `GET me/subscriptions` em `src/videos/channel-videos.controller.ts` — ali por depender de `VideosService` e `SubscriptionsService` sem ciclo (ver `### Data Model` → grafo de módulos) —, com query DTO de `offset` (`>= 0`, default 0) e `limit` (`1..100`, default 50) e resposta `SubscribedChannelsPage` em `src/subscriptions/dto/subscribed-channels-response.dto.ts`, conforme `### API Contracts` → `GET /me/subscriptions`.
4. Declarar os decorators OpenAPI (`@ApiBearerAuth`, `@ApiResponse` 200 com `SubscribedChannelsPage` e 400/401 com `ApiErrorEnvelope`).

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `SubscriptionsService.listByUser` | Integration: ordem por inscrição mais recente; só os canais do próprio usuário; `total` correto | `src/subscriptions/subscriptions.service.integration-spec.ts` |
| `VideosService.countPublicByChannels` | Integration: rascunhos e `unlisted` não contam; canal sem vídeo vem com 0; uma query para N canais | `src/videos/videos.service.integration-spec.ts` |

**Dependencies:** SI-06.3 — `SubscriptionsService` e o `SubscriptionsModule` · SI-06.5 — `VideosModule` já importa `SubscriptionsModule`

**Acceptance criteria:**

- `GET /me/subscriptions` de um usuário que segue 3 canais retorna `200` com 3 itens, o mais recentemente seguido primeiro, e `total: 3`.
- Cada item traz `name`, `nickname`, `subscribersCount` e `videosCount`, este último contando só vídeos publicados e públicos.
- Um usuário que não segue ninguém recebe `200` com `items: []` e `total: 0`.
- A lista nunca contém canais seguidos por outro usuário; sem Bearer, a rota retorna `401`.
- `limit=101` retorna `400` com `error: "VALIDATION_ERROR"`.

---

### SI-06.13 — Infra: sincronizar o contrato OpenAPI com o frontend

**Description:** Levar as rotas e os campos novos do backend até `paths` no frontend — sem isso nenhum Route Handler, fixture ou componente desta fase tem tipo para importar.

**Technical actions:**

1. Regenerar `nestjs-project/openapi.json` com `docker compose exec nestjs-api npm run openapi:export` — o script roda `nest build`, necessário para o plugin do Swagger preencher os DTOs de requisição (per `openapi-docs-nestjs/TD-01` e `TD-02`).
2. Rodar `scripts/sync-openapi.sh` no host — copia o spec para `next-frontend/openapi.json` — e em seguida `docker compose exec next-frontend npm run openapi:types`, que regenera `next-frontend/lib/api/types.gen.ts` (per `next-frontend-openapi-typing/TD-02` e `TD-03`).
3. Acrescentar a `next-frontend/lib/api/contracts.ts`, numa seção "interações sociais", os aliases `ReactionType`, `SetReactionDto`, `ReactionState`, `Comment`, `CommentThread`, `CommentsPage`, `RepliesPage`, `CreateCommentDto`, `SubscriptionState`, `SubscribedChannel` e `SubscribedChannelsPage` — `contracts.ts` continua o único importador de `paths` (per `next-frontend-openapi-typing/TD-04`).
4. Atualizar `next-frontend/mocks/factories/videos.ts` e `mocks/factories/channels.ts` com os campos novos e obrigatórios de `PublicVideo` e `PublicChannel` (`likesCount`, `commentsCount`, `viewerReaction`, `subscribersCount`, `viewerSubscribed`), para que os fixtures existentes continuem tipando (per `next-frontend-msw-foundation/TD-03`).

**Tests:** _(empty — Infra)_

**Dependencies:** SI-06.3, SI-06.4, SI-06.5, SI-06.6, SI-06.8, SI-06.9, SI-06.10, SI-06.11, SI-06.12 — todas as rotas e campos precisam estar no backend antes do export

**Acceptance criteria:**

- `next-frontend/openapi.json` contém as 10 rotas novas e os campos novos de `GET /videos/{publicId}/public` e `GET /channels/{nickname}`.
- Repetir o sync e o `openapi:types` não produz diff em `openapi.json` nem em `types.gen.ts` — a checagem de frescor do CI passa.
- `docker compose exec next-frontend npx tsc --noEmit` sai com código 0 com os fixtures atualizados.
- Nenhum arquivo fora de `lib/api/contracts.ts` importa `paths` de `types.gen.ts`.

---

### SI-06.14 — Helper de leitura com autenticação opcional

**Description:** Dar às leituras públicas um caminho que anexa a sessão quando ela existe e degrada para anônimo quando não existe ou expirou — o que o `fetchFromUpstream` não pode fazer, porque redireciona para o login.

**Technical actions:**

1. Criar `next-frontend/lib/api/optional-auth.ts` (`import "server-only"`) com `fetchWithOptionalAuth(request)`: com sessão, chama `request` com `Authorization: Bearer {accessToken}`; num `401`, **repete a chamada sem o header**; sem sessão, chama anônimo direto. Nunca redireciona e nunca grava cookie, então serve Server Component e Route Handler (per `social-interactions-anonymous-gate/TD-02`).
2. Documentar no próprio módulo a diferença para `fetchFromUpstream` (redireciona, exige sessão) e por que o ramo do `401` existe mesmo com o upstream atual seguindo anônimo em rota `@Public()` — ver `### API Contracts` → BFF tier.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `lib/api/optional-auth.ts` | Unit per testing-guide-next-frontend § "`lib/` utility / boundary module" — sem sessão chama sem header; com sessão anexa o Bearer; `401` com sessão repete anônimo e devolve o resultado; nunca chama `redirect` | `lib/api/__tests__/optional-auth.test.ts` |

**Dependencies:** none

**Acceptance criteria:**

- Sem sessão, a chamada ao upstream sai sem header `Authorization`.
- Com sessão válida, a chamada sai com `Authorization: Bearer {accessToken}`.
- Com sessão cujo token o upstream rejeita com `401`, o helper devolve o resultado de uma segunda chamada anônima — o visitante vê a página, sem redirecionamento.
- O helper não grava nem apaga o cookie de sessão em nenhum dos caminhos.

---

### SI-06.15 — Retorno ao ponto de interação depois do login

**Description:** Fechar o ciclo do controle anônimo — o clique leva ao login com `returnTo`, e o login devolve o visitante ao ponto de onde saiu, reusando o validador que o projeto já tem.

**Technical actions:**

1. Extrair `safeReturnTo` de `app/api/auth/refresh/route.ts` para `next-frontend/lib/auth/return-to.ts`, sem mudar a regra (só caminho interno; `//host` e `/\host` rejeitados), e fazer a rota de refresh importá-lo (per `social-interactions-anonymous-gate/TD-03` — reusar "contrato, validador e vocabulário que já existem").
2. No mesmo módulo, `buildLoginHref(returnTo)` → `/login?returnTo={encodeURIComponent(returnTo)}`, usado por todos os controles do anônimo nas telas desta fase.
3. Em `components/auth/login-form.tsx`, ler `returnTo` de `useSearchParams()`; no sucesso, com `returnTo` presente, `router.replace(safeReturnTo(returnTo))` seguido de `router.refresh()`; sem `returnTo`, manter o `router.refresh()` atual (per `phase-02-auth-frontend/TD-06`).

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `lib/auth/return-to.ts` | Unit per testing-guide-next-frontend § "`lib/` utility / boundary module" — caminho interno aceito; URL absoluta, `//host` e `/\host` caem no default; `buildLoginHref` codifica o caminho | `lib/auth/__tests__/return-to.test.ts` |
| `components/auth/login-form.tsx` | Unit per testing-guide-next-frontend § "Client Components" — sucesso com `returnTo` navega para ele; com `returnTo` externo navega para o default; sem `returnTo` só faz `refresh` | `components/auth/__tests__/login-form.wiring.test.tsx` |
| `app/api/auth/refresh/route.ts` | Integration: regressão — a rota segue rejeitando `returnTo` externo e protocol-relative depois da extração | `app/api/auth/refresh/__tests__/route.integration.test.ts` |

**Dependencies:** none

**Acceptance criteria:**

- Login bem-sucedido a partir de `/login?returnTo=%2Fvideos%2Fabc123` termina em `/videos/abc123` com a sessão ativa.
- Login a partir de `/login?returnTo=https%3A%2F%2Foutro.site` termina numa rota interna (o default), nunca no domínio externo.
- Login a partir de `/login` sem `returnTo` mantém o comportamento atual.
- `GET /api/auth/refresh?returnTo=//outro.site` continua redirecionando para o default.

---

### SI-06.16 — Route Handlers BFF de reação (vídeo e comentário)

**Route:** PUT /api/videos/{publicId}/reaction · DELETE /api/videos/{publicId}/reaction · PUT /api/comments/{commentId}/reaction · DELETE /api/comments/{commentId}/reaction
**Authorization:** Authenticated nas quatro

**Description:** Expor ao browser as mutações de reação, anexando o Bearer da sessão server-side e renovando-a uma vez num `401`.

**Technical actions:**

1. Criar `app/api/videos/[publicId]/reaction/route.ts` com `PUT` (lê o corpo **uma vez** antes do `withRefresh`) e `DELETE`, cada um com Bearer da sessão e `withRefresh`, pass-through de status e corpo, conforme `### API Contracts` → BFF tier → `PUT /api/videos/{publicId}/reaction` (per `phase-02-auth-frontend/TD-02` e `TD-03`).
2. Criar `app/api/comments/[commentId]/reaction/route.ts` com o mesmo par, encaminhando para `/comments/{commentId}/reaction`.
3. Tipar requests e respostas por `SetReactionDto` e `ReactionState` de `lib/api/contracts.ts` (per `next-frontend-openapi-typing/TD-04`).
4. Criar `mocks/handlers/reactions.ts` com os handlers de upstream das quatro rotas e registrá-lo no barrel `mocks/handlers/index.ts` — um handler por `paths` entry, cenários de erro via `server.use(...)` no teste (per `next-frontend-msw-foundation/TD-01`).

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `app/api/videos/[publicId]/reaction/route.ts` | Integration per testing-guide-next-frontend § "Route handler" — Bearer anexado; pass-through de 200/400/404/429; `401` do upstream dispara um refresh e, falhando, devolve `401 UNAUTHORIZED` | `app/api/videos/[publicId]/reaction/__tests__/route.integration.test.ts` |
| `app/api/comments/[commentId]/reaction/route.ts` | Integration: mesmo conjunto, encaminhando para a rota de comentário | `app/api/comments/[commentId]/reaction/__tests__/route.integration.test.ts` |

Sem linha de E2E: Route Handler é coberto por teste de integração inline com MSW, não por spec externa — por isso não carrega `**Test Specs:**`.

**Dependencies:** SI-06.13 — os contratos precisam estar em `types.gen.ts`

**Acceptance criteria:**

- `PUT /api/videos/{publicId}/reaction` com sessão chega ao upstream com `Authorization: Bearer …` e devolve `{ viewerReaction, likesCount }` sem transformação.
- `DELETE /api/comments/{commentId}/reaction` repassa `404` com `error: "COMMENT_NOT_FOUND"` tal como vem.
- Com token expirado e refresh bem-sucedido, a mutação é refeita uma vez e devolve `200`; com refresh falho, devolve `401` com `error: "UNAUTHORIZED"`.
- Nenhum token aparece no corpo nem nos headers da resposta ao browser.

---

### SI-06.17 — Route Handlers BFF de comentários

**Route:** GET /api/videos/{publicId}/comments · POST /api/videos/{publicId}/comments · GET /api/comments/{commentId}/replies
**Authorization:** Anonymous nas leituras (estado pessoal com sessão); Authenticated no `POST`

**Description:** Expor ao browser as páginas seguintes de comentários e de respostas, e a publicação — leituras com auth opcional, mutação com refresh.

**Technical actions:**

1. Criar `app/api/videos/[publicId]/comments/route.ts`: `GET` via `fetchWithOptionalAuth` com pass-through de `offset`/`limit` e de `{ items, total, offset, limit }`; `POST` com Bearer da sessão e `withRefresh`, lendo o corpo uma vez, pass-through do `201` (per `social-interactions-anonymous-gate/TD-02` e `phase-02-auth-frontend/TD-03`).
2. Criar `app/api/comments/[commentId]/replies/route.ts`: `GET` via `fetchWithOptionalAuth`, pass-through de query e corpo.
3. Tipar por `CommentsPage`, `RepliesPage`, `Comment` e `CreateCommentDto` de `lib/api/contracts.ts` (per `next-frontend-openapi-typing/TD-04`).
4. Criar `mocks/factories/comments.ts` (fixtures determinísticos escritos à mão, per `next-frontend-msw-foundation/TD-03`) e `mocks/handlers/comments.ts` com os handlers de upstream de `GET`/`POST /videos/:publicId/comments` e `GET /comments/:commentId/replies`, registrado no barrel — o mesmo handler de `GET` serve a primeira página lida pelo Server Component no E2E.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `app/api/videos/[publicId]/comments/route.ts` | Integration per testing-guide-next-frontend § "Route handler" — `GET` anônimo sem header e com sessão com Bearer; `401` do upstream no `GET` não chega ao browser; `POST` pass-through de 201/400/404/429 e refresh no `401` | `app/api/videos/[publicId]/comments/__tests__/route.integration.test.ts` |
| `app/api/comments/[commentId]/replies/route.ts` | Integration: pass-through de `offset`/`limit` e de `{ items, total }`; `404` repassado | `app/api/comments/[commentId]/replies/__tests__/route.integration.test.ts` |

Sem linha de E2E: Route Handler é coberto por teste de integração inline com MSW — sem `**Test Specs:**`.

**Dependencies:** SI-06.13 — contratos em `types.gen.ts` · SI-06.14 — `fetchWithOptionalAuth`

**Acceptance criteria:**

- `GET /api/videos/{publicId}/comments?offset=10&limit=10` repassa os parâmetros e devolve a página do upstream sem transformação.
- Com sessão, o `GET` chega ao upstream com Bearer; sem sessão, sem header — e as duas respostas têm o mesmo formato.
- Um `401` do upstream no `GET` resulta numa resposta `200` anônima ao browser, nunca em `401`.
- `POST /api/videos/{publicId}/comments` com `{ body }` devolve `201` com o comentário criado; `429` do upstream é repassado tal como vem.

---

### SI-06.18 — Route Handlers BFF de inscrição

**Route:** PUT /api/channels/{nickname}/subscription · DELETE /api/channels/{nickname}/subscription
**Authorization:** Authenticated nas duas

**Description:** Expor ao browser o par de mutações de inscrição, consumido pelo `SubscribeButton` das duas telas públicas e pelo `SubscriptionToggleButton` da área de canais seguidos.

**Technical actions:**

1. Criar `app/api/channels/[nickname]/subscription/route.ts` com `PUT` e `DELETE`, Bearer da sessão e `withRefresh`, pass-through de `{ subscribed, subscribersCount }` e dos erros, conforme `### API Contracts` → BFF tier (per `phase-02-auth-frontend/TD-02` e `TD-03`).
2. Tipar por `SubscriptionState` de `lib/api/contracts.ts` (per `next-frontend-openapi-typing/TD-04`).
3. Criar `mocks/handlers/subscriptions.ts` com os handlers de upstream de `PUT`/`DELETE /channels/:nickname/subscription` e de `GET /me/subscriptions` (lida pelo Server Component da área de canais seguidos no E2E), registrado no barrel; os fixtures dos canais seguidos estendem `mocks/factories/channels.ts` (per `next-frontend-msw-foundation/TD-01` e `TD-03`).

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `app/api/channels/[nickname]/subscription/route.ts` | Integration per testing-guide-next-frontend § "Route handler" — Bearer anexado; pass-through de 200/404/429; refresh no `401` e `401 UNAUTHORIZED` quando falha | `app/api/channels/[nickname]/subscription/__tests__/route.integration.test.ts` |

Sem linha de E2E: Route Handler é coberto por teste de integração inline com MSW — sem `**Test Specs:**`.

**Dependencies:** SI-06.13 — contratos em `types.gen.ts`

**Acceptance criteria:**

- `PUT /api/channels/{nickname}/subscription` com sessão devolve `{ subscribed: true, subscribersCount }` do upstream sem transformação.
- `DELETE /api/channels/{nickname}/subscription` devolve `{ subscribed: false, subscribersCount }`.
- Com refresh falho, as duas rotas devolvem `401` com `error: "UNAUTHORIZED"`.
- `404` com `error: "CHANNEL_NOT_FOUND"` do upstream é repassado tal como vem.

---

### SI-06.19 — Estado otimista compartilhado de reação e de inscrição

**Description:** Criar os dois donos de estado que os controles das telas compartilham — sem eles, like e dislike não se excluem na tela e a contagem de inscritos não acompanha o botão.

**Technical actions:**

1. Criar `next-frontend/hooks/use-reaction.ts` — recebe `{ viewerReaction, likesCount }` inicial e uma função de mutação; expõe o estado otimista via `useOptimistic`, aplicando no cliente a **mesma tabela de delta** de `### Data Model` → "Manutenção dos contadores" (exclusão mútua like/dislike e contagem só do like), e reconcilia com o `likesCount` devolvido ou volta ao estado-base na falha (per `social-interactions/TD-08` e `TD-03`).
2. Criar `next-frontend/components/channels/channel-subscription-provider.tsx` (`"use client"`) — provider dono de `{ subscribed, subscribersCount }` com `useOptimistic`, uma ação `toggle()` que chama `PUT`/`DELETE /api/channels/{nickname}/subscription`, e o consumidor `ProvidedSubscriberCount`, que renderiza o `SubscriberCount` do `SI-06.0.1` com o valor otimista (per `social-interactions/TD-08`, ver `### UI Contracts` → "Composição de estado otimista").
3. Os dois aceitam um sinal `isAuthenticated`: falso, a ação **não** chama a API e navega para `buildLoginHref(caminho atual)` (per `social-interactions-anonymous-gate/TD-01` e `TD-03`).

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `hooks/use-reaction.ts` | Unit per testing-guide-next-frontend § "Custom hook" (`renderHook`, jsdom) — like soma 1; like com dislike ativo troca e soma 1; repetir retira; reconcilia com o valor da API; falha volta ao estado-base; anônimo navega para o login sem chamar a mutação | `hooks/__tests__/use-reaction.test.tsx` |
| `components/channels/channel-subscription-provider.tsx` | Unit per testing-guide-next-frontend § "Client Components" (MSW para o fetch) — toggle atualiza botão e contagem no mesmo render; reconcilia com `subscribersCount`; falha reverte; anônimo navega para o login | `components/channels/__tests__/channel-subscription-provider.test.tsx` |

**Dependencies:** SI-06.0.1 — `SubscriberCount` · SI-06.13 — tipos `ReactionState` e `SubscriptionState` · SI-06.15 — `buildLoginHref` · SI-06.18 — rota BFF de inscrição

**Acceptance criteria:**

- Com estado inicial `{ viewerReaction: "dislike", likesCount: 10 }`, acionar like exibe imediatamente `like` e `11`, antes da resposta da API.
- Quando a API responde com `likesCount` diferente do otimista, o valor exibido passa a ser o da API.
- Quando a mutação falha, o estado exibido volta ao anterior ao clique.
- Acionar o toggle de inscrição atualiza o rótulo do botão e a contagem do `ProvidedSubscriberCount` no mesmo frame.
- Com `isAuthenticated` falso, nenhuma requisição é emitida e o navegador vai para `/login?returnTo=…` com o caminho atual.

---

### SI-06.20 — Chrome sensível à sessão e ponto de entrada dos canais seguidos

**Description:** Dar às páginas públicas a navbar autenticada quando há sessão e acrescentar o link "Canais seguidos" ao chrome autenticado — o ponto de entrada que o TD-07 exige e que a navbar da Fase 04 não tem.

**Technical actions:**

1. Em `components/layout/site-navbar.tsx`, acrescentar a prop opcional `showSubscriptionsLink` que renderiza um `<Link href="/channel/subscriptions">Canais seguidos</Link>` **inline** — sem arquivo próprio, como o inventário registra para o `nav-link-canais-seguidos` (75:74) —, com `aria-current="page"` quando a rota ativa é a da área (per `social-interactions/TD-07`).
2. Criar `components/layout/public-site-navbar.tsx` (Server Component): lê a sessão; com sessão, busca o nome do canal por `GET /me/channel` via `fetchWithOptionalAuth` e renderiza `SiteNavbar` com o link e o `ChannelUserMenu`; sem sessão ou com falha nessa leitura, renderiza o "Entrar" atual — nunca derruba a página (ver `### UI Contracts` → "Chrome das páginas públicas").
3. No layout do grupo `(studio)` (`app/(studio)/layout.tsx`), passar `showSubscriptionsLink` para a `SiteNavbar` já autenticada.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `components/layout/site-navbar.tsx` | Unit per testing-guide-next-frontend § "Client Components" — link presente só com `showSubscriptionsLink`; aponta para `/channel/subscriptions`; `aria-current` na rota ativa | `components/layout/__tests__/site-navbar.test.tsx` |

`PublicSiteNavbar` é Server Component assíncrono — o guia o exclui de teste de componente; é coberto pelo E2E das telas.

**Dependencies:** SI-06.14 — `fetchWithOptionalAuth`

**Acceptance criteria:**

- Nas rotas do grupo `(studio)`, a navbar exibe o link "Canais seguidos", que leva a `/channel/subscriptions`.
- Na watch page e na página do canal, com sessão, a navbar exibe avatar, "Sair" e o link; sem sessão, exibe só "Entrar", como hoje.
- Uma falha de `GET /me/channel` numa página pública renderiza o chrome anônimo e o resto da página normalmente.
- Em `/channel/subscriptions`, o link tem `aria-current="page"`.

---

### SI-06.21.0 — Drift audit: Página de visualização do vídeo — interações sociais

**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=77-64
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Página de visualização do vídeo — interações sociais`

**Technical actions:**

1. **Drift audit** — invocar `figma:figma-implement-design` (handoff estreito) com:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=77-64
   - Reused DS components: `components/layout/site-navbar.tsx`, `components/auth/brand-logo.tsx`, `components/icons/streamtube-icon.tsx`, `components/layout/user-menu.tsx`, `components/ui/avatar.tsx`, `components/ui/button.tsx`, `components/icons/download-icon.tsx`, `components/ui/textarea.tsx`, `components/videos/video-description.tsx`, `components/icons/chevron-down-icon.tsx`, `components/channels/subscriber-count.tsx`, `components/comments/comment-list.tsx`, `components/comments/comment-thread.tsx`, `components/comments/comment-item.tsx`, `components/comments/reply-button.tsx`, `components/comments/reply-list.tsx`, `components/comments/comment-reply.tsx`
   - Server-connected component names: `VideoWatchPage`, `VideoPlayer`, `VideoCard`, `SidebarLoadMore`, `SubscribeButton`, `LikeButton`, `DislikeButton`, `CommentsSection`, `CommentsLoadMore`, `NewCommentForm`, `RepliesLoadMore`, `CommentLikeButton`, `CommentDislikeButton`
   - Target paths (contexto read-only): `app/videos/[publicId]/page.tsx` + `components/videos/*.tsx` + `components/channels/*.tsx` + `components/comments/*.tsx`

   Para cada componente da lista, diff de valor contra o arquivo em disco e classificação no enum de 4 valores. Escrever a seção `## Screen: video-watch-social — audited at SI-06.21.0` em `frontend-drift-report.md`, consultando as decisões já registradas para `video-watch-page` na Fase 05 (os componentes de chrome e o player são os mesmos — divergir é CONFLICT). **Sem edição de código.**

   **Entradas que a auditoria já sabe que vai encontrar:** a `SiteNavbar` aparece na variante **autenticada** (avatar + "Sair"), não na anônima da Fase 05; o `DislikeButton` "Não gostei" **sem número** é decisão (per `social-interactions/TD-03`), não drift; `comments-sort` (77:128) é rótulo estático; e o nó que o Figma chama `comment-body` é o **contêiner** (77:140, 77:179) — o texto é `comment-text` (77:144, 77:183): mirar por id, não por nome.

**Dependencies:** SI-06.0.1, SI-06.0.2, SI-06.0.3 — os componentes de comentário e o `SubscriberCount` precisam existir em disco, senão a auditoria os marca como `componente ausente` falso

**Tests:** _(empty — audit-only; the report is the deliverable)_

**Acceptance criteria:**

- `frontend-drift-report.md` ganha a seção `## Screen: video-watch-social` datada desta execução, sem sobrescrever as seções das fases anteriores.
- Cada um dos 17 componentes da lista Reused DS tem exatamente uma linha, com Decision preenchida.
- As decisões para os componentes compartilhados com `video-watch-page` coincidem com as registradas na Fase 05, ou a linha carrega `CONFLICT` com justificativa.
- Toda decisão `exception` carrega justificativa de uma linha.
- `git diff --name-only HEAD -- next-frontend` está vazio ao fim do SI.

---

### SI-06.21a — Tela de visualização do vídeo — interações sociais (visual shell)

**Route:** /videos/{publicId}
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=77-64
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Página de visualização do vídeo — interações sociais`
**Drift Report:** see `frontend-drift-report.md` → `## Screen: video-watch-social`

**Technical actions:**

1. **Aplicar as decisões de drift** — ler a seção do relatório para esta tela e aplicar cada linha mecanicamente (`auto-Edit`, `create`, `exception`/`skip`; prefixo `CONFLICT:` é informativo). Sem novo julgamento: a análise foi feita no `SI-06.21.0`.
2. **Geração do shell visual** — invocar `figma:figma-implement-design` com a URL do frame `77:64`, a lista Reused DS (já refletindo as edições da ação 1), os nomes dos componentes server-connected e os target paths `app/videos/[publicId]/page.tsx` + `components/videos/like-button.tsx` + `components/videos/dislike-button.tsx` + `components/videos/video-reactions.tsx` + `components/channels/subscribe-button.tsx` + `components/comments/comments-section.tsx` + `components/comments/new-comment-form.tsx` + `components/comments/replies-load-more.tsx` + `components/comments/comments-load-more.tsx` + `components/comments/comment-like-button.tsx` + `components/comments/comment-dislike-button.tsx` + `components/comments/comment-reactions.tsx`.

   **Não "consertar" o dislike** acrescentando contagem (per `social-interactions/TD-03`), e **não** transformar `comments-sort` em dropdown (per `social-interactions/TD-05`).

**Dependencies:** SI-06.21.0 + SI-06.0.1, SI-06.0.2, SI-06.0.3

**Tests:** _(empty — shell smoke-gated by build AC; Unit tests live in SI-06.21b; E2E in /plan-test-specs spec)_

**Acceptance criteria:**

- Todos os target paths existem, exportam os componentes esperados e compilam com `docker compose exec next-frontend npx tsc --noEmit`.
- A renderização corresponde ao frame `77:64` dentro da tolerância do design system, inclusive o "Gostei · N" com número e o "Não gostei" sem número.
- Nenhum import de runtime além da lista Reused DS e dos componentes server-connected desta tela.
- A faixa de controles do player continua nativa do navegador, como na Fase 05.

---

### SI-06.21b — Tela de visualização do vídeo — interações sociais (lógica & wiring)

**Test Specs:** see `next-frontend/specs/video-watch-social.plan.md`
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Página de visualização do vídeo — interações sociais`

**Technical actions:**

1. **Estratégia de renderização e dados** — `app/videos/[publicId]/page.tsx` continua Server Component e passa a buscar **em paralelo**, via `fetchWithOptionalAuth`, o detalhe público, as sugestões e a primeira página de `GET /videos/{publicId}/comments`, para que o estado pessoal chegue na primeira pintura (per `social-interactions-anonymous-gate/TD-02`); troca o "Entrar" fixo pelo `PublicSiteNavbar` e repassa `isAuthenticated` às ilhas cliente. Falha na leitura de comentários degrada só a seção.
2. **Reações do vídeo** — `VideoReactions` usa `useReaction` com `PUT`/`DELETE /api/videos/{publicId}/reaction` e renderiza `LikeButton` ("Gostei · N") e `DislikeButton` ("Não gostei", sem número), ambos com `aria-pressed` (per `social-interactions/TD-08` e `TD-03`).
3. **Inscrição** — a faixa do canal fica dentro de um `ChannelSubscriptionProvider` inicializado com `channel.viewerSubscribed` e `channel.subscribersCount`; o `SubscribeButton` alterna "Inscrever-se" ↔ "Inscrito" e o `ProvidedSubscriberCount` ocupa a terceira linha da identidade do canal (per `social-interactions/TD-06` e `TD-08`).
4. **Visitante anônimo** — like, dislike e inscrição navegam para `buildLoginHref("/videos/{publicId}")` sem chamar a API (per `social-interactions-anonymous-gate/TD-01` e `TD-03`).
5. **Mapeamento de erro** — conforme `**Error Catalog → UX mapping:**` da tela: `UNAUTHORIZED` reverte e leva ao login com `returnTo`; `RATE_LIMIT_EXCEEDED`, `VIDEO_NOT_FOUND` e `CHANNEL_NOT_FOUND` revertem e exibem mensagem curta junto ao controle, nos padrões de erro da Fase 04 (OQ-13).

**Dependencies:**

- `SI-06.21a` (visual shell must exist before wiring).
- Backend SIs: `SI-06.3`, `SI-06.4`, `SI-06.5`, `SI-06.8` — inscrição, reação em vídeo, detalhe com estado pessoal e primeira página de comentários.
- Frontend: `SI-06.14` (auth opcional), `SI-06.16` e `SI-06.18` (BFF), `SI-06.19` (estado otimista), `SI-06.20` (`PublicSiteNavbar`).
- Shared-types SI: `SI-06.13`.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `components/videos/video-reactions.tsx` | Unit per testing-guide-next-frontend § "Client Components" (MSW) — like/dislike chamam a rota BFF com o `type` certo; exclusão mútua na tela; erro reverte e exibe mensagem; anônimo vai ao login | `components/videos/__tests__/video-reactions.wiring.test.tsx` |
| `components/videos/like-button.tsx` | Unit: rótulo "Gostei · N" e `aria-pressed` refletindo o estado | `components/videos/__tests__/like-button.test.tsx` |
| `components/videos/dislike-button.tsx` | Unit: rótulo sem número em qualquer estado e `aria-pressed` | `components/videos/__tests__/dislike-button.test.tsx` |
| `components/channels/subscribe-button.tsx` | Unit (MSW) — alterna rótulo; `UNAUTHORIZED` leva ao login com `returnTo`; `429` reverte | `components/channels/__tests__/subscribe-button.wiring.test.tsx` |

E2E da página (estado pessoal na primeira pintura, fluxo anônimo → login → volta) é autorado externamente pelo `/plan-test-specs` na spec referenciada em `**Test Specs:**`. /plan-build não emite linha de E2E aqui.

**Acceptance criteria:**

- Um usuário que já curtiu o vídeo abre a página e vê "Gostei · N" pressionado na primeira pintura, sem piscar do estado neutro.
- Clicar "Não gostei" com o like ativo despressiona o like, pressiona o dislike e reduz o N em 1 imediatamente.
- Clicar "Inscrever-se" muda o botão para "Inscrito" e a contagem de inscritos sobe 1 no mesmo instante.
- Um visitante anônimo que clica em "Gostei" vai para `/login?returnTo=/videos/{publicId}` e, depois do login, volta à mesma página.
- Uma falha da API na reação devolve botão e contagem ao estado anterior e exibe uma mensagem perto do controle.

---

### SI-06.21c — Tela de visualização do vídeo — comentários (lógica & wiring) (auto-split from SI-06.21b by /plan-build)

_Auto-split rationale: original SI-06.21b would have 10 Technical actions; split per "complex state setup (provider + N consumers)" — 21b fica com os dados da página, as reações do vídeo e a inscrição; 21c com a seção de comentários, que tem estado e consumidores próprios._

**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Página de visualização do vídeo — interações sociais`

**Technical actions:**

1. **Seção de comentários** — `CommentsSection` (`"use client"`) recebe a primeira página e o `commentsCount` do Server Component, é dona da lista de threads e das páginas carregadas, renderiza o heading "N comentários · Mais recentes primeiro" e os estados vazio e de erro nos padrões da Fase 04 (OQ-13) (per `social-interactions/TD-05`).
2. **Compositor** — `NewCommentForm` com react-hook-form + Zod espelhando `body` aparado, 1 a 2000 caracteres (per `phase-02-auth-frontend/TD-04`); `POST /api/videos/{publicId}/comments`; item pendente no topo via `useOptimistic` substituído pela resposta (per `social-interactions/TD-08`); no modo resposta, aberto pelo `ReplyButton`, envia `parentId` da **raiz** e a resposta entra no topo da `ReplyList` (per `social-interactions/TD-04`). Para o anônimo, foco ou clique leva ao login com `returnTo`.
3. **Paginação** — `CommentsLoadMore` busca `GET /api/videos/{publicId}/comments?offset={carregadas}&limit=10` e acrescenta threads; `RepliesLoadMore` busca `GET /api/comments/{commentId}/replies?offset={replies.length}&limit={repliesCount − replies.length, máx. 50}` e acrescenta respostas; os dois somem quando o carregado alcança o total e anunciam carregamento e fim (per `social-interactions/TD-05`).
4. **Reações em comentário** — `CommentReactions` por comentário e por resposta, com `useReaction` sobre `PUT`/`DELETE /api/comments/{commentId}/reaction`, renderizando `CommentLikeButton` ("Gostei · N") e `CommentDislikeButton` (sem número) com `aria-pressed`.
5. **Mapeamento de erro** — `VALIDATION_ERROR` inline abaixo do campo; `UNAUTHORIZED` leva ao login com `returnTo`; `RATE_LIMIT_EXCEEDED` e `COMMENT_NOT_FOUND` revertem o otimista e exibem mensagem na thread, conforme a tabela da tela.

**Dependencies:** SI-06.21b — a página já entrega a primeira página de comentários e o `isAuthenticated` · SI-06.9, SI-06.10, SI-06.11 — publicação, respostas e reação em comentário · SI-06.16, SI-06.17 — rotas BFF

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `components/comments/comments-section.tsx` | Unit per testing-guide-next-frontend § "Client Components" — heading com contagem; estado vazio; item pendente no topo e substituído pela resposta | `components/comments/__tests__/comments-section.test.tsx` |
| `components/comments/new-comment-form.tsx` | Unit (MSW) — submit feliz; corpo só com espaços desabilita o envio; `VALIDATION_ERROR` inline; modo resposta envia `parentId`; anônimo vai ao login | `components/comments/__tests__/new-comment-form.wiring.test.tsx` |
| `components/comments/comments-load-more.tsx` | Unit (MSW) — acrescenta página; some ao alcançar o `total` | `components/comments/__tests__/comments-load-more.test.tsx` |
| `components/comments/replies-load-more.tsx` | Unit (MSW) — pede a partir de `offset = replies.length`; acrescenta; some quando completa | `components/comments/__tests__/replies-load-more.test.tsx` |
| `components/comments/comment-reactions.tsx` | Unit (MSW) — like/dislike por comentário com exclusão mútua; erro reverte | `components/comments/__tests__/comment-reactions.wiring.test.tsx` |

Sem linha de E2E e sem `**Test Specs:**`: o E2E da tela inteira, inclusive o fluxo de comentário, vive na spec do `SI-06.21b`.

**Acceptance criteria:**

- Publicar "Ótimo vídeo" faz o comentário aparecer no topo da lista imediatamente e o heading passar de "N comentários" para "N+1 comentários".
- Responder a uma **resposta** faz a nova resposta aparecer na mesma lista de respostas da thread, nunca recuada sob a resposta clicada.
- "Ver mais 4 respostas" acrescenta as 4 respostas restantes à thread e desaparece.
- "Carregar mais comentários" acrescenta a próxima página de até 10 threads e desaparece quando todas foram carregadas.
- Um vídeo sem comentários mostra "0 comentários", o compositor e o texto de lista vazia.
- Tentar enviar um comentário só com espaços não emite requisição.

---

### SI-06.22.0 — Drift audit: Área de canais seguidos

**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=75-62
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Área de canais seguidos`

**Technical actions:**

1. **Drift audit** — invocar `figma:figma-implement-design` (handoff estreito) com:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=75-62
   - Reused DS components: `components/layout/site-navbar.tsx`, `components/auth/brand-logo.tsx`, `components/icons/streamtube-icon.tsx`, `components/layout/user-menu.tsx`, `components/ui/avatar.tsx`, `components/channels/subscriber-count.tsx`
   - Server-connected component names: `channel-list`, `channel-row`, `SubscriptionToggleButton`
   - Target paths (contexto read-only): `app/(studio)/channel/subscriptions/page.tsx` + `components/channels/*.tsx`

   Escrever a seção `## Screen: channel-subscriptions — audited at SI-06.22.0` em `frontend-drift-report.md`, consultando as decisões de `video-watch-social` (chrome e `SubscriberCount` são os mesmos). **Sem edição de código.**

   **Entrada que a auditoria já sabe que vai encontrar:** a `SiteNavbar` do frame tem o link "Canais seguidos" (75:74), que o disco ainda não tem até o `SI-06.20` — com o `SI-06.20` aplicado, a linha é `alinhado`; o wordmark "EstúdioCriador" do `BrandLogo` segue a decisão de `exception` da Fase 05.

**Dependencies:** SI-06.0.1 — `SubscriberCount` em disco · SI-06.20 — link na `SiteNavbar`

**Tests:** _(empty — audit-only; the report is the deliverable)_

**Acceptance criteria:**

- `frontend-drift-report.md` ganha a seção `## Screen: channel-subscriptions` datada desta execução, sem sobrescrever as outras.
- Cada um dos 6 componentes da lista Reused DS tem exatamente uma linha, com Decision preenchida.
- As decisões de chrome coincidem com as de `video-watch-social`, ou a linha carrega `CONFLICT` com justificativa.
- `git diff --name-only HEAD -- next-frontend` está vazio ao fim do SI.

---

### SI-06.22a — Tela de área de canais seguidos (visual shell)

**Route:** /channel/subscriptions
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=75-62
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Área de canais seguidos`
**Drift Report:** see `frontend-drift-report.md` → `## Screen: channel-subscriptions`

**Technical actions:**

1. **Aplicar as decisões de drift** — ler a seção do relatório para esta tela e aplicar cada linha mecanicamente. Sem novo julgamento.
2. **Geração do shell visual** — invocar `figma:figma-implement-design` com a URL do frame `75:62`, a lista Reused DS e os target paths `app/(studio)/channel/subscriptions/page.tsx` + `app/(studio)/channel/subscriptions/loading.tsx` + `app/(studio)/channel/subscriptions/error.tsx` + `components/channels/subscribed-channel-list.tsx` + `components/channels/subscribed-channel-card.tsx` + `components/channels/subscription-button.tsx`. A rota nasce em `app/(studio)/`, ao lado das irmãs (OQ-19); `loading.tsx` e `error.tsx` seguem os das irmãs.

**Dependencies:** SI-06.22.0 + SI-06.0.1

**Tests:** _(empty — shell smoke-gated by build AC; Unit tests live in SI-06.22b; E2E in /plan-test-specs spec)_

**Acceptance criteria:**

- Todos os target paths existem, exportam os componentes esperados e compilam com `docker compose exec next-frontend npx tsc --noEmit`.
- A renderização corresponde ao frame `75:62` dentro da tolerância do design system: heading, subtítulo "N canais" e linhas com avatar, nome, "N inscritos · N vídeos" e botão "Inscrito".
- Nenhum import de runtime além da lista Reused DS e dos componentes server-connected desta tela.

---

### SI-06.22b — Tela de área de canais seguidos (lógica & wiring)

**Test Specs:** see `next-frontend/specs/channel-subscriptions.plan.md`
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Área de canais seguidos`

**Technical actions:**

1. **Guarda de rota** — `Authenticated`: o layout do grupo `(studio)` já redireciona o visitante sem sessão para `/login`; a página não acrescenta guarda própria.
2. **Estratégia de renderização e dados** — `page.tsx` é Server Component e lê `GET /me/subscriptions` por `fetchFromUpstream` com `returnTo` `/channel/subscriptions`, como as irmãs do grupo; o subtítulo "N canais" sai de `total` e o estado vazio aparece com `items: []` (OQ-14) (per `social-interactions/TD-07`).
3. **Linhas** — `SubscribedChannelList` e `SubscribedChannelCard` ficam Server Components; o nome do canal é `<Link>` para `/@{nickname}` (per `social-interactions/TD-07`, Revisions de 2026-10-04); cada linha envolve o `SubscriptionToggleButton` e o `ProvidedSubscriberCount` num `ChannelSubscriptionProvider` inicializado com `subscribed: true`.
4. **Toggle** — o `SubscriptionToggleButton` desinscreve por `DELETE` e, com um segundo clique, reinscreve por `PUT` em `/api/channels/{nickname}/subscription`; a linha **permanece** na lista até a próxima visita (premissa registrada em `### UI Contracts`) (per `social-interactions/TD-08`).
5. **Mapeamento de erro** — `UNAUTHORIZED` leva ao login com `returnTo=/channel/subscriptions`; `RATE_LIMIT_EXCEEDED` e `CHANNEL_NOT_FOUND` revertem e exibem mensagem na linha.

**Dependencies:**

- `SI-06.22a` (visual shell must exist before wiring).
- Backend SIs: `SI-06.3` (inscrição), `SI-06.12` (`GET /me/subscriptions`).
- Frontend: `SI-06.18` (BFF de inscrição), `SI-06.19` (provider).
- Shared-types SI: `SI-06.13`.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `components/channels/subscription-button.tsx` | Unit per testing-guide-next-frontend § "Client Components" (MSW) — primeiro clique chama `DELETE` e mostra "Inscrever-se"; segundo chama `PUT`; erro reverte; `UNAUTHORIZED` leva ao login | `components/channels/__tests__/subscription-button.wiring.test.tsx` |
| `components/channels/subscribed-channel-card.tsx` | Unit: meta "N inscritos · N vídeos" e link para `/@{nickname}` | `components/channels/__tests__/subscribed-channel-card.test.tsx` |

E2E da página é autorado externamente pelo `/plan-test-specs` na spec referenciada em `**Test Specs:**`.

**Acceptance criteria:**

- Um usuário que segue 3 canais vê "Canais que você segue", "3 canais" e 3 linhas, o canal seguido mais recentemente primeiro.
- Clicar no nome de um canal leva a `/@{nickname}`.
- Clicar "Inscrito" muda o botão para "Inscrever-se" e reduz em 1 a contagem de inscritos da linha imediatamente; a linha continua na lista.
- Um segundo clique reinscreve e devolve botão e contagem ao estado anterior.
- Um usuário que não segue ninguém vê "0 canais" e o texto de lista vazia.
- Acessar `/channel/subscriptions` sem sessão leva ao login.

---

### SI-06.23.0 — Drift audit: Página pública do canal

**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=59-2
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Página pública do canal`

**Technical actions:**

1. **Drift audit** — invocar `figma:figma-implement-design` (handoff estreito) com:
   - Figma URL: https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=59-2
   - Reused DS components: `components/layout/site-navbar.tsx`, `components/auth/brand-logo.tsx`, `components/icons/streamtube-icon.tsx`, `components/ui/button.tsx`, `components/channels/channel-header.tsx`, `components/ui/avatar.tsx`, `components/ui/badge.tsx`, `components/ui/pagination.tsx`, `components/videos/video-card.tsx`, `components/channels/subscriber-count.tsx`
   - Server-connected component names: `ChannelHeader`, `VideoCard`, `SubscriberCount`, `SubscribeButton`
   - Target paths (contexto read-only): `app/channels/[nickname]/page.tsx` + `components/channels/*.tsx`

   Escrever a seção `## Screen: channel-public-social — audited at SI-06.23.0` em `frontend-drift-report.md`, consultando as decisões da seção da Fase 04 desta mesma tela e de `video-watch-social`. **Sem edição de código.**

   **Entradas que a auditoria já sabe que vai encontrar:** o `ChannelHeader` em disco não tem a contagem de inscritos nem o botão (79:82) — é a extensão desta fase, `drift relevante` com `auto-Edit`; o layout do frame é absoluto, sem auto-layout real, e precisa ser reimplementado em CSS; as pendências da Fase 04 desta tela (wordmark, mock de paginação, nickname de exemplo com ponto) seguem as decisões já registradas.

**Dependencies:** SI-06.0.1 — `SubscriberCount` em disco

**Tests:** _(empty — audit-only; the report is the deliverable)_

**Acceptance criteria:**

- `frontend-drift-report.md` ganha a seção `## Screen: channel-public-social` datada desta execução, sem sobrescrever a seção da Fase 04 desta tela.
- Cada um dos 10 componentes da lista Reused DS tem exatamente uma linha, com Decision preenchida.
- A linha do `ChannelHeader` registra a extensão (contagem de inscritos + botão) como decisão explícita.
- `git diff --name-only HEAD -- next-frontend` está vazio ao fim do SI.

---

### SI-06.23a — Tela pública do canal com inscrição (visual shell)

**Route:** /@{nickname}
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=59-2
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Página pública do canal`
**Drift Report:** see `frontend-drift-report.md` → `## Screen: channel-public-social`

**Technical actions:**

1. **Aplicar as decisões de drift** — ler a seção do relatório para esta tela e aplicar cada linha mecanicamente — inclusive o `auto-Edit` do `ChannelHeader` que acrescenta a contagem e o lugar do botão. Sem novo julgamento.
2. **Geração do shell visual** — invocar `figma:figma-implement-design` com a URL do frame `59:2`, a lista Reused DS e os target paths `app/channels/[nickname]/page.tsx` + `components/channels/channel-header.tsx` + `components/channels/subscribe-button.tsx` — **o mesmo arquivo** criado no `SI-06.21a`, reusado, não recriado. `ChannelMeta` passa a `@{nickname} · <SubscriberCount /> · {total} vídeos`.

**Dependencies:** SI-06.23.0 + SI-06.0.1 + SI-06.21a — o `SubscribeButton` já existe e é o mesmo componente

**Tests:** _(empty — shell smoke-gated by build AC; Unit tests live in SI-06.23b; E2E in /plan-test-specs spec)_

**Acceptance criteria:**

- Os target paths existem e compilam com `docker compose exec next-frontend npx tsc --noEmit`; não surge um segundo arquivo de botão de inscrição.
- A renderização corresponde ao frame `59:2` dentro da tolerância do design system, com o botão "Inscrever-se" alinhado à direita na altura do nome do canal.
- A grade de vídeos e a paginação da Fase 04 continuam como estavam.

---

### SI-06.23b — Tela pública do canal com inscrição (lógica & wiring)

**Test Specs:** see `next-frontend/specs/channel-public-subscription.plan.md`
**UI Contract:** see `## Technical Specifications` → `### UI Contracts` → `#### Screen: Página pública do canal`

**Technical actions:**

1. **Estratégia de renderização e dados** — `app/channels/[nickname]/page.tsx` continua Server Component e passa a ler `GET /channels/{nickname}` via `fetchWithOptionalAuth`, recebendo `subscribersCount` e `viewerSubscribed` na primeira pintura (per `social-interactions-anonymous-gate/TD-02`); troca o "Entrar" fixo pelo `PublicSiteNavbar`. A leitura de vídeos da Fase 04 não muda.
2. **Cabeçalho** — `ChannelHeader` recebe `subscribersCount`, `viewerSubscribed` e `isAuthenticated` e envolve a meta e o botão num `ChannelSubscriptionProvider`: `ProvidedSubscriberCount` dentro de `ChannelMeta` e `SubscribeButton` à direita (per `social-interactions/TD-06` e `TD-08`).
3. **Visitante anônimo** — o `SubscribeButton` renderiza e o clique navega para `buildLoginHref("/@{nickname}")` sem chamar a API (per `social-interactions-anonymous-gate/TD-01` e `TD-03`).
4. **Mapeamento de erro** — `UNAUTHORIZED` leva ao login com `returnTo`; `RATE_LIMIT_EXCEEDED` e `CHANNEL_NOT_FOUND` em mutação revertem e exibem mensagem junto ao botão; `CHANNEL_NOT_FOUND` na leitura inicial continua o `notFound()` da Fase 04.

**Dependencies:**

- `SI-06.23a` (visual shell must exist before wiring).
- Backend SIs: `SI-06.3` (inscrição), `SI-06.6` (contagem e estado pessoal no canal).
- Frontend: `SI-06.14` (auth opcional), `SI-06.18` (BFF de inscrição), `SI-06.19` (provider), `SI-06.20` (`PublicSiteNavbar`).
- Shared-types SI: `SI-06.13`.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `components/channels/channel-header.tsx` | Unit per testing-guide-next-frontend § "Client Components" — meta com nickname, contagem de inscritos e total de vídeos; botão no estado de `viewerSubscribed`; "1 vídeo" no singular continua | `components/channels/__tests__/channel-header.test.tsx` |

O comportamento do `SubscribeButton` já é testado no `SI-06.21b` — é o mesmo arquivo. E2E da página é autorado externamente pelo `/plan-test-specs` na spec referenciada em `**Test Specs:**`.

**Acceptance criteria:**

- Um visitante anônimo abre `/@{nickname}` e vê "@{nickname} · N inscritos · N vídeos" e o botão "Inscrever-se".
- Um usuário inscrito abre a mesma página e vê o botão "Inscrito" na primeira pintura.
- Clicar "Inscrever-se" com sessão muda o botão para "Inscrito" e soma 1 à contagem no mesmo instante; recarregar a página mantém o estado.
- Um visitante anônimo que clica "Inscrever-se" vai para `/login?returnTo=/@{nickname}` e volta à página do canal depois do login.
- Um nickname inexistente continua renderizando a tela de canal não encontrado da Fase 04.

---

## Technical Specifications

### Data Model

**Estado no repositório, verificado em 2026-10-05:** `videos` já tem `likes_count` e `comments_count` (`int`, default 0), criados pela Fase 04 *(per video-channel-management/TD-05)* e **nunca incrementados** até aqui; não existe `dislikes_count`, e esta fase não o cria *(per social-interactions/TD-03)*. `channels` **não** tem contagem de inscritos. Não existem tabelas de reação, comentário nem inscrição. O usuário (`users`) não tem nome de exibição — a identidade pública de quem comenta é o **canal** do usuário (`channels.user_id` é único, um canal por usuário).

#### VideoReaction — `video_reactions` (nova)

*(per social-interactions/TD-01 — duas tabelas dedicadas, cada uma com FK real)*

| Field | Type | Constraints |
|-------|------|-------------|
| user_id | uuid | PK (composta), FK → `users.id` ON DELETE CASCADE |
| video_id | uuid | PK (composta), FK → `videos.id` ON DELETE CASCADE |
| type | enum `reaction_type` (`like`, `dislike`) | not null |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

**Relations:** `User` has many `VideoReaction`; `Video` has many `VideoReaction` (many-to-one nos dois lados)
**Indexes:** PK composta em (`user_id`, `video_id`) — garante **uma reação por usuário por vídeo**, o que torna like e dislike mutuamente exclusivos por construção; índice em `video_id`

#### CommentReaction — `comment_reactions` (nova)

*(per social-interactions/TD-01)*

| Field | Type | Constraints |
|-------|------|-------------|
| user_id | uuid | PK (composta), FK → `users.id` ON DELETE CASCADE |
| comment_id | uuid | PK (composta), FK → `comments.id` ON DELETE CASCADE |
| type | enum `reaction_type` (`like`, `dislike`) | not null — mesmo tipo enum de `video_reactions` |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

**Relations:** `User` has many `CommentReaction`; `Comment` has many `CommentReaction`
**Indexes:** PK composta em (`user_id`, `comment_id`); índice em `comment_id`

#### Comment — `comments` (nova)

*(per social-interactions/TD-04 — profundidade 1, `parent_id` nulável)*

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PK, generated |
| video_id | uuid | FK → `videos.id` ON DELETE CASCADE, not null |
| user_id | uuid | FK → `users.id` ON DELETE CASCADE, not null |
| parent_id | uuid | FK → `comments.id` ON DELETE CASCADE, **nullable** — nulo = comentário-raiz; preenchido = resposta, e **sempre aponta para uma raiz** |
| body | text | not null — limites em §API Contracts → Validation Rules |
| likes_count | int | not null, default 0 — contador desnormalizado (ver "Manutenção dos contadores") |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

**Relations:** `Video` has many `Comment`; `User` has many `Comment`; `Comment` has many `Comment` como respostas (auto-relação por `parent_id`)
**Indexes:** (`video_id`, `parent_id`, `created_at`) — serve a listagem de raízes de um vídeo, mais recentes primeiro; (`parent_id`, `created_at`) — serve as respostas de uma raiz

**Regra de profundidade 1** *(per social-interactions/TD-04)*: responder a uma **resposta** cria um filho da **mesma raiz** — o serviço resolve o `parent_id` recebido para a raiz dele antes de gravar. Respostas a respostas nunca existem no banco; o desenho é coerente com isso, e "Responder" aparece em cada resposta justamente porque responder ali produz um irmão na mesma lista. A regra é de serviço: uma `CHECK` não alcança outra linha.

Sem `dislikes_count` em `comments` *(per social-interactions/TD-03)*.

#### Subscription — `subscriptions` (nova)

*(per social-interactions/TD-06)*

| Field | Type | Constraints |
|-------|------|-------------|
| user_id | uuid | PK (composta), FK → `users.id` ON DELETE CASCADE |
| channel_id | uuid | PK (composta), FK → `channels.id` ON DELETE CASCADE |
| created_at | timestamptz | default now() |

**Relations:** `User` has many `Subscription`; `Channel` has many `Subscription`
**Indexes:** PK composta em (`user_id`, `channel_id`) — uma inscrição por par; (`user_id`, `created_at`) — serve a área de canais seguidos, inscrição mais recente primeiro; índice em `channel_id`

#### Channel — `channels` (modificada)

| Field | Type | Constraints |
|-------|------|-------------|
| subscribers_count | int | **nova**, not null, default 0 *(per social-interactions/TD-06 — Option B, desnormalizada)* |

Nenhuma outra coluna muda.

#### Video — `videos` (sem mudança de schema)

`likes_count` e `comments_count` passam a ser mantidos por esta fase. Nenhuma coluna nova.

#### Manutenção dos contadores

*(per social-interactions/TD-02 — delta no serviço, mesma transação do evento que o origina; e social-interactions/TD-06 — `subscribers_count` segue o mesmo mecanismo)*

O incremento é `UPDATE … SET x = x + :delta`, atômico no nível do SQL, exatamente como o `views_count` da Fase 05 — e acontece **na mesma transação** que grava ou apaga a reação, o comentário ou a inscrição. A aritmética do toggle é uma **função pura** testável sem banco:

| Reação anterior → nova | Delta em `likes_count` |
|------------------------|------------------------|
| nenhuma → `like` | +1 |
| `like` → nenhuma | −1 |
| `like` → `dislike` | −1 |
| `dislike` → `like` | +1 |
| nenhuma → `dislike` | 0 |
| `dislike` → nenhuma | 0 |
| qualquer → a mesma | 0 — a operação é idempotente |

- `subscribers_count`: +1 quando a inscrição é criada, −1 quando é removida, **0** quando o `PUT` encontra a inscrição já existente ou o `DELETE` não encontra nenhuma. Repetir a chamada nunca desvia o contador.
- `comments_count` do vídeo: +1 por comentário publicado, **raiz ou resposta**. _Premissa do build, não vem de TD:_ o número exibido ("12 comentários") conta tudo o que foi publicado no vídeo; o `total` da listagem paginada, que conta só raízes, é outro número e vive na resposta de `GET /videos/{publicId}/comments`.

**Quem escreve cada contador** — *(Single Responsibility, `CLAUDE.md`)*: a coluna só é alterada pelo serviço dono da entidade, por um método que recebe o `EntityManager` da transação aberta pelo dono do evento.

| Contador | Dono (escreve) | Quem abre a transação |
|----------|----------------|-----------------------|
| `videos.likes_count` | `VideosService` | `VideosService` (reação em vídeo) |
| `videos.comments_count` | `VideosService` | `CommentsService` (novo comentário) |
| `comments.likes_count` | `CommentsService` | `CommentsService` (reação em comentário) |
| `channels.subscribers_count` | `ChannelsService` | `SubscriptionsService` (inscrever / desinscrever) |

As duas tabelas de reação têm **um único produtor**, um `ReactionsService` num `ReactionsModule` próprio, que grava a reação e devolve a reação anterior para o cálculo do delta. É a mitigação que o TD-02 exige para o risco que a Option A aceita: escrita fora do serviço.

**Grafo de módulos resultante — sem ciclo:** `VideosModule` → `ReactionsModule`, `SubscriptionsModule`; `CommentsModule` → `VideosModule`, `ReactionsModule`; `SubscriptionsModule` → `ChannelsModule`. `ReactionsModule` não importa nenhum módulo de domínio. As rotas que juntam dados de dois domínios ficam no módulo que já importa os dois — mesmo critério do `ChannelVideosController`, que vive em `VideosModule` "para evitar dependência circular".

### API Contracts

Dois tiers. O **backend tier** (`nestjs-project/`) é a fonte dos contratos; o **BFF tier** (`next-frontend/`) é a projeção que o browser consome, conforme o modelo strict-BFF documentado em `next-frontend/CLAUDE.md`.

**Estado no repositório, verificado em 2026-10-05:** `GET /videos/{publicId}/public` e `GET /channels/{nickname}` existem, são `@Public()` e não expõem nenhum dado social. O guard global (`JwtAuthGuard`) **já** faz autenticação opcional em rota `@Public()`: com Bearer válido anexa `request.user`; com Bearer ausente **ou inválido** a rota segue anônima, sem 401. O throttler é global (`ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])` + `APP_GUARD` em `auth.module.ts`). Nenhuma rota de reação, comentário ou inscrição existe.

**Estado pessoal no payload da página** *(per social-interactions-anonymous-gate/TD-02 — endpoint público com auth opcional, payload único)*: as leituras públicas desta fase devolvem o estado do próprio visitante (`viewerReaction`, `viewerSubscribed`) **na mesma resposta** dos dados públicos, preenchido quando há Bearer válido e neutro (`null` / `false`) para o anônimo. Nenhuma leitura separada de estado pessoal é feita pelo cliente — é ela que reintroduziria o flicker de primeira pintura rejeitado pelo `phase-02-auth-frontend/TD-06`. "Payload único" é lido aqui como **uma resposta por recurso, servida no render do Server Component**: o detalhe do vídeo e a primeira página de comentários são dois recursos e duas rotas, buscados em paralelo pela página; o detalhe do vídeo não carrega comentários embutidos, o que manteria o `VideosService` dono de dados de outro domínio.

#### Backend tier

#### GET /videos/{publicId}/public (SI-06.X) — modificado

Contrato da Fase 05 preservado; esta fase **acrescenta** cinco campos. O `@ApiBearerAuth` já está declarado.

**Request headers:**
- Authorization: Bearer token — opcional; quando válido, preenche o estado pessoal

**Response 200:** todos os campos atuais de `PublicVideoDetailResponse`, mais:
- likesCount: number — `videos.likes_count` *(per social-interactions/TD-02)*
- commentsCount: number — `videos.comments_count`
- viewerReaction: `'like'` | `'dislike'` | null — reação do visitante no vídeo; `null` para o anônimo *(per social-interactions-anonymous-gate/TD-02)*
- channel.subscribersCount: number — `channels.subscribers_count` *(per social-interactions/TD-06)*
- channel.viewerSubscribed: boolean — se o visitante segue o canal; `false` para o anônimo

**Não há contagem de dislikes** nesta resposta nem em nenhuma outra *(per social-interactions/TD-03 — só o estado do próprio usuário)*.

**Error responses:** inalteradas — 404, 409 como hoje.

---

#### GET /channels/{nickname} (SI-06.X) — modificado

Contrato da Fase 04 preservado; acrescenta autenticação opcional e dois campos. Ganha `@ApiBearerAuth('access-token')`, que hoje não declara.

**Request headers:**
- Authorization: Bearer token — opcional

**Response 200:** todos os campos atuais de `PublicChannelResponse`, mais:
- subscribersCount: number — `channels.subscribers_count` *(per social-interactions/TD-06)*
- viewerSubscribed: boolean — `false` para o anônimo *(per social-interactions-anonymous-gate/TD-02)*

**Error responses:** inalteradas — 404 `CHANNEL_NOT_FOUND`.

---

#### PUT /videos/{publicId}/reaction (SI-06.X)

Registra ou troca a reação do usuário no vídeo. `PUT` porque a reação é um sub-recurso singular por usuário: repetir a mesma chamada não muda nada.

**Request headers:**
- Authorization: Bearer token — obrigatório
- Content-Type: application/json

**Request body:**
- type: `'like'` | `'dislike'`, required

**Response 200:**
- viewerReaction: `'like'` | `'dislike'`
- likesCount: number — valor **após** a operação, lido na mesma transação; é o número com que o cliente reconcilia o estado otimista *(per social-interactions/TD-08)*

**Rate limit:** `@Throttle({ default: { limit: 60, ttl: 60000 } })` — 60 requisições por 60 s, rastreadas por IP, storage em memória *(per social-interactions/TD-09 — orçamento de reações e inscrição)*.

**Error responses:**
- 400 VALIDATION_ERROR: `type` ausente ou fora do enum
- 401: sem Bearer válido
- 404 VIDEO_NOT_FOUND: vídeo inexistente, ou rascunho de outro canal — guardado por `assertServable`, mesma regra das demais rotas do vídeo
- 429 RATE_LIMIT_EXCEEDED: mais de 60 por 60 s

---

#### DELETE /videos/{publicId}/reaction (SI-06.X)

Retira a reação do usuário. Idempotente: sem reação gravada, devolve o estado atual sem erro.

**Request headers:**
- Authorization: Bearer token — obrigatório

**Response 200:**
- viewerReaction: null
- likesCount: number — valor após a operação

**Rate limit:** mesmo orçamento de 60/60 s *(per social-interactions/TD-09)*.

**Error responses:**
- 401: sem Bearer válido
- 404 VIDEO_NOT_FOUND
- 429 RATE_LIMIT_EXCEEDED

---

#### GET /videos/{publicId}/comments (SI-06.X)

Comentários-raiz do vídeo, **mais recentes primeiro**, cada um com **até 3 respostas pré-carregadas** e o total de respostas da thread *(per social-interactions/TD-05 — Option B)*. Pública, auth opcional.

**Request headers:**
- Authorization: Bearer token — opcional; quando válido, preenche `viewerReaction` em cada comentário e resposta

**Request query parameters:**
- offset: number, opcional — default 0
- limit: number, opcional — default **10** *(per social-interactions/TD-05 — 10 raízes por página)*

**Response 200:**
- items: lista de threads, cada uma com:
  - id: string (uuid)
  - parentId: null
  - body: string
  - createdAt: string (ISO-8601)
  - likesCount: number
  - viewerReaction: `'like'` | `'dislike'` | null
  - author: objeto com `name` e `nickname` do canal de quem comentou
  - replies: lista de até 3 respostas, mais recentes primeiro, cada uma com os mesmos campos de comentário e `parentId` preenchido com o id da raiz
  - repliesCount: number — total de respostas da thread; o "Ver mais N respostas" é `repliesCount − replies.length`
- total: number — total de **raízes** do vídeo, para a paginação saber quando não há mais páginas
- offset: number
- limit: number

**Consultas — sem N+1** *(per social-interactions/TD-05)*: uma query para as raízes da página; **uma** query para as respostas de todas as raízes da página, recortada a 3 por raiz por função de janela (`ROW_NUMBER() OVER (PARTITION BY parent_id ORDER BY created_at DESC)`), que entrega no mesmo passo o `repliesCount` (`COUNT(*) OVER (PARTITION BY parent_id)`); e, com Bearer válido, **uma** query de `comment_reactions` para os ids de raízes e respostas da página. O custo é constante por página, não proporcional ao número de threads.

**Error responses:**
- 400 VALIDATION_ERROR: `offset` ou `limit` fora das Validation Rules
- 404 VIDEO_NOT_FOUND: vídeo inexistente, ou rascunho de outro canal (`assertServable`)

---

#### POST /videos/{publicId}/comments (SI-06.X)

Publica um comentário-raiz ou uma resposta. A mesma rota serve os dois casos: o `ReplyForm` é o `NewCommentForm` reusado com `parentId` (decisão da OQ-12 em `/plan-resolve`, coerente com social-interactions/TD-04).

**Request headers:**
- Authorization: Bearer token — obrigatório
- Content-Type: application/json

**Request body:**
- body: string, required — limites em Validation Rules
- parentId: string (uuid), opcional — ausente cria uma raiz; presente cria uma resposta. Se apontar para uma resposta, o serviço grava o filho na **raiz** dela *(per social-interactions/TD-04 — profundidade 1)*

**Response 201:** o comentário criado, na mesma forma de um item de comentário de `GET /videos/{publicId}/comments` (sem `replies` / `repliesCount`), com `likesCount: 0`, `viewerReaction: null` e `parentId` já resolvido para a raiz. O `videos.comments_count` é incrementado na mesma transação *(per social-interactions/TD-02)*.

**Rate limit:** `@Throttle({ default: { limit: 5, ttl: 60000 } })` — 5 por 60 s, por IP *(per social-interactions/TD-09 — orçamento de comentário e resposta)*.

**Error responses:**
- 400 VALIDATION_ERROR: `body` vazio, só espaços ou acima do limite; `parentId` que não é uuid
- 401: sem Bearer válido
- 404 VIDEO_NOT_FOUND: vídeo inexistente, ou rascunho de outro canal
- 404 COMMENT_NOT_FOUND: `parentId` inexistente ou de **outro** vídeo
- 429 RATE_LIMIT_EXCEEDED: mais de 5 por 60 s

---

#### GET /comments/{commentId}/replies (SI-06.X)

Respostas de uma raiz além das pré-carregadas — o "Ver mais N respostas". Mesma ordenação (mais recentes primeiro) e mesma paginação offset/limit *(per social-interactions/TD-05)*. Pública, auth opcional. O cliente pede a partir de `offset = 3`, logo depois das pré-carregadas.

**Request headers:**
- Authorization: Bearer token — opcional

**Request query parameters:**
- offset: number, opcional — default 0
- limit: number, opcional — default 10

**Response 200:**
- items: lista de respostas na forma de item de comentário (`parentId` = `commentId`)
- total: number — total de respostas da raiz
- offset: number
- limit: number

Pedido sobre uma **resposta** devolve página vazia (`items: []`, `total: 0`): pela profundidade 1 ela nunca tem filhos.

**Error responses:**
- 400 VALIDATION_ERROR: `commentId` que não é uuid; `offset` ou `limit` fora das Validation Rules
- 404 COMMENT_NOT_FOUND: comentário inexistente, **ou** cujo vídeo é rascunho de outro canal — o vídeo não é revelado por um caminho lateral

---

#### PUT /comments/{commentId}/reaction (SI-06.X)

Mesmo contrato de `PUT /videos/{publicId}/reaction`, aplicado a comentário ou resposta.

**Request headers:**
- Authorization: Bearer token — obrigatório
- Content-Type: application/json

**Request body:**
- type: `'like'` | `'dislike'`, required

**Response 200:**
- viewerReaction: `'like'` | `'dislike'`
- likesCount: number — `comments.likes_count` após a operação

**Rate limit:** 60 por 60 s, por IP *(per social-interactions/TD-09 — reagir a comentário está no orçamento das reações)*.

**Error responses:**
- 400 VALIDATION_ERROR: `commentId` que não é uuid; `type` inválido
- 401: sem Bearer válido
- 404 COMMENT_NOT_FOUND: comentário inexistente, ou de vídeo que é rascunho de outro canal
- 429 RATE_LIMIT_EXCEEDED

---

#### DELETE /comments/{commentId}/reaction (SI-06.X)

Retira a reação do usuário no comentário. Idempotente.

**Request headers:**
- Authorization: Bearer token — obrigatório

**Response 200:**
- viewerReaction: null
- likesCount: number

**Rate limit:** 60 por 60 s *(per social-interactions/TD-09)*.

**Error responses:**
- 400 VALIDATION_ERROR: `commentId` que não é uuid
- 401: sem Bearer válido
- 404 COMMENT_NOT_FOUND
- 429 RATE_LIMIT_EXCEEDED

---

#### PUT /channels/{nickname}/subscription (SI-06.X)

Inscreve o usuário no canal. Idempotente: já inscrito, devolve o estado atual sem tocar no contador *(per social-interactions/TD-06)*.

**Request headers:**
- Authorization: Bearer token — obrigatório

**Request body:** nenhum.

**Response 200:**
- subscribed: true
- subscribersCount: number — `channels.subscribers_count` após a operação

**Rate limit:** 60 por 60 s, por IP *(per social-interactions/TD-09 — inscrição está no orçamento das reações)*.

**Error responses:**
- 401: sem Bearer válido
- 404 CHANNEL_NOT_FOUND: nickname inexistente
- 429 RATE_LIMIT_EXCEEDED

_Auto-inscrição não é bloqueada:_ nenhum TD decide que o dono não pode seguir o próprio canal, e o build não inventa a regra. Se ela for desejada, é um `/decide` — e exigiria um campo a mais na leitura pública para o cliente esconder o botão do dono.

---

#### DELETE /channels/{nickname}/subscription (SI-06.X)

Cancela a inscrição. Idempotente.

**Request headers:**
- Authorization: Bearer token — obrigatório

**Response 200:**
- subscribed: false
- subscribersCount: number

**Rate limit:** 60 por 60 s *(per social-interactions/TD-09)*.

**Error responses:**
- 401: sem Bearer válido
- 404 CHANNEL_NOT_FOUND
- 429 RATE_LIMIT_EXCEEDED

---

#### GET /me/subscriptions (SI-06.X)

Canais que o usuário segue, inscrição mais recente primeiro — a área de canais seguidos é uma **lista de canais com link para a página pública de cada um**, não um feed de vídeos *(per social-interactions/TD-07 — Option A, e Revisions de 2026-10-04: "acesso rápido aos vídeos" é o link para a página do canal)*. Vive em `VideosModule`, ao lado de `GET /channels/{nickname}`, porque a contagem de vídeos públicos é do `VideosService` (ver Data Model → grafo de módulos).

**Request headers:**
- Authorization: Bearer token — obrigatório

**Request query parameters:**
- offset: number, opcional — default 0
- limit: number, opcional — default 50

**Response 200:**
- items: lista de canais com `name`, `nickname`, `subscribersCount` e `videosCount` (só vídeos publicados e públicos, mesma regra de `GET /channels/{nickname}`)
- total: number — o subtítulo "3 canais" da tela sai daqui, sem leitura adicional
- offset: number
- limit: number

**Consultas:** a contagem de vídeos públicos dos canais da página sai em **uma** query agrupada por canal, não uma por linha.

**Error responses:**
- 400 VALIDATION_ERROR: `offset` ou `limit` fora das Validation Rules
- 401: sem Bearer válido

---

#### BFF tier

> _BFF tier — contrato exposto ao browser. O navegador chama a rota same-origin; o Route Handler faz proxy para o upstream NestJS server-side, conforme o modelo strict-BFF de `next-frontend/CLAUDE.md`._

**Nota de proveniência.** A cadeia de contrato do projeto é `openapi.json` → `lib/api/types.gen.ts` → `paths` (`next-frontend/CLAUDE.md`). Todas as rotas upstream abaixo são **novas nesta fase**, então a fonte das linhas `*(derived: project contract source)*` é o **backend tier acima**; elas entram no `openapi.json` quando o backend for implementado e o sync do contrato rodar, e o CI de frescor (`.github/workflows/openapi-freshness.yml`) passa a cobri-las a partir daí.

**Duas projeções de sessão, ambas sem token no browser** *(per phase-02-auth-frontend/TD-02 — o token mora no cookie selado e nunca cruza para o cliente)*:
- **Mutação** — `withRefresh` + Bearer da sessão, o padrão de `app/api/me/channel/route.ts` *(per phase-02-auth-frontend/TD-03)*. Um 401 dispara um único refresh; se a renovação falha, a rota responde 401 `UNAUTHORIZED`, que o cliente trata levando ao login.
- **Leitura pública com auth opcional** — helper novo em `lib/api/` que anexa o Bearer quando há sessão e, num 401, **repete a chamada anônima** em vez de redirecionar; nunca grava cookie *(per social-interactions-anonymous-gate/TD-02 — "o `fetchFromUpstream` não pode ser reaproveitado, porque o `redirect("/login")` dele é incompatível com página pública")*. Por não gravar cookie, o mesmo helper serve Route Handler e Server Component. _Observação:_ o upstream de hoje não responde 401 em rota `@Public()` com token inválido — segue anônimo —, então o ramo de 401 é defensivo; o TD exige que ele exista e seja coberto por teste mesmo assim.

**Leituras que não passam pelo BFF.** `GET /videos/{publicId}/public`, `GET /channels/{nickname}`, `GET /me/subscriptions`, a primeira página de `GET /videos/{publicId}/comments` e `GET /me/channel` são lidas pelo **Server Component** direto do upstream — o strict-BFF governa o tráfego do **navegador**, e `env.API_URL` é server-only, como `app/videos/[publicId]/page.tsx` já registra. As leituras públicas usam o helper de auth opcional; `GET /me/subscriptions` usa o `fetchFromUpstream` existente, como as irmãs do grupo `(studio)`. **Nenhuma rota BFF é criada sem consumidor no browser.**

#### PUT /api/videos/{publicId}/reaction (SI-06.X)

**forwards-to:** `PUT /videos/{publicId}/reaction` *(derived: project contract source — backend tier desta fase)*

**Request headers:**
- Content-Type: application/json *(derived: project contract source)*
- Authorization: **não** vem do browser — o Route Handler anexa o Bearer da sessão *(per phase-02-auth-frontend/TD-02)*

**Request body:** `{ type }` — pass-through *(derived: project contract source — campos por backend tier; não re-spelled)*

**Response 200 (FE-facing):** pass-through de `{ viewerReaction, likesCount }` *(derived: project contract source; reshape: none)*

**Error responses (FE-facing):**
- 401 UNAUTHORIZED: refresh falhou *(per phase-02-auth-frontend/TD-03)*
- 400, 404, 429: pass-through *(derived: project contract source)*

---

#### DELETE /api/videos/{publicId}/reaction (SI-06.X)

**forwards-to:** `DELETE /videos/{publicId}/reaction` *(derived: project contract source — backend tier desta fase)*

**Request body:** nenhum *(derived: project contract source)*

**Response 200 (FE-facing):** pass-through de `{ viewerReaction: null, likesCount }` *(derived: project contract source; reshape: none)*

**Error responses (FE-facing):**
- 401 UNAUTHORIZED: refresh falhou *(per phase-02-auth-frontend/TD-03)*
- 404, 429: pass-through *(derived: project contract source)*

---

#### GET /api/videos/{publicId}/comments (SI-06.X)

Consumida pelo `CommentsLoadMore` a partir da segunda página; a primeira vem no render do Server Component.

**forwards-to:** `GET /videos/{publicId}/comments` *(derived: project contract source — backend tier desta fase)*

**Request query parameters:** `offset`, `limit` — pass-through *(derived: project contract source)*

**Request headers:** Bearer da sessão anexado **quando houver** sessão, pelo helper de auth opcional *(per social-interactions-anonymous-gate/TD-02)*

**Response 200 (FE-facing):** pass-through de `{ items, total, offset, limit }` *(derived: project contract source; reshape: none)*

**Error responses (FE-facing):**
- 400, 404: pass-through *(derived: project contract source)*
- 401 do upstream: **não chega ao browser** — o helper repete a chamada anônima *(per social-interactions-anonymous-gate/TD-02)*

---

#### POST /api/videos/{publicId}/comments (SI-06.X)

**forwards-to:** `POST /videos/{publicId}/comments` *(derived: project contract source — backend tier desta fase)*

**Request headers:**
- Content-Type: application/json *(derived: project contract source)*

**Request body:** `{ body, parentId? }` — pass-through *(derived: project contract source — campos por backend tier; não re-spelled)*

**Response 201 (FE-facing):** pass-through do comentário criado *(derived: project contract source; reshape: none)*

**Error responses (FE-facing):**
- 401 UNAUTHORIZED: refresh falhou *(per phase-02-auth-frontend/TD-03)*
- 400, 404, 429: pass-through *(derived: project contract source)*

---

#### GET /api/comments/{commentId}/replies (SI-06.X)

**forwards-to:** `GET /comments/{commentId}/replies` *(derived: project contract source — backend tier desta fase)*

**Request query parameters:** `offset`, `limit` — pass-through *(derived: project contract source)*

**Request headers:** Bearer anexado quando houver sessão *(per social-interactions-anonymous-gate/TD-02)*

**Response 200 (FE-facing):** pass-through de `{ items, total, offset, limit }` *(derived: project contract source; reshape: none)*

**Error responses (FE-facing):**
- 400, 404: pass-through *(derived: project contract source)*
- 401 do upstream: não chega ao browser *(per social-interactions-anonymous-gate/TD-02)*

---

#### PUT /api/comments/{commentId}/reaction (SI-06.X)

**forwards-to:** `PUT /comments/{commentId}/reaction` *(derived: project contract source — backend tier desta fase)*

**Request headers:**
- Content-Type: application/json *(derived: project contract source)*

**Request body:** `{ type }` — pass-through *(derived: project contract source — não re-spelled)*

**Response 200 (FE-facing):** pass-through de `{ viewerReaction, likesCount }` *(derived: project contract source; reshape: none)*

**Error responses (FE-facing):**
- 401 UNAUTHORIZED: refresh falhou *(per phase-02-auth-frontend/TD-03)*
- 400, 404, 429: pass-through *(derived: project contract source)*

---

#### DELETE /api/comments/{commentId}/reaction (SI-06.X)

**forwards-to:** `DELETE /comments/{commentId}/reaction` *(derived: project contract source — backend tier desta fase)*

**Request body:** nenhum *(derived: project contract source)*

**Response 200 (FE-facing):** pass-through *(derived: project contract source; reshape: none)*

**Error responses (FE-facing):**
- 401 UNAUTHORIZED: refresh falhou *(per phase-02-auth-frontend/TD-03)*
- 400, 404, 429: pass-through *(derived: project contract source)*

---

#### PUT /api/channels/{nickname}/subscription (SI-06.X)

Consumida pelo `SubscribeButton` (watch page e página do canal) e pelo `SubscriptionToggleButton` (área de canais seguidos) — os dois sentidos do toggle usam o par `PUT`/`DELETE` desta rota.

**forwards-to:** `PUT /channels/{nickname}/subscription` *(derived: project contract source — backend tier desta fase)*

**Request body:** nenhum *(derived: project contract source)*

**Response 200 (FE-facing):** pass-through de `{ subscribed, subscribersCount }` *(derived: project contract source; reshape: none)*

**Error responses (FE-facing):**
- 401 UNAUTHORIZED: refresh falhou *(per phase-02-auth-frontend/TD-03)*
- 404, 429: pass-through *(derived: project contract source)*

---

#### DELETE /api/channels/{nickname}/subscription (SI-06.X)

**forwards-to:** `DELETE /channels/{nickname}/subscription` *(derived: project contract source — backend tier desta fase)*

**Request body:** nenhum *(derived: project contract source)*

**Response 200 (FE-facing):** pass-through *(derived: project contract source; reshape: none)*

**Error responses (FE-facing):**
- 401 UNAUTHORIZED: refresh falhou *(per phase-02-auth-frontend/TD-03)*
- 404, 429: pass-through *(derived: project contract source)*

---

#### Validation Rules — rotas sociais

- `type` (reação em vídeo e em comentário): required, enum `like` | `dislike`
- `body` (novo comentário ou resposta): required, string, **aparado nas pontas**; após aparar, mínimo 1 caractere e **máximo 2000** caracteres. _Premissa do build, não vem de TD:_ nenhum TD fixa o limite; 2000 é o valor adotado para o contrato e é ajustável por `/decide` sem mudar mecanismo.
- `parentId`: opcional, uuid
- `commentId` (path): uuid — validado por `ParseUUIDPipe`, 400 quando não é
- `offset` (comentários, respostas, canais seguidos): opcional, inteiro, `>= 0`, default 0
- `limit` em `GET /videos/{publicId}/comments`: opcional, inteiro, `1..50`, default **10** *(per social-interactions/TD-05)*
- `limit` em `GET /comments/{commentId}/replies`: opcional, inteiro, `1..50`, default 10. _Premissa do build:_ o TD-05 fixa as 3 pré-carregadas, não o tamanho da página de respostas; o cliente pede o restante da thread (`repliesCount − 3`, limitado a 50), coerente com o rótulo "Ver mais 4 respostas" do desenho
- `limit` em `GET /me/subscriptions`: opcional, inteiro, `1..100`, default 50. _Premissa do build:_ nenhum TD fixa a página e o desenho não tem controle de paginação; a tela mostra a primeira página, e paginação/scroll da lista ficam com a Fase 07, que tem esses bullets como próprios

### Authorization Matrix

`Anonymous` = sem `Authorization`, ou com Bearer inválido numa rota `@Public()` (o guard segue anônimo). `Authenticated` = Bearer válido. `Owner` = Bearer válido cujo `sub` é dono do canal do vídeo. O guard global é opt-out por `@Public()`; `assertServable` (per `video-channel-management/TD-02`, revisão de 2026-09-20) distingue rascunho de publicado e vale para **toda** rota desta fase que alcança um vídeo, inclusive pelo caminho lateral de um comentário.

Leitura pública e ação autenticada *(per social-interactions-anonymous-gate/TD-01 — leitura pública; os controles renderizam para o anônimo e o clique leva ao login)*: o `✗` de Anonymous nas rotas de escrita **não** some o controle da tela — ele vira navegação para `/login` com `returnTo` (ver §UI Contracts).

| Endpoint | Anonymous | Authenticated | Owner |
|----------|-----------|---------------|-------|
| GET /videos/{publicId}/public — publicado (estado pessoal só com Bearer) | ✓ | ✓ | ✓ |
| GET /videos/{publicId}/public — rascunho | ✗ | ✗ | ✓ |
| GET /channels/{nickname} (estado pessoal só com Bearer) | ✓ | ✓ | ✓ |
| PUT /videos/{publicId}/reaction — publicado | ✗ | ✓ | ✓ |
| DELETE /videos/{publicId}/reaction — publicado | ✗ | ✓ | ✓ |
| PUT / DELETE /videos/{publicId}/reaction — rascunho | ✗ | ✗ | ✓ |
| GET /videos/{publicId}/comments — publicado | ✓ | ✓ | ✓ |
| GET /videos/{publicId}/comments — rascunho | ✗ | ✗ | ✓ |
| POST /videos/{publicId}/comments — publicado | ✗ | ✓ | ✓ |
| POST /videos/{publicId}/comments — rascunho | ✗ | ✗ | ✓ |
| GET /comments/{commentId}/replies — vídeo publicado | ✓ | ✓ | ✓ |
| GET /comments/{commentId}/replies — vídeo rascunho | ✗ | ✗ | ✓ |
| PUT / DELETE /comments/{commentId}/reaction — vídeo publicado | ✗ | ✓ | ✓ |
| PUT / DELETE /comments/{commentId}/reaction — vídeo rascunho | ✗ | ✗ | ✓ |
| PUT /channels/{nickname}/subscription | ✗ | ✓ | ✓ |
| DELETE /channels/{nickname}/subscription | ✗ | ✓ | ✓ |
| GET /me/subscriptions | ✗ | ✓ | ✓ |

`Owner` na linha de inscrição só registra que o dono não é bloqueado — ver a nota de auto-inscrição em §API Contracts. Nas linhas `GET /me/subscriptions`, `Owner` não tem significado próprio: o recurso é sempre o do próprio usuário autenticado.

---

### Error Catalog

**Forma do envelope** (herdada de `phase-02-auth/TD-07`, já implementada em `src/common/openapi/api-error-envelope.dto.ts`): `{ statusCode, error, message }`. O código de domínio vai no campo **`error`** — não `errorCode`. O rótulo da coluna nomeia o *conceito*; o campo no fio é `error`.

| error | HTTP | Trigger |
|-------|------|---------|
| VIDEO_NOT_FOUND | 404 | Vídeo inexistente, ou rascunho de outro canal, em qualquer rota de reação ou comentário que recebe `publicId` — já existe |
| COMMENT_NOT_FOUND | 404 | **Novo.** `commentId` inexistente; `parentId` inexistente ou de outro vídeo no `POST`; comentário cujo vídeo é rascunho de outro canal |
| CHANNEL_NOT_FOUND | 404 | Nickname inexistente em `PUT`/`DELETE /channels/{nickname}/subscription` — já existe |
| VALIDATION_ERROR | 400 | Corpo ou query fora das Validation Rules; `commentId` que não é uuid — emitido pelo `ValidationExceptionFilter` já global |
| RATE_LIMIT_EXCEEDED | 429 | Acima de 60/60 s nas rotas de reação e inscrição, ou de 5/60 s no `POST` de comentário *(per social-interactions/TD-09)* — emitido pelo `ThrottlerExceptionFilter` já global (fechado no `SI-05.3`) |
| UNAUTHORIZED | 401 | Rota de escrita sem Bearer válido. No upstream é o 401 do guard global; no BFF, é o envelope que o `withRefresh` sintetiza quando o refresh falha *(per phase-02-auth-frontend/TD-03)* |

Nenhum código novo além de `COMMENT_NOT_FOUND`: idempotência cobre o que de outro modo viraria erro ("já curtido", "já inscrito", "não inscrito") — repetir a chamada devolve o estado atual com 200 *(per social-interactions/TD-02 e TD-06 — o contador nunca desvia)*.

### UI Contracts

**Composição de estado otimista — vale para as três telas** *(per social-interactions/TD-08 — `useOptimistic` do React 19)*. Os controles que mudam juntos precisam de **um dono de estado comum** dentro da fronteira `"use client"`, porque a página é Server Component e não pode guardar estado:

- **Like + dislike** (vídeo e cada comentário) são mutuamente exclusivos e o like carrega a contagem. Um container cliente por alvo — `components/videos/video-reactions.tsx` e `components/comments/comment-reactions.tsx`, ambos novos — é dono de `{ viewerReaction, likesCount }` e renderiza o `LikeButton`/`DislikeButton` (ou o par de comentário) por props. Os dois containers usam um hook comum, `hooks/use-reaction.ts` (novo), que aplica no cliente a **mesma tabela de delta** do §Data Model para a contagem otimista e reconcilia com o `likesCount` devolvido pela API.
- **Inscrição + contagem de inscritos** vivem em pontos diferentes do layout (botão à direita, contagem na linha de meta do canal). Um provider cliente, `components/channels/channel-subscription-provider.tsx` (novo), é dono de `{ subscribed, subscribersCount }`; o `SubscribeButton`, o `SubscriptionToggleButton` e o `SubscriberCount` leem dele. É o que o inventário pede ao dizer que a contagem "precisa receber a contagem otimista do SubscribeButton".
- **Falha de mutação**: o `useOptimistic` volta ao estado-base quando a transição termina sem confirmação; o componente então exibe o erro conforme o mapeamento de cada tela.

**Controle do anônimo** *(per social-interactions-anonymous-gate/TD-01 e TD-03)*: todo controle de ação renderiza também para o visitante anônimo; o clique **não** chama a API — navega para `/login?returnTo={caminho atual}`. O `LoginForm`, que hoje só faz `router.refresh()` no sucesso, passa a ler `returnTo` e navegar para ele validado por `safeReturnTo`; sem `returnTo`, mantém o comportamento atual. O `safeReturnTo` hoje é função local de `app/api/auth/refresh/route.ts` e é **extraído** para `lib/auth/` para ser reusado pela rota de refresh e pelo login — reuso de "contrato, validador e vocabulário que já existem", como o TD-03 pede. A ação **não** é repetida automaticamente após o login: o visitante volta ao ponto de interação, agora com o estado pessoal no payload.

**Chrome das páginas públicas.** A watch page e a página do canal passam a ter navbar sensível à sessão: com sessão, `UserMenu` (avatar + "Sair") e o link "Canais seguidos"; sem sessão, o "Entrar" atual. Um Server Component novo, `components/layout/public-site-navbar.tsx`, resolve a sessão e o nome do canal (`GET /me/channel` pelo helper de auth opcional) e compõe a `SiteNavbar` existente — as duas páginas usam o mesmo, sem duplicar a lógica. Uma falha nessa leitura degrada para o chrome anônimo, nunca derruba a página.

---

#### Screen: Página de visualização do vídeo — interações sociais

**Route:** `/videos/{publicId}` — variante autenticada da rota entregue na Fase 05
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=77-64 (node `FetKyb1V02WS5D6VCatK6t:77:64`)
**Purpose:** "Interface completa de comentários, likes e inscrições"

**Auth requirement:** Mixed — specify manually per screen Observations hint.
_Derivação: a heurística do mais restritivo escolheria `Authenticated` (as rotas de escrita da tela exigem Bearer), mas a tela é **pública por decisão** — leitura anônima com controles que levam ao login (social-interactions-anonymous-gate/TD-01). As Observations do inventário não trazem o marcador `mixed-auth-intentional`; o placeholder fica para o usuário confirmar._

**Rendering strategy:** Server Component (RSC) para a página, que busca **em paralelo** o detalhe do vídeo, as sugestões, a primeira página de comentários e — com sessão — `GET /me/channel`, as leituras públicas pelo helper de auth opcional, de modo que o estado pessoal (meu like, meu dislike, minha inscrição, minhas reações em comentários) chega na primeira pintura _(per social-interactions-anonymous-gate/TD-02, coerente com phase-02-auth-frontend/TD-06)_. Fronteiras `"use client"` obrigatórias _(per social-interactions/TD-08)_: `VideoReactions` (com `LikeButton`/`DislikeButton`), `ChannelSubscriptionProvider` (com `SubscribeButton` e `SubscriberCount`), `CommentsSection` (dona da lista e das páginas carregadas), `NewCommentForm`, `CommentReactions` (com `CommentLikeButton`/`CommentDislikeButton`), `ReplyButton`, `RepliesLoadMore`, `CommentsLoadMore`. Herdadas da Fase 05 e inalteradas: `VideoPlayer`, `VideoDescription`, `SidebarLoadMore`. O formulário usa react-hook-form + Zod _(per phase-02-auth-frontend/TD-04)_.

**Reused DS components:**
- `components/layout/site-navbar.tsx` — SiteNavbar — variante **autenticada** (avatar + "Sair") nesta frame; ganha o link "Canais seguidos" (ver tela "Área de canais seguidos")
- `components/auth/brand-logo.tsx` — BrandLogo
- `components/icons/streamtube-icon.tsx` — StreamtubeIcon
- `components/layout/user-menu.tsx` — UserMenu — avatar (78:82) + botão "Sair" (77:74)
- `components/ui/avatar.tsx` — Avatar — avatar do usuário (78:82), do canal (77:96), do compositor (77:130) e de cada comentarista (77:138, 77:177); iniciais, sem upload de avatar
- `components/ui/button.tsx` — DownloadButton (77:100), new-comment-submit "Comentar" (77:133)
- `components/icons/download-icon.tsx` — DownloadIcon
- `components/ui/textarea.tsx` — new-comment-input (77:132) — Campo de rascunho do comentário; o texto no Figma é o placeholder. Estado do rascunho é local — o I/O é do NewCommentForm
- `components/videos/video-description.tsx` — VideoDescription — herdado da Fase 05
- `components/icons/chevron-down-icon.tsx` — ChevronDownIcon
- `components/channels/subscriber-count.tsx` (new) — SubscriberCount (77:118) — **Novo na Fase 06.** Renderiza `subscribers_count` (social-interactions/TD-06, desnormalizado em `channels`) vindo do mesmo payload da página (anonymous-gate/TD-02) — não faz I/O próprio. Precisa receber a contagem otimista do SubscribeButton (social-interactions/TD-08) para que "1,2 mil inscritos" acompanhe o clique; por isso ganha arquivo próprio em vez de `<p>` solto. **O mesmo arquivo serve a página de canal** — confirmado, não mais antecipado: a linha de `SubscriberCount` em `## Screen: Página pública do canal` referencia este componente. _Amended 2026-10-04: reuso cross-screen confirmado per OQ-16 (/plan-resolve, PR #49)._
- `components/comments/comment-list.tsx` (new) — comment-list (77:135) — Renderiza as threads que recebe da CommentsSection; não busca nada por conta própria
- `components/comments/comment-thread.tsx` (new) — CommentThread (77:136, 77:175) — Agrupa uma raiz + sua reply-list. Duas instâncias na frame: a primeira (77:136) com respostas, a segunda (77:175) sem
- `components/comments/comment-item.tsx` (new) — CommentItem (77:137, 77:176 — `comment-root`) — **Colhido isolado a maxDepth 10 em 2026-10-04** (`77-137.json`, `77-176.json`): a sub-estrutura abaixo tem node id e deixou de vir do screenshot. Exibe avatar, autor, timestamp e corpo que recebe da seção; todo o I/O vive nos controles de ação, que têm linhas próprias
- `components/comments/reply-button.tsx` (new) — ReplyButton (77:148, 77:187 na raiz; 77:161 na resposta — `comment-reply-action`) — **Novo na Fase 06.** Aparece na raiz e em cada resposta. **Resolvido 2026-10-03:** o botão só abre o compositor; quem publica é um `ReplyForm` à parte, irmão do `NewCommentForm` — mesma separação que a tela já usa entre o botão "Comentar" (Local-interactive) e o `NewCommentForm` (Server-connected). O `ReplyForm` **não está desenhado em nenhuma frame**, então não tem linha aqui; ver `## Open questions`. Por social-interactions/TD-04 a profundidade é 1: responder a uma resposta ainda cria um filho da mesma raiz
- `components/comments/reply-list.tsx` (new) — ReplyList (77:149, `reply-list`) — **Colhido isolado a maxDepth 10 em 2026-10-04** (`77-149.json`). **Lista de filhos completa desde a run (c)** (`childCount: 3` observado): os dois itens de resposta (77:150, 77:162) e o controle "ver mais" (77:174). Mostra até 3 respostas pré-carregadas por raiz (social-interactions/TD-05)
- `components/comments/comment-reply.tsx` (new) — CommentReply (77:150, 77:162 — `comment-reply`) — Item de resposta recuado (avatar, autor, timestamp, corpo e a mesma linha de ações). Duas instâncias na thread de 77:136, ambas com id desde a run (c), de estrutura idêntica (77:151–77:161 e 77:163–77:173)

_Elementos puro-DOM sem arquivo próprio_ (Reuse? `new` sem path no inventário): `channel-identity` (77:95), `comments-heading` (77:126), `comments-count` (77:127), `comments-sort` (77:128 — **rótulo estático**, não dropdown, per social-interactions/TD-05), `comment-author-line` (77:141, 77:180), `comment-body` (77:144, 77:183 — mirar pelo id: o nó que o Figma chama `comment-body` é o **contêiner** 77:140/77:179, o texto é `comment-text`), `comment-actions` (77:145, 77:184).

**Server-connected components:**
- `SubscribeButton` (77:119) — verbo: inscrever-se no canal do vídeo e cancelar a inscrição a partir da própria página de assistir | endpoint: `PUT` / `DELETE /api/channels/{nickname}/subscription` (§API Contracts → BFF tier); estado inicial de `GET /videos/{publicId}/public` (`channel.viewerSubscribed`, `channel.subscribersCount`) lido no RSC | reuse: `components/channels/subscribe-button.tsx (new)`
- `LikeButton` (77:121) — verbo: registrar ou retirar o like do usuário no vídeo, exibindo a contagem resultante | endpoint: `PUT` / `DELETE /api/videos/{publicId}/reaction` (§API Contracts → BFF tier); estado inicial de `viewerReaction` + `likesCount` do detalhe | reuse: `components/videos/like-button.tsx (new)`
- `DislikeButton` (77:123) — verbo: registrar ou retirar o dislike do usuário no vídeo, sem exibir contagem | endpoint: `PUT` / `DELETE /api/videos/{publicId}/reaction` (§API Contracts → BFF tier) | reuse: `components/videos/dislike-button.tsx (new)`
- `CommentsSection` (77:125) — verbo: exibir os comentários do vídeo com as respostas pré-carregadas, dos mais recentes para os mais antigos | endpoint: primeira página de `GET /videos/{publicId}/comments` lida no RSC (upstream direto, sem rota BFF); `commentsCount` do detalhe para o "N comentários" | reuse: `components/comments/comments-section.tsx (new)`
- `CommentsLoadMore` (77:188) — verbo: carregar a próxima página de comentários-raiz | endpoint: `GET /api/videos/{publicId}/comments?offset&limit` (§API Contracts → BFF tier) | reuse: `components/comments/comments-load-more.tsx (new)`
- `NewCommentForm` (77:129) — verbo: publicar um novo comentário no vídeo; reusado com `parentId` como `ReplyForm` (OQ-12) | endpoint: `POST /api/videos/{publicId}/comments` (§API Contracts → BFF tier) | reuse: `components/comments/new-comment-form.tsx (new)`
- `RepliesLoadMore` (77:174) — verbo: carregar as respostas restantes de uma thread, além das pré-carregadas | endpoint: `GET /api/comments/{commentId}/replies?offset&limit` (§API Contracts → BFF tier) | reuse: `components/comments/replies-load-more.tsx (new)`
- `CommentLikeButton` (77:146, 77:185) — verbo: registrar ou retirar o like do usuário em um comentário ou resposta | endpoint: `PUT` / `DELETE /api/comments/{commentId}/reaction` (§API Contracts → BFF tier) | reuse: `components/comments/comment-like-button.tsx (new)`
- `CommentDislikeButton` (77:147, 77:186) — verbo: registrar ou retirar o dislike do usuário em um comentário ou resposta | endpoint: `PUT` / `DELETE /api/comments/{commentId}/reaction` (§API Contracts → BFF tier) | reuse: `components/comments/comment-dislike-button.tsx (new)`
- Herdados da Fase 05, sem verbo novo nesta fase: `VideoWatchPage` (77:64, `app/videos/[publicId]/page.tsx` — passa a ler o estado pessoal e os comentários), `VideoPlayer` (77:78), `VideoCard` (77:112–77:115), `SidebarLoadMore` (77:116)

**Behaviors:**

*Rendered states:*
- Loading: **sem desenho.** Página RSC renderiza já com os dados; "Carregar mais comentários" e "Ver mais N respostas" em carregamento seguem os padrões da Fase 04 (decisão da OQ-13), com o controle desabilitado durante a busca.
- Empty: **sem desenho.** Vídeo sem comentários mostra o heading "0 comentários", o compositor e um texto de lista vazia no lugar das threads — padrões de vazio da Fase 04 (OQ-13). Thread sem respostas (77:175) não renderiza `ReplyList`.
- Success: faixa do canal com `SubscriberCount` na terceira linha da identidade do canal, `SubscribeButton`, `LikeButton` "Gostei · N", `DislikeButton` "Não gostei" **sem número** _(per social-interactions/TD-03 — desenho, não lacuna: não "consertar" acrescentando contagem)_ e o download; seção de comentários com heading "N comentários · Mais recentes primeiro", compositor, até 10 threads com até 3 respostas cada, "Ver mais N respostas" onde `repliesCount > replies.length` e "Carregar mais comentários" enquanto houver raízes por carregar.
- Pending (otimista): comentário recém-enviado aparece **no topo** da lista em estado pendente — a ordenação "mais recentes primeiro" do TD-05 torna essa posição correta sem mecanismo extra; o estado pendente não tem desenho e segue os padrões da Fase 04 (OQ-13). `SubscribeButton` passa a "Inscrito" e o `SubscriberCount` acompanha no mesmo frame; o estado "Inscrito" também não tem desenho (OQ-13).
- Error: falha de mutação reverte o otimista e exibe o erro conforme o mapeamento abaixo. Falha ao carregar a primeira página de comentários **não** derruba a página — a seção mostra o estado de erro (padrões da Fase 04) e o player continua de pé, mesmo critério das sugestões na Fase 05.

*Interactions:*
- `LikeButton` click → alterna o like; com dislike ativo, troca para like (exclusão mútua, uma reação por usuário por vídeo) e a contagem "Gostei · N" muda no mesmo frame. `DislikeButton` click → simétrico, sem contagem.
- `SubscribeButton` click → alterna "Inscrever-se" ↔ "Inscrito"; `SubscriberCount` acompanha o valor otimista e reconcilia com o `subscribersCount` devolvido.
- `NewCommentForm` submit → item pendente no topo, textarea limpa, heading "N comentários" +1; no sucesso o item pendente é substituído pelo comentário devolvido pela API.
- `ReplyButton` click (na raiz ou numa resposta) → abre o compositor de resposta logo abaixo da thread: é o `NewCommentForm` com `parentId` da **raiz** — responder a uma resposta cria um **irmão** na mesma `ReplyList`, nunca um neto _(per social-interactions/TD-04)_. A resposta publicada entra no topo da `ReplyList` da thread.
- `RepliesLoadMore` ("Ver mais N respostas") click → busca as respostas a partir de `offset = replies.length` e **acrescenta** à `ReplyList`; some quando todas estão carregadas.
- `CommentsLoadMore` click → busca a página seguinte de raízes e **acrescenta** threads; some quando o carregado alcança o `total`.
- `CommentLikeButton` / `CommentDislikeButton` click → mesmo comportamento do par do vídeo, por comentário ou resposta.
- **Visitante anônimo**: clique em qualquer controle de ação acima — inclusive foco ou clique no compositor — navega para `/login?returnTo=/videos/{publicId}` em vez de chamar a API _(per social-interactions-anonymous-gate/TD-01 e TD-03; variante anônima sem desenho, derivada por argumento na OQ-15)_.
- `comments-sort` não tem interação: é rótulo estático.

**Error Catalog → UX mapping:**

| error (from §Error Catalog) | UX treatment |
|-----------------------------|--------------|
| `UNAUTHORIZED` | Sessão expirou e o refresh falhou: reverte o otimista e navega para `/login?returnTo=/videos/{publicId}` |
| `VALIDATION_ERROR` | No compositor, erro inline abaixo do campo — o espelho de validação no cliente evita o caso comum |
| `RATE_LIMIT_EXCEEDED` | Reverte o otimista e exibe mensagem curta perto do controle, sem bloquear a página. _TBD — implementer decides per screen_ o texto, seguindo os padrões de erro da Fase 04 |
| `VIDEO_NOT_FOUND` | Numa mutação: o vídeo deixou de estar disponível — reverte e exibe erro; na leitura inicial já é o `notFound()` da Fase 05 |
| `COMMENT_NOT_FOUND` | O comentário alvo sumiu (resposta, reação, "ver mais"): reverte e exibe erro na thread. _TBD — implementer decides per screen_ |
| `CHANNEL_NOT_FOUND` | No `SubscribeButton`: reverte e exibe erro. _TBD — implementer decides per screen_ |

**Client-side validation mirror:** _(source: §API Contracts → Validation Rules)_
- `body`: required; aparado nas pontas; mínimo 1, máximo 2000 caracteres — o botão "Comentar" fica desabilitado com o campo vazio ou só com espaços

**Accessibility notes:**
- `LikeButton`, `DislikeButton`, `CommentLikeButton`, `CommentDislikeButton` e `SubscribeButton` são `<button>` reais com `aria-pressed` refletindo o estado — o dislike, sem número, depende disso para comunicar o estado a leitor de tela.
- `SubscriberCount` é o elemento que anuncia a mudança de contagem (`aria-live="polite"`), como a observação da página de canal pede para o mesmo componente.
- O compositor precisa de rótulo acessível para a textarea (o texto do Figma é placeholder, não label).
- `RepliesLoadMore` e `CommentsLoadMore` anunciam carregamento e fim da lista — os estados sem desenho.

---

#### Screen: Área de canais seguidos

**Route:** `/channel/subscriptions` — rota nova, em `next-frontend/app/(studio)/`, junto das irmãs `/channel/videos` e `/channel/settings` (OQ-19)
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=75-62 (node `FetKyb1V02WS5D6VCatK6t:75:62`)
**Purpose:** "Área de canais seguidos com acesso rápido aos vídeos"

**Auth requirement:** Authenticated _(source: §Authorization Matrix — `GET /me/subscriptions` e `PUT`/`DELETE /channels/{nickname}/subscription` exigem Bearer)_

**Rendering strategy:** Server Component (RSC) para a página, que lê `GET /me/subscriptions` pelo `fetchFromUpstream` existente — o layout do grupo `(studio)` já garante a sessão e renderiza a navbar autenticada, como nas rotas irmãs. A lista e as linhas são Server Components; o `SubscriptionToggleButton` de cada linha é `"use client"` _(per social-interactions/TD-08)_, e cada linha envolve botão e contagem num `ChannelSubscriptionProvider` para que "N inscritos" acompanhe o toggle. Arquivos especiais de rota seguem as irmãs: `loading.tsx` e `error.tsx`.

**Reused DS components:**
- `components/layout/site-navbar.tsx` — SiteNavbar — variante **autenticada**; **alterada nesta fase** para receber o link "Canais seguidos" (75:74)
- `components/auth/brand-logo.tsx` — BrandLogo
- `components/icons/streamtube-icon.tsx` — StreamtubeIcon
- `components/layout/user-menu.tsx` — UserMenu
- `components/ui/avatar.tsx` — Avatar — avatar do usuário (77:62) e avatar de iniciais de cada linha (75:81, 75:89, 75:97)
- `components/channels/subscriber-count.tsx` (new) — SubscriberCount — see screen: Página de visualização do vídeo — interações sociais. A contagem "N inscritos" da `channel-meta` (75:85, 75:93, 75:101) usa o mesmo componente compartilhado, lendo o valor otimista do provider da linha

_Elementos puro-DOM sem arquivo próprio_: `page-heading` (75:76 — `<h1>` "Canais que você segue" + subtítulo "N canais", derivado do `total` da mesma resposta, sem leitura adicional), `main-dashed-container` (75:75), `top-decorative-strip` (75:63). O link `nav-link-canais-seguidos` (75:74) é um `<Link>` do Next.js **escrito inline** em `components/layout/site-navbar.tsx`, sem arquivo próprio — decisão registrada no inventário em 2026-10-03; renderiza só no chrome autenticado *(per social-interactions/TD-07)*.

**Server-connected components:**
- `channel-list` (75:79) — verbo: listar os canais que o usuário segue, com acesso rápido à página de cada um | endpoint: `GET /me/subscriptions` lido no RSC via `fetchFromUpstream` (upstream direto, sem rota BFF) | reuse: `components/channels/subscribed-channel-list.tsx (new)`
- `channel-row` (75:80, 75:88, 75:96) — verbo: exibir a contagem de inscritos de cada canal seguido | endpoint: item de `GET /me/subscriptions` (`subscribersCount`, `videosCount`) | reuse: `components/channels/subscribed-channel-card.tsx (new)`. O nome do canal (`channel-name` 75:84, 75:92, 75:100) é o `<Link>` para `/@{nickname}` — o "acesso rápido aos vídeos", a dois cliques _(per social-interactions/TD-07, Revisions de 2026-10-04)_
- `SubscriptionToggleButton` (75:86, 75:94, 75:102) — verbo: deixar de seguir um canal a partir da lista | endpoint: `DELETE /api/channels/{nickname}/subscription` e, para desfazer, `PUT` na mesma rota (§API Contracts → BFF tier) | reuse: `components/channels/subscription-button.tsx (new)`

**Behaviors:**

*Rendered states:*
- Loading: `loading.tsx` do segmento, padrão das rotas irmãs da Fase 04 (OQ-14).
- Empty: **sem desenho.** "Você ainda não segue nenhum canal" no lugar da lista, com o subtítulo "0 canais" — padrões de vazio da Fase 04 (OQ-14).
- Success: heading "Canais que você segue", subtítulo "N canais", uma linha por canal com avatar de iniciais, nome (link), "N inscritos · N vídeos" e o botão "Inscrito".
- Error: `error.tsx` do segmento, padrão das irmãs (OQ-14). Uma falha no toggle de uma linha fica na linha.

*Interactions:*
- `SubscriptionToggleButton` click → desinscreve com feedback otimista: o botão passa a "Inscrever-se" e a contagem da linha cai em 1. **A linha permanece na lista até a próxima visita**, o que permite desfazer com um segundo clique (`PUT`). _Premissa do build:_ o desenho não mostra o pós-clique; manter a linha é o que torna o engano reversível sem buscar o canal de novo.
- `channel-name` click → navegação client-side para `/@{nickname}`.

**Error Catalog → UX mapping:**

| error (from §Error Catalog) | UX treatment |
|-----------------------------|--------------|
| `UNAUTHORIZED` | Refresh falhou: reverte e navega para `/login?returnTo=/channel/subscriptions` |
| `RATE_LIMIT_EXCEEDED` | Reverte e exibe mensagem curta na linha. _TBD — implementer decides per screen_ |
| `CHANNEL_NOT_FOUND` | O canal deixou de existir: reverte e exibe erro na linha. _TBD — implementer decides per screen_ |
| `VALIDATION_ERROR` | Não alcançável pela tela — `offset`/`limit` não são digitados |

**Client-side validation mirror:** não se aplica — nenhuma entrada de usuário nesta tela.

**Accessibility notes:**
- `SubscriptionToggleButton` com `aria-pressed` e rótulo que muda com o estado; o `SubscriberCount` da linha anuncia a contagem.
- O link "Canais seguidos" da navbar marca a rota ativa com `aria-current="page"`.

---

#### Screen: Página pública do canal

**Route:** `/@{nickname}` — tela da Fase 04 estendida; o rewrite para `app/channels/[nickname]` continua como está
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=59-2 (node `FetKyb1V02WS5D6VCatK6t:59:2`)
**Purpose:** "Contagem de inscritos na página do canal"

**Auth requirement:** Mixed — specify manually per screen Observations hint.
_Derivação: a leitura é pública e o `SubscribeButton` renderiza para o anônimo **de propósito** — a frame está no estado anônimo por decisão (social-interactions-anonymous-gate/TD-01); a heurística do mais restritivo escolheria `Authenticated` por causa do `PUT`/`DELETE` da inscrição._

**Rendering strategy:** Server Component (RSC) para a página, que passa a ler `GET /channels/{nickname}` pelo helper de auth opcional para receber `viewerSubscribed` na primeira pintura _(per social-interactions-anonymous-gate/TD-02)_, e usa o `PublicSiteNavbar`. O `ChannelHeader` continua Server Component e passa a envolver a contagem e o botão num `ChannelSubscriptionProvider` (`"use client"`, _per social-interactions/TD-08_).

**Reused DS components:**
- `components/layout/site-navbar.tsx` — SiteNavbar — estado anônimo nesta frame ("Entrar"); com sessão, o mesmo chrome autenticado da watch page
- `components/auth/brand-logo.tsx` — BrandLogo
- `components/icons/streamtube-icon.tsx` — StreamtubeIcon
- `components/ui/button.tsx` — LoginButton "Entrar" (59:13), `<Link>` para `/login`
- `components/channels/channel-header.tsx` — ChannelHeader (59:16, 59:85, 59:86, 59:87, 79:82) — **estendido nesta fase**: recebe `subscribersCount`, `viewerSubscribed` e o estado de sessão, e hospeda o `SubscribeButton` alinhado à direita na altura do nome
- `components/ui/avatar.tsx` — Avatar "channel-avatar" (59:85)
- `components/ui/badge.tsx` — DurationBadge
- `components/ui/pagination.tsx` — Pagination
- `components/videos/video-card.tsx` — VideoCard (59:88)
- `components/channels/subscriber-count.tsx` (new) — SubscriberCount (59:86, dentro de ChannelMeta) — see screen: Página de visualização do vídeo — interações sociais. **Mesmo componente das duas telas**: a página de canal tem `SubscribeButton` (79:82) e portanto precisa do mesmo valor otimista (social-interactions/TD-08) que motivou o arquivo próprio na watch page. Recebe `subscribers_count` (TD-06) por props de `ChannelHeader`. _Amended 2026-10-04: linha criada per OQ-16 (/plan-resolve, PR #49)._

_Elementos puro-DOM sem arquivo próprio_: `ChannelMeta` (59:86) **mutado** para `@{nickname} · <SubscriberCount /> · {total} vídeos`; Heading (59:17), Divider (59:87), Thumbnail, VideoTitle, VideoMeta — herdados da Fase 04, inalterados.

**Server-connected components:**
- `SubscriberCount` (59:86) — verbo: exibir a contagem de inscritos do canal | endpoint: `subscribersCount` de `GET /channels/{nickname}` lido no RSC (upstream direto, sem rota BFF); não faz I/O próprio | reuse: `components/channels/subscriber-count.tsx (new)`
- `SubscribeButton` (79:82) — verbo: inscrever-se no canal e cancelar a inscrição | endpoint: `PUT` / `DELETE /api/channels/{nickname}/subscription` (§API Contracts → BFF tier); estado inicial de `viewerSubscribed` | reuse: `components/channels/subscribe-button.tsx (new)` — **o mesmo arquivo** da watch page (77:119): um componente para as duas telas
- Herdados da Fase 04, sem verbo novo nesta fase: `ChannelHeader`, `VideoCard`

**Behaviors:**

*Rendered states:*
- Loading / not-found / error: os arquivos especiais da Fase 04 (`loading.tsx`, `not-found.tsx`, `error.tsx`) continuam valendo; nenhum estado novo de página.
- Success: cabeçalho com nome, `@nickname · N inscritos · N vídeos` e o `SubscribeButton` "Inscrever-se" ou "Inscrito" conforme `viewerSubscribed`; grade de vídeos como na Fase 04.
- Pending (otimista): o botão alterna e a contagem acompanha no mesmo frame. Variante "Inscrito", hover, foco, desabilitado e o estado intermediário não têm desenho — padrões da Fase 04 (OQ-13).

*Interactions:*
- `SubscribeButton` click → alterna a inscrição; `SubscriberCount` acompanha o otimista e reconcilia com o `subscribersCount` devolvido.
- **Visitante anônimo**: `SubscribeButton` click → `/login?returnTo=/@{nickname}` _(per social-interactions-anonymous-gate/TD-01 e TD-03)_.

**Error Catalog → UX mapping:**

| error (from §Error Catalog) | UX treatment |
|-----------------------------|--------------|
| `UNAUTHORIZED` | Refresh falhou: reverte e navega para `/login?returnTo=/@{nickname}` |
| `RATE_LIMIT_EXCEEDED` | Reverte e exibe mensagem curta junto ao botão. _TBD — implementer decides per screen_ |
| `CHANNEL_NOT_FOUND` | Na leitura inicial é o `notFound()` da Fase 04; numa mutação, reverte e exibe erro. _TBD — implementer decides per screen_ |

**Client-side validation mirror:** não se aplica.

**Accessibility notes:**
- O nó 79:82 é FRAME com TEXT, sem semântica de botão no export: implementar `<button>` real, com `aria-pressed` ou texto alternado conforme o estado.
- A contagem extraída para o `SubscriberCount` é onde vive o anúncio da mudança para leitor de tela (`aria-live="polite"`), como a observação do inventário pede.

---

### UI ↔ API Traceability Matrix

| Verb | Component | Screen | Endpoint (from API Contracts) | TD ref |
|------|-----------|--------|-------------------------------|--------|
| Inscrever-se no canal do vídeo e cancelar a inscrição a partir da própria página de assistir | SubscribeButton (77:119) | /videos/{publicId} | `PUT` / `DELETE /api/channels/{nickname}/subscription` → forwards-to `PUT` / `DELETE /channels/{nickname}/subscription` | social-interactions/TD-06, social-interactions/TD-08, social-interactions/TD-09, social-interactions-anonymous-gate/TD-01, social-interactions-anonymous-gate/TD-03 |
| Registrar ou retirar o like do usuário no vídeo, exibindo a contagem resultante | LikeButton (77:121) | /videos/{publicId} | `PUT` / `DELETE /api/videos/{publicId}/reaction` → forwards-to `PUT` / `DELETE /videos/{publicId}/reaction` | social-interactions/TD-01, social-interactions/TD-02, social-interactions/TD-08, social-interactions/TD-09 |
| Registrar ou retirar o dislike do usuário no vídeo, sem exibir contagem | DislikeButton (77:123) | /videos/{publicId} | `PUT` / `DELETE /api/videos/{publicId}/reaction` → forwards-to `PUT` / `DELETE /videos/{publicId}/reaction` | social-interactions/TD-01, social-interactions/TD-03, social-interactions/TD-08, social-interactions/TD-09 |
| Exibir os comentários do vídeo com as respostas pré-carregadas, dos mais recentes para os mais antigos | CommentsSection (77:125) | /videos/{publicId} | RSC → `GET /videos/{publicId}/comments` (upstream direto, auth opcional; sem rota BFF) | social-interactions/TD-04, social-interactions/TD-05, social-interactions-anonymous-gate/TD-02 |
| Carregar a próxima página de comentários-raiz | CommentsLoadMore (77:188) | /videos/{publicId} | `GET /api/videos/{publicId}/comments?offset&limit` → forwards-to `GET /videos/{publicId}/comments` | social-interactions/TD-05, social-interactions-anonymous-gate/TD-02 |
| Publicar um novo comentário no vídeo | NewCommentForm (77:129) | /videos/{publicId} | `POST /api/videos/{publicId}/comments` → forwards-to `POST /videos/{publicId}/comments` | social-interactions/TD-02, social-interactions/TD-04, social-interactions/TD-08, social-interactions/TD-09, social-interactions-anonymous-gate/TD-01 |
| Carregar as respostas restantes de uma thread, além das pré-carregadas | RepliesLoadMore (77:174) | /videos/{publicId} | `GET /api/comments/{commentId}/replies?offset&limit` → forwards-to `GET /comments/{commentId}/replies` | social-interactions/TD-04, social-interactions/TD-05 |
| Registrar ou retirar o like do usuário em um comentário ou resposta | CommentLikeButton (77:146, 77:185) | /videos/{publicId} | `PUT` / `DELETE /api/comments/{commentId}/reaction` → forwards-to `PUT` / `DELETE /comments/{commentId}/reaction` | social-interactions/TD-01, social-interactions/TD-02, social-interactions/TD-08, social-interactions/TD-09 |
| Registrar ou retirar o dislike do usuário em um comentário ou resposta | CommentDislikeButton (77:147, 77:186) | /videos/{publicId} | `PUT` / `DELETE /api/comments/{commentId}/reaction` → forwards-to `PUT` / `DELETE /comments/{commentId}/reaction` | social-interactions/TD-01, social-interactions/TD-03, social-interactions/TD-08 |
| Listar os canais que o usuário segue, com acesso rápido à página de cada um | channel-list (75:79) | /channel/subscriptions | RSC → `GET /me/subscriptions` via `fetchFromUpstream` (upstream direto; sem rota BFF) | social-interactions/TD-07 |
| Exibir a contagem de inscritos de cada canal seguido | channel-row (75:80, 75:88, 75:96) | /channel/subscriptions | RSC → `GET /me/subscriptions` (`subscribersCount` por item) | social-interactions/TD-06, social-interactions/TD-07 |
| Deixar de seguir um canal a partir da lista | SubscriptionToggleButton (75:86, 75:94, 75:102) em channel-row | /channel/subscriptions | `DELETE /api/channels/{nickname}/subscription` (e `PUT` para desfazer) → forwards-to `DELETE` / `PUT /channels/{nickname}/subscription` | social-interactions/TD-06, social-interactions/TD-08, social-interactions/TD-09 |
| Exibir a contagem de inscritos do canal | SubscriberCount (59:86) | /@{nickname} | RSC → `GET /channels/{nickname}` (`subscribersCount`; upstream direto, auth opcional) | social-interactions/TD-06, social-interactions-anonymous-gate/TD-02 |
| Inscrever-se no canal e cancelar a inscrição | SubscribeButton (79:82) | /@{nickname} | `PUT` / `DELETE /api/channels/{nickname}/subscription` → forwards-to `PUT` / `DELETE /channels/{nickname}/subscription` | social-interactions/TD-06, social-interactions/TD-08, social-interactions/TD-09, social-interactions-anonymous-gate/TD-01, social-interactions-anonymous-gate/TD-03 |

_Capabilities marked in `## Non-UI / Deferred Capabilities` are excluded from this matrix._ Nesta fase a seção está `_None._`, então nenhuma linha foi excluída.

_Quatro linhas citam leitura do Server Component em vez de rota BFF, por decisão e não por lacuna: o strict-BFF governa o tráfego do navegador, e a primeira pintura com estado pessoal é justamente o que o anonymous-gate/TD-02 exige. Nenhuma rota BFF foi criada sem consumidor no browser._

---

## Dependency Map

```
Backend
SI-06.1 (root — entidades e migration)
├── SI-06.2 — depends on SI-06.1 (entidades de reação)
│   ├── SI-06.4 — depends on SI-06.2 (ReactionsService + likesDelta)
│   ├── SI-06.5 — depends on SI-06.2 + SI-06.3 (estado pessoal: reação e inscrição)
│   │   └── SI-06.12 — depends on SI-06.3 + SI-06.5 (VideosModule já importa SubscriptionsModule)
│   └── SI-06.7 — depends on SI-06.2 (findCommentReactions)
│       ├── SI-06.8 — depends on SI-06.7 (listThreads)
│       ├── SI-06.9 — depends on SI-06.7 (create + COMMENT_NOT_FOUND)
│       └── SI-06.10 — depends on SI-06.7 (listReplies)
│           └── SI-06.11 — depends on SI-06.10 (findAccessible)
└── SI-06.3 — depends on SI-06.1 (Subscription + subscribers_count)
    └── SI-06.6 — depends on SI-06.3 (isSubscribed)

SI-06.13 — depends on SI-06.3, SI-06.4, SI-06.5, SI-06.6, SI-06.8, SI-06.9, SI-06.10, SI-06.11, SI-06.12 (export do openapi.json com todas as rotas)
├── SI-06.16 — depends on SI-06.13 (BFF de reação)
├── SI-06.17 — depends on SI-06.13 + SI-06.14 (BFF de comentários, leituras com auth opcional)
└── SI-06.18 — depends on SI-06.13 (BFF de inscrição)
    └── SI-06.19 — depends on SI-06.0.1 + SI-06.13 + SI-06.15 + SI-06.18 (estado otimista compartilhado)

Frontend — independentes do backend
SI-06.0.1 (root — bootstrap: SubscriberCount + componentes de comentário)
SI-06.0.2 (root — bootstrap: ReplyList)
SI-06.0.3 (root — bootstrap: ReplyButton)
SI-06.14 (root — helper de auth opcional)
└── SI-06.20 — depends on SI-06.14 (PublicSiteNavbar + link "Canais seguidos")
SI-06.15 (root — returnTo pós-login)

Telas
SI-06.21.0 — depends on SI-06.0.1, SI-06.0.2, SI-06.0.3 (componentes em disco antes da auditoria)
└── SI-06.21a — depends on SI-06.21.0 + SI-06.0.1, SI-06.0.2, SI-06.0.3
    └── SI-06.21b — depends on SI-06.21a + SI-06.3, SI-06.4, SI-06.5, SI-06.8 + SI-06.13, SI-06.14, SI-06.16, SI-06.18, SI-06.19, SI-06.20
        └── SI-06.21c — depends on SI-06.21b + SI-06.9, SI-06.10, SI-06.11 + SI-06.16, SI-06.17
SI-06.22.0 — depends on SI-06.0.1 + SI-06.20 (SubscriberCount e link da navbar em disco)
└── SI-06.22a — depends on SI-06.22.0 + SI-06.0.1
    └── SI-06.22b — depends on SI-06.22a + SI-06.3, SI-06.12 + SI-06.13, SI-06.18, SI-06.19
SI-06.23.0 — depends on SI-06.0.1
└── SI-06.23a — depends on SI-06.23.0 + SI-06.0.1 + SI-06.21a (o SubscribeButton é o mesmo arquivo)
    └── SI-06.23b — depends on SI-06.23a + SI-06.3, SI-06.6 + SI-06.13, SI-06.14, SI-06.18, SI-06.19, SI-06.20
```

**Arestas cross-layer:** `SI-06.21b`, `SI-06.21c`, `SI-06.22b` e `SI-06.23b` (frontend) dependem dos endpoints de backend que consomem e, por eles, do `SI-06.13`, que só roda depois de todas as rotas existirem no backend — a cadeia `openapi.json` → `types.gen.ts` → `contracts.ts` é o único caminho pelo qual um tipo de backend chega ao frontend (per `next-frontend-openapi-typing/TD-04`).

---

## Deliverables

- [ ] SI-06.0.1 — Custom-business simple group: SubscriberCount + CommentItem + CommentList + CommentReply + CommentThread
- [ ] SI-06.0.2 — Custom-business simple group: ReplyList
- [ ] SI-06.0.3 — Custom-business complex: ReplyButton
- [ ] SI-06.1 — Criar entidades e migration das interações sociais
- [ ] SI-06.2 — Criar o ReactionsModule como produtor único das reações
- [ ] SI-06.3 — Endpoints de inscrição em canal
- [ ] SI-06.4 — Endpoints de reação em vídeo
- [ ] SI-06.5 — Estado social e pessoal no detalhe público do vídeo
- [ ] SI-06.6 — Contagem de inscritos e estado pessoal na leitura pública do canal
- [ ] SI-06.7 — Criar o CommentsModule e o núcleo do serviço de comentários
- [ ] SI-06.8 — Endpoint de listagem de comentários do vídeo
- [ ] SI-06.9 — Endpoint de publicação de comentário e resposta
- [ ] SI-06.10 — Endpoint de respostas restantes de uma thread
- [ ] SI-06.11 — Endpoints de reação em comentário
- [ ] SI-06.12 — Endpoint da área de canais seguidos
- [ ] SI-06.13 — Infra: sincronizar o contrato OpenAPI com o frontend
- [ ] SI-06.14 — Helper de leitura com autenticação opcional
- [ ] SI-06.15 — Retorno ao ponto de interação depois do login
- [ ] SI-06.16 — Route Handlers BFF de reação (vídeo e comentário)
- [ ] SI-06.17 — Route Handlers BFF de comentários
- [ ] SI-06.18 — Route Handlers BFF de inscrição
- [ ] SI-06.19 — Estado otimista compartilhado de reação e de inscrição
- [ ] SI-06.20 — Chrome sensível à sessão e ponto de entrada dos canais seguidos
- [ ] SI-06.21.0 — Drift audit: Página de visualização do vídeo — interações sociais
- [ ] SI-06.21a — Tela de visualização do vídeo — interações sociais (visual shell)
- [ ] SI-06.21b — Tela de visualização do vídeo — interações sociais (lógica & wiring)
- [ ] SI-06.21c — Tela de visualização do vídeo — comentários (lógica & wiring)
- [ ] SI-06.22.0 — Drift audit: Área de canais seguidos
- [ ] SI-06.22a — Tela de área de canais seguidos (visual shell)
- [ ] SI-06.22b — Tela de área de canais seguidos (lógica & wiring)
- [ ] SI-06.23.0 — Drift audit: Página pública do canal
- [ ] SI-06.23a — Tela pública do canal com inscrição (visual shell)
- [ ] SI-06.23b — Tela pública do canal com inscrição (lógica & wiring)

**Per-screen deliverables** _(when ui_in_scope: true)_:

- [ ] Screen Página de visualização do vídeo — interações sociais (/videos/{publicId}) is routable
- [ ] Screen Página de visualização do vídeo — interações sociais (/videos/{publicId}) renders loading, success, and error states
- [ ] Screen Página de visualização do vídeo — interações sociais (/videos/{publicId}) passes component tests (per testing-guide-next-frontend layers)
- [ ] Screen Área de canais seguidos (/channel/subscriptions) is routable
- [ ] Screen Área de canais seguidos (/channel/subscriptions) renders loading, success, and error states
- [ ] Screen Área de canais seguidos (/channel/subscriptions) passes component tests (per testing-guide-next-frontend layers)
- [ ] Screen Página pública do canal (/@{nickname}) is routable
- [ ] Screen Página pública do canal (/@{nickname}) renders loading, success, and error states
- [ ] Screen Página pública do canal (/@{nickname}) passes component tests (per testing-guide-next-frontend layers)

**Full test suites:**

Rodar **uma suíte por vez** — nunca backend e frontend em paralelo.

- [ ] Backend tests pass (`cd nestjs-project && docker compose exec nestjs-api npm test -- --runInBand`)
- [ ] E2E tests pass (`cd nestjs-project && docker compose exec nestjs-api npm run test:e2e`)
- [ ] Type/compilation checks pass (`cd nestjs-project && docker compose exec nestjs-api npx tsc --noEmit`)
- [ ] Lint passes (`cd nestjs-project && docker compose exec nestjs-api npm run lint`)
- [ ] Frontend tests pass (`cd next-frontend && docker compose exec next-frontend npm test`)
- [ ] Type/compilation checks pass (`cd next-frontend && docker compose exec next-frontend npx tsc --noEmit`)
- [ ] Lint passes (`cd next-frontend && docker compose exec next-frontend npm run lint`)
- [ ] Frontend E2E tests pass (`cd next-frontend && npx playwright test`, no host, com o dev server do container rodando com `MSW_ENABLED=true` — ver `next-frontend/CLAUDE.md` → "E2E test prerequisites")
- [ ] OpenAPI contract is fresh (`scripts/sync-openapi.sh` + `docker compose exec next-frontend npm run openapi:types` sem diff)
