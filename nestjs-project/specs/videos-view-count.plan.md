---
subproject: backend
runner: jest+supertest
scope: phase-05-video-watch-page
si: SI-05.3
target_file: test/videos-view-count.e2e-spec.ts
---

# POST /videos/{publicId}/view — Test Plan

## Application Overview

Rota nova da Fase 05 e **primeiro endpoint de escrita público** do projeto: o player a dispara quando acumula reprodução efetiva suficiente, e ela incrementa `views_count` (coluna que já existe desde a Fase 04, `video-channel-management/TD-05`). Sem corpo, responde `204`.

O mecanismo é o do `video-watch-page/TD-03` (Option B — endpoint dedicado disparado pelo player após o limiar, em vez de contar abertura de página). Sem deduplicação por visitante nesta fase, conforme a opção escolhida.

Por ser escrita pública, o `video-watch-page/TD-05` deu à rota um `@Throttle()` dedicado de **30 requisições por 60 s por IP**, sobrepondo o default global de 10/60 s que o `ThrottlerModule` de `src/auth/auth.module.ts` aplica via `APP_GUARD` — global independentemente do módulo declarante, conforme a revisão de `phase-02-auth/TD-08`. O orçamento é maior justamente para que navegação legítima não colida com o orçamento de login.

O acesso segue `assertServable`: rascunho de terceiro devolve `404 VIDEO_NOT_FOUND`, sem revelar a existência.

**Nota de cobertura.** A AC #5 do SI ("duas chamadas concorrentes incrementam o contador em 2, não em 1") **não** tem cenário aqui: concorrência real não é observável por uma sequência de chamadas `supertest`. Ela é coberta pela linha de Integration na Tests table do SI (`src/videos/videos.service.integration-spec.ts`), que exercita o `UPDATE … SET views_count = views_count + 1` sob duas transações simultâneas.

## Test Scenarios

### 1. Incremento da contagem

**Setup:** `beforeAll` sobe o `AppModule` com os pipes e filtros globais do `main.ts`; `beforeEach` limpa `videos`, `channels` e `users` via `dataSource.query('DELETE FROM …')`; cria o dono e um segundo usuário, cada um com seu canal; grava, no canal do dono, um vídeo `ready` publicado e `public` com `views_count` em `0`, e um `ready` em rascunho.

#### 1.1. contagem-incrementa-para-visitante-anonimo

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-09-30T23:29:18Z

**Steps:**
  1. `GET /videos/{publicId}/public` do vídeo publicado, sem `Authorization`
    - expect: `viewsCount` é `0`
  2. `POST /videos/{publicId}/view` do mesmo vídeo, sem `Authorization` e sem corpo
    - expect: status `204`
    - expect: corpo vazio
  3. `GET /videos/{publicId}/public` novamente
    - expect: `viewsCount` é `1`
  4. `POST /videos/{publicId}/view` mais duas vezes, depois `GET /videos/{publicId}/public`
    - expect: `viewsCount` é `3` — sem deduplicação por visitante nesta fase

#### 1.2. rascunho-de-terceiro-nao-conta-nem-revela

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-09-30T23:29:18Z

**Steps:**
  1. `POST /videos/{publicId}/view` do rascunho, sem `Authorization`
    - expect: status `404`
    - expect: `error` é `VIDEO_NOT_FOUND`
  2. `POST /videos/{publicId}/view` de um `publicId` inexistente
    - expect: status `404`
    - expect: corpo byte-idêntico ao do passo 1
  3. Consultar `views_count` do rascunho direto no banco
    - expect: continua `0` — a tentativa negada não incrementou

### 2. Orçamento de rate limit próprio da rota

**Setup:** o mesmo do grupo 1. Cada cenário deste grupo roda isolado, para que o contador em memória do throttler não vaze entre testes — `beforeEach` recria o módulo de teste, ou o teste aguarda o `ttl` expirar.

#### 2.1. limite-de-30-por-60s-por-ip

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-09-30T23:29:18Z

**Steps:**
  1. Emitir 30 `POST /videos/{publicId}/view` sequenciais do mesmo IP, dentro da mesma janela de 60 s
    - expect: as 30 respostas são `204`
    - expect: `viewsCount` após as 30 é `30`
  2. Emitir a 31ª requisição na mesma janela
    - expect: status `429`
  3. Consultar `viewsCount`
    - expect: continua `30` — a requisição barrada não incrementou

#### 2.2. orcamento-da-rota-nao-afeta-o-de-autenticacao

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-09-30T23:29:18Z

**Steps:**
  1. Emitir 11 `POST /auth/login` com credenciais inválidas, do mesmo IP, dentro de 60 s
    - expect: a 11ª retorna `429` — o default global de 10/60 s continua valendo nas rotas de auth
  2. Na mesma janela, emitir 1 `POST /videos/{publicId}/view`
    - expect: status `204` — o orçamento da rota de contagem é independente do de login
