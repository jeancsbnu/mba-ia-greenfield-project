---
subproject: backend
runner: jest+supertest
scope: phase-05-video-watch-page
si: SI-05.4
target_file: test/videos-suggestions.e2e-spec.ts
---

# GET /videos/{publicId}/suggestions — Test Plan

## Application Overview

Rota nova da Fase 05 que alimenta a sidebar da watch page. Por `video-watch-page/TD-04` (Option A), as sugestões são **determinísticas**: mesma `category` do vídeo de referência, ordenadas por `published_at` desc, **excluindo** o vídeo atual, rascunhos e `unlisted`. Determinismo foi o critério da escolha — permite testar a sidebar sem fixar semente e cachear a resposta.

A revisão de 2026-09-26 do mesmo TD fixou o recorte: **4 vídeos por página, com "ver mais" carregando as próximas**, via `offset`/`limit`, seguindo o padrão de paginação de `video-channel-management/TD-06`. A resposta traz `{ items, total }`; o `total` é o que permite ao controle de "ver mais" saber quando não há mais páginas.

A exclusão de `unlisted` é a materialização, nesta fase, da regra "acessível apenas via link direto, sem aparecer em listagens". Lista vazia é resultado legítimo e frequente, não caso de borda: a consulta exclui o próprio vídeo, então uma categoria com um único publicado devolve `[]`.

## Test Scenarios

### 1. Recorte, ordenação e exclusões

**Setup:** `beforeAll` sobe o `AppModule` com os pipes e filtros globais do `main.ts`; `beforeEach` limpa `videos`, `channels` e `users`; cria o dono e seu canal; grava, na categoria `EDUCACAO`, **seis** vídeos `ready` publicados e `public` com `published_at` escalonado (o mais novo primeiro), mais o vídeo de referência (também `EDUCACAO`, publicado), um `ready` publicado e `unlisted`, um `ready` em rascunho, e dois vídeos publicados em outra categoria.

#### 1.1. pagina-default-traz-4-itens-e-total

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-09-30T23:29:18Z

**Steps:**
  1. `GET /videos/{publicId}/suggestions` do vídeo de referência, sem parâmetros e sem `Authorization`
    - expect: status `200`
    - expect: `items` tem exatamente `4` elementos — o default de `limit`
    - expect: `total` é `6` — todas as sugestões elegíveis, não só a página
    - expect: cada item traz `publicId`, `title`, `thumbnailUrl`, `durationSeconds`, `viewsCount`, `publishedAt` e o canal

#### 1.2. exclui-referencia-rascunho-e-unlisted

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-09-30T23:29:18Z

**Steps:**
  1. `GET /videos/{publicId}/suggestions?limit=50` do vídeo de referência
    - expect: nenhum item tem o `publicId` do próprio vídeo de referência
    - expect: nenhum item corresponde ao vídeo em rascunho
    - expect: nenhum item corresponde ao vídeo `unlisted`
    - expect: nenhum item pertence à outra categoria
    - expect: `total` é `6`

#### 1.3. ordenacao-por-data-de-publicacao-desc

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-09-30T23:29:18Z

**Steps:**
  1. `GET /videos/{publicId}/suggestions?limit=6`
    - expect: os `publishedAt` dos itens vêm em ordem estritamente decrescente
    - expect: o primeiro item é o vídeo de `published_at` mais recente entre os elegíveis

### 2. Paginação

**Setup:** o mesmo do grupo 1.

#### 2.1. offset-devolve-a-proxima-pagina-sem-repetir

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-09-30T23:29:18Z

**Steps:**
  1. `GET /videos/{publicId}/suggestions` (página 1)
    - expect: `items` tem `4` elementos
  2. `GET /videos/{publicId}/suggestions?offset=4`
    - expect: status `200`
    - expect: `items` tem `2` elementos — o resto de `total: 6`
    - expect: nenhum `publicId` da página 2 aparece na página 1
  3. `GET /videos/{publicId}/suggestions?offset=6`
    - expect: `items` é `[]`
    - expect: `total` continua `6`

#### 2.2. categoria-sem-outros-publicados-devolve-lista-vazia

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-09-30T23:29:18Z

**Steps:**
  1. Gravar um vídeo publicado e `public` numa categoria onde ele é o único, e pedir suas sugestões
    - expect: status `200` — lista vazia não é erro
    - expect: `items` é `[]`
    - expect: `total` é `0`

#### 2.3. parametros-invalidos-sao-rejeitados

**Covers AC:** #6
**Source:** auto
**Last sync:** 2026-09-30T23:29:18Z

**Steps:**
  1. `GET /videos/{publicId}/suggestions?limit=0`
    - expect: status `400`
    - expect: `error` é `VALIDATION_ERROR`
  2. `GET /videos/{publicId}/suggestions?offset=-1`
    - expect: status `400`
    - expect: `error` é `VALIDATION_ERROR`
  3. `GET /videos/{publicId}/suggestions?limit=abc`
    - expect: status `400`
    - expect: `error` é `VALIDATION_ERROR`
