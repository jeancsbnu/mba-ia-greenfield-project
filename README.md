# StreamTube — Plataforma de Compartilhamento de Vídeos

Projeto da disciplina **Desenvolvimento de Aplicações de IA** do MBA de Engenharia de Software com IA da [Full Cycle](https://fullcycle.com.br).

Este é um projeto greenfield desenvolvido para demonstrar como construir uma aplicação do zero utilizando IA de forma adequada no processo de desenvolvimento.

## Professor

<a href="https://github.com/argentinaluiz">
    <img src="https://avatars.githubusercontent.com/u/4926329?v=4?s=100" width="100px;" alt=""/>
    <br />
    <sub>
        <b>Luiz Carlos</b>
    </sub>
</a>

---

## Quadro Branco

- [Quadro Branco](./whiteboard.png)

---

## 🎨 Design System (Figma)

- [FC Tube.fig](./FC%20Tube.fig) — arquivo-fonte do **design system** do projeto no Figma.

Contém os fundamentos visuais do StreamTube — tokens (cores, tipografia, espaçamento, raios), componentes e as telas da plataforma. É a referência de design para a implementação do frontend: os componentes em `next-frontend/components/ui` (shadcn) e os tokens em `next-frontend/app/globals.css` derivam deste arquivo. Abra-o no Figma (`Arquivo → Importar`) para consultar especificações e estados visuais.

---

## 📋 Pré-requisitos

- Docker e Docker Compose
- Node.js v25+ e npm (para rodar o Playwright no host)
- Google Chrome (só para a suíte full-stack: o Chromium do Playwright não decodifica o vídeo H.264/AAC)

## 🏗️ Arquitetura

O projeto é um monorepo baseado em containers Docker. Em desenvolvimento, cada subprojeto sobe sua própria stack via `docker compose`; em produção local, tudo sobe junto a partir do `compose.prod.yaml` da raiz.

- **Frontend** (Next.js 16, App Router + React Server Components) — interface da plataforma. Segue o **modelo BFF**: o navegador nunca chama a API NestJS diretamente; todo tráfego passa por Route Handlers same-origin em `app/api/**`, que fazem proxy server-side para a API.
- **API** (NestJS 11) — regras de negócio, autenticação (JWT + rotação de refresh token), upload resumível (protocolo tus), publicação de jobs na fila, envio de e-mails e acesso ao banco.
- **Video Worker** (NestJS + FFmpeg) — consome a fila, extrai a duração do vídeo, gera a thumbnail e atualiza banco e storage.
- **Database** (PostgreSQL 17) — usuários, canais, vídeos, comentários, reações e inscrições.
- **Object Storage** (MinIO, compatível com S3) — vídeos e thumbnails, servidos por URLs assinadas (streaming por range requests e download).
- **Message Queue** (BullMQ sobre Redis 7) — fila `video-processing`.
- **Email Service** (Mailpit) — captura os e-mails transacionais (confirmação de conta e recuperação de senha) numa UI local.

O diagrama de arquitetura completo (C4) está em `docs/diagrams/software-arch.mermaid`.

## 🚀 Como rodar

Os dois subprojetos têm stacks Docker **separadas**. Suba primeiro o backend, rode as migrations e depois o frontend.

### 1. Backend (API, worker, PostgreSQL, Redis, MinIO e Mailpit)

```bash
cd nestjs-project

# Sobe API, worker de vídeo, banco, Redis, MinIO e Mailpit
docker compose up -d

# Instala dependências (na primeira vez e depois de qualquer `down -v`)
docker compose exec nestjs-api npm ci

# Cria o schema do banco (obrigatório — synchronize está desabilitado)
docker compose exec nestjs-api npm run migration:run

# Sobe o servidor de desenvolvimento em watch mode (também gera o dist/ que o worker usa)
docker compose exec -d nestjs-api npm run start:dev

# Opcional: popula o banco com 5 contas, 10 vídeos reais, comentários e inscrições
docker compose exec nestjs-api npm run seed
```

O worker roda o código **compilado** em `dist/`, sem watch. Depois de mudar algo que o afete, recompile e reinicie:

```bash
docker compose exec nestjs-api npm run build
docker compose restart video-worker
```

Serviços disponíveis:

| Serviço | URL / Porta |
|---------|-------------|
| API NestJS | http://localhost:3000 |
| PostgreSQL | `localhost:5432` (db/user/senha: `streamtube`) |
| MinIO (API S3 / console) | http://localhost:9000 / http://localhost:9001 (user `streamtube`, senha `streamtube123`) |
| Redis | `localhost:6379` |
| Mailpit (UI de e-mails) | http://localhost:8025 |
| Swagger | http://localhost:3000/api/docs (ligado no compose de dev por `SWAGGER_ENABLED`) |

As contas do seed são `ana`, `bruno`, `carla`, `diego` e `elisa` `@streamtube.dev`, todas com a senha `streamtube123`.

### 2. Frontend (Next.js)

Crie o `next-frontend/.env.local` (ignorado pelo git) com as chaves validadas em `lib/env.ts`:

```bash
API_URL=http://host.docker.internal:3000            # backend, visto de dentro do container
SESSION_PASSWORD=troque-por-um-segredo-com-32-chars # iron-session, mínimo de 32 caracteres
INTERNAL_API_SECRET=dev-internal-api-secret-change-in-production  # o mesmo do backend
```

```bash
cd next-frontend
docker compose up -d
docker compose exec next-frontend npm ci             # na primeira vez e depois de qualquer `down -v`
docker compose exec -d next-frontend npm run dev
```

A aplicação ficará disponível em **http://localhost:3001**.

> As stacks são separadas, então o frontend acessa o backend via `host.docker.internal:3000` (configurado no `.env.local` e no `extra_hosts` do compose). O `INTERNAL_API_SECRET` precisa ser o mesmo nos dois lados: é com ele que a API confia no IP do visitante que o BFF repassa para o rate limiting.

## 🏭 Stack de produção local

A plataforma inteira em modo de produção — imagens compiladas da API, do worker e do BFF, migrations aplicadas por um serviço one-off e o Caddy na borda — sobe a partir do `compose.prod.yaml` da raiz. Ela roda **só no Docker local**: não há servidor externo nem roteiro de deploy.

```bash
# 1. Crie o arquivo de segredos (ignorado pelo git) e troque os valores de exemplo
cp .env.production.example .env.production

# 2. Construa as imagens e suba a stack
docker compose -f compose.prod.yaml --env-file .env.production up -d --build

# Estado dos serviços: api "healthy", migrate "Exited (0)", os demais em execução
docker compose -f compose.prod.yaml --env-file .env.production ps -a

# Logs de um serviço (api, worker, bff, caddy, migrate…)
docker compose -f compose.prod.yaml --env-file .env.production logs -f api

# 3. Derrube (acrescente -v para apagar também os volumes do banco e do MinIO)
docker compose -f compose.prod.yaml --env-file .env.production down
```

| O quê | Endereço (padrão) | Variável |
|---|---|---|
| Aplicação | http://localhost:8088 | `APP_PORT` |
| Storage (vídeos e thumbnails, URLs assinadas) | http://localhost:9200 | `STORAGE_PORT` |
| E-mails capturados (UI e API do Mailpit) | http://localhost:8125 | `MAILPIT_PORT` |

As portas padrão não colidem com as dos compose de desenvolvimento, então as duas coisas podem rodar ao mesmo tempo. A API, o banco, o Redis, o MinIO e o BFF ficam só na rede interna.

**Limites assumidos:**

- **Só a partir da própria máquina.** A stack é servida em HTTP em `localhost`, sem TLS. O cookie de sessão é `secure` em produção e os navegadores só o aceitam em HTTP porque `localhost` conta como contexto seguro; por IP da rede local o login não funciona.
- **Sem backup.** Não há serviço de backup; perder os volumes do Docker (`down -v`) apaga contas e vídeos.
- **E-mails não são entregues.** O Mailpit captura todo e-mail (confirmação de conta, recuperação de senha); leia-os na UI dele. O link de confirmação leva a `/login` depois de confirmar a conta.

## 🧪 Testes

### Backend (Jest)

```bash
cd nestjs-project
docker compose exec nestjs-api npm test -- --runInBand  # unitários + integração
docker compose exec nestjs-api npm run test:e2e         # end-to-end (HTTP via supertest)
docker compose exec nestjs-api npm run test:cov         # cobertura
```

Sufixos: `*.spec.ts` (unitário), `*.integration-spec.ts` (integração com banco, Redis e MinIO reais), `*.e2e-spec.ts` (end-to-end). Os testes usam recursos próprios (banco `streamtube_test`, bucket `videos-test` e outro índice do Redis), então não tocam nos dados de desenvolvimento. Rode as suítes uma de cada vez.

### Frontend (Vitest + Playwright)

```bash
cd next-frontend
docker compose exec next-frontend npm test             # unitários + integração (Vitest + MSW)

# end-to-end (no host), com o dev server em modo MSW
docker compose exec -d next-frontend sh -c "MSW_ENABLED=true npm run dev"
npx playwright test
```

Sufixos: `*.test.ts(x)` (unitário), `*.integration.test.ts(x)` (Route Handlers com MSW), `*.e2e-spec.ts` (Playwright). O MSW intercepta as chamadas à API NestJS — esses testes nunca batem no backend real.

### Suíte full-stack (Playwright contra a stack real)

```bash
cd next-frontend
npm run test:fullstack
```

Sobe um projeto Compose próprio (`streamtube-fullstack`, a partir do `compose.prod.yaml`, em outras portas e com volumes zerados), percorre seis jornadas — cadastro → confirmação pelo e-mail no Mailpit → login/logout; recuperação de senha pelo link do e-mail; upload → processamento → publicação; assistir com view contada; like, comentário e inscrição; home, busca e categoria — e derruba tudo no fim. Não toca na stack de produção local nem nos compose de desenvolvimento.

### CI

Todo pull request roda no GitHub Actions:

- `.github/workflows/ci.yml` — jobs `backend` (testes, e2e, `tsc` e lint), `frontend` (Vitest, `tsc` e lint), `frontend-e2e` (Playwright com MSW) e `fullstack` (a suíte acima).
- `.github/workflows/openapi-freshness.yml` — falha se o `openapi.json` versionado ou os tipos gerados no frontend estiverem desatualizados em relação à API.

## ✅ Funcionalidades implementadas

As sete fases do `docs/project-plan.md` foram implementadas, com as lacunas listadas em **Lacunas conhecidas**, mais abaixo.

### Conta e autenticação (Fase 02)

- Cadastro com e-mail e senha (Argon2), com canal criado automaticamente a partir do prefixo do e-mail.
- Confirmação obrigatória da conta pelo link enviado por e-mail; o login é recusado até lá.
- Login, sessão e logout. O BFF guarda os tokens num cookie **iron-session** (HTTP-only) e eles nunca chegam ao navegador; o access token é renovado com **rotação de refresh token** e detecção de reuso.
- Recuperação de senha: pedido por e-mail → link com token de uso único → tela de nova senha (`/auth/reset-password`).
- **Rate limiting** por visitante: o BFF repassa o IP real à API num header autenticado por segredo compartilhado.

### Upload e processamento (Fase 03)

- Upload **resumível** de até **10 GB** pelo protocolo tus, em pedaços de 5 MB, gravado no MinIO.
- O vídeo nasce como rascunho com uma URL curta e única (`/videos/{publicId}`) assim que o upload começa.
- Processamento em segundo plano pela fila: duração (ffprobe) e thumbnail gerada de um frame (ffmpeg); a tela de upload acompanha o status até ficar pronto e leva à edição.
- Reprodução por **streaming** (URLs assinadas do MinIO, com range requests) e download do arquivo.

### Gerenciamento de vídeos e canal (Fase 04)

- Edição de título, descrição, categoria (8 categorias) e thumbnail customizada.
- Visibilidade **pública** ou **unlisted** e fluxo de rascunho → publicação.
- Painel "Meus vídeos" com thumbnail, título, visualizações, likes, comentários, data de publicação e status, com paginação e acesso à edição.
- Edição do canal: nickname, nome e descrição.
- Página pública do canal em `/@{nickname}`, com informações, inscritos e a lista paginada de vídeos.

### Página do vídeo (Fase 05)

- Player com os controles nativos do navegador (play/pause, volume, barra de progresso).
- Informações do vídeo, descrição que expande e recolhe, e botão de download.
- Contagem de visualizações (registrada depois de 5 s de reprodução).
- Sugestões da mesma categoria na lateral, com "carregar mais".
- Acesso anônimo; vídeos unlisted só abrem pelo link direto e não aparecem em listagens.

### Interações sociais (Fase 06)

- Like e dislike em vídeos e em comentários.
- Comentários com respostas (um nível de aninhamento: responder a uma resposta vai para o mesmo fio).
- Inscrição em canais, contagem de inscritos e a área "Canais seguidos".
- Visitantes anônimos veem tudo e, ao tentar interagir, são levados ao login e trazidos de volta ao vídeo.

### Página inicial, busca e produção (Fase 07)

- Home com grade de vídeos (thumbnail, título, canal, visualizações e tempo de publicação), filtro por categoria e paginação.
- Busca por título ou canal, sem diferenciar acentos, na página `/results`.
- Navbar com logo, busca, login/avatar e navegação, e menu lateral no celular.
- Layout responsivo em todas as telas.
- Suíte full-stack, CI e **stack de produção local** com Caddy (veja acima).

### Telas

| Rota | Tela |
|------|------|
| `/` | Página inicial (`?category=`, `?page=`) |
| `/results?q=` | Resultados da busca |
| `/videos/{publicId}` | Página do vídeo |
| `/@{nickname}` | Página pública do canal |
| `/signup`, `/login`, `/forgot-password` | Cadastro, login e pedido de recuperação de senha |
| `/auth/reset-password?token=` | Nova senha (destino do link do e-mail) |
| `/upload` | Envio de vídeo *(autenticada)* |
| `/channel/videos` | Meus vídeos *(autenticada)* |
| `/videos/{publicId}/edit` | Edição e publicação do vídeo *(autenticada)* |
| `/channel/settings` | Edição do canal *(autenticada)* |
| `/channel/subscriptions` | Canais seguidos *(autenticada)* |

### Endpoints da API (`nestjs-project`)

| Área | Endpoints |
|------|-----------|
| Autenticação | `POST /auth/register`, `GET /auth/confirm-email`, `POST /auth/resend-confirmation`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/me` |
| Meu canal | `GET /me/channel`, `PATCH /me/channel`, `GET /me/videos`, `GET /me/subscriptions` |
| Canais | `GET /channels/:nickname`, `GET /channels/:nickname/videos`, `PUT` e `DELETE /channels/:nickname/subscription` |
| Vídeos | `GET /videos` (feed, `?category`, `?q`), `GET` e `PATCH /videos/:publicId`, `GET /videos/:publicId/public`, `POST /videos/:publicId/view`, `GET /videos/:publicId/suggestions`, `GET /videos/:publicId/stream`, `GET /videos/:publicId/download`, `PUT` e `DELETE /videos/:publicId/reaction` |
| Upload (tus) | `POST`, `PATCH`, `HEAD`, `DELETE` em `/videos/upload` |
| Comentários | `GET` e `POST /videos/:publicId/comments`, `GET /comments/:commentId/replies`, `PUT` e `DELETE /comments/:commentId/reaction` |
| Infra | `GET /health` |

A documentação interativa (Swagger) fica em `/api/docs` no ambiente de desenvolvimento.

## ⚠️ Lacunas conhecidas

- **Confirmação de conta sem tela própria.** O link do e-mail passa por uma rota de ponte do BFF (`/auth/confirm-email`) que confirma a conta e redireciona para `/login`, sem mensagem de sucesso ou erro.
- **Reenvio de confirmação sem tela.** A API tem `POST /auth/resend-confirmation`, mas o link "reenviar" do login aponta para `/resend-confirmation`, que não existe.
- **Edição do canal sem link.** A tela `/channel/settings` funciona, mas só se chega a ela digitando a URL.
- **Termos de uso e privacidade.** O checkbox do cadastro aponta para `/terms` e `/privacy`, que não existem.
- **Sem foto de perfil.** Os avatares mostram só as iniciais.
- **Tipo dos arquivos de mídia.** Os vídeos são gravados no storage sem `Content-Type` (servidos como `binary/octet-stream`); os navegadores reproduzem mesmo assim.
- **Produção só local.** Não há deploy externo; veja os limites em **Stack de produção local**, acima.

## 🛠️ Estrutura do Projeto

```
mba-ia-greenfield-project/
├── .claude/                             # Fundação de IA: rules, agents e skills do pipeline de planejamento
├── .github/workflows/                   # CI (ci.yml) e frescor do contrato OpenAPI
├── deploy/Caddyfile                     # Borda da stack de produção local
├── compose.prod.yaml                    # Stack de produção local (Docker)
├── .env.production.example              # Modelo dos segredos de produção
├── docs/
│   ├── project-plan.md                  # Planejamento geral do projeto
│   ├── decisions/                       # Decisões técnicas (TDs) por fase e por tarefa
│   ├── inventories/                     # Inventários de telas (Figma ↔ código)
│   ├── phases/                          # Contexto, validação, plano e progresso de cada fase
│   ├── tasks/                           # Tarefas avulsas (fora das fases)
│   └── diagrams/software-arch.mermaid   # Diagrama de arquitetura (C4)
├── nestjs-project/                      # Backend (NestJS 11)
│   ├── src/
│   │   ├── auth/                        # Cadastro, login, JWT, refresh, reset de senha, throttler
│   │   ├── users/                       # Usuários
│   │   ├── channels/                    # Canal 1:1 por usuário, página pública e edição
│   │   ├── videos/                      # Upload tus, processamento, feed, busca, edição, views
│   │   ├── comments/                    # Comentários e respostas
│   │   ├── reactions/                   # Likes e dislikes (vídeos e comentários)
│   │   ├── subscriptions/               # Inscrições em canais
│   │   ├── storage/                     # Cliente S3 do MinIO e URLs assinadas
│   │   ├── queue/                       # Fila BullMQ (Redis)
│   │   ├── mail/                        # E-mails (templates Handlebars)
│   │   ├── health/                      # GET /health
│   │   ├── swagger/                     # Documento OpenAPI
│   │   ├── common/                      # Filtros, pipes e exceptions de domínio
│   │   ├── config/                      # Configs namespaced (Joi)
│   │   ├── database/                    # data-source, migrations e seed
│   │   ├── main.ts                      # Entrada da API
│   │   └── worker.main.ts               # Entrada do worker de vídeo
│   ├── test/                            # Testes e2e
│   ├── openapi.json                     # Contrato da API (versionado)
│   ├── compose.yaml                     # Stack de desenvolvimento
│   ├── Dockerfile                       # Imagem de produção (API e worker)
│   └── Dockerfile.dev
├── next-frontend/                       # Frontend (Next.js 16, App Router)
│   ├── app/                             # Rotas: (auth), (site), (studio) e Route Handlers BFF em api/
│   ├── components/                      # Componentes por domínio, UI (shadcn) e ícones
│   ├── hooks/                           # Hooks de interação (reações, inscrição…)
│   ├── lib/                             # env, cliente da API (openapi-fetch), sessão
│   ├── mocks/                           # MSW (handlers + server)
│   ├── tests/                           # E2E (Playwright + MSW)
│   ├── fullstack/                       # Suíte full-stack (Playwright contra a stack real)
│   ├── compose.yaml                     # Stack de desenvolvimento
│   ├── Dockerfile                       # Imagem de produção (Next standalone)
│   └── Dockerfile.dev
├── CLAUDE.md                            # Instruções para IA
├── FC Tube.fig                          # Design system do projeto (Figma)
├── whiteboard.png                       # Quadro branco do projeto
└── README.md
```

## 📚 Fases do Projeto

| Fase | Descrição | Status |
|------|-----------|--------|
| **01** | Configuração Base do Projeto | ✅ Concluída |
| **02** | Cadastro, Login e Gerenciamento de Conta | ✅ Concluída — sem a tela de confirmação de conta |
| **03** | Upload e Processamento de Vídeos | ✅ Concluída |
| **04** | Gerenciamento de Vídeos e Canal | ✅ Concluída |
| **05** | Página de Visualização do Vídeo | ✅ Concluída |
| **06** | Interações Sociais (Likes, Comentários, Inscrições) | ✅ Concluída |
| **07** | Página Inicial, Busca e Finalização | ✅ Concluída — produção só em Docker local |

Detalhes do escopo em `docs/project-plan.md`; o plano, as decisões e o progresso de cada fase ficam em `docs/phases/` e `docs/decisions/`.

## 📖 Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui (Radix), React Hook Form + Zod, iron-session, openapi-fetch + openapi-typescript, tus-js-client |
| Backend | NestJS 11, TypeScript, TypeORM, JWT, Argon2, Swagger, Throttler, Mailer (Handlebars) |
| Vídeo | BullMQ, @tus/server + @tus/s3-store, AWS SDK S3, ffmpeg-static + ffprobe-static |
| Banco de Dados | PostgreSQL 17 |
| Fila | Redis 7 |
| Storage | MinIO (imagem da Chainguard) |
| E-mail | Mailpit |
| Containerização | Docker, Docker Compose, Caddy (produção local) |
| Testes | Jest, Supertest (backend); Vitest, Testing Library, MSW, Playwright (frontend) |
| Qualidade | ESLint, Prettier, GitHub Actions |
