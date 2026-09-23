---
subproject: backend
runner: jest+supertest
scope: phase-04-video-channel-management
si: SI-04.4
target_file: test/me-videos.e2e-spec.ts
---

# GET /me/videos (painel do canal) — Test Plan

## Application Overview

O endpoint alimenta o painel de gerenciamento: lista, com paginação offset/limit e total (video-channel-management/TD-06), todos os vídeos do canal do usuário autenticado — rascunhos incluídos — com thumbnail já resolvida, `status`, `visibility`, `publishedAt` e os três contadores. Resolve o canal pelo usuário do token, então nunca expõe vídeos de outro canal. Sem parâmetros valem `offset` 0 e `limit` 10; `limit` vai de 1 a 50.

## Test Scenarios

### 1. Listar os vídeos do canal do usuário

**Setup:** `beforeAll` sobe o `AppModule` com os pipes e filtros globais do `main.ts`, como em `test/videos-stream.e2e-spec.ts`; `beforeEach` limpa `videos`, `channels` e `users` com `dataSource.query('DELETE FROM …')`; cria dois usuários (registro → confirmação → login) com um canal cada; grava, para o primeiro canal, 12 vídeos com `created_at` distintos (mistura de rascunhos e publicados) e, para o segundo canal, 2 vídeos.

#### 1.1. lista-com-envelope-completo

**Covers AC:** #1, #2
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `GET /me/videos` com o token do primeiro usuário
    - expect: status `200`
    - expect: o corpo traz `items`, `total` 12, `offset` 0 e `limit` 10
    - expect: cada item traz `publicId`, `title`, `durationSeconds`, `thumbnailUrl`, `status`, `visibility`, `publishedAt`, `viewsCount`, `likesCount` e `commentsCount`
    - expect: os itens incluem rascunhos (`publishedAt` `null`) e publicados
    - expect: nenhum `publicId` dos 2 vídeos do segundo canal aparece

#### 1.2. pagina-com-offset-e-limit

**Covers AC:** #3, #4
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `GET /me/videos?offset=10&limit=10`
    - expect: status `200`
    - expect: `items` tem 2 itens e `total` continua 12
  2. `GET /me/videos?offset=0&limit=5`
    - expect: `items` tem 5 itens, `offset` 0 e `limit` 5
  3. Compara a ordem dos itens da etapa 2 com `created_at`
    - expect: o vídeo criado por último vem primeiro (`created_at` decrescente)

#### 1.3. rejeita-parametros-fora-da-faixa

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `GET /me/videos?limit=51`
    - expect: status `400`
  2. `GET /me/videos?offset=-1`
    - expect: status `400`

#### 1.4. exige-autenticacao

**Covers AC:** #6
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `GET /me/videos` sem `Authorization`
    - expect: status `401`
