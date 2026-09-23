---
subproject: backend
runner: jest+supertest
scope: phase-04-video-channel-management
si: SI-04.2
target_file: test/videos-detail.e2e-spec.ts
---

# GET /videos/{publicId} (detalhe do dono estendido) — Test Plan

## Application Overview

O endpoint da Fase 03 que devolve o vídeo ao dono do canal ganha, na Fase 04, `category`, `visibility`, `publishedAt` e `thumbnailUrl`. Só o dono acessa (`Authenticated+Owner`). A `thumbnailUrl` é a URL única já resolvida pela API: a thumbnail customizada quando existe, senão a gerada pelo worker, senão `null` (video-channel-management/TD-04). Os campos anteriores (`publicId`, `title`, `description`, `status`, `durationSeconds`, `createdAt`) continuam iguais para não quebrar o polling de status da Fase 03.

## Test Scenarios

### 1. Detalhe do vídeo para o dono do canal

**Setup:** `beforeAll` sobe o `AppModule` com os mesmos pipes e filtros globais do `main.ts` (`ValidationPipe`, `DomainExceptionFilter`, `ValidationExceptionFilter`), como em `test/videos-stream.e2e-spec.ts`; `beforeEach` limpa `videos`, `channels` e `users` com `dataSource.query('DELETE FROM …')`; cria o dono (registro → confirmação de e-mail → login, como em `test/videos-read.e2e-spec.ts`) com o canal dele, e um segundo usuário com canal próprio; grava os vídeos de cada cenário direto pelo repositório.

#### 1.1. detalhe-do-dono-com-campos-novos

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `GET /videos/{publicId}` de um vídeo em rascunho do dono (`published_at` nulo, `category` `Outros`, `visibility` `public`), com `Authorization: Bearer <token do dono>`
    - expect: status `200`
    - expect: o corpo traz `publicId`, `title`, `description`, `status`, `durationSeconds`, `createdAt`
    - expect: o corpo traz também `category` `Outros`, `visibility` `public`, `publishedAt` `null` e `thumbnailUrl`
  2. `GET /videos/{publicId}` de um vídeo publicado do dono (`published_at` preenchido, `category` `Música`, `visibility` `unlisted`)
    - expect: status `200`
    - expect: `publishedAt` é uma data ISO, `category` é `Música` e `visibility` é `unlisted`

#### 1.2. thumbnail-url-customizada-ou-gerada

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Grava um vídeo do dono só com `thumbnail_key` (gerada pelo worker) e chama `GET /videos/{publicId}`
    - expect: status `200`
    - expect: `thumbnailUrl` é uma URL pré-assinada cujo caminho contém o valor de `thumbnail_key`
  2. Grava um vídeo do dono com `thumbnail_key` e `custom_thumbnail_key` e chama `GET /videos/{publicId}`
    - expect: status `200`
    - expect: `thumbnailUrl` é uma URL pré-assinada cujo caminho contém o valor de `custom_thumbnail_key`, não o de `thumbnail_key`

#### 1.3. thumbnail-url-nula-sem-thumbnail

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Grava um vídeo do dono com `thumbnail_key` e `custom_thumbnail_key` nulos e chama `GET /videos/{publicId}`
    - expect: status `200`
    - expect: `thumbnailUrl` é `null`

#### 1.4. erros-de-dono-e-inexistente

**Covers AC:** #4, #5
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `GET /videos/{publicId}` de um vídeo do canal do segundo usuário, com o token do primeiro
    - expect: status `403`
    - expect: `error` é `FORBIDDEN`
  2. `GET /videos/inexistente1` com o token do dono
    - expect: status `404`
    - expect: `error` é `VIDEO_NOT_FOUND`
