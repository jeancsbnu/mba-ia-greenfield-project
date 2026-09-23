# StreamTube — Atividades Pendentes

Baseado no `README.md` e `docs/project-plan.md`. As Fases 01 e 02 estão concluídas. Este documento cobre o trabalho restante.

---

## Status Atual

| Fase | Descrição | Status |
|------|-----------|--------|
| 01 | Configuração Base | ✅ Concluída |
| 02 | Autenticação (backend + frontend) | ✅ Concluída |
| 03 | Upload e Processamento de Vídeos | ⏳ Pendente |
| 04 | Gerenciamento de Vídeos e Canal | ⏳ Pendente |
| 05 | Página de Visualização do Vídeo | ⏳ Pendente |
| 06 | Interações Sociais | ⏳ Pendente |
| 07 | Página Inicial, Busca e Finalização | ⏳ Pendente |

---

## Fase 03 — Upload e Processamento de Vídeos

> Depende de: Fases 01 e 02

### Infraestrutura

- [ ] Subir MinIO (Object Storage S3-compatível) via Docker Compose
- [ ] Subir serviço de filas (ex: RabbitMQ ou BullMQ com Redis) via Docker Compose
- [ ] Subir Video Worker com FFmpeg via Docker Compose

### Backend (NestJS)

- [ ] Módulo de vídeos: entidade `Video` com campos (id, título, descrição, status, duração, URL, thumbnail, categoria, visibilidade, canal)
- [ ] Endpoint de upload multipart (`POST /videos/upload`) — recebe arquivo e inicia pré-cadastro como rascunho
- [ ] Integração com MinIO para armazenar o arquivo de vídeo
- [ ] Publicar job de processamento na fila após upload concluído
- [ ] Video Worker: consumir job, extrair metadados com FFmpeg (duração, resolução, codec)
- [ ] Video Worker: gerar thumbnail automática a partir de um frame do vídeo
- [ ] Video Worker: atualizar status e metadados do vídeo no banco após processamento
- [ ] Geração de URL única por vídeo (ex: nanoid curto, sem colisão)
- [ ] Endpoint de streaming (`GET /videos/:id/stream`) com suporte a `Range` headers
- [ ] Endpoint de download (`GET /videos/:id/download`)
- [ ] Migrations para a entidade `Video`
- [ ] Testes unitários, de integração e e2e dos novos endpoints

### Frontend (Next.js)

- [ ] Tela de upload de vídeo com progress bar para arquivos grandes (até 10GB)
- [ ] Feedback em tempo real do progresso de processamento (polling ou WebSocket)
- [ ] Route Handler BFF para proxy do upload (`app/api/videos/upload`)

---

## Fase 04 — Gerenciamento de Vídeos e Canal

> Depende de: Fases 02 e 03

### Backend (NestJS)

- [ ] Entidade/tabela de `Category` com seed de categorias iniciais
- [ ] Endpoints de edição do vídeo: título, descrição, categoria, thumbnail customizada
- [ ] Endpoint de controle de visibilidade: público / unlisted
- [ ] Endpoint de publicação do vídeo (rascunho → publicado)
- [ ] Endpoints de listagem de vídeos do canal autenticado (com filtros de status)
- [ ] Endpoints de edição do canal: nickname, nome, descrição
- [ ] Endpoint de página pública do canal (`GET /channels/:nickname`) com vídeos publicados
- [ ] Testes unitários, de integração e e2e

### Frontend (Next.js)

- [ ] Painel de gerenciamento de vídeos do canal (thumbnail, título, visualizações, likes, comentários, data, status)
- [ ] Tela de edição de vídeo (acessível a partir do painel)
- [ ] Controle de visibilidade e publicação na tela de edição
- [ ] Tela de edição do canal (nickname, nome, descrição)
- [ ] Página pública do canal com informações e listagem de vídeos

---

## Fase 05 — Página de Visualização do Vídeo

> Depende de: Fases 03 e 04

### Backend (NestJS)

- [ ] Endpoint `GET /videos/:id` — retorna dados completos do vídeo para a página
- [ ] Incremento de contagem de visualizações (`views`) ao acessar o vídeo
- [ ] Endpoint de sugestões: vídeos da mesma categoria (`GET /videos/:id/suggestions`)
- [ ] Vídeos unlisted: acessíveis via link direto, fora de listagens públicas
- [ ] Testes para os novos endpoints

