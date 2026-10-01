---
subproject: frontend
runner: playwright
scope: phase-05-video-watch-page
si: SI-05.6b
target_file: tests/video-watch-page.e2e-spec.ts
---

# Página de visualização do vídeo — Test Plan

## Application Overview

A watch page (`/videos/{publicId}`) é pública: qualquer visitante, sem autenticação, vê o vídeo, seus dados, a descrição e uma sidebar de sugestões. O Server Component busca `GET /api/videos/{publicId}/public` e recebe, na mesma resposta, as duas URLs pré-assinadas de 6 h (`video-watch-page/TD-02`, Clarification de 2026-09-24) — o `<video src>` e o `<a href>` de download apontam **direto ao storage**, que é outra origem.

O player é `<video controls>` nativo (`video-watch-page/TD-01`): os controles são do navegador, não reimplementados, e os nós de controle no Figma são ilustrativos. É também a única fronteira `"use client"` obrigatória da tela, porque o disparo da contagem depende do evento `timeupdate` (`video-watch-page/TD-03`).

A contagem dispara `POST /api/videos/{publicId}/view` **uma única vez por montagem**, ao acumular **5 s de reprodução efetiva** — tempo de mídia avançado, não tempo de página aberta. Por `video-watch-page/TD-06` (Option A) o gatilho fica atrás de uma **fachada de mídia injetável**, para que o teste unitário possa afirmar o limiar sem relógio real; o E2E aqui cobre o caminho integrado.

A sidebar pagina de 4 em 4 com "Ver mais" (`video-watch-page/TD-04`, revisão de 2026-09-26) e some quando o acumulado atinge `total`.

**Fronteira de interceptação — load-bearing.** O `next-frontend/CLAUDE.md` proíbe `page.route()` sobre `/api/**`: isso curto-circuitaria os Route Handlers, que são o que se quer exercitar. O upstream NestJS é falseado **server-side** via `instrumentation.ts` + `mocks/`. A exceção decidida no `video-watch-page/TD-06` (Option C) é um único `page.route()` na **origem do storage** — outra origem, fora de `/api/**`, e a única forma de afirmar que o `src` aponta ao lugar certo sem espalhar binário pela suíte.

## Test Scenarios

### 1. Reprodução e contagem de visualização

**Setup:** `next-frontend/tests/fixtures.ts` (MSW network fixture auto-applied; upstream NestJS falseado server-side via `instrumentation.ts`, **sem** `page.route()` de `/api/**`). Um único `page.route()` na origem do storage devolve um corpo de vídeo mínimo para o `src` — a exceção do `video-watch-page/TD-06`.

#### 1.1. contagem-nao-dispara-abaixo-do-limiar

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-09-30T23:29:18Z

**Steps:**
  1. Visitante anônimo navega para `/videos/{publicId}` de um vídeo publicado
    - expect: o `<video>` está presente com atributo `controls`
    - expect: título, contagem de visualizações e nome do canal aparecem
  2. Reproduzir acumulando menos de 5 s de mídia avançada
    - expect: nenhuma requisição a `/api/videos/{publicId}/view` foi emitida
  3. Continuar a reprodução até cruzar 5 s acumulados
    - expect: exatamente uma requisição `POST /api/videos/{publicId}/view` é emitida

#### 1.2. contagem-dispara-uma-unica-vez-por-montagem

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-09-30T23:29:18Z

**Steps:**
  1. Reproduzir até cruzar o limiar de 5 s
    - expect: uma requisição a `/api/videos/{publicId}/view`
  2. Pausar, voltar o vídeo ao início e reproduzir novamente cruzando 5 s outra vez
    - expect: **nenhuma** requisição adicional — o gatilho é uma vez por montagem do player
  3. Recarregar a página e repetir a travessia do limiar
    - expect: uma nova requisição é emitida — a montagem nova reabilita o gatilho

#### 1.3. erro-de-contagem-e-silencioso-para-o-espectador

**Covers AC:** #7
**Source:** auto
**Last sync:** 2026-09-30T23:29:18Z

**Steps:**
  1. Configurar o upstream para responder `429` em `POST /videos/{publicId}/view`
  2. Reproduzir até cruzar o limiar de 5 s
    - expect: nenhum toast, banner ou mensagem de erro aparece
    - expect: o `<video>` continua reproduzindo normalmente
    - expect: o restante da página permanece funcional

### 2. Download

**Setup:** o mesmo do grupo 1.

#### 2.1. download-usa-a-url-que-veio-com-a-pagina

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-09-30T23:29:18Z

**Steps:**
  1. Visitante anônimo abre `/videos/{publicId}` e localiza o botão "Baixar vídeo"
    - expect: o botão é um `<a>` com `href` apontando à origem do storage, não a `/api/**`
  2. Registrar as requisições emitidas e clicar em "Baixar vídeo"
    - expect: **nenhuma** requisição a `/api/**` é emitida pelo clique — a URL já veio com a página
    - expect: o download é iniciado a partir da URL assinada
    - expect: o nome do arquivo salvo deriva do título do vídeo, não da chave de objeto

### 3. Sidebar de sugestões

**Setup:** o mesmo do grupo 1, com o upstream devolvendo `total: 6` e páginas de 4.

#### 3.1. ver-mais-acrescenta-pagina-e-some-no-fim

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-09-30T23:29:18Z

**Steps:**
  1. Abrir `/videos/{publicId}`
    - expect: a sidebar mostra 4 cards de sugestão
    - expect: o controle "Ver mais" está visível
  2. Clicar em "Ver mais"
    - expect: uma requisição `GET /api/videos/{publicId}/suggestions` com `offset=4`
    - expect: a sidebar passa a mostrar 6 cards — os 4 anteriores **mais** os 2 novos, sem substituir
  3. Observar o controle após o acumulado atingir `total`
    - expect: "Ver mais" não está mais visível, ou está inerte

#### 3.2. sidebar-vazia-nao-e-erro

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-09-30T23:29:18Z

**Steps:**
  1. Configurar o upstream para devolver `{ items: [], total: 0 }` nas sugestões e abrir a página
    - expect: a sidebar mostra o estado vazio, sem nenhum card
    - expect: nenhuma mensagem de erro aparece
    - expect: o `<video>` e as informações do vídeo renderizam normalmente

#### 3.3. falha-nas-sugestoes-degrada-so-a-sidebar

**Covers AC:** #6
**Source:** auto
**Last sync:** 2026-09-30T23:29:18Z

**Steps:**
  1. Configurar o upstream para responder `500` em `GET /videos/{publicId}/suggestions` e abrir a página
    - expect: o `<video>` está presente e reproduz
    - expect: título, contagem e canal continuam visíveis
    - expect: a falha fica contida na sidebar — a página não vai para o estado de erro nem para o not-found
