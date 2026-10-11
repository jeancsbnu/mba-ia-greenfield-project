---
subproject: frontend
runner: playwright
scope: phase-07-home-busca
si: SI-07.14b
target_file: tests/resultados-da-busca-mobile.e2e-spec.ts
---

# Resultados da busca — mobile — Test Plan

## Application Overview

Os resultados da busca a 375px (`home-busca/TD-08` B), com a busca expandida sobre a barra (`home-busca/TD-07` A).

Em `/results`, a barra mobile começa expandida, com o termo preenchido. É premissa do build, porque o desenho só mostra esse estado. "Fechar busca" recolhe e devolve a barra com a marca e os dois botões, com o foco de volta no botão de busca.

O submit é só ícone, com a mesma validação do desktop (mínimo de 3 caracteres). A lista fica em coluna única.

## Test Scenarios

### 1. Busca expandida no mobile

**Setup:** `next-frontend/tests/fixtures.ts` (MSW network fixture auto-applied), catálogo `buildFeedCatalog()` do SI-07.4 (`q=docker` → 13 vídeos; `q=musica` → só "Música ao vivo"). `page.setViewportSize({ width: 375, height: 812 })` antes de navegar. Visitante anônimo.

#### 1.1. results-abre-com-busca-expandida

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Visitante navega para `/results?q=docker`
    - expect: a barra mostra "Fechar busca" e o campo de busca preenchido com "docker"; a marca e "Abrir menu" não estão visíveis
    - expect: o título "Resultados para “docker”" e os cards estão em coluna única, todos com o mesmo `x`

#### 1.2. fechar-busca-devolve-a-barra

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Visitante navega para `/results?q=docker` e toca em "Fechar busca"
    - expect: a barra volta a mostrar a marca, "Buscar" e "Abrir menu"
    - expect: o foco está em "Buscar"

#### 1.3. enviar-termo-novo-pelo-icone

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Visitante navega para `/results?q=docker`, apaga o campo, digita "musica" e toca no botão "Buscar" do formulário
    - expect: a URL passa a `/results?q=musica`
    - expect: a lista mostra só "Música ao vivo"