### Frontend (Next.js)

- [ ] Página de visualização (`/watch/[id]`) com player HTML5 nativo (play/pause, volume, barra de progresso)
- [ ] Layout: vídeo principal + informações (título, canal, visualizações, data) + sidebar de sugestões
- [ ] Descrição expansível/recolhível
- [ ] Contagem de visualizações exibida
- [ ] Sidebar com sugestões de vídeos da mesma categoria
- [ ] Botão de download do vídeo
- [ ] Acesso anônimo (sem necessidade de login para assistir)

---

## Fase 06 — Interações Sociais (Likes, Comentários, Inscrições)

> Depende de: Fases 02 e 05

### Backend (NestJS)

- [ ] Entidade `VideoLike` (like/dislike em vídeos) — um registro por usuário por vídeo
- [ ] Endpoints `POST /videos/:id/like` e `POST /videos/:id/dislike`
- [ ] Entidade `Comment` com suporte a comentários aninhados (parent_id)
- [ ] Endpoints CRUD de comentários (`POST /videos/:id/comments`, `DELETE /comments/:id`)
- [ ] Entidade `CommentLike` (like/dislike em comentários)
- [ ] Endpoints de like/dislike em comentários
- [ ] Entidade `Subscription` (inscrição em canal)
- [ ] Endpoints `POST /channels/:id/subscribe` e `DELETE /channels/:id/subscribe`
- [ ] Endpoint de listagem de canais seguidos pelo usuário autenticado
- [ ] Contagem de inscritos no canal
- [ ] Proteção: todos os endpoints de interação exigem autenticação
- [ ] Testes unitários, de integração e e2e

### Frontend (Next.js)

- [ ] Botões de like/dislike na página de visualização (usuários autenticados)
- [ ] Seção de comentários com listagem, criação e respostas
- [ ] Like/dislike em comentários
- [ ] Botão de inscrição/cancelamento na página do canal e na página de visualização
- [ ] Contagem de inscritos exibida
- [ ] Área "Canais seguidos" com acesso rápido

---

## Fase 07 — Página Inicial, Busca e Finalização

> Depende de: todas as fases anteriores

### Backend (NestJS)

- [ ] Endpoint de listagem de vídeos públicos para a home (`GET /videos`) com paginação
- [ ] Filtro por categoria na listagem
- [ ] Endpoint de busca (`GET /videos/search?q=`) por título e canal
- [ ] Ajustes de performance e índices no banco de dados
- [ ] Testes dos fluxos principais

### Frontend (Next.js)

- [ ] Home page (`/`) com grid de vídeos (thumbnail, título, canal, visualizações, tempo)
- [ ] Filtro de vídeos por categoria na home
- [ ] Barra de busca com resultados em `/search?q=`
- [ ] Header/navbar: logo, barra de busca, botão de login/avatar e navegação principal
- [ ] Paginação ou scroll infinito nas listagens
- [ ] Layout responsivo para mobile
- [ ] Testes E2E (Playwright) dos fluxos principais (cadastro, login, upload, visualização, interação)

### Infraestrutura / DevOps

- [ ] Configurar ambiente de produção (variáveis de ambiente, secrets)
- [ ] Configurar deploy (CI/CD ou manual)
- [ ] Revisar e documentar todo o processo de setup no README

---

## Pontos de Atenção Técnicos

| Ponto | Detalhe |
|-------|---------|
| **Upload grandes** | Multipart upload — não bloqueia o servidor; deve suportar retomada em falha |
| **Processamento assíncrono** | Video Worker em background via fila — nunca bloqueia o usuário |
| **URLs únicas** | Usar nanoid (curto, sem colisão) — não expor IDs sequenciais |
| **Streaming** | Suporte a `Range` headers no endpoint de stream (necessário para o player HTML5) |
| **Comentários aninhados** | Definir profundidade máxima (ex: 2 níveis) para manter a UI limpa |
| **Like/dislike** | Um registro por usuário por vídeo/comentário — prevenir duplicidade no banco |
| **Unlisted** | Vídeos unlisted: acessíveis via link, excluídos de buscas e listagens públicas |
| **Acesso anônimo** | Rotas de visualização públicas com opt-out do `JwtAuthGuard` via `@Public()` |
