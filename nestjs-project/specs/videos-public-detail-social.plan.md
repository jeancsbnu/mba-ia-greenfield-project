---
subproject: backend
runner: jest+supertest
scope: phase-06-social-interactions
si: SI-06.5
target_file: test/videos-public-detail-social.e2e-spec.ts
---

# GET /videos/{publicId}/public — estado social e pessoal — Test Plan

## Application Overview

Rota da Fase 05 (`videos-public-detail.plan.md` cobre o contrato original) que a Fase 06 **estende** com cinco campos: `likesCount`, `commentsCount`, `viewerReaction`, `channel.subscribersCount` e `channel.viewerSubscribed`. O estado pessoal chega **na mesma resposta** dos dados públicos (`social-interactions-anonymous-gate/TD-02` — endpoint público com auth opcional, payload único), para que a watch page pinte like, dislike e inscrição corretos já na primeira pintura.

A rota continua `@Public()`. O guard global faz autenticação opcional: com Bearer válido identifica o visitante; com Bearer ausente **ou inválido** segue anônimo — nunca `401`. Para o anônimo, `viewerReaction` é `null` e `viewerSubscribed` é `false`. Não há contagem de dislikes (`social-interactions/TD-03`).

Esta spec cobre só o acréscimo; o contrato da Fase 05 segue coberto por `test/videos-public-detail.e2e-spec.ts`.

## Test Scenarios

### 1. Campos sociais e estado pessoal

**Setup:** `beforeAll` sobe o `AppModule` com os pipes e filtros globais do `main.ts`; `beforeEach` limpa `video_reactions`, `subscriptions`, `comments`, `videos`, `channels` e `users` com `dataSource.query('DELETE FROM …')`; cria o dono do canal e um espectador; grava um vídeo `ready` publicado e `public` com `likes_count = 5` e `comments_count = 3`, `channels.subscribers_count = 2` para o canal do dono, uma linha em `video_reactions` (espectador, vídeo, `like`) e uma em `subscriptions` (espectador, canal do dono); emite um Bearer válido para o espectador.

#### 1.1. anonimo-recebe-estado-neutro

**Covers AC:** #1, #4
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `GET /videos/{publicId}/public` sem `Authorization`
    - expect: status `200`
    - expect: `likesCount` é `5` e `commentsCount` é `3`
    - expect: `viewerReaction` é `null`
    - expect: `channel.subscribersCount` é `2` e `channel.viewerSubscribed` é `false`
    - expect: o corpo não tem nenhuma chave de contagem de dislikes

#### 1.2. espectador-recebe-o-proprio-estado

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `GET /videos/{publicId}/public` com o Bearer do espectador
    - expect: status `200`
    - expect: `viewerReaction` é `"like"`
    - expect: `channel.viewerSubscribed` é `true`
  2. `GET /videos/{publicId}/public` com o Bearer do dono (que não reagiu nem segue o próprio canal)
    - expect: `viewerReaction` é `null` e `channel.viewerSubscribed` é `false`

#### 1.3. token-invalido-segue-anonimo

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `GET /videos/{publicId}/public` com `Authorization: Bearer token-invalido`
    - expect: status `200` — nunca `401`
    - expect: `viewerReaction` é `null` e `channel.viewerSubscribed` é `false`

#### 1.4. contrato-da-fase-05-preservado

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `GET /videos/{publicId}/public` sem `Authorization`
    - expect: `publicId`, `title`, `viewsCount`, `streamUrl`, `downloadUrl`, `thumbnailUrl`, `channel.nickname` e `channel.name` continuam presentes
    - expect: o corpo não contém `upload_id`, `processing_error` nem `storage_key`
