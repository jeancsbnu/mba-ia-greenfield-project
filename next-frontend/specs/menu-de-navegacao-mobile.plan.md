---
subproject: frontend
runner: playwright
scope: phase-07-home-busca
si: SI-07.15b
target_file: tests/menu-de-navegacao-mobile.e2e-spec.ts
---

# Menu de navegação — mobile — Test Plan

## Application Overview

O sheet de navegação é o chrome global do mobile (`home-busca/TD-07` A) e abre sobre qualquer rota com navbar. É parte da capability "Header/navbar com logo, barra de busca, botão de login/avatar e navegação".

Com sessão, mostra a identidade do canal do usuário: nome e `@nickname`, vindos de `GET /me/channel` pelo `PublicSiteNavbar`. Essa identidade é um link "Seu canal" para `/@{nickname}`. Abaixo vêm os links Início, Canais seguidos e Meus vídeos e o "Sair", que usa o logout compartilhado.

Sem sessão, mostra "Entrar" e só o link Início (`home-busca/TD-07`, Revision de 2026-10-11). O sheet fecha por Esc, pelo botão fechar ou por toque fora, e devolve o foco ao botão de menu.

## Test Scenarios

### 1. Sheet logado e anônimo

**Setup:** `next-frontend/tests/fixtures.ts` (MSW network fixture auto-applied). Com sessão de `user@example.com`, o `GET /me/channel` simulado devolve o canal "Joana Cria" (`joana_cria`). `page.setViewportSize({ width: 375, height: 812 })` antes de navegar. Os cenários com sessão autenticam antes pela UI de `/login`.

#### 1.1. logado-ve-identidade-links-e-sair

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Usuário autenticado navega para `/` e toca em "Abrir menu"
    - expect: o sheet mostra "Joana Cria" e "@joana_cria"
    - expect: os links "Início", "Canais seguidos" e "Meus vídeos" estão visíveis, e "Início" está marcado como página atual
    - expect: o botão "Sair" está visível

#### 1.2. anonimo-ve-entrar-e-so-inicio

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Visitante anônimo navega para `/` e toca em "Abrir menu"
    - expect: o sheet mostra "Entrar", que aponta para `/login`
    - expect: só o link "Início" aparece; "Canais seguidos" e "Meus vídeos" não
    - expect: não há "Sair" nem identidade de usuário

#### 1.3. identidade-leva-ao-proprio-canal

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Usuário autenticado abre o menu em `/` e toca em "Joana Cria"
    - expect: a URL passa a `/@joana_cria`
    - expect: o sheet fecha

#### 1.4. sair-encerra-a-sessao

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Usuário autenticado abre o menu em `/` e toca em "Sair"
    - expect: a URL passa a `/login`
  2. Visitante navega para `/` e abre o menu
    - expect: o sheet mostra a variante anônima, com "Entrar"

#### 1.5. fechar-devolve-o-foco

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Visitante abre o menu em `/` e pressiona Esc
    - expect: o sheet fecha e o foco está em "Abrir menu"
  2. Visitante abre o menu e toca em "Fechar menu"
    - expect: o sheet fecha e o foco está em "Abrir menu"
  3. Visitante abre o menu e toca na área escurecida fora do painel
    - expect: o sheet fecha
