---
subproject: frontend
runner: playwright
scope: phase-07-home-busca
si: SI-07.13b
target_file: tests/pagina-inicial-mobile.e2e-spec.ts
---

# Página inicial — mobile — Test Plan

## Application Overview

A home a 375px é a capability "Layout responsivo para dispositivos móveis", com o chrome mobile de `home-busca/TD-07` A.

Abaixo de `lg`, a navbar vira uma barra fechada: a marca e dois botões só com ícone, um de busca, que expande o campo sobre a barra, e um de menu, que abre o sheet de navegação. Nem "Entrar" nem avatar aparecem na barra, para anônimo e para logado. O acesso à sessão fica no sheet (`home-busca/TD-07`, Revision de 2026-10-11).

A troca é só CSS, pelas regras responsivas de `home-busca/TD-08` B. A faixa de categorias rola na horizontal, e a grade fica em coluna única.

## Test Scenarios

### 1. Barra fechada e layout em coluna

**Setup:** `next-frontend/tests/fixtures.ts` (MSW network fixture auto-applied), catálogo `buildFeedCatalog()` do SI-07.4. `page.setViewportSize({ width: 375, height: 812 })` antes de navegar. Visitante anônimo, salvo onde indicado; o login é pela UI de `/login` com `user@example.com`.

#### 1.1. barra-fechada-sem-sessao-visivel

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Visitante anônimo navega para `/`
    - expect: a barra mostra a marca e os botões "Buscar" e "Abrir menu"
    - expect: o campo de busca, os links de navegação e "Entrar" não estão visíveis
  2. Usuário autentica e navega para `/`
    - expect: a barra continua só com a marca e os dois botões, sem avatar e sem "Sair"

#### 1.2. botao-de-busca-expande-e-foca

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Visitante navega para `/` e toca em "Buscar"
    - expect: o botão passa a `aria-expanded="true"`
    - expect: o campo de busca aparece sobre a barra e está com foco

#### 1.3. botao-de-menu-abre-o-sheet

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Visitante navega para `/` e toca em "Abrir menu"
    - expect: um diálogo com o título "Menu" fica visível
    - expect: "Abrir menu" passa a `aria-expanded="true"`

#### 1.4. chips-rolam-e-grade-em-coluna-unica

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Visitante navega para `/`
    - expect: a faixa de categorias tem largura de rolagem maior que a visível (`scrollWidth > clientWidth`), e a página em si não rola na horizontal
    - expect: os cards da grade estão empilhados: todos têm o mesmo `x` e ocupam a largura do contêiner
    - expect: a paginação está centralizada
