---
subproject: frontend
runner: playwright
scope: phase-07-home-busca
si: SI-07.11b
target_file: tests/resultados-da-busca.e2e-spec.ts
---

# Resultados da busca — Test Plan

## Application Overview

A página de resultados (`/results`) é o destino da barra de busca da navbar. É a capability "Barra de busca (pesquisa por título e canal)".

A barra envia por `next/form` para `/results?q=` (`home-busca/TD-06` A). A página é Server Component e chama `GET /videos?q=` direto do upstream (`home-busca/TD-01` B). O resultado traz só vídeos: o termo casa com o título ou com o canal (`home-busca/TD-05` A), em ordem de recência (`home-busca/TD-04` A).

O termo mínimo é de 3 caracteres. Com termo mais curto, a página mostra um aviso e não chama o upstream. Sem termo, redireciona para `/`.

A paginação é numerada, de 12 em 12, e preserva o `q`.

## Test Scenarios

### 1. Busca, termo e paginação

**Setup:** `next-frontend/tests/fixtures.ts` (MSW network fixture auto-applied). Catálogo `buildFeedCatalog()` do SI-07.4. `q=docker` casa 13 vídeos, em ordem de recência:
- **10 do canal "Docker Brasil"**, que casam pelo canal: "Vídeo 2", "Vídeo 5", "Vídeo 8" e seguintes;
- **3 do canal "Tech com Nina"**, que casam pelo título: "Docker na prática", "Docker Compose do zero" e "Docker em produção".

A página 1 vai de "Vídeo 2" a "Vídeo 26"; a página 2 tem só "Vídeo 29". O cenário 1.1 autentica antes pela UI de `/login` com `user@example.com`, como o frame desktop; os demais são anônimos.

#### 1.1. busca-mostra-resultados-por-titulo-e-canal

**Covers AC:** #1, #2
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Usuário autenticado digita "docker" no campo de busca da navbar e clica em "Buscar"
    - expect: a URL passa a `/results?q=docker`
    - expect: o título da página é "Resultados para “docker”" e a contagem é "13 vídeos"
    - expect: a grade tem 12 cards, o primeiro "Vídeo 2" e o segundo "Docker na prática"
    - expect: "Vídeo 2", cujo título não contém o termo, aparece como card comum, com o canal "Docker Brasil"
    - expect: o campo de busca da navbar continua preenchido com "docker"
    - expect: nenhum link da navbar está marcado como página atual

#### 1.2. termo-curto-mostra-aviso

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Visitante navega para `/results?q=ab`
    - expect: a página mostra "Digite pelo menos 3 caracteres para buscar."
    - expect: não há título de resultados, grade nem paginação
  2. Visitante tenta enviar "ab" pelo campo de busca
    - expect: o navegador barra o envio (`minLength`) e a URL não muda

#### 1.3. sem-termo-redireciona-para-a-home

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Visitante navega para `/results`
    - expect: a URL final é `/`
  2. Visitante navega para `/results?q=%20%20`
    - expect: a URL final é `/`

#### 1.4. paginacao-preserva-o-termo

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Visitante navega para `/results?q=docker`
    - expect: o link "2" da paginação aponta para `/results?q=docker&page=2`
  2. Visitante clica em "2"
    - expect: a URL passa a `/results?q=docker&page=2`
    - expect: a grade mostra só "Vídeo 29", e o título continua "Resultados para “docker”"
    - expect: "Próxima" está desabilitado (`aria-disabled="true"`)

#### 1.5. erro-do-upstream-mostra-tentar-novamente

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Visitante navega para `/results?q=erro-upstream` (trigger `500` do catálogo)
    - expect: a página mostra a mensagem de erro da listagem e o botão "Tentar novamente"
    - expect: a navbar continua renderizada
