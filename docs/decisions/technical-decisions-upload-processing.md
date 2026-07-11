---
scope_type: phase
related_phases: [3]
status: decided
date: 2026-07-03
scope_description: "Armazenamento de objetos, fila de processamento em segundo plano, upload resumível de até 10GB, Video Worker (FFmpeg) e entrega de vídeo (streaming/download) para a Fase 03 — Upload e Processamento de Vídeos."
---

# Technical Decisions — Upload e Processamento de Vídeos (Fase 03)

_Subprojects in scope:_

- `nestjs-project/` — recebe o módulo `Video` (entidade, migrations, endpoints de upload/stream/download), a integração com o serviço de storage e a fila, e o Video Worker (novo processo dentro do subprojeto).
- `next-frontend/` — recebe a tela de upload com progress bar, o consumo do feedback de progresso de processamento, e o player que consome a URL de streaming.

---

## TD-01: Serviço de armazenamento de objetos (vídeos e thumbnails)

**Scope:** Backend

**Capability:** Serviço de armazenamento de arquivos (vídeos e thumbnails)

**Context:** O diagrama de arquitetura (`docs/diagrams/software-arch.mermaid`) já modela um container "Object Storage (S3 ou MinIO)", mas não decide entre os dois. Hoje não há nenhuma lib de storage instalada em `nestjs-project` (`package.json` não tem `@aws-sdk/client-s3`, `minio`, nem equivalente).

**Options:**

### Option A: MinIO (self-hosted, S3-compatible)
- Roda como container no `docker compose` do `nestjs-project`, sem custo e sem conta externa.
- É compatível com o cliente oficial `@aws-sdk/client-s3` (basta apontar o `endpoint` para o serviço `minio` e usar `forcePathStyle: true`) — o mesmo código funcionaria contra AWS S3 real em produção só trocando variáveis de ambiente.
- **Pros:** zero custo em dev, 100% Docker (consistente com o restante do projeto), path de migração para S3 real sem reescrever código.
- **Cons:** mais um serviço para subir e manter localmente; console de administração próprio a aprender.

### Option B: AWS S3 direto
- Usa o mesmo `@aws-sdk/client-s3`, mas contra a AWS de verdade — exige conta, credenciais e custo por armazenamento/egress mesmo em desenvolvimento.
- **Pros:** ambiente de dev já "igual" a produção.
- **Cons:** custo e dependência de credenciais reais só para rodar o projeto localmente; nenhum outro serviço do projeto depende de conta AWS hoje.

### Option C: Disco local (volume Docker, sem serviço de storage)
- Vídeos gravados diretamente num volume montado no container da API.
- **Pros:** nenhuma dependência nova.
- **Cons:** não representa um "serviço de armazenamento de arquivos" real (a fase pede isso explicitamente), não escala para múltiplas réplicas do worker/API, e não gera URLs pré-assinadas para streaming/download (bloqueia TD-08).

**Recommendation:** Option A (MinIO) — é o único caminho gratuito e 100%-Docker (consistente com a filosofia do projeto — tudo roda em containers, "Docker Networking" no `CLAUDE.md` raiz), habilita o mesmo código de acesso a objetos que funcionaria em S3 real depois, e evita introduzir uma dependência de conta externa só para rodar localmente.

**Decision:** A (MinIO)
**Libraries:** @aws-sdk/client-s3

---

## TD-02: Fila de processamento em segundo plano

**Scope:** Backend

**Capability:** Serviço de processamento em segundo plano (filas)

**Context:** O diagrama de arquitetura lista "Message Queue" como `TBD`. Nenhuma lib de fila está instalada hoje. A fila recebe o job de processamento publicado pela API após o upload e o worker (TD-05) o consome.

**Options:**

### Option A: BullMQ + Redis
- Fila baseada em Redis, integração de primeira classe com NestJS (`@nestjs/bullmq`), retries e eventos de progresso de job prontos para uso (útil para TD-09).
- **Pros:** documentação e exemplos abundantes especificamente para pipelines de processamento de vídeo; API madura de retry/progress; Redis é leve de rodar em dev.
- **Cons:** adiciona Redis como nova peça de infraestrutura ao `docker compose`.

### Option B: RabbitMQ + amqplib
- Broker de mensagens genérico, com roteamento mais sofisticado (exchanges/routing keys) e suporte nativo a consumidores em outras linguagens.
- **Pros:** mais "enterprise", útil se um worker em outra stack for necessário no futuro.
- **Cons:** roteamento avançado é recurso não usado neste projeto (1 produtor Node, 1 consumidor Node); integração com NestJS menos direta que BullMQ para o caso de uso de job queue simples.

