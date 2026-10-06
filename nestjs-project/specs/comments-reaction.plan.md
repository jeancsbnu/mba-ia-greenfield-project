---
subproject: backend
runner: jest+supertest
scope: phase-06-social-interactions
si: SI-06.11
target_file: test/comments-reaction.e2e-spec.ts
---

# PUT / DELETE /comments/{commentId}/reaction — Test Plan

## Application Overview

Par de rotas novo da Fase 06: like e dislike em comentários e respostas, com o mesmo contrato das reações em vídeo. Uma reação por usuário por comentário (PK composta em `comment_reactions`, `social-interactions/TD-01`); `comments.likes_count` mantido na mesma transação pela tabela de delta (`social-interactions/TD-02`); sem contagem de dislikes (`social-interactions/TD-03`). Exige Bearer; orçamento de **60/60 s por IP** (`social-interactions/TD-09`).

## Test Scenarios

### 1. Ciclo de reação no comentário

**Setup:** `beforeAll` sobe o `AppModule` com os pipes e filtros globais do `main.ts`; `beforeEach` limpa `comment_reactions`, `video_reactions`, `comments`, `videos`, `channels` e `users` com `dataSource.query('DELETE FROM …')`; cria o dono e um espectador; grava um vídeo publicado com `likes_count = 0`, uma raiz e uma resposta dela, ambas com `likes_count = 0`; emite Bearer válido para o espectador.

#### 1.1. like-no-comentario-soma-um

**Covers AC:** #1, #2
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `PUT /comments/{raiz}/reaction` com o Bearer do espectador e `{ "type": "like" }`
    - expect: status `200`
    - expect: corpo `{ viewerReaction: "like", likesCount: 1 }`
  2. `GET /videos/{publicId}/comments` com o mesmo Bearer
    - expect: a raiz aparece com `likesCount: 1` e `viewerReaction: "like"`
    - expect: a resposta dela continua com `likesCount: 0`

#### 1.2. retirar-e-idempotente

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `PUT /comments/{resposta}/reaction` com `{ "type": "like" }`
    - expect: `likesCount` é `1`
  2. `DELETE /comments/{resposta}/reaction`
    - expect: status `200` com `{ viewerReaction: null, likesCount: 0 }`
  3. Repetir o `DELETE`
    - expect: status `200` e `likesCount` continua `0`

#### 1.3. sem-token-e-inexistente

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `PUT /comments/{raiz}/reaction` sem `Authorization`, com `{ "type": "like" }`
    - expect: status `401`
  2. `PUT /comments/{uuid inexistente}/reaction` com o Bearer do espectador
    - expect: status `404` com `error: "COMMENT_NOT_FOUND"`

#### 1.4. reagir-a-comentario-nao-toca-o-video

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `PUT /comments/{raiz}/reaction` com `{ "type": "like" }`
    - expect: status `200`
  2. `GET /videos/{publicId}/public`
    - expect: `likesCount` do vídeo continua `0`
