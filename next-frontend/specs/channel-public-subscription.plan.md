---
subproject: frontend
runner: playwright
scope: phase-06-social-interactions
si: SI-06.23b
target_file: tests/channel-public-subscription.e2e-spec.ts
---

# Página pública do canal — inscrição e contagem de inscritos — Test Plan

## Application Overview

A página pública do canal (`/@{nickname}`), entregue na Fase 04 e coberta por `channel-public.plan.md`, ganha na Fase 06 a contagem de inscritos — capability "Contagem de inscritos na página do canal" — e o botão de inscrição. A meta do cabeçalho passa a `@{nickname} · N inscritos · N vídeos`; a contagem vem de `channels.subscribers_count` (`social-interactions/TD-06`) e acompanha o botão de forma otimista (`social-interactions/TD-08`).

O frame está no estado anônimo **de propósito**: o botão "Inscrever-se" renderiza para o visitante sem sessão e leva ao login com `returnTo` (`social-interactions-anonymous-gate/TD-01` e `TD-03`). Com sessão, o estado pessoal (`viewerSubscribed`) chega na primeira pintura (`social-interactions-anonymous-gate/TD-02`).

Esta spec cobre só o acréscimo da Fase 06; a vitrine de vídeos e a paginação seguem em `tests/channel-public.e2e-spec.ts`.

**Nota de cobertura.** A parte "recarregar a página mantém o estado" da AC #3 depende de o upstream persistir a inscrição — comportamento do backend, coberto por `nestjs-project/specs/channels-public-subscribers.plan.md` (cenário 1.3). O upstream simulado aqui não guarda estado entre requisições, então o cenário 1.3 afirma só a transição otimista e a reconciliação.

## Test Scenarios

### 1. Contagem e inscrição

**Setup:** `next-frontend/tests/fixtures.ts` (MSW network fixture auto-applied; upstream faked server-side via `instrumentation.ts`, sem `page.route()` de `/api/**`). Triggers reservados por nickname nos handlers MSW do `SI-06.13` e do `SI-06.18`, sem colidir com os da spec da Fase 04: `maria_rocha` → canal com `subscribersCount` 1200 e `viewerSubscribed: false` mesmo com sessão; `canal_seguido` → com sessão, `viewerSubscribed: true`; `nao_existe` → `404` `CHANNEL_NOT_FOUND` (trigger já existente). `PUT`/`DELETE /channels/:nickname/subscription` devolvem a contagem do fixture ± 1. Cenários com sessão autenticam antes pela UI de `/login` com `user@example.com`.

#### 1.1. anonimo-ve-contagem-e-botao

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Visitante anônimo navega para `/@maria_rocha`
    - expect: a meta do cabeçalho mostra "@maria_rocha · 1,2 mil inscritos · " seguida do total de vídeos
    - expect: o botão "Inscrever-se" está visível, alinhado ao nome do canal
    - expect: a navbar mostra "Entrar"

#### 1.2. inscrito-ve-inscrito-na-primeira-pintura

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Usuário autentica com `user@example.com` e navega para `/@canal_seguido`
    - expect: o botão mostra "Inscrito" já no HTML servido — nenhum frame mostra "Inscrever-se" antes
    - expect: a navbar mostra avatar, "Sair" e o link "Canais seguidos"

#### 1.3. inscrever-atualiza-no-mesmo-instante

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Usuário autenticado navega para `/@maria_rocha`
    - expect: "1,2 mil inscritos" e "Inscrever-se"
  2. Usuário clica em "Inscrever-se"
    - expect: o botão passa a "Inscrito" no mesmo instante
    - expect: a contagem é atualizada no mesmo instante, antes da resposta da API
  3. Aguardar a resposta de `PUT /api/channels/maria_rocha/subscription`
    - expect: botão e contagem refletem o valor devolvido pela rota

### 2. Visitante anônimo e canal inexistente

**Setup:** o mesmo do grupo 1, sem login prévio.

#### 2.1. anonimo-vai-ao-login-e-volta

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Visitante anônimo navega para `/@maria_rocha` e clica em "Inscrever-se"
    - expect: nenhuma requisição a `/api/channels/maria_rocha/subscription` é emitida
    - expect: a URL passa a `/login?returnTo=%2F%40maria_rocha`
  2. Visitante preenche "E-mail" com `user@example.com`, "Senha" com a senha dos fixtures e clica em "Entrar"
    - expect: a URL volta a `/@maria_rocha`
    - expect: a navbar mostra avatar e "Sair"

#### 2.2. canal-inexistente

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Visitante navega para `/@nao_existe`
    - expect: a tela de canal não encontrado da Fase 04 é renderizada
    - expect: nenhum botão de inscrição aparece