### Option C: pg-boss (fila sobre o PostgreSQL já existente)
- Usa a tabela do Postgres já provisionado pelo projeto como fila, sem novo serviço de infraestrutura.
- **Pros:** zero infraestrutura nova — reaproveita o Postgres que já roda desde a Fase 01.
- **Cons:** throughput e ferramentas de observabilidade de fila mais limitados que Redis/RabbitMQ; acopla a fila ao mesmo banco transacional da aplicação (jobs pesados de vídeo competem por I/O com o banco principal).

**Recommendation:** Option A (BullMQ + Redis) — integração NestJS mais direta, eventos de progresso de job nativos (alimentam TD-09 sem trabalho extra), e é o padrão mais citado especificamente para pipelines de transcodificação/processamento de vídeo em Node.js.

**Decision:** A (BullMQ + Redis)
**Libraries:** bullmq, @nestjs/bullmq, ioredis

---

## TD-03: Estratégia de upload de arquivos grandes (até 10GB)

**Scope:** Cross-layer

**Capability:** Upload de vídeos com suporte a arquivos de até 10GB sem impacto na performance

**Context:** `project-plan.md` § "Pontos de Atenção" exige explicitamente que o upload "permita retomar em caso de falha de conexão" — não é só uma questão de tamanho, é resiliência de rede. Essa decisão define tanto o endpoint/protocolo no backend quanto o cliente de upload no frontend (por isso é Cross-layer, não duas TDs separadas). Depende de TD-01 (onde os bytes acabam armazenados).

**Options:**

### Option A: Protocolo tus (upload resumível por chunks)
- Servidor tus (`tus-node-server`, com `S3Store`/adaptador para MinIO) expõe um endpoint que aceita chunks e rastreia offset; cliente (`tus-js-client` ou Uppy) retoma automaticamente de onde parou após queda de conexão.
- **Pros:** resolve exatamente o requisito de "retomar em caso de falha" citado no plano; adotado por Cloudflare Stream e Vimeo para uploads de vídeo grandes; funciona bem acima de 200MB (caso de 10GB é o caso extremo que o tus foi desenhado para resolver).
- **Cons:** exige um servidor compatível com o protocolo tus (não é um POST arbitrário) e uma lib cliente dedicada no frontend.

### Option B: Multipart/form-data simples (uma requisição, `Multer`)
- Upload inteiro em uma única requisição HTTP multipart, processada por `Multer` (nativo do Express/NestJS).
- **Pros:** mais simples de implementar, sem lib nova no cliente.
- **Cons:** qualquer queda de conexão no meio de um arquivo de 10GB obriga reenviar tudo do zero — viola diretamente o requisito de retomada do `project-plan.md`.

### Option C: Upload direto para o storage via URL pré-assinada multipart (S3 Multipart Upload)
- API gera uma URL (ou conjunto de URLs, uma por parte) pré-assinada; o navegador envia os bytes direto para o MinIO, sem passar pela API.
- **Pros:** tira o tráfego de bytes do processo Node por completo.
- **Cons:** implementar retomada exige orquestrar manualmente o ciclo de vida do S3 Multipart Upload (list parts, complete/abort) no frontend — reinventa boa parte do que o protocolo tus já resolve pronto.

**Recommendation:** Option A (tus) — é a única opção que atende ao requisito explícito de retomada de upload do `project-plan.md` sem reimplementar controle de offset manualmente; é o padrão de mercado citado por serviços de vídeo (Cloudflare, Vimeo) para exatamente este cenário (arquivos grandes, conexões não confiáveis).

**Decision:** A (tus)
**Libraries:** tus-node-server, tus-js-client

---

## TD-04: Momento do pré-cadastro do vídeo como rascunho

**Scope:** Backend

**Capability:** Pré-cadastro automático do vídeo como rascunho ao iniciar o upload

**Context:** O texto do plano diz literalmente "ao iniciar o upload" — ou seja, o registro do vídeo (`status: draft`) deve existir antes dos bytes terminarem de chegar. Depende de TD-03: se o protocolo escolhido for tus, o hook natural é o `pre-create`/`post-create` do servidor tus.

**Options:**

