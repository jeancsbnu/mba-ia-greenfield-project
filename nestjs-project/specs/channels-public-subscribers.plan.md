---
subproject: backend
runner: jest+supertest
scope: phase-06-social-interactions
si: SI-06.6
target_file: test/channels-public-subscribers.e2e-spec.ts
---

# GET /channels/{nickname} — contagem de inscritos e estado pessoal — Test Plan

## Application Overview

Rota da Fase 04 (`channels-public.plan.md` cobre o contrato original) que a Fase 06 estende com `subscribersCount` — a capability "Contagem de inscritos na página do canal" — e `viewerSubscribed`. A contagem vem de `channels.subscribers_count`, desnormalizado e mantido na mesma transação da inscrição (`social-interactions/TD-06`). O estado pessoal chega na mesma resposta (`social-interactions-anonymous-gate/TD-02`): a rota passa a aceitar Bearer opcional; sem ele, `viewerSubscribed` é `false`.

## Test Scenarios

### 1. Contagem e estado pessoal

**Setup:** `beforeAll` sobe o `AppModule` com os pipes e filtros globais do `main.ts`; `beforeEach` limpa `subscriptions`, `videos`, `channels` e `users` com `dataSource.query('DELETE FROM …')`; cria o dono do canal `joana_cria` com 2 vídeos publicados e públicos, um seguidor inscrito em `joana_cria` (linha em `subscriptions` e `subscribers_count = 1`) e um terceiro usuário não inscrito; emite Bearer válido para o seguidor e para o terceiro.

#### 1.1. anonimo-ve-a-contagem

**Covers AC:** #1, #4
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `GET /channels/joana_cria` sem `Authorization`
    - expect: status `200`
    - expect: `subscribersCount` é `1` e `viewerSubscribed` é `false`
    - expect: `name`, `nickname`, `description` e `videosCount` (`2`) continuam presentes

#### 1.2. estado-pessoal-por-visitante

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `GET /channels/joana_cria` com o Bearer do seguidor
    - expect: `viewerSubscribed` é `true`
  2. `GET /channels/joana_cria` com o Bearer do terceiro usuário
    - expect: `viewerSubscribed` é `false`
    - expect: `subscribersCount` é o mesmo `1` nas duas respostas

#### 1.3. leitura-reflete-nova-inscricao

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `PUT /channels/joana_cria/subscription` com o Bearer do terceiro usuário
    - expect: status `200`
  2. `GET /channels/joana_cria` com o mesmo Bearer
    - expect: `subscribersCount` é `2`
    - expect: `viewerSubscribed` é `true`
