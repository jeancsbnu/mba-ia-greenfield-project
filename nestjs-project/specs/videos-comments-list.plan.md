---
subproject: backend
runner: jest+supertest
scope: phase-06-social-interactions
si: SI-06.8
target_file: test/videos-comments-list.e2e-spec.ts
---

# GET /videos/{publicId}/comments — Test Plan

## Application Overview

Rota nova da Fase 06: a página de comentários-raiz de um vídeo, **mais recentes primeiro**, com até **3 respostas pré-carregadas** por raiz e o `repliesCount` da thread (`social-interactions/TD-05`, Option B — 10 raízes por página, offset/limit). Profundidade 1 (`social-interactions/TD-04`): respostas não têm respostas.

A rota é `@Public()` com auth opcional: com Bearer válido, cada comentário e resposta traz `viewerReaction` do visitante; sem ele, `null` (`social-interactions-anonymous-gate/TD-02`). Guardada por `assertServable`.

**Nota de cobertura.** O número constante de queries por página (sem N+1) não é observável por HTTP; é coberto pela linha de Integration do `SI-06.7` (`src/comments/comments.service.integration-spec.ts`).

## Test Scenarios

### 1. Paginação e ordenação

**Setup:** `beforeAll` sobe o `AppModule` com os pipes e filtros globais do `main.ts`; `beforeEach` limpa `comment_reactions`, `comments`, `videos`, `channels` e `users` com `dataSource.query('DELETE FROM …')`; cria o dono e um espectador com canais; grava um vídeo publicado com **12 raízes** de `created_at` distintos, a mais recente com **7 respostas**, e um segundo vídeo publicado sem comentários; grava em `comment_reactions` um `like` do espectador na raiz mais recente e um `dislike` numa resposta dela; grava também um rascunho do dono; emite Bearer válido para o espectador.

#### 1.1. primeira-pagina-mais-recentes-primeiro

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `GET /videos/{publicId}/comments` sem parâmetros e sem `Authorization`
    - expect: status `200`
    - expect: `items` tem 10 raízes, em `createdAt` decrescente
    - expect: `total` é `12`, `offset` é `0` e `limit` é `10`
    - expect: a primeira raiz tem 3 respostas em `replies`, as mais recentes, e `repliesCount` é `7`
    - expect: toda resposta tem `parentId` igual ao `id` da raiz, e toda raiz tem `parentId: null`

#### 1.2. segunda-pagina-sem-repeticao

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `GET /videos/{publicId}/comments?offset=10`
    - expect: status `200`
    - expect: `items` tem as 2 raízes restantes
    - expect: nenhum `id` coincide com os da primeira página

#### 1.3. video-sem-comentarios

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `GET /videos/{publicId}/comments` do vídeo sem comentários
    - expect: status `200`
    - expect: `items` é `[]` e `total` é `0`

### 2. Estado pessoal e validação

**Setup:** o mesmo do grupo 1.

#### 2.1. viewer-reaction-so-com-token

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `GET /videos/{publicId}/comments` com o Bearer do espectador
    - expect: a raiz mais recente tem `viewerReaction: "like"`
    - expect: a resposta marcada tem `viewerReaction: "dislike"`
    - expect: os demais comentários têm `viewerReaction: null`
  2. A mesma chamada sem `Authorization`
    - expect: todos os comentários e respostas têm `viewerReaction: null`

#### 2.2. limites-invalidos-e-rascunho

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `GET /videos/{publicId}/comments?limit=0`
    - expect: status `400` com `error: "VALIDATION_ERROR"`
  2. `GET /videos/{publicId}/comments?limit=51`
    - expect: status `400` com `error: "VALIDATION_ERROR"`
  3. `GET /videos/{publicId}/comments` do rascunho do dono, com o Bearer do espectador
    - expect: status `404` com `error: "VIDEO_NOT_FOUND"`