### Option A: Criar o registro no hook de criação da sessão de upload (tus `pre-create`)
- No exato momento em que o cliente abre a sessão de upload (antes do primeiro byte), a API cria a linha `Video` com `status: draft` e associa o `upload_id` do tus a ela.
- **Pros:** cumpre literalmente "ao iniciar o upload"; a linha existe mesmo que a conexão caia logo depois (permitindo retomar e reconciliar depois).
- **Cons:** nenhum relevante — é a leitura mais direta do requisito.

### Option B: Criar o registro somente após o upload ser concluído
- **Pros:** mais simples (menos estados intermediários).
- **Cons:** contradiz o texto do plano ("ao iniciar", não "ao concluir"); um upload que falha no meio nunca vira rascunho visível ao usuário.

### Option C: Criar o registro quando o usuário submete o formulário de metadados (título/descrição), antes de abrir a sessão de upload
- **Pros:** garante que todo vídeo tem metadados mínimos desde o primeiro instante.
- **Cons:** exige dois passos de UI antes do upload começar (formulário → depois upload), mais fricção do que o fluxo "arrastar arquivo e já começa" implícito no plano.

**Recommendation:** Option A — é a leitura literal do requisito do plano e se encaixa naturalmente no hook `pre-create` do protocolo tus escolhido em TD-03.

**Decision:** A (hook pre-create do tus)
**Libraries:** —

---

## TD-05: Arquitetura de deployment do Video Worker

**Scope:** Repo-wide

**Capability:** Processamento automático do vídeo após upload (extração de duração e metadados)

**Context:** O diagrama de arquitetura modela "Video Worker (FFmpeg)" como um container próprio, distinto da API. Isso é uma decisão de estrutura de monorepo: criar ou não um terceiro subprojeto (hoje só existem `nestjs-project/` e `next-frontend/`). Depende de TD-02 (a lib de fila escolhida define como o worker consome jobs).

**Options:**

### Option A: Novo subprojeto `video-worker/` (processo Node independente)
- Diretório próprio na raiz, com seu `package.json`, `Dockerfile` e serviço dedicado no compose; consome jobs da fila e fala com o mesmo Postgres/MinIO da API.
- **Pros:** isolamento total (deploy, dependências e escala independentes da API).
- **Cons:** duplica configuração (TypeORM, variáveis de ambiente, config namespaces) que já existe em `nestjs-project/` — mais fricção de manutenção para um projeto didático de MBA.

### Option B: Entry point separado dentro de `nestjs-project/` (sem HTTP, mesmo código-fonte)
- Um `src/worker.main.ts` que sobe um `NestApplicationContext` (sem Express/HTTP), reaproveitando os mesmos módulos (`TypeOrmModule`, entidades, config namespaces) já existentes; roda como um segundo `command` no mesmo container/imagem, ou um segundo serviço no `compose.yaml` do `nestjs-project` apontando para o mesmo build.
- **Pros:** zero duplicação de configuração/entidades; reaproveita 100% do padrão de módulos já estabelecido (`nestjs-best-practices`); menos peças móveis num projeto de curso.
- **Cons:** menos isolamento de deploy do que um subprojeto totalmente separado (mas isso não é um requisito citado no plano).

### Option C: Processor do BullMQ rodando dentro do mesmo processo da API (sem serviço separado)
- Nenhum processo novo — a própria API roda o `@Processor` do BullMQ.
- **Pros:** o mais simples possível.
- **Cons:** processamento de vídeo (FFmpeg) é CPU-intensivo e bloquearia/competiria com o event loop que também atende requisições HTTP da API — contradiz a premissa de "processamento em segundo plano" citada explicitamente como capability separada da fase, e o próprio diagrama de arquitetura já separa Video Worker da API como containers distintos.

**Recommendation:** Option B — mantém a separação de processos exigida pelo diagrama de arquitetura (worker distinto da API) sem pagar o custo de duplicar toda a configuração de banco/entidades/env em um terceiro subprojeto, o que é desproporcional para o escopo do curso.

**Decision:** B (entry point separado dentro de `nestjs-project/`)
**Libraries:** —

---

## TD-06: Biblioteca de manipulação de FFmpeg no Worker

**Scope:** Backend

**Capability:** Transversal — covers: Processamento automático do vídeo após upload (extração de duração e metadados), Geração automática de thumbnail a partir de um frame do vídeo

**Context:** A escolha óbvia por familiaridade seria `fluent-ffmpeg`, mas uma verificação do estado atual da lib (pesquisa web, não apenas conhecimento de treinamento) mostra que **o repositório `fluent-ffmpeg/node-fluent-ffmpeg` foi arquivado em maio de 2025 e não é mais mantido**, com relatos de incompatibilidade com versões recentes do FFmpeg. Iniciar um projeto novo em 2026 sobre uma dependência arquivada é um risco real. Depende de TD-05 (roda dentro do worker).

