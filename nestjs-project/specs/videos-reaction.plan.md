---
subproject: backend
runner: jest+supertest
scope: phase-06-social-interactions
si: SI-06.4
target_file: test/videos-reaction.e2e-spec.ts
---

# PUT / DELETE /videos/{publicId}/reaction — Test Plan

## Application Overview

Par de rotas novo da Fase 06: registrar, trocar e retirar o like ou dislike do usuário num vídeo. Uma reação por usuário por vídeo — PK composta em `video_reactions` (`social-interactions/TD-01`) — torna like e dislike mutuamente exclusivos por construção. `videos.likes_count`, que estava em zero desde a Fase 04, passa a ser mantido **na mesma transação** pela tabela de delta (`social-interactions/TD-02`): nenhuma → like `+1`, like → dislike `−1`, dislike → like `+1`, qualquer → a mesma `0`.

**Não existe contagem de dislikes** em nenhuma resposta (`social-interactions/TD-03` — só o estado do próprio usuário). As rotas exigem Bearer, são guardadas por `assertServable` (rascunho de terceiro devolve `404` indistinguível de inexistente) e têm o orçamento de **60/60 s por IP** do `social-interactions/TD-09`.

**Nota de cobertura.** O "erro dentro da transação não desvia o contador" é coberto pela linha de Integration do SI (`src/videos/videos.service.integration-spec.ts`).

## Test Scenarios

### 1. Ciclo de reação

**Setup:** `beforeAll` sobe o `AppModule` com os pipes e filtros globais do `main.ts`; `beforeEach` limpa `video_reactions`, `videos`, `channels` e `users` com `dataSource.query('DELETE FROM …')`; cria o dono e um segundo usuário (o espectador), cada um com seu canal; grava no canal do dono um vídeo `ready` publicado e `public` com `likes_count` em `0` e um `ready` em rascunho; emite um Bearer válido para o espectador.

#### 1.1. like-soma-um

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `PUT /videos/{publicId}/reaction` do vídeo publicado, com o Bearer do espectador e corpo `{ "type": "like" }`
    - expect: status `200`
    - expect: corpo `{ viewerReaction: "like", likesCount: 1 }`
  2. Consultar `videos.likes_count` no banco
    - expect: `1`

#### 1.2. trocar-para-dislike-devolve-o-like

**Covers AC:** #2, #6
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `PUT /videos/{publicId}/reaction` com `{ "type": "like" }`
    - expect: `likesCount` é `1`
  2. `PUT /videos/{publicId}/reaction` com `{ "type": "dislike" }`
    - expect: status `200`
    - expect: corpo `{ viewerReaction: "dislike", likesCount: 0 }`
    - expect: o corpo não tem nenhuma chave de contagem de dislikes
  3. Consultar `video_reactions` no banco
    - expect: uma única linha para o par (espectador, vídeo), com `type = dislike`

#### 1.3. retirar-e-idempotente

**Covers AC:** #3, #6
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `PUT /videos/{publicId}/reaction` com `{ "type": "like" }`
    - expect: `likesCount` é `1`
  2. `DELETE /videos/{publicId}/reaction` com o mesmo Bearer
    - expect: status `200`
    - expect: corpo `{ viewerReaction: null, likesCount: 0 }`
  3. Repetir o `DELETE`
    - expect: status `200`
    - expect: `likesCount` continua `0`
    - expect: nenhuma das respostas tem chave de contagem de dislikes

#### 1.4. tipo-invalido-e-sem-token

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `PUT /videos/{publicId}/reaction` com o Bearer do espectador e corpo `{ "type": "love" }`
    - expect: status `400`
    - expect: `error` é `VALIDATION_ERROR`
  2. `PUT /videos/{publicId}/reaction` com corpo `{}`
    - expect: status `400`
  3. `PUT /videos/{publicId}/reaction` sem `Authorization`, com `{ "type": "like" }`
    - expect: status `401`
  4. Consultar `videos.likes_count`
    - expect: continua `0`

#### 1.5. rascunho-de-terceiro-nao-revela

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `PUT /videos/{publicId}/reaction` do rascunho do dono, com o Bearer do espectador e `{ "type": "like" }`
    - expect: status `404`
    - expect: `error` é `VIDEO_NOT_FOUND`
  2. A mesma chamada para um `publicId` inexistente
    - expect: status `404`
    - expect: corpo byte-idêntico ao do passo 1
  3. Consultar `video_reactions`
    - expect: nenhuma linha criada
