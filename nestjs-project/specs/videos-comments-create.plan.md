---
subproject: backend
runner: jest+supertest
scope: phase-06-social-interactions
si: SI-06.9
target_file: test/videos-comments-create.e2e-spec.ts
---

# POST /videos/{publicId}/comments — Test Plan

## Application Overview

Rota nova da Fase 06: publica um comentário-raiz ou uma resposta pela mesma rota — o `ReplyForm` é o `NewCommentForm` reusado com `parentId` (OQ-12). Profundidade 1 (`social-interactions/TD-04`): um `parentId` que aponta para uma **resposta** grava o filho na **raiz** dela. `videos.comments_count` soma 1 por comentário publicado, raiz ou resposta, na mesma transação (`social-interactions/TD-02`).

O corpo é aparado nas pontas e precisa ter de 1 a 2000 caracteres (premissa do build registrada em §API Contracts → Validation Rules). Exige Bearer; orçamento de **5 por 60 s por IP** (`social-interactions/TD-09` — orçamento de comentário e resposta).

## Test Scenarios

### 1. Publicação

**Setup:** `beforeAll` sobe o `AppModule` com os pipes e filtros globais do `main.ts`; `beforeEach` limpa `comments`, `videos`, `channels` e `users` com `dataSource.query('DELETE FROM …')`; cria o dono e um comentarista com canal `maria_rocha` (nome "Maria Rocha"); grava dois vídeos publicados (A e B), com uma raiz e uma resposta já existentes em A e uma raiz em B; emite Bearer válido para o comentarista.

#### 1.1. comentario-raiz-criado

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `GET /videos/{A}/public` sem `Authorization`
    - expect: anotar `commentsCount`
  2. `POST /videos/{A}/comments` com o Bearer do comentarista e `{ "body": "Ótimo vídeo" }`
    - expect: status `201`
    - expect: `body` é `"Ótimo vídeo"`, `parentId` é `null`, `likesCount` é `0`, `viewerReaction` é `null`
    - expect: `author` é `{ name: "Maria Rocha", nickname: "maria_rocha" }`
  3. `GET /videos/{A}/public`
    - expect: `commentsCount` é o anotado + 1

#### 1.2. resposta-a-resposta-vira-irma

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `POST /videos/{A}/comments` com `{ "body": "Concordo", "parentId": "<id da resposta existente>" }`
    - expect: status `201`
    - expect: `parentId` é o `id` da **raiz** existente, não o da resposta
  2. `GET /videos/{A}/comments`
    - expect: a raiz lista a nova resposta em `replies`, e `repliesCount` é `2`

### 2. Validação e erros

**Setup:** o mesmo do grupo 1.

#### 2.1. corpo-vazio-ou-longo-demais

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `POST /videos/{A}/comments` com `{ "body": "   " }`
    - expect: status `400` com `error: "VALIDATION_ERROR"`
  2. `POST /videos/{A}/comments` com um `body` de 2001 caracteres
    - expect: status `400` com `error: "VALIDATION_ERROR"`
  3. `POST /videos/{A}/comments` com um `body` de exatamente 2000 caracteres
    - expect: status `201`

#### 2.2. pai-de-outro-video-e-sem-token

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `POST /videos/{A}/comments` com `{ "body": "Oi", "parentId": "<id da raiz do vídeo B>" }`
    - expect: status `404` com `error: "COMMENT_NOT_FOUND"`
  2. `POST /videos/{A}/comments` sem `Authorization`, com `{ "body": "Oi" }`
    - expect: status `401`
  3. `GET /videos/{A}/public`
    - expect: `commentsCount` não mudou com as duas chamadas

### 3. Orçamento de rate limit

**Setup:** o mesmo do grupo 1. O cenário roda isolado — `beforeEach` recria o módulo de teste para zerar o throttler em memória.

#### 3.1. limite-de-5-por-60s-independente-das-reacoes

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Emitir 5 `POST /videos/{A}/comments` válidos com o Bearer do comentarista, do mesmo IP, dentro de 60 s
    - expect: as 5 respostas são `201`
  2. Emitir o 6º na mesma janela
    - expect: status `429` com `error: "RATE_LIMIT_EXCEEDED"`
  3. Na mesma janela, `PUT /videos/{A}/reaction` com `{ "type": "like" }`
    - expect: status `200` — o orçamento de 60/60 s das reações é independente