**Options:**

### Option A: `fluent-ffmpeg` (API fluente familiar)
- **Pros:** API conhecida, exemplos abundantes na web.
- **Cons:** **repositório arquivado desde maio/2025** — sem correções de bugs ou compatibilidade futura com novas versões do FFmpeg; risco crescente ao longo da vida do projeto.

### Option B: `child_process.spawn` direto + binário via `ffmpeg-static`/`@ffmpeg-installer/ffmpeg`
- Comandos `ffmpeg`/`ffprobe` montados manualmente como arrays de argumentos e executados via `child_process.spawn` (não bloqueante); o binário do FFmpeg é resolvido automaticamente por `ffmpeg-static` (sem exigir instalação manual no host/imagem Docker).
- **Pros:** nenhuma dependência de uma lib abandonada; `ffprobe -show_entries format=duration -of json` cobre a extração de metadados/duração citada na capability; controle total dos argumentos.
- **Cons:** mais verboso que uma API fluente — precisa montar os argumentos e fazer parse do `stdout`/JSON manualmente.

### Option C: `node-video-lib` ou wrapper alternativo de menor adoção
- **Pros:** ainda mantido.
- **Cons:** adoção muito menor (~30K downloads semanais vs. as opções acima), documentação mais escassa — risco de suporte pior que simplesmente chamar o binário diretamente.

**Recommendation:** Option B — remove a dependência de uma lib arquivada sem introduzir outra de baixa adoção; o próprio `ffprobe` (parte do binário FFmpeg, não da lib) já entrega duração e metadados em JSON, e o comando de extração de thumbnail (`ffmpeg -ss <t> -i <in> -vframes 1 <out>`) é simples o suficiente para não precisar de uma API fluente por cima.

**Decision:** B (`child_process.spawn` + `ffmpeg-static`)
**Libraries:** ffmpeg-static

---

## TD-07: Geração de URL única por vídeo

**Scope:** Backend

**Capability:** URL única por vídeo, sem conflito com outros vídeos

**Context:** `project-plan.md` § "Pontos de Atenção" pede explicitamente uma URL "curta e única". As entidades existentes (`User`, `Channel`) já usam `@PrimaryGeneratedColumn('uuid')` como chave primária — mas UUID (36 caracteres) não é "curto".

**Options:**

### Option A: Reaproveitar o UUID da própria entidade `Video` como identificador público
- **Pros:** zero dependência nova, zero risco de colisão (UUID v4).
- **Cons:** não é "curto" — 36 caracteres não combina com uma URL de vídeo compartilhável.

### Option B: `nanoid` (id curto, ex.: 10 caracteres) como coluna separada e indexada (`public_id`)
- Gerado no momento da criação do rascunho (TD-04), único por índice `unique` no banco.
- **Pros:** atende literalmente "curta e única"; lib pequena, ativamente mantida, colisão estatisticamente desprezível no tamanho usado por este projeto.
- **Cons:** mais uma dependência (pequena) e uma coluna/índice extra.

### Option C: `hashids` (encode reversível do id incremental)
- **Pros:** não precisa de coluna extra (decodifica de volta pro id).
- **Cons:** o projeto não usa ids incrementais (usa UUID) — não há o que "encodar"; adiciona uma lib só para ofuscar, com garantias de colisão mais fracas que nanoid.

**Recommendation:** Option B (nanoid) — é a única opção que satisfaz literalmente os dois adjetivos do requisito ("curta" e "única") ao mesmo tempo, com uma dependência mínima e madura.

**Decision:** B (nanoid)
**Libraries:** nanoid

---

## TD-08: Caminho de entrega para streaming e download

**Scope:** Cross-layer

**Capability:** Transversal — covers: Reprodução via streaming (sem necessidade de download completo), Download do vídeo pelo usuário

**Context:** O diagrama de arquitetura já modela a relação **"Frontend → Object Storage: Streams (HTTPS)"** — ou seja, o desenho de referência do projeto já prevê o navegador falando diretamente com o Object Storage para reprodução, não só com a API. Isso é uma nuance em relação ao modelo BFF estrito descrito em `next-frontend/CLAUDE.md` ("o navegador nunca chama a API NestJS diretamente") — mas aquela regra é especificamente sobre a **API NestJS** (eliminar CORS e esconder a URL do backend), não sobre o Object Storage, que é um serviço diferente e já é tratado como container à parte no próprio diagrama do projeto. Depende de TD-01 (o storage escolhido precisa suportar geração de URL pré-assinada com `Range`).

