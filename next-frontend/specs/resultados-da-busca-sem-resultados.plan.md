---
subproject: frontend
runner: playwright
scope: phase-07-home-busca
si: SI-07.12b
target_file: tests/resultados-da-busca-sem-resultados.e2e-spec.ts
---

# Resultados da busca — sem resultados — Test Plan

## Application Overview

O estado vazio da página de resultados é o que o usuário vê quando nenhum vídeo casa com o termo buscado. Não é rota própria: é a mesma `/results`.

Com `total === 0`, a `ResultsPage` troca o título, a grade e a paginação pelo `SearchEmptyState`, que repete o termo e oferece "Voltar para o início" (`home-busca/TD-05` A). O termo vem da URL e é renderizado como texto.

## Test Scenarios

### 1. Estado vazio

**Setup:** `next-frontend/tests/fixtures.ts` (MSW network fixture auto-applied). No catálogo `buildFeedCatalog()` do SI-07.4, nenhum título, nome de canal ou nickname contém "xyzabc", então `q=xyzabc` responde `{ items: [], total: 0 }`. Visitante anônimo.

#### 1.1. termo-sem-resultados-mostra-estado-vazio

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Visitante busca "xyzabc" pela navbar
    - expect: a URL passa a `/results?q=xyzabc`
    - expect: a página mostra "Nenhum vídeo encontrado para “xyzabc”" e a dica do estado vazio
    - expect: não há contagem de vídeos, grade nem paginação

#### 1.2. voltar-para-o-inicio

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Visitante navega para `/results?q=xyzabc` e clica em "Voltar para o início"
    - expect: a URL passa a `/` e a grade da home aparece

#### 1.3. termo-com-html-aparece-literal

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Visitante navega para `/results?q=%3Cb%3Exyz%3C%2Fb%3E` (termo `<b>xyz</b>`)
    - expect: o título do estado vazio contém o texto literal `<b>xyz</b>`
    - expect: a página não tem elemento `<b>` gerado a partir do termo
