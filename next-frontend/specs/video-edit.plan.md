---
subproject: frontend
runner: playwright
scope: phase-04-video-channel-management
si: SI-04.12b
target_file: tests/video-edit.e2e-spec.ts
---

# Tela de edição de vídeo — Test Plan

## Application Overview

A rota `/videos/{publicId}/edit` é a edição de um vídeo do dono: Server Component dentro do layout autenticado `(studio)` que carrega `GET /videos/{publicId}` direto no upstream, com o formulário `VideoEditForm` (Client Component, react-hook-form + Zod) para título, descrição, categoria (lista do TD-10), visibilidade (Público / Indisponível) e a thumbnail. Tudo é enviado num único `PATCH /api/videos/{publicId}` multipart, que o Route Handler BFF encaminha ao upstream sem reformatar. Os botões seguem o ciclo de vida: rascunho mostra "Salvar rascunho" e "Publicar"; vídeo publicado mostra "Salvar alterações" e "Despublicar"; com `status` diferente de `ready`, "Publicar" fica desabilitado. Vídeo de outro canal ou inexistente cai na página de não encontrado. Os textos estão em pt-BR.

## Test Scenarios

### 1. Editar e publicar um vídeo do canal

**Setup:** `next-frontend/tests/fixtures.ts` (MSW network fixture auto-applied; upstream faked server-side via `instrumentation.ts`, sem `page.route()` de `/api/**`). Triggers reservados por `publicId` nos handlers MSW do SI-04.8 (sem colidir com os das specs de auth e upload): `draft-video` → rascunho `ready` com título "Receita de bolo", categoria `Educação` e visibilidade pública; `published-video` → vídeo publicado; `processing-video` → `status` `processing` (já existente); `missing-video` → `404` (já existente); `foreign-video` → `403`. O `PATCH` responde com o vídeo atualizado refletindo os campos enviados. Todos os cenários autenticam antes pela UI de `/login` com `user@example.com`.

#### 1.1. mostra-os-dados-atuais-do-video

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Usuário navega para `/videos/draft-video/edit`
    - expect: o campo "TÍTULO" mostra "Receita de bolo" e o campo "DESCRIÇÃO" mostra a descrição atual
    - expect: o campo "CATEGORIA" mostra `Educação` e a lista oferece exatamente as oito categorias do TD-10 (Música, Jogos, Educação, Entretenimento, Notícias, Esportes, Tecnologia, Outros)
    - expect: o grupo "VISIBILIDADE" é um `radiogroup` com "Público" marcado e a opção "Indisponível"
    - expect: o card "Thumbnail atual" mostra a imagem devolvida pela API

#### 1.2. salva-rascunho-mantendo-o-como-rascunho

**Covers AC:** #2, #9
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Usuário edita o título para "Receita de bolo v2" e clica em "Salvar rascunho"
    - expect: dispara `PATCH /api/videos/draft-video` com `Content-Type` `multipart/form-data`
    - expect: o corpo enviado traz `title` "Receita de bolo v2" e não traz `published`
  2. O BFF responde
    - expect: o status e o corpo da resposta do BFF são os do upstream, sem reformatação
    - expect: a mensagem "Alterações salvas" aparece com `role="status"`
    - expect: os botões continuam "Salvar rascunho" e "Publicar"

#### 1.3. publica-e-passa-a-mostrar-despublicar

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Usuário em `/videos/draft-video/edit` clica em "Publicar"
    - expect: o `PATCH /api/videos/draft-video` leva o campo `published` com valor `true`
  2. O upstream responde com o vídeo publicado
    - expect: a mensagem "Vídeo publicado" aparece
    - expect: a tela passa a mostrar os botões "Salvar alterações" e "Despublicar" no lugar de "Salvar rascunho" e "Publicar"

#### 1.4. publicar-fica-desabilitado-sem-status-ready

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Usuário navega para `/videos/processing-video/edit`
    - expect: o botão "Publicar" está desabilitado, com um texto de apoio explicando que só fica disponível depois do processamento
    - expect: "Salvar rascunho" continua habilitado

#### 1.5. thumbnail-so-e-enviada-no-submit

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Usuário em `/videos/draft-video/edit` clica em "Alterar thumbnail" e escolhe um PNG de 100 KB
    - expect: o preview mostra o arquivo escolhido
    - expect: nenhuma requisição `PATCH /api/videos/draft-video` foi disparada ainda
  2. Usuário clica em "Salvar rascunho"
    - expect: o `PATCH /api/videos/draft-video` multipart inclui a parte `thumbnail` com o arquivo escolhido

#### 1.6. thumbnail-invalida-mostra-erro-no-uploader

**Covers AC:** #6
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Usuário escolhe um arquivo `.txt` como thumbnail
    - expect: aparece uma mensagem de erro sob o uploader, associada ao campo por `aria-describedby`
    - expect: o preview continua mostrando a thumbnail atual
  2. Usuário clica em "Salvar rascunho"
    - expect: nenhum `PATCH /api/videos/draft-video` é disparado com o arquivo inválido
    - expect: o vídeo não é alterado

#### 1.7. video-de-outro-canal-ou-inexistente

**Covers AC:** #7
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Usuário navega para `/videos/foreign-video/edit`
    - expect: a página de não encontrado é exibida e nada do vídeo aparece
  2. Usuário navega para `/videos/missing-video/edit`
    - expect: a página de não encontrado é exibida

#### 1.8. cancelar-e-voltar-levam-ao-painel

**Covers AC:** #8
**Source:** auto
**Last sync:** 2026-09-21T22:48:33Z

**Steps:**
  1. Usuário em `/videos/draft-video/edit` clica em "Cancelar"
    - expect: a URL final é `/channel/videos`
  2. Usuário volta a `/videos/draft-video/edit` e clica em "Voltar para o painel"
    - expect: a URL final é `/channel/videos`