**Options:**

### Option A: Proxy via API NestJS (`GET /videos/:id/stream` e `/download` implementam parsing de `Range` manualmente e fazem pipe dos bytes do MinIO para a resposta HTTP)
- **Pros:** um único ponto de controle de acesso (visibilidade pública/unlisted da Fase 04) sem expor o endpoint do storage.
- **Cons:** todo o tráfego de bytes de vídeo (potencialmente GBs por sessão de reprodução) passa pelo processo Node da API, indo contra o espírito de "sem impacto na performance" citado na fase; reimplementa suporte a `Range` que o MinIO/S3 já tem pronto.

### Option B: URLs pré-assinadas (presigned GET) apontando direto para o MinIO/S3
- A API decide (checando visibilidade/autenticação) e emite uma URL pré-assinada de curta duração; o `<video>` do player e o link de download apontam direto para essa URL. MinIO/S3 já implementam `Range` nativamente (necessário para seek do player HTML5).
- **Pros:** tira o tráfego pesado de bytes do processo Node por completo; reaproveita suporte a `Range` já pronto no storage; combina com a relação já desenhada no diagrama de arquitetura do projeto; mantém um ponto de controle de acesso (a própria emissão da URL, que checa visibilidade antes de assinar).
- **Cons:** a URL do storage fica momentaneamente visível ao navegador (mitigado pela expiração curta da assinatura).

### Option C: Bucket público (sem assinatura) com URLs permanentes
- **Pros:** o mais simples de implementar.
- **Cons:** não permite negar acesso a vídeos `unlisted`/privados (regra que chega na Fase 04) — qualquer um com a URL acessa para sempre, sem expiração nem checagem de visibilidade no momento do acesso.

**Recommendation:** Option B — é a única opção alinhada ao diagrama de arquitetura do projeto, evita sobrecarregar o processo da API com tráfego de bytes de vídeo, e já deixa a porta aberta para a regra de visibilidade pública/unlisted da Fase 04 (a checagem acontece na hora de assinar a URL, não depois).

**Decision:** B (URLs pré-assinadas direto ao storage)
**Libraries:** —

---

## TD-09: Transporte do feedback de progresso de processamento

**Scope:** Cross-layer

**Capability:** Processamento automático do vídeo após upload (extração de duração e metadados)

**Context:** Depois que o upload termina, o processamento (TD-05/TD-06) roda em segundo plano — o frontend precisa saber quando terminou (e idealmente o quão perto está de terminar) para atualizar a tela de "rascunho processando" para "pronto". Depende de TD-02 (a fila é a fonte do status do job) e TD-05 (worker que atualiza esse status no banco).

**Options:**

### Option A: Polling (o frontend consulta `GET /videos/:id` a cada N segundos enquanto `status !== ready`)
- **Pros:** zero infraestrutura nova; reaproveita o mesmo endpoint de leitura de vídeo já necessário para outras telas; simples de testar (sem conexão persistente para simular em testes E2E/MSW).
- **Cons:** latência de até N segundos para refletir a conclusão; requisições "desperdiçadas" enquanto nada mudou.

### Option B: Server-Sent Events (SSE)
- Endpoint que mantém a conexão HTTP aberta e empurra eventos de progresso conforme o worker atualiza o job.
- **Pros:** feedback mais próximo de tempo real, sem round-trips desnecessários; funciona sobre HTTP simples (sem lib de protocolo novo).
- **Cons:** conexão de longa duração por vídeo em processamento — mais um tipo de conexão para gerenciar (timeouts, reconexão) que o projeto não tem hoje em nenhum outro fluxo.

### Option C: WebSocket (`@nestjs/websockets` + `socket.io`)
- **Pros:** bidirecional, mesmo padrão citado no diagrama como possível evolução futura.
- **Cons:** bidirecionalidade não é necessária aqui (o cliente só recebe, nunca envia progresso); adiciona uma dependência e uma nova superfície de infraestrutura (conexões stateful) só para um caso de uso unidirecional.

**Recommendation:** Option A (Polling) — o processamento de um vídeo leva segundos a minutos, não milissegundos; a latência de alguns segundos do polling é imperceptível nesse contexto, e evita introduzir gerenciamento de conexão de longa duração (SSE/WebSocket) nesta fase por um ganho marginal. Pode ser revisitado depois se a experiência de usuário exigir atualização mais imediata.

