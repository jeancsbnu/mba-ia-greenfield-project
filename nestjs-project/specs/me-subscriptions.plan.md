---
subproject: backend
runner: jest+supertest
scope: phase-06-social-interactions
si: SI-06.12
target_file: test/me-subscriptions.e2e-spec.ts
---

# GET /me/subscriptions — Test Plan

## Application Overview

Rota nova da Fase 06: a leitura da área de canais seguidos. É uma **lista de canais** com link para a página pública de cada um, não um feed de vídeos (`social-interactions/TD-07`, Option A, e Revisions de 2026-10-04). Cada item traz `name`, `nickname`, `subscribersCount` e `videosCount`, este contando só vídeos publicados e públicos, mesma regra de `GET /channels/{nickname}`. Ordem: inscrição mais recente primeiro. Paginação offset/limit com `limit` default 50, máximo 100 (premissa do build em §API Contracts → Validation Rules). Exige Bearer; o recurso é sempre o do próprio usuário.

**Nota de cobertura.** "Uma query para N canais" na contagem de vídeos não é observável por HTTP; fica com a linha de Integration do SI (`src/videos/videos.service.integration-spec.ts`).

## Test Scenarios

### 1. Lista do próprio usuário

**Setup:** `beforeAll` sobe o `AppModule` com os pipes e filtros globais do `main.ts`; `beforeEach` limpa `subscriptions`, `videos`, `channels` e `users` com `dataSource.query('DELETE FROM …')`; cria três canais — `maria_rocha` com 2 vídeos publicados e públicos, 1 `unlisted` e 1 rascunho; `diego_farias` sem vídeos; `ana_costa` com 1 vídeo publicado e público —, um seguidor inscrito nos três em instantes distintos (`ana_costa` por último), um usuário sem inscrições e um terceiro usuário inscrito só em `diego_farias`; emite Bearer válido para os três usuários.

#### 1.1. tres-canais-mais-recente-primeiro

**Covers AC:** #1, #2
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `GET /me/subscriptions` com o Bearer do seguidor
    - expect: status `200`
    - expect: `items` tem 3 canais, na ordem `ana_costa`, `diego_farias`, `maria_rocha`
    - expect: `total` é `3`
    - expect: cada item tem `name`, `nickname`, `subscribersCount` e `videosCount`
    - expect: `videosCount` é `2` para `maria_rocha`, `0` para `diego_farias` e `1` para `ana_costa` — `unlisted` e rascunho não contam
    - expect: `subscribersCount` de `diego_farias` é `2`

#### 1.2. usuario-sem-inscricoes

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `GET /me/subscriptions` com o Bearer do usuário sem inscrições
    - expect: status `200`
    - expect: `items` é `[]` e `total` é `0`

#### 1.3. isolamento-e-sem-token

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `GET /me/subscriptions` com o Bearer do terceiro usuário
    - expect: `items` tem só `diego_farias` e `total` é `1` — os canais do seguidor não aparecem
  2. `GET /me/subscriptions` sem `Authorization`
    - expect: status `401`

#### 1.4. limite-acima-do-maximo

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `GET /me/subscriptions?limit=101` com o Bearer do seguidor
    - expect: status `400` com `error: "VALIDATION_ERROR"`
  2. `GET /me/subscriptions?limit=100`
    - expect: status `200`
