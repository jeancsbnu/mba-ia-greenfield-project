---
subproject: backend
runner: jest+supertest
scope: phase-04-video-channel-management
si: SI-04.7
target_file: test/videos-stream-visibility.e2e-spec.ts
---

# GET /videos/{publicId}/stream e /download (rascunho e visibilidade) — Test Plan

## Application Overview

As rotas `stream` e `download` da Fase 03 seguem `@Public()` e respondem `302` para uma URL pré-assinada. Na Fase 04 passam a respeitar o estado de publicação (video-channel-management/TD-02, revisão de 2026-09-20): rascunho (`published_at` nulo) só é assinado para o dono do canal; vídeo publicado, público ou `unlisted`, é assinado para qualquer chamador com o `publicId`. Um token, quando presente e válido, identifica o dono; token inválido é ignorado e a rota segue anônima, sem `401`. Rascunho pedido por quem não é o dono devolve `404 VIDEO_NOT_FOUND` (a existência não é revelada), avaliado antes do `409 VIDEO_NOT_READY`.

## Test Scenarios

### 1. Assinar stream e download conforme o estado de publicação

**Setup:** `beforeAll` sobe o `AppModule` com os pipes e filtros globais do `main.ts`, como em `test/videos-stream.e2e-spec.ts` (mesmo fixture de MinIO e bucket de `storageConfig`); `beforeEach` limpa `videos`, `channels` e `users` com `dataSource.query('DELETE FROM …')`; cria o dono e um segundo usuário (registro → confirmação → login), cada um com seu canal; grava, para o canal do dono, um vídeo `ready` publicado e `public`, um `ready` publicado e `unlisted`, um `ready` em rascunho e um `processing` publicado, todos com `storage_bucket` e `storage_key` reais.

#### 1.1. video-publicado-sem-token

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `GET /videos/{publicId}/stream` do vídeo publicado e `public`, sem `Authorization`
    - expect: status `302`
    - expect: `Location` é uma URL pré-assinada do storage
  2. `GET /videos/{publicId}/stream` do vídeo publicado e `unlisted`, sem `Authorization`
    - expect: status `302`

#### 1.2. rascunho-sem-token

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `GET /videos/{publicId}/stream` do rascunho `ready`, sem `Authorization`
    - expect: status `404`
    - expect: `error` é `VIDEO_NOT_FOUND`
  2. `GET /videos/{publicId}/download` do mesmo rascunho, sem `Authorization`
    - expect: status `404`
    - expect: `error` é `VIDEO_NOT_FOUND`

#### 1.3. rascunho-para-o-dono

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `GET /videos/{publicId}/stream` do rascunho `ready`, com o token do dono
    - expect: status `302`
    - expect: `Location` é uma URL pré-assinada do storage

#### 1.4. rascunho-para-outro-usuario

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `GET /videos/{publicId}/stream` do rascunho `ready`, com o token do segundo usuário
    - expect: status `404`
    - expect: `error` é `VIDEO_NOT_FOUND`

#### 1.5. token-invalido-em-video-publicado

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `GET /videos/{publicId}/stream` do vídeo publicado e `public`, com `Authorization: Bearer token-invalido`
    - expect: status `302`, nunca `401`

#### 1.6. video-publicado-nao-ready

**Covers AC:** #6
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `GET /videos/{publicId}/stream` do vídeo `processing` publicado, sem `Authorization`
    - expect: status `409`
    - expect: `error` é `VIDEO_NOT_READY`

#### 1.7. download-segue-as-mesmas-regras

**Covers AC:** #7
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `GET /videos/{publicId}/download` do vídeo publicado e `public`, sem `Authorization`
    - expect: status `302` com `Location` de URL pré-assinada e `response-content-disposition` de anexo
  2. `GET /videos/{publicId}/download` do rascunho `ready`, com o token de outro usuário
    - expect: status `404`
    - expect: `error` é `VIDEO_NOT_FOUND`
  3. `GET /videos/{publicId}/download` do rascunho `ready`, com o token do dono
    - expect: status `302`
