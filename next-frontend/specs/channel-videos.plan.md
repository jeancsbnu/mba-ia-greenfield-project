---
subproject: frontend
runner: playwright
scope: phase-04-video-channel-management
si: SI-04.11b
target_file: tests/channel-videos.e2e-spec.ts
---

# Painel de gerenciamento de vídeos do canal — Test Plan

## Application Overview

A rota `/channel/videos` é o painel do dono: uma página Server Component dentro do layout autenticado `(studio)` que lê `GET /me/videos` direto no upstream (offset/limit com total, `limit` 10) e renderiza a `VideoTable` com thumbnail, título, duração, chips de visibilidade e status, views, likes, comentários, data de publicação e o botão "Editar {título}" por linha. Sem sessão, o layout redireciona para `/login`. O rascunho mostra "—" em visibilidade, métricas e publicação. A paginação usa o search param `page`. Há estados de canal sem vídeos e de erro do upstream. Os textos estão em pt-BR.

## Test Scenarios

### 1. Gerenciar os vídeos do canal a partir do painel

**Setup:** `next-frontend/tests/fixtures.ts` (MSW network fixture auto-applied; upstream faked server-side via `instrumentation.ts`, sem `page.route()` de `/api/**`). Triggers reservados de e-mail no login (definidos nos handlers MSW do SI-04.8, sem colidir com os das specs de auth e upload): `user@example.com` → canal com 12 vídeos (publicado e público, publicado e "Indisponível", rascunho, e os demais publicados); `empty-channel@example.com` → canal sem vídeos; `panel-error@example.com` → `GET /me/videos` responde `500`. Os cenários que exigem sessão autenticam antes pela UI de `/login`.

#### 1.1. guard-redireciona-sem-sessao

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Visitante sem sessão navega para `/channel/videos`
    - expect: a URL final é `/login`
    - expect: o formulário de login está visível e o painel não é renderizado

#### 1.2. lista-os-videos-do-canal

**Covers AC:** #2, #3
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Usuário autentica com `user@example.com` e navega para `/channel/videos`
    - expect: a navbar autenticada mostra o menu do usuário com o botão "Sair"
    - expect: a tabela mostra 10 linhas, cada uma com thumbnail, título, duração no formato `m:ss`, chip de visibilidade, chip de status, views, likes, comentários e a data de publicação
    - expect: os contadores usam o formato pt-BR (por exemplo `1.284`)
  2. Usuário observa a linha do vídeo em rascunho
    - expect: o chip de status é "Rascunho"
    - expect: visibilidade, métricas e publicação mostram "—"
  3. Usuário observa a linha do vídeo publicado e "Indisponível"
    - expect: o chip de visibilidade mostra "Indisponível", nunca o termo em inglês "Unlisted"

#### 1.3. pagina-por-search-param

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Usuário autenticado com `user@example.com` navega para `/channel/videos?page=2`
    - expect: a tabela mostra 2 linhas (o segundo recorte dos 12 vídeos)
    - expect: a paginação marca a página 2 com `aria-current="page"`
  2. Usuário navega para `/channel/videos?page=abc`
    - expect: a tabela mostra o primeiro recorte (10 linhas), como a página 1

#### 1.4. estado-vazio-com-criar-video

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Usuário autentica com `empty-channel@example.com` e navega para `/channel/videos`
    - expect: o texto "Nenhum vídeo ainda" está visível
    - expect: o botão "Criar novo vídeo" está visível
  2. Usuário clica em "Criar novo vídeo"
    - expect: a URL final é `/upload`

#### 1.5. editar-leva-a-tela-de-edicao

**Covers AC:** #6
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Usuário autenticado com `user@example.com` em `/channel/videos` localiza o botão cujo nome acessível é "Editar {título}" da primeira linha
    - expect: o botão existe e o nome acessível inclui o título do vídeo
  2. Usuário clica nesse botão
    - expect: a URL final é `/videos/{publicId}/edit` com o `publicId` da linha

#### 1.6. erro-do-upstream-com-nova-tentativa

**Covers AC:** #7
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Usuário autentica com `panel-error@example.com` e navega para `/channel/videos`
    - expect: o estado de erro está visível com uma mensagem e a ação "Tentar de novo"
    - expect: a tabela não é renderizada
