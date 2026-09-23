---
subproject: backend
runner: jest+supertest
scope: phase-04-video-channel-management
si: SI-04.3
target_file: test/videos-update.e2e-spec.ts
---

# PATCH /videos/{publicId} (edição, thumbnail e publicação) — Test Plan

## Application Overview

O endpoint edita título, descrição, categoria e visibilidade, troca a thumbnail customizada e publica ou despublica o vídeo numa única chamada `multipart/form-data` (video-channel-management/TD-03, revisão de 2026-09-20). Só o dono acessa. Publicar (`published=true`) exige `status = ready` e é idempotente sobre `published_at`; despublicar (`published=false`) não tem restrição de status (video-channel-management/TD-02). A thumbnail aceita JPEG, PNG e WebP de até 2 MiB, é validada no servidor antes de persistir e só toca em `custom_thumbnail_key`, nunca em `thumbnail_key` (TD-04).

## Test Scenarios

### 1. Editar informações, thumbnail e publicação do vídeo

**Setup:** `beforeAll` sobe o `AppModule` com os pipes e filtros globais do `main.ts` (`ValidationPipe`, `DomainExceptionFilter`, `ValidationExceptionFilter`), como em `test/videos-stream.e2e-spec.ts`; `beforeEach` limpa `videos`, `channels` e `users` com `dataSource.query('DELETE FROM …')`; cria o dono e um segundo usuário (registro → confirmação → login, como em `test/videos-read.e2e-spec.ts`), cada um com seu canal; grava os vídeos de cada cenário pelo repositório (um `ready` em rascunho, um `processing` em rascunho, um publicado); as requisições usam `.attach('thumbnail', buffer, { filename, contentType })` e `.field(...)` do supertest; o storage é o MinIO do ambiente de teste.

#### 1.1. edita-campos-de-texto-categoria-e-visibilidade

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `PATCH /videos/{publicId}` do vídeo `ready` em rascunho, com os campos `title` "Novo título", `description` "Nova descrição", `category` `Educação` e `visibility` `unlisted`
    - expect: status `200`
    - expect: o corpo traz `title`, `description`, `category` `Educação` e `visibility` `unlisted` atualizados
    - expect: `publishedAt` continua `null`
  2. `GET /videos/{publicId}` em seguida
    - expect: os mesmos valores persistidos

#### 1.2. publica-video-ready-de-forma-idempotente

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `PATCH /videos/{publicId}` do vídeo `ready` em rascunho, com o campo `published` `true`
    - expect: status `200`
    - expect: `publishedAt` é uma data ISO
  2. Repete o `PATCH` com `published` `true`
    - expect: status `200`
    - expect: `publishedAt` é exatamente o mesmo valor da primeira chamada

#### 1.3. rejeita-publicar-video-nao-ready

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `PATCH /videos/{publicId}` do vídeo `processing` com o campo `published` `true`
    - expect: status `409`
    - expect: `error` é `VIDEO_NOT_PUBLISHABLE`
  2. `GET /videos/{publicId}` em seguida
    - expect: `publishedAt` continua `null`

#### 1.4. despublica-qualquer-status

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `PATCH /videos/{publicId}` do vídeo publicado com o campo `published` `false`
    - expect: status `200`
    - expect: `publishedAt` é `null`
  2. `PATCH /videos/{publicId}` do vídeo `processing` em rascunho com `published` `false`
    - expect: status `200`, sem erro de status

#### 1.5. troca-thumbnail-customizada

**Covers AC:** #5, #6
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `PATCH /videos/{publicId}` com a parte de arquivo `thumbnail` PNG pequeno (`image/png`, abaixo de 2 MiB)
    - expect: status `200`
    - expect: `thumbnailUrl` aponta para a imagem enviada
    - expect: no banco, `custom_thumbnail_key` está preenchida e `thumbnail_key` continua com o valor original
  2. `PATCH /videos/{publicId}` com uma parte `thumbnail` `text/plain`
    - expect: status `400`
  3. `PATCH /videos/{publicId}` com uma parte `thumbnail` PNG de 2 MiB + 1 byte
    - expect: status `413`
    - expect: `custom_thumbnail_key` continua com o valor da etapa 1

#### 1.6. valida-campos-de-texto

**Covers AC:** #7
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `PATCH /videos/{publicId}` com `category` "Inexistente"
    - expect: status `400`
  2. `PATCH /videos/{publicId}` com `title` vazio
    - expect: status `400`
    - expect: o título do vídeo continua o anterior

#### 1.7. erros-de-dono-e-inexistente

**Covers AC:** #8
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. `PATCH /videos/{publicId}` de um vídeo do canal do segundo usuário, com o token do primeiro
    - expect: status `403`
    - expect: `error` é `FORBIDDEN`
  2. `PATCH /videos/inexistente1` com o token do dono
    - expect: status `404`
    - expect: `error` é `VIDEO_NOT_FOUND`
