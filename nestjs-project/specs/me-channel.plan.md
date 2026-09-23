---
subproject: backend
runner: jest+supertest
scope: phase-04-video-channel-management
si: SI-04.5
target_file: test/me-channel.e2e-spec.ts
---

# GET e PATCH /me/channel (canal do dono) — Test Plan

## Application Overview

`GET /me/channel` devolve nome, nickname e descrição do canal do usuário autenticado. `PATCH /me/channel` edita esses três campos com nickname livre e único (video-channel-management/TD-07): o nickname segue a allowlist `[a-z0-9_]` de 1 a 50 caracteres (phase-02-auth/TD-10), o nome vai de 1 a 50 e a descrição é opcional (string vazia grava `null`). Um nickname já usado por outro canal devolve `409 NICKNAME_ALREADY_EXISTS`. As rotas `me` só endereçam o canal do próprio chamador.

## Test Scenarios

### 1. Ler e editar o canal do usuário autenticado

**Setup:** `beforeAll` sobe o `AppModule` com os pipes e filtros globais do `main.ts`, como em `test/videos-stream.e2e-spec.ts`; `beforeEach` limpa `channels` e `users` com `dataSource.query('DELETE FROM …')`; cria dois usuários (registro → confirmação → login) com um canal cada — o primeiro com nickname `joana_cria`, nome "Joana Cria" e descrição "Vídeos de culinária"; o segundo com nickname `outro_canal`.

#### 1.1. le-o-canal-do-usuario

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `GET /me/channel` com o token do primeiro usuário
    - expect: status `200`
    - expect: o corpo traz `name` "Joana Cria", `nickname` `joana_cria` e `description` "Vídeos de culinária"

#### 1.2. edita-nickname-nome-e-descricao

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `PATCH /me/channel` com JSON `{ "nickname": "joana_novo", "name": "Joana Nova", "description": "" }`
    - expect: status `200`
    - expect: o corpo traz `nickname` `joana_novo`, `name` "Joana Nova" e `description` `null`
  2. `GET /me/channel` em seguida
    - expect: os valores atualizados estão persistidos

#### 1.3. rejeita-nickname-de-outro-canal

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `PATCH /me/channel` com `nickname` `outro_canal`
    - expect: status `409`
    - expect: `error` é `NICKNAME_ALREADY_EXISTS`
  2. `GET /me/channel`
    - expect: o nickname continua `joana_cria`

#### 1.4. valida-corpo-da-edicao

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `PATCH /me/channel` com `nickname` "joana.cria"
    - expect: status `400`
  2. `PATCH /me/channel` com `name` vazio
    - expect: status `400`
  3. `PATCH /me/channel` com corpo `{}`
    - expect: status `400`

#### 1.5. exige-autenticacao

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `GET /me/channel` sem `Authorization`
    - expect: status `401`
  2. `PATCH /me/channel` sem `Authorization`
    - expect: status `401`
