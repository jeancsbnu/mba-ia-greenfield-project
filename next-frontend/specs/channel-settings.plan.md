---
subproject: frontend
runner: playwright
scope: phase-04-video-channel-management
si: SI-04.13b
target_file: tests/channel-settings.e2e-spec.ts
---

# Tela de edição do canal — Test Plan

## Application Overview

A rota `/channel/settings` edita nickname, nome e descrição do canal do dono: Server Component dentro do layout autenticado `(studio)` que carrega `GET /me/channel` direto no upstream, com o formulário `ChannelEditForm` (Client Component, react-hook-form + Zod) dentro de um card. O nickname segue a allowlist `[a-z0-9_]` de 1 a 50 caracteres e o campo tem o prefixo decorativo "@", o texto de apoio "Único e global para o sistema" e um aviso de que trocar o nickname muda a URL pública `/@{nickname}`. O envio vai por `PATCH /api/me/channel`, que o Route Handler BFF encaminha ao upstream sem reformatar. Um nickname já usado devolve o erro inline sob o campo. "Cancelar" leva ao painel `/channel/videos`. Os textos estão em pt-BR.

## Test Scenarios

### 1. Editar as informações do canal

**Setup:** `next-frontend/tests/fixtures.ts` (MSW network fixture auto-applied; upstream faked server-side via `instrumentation.ts`, sem `page.route()` de `/api/**`). Triggers reservados nos handlers MSW do SI-04.8 (sem colidir com os das specs de auth e upload): o login `user@example.com` dá acesso ao canal com nickname `joana_cria`, nome "Joana Cria" e descrição "Vídeos de culinária"; o valor de nickname `nickname_em_uso` faz `PATCH /me/channel` responder `409` com `NICKNAME_ALREADY_EXISTS`; qualquer outro valor válido responde `200` com o canal atualizado. Todos os cenários autenticam antes pela UI de `/login` com `user@example.com`.

#### 1.1. mostra-os-dados-atuais-do-canal

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Usuário navega para `/channel/settings`
    - expect: o campo "NICKNAME" mostra `joana_cria`, com o prefixo "@" decorativo ao lado
    - expect: o campo "NOME DO CANAL" mostra "Joana Cria"
    - expect: o campo "DESCRIÇÃO" mostra "Vídeos de culinária"
    - expect: a navbar autenticada com o menu do usuário está visível

#### 1.2. salva-com-dados-validos

**Covers AC:** #2, #7
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Usuário troca o nome para "Joana Nova" e clica em "Salvar alterações"
    - expect: dispara `PATCH /api/me/channel` com corpo JSON contendo `name` "Joana Nova"
    - expect: enquanto a mutation está em voo, o botão "Salvar alterações" fica desabilitado
  2. O BFF responde
    - expect: o status e o corpo da resposta do BFF são os do upstream, sem reformatação
    - expect: a mensagem "Alterações salvas" aparece com `role="status"`
    - expect: o menu do usuário na navbar passa a refletir o novo nome do canal (as iniciais mudam)

#### 1.3. nickname-em-uso-mostra-erro-inline

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Usuário troca o nickname para `nickname_em_uso` e clica em "Salvar alterações"
    - expect: o `PATCH /api/me/channel` responde `409`
    - expect: uma mensagem de erro aparece sob o campo nickname, associada por `aria-describedby`
    - expect: a mensagem "Alterações salvas" não aparece
    - expect: recarregar a página mostra o nickname anterior `joana_cria`

#### 1.4. allowlist-bloqueia-antes-do-envio

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Usuário troca o nickname para `joana.cria` e clica em "Salvar alterações"
    - expect: aparece um erro no campo nickname
    - expect: nenhuma requisição `PATCH /api/me/channel` é disparada

#### 1.5. avisa-que-trocar-nickname-muda-a-url

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Usuário observa o campo nickname
    - expect: o texto de apoio "Único e global para o sistema" está visível
    - expect: existe um aviso de que trocar o nickname muda o endereço público do canal, ligado ao campo por `aria-describedby`

#### 1.6. cancelar-volta-ao-painel

**Covers AC:** #6
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Usuário em `/channel/settings` clica em "Cancelar"
    - expect: a URL final é `/channel/videos`
