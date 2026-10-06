---
subproject: backend
runner: jest+supertest
scope: phase-06-social-interactions
si: SI-06.10
target_file: test/comments-replies.e2e-spec.ts
---

# GET /comments/{commentId}/replies — Test Plan

## Application Overview

Rota nova da Fase 06: as respostas de uma raiz além das 3 pré-carregadas — o "Ver mais N respostas" da watch page. Mesma ordenação (mais recentes primeiro) e mesma paginação offset/limit da listagem de raízes (`social-interactions/TD-05`); o cliente pede a partir de `offset = 3`. Pelo `social-interactions/TD-04` (profundidade 1), pedir as respostas de uma **resposta** devolve página vazia.

A rota é `@Public()` com auth opcional. Comentário cujo vídeo é rascunho de outro canal devolve `404 COMMENT_NOT_FOUND` — o caminho lateral não revela que o vídeo existe.

## Test Scenarios

### 1. Respostas restantes

**Setup:** `beforeAll` sobe o `AppModule` com os pipes e filtros globais do `main.ts`; `beforeEach` limpa `comments`, `videos`, `channels` e `users` com `dataSource.query('DELETE FROM …')`; cria o dono e um espectador; grava um vídeo publicado com uma raiz de **7 respostas** de `created_at` distintos, e um rascunho do dono com uma raiz; emite Bearer válido para o espectador.

#### 1.1. restantes-depois-das-pre-carregadas

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `GET /comments/{raiz}/replies?offset=3` sem `Authorization`
    - expect: status `200`
    - expect: `items` tem 4 respostas, em `createdAt` decrescente
    - expect: `total` é `7`
    - expect: nenhuma delas está entre as 3 que `GET /videos/{publicId}/comments` pré-carrega para essa raiz

#### 1.2. respostas-de-uma-resposta

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `GET /comments/{uma das respostas}/replies`
    - expect: status `200`
    - expect: `items` é `[]` e `total` é `0`

### 2. Erros

**Setup:** o mesmo do grupo 1.

#### 2.1. id-invalido-e-inexistente

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `GET /comments/nao-e-uuid/replies`
    - expect: status `400` com `error: "VALIDATION_ERROR"`
  2. `GET /comments/{uuid inexistente}/replies`
    - expect: status `404` com `error: "COMMENT_NOT_FOUND"`

#### 2.2. comentario-de-rascunho-alheio

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `GET /comments/{raiz do rascunho}/replies` com o Bearer do espectador
    - expect: status `404` com `error: "COMMENT_NOT_FOUND"` — não `VIDEO_NOT_FOUND`
  2. A mesma chamada com um uuid inexistente
    - expect: corpo byte-idêntico ao do passo 1
