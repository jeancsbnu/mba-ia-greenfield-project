---
subproject: frontend
runner: playwright
scope: phase-04-video-channel-management
si: SI-04.14b
target_file: tests/channel-public.e2e-spec.ts
---

# Página pública do canal — Test Plan

## Application Overview

A rota pública `/@{nickname}` (mapeada por `rewrites` para `app/channels/[nickname]`, video-channel-management/TD-08) mostra o canal a qualquer visitante, sem sessão: Server Component que lê `GET /channels/{nickname}` e `GET /channels/{nickname}/videos` direto no upstream (`limit` 8). O cabeçalho traz avatar com iniciais, nome, descrição quando existir e `@{nickname} · N vídeos` (singular "1 vídeo"); abaixo, uma grade de 4 colunas × 2 linhas de `VideoCard` e a paginação por `?page=`. A contagem e a lista só consideram vídeos publicados e públicos. Canal inexistente mostra "Canal não encontrado"; canal sem vídeos publicados mostra uma mensagem própria. A navbar mostra o botão "Entrar" para `/login`. Os textos estão em pt-BR.

## Test Scenarios

### 1. Ver o canal e seus vídeos como visitante

**Setup:** `next-frontend/tests/fixtures.ts` (MSW network fixture auto-applied; upstream faked server-side via `instrumentation.ts`, sem `page.route()` de `/api/**`). Nenhum cenário faz login. Triggers reservados por nickname nos handlers MSW do SI-04.8 (sem colidir com os das specs de auth e upload): `joana_cria` → canal com nome "Joana Cria", descrição "Vídeos de culinária", `videosCount` 12 e 12 vídeos publicados e públicos (o upstream simulado não devolve rascunhos nem "Indisponível" nesta lista); `sem_videos` → canal existente com `videosCount` 0; `nao_existe` → `404` `CHANNEL_NOT_FOUND`.

#### 1.1. mostra-cabecalho-e-grade-de-videos

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Visitante sem sessão navega para `/@joana_cria`
    - expect: o `h1` mostra "Joana Cria" e a descrição "Vídeos de culinária" aparece no cabeçalho
    - expect: o meta mostra `@joana_cria · 12 vídeos`
    - expect: o avatar tem `alt` "Joana Cria"
    - expect: a grade mostra os cards de vídeo, cada um com thumbnail, duração `m:ss` sobreposta, título em uma linha e `visualizações · há X`
    - expect: nenhum card é rascunho nem "Indisponível"

#### 1.2. pagina-de-8-em-8

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Visitante navega para `/@joana_cria`
    - expect: a grade mostra exatamente 8 cards
    - expect: a paginação mostra "Anterior" desabilitado, a página 1 com `aria-current="page"` e "Próxima"
  2. Visitante navega para `/@joana_cria?page=2`
    - expect: a grade mostra os 4 cards restantes
    - expect: a página 2 tem `aria-current="page"` e "Próxima" está desabilitado

#### 1.3. contagem-so-de-publicados-e-publicos

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Visitante navega para `/@joana_cria`
    - expect: o total no meta (12) é igual à soma dos cards de todas as páginas
    - expect: nenhum título de rascunho ou de vídeo "Indisponível" do canal aparece na página nem na paginação

#### 1.4. canal-inexistente-mostra-nao-encontrado

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Visitante navega para `/@nao_existe`
    - expect: a página "Canal não encontrado" é exibida
    - expect: nenhum cabeçalho de canal nem grade de vídeos é renderizado

#### 1.5. canal-sem-videos-publicados

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Visitante navega para `/@sem_videos`
    - expect: o cabeçalho do canal aparece com `@sem_videos · 0 vídeos`
    - expect: o texto "Este canal ainda não tem vídeos publicados" está visível e não há grade de cards

#### 1.6. botao-entrar-leva-ao-login

**Covers AC:** #6
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Visitante em `/@joana_cria` clica em "Entrar" na navbar
    - expect: a URL final é `/login`
