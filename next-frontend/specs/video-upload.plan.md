---
subproject: frontend
runner: playwright
scope: phase-03-upload-processing
si: SI-03.8
target_file: tests/video-upload.e2e-spec.ts
---

# Fluxo de upload de vídeo com progresso e feedback de processamento — Test Plan

## Application Overview

A tela de upload permite que um usuário autenticado envie um arquivo de vídeo de até 10GB com retomada em caso de queda de conexão (protocolo tus via `tus-js-client`). O componente `"use client"` `upload-form.tsx` envia o arquivo em chunks através do Route Handler BFF `app/api/videos/upload/route.ts`, que faz proxy para a sessão tus do NestJS upstream, exibindo uma barra de progresso (`Progress` do shadcn) conforme os chunks são confirmados. Ao concluir o upload, a tela inicia polling do Route Handler `app/api/videos/[publicId]/route.ts` a cada N segundos até o `status` do vídeo deixar de ser `processing`, refletindo o resultado do processamento em segundo plano (worker de vídeo). Erros retornados pelo backend (ex.: arquivo acima do limite) são exibidos ao usuário de forma genérica, sem vazar detalhes internos da resposta upstream.

## Test Scenarios

### 1. Upload de vídeo com barra de progresso e retomada (tus)

**Setup:** `next-frontend/tests/fixtures.ts` (MSW network fixture auto-applied; upstream tus/NestJS faked server-side via `instrumentation.ts`, no browser `page.route()` de `/api/**`)

#### 1.1. upload-exibe-progresso-avancando-por-chunk

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-07-06T23:58:58Z

**Steps:**
  1. Usuário navega para a tela de upload e seleciona um arquivo de vídeo
    - expect: o formulário exibe o nome do arquivo selecionado e um botão para iniciar o upload
  2. Usuário inicia o upload
    - expect: a barra de progresso (`Progress`) aparece e o valor avança conforme os chunks tus são confirmados pelo BFF
    - expect: nenhuma requisição do browser é feita diretamente ao NestJS upstream — apenas a `PATCH`/`POST` via `/api/videos/upload`

#### 1.2. upload-retomada-apos-queda-de-conexao

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-07-06T23:58:58Z

**Steps:**
  1. Usuário inicia o upload de um arquivo e o progresso avança parcialmente
    - expect: a barra de progresso reflete o percentual já enviado
  2. A conexão é interrompida antes da conclusão do upload (simulada via fixture reservada) e o usuário retoma o envio
    - expect: o upload continua a partir do offset já confirmado (sem reiniciar do zero — comportamento tus)
    - expect: a barra de progresso não regride para 0% ao retomar

### 2. Feedback de processamento pós-upload

**Setup:** `next-frontend/tests/fixtures.ts` (MSW network fixture auto-applied)

#### 2.1. upload-concluido-poll-ate-status-mudar

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-07-06T23:58:58Z

**Steps:**
  1. Upload de um arquivo é concluído (todos os chunks enviados)
    - expect: a tela dispara polling periódico para `/api/videos/[publicId]`
    - expect: enquanto `status` retornado é `processing`, a UI exibe um indicador de processamento em andamento
  2. Uma chamada subsequente de polling retorna `status: "ready"` (fixture reservada)
    - expect: o polling é interrompido
    - expect: a UI reflete o vídeo pronto (ex.: mensagem de sucesso / link para o vídeo)

### 3. Tratamento de erros do backend sem vazar detalhes internos

**Setup:** `next-frontend/tests/fixtures.ts` (MSW network fixture auto-applied)

#### 3.1. upload-erro-arquivo-grande-exibido-sem-detalhes-internos

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-07-06T23:58:58Z

**Steps:**
  1. Usuário tenta iniciar upload de um arquivo cujo tamanho aciona a resposta reservada `UPLOAD_FILE_TOO_LARGE` do upstream
    - expect: um `Alert` genérico de erro é exibido ao usuário (ex.: "arquivo excede o tamanho permitido")
    - expect: nenhum detalhe interno da resposta upstream (stack trace, payload bruto, `errorCode` cru) é renderizado na tela
    - expect: o botão de upload volta ao estado inicial, permitindo nova tentativa
