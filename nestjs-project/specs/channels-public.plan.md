---
subproject: backend
runner: jest+supertest
scope: phase-04-video-channel-management
si: SI-04.6
target_file: test/channels-public.e2e-spec.ts
---

# GET /channels/{nickname} e GET /channels/{nickname}/videos (canal público) — Test Plan

## Application Overview

As duas rotas são públicas (`@Public()`, sem token) e alimentam a página `/@{nickname}`. `GET /channels/{nickname}` devolve nome, nickname, descrição e `videosCount`; `GET /channels/{nickname}/videos` devolve a listagem paginada (offset/limit com total, `limit` padrão 8 — video-channel-management/TD-06, revisão de 2026-09-20). Ambas contam e listam só vídeos publicados e públicos (`published_at` não nulo e `visibility = public`): rascunhos e vídeos `unlisted` ("Indisponível") ficam de fora (video-channel-management/TD-02).

## Test Scenarios

### 1. Consultar o canal público e seus vídeos

**Setup:** `beforeAll` sobe o `AppModule` com os pipes e filtros globais do `main.ts`, como em `test/videos-stream.e2e-spec.ts`; `beforeEach` limpa `videos`, `channels` e `users` com `dataSource.query('DELETE FROM …')`; cria um usuário com canal `joana_cria` (nome "Joana Cria", descrição "Vídeos de culinária") e grava 10 vídeos publicados e públicos com `published_at` distintos, 2 publicados `unlisted` e 3 rascunhos; nenhuma requisição usa token.

#### 1.1. le-informacoes-publicas-do-canal

**Covers AC:** #1, #2
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `GET /channels/joana_cria` sem `Authorization`
    - expect: status `200`
    - expect: o corpo traz `name` "Joana Cria", `nickname` `joana_cria`, `description` "Vídeos de culinária" e `videosCount`
    - expect: `videosCount` é 10: os 2 vídeos `unlisted` e os 3 rascunhos não entram

#### 1.2. lista-videos-publicados-e-publicos-em-ordem

**Covers AC:** #2, #3, #4
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `GET /channels/joana_cria/videos` sem parâmetros
    - expect: status `200`
    - expect: o corpo traz `items`, `total` 10, `offset` 0 e `limit` 8
    - expect: `items` tem 8 itens, do `published_at` mais recente para o mais antigo
    - expect: cada item traz `publicId`, `title`, `durationSeconds`, `thumbnailUrl`, `viewsCount` e `publishedAt`
    - expect: nenhum item é rascunho nem `unlisted`
  2. `GET /channels/joana_cria/videos?offset=8&limit=8`
    - expect: `items` tem os 2 itens restantes e `total` continua 10

#### 1.3. nickname-inexistente

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `GET /channels/nao_existe`
    - expect: status `404`
    - expect: `error` é `CHANNEL_NOT_FOUND`
  2. `GET /channels/nao_existe/videos`
    - expect: status `404`
    - expect: `error` é `CHANNEL_NOT_FOUND`

#### 1.4. rejeita-paginacao-fora-da-faixa

**Covers AC:** #6
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `GET /channels/joana_cria/videos?limit=51`
    - expect: status `400`
  2. `GET /channels/joana_cria/videos?offset=-1`
    - expect: status `400`
