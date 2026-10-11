---
subproject: frontend
runner: playwright
scope: phase-07-home-busca
si: SI-07.10b
target_file: tests/pagina-inicial.e2e-spec.ts
---

# Página inicial — Test Plan

## Application Overview

A home (`/`) substitui o placeholder do `create-next-app` pela grade de vídeos publicados mais recentes. É a capability "Página inicial com grid de vídeos (thumbnail, título, canal, visualizações e tempo de publicação)".

A página é Server Component e lê `GET /videos` direto do upstream, sem rota BFF (`home-busca/TD-01` B). A ordem é por recência (`home-busca/TD-03` A), em 12 vídeos por página com paginação numerada em `?page=N` (`home-busca/TD-02` A).

O filtro por categoria é uma faixa de chips que navega para `/?category=<valor do enum>`. "Todos" equivale à ausência de `category`.

A categoria fora do enum é ignorada, sem erro. A paginação só aparece com mais de uma página e preserva a categoria.

## Test Scenarios

### 1. Grade, categoria e paginação

**Setup:** `next-frontend/tests/fixtures.ts` (MSW network fixture auto-applied; o upstream é simulado no servidor via `instrumentation.ts`, sem `page.route()` de `/api/**`). O catálogo é o `buildFeedCatalog()` do SI-07.4:
- 30 vídeos `feed-1` … `feed-30`, do mais novo ao mais antigo;
- categoria do vídeo `i` (base 0) é a `i % 7` do enum, então `Música` = `feed-1`, `feed-8`, `feed-15`, `feed-22`, `feed-29`, e `Outros` fica vazia;
- títulos `Vídeo {n}`, exceto `feed-1` "Música ao vivo" e `feed-3`/`feed-6`/`feed-9` "Docker …";
- canais `Joana Cria`, `Docker Brasil` e `Tech com Nina` em rodízio.

Visitante anônimo, viewport desktop padrão do projeto.

#### 1.1. home-mostra-os-12-mais-recentes

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Visitante navega para `/`
    - expect: a página não mostra nada do `create-next-app`
    - expect: a grade tem exatamente 12 cards, o primeiro "Música ao vivo" e o último "Vídeo 12"
    - expect: cada card mostra thumbnail, duração, título, avatar com iniciais e nome do canal, visualizações e tempo de publicação
    - expect: o chip "Todos" está selecionado (`aria-current="page"`)
  2. Visitante clica no título do primeiro card
    - expect: a URL passa a `/videos/feed-1`
  3. Visitante volta e clica no nome do canal do primeiro card
    - expect: a URL passa a `/@joana_cria`

#### 1.2. categoria-filtra-a-grade

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Visitante navega para `/` e clica no chip "Música"
    - expect: a URL passa a `/?category=M%C3%BAsica`
    - expect: a grade mostra só os 5 vídeos de Música, de "Música ao vivo" a "Vídeo 29"
    - expect: o chip "Música" está selecionado e "Todos" não está
  2. Visitante clica em "Todos"
    - expect: a URL volta a `/` e a grade volta aos 12 mais recentes

#### 1.3. pagina-dois-mostra-os-videos-13-a-24

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Visitante navega para `/` e clica em "2" na paginação
    - expect: a URL passa a `/?page=2`
    - expect: a grade mostra de "Vídeo 13" a "Vídeo 24"
  2. Visitante navega para `/?page=3`
    - expect: a grade mostra de "Vídeo 25" a "Vídeo 30", 6 cards
    - expect: "Próxima" está desabilitado (`aria-disabled="true"`)

#### 1.4. categoria-fora-do-enum-lista-sem-filtro

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Visitante navega para `/?category=Culin%C3%A1ria`
    - expect: a página responde sem erro e a grade mostra os 12 mais recentes, como em `/`
    - expect: o chip "Todos" está selecionado

#### 1.5. categoria-vazia-mostra-mensagem

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Visitante navega para `/?category=Outros`
    - expect: a página mostra "Nenhum vídeo em Outros." no lugar da grade
    - expect: o link "Ver todos os vídeos" leva a `/`
    - expect: a faixa de chips continua visível, com "Outros" selecionado

#### 1.6. pagina-unica-esconde-paginacao

**Covers AC:** #6
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Visitante navega para `/?category=M%C3%BAsica`
    - expect: os 5 vídeos cabem numa página, e nenhum controle de paginação é renderizado

**Nota de cobertura.** A parte "a paginação preserva a categoria" da AC #2 não é exercitável com o catálogo: nenhuma categoria passa de 12 vídeos. O cenário 1.3 cobre a paginação sem categoria. A construção dos hrefs com `category` fica com a revisão de código do SI-07.10b.
