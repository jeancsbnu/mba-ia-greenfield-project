---
subproject: backend
runner: jest+supertest
scope: phase-05-video-watch-page
si: SI-05.2
target_file: test/videos-public-detail.e2e-spec.ts
---

# GET /videos/{publicId}/public — Test Plan

## Application Overview

Rota nova da Fase 05: a leitura pública do vídeo que alimenta a watch page. Existe porque `GET /videos/{publicId}` — criado na Fase 03 com o sumário "Get video status" — exige autenticação e posse (`assertOwnership`) e portanto não serve visitante anônimo. A rota nova é `@Public()` e guardada por `assertServable` (`video-channel-management/TD-02`, revisão de 2026-09-20): publicado `public` ou `unlisted` é servido a qualquer chamador com o `publicId`; rascunho só ao dono do canal. Um token válido, quando presente, identifica o dono; token ausente ou inválido segue anônimo, sem `401`.

A resposta carrega os metadados de exibição mais **duas URLs pré-assinadas de 6 h** — `streamUrl` e `downloadUrl` — entregues juntas por decisão explícita (`video-watch-page/TD-02`, Clarification de 2026-09-24): o atributo `download` do HTML é ignorado em cross-origin, e como a assinatura cobre os query params, forçar o salvamento exige uma segunda URL assinada com `response-content-disposition`. Nenhuma chamada extra em tempo de clique.

A projeção é pública: campos de operação do dono (`upload_id`, `processing_error`, `storage_key`) nunca aparecem.

## Test Scenarios

### 1. Acesso público conforme o estado de publicação

**Setup:** `beforeAll` sobe o `AppModule` com os pipes e filtros globais do `main.ts`, no mesmo molde de `test/videos-stream-visibility.e2e-spec.ts` (fixture de MinIO e bucket de `storageConfig`); `beforeEach` limpa `videos`, `channels` e `users` via `dataSource.query('DELETE FROM …')`; cria o dono e um segundo usuário (registro → confirmação → login), cada um com seu canal; grava, no canal do dono, um vídeo `ready` publicado e `public`, um `ready` publicado e `unlisted`, um `ready` em rascunho e um `processing` publicado, todos com `storage_bucket` e `storage_key` reais.

#### 1.1. video-publicado-sem-token

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-09-30T23:29:18Z

**Steps:**
  1. `GET /videos/{publicId}/public` do vídeo publicado e `public`, sem `Authorization`
    - expect: status `200`
    - expect: corpo contém `title`, `description`, `durationSeconds`, `category`, `publishedAt`
    - expect: `viewsCount` é um número
    - expect: `channel` traz o `nickname` do canal dono
    - expect: `streamUrl` e `downloadUrl` são URLs pré-assinadas do storage

#### 1.2. unlisted-publicado-e-servido-por-link-direto

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-09-30T23:29:18Z

**Steps:**
  1. `GET /videos/{publicId}/public` do vídeo publicado e `unlisted`, sem `Authorization`
    - expect: status `200`
    - expect: o corpo é da mesma forma do caso `public` — `unlisted` restringe listagem, não acesso direto

#### 1.3. rascunho-e-indistinguivel-de-inexistente

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-09-30T23:29:18Z

**Steps:**
  1. `GET /videos/{publicId}/public` do rascunho `ready`, sem `Authorization`
    - expect: status `404`
    - expect: `error` é `VIDEO_NOT_FOUND`
  2. `GET /videos/{publicId}/public` do mesmo rascunho, com `Authorization` do segundo usuário
    - expect: status `404`
    - expect: `error` é `VIDEO_NOT_FOUND`
  3. `GET /videos/{publicId}/public` de um `publicId` que não existe, sem `Authorization`
    - expect: status `404`
    - expect: corpo byte-idêntico ao do passo 1 — a existência do vídeo não é revelada
  4. `GET /videos/{publicId}/public` do rascunho, com `Authorization` do **dono**
    - expect: status `200`

### 2. Superfície da projeção pública

**Setup:** o mesmo do grupo 1.

#### 2.1. projecao-nao-vaza-campos-de-operacao

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-09-30T23:29:18Z

**Steps:**
  1. `GET /videos/{publicId}/public` do vídeo publicado, sem `Authorization`
    - expect: o corpo **não** contém a chave `upload_id`
    - expect: o corpo **não** contém a chave `processing_error`
    - expect: o corpo **não** contém a chave `storage_key`
    - expect: o corpo **não** contém a chave `storage_bucket`
  2. `GET /videos/{publicId}/public` do rascunho, com `Authorization` do dono
    - expect: a projeção é a mesma do passo 1 — ser dono não amplia a superfície desta rota

#### 2.2. rota-de-status-da-fase-03-permanece-dono-apenas

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-09-30T23:29:18Z

**Steps:**
  1. `GET /videos/{publicId}` (sem `/public`) do vídeo publicado, sem `Authorization`
    - expect: status `401` — a rota da Fase 03 continua protegida pelo guard global
  2. `GET /videos/{publicId}` do vídeo publicado, com `Authorization` do segundo usuário
    - expect: status `403`
  3. `GET /videos/{publicId}` do vídeo publicado, com `Authorization` do dono
    - expect: status `200`
    - expect: a resposta mantém a forma da Fase 03, inalterada por esta fase
