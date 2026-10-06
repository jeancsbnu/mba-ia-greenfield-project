---
subproject: frontend
runner: playwright
scope: phase-06-social-interactions
si: SI-06.22b
target_file: tests/channel-subscriptions.e2e-spec.ts
---

# Área de canais seguidos — Test Plan

## Application Overview

Tela nova da Fase 06 em `/channel/subscriptions`, no grupo autenticado `(studio)` ao lado de `/channel/videos` e `/channel/settings`. É uma **lista de canais** com link para a página pública de cada um — o "acesso rápido aos vídeos" é esse link, a dois cliques —, não um feed de vídeos (`social-interactions/TD-07`, Option A, e Revisions de 2026-10-04). O ponto de entrada é o link "Canais seguidos" acrescentado à navbar autenticada.

Cada linha mostra avatar de iniciais, nome (link), "N inscritos · N vídeos" e o botão "Inscrito". O botão desinscreve com feedback otimista (`social-interactions/TD-08`) e a linha **permanece** na lista até a próxima visita, para que o engano seja reversível com um segundo clique (premissa do build registrada em §UI Contracts).

**Fronteira de interceptação.** Nenhum `page.route()` sobre `/api/**`; upstream falseado server-side.

## Test Scenarios

### 1. Lista e navegação

**Setup:** `next-frontend/tests/fixtures.ts` (MSW network fixture auto-applied; upstream faked server-side via `instrumentation.ts`, sem `page.route()` de `/api/**`). Triggers reservados de e-mail no login nos handlers MSW do `SI-06.18`, sem colidir com os das specs anteriores — o handler de `GET /me/subscriptions` distingue o usuário pelo access token que o mock de login emite para cada e-mail: `user@example.com` → 3 canais seguidos, na ordem "Ana Costa" (`ana_costa`), "Diego Farias" (`diego_farias`) e "Maria Rocha" (`maria_rocha`, 1200 inscritos, 42 vídeos); `no-subscriptions@example.com` → nenhum canal. `PUT`/`DELETE /channels/:nickname/subscription` devolvem a contagem do fixture ± 1.

#### 1.1. lista-dos-canais-seguidos

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Usuário autentica com `user@example.com` e clica no link "Canais seguidos" da navbar
    - expect: a URL é `/channel/subscriptions`
    - expect: o link "Canais seguidos" tem `aria-current="page"`
    - expect: o heading "Canais que você segue" e o subtítulo "3 canais" aparecem
    - expect: as 3 linhas aparecem na ordem Ana Costa, Diego Farias, Maria Rocha
    - expect: a linha de Maria Rocha mostra "1,2 mil inscritos · 42 vídeos" e o botão "Inscrito"

#### 1.2. nome-leva-a-pagina-do-canal

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Usuário autenticado em `/channel/subscriptions` clica no nome "Maria Rocha"
    - expect: a URL passa a `/@maria_rocha`
    - expect: a página pública do canal é renderizada

### 2. Deixar de seguir

**Setup:** o mesmo do grupo 1, autenticado com `user@example.com`.

#### 2.1. desinscrever-mantem-a-linha

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Usuário clica em "Inscrito" na linha de Maria Rocha
    - expect: o botão passa a "Inscrever-se" no mesmo instante
    - expect: a contagem de inscritos da linha cai em 1 no mesmo instante
    - expect: a linha continua na lista e o subtítulo continua "3 canais"
  2. Aguardar a resposta de `DELETE /api/channels/maria_rocha/subscription`
    - expect: o estado da linha permanece o mesmo

#### 2.2. segundo-clique-desfaz

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Usuário clica em "Inscrito" na linha de Maria Rocha e aguarda a resposta
    - expect: o botão mostra "Inscrever-se"
  2. Usuário clica em "Inscrever-se" na mesma linha
    - expect: uma requisição `PUT /api/channels/maria_rocha/subscription` é emitida
    - expect: o botão volta a "Inscrito" e a contagem volta ao valor original

### 3. Estados de acesso e vazio

**Setup:** o mesmo do grupo 1.

#### 3.1. usuario-sem-inscricoes

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Usuário autentica com `no-subscriptions@example.com` e navega para `/channel/subscriptions`
    - expect: o subtítulo mostra "0 canais"
    - expect: um texto de lista vazia aparece no lugar da lista
    - expect: nenhuma linha de canal é renderizada

#### 3.2. sem-sessao-vai-ao-login

**Covers AC:** #6
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Visitante sem sessão navega direto para `/channel/subscriptions`
    - expect: a URL passa a `/login`
    - expect: nenhum dado de canal seguido é exibido