**Decision:** A (Polling)
**Libraries:** —

---

## TD-10: Onde adicionar os novos serviços de infraestrutura (MinIO, fila, worker) no Docker Compose

**Scope:** Repo-wide

**Capability:** Transversal — covers: Serviço de armazenamento de arquivos (vídeos e thumbnails), Serviço de processamento em segundo plano (filas), Processamento automático do vídeo após upload (extração de duração e metadados)

**Context:** O README já estabelece a convenção "cada subprojeto sobe sua própria stack via `docker compose`" (Fase 01/02: `nestjs-project/compose.yaml` tem API+DB+Mailpit; `next-frontend/compose.yaml` só o dev server). MinIO, Redis (TD-02) e o Video Worker (TD-05) são consumidos exclusivamente pelo backend — o frontend nunca fala com eles diretamente (streaming vai por URL pré-assinada, TD-08, não por acesso direto ao container). Depende de TD-01, TD-02 e TD-05.

**Options:**

### Option A: Adicionar MinIO + Redis + o serviço do worker ao `nestjs-project/compose.yaml` existente
- **Pros:** mantém a convenção já estabelecida nas fases anteriores (stack por subprojeto); nenhum arquivo novo de orquestração na raiz; todos os serviços que o backend depende ficam num único `docker compose up -d`.
- **Cons:** o `compose.yaml` do `nestjs-project` cresce em número de serviços.

### Option B: Novo `compose.yaml` na raiz do monorepo, compartilhado entre subprojetos
- **Pros:** centraliza infraestrutura "transversal" num único lugar.
- **Cons:** quebra a convenção já em uso desde a Fase 01 de stacks separadas por subprojeto; nenhum outro serviço (nem o frontend) precisa desses containers diretamente, então "compartilhar" não traz benefício real aqui.

### Option C: Terceiro subprojeto `video-worker/` com seu próprio `compose.yaml`, ligado ao do `nestjs-project` por uma rede Docker externa
- **Pros:** isolamento total de infraestrutura do worker.
- **Cons:** só faz sentido se TD-05 escolher a Option A (subprojeto separado) — como a recomendação de TD-05 é manter o worker dentro de `nestjs-project/`, essa opção fica sem propósito.

**Recommendation:** Option A — segue a convenção já validada nas Fases 01/02 (stack por subprojeto) e combina diretamente com a recomendação de TD-05 (worker como processo dentro do `nestjs-project`).

**Decision:** A (dentro do `nestjs-project/compose.yaml`)
**Libraries:** —

---

## Decisions Summary

| ID | Scope | Decision | Recommendation | Choice |
|----|-------|----------|---------------|--------|
| TD-01 | Backend | Serviço de armazenamento de objetos | MinIO (self-hosted, S3-compatible) | A (MinIO) |
| TD-02 | Backend | Fila de processamento em segundo plano | BullMQ + Redis | A (BullMQ + Redis) |
| TD-03 | Cross-layer | Estratégia de upload de arquivos grandes (10GB) | Protocolo tus (resumível) | A (tus) |
| TD-04 | Backend | Momento do pré-cadastro do rascunho | No hook de criação da sessão de upload (tus `pre-create`) | A (hook pre-create) |
| TD-05 | Repo-wide | Arquitetura de deployment do Video Worker | Entry point separado dentro de `nestjs-project/` (sem HTTP) | B (entry point em `nestjs-project/`) |
| TD-06 | Backend | Biblioteca de manipulação de FFmpeg | `child_process.spawn` + `ffmpeg-static`/`@ffmpeg-installer/ffmpeg` (evita `fluent-ffmpeg`, arquivado) | B (`child_process.spawn` + `ffmpeg-static`) |
| TD-07 | Backend | Geração de URL única por vídeo | `nanoid` (id curto, coluna indexada `public_id`) | B (nanoid) |
| TD-08 | Cross-layer | Caminho de entrega para streaming/download | URLs pré-assinadas (presigned GET) direto ao storage | B (URLs pré-assinadas) |
| TD-09 | Cross-layer | Transporte do feedback de progresso | Polling | A (Polling) |
| TD-10 | Repo-wide | Localização dos novos serviços no Docker Compose | Adicionar ao `nestjs-project/compose.yaml` existente | A (dentro do `nestjs-project/compose.yaml`) |
