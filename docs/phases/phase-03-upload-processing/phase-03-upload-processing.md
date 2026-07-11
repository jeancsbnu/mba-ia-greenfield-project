---
kind: phase
name: phase-03-upload-processing
test_specs_aware: true
sources_mtime:
  docs/phases/phase-03-upload-processing/context.md: "2026-07-02T21:30:23.733761800-03:00"
  docs/phases/phase-03-upload-processing/library-refs.md: "2026-07-02T21:35:07.544537300-03:00"
  docs/decisions/technical-decisions-upload-processing.md: "2026-07-02T21:21:48.795000200-03:00"
---

# Fase 03 — Upload e Processamento de Vídeos

## Objective

Entregar upload de vídeos de até 10GB com retomada via protocolo tus, armazenamento em MinIO, pré-cadastro automático do vídeo como rascunho ao iniciar o upload, processamento em segundo plano (extração de duração/metadados e geração de thumbnail via FFmpeg) por um Video Worker dedicado, geração de URL única e curta (nanoid) por vídeo, e entrega via streaming/download por URLs pré-assinadas direto ao storage.

---

## Step Implementations

### SI-03.1 — Infra: MinIO, Redis e Video Worker no Docker Compose

**Description:** Provisiona os novos serviços de infraestrutura da fase (armazenamento, fila, worker) e as dependências Node necessárias, dentro do `nestjs-project/compose.yaml` existente.

**Technical actions:**

1. Adicionar serviços `minio` e `redis` ao `nestjs-project/compose.yaml`, com healthchecks (per `upload-processing/TD-10`)
2. Adicionar serviço `video-worker` ao `nestjs-project/compose.yaml`, mesma imagem da API, comando alternativo apontando para o entry point do worker (per `upload-processing/TD-05`, `upload-processing/TD-10`)
3. Adicionar variáveis de ambiente (`MINIO_*`, `REDIS_*`) ao `.env`/`.env.example` e ao serviço `nestjs-api` no compose (per `upload-processing/TD-01`, `upload-processing/TD-02`)
4. Instalar dependências: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `bullmq`, `@nestjs/bullmq`, `@tus/server`, `@tus/s3-store`, `ffmpeg-static`, `ffprobe-static`, `nanoid@^3` (per `upload-processing/TD-01`, `upload-processing/TD-02`, `upload-processing/TD-03`, `upload-processing/TD-06`, `upload-processing/TD-07`)

**Tests:** _(empty — Infra)_

**Dependencies:** none

**Acceptance criteria:**

- `docker compose ps` mostra os serviços `minio`, `redis` e `video-worker` com status `running`
- `docker compose exec nestjs-api node -e "require('@aws-sdk/client-s3')"` executa sem erro (dependências instaladas)
- MinIO acessível via `curl http://localhost:9000/minio/health/live` retorna 200

---

### SI-03.2 — Entidade Video + migration + config de storage/fila

**Description:** Cria o modelo de dados do vídeo e os namespaces de configuração para storage e fila, seguindo o padrão `registerAs` já usado nas Fases 01/02.

**Technical actions:**

1. Criar `src/videos/entities/video.entity.ts` com os campos de `### Data Model → Video` (per `### Data Model`)
2. Gerar migration via `npm run migration:generate` criando a tabela `videos` com os índices (`public_id` unique, `channel_id`, `status`)
3. Criar `src/config/storage.config.ts` (namespaced `registerAs`) com `minioEndpoint`, `minioPort`, `minioAccessKey`, `minioSecretKey`, `minioBucket` (per `upload-processing/TD-01`, convenção herdada de config namespaced)
4. Criar `src/config/queue.config.ts` (namespaced `registerAs`) com `redisHost`, `redisPort` (per `upload-processing/TD-02`, convenção herdada de config namespaced)

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `Video` entity | Integration: constraints (`public_id` unique, default `status`) | `video.entity.integration-spec.ts` |

**Dependencies:** SI-03.1

**Acceptance criteria:**

- Migration cria a tabela `videos` com todas as colunas de `### Data Model → Video`
- Inserir dois vídeos com o mesmo `public_id` viola a constraint unique
- `status` assume o default `'draft'` quando omitido na criação

---

### SI-03.3 — StorageService (MinIO)

**Description:** Encapsula o acesso a objetos no MinIO (upload e URLs pré-assinadas) atrás de um serviço único, reaproveitado pelo endpoint de upload, pelos endpoints de streaming/download e pelo worker.

**Technical actions:**

1. Criar `src/storage/storage.module.ts` e `src/storage/storage.service.ts` — encapsula um `S3Client` configurado por `storage.config.ts` (per `upload-processing/TD-01`)
2. Implementar `StorageService.getPresignedUrl(bucket, key, options)` usando `getSignedUrl` de `@aws-sdk/s3-request-presigner` (per `upload-processing/TD-08`)
3. Implementar `StorageService.deleteObject(bucket, key)` (usado em rollback de falha de processamento)

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `StorageService` | Integration: real capture service (MinIO do compose) — upload/get/presign | `storage.service.integration-spec.ts` |

**Dependencies:** SI-03.1

**Acceptance criteria:**

- `getPresignedUrl` retorna uma URL que, ao ser acessada via HTTP GET, retorna o conteúdo do objeto
- URL pré-assinada expira após o tempo configurado (requisição após expiração retorna erro do MinIO)
- `deleteObject` remove o objeto do bucket (get subsequente retorna not-found)

---

### SI-03.4 — QueueModule (BullMQ)

**Description:** Configura a fila de processamento em segundo plano e o produtor que publica jobs após o upload.

**Technical actions:**

1. Criar `src/queue/queue.module.ts` com `BullModule.forRootAsync` (conexão Redis via `queue.config.ts`) e `BullModule.registerQueue({ name: 'video-processing' })` (per `upload-processing/TD-02`)
2. Criar `src/videos/video-processing.producer.ts` — serviço que expõe `enqueueProcessing(videoId, storageBucket, storageKey)` publicando na fila `video-processing` (per `### Events/Messages → video.processing`)

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `VideoProcessingProducer` | Integration: job realmente enfileirado no Redis (fila `video-processing`) | `video-processing.producer.integration-spec.ts` |

**Dependencies:** SI-03.1

**Acceptance criteria:**

- Chamar `enqueueProcessing` cria um job na fila `video-processing` com o payload `{ videoId, storageBucket, storageKey }`
- `QueueModule` compila (`Test.createTestingModule`) sem erros de DI

---

### SI-03.5 — Endpoint de upload resumível (tus) com pré-cadastro do rascunho

**Description:** Expõe o endpoint de upload resumível de até 10GB e cria o registro de rascunho do vídeo assim que a sessão de upload é aberta.

**Technical actions:**

1. Criar `src/videos/videos.module.ts`, registrando `TypeOrmModule.forFeature([Video])`, `StorageModule`, `QueueModule`
2. Montar o servidor tus (`@tus/server` + `@tus/s3-store`) no `main.ts` sob o path `/videos/upload` (per `upload-processing/TD-03`)
3. No hook `onUploadCreate`, criar o registro `Video` com `status: 'draft'` e `upload_id` da sessão tus (per `upload-processing/TD-04`)
4. No hook `onUploadFinish`, atualizar `storage_bucket`/`storage_key` do `Video` e chamar `VideoProcessingProducer.enqueueProcessing` (per `### Events/Messages → video.processing`)

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `POST /videos/upload` | E2E: cria sessão tus e valida rascunho criado | `videos-upload.e2e-spec.ts` |

**Dependencies:** SI-03.2, SI-03.3, SI-03.4

**Acceptance criteria:**

- `POST /videos/upload` com `Upload-Length` válido retorna `201` com header `Location` da sessão de upload
- `POST /videos/upload` cria um registro `Video` com `status: 'draft'` imediatamente (antes do upload terminar)
- `POST /videos/upload` com `Upload-Length` acima de 10GB retorna `400` com `errorCode: "UPLOAD_FILE_TOO_LARGE"`
- Concluir o upload (todos os chunks enviados) enfileira um job na fila `video-processing`
- `POST /videos/upload` sem token de autenticação retorna `401`

---

### SI-03.6 — Endpoints de leitura, streaming e download do vídeo

**Description:** Expõe os endpoints de consulta de status e de entrega do vídeo (streaming e download) via URLs pré-assinadas.

**Technical actions:**

1. Criar `src/videos/videos.controller.ts` com `GET /videos/:publicId` (per `### API Contracts → GET /videos/:publicId`)
2. Implementar `GET /videos/:publicId/stream` retornando `302` com `Location` da URL pré-assinada via `StorageService.getPresignedUrl` (per `### API Contracts → GET /videos/:publicId/stream`)
3. Implementar `GET /videos/:publicId/download` retornando `302` com `Location` e `response-content-disposition=attachment` (per `### API Contracts → GET /videos/:publicId/download`)
4. Aplicar `@Public()` nos endpoints de stream/download (per `### Authorization Matrix`)

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `GET /videos/:publicId` | E2E: retorna status do vídeo; 404 quando não existe | `videos-read.e2e-spec.ts` |
| `GET /videos/:publicId/stream` e `/download` | E2E: redireciona (302) para URL do storage; 409 quando não `ready` | `videos-stream.e2e-spec.ts` |

**Dependencies:** SI-03.2, SI-03.3

**Acceptance criteria:**

- `GET /videos/:publicId` com id válido retorna `200` com `status`, `title`, `durationSeconds`
- `GET /videos/:publicId` com id inexistente retorna `404` com `errorCode: "VIDEO_NOT_FOUND"`
- `GET /videos/:publicId/stream` com vídeo `ready` retorna `302` com `Location` apontando para o storage
- `GET /videos/:publicId/stream` com vídeo `processing` retorna `409` com `errorCode: "VIDEO_NOT_READY"`
- `GET /videos/:publicId/stream` e `/download` são acessíveis sem token de autenticação (`@Public()`)

---

### SI-03.7 — Video Worker: extração de metadados e geração de thumbnail

**Description:** Implementa o processo dedicado que consome os jobs de processamento, extrai duração/metadados e gera a thumbnail via FFmpeg.

**Technical actions:**

1. Criar `src/worker.main.ts` — bootstrap de `NestApplicationContext` (sem HTTP) reaproveitando `VideosModule`, `StorageModule`, `QueueModule` (per `upload-processing/TD-05`)
2. Criar `src/videos/video-processing.consumer.ts` — `@Processor('video-processing')` extends `WorkerHost`, consumindo o job `video.processing` (per `upload-processing/TD-02`)
3. No processor, baixar o arquivo do MinIO e rodar `ffprobe-static` via `child_process.spawn` para extrair `duration_seconds` (per `upload-processing/TD-06`)
4. No processor, rodar `ffmpeg-static` para extrair um frame, subir a thumbnail via `StorageService` e atualizar `Video` para `status: 'ready'` (per `upload-processing/TD-06`, `### Data Model → Video`)
5. Em caso de erro no processamento, atualizar `Video.status = 'failed'` e `processing_error` com a mensagem (per `### Data Model → Video`)

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `VideoProcessingConsumer` | Integration: processa um job real (arquivo de teste) e atualiza o `Video` para `ready`/`failed` | `video-processing.consumer.integration-spec.ts` |

**Dependencies:** SI-03.2, SI-03.3, SI-03.4

**Acceptance criteria:**

- Job `video.processing` processado com sucesso atualiza `Video.status` para `'ready'` com `duration_seconds` preenchido
- Job processado com sucesso faz upload da thumbnail e preenche `Video.thumbnail_key`
- Falha no processamento (ex: arquivo corrompido) atualiza `Video.status` para `'failed'` com `processing_error` preenchido
- O worker roda como processo separado (`node dist/worker.main.js`), sem abrir porta HTTP

---

### SI-03.8 — Fluxo de upload com progresso e feedback de processamento (cross-layer)

**Description:** Entrega a tela de upload no `next-frontend` (progress bar via `tus-js-client`) e o polling de status de processamento, consumindo os endpoints da Fase 03 através do modelo BFF.
**Test Specs:** see `next-frontend/specs/video-upload.plan.md`

**Technical actions:**

1. Criar `app/api/videos/upload/route.ts` — Route Handler BFF que faz proxy do upload tus para o endpoint do NestJS (per `upload-processing/TD-03`, padrão BFF herdado)
2. Criar `components/videos/upload-form.tsx` (`"use client"`) usando `tus-js-client` para upload resumível com progress bar (per `upload-processing/TD-03`)
3. Criar `app/api/videos/[publicId]/route.ts` — Route Handler BFF que faz proxy de `GET /videos/:publicId` (per `### API Contracts → GET /videos/:publicId`)
4. Implementar polling no client component chamando `/api/videos/[publicId]` a cada N segundos até `status !== 'processing'` (per `upload-processing/TD-09`)
5. Adicionar o primitivo `Progress` do shadcn (`npx shadcn@latest add progress`) para a barra de progresso

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `upload-form.tsx` | Unit (RTL + jsdom): validação de arquivo, exibição da progress bar, chamada ao `tus-js-client` mockado | `upload-form.test.tsx` |
| `POST /api/videos/upload` route | Integration: proxy do upload, erros repassados verbatim | `route.integration.test.ts` |
| `GET /api/videos/[publicId]` route | Integration: proxy do status, fixture MSW | `route.integration.test.ts` |

**Dependencies:** SI-03.5, SI-03.6

**Acceptance criteria:**

- Upload de um arquivo exibe uma barra de progresso que avança conforme os chunks são enviados
- Queda de conexão durante o upload permite retomar do ponto onde parou (tus)
- Após o upload concluir, a tela faz polling de `/api/videos/[publicId]` até `status` mudar de `processing`
- Erros do backend (ex: `UPLOAD_FILE_TOO_LARGE`) são exibidos ao usuário sem detalhes internos vazados

---

## Technical Specifications

### Data Model

#### Video

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PK, generated |
| public_id | varchar(10) | unique, not null — nanoid *(per upload-processing/TD-07)* |
| channel_id | uuid | FK → Channel, not null |
| title | varchar(200) | not null |
| description | text | nullable |
| status | enum('draft', 'processing', 'ready', 'failed') | not null, default 'draft' |
| upload_id | varchar | nullable — id da sessão de upload tus *(per upload-processing/TD-03, TD-04)* |
| storage_bucket | varchar | nullable — bucket MinIO do arquivo original *(per upload-processing/TD-01)* |
| storage_key | varchar | nullable — chave do objeto do arquivo original *(per upload-processing/TD-01)* |
| thumbnail_key | varchar | nullable — chave do objeto da thumbnail *(per upload-processing/TD-01, TD-06)* |
| duration_seconds | integer | nullable — preenchido pelo worker *(per upload-processing/TD-06)* |
| mime_type | varchar(100) | nullable |
| file_size_bytes | bigint | nullable |
| processing_error | text | nullable — mensagem de erro quando status = 'failed' |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now(), on update now() |

**Relations:** `Channel` has many `Video` (one-to-many); `Video` belongs to `Channel`.
**Indexes:** unique on `public_id`; index on `channel_id`; index on `status`.

### API Contracts

#### POST /videos/upload (SI-03.2)

Endpoint tus (montado via `@tus/server` *(per upload-processing/TD-03)*) que cria a sessão de upload resumível.

**Request headers:**
- Tus-Resumable: 1.0.0
- Upload-Length: bytes totais do arquivo (até 10GB)
- Upload-Metadata: `title`, `description` codificados em base64 (protocolo tus)
- Authorization: Bearer token

**Response 201:**
- Location: URL da sessão de upload criada (usada pelo cliente tus para enviar os chunks via PATCH)

**Error responses:**
- 400 validation error: quando `Upload-Length` excede o limite de 10GB
- 401 UNAUTHORIZED: quando o token de autenticação é inválido ou ausente

---

#### GET /videos/:publicId (SI-03.3)

**Request headers:**
- Authorization: Bearer token

**Response 200:**
- publicId: string
- title: string
- description: string | null
- status: 'draft' | 'processing' | 'ready' | 'failed'
- durationSeconds: number | null
- createdAt: string (ISO-8601)

**Error responses:**
- 404 VIDEO_NOT_FOUND: quando `publicId` não corresponde a nenhum vídeo
- 401 UNAUTHORIZED: quando o token de autenticação é inválido ou ausente
- 403 FORBIDDEN: quando o usuário autenticado não é o dono do canal do vídeo

---

#### GET /videos/:publicId/stream (SI-03.6)

**Request query parameters:** nenhum

**Response 302:**
- Location: URL pré-assinada do MinIO/S3 para o arquivo de vídeo *(per upload-processing/TD-08)*, com suporte nativo a `Range` para seek do player

**Error responses:**
- 404 VIDEO_NOT_FOUND: quando `publicId` não corresponde a nenhum vídeo
- 409 VIDEO_NOT_READY: quando o vídeo ainda está em `processing` ou falhou (`failed`)

---

#### GET /videos/:publicId/download (SI-03.6)

**Request query parameters:** nenhum

**Response 302:**
- Location: URL pré-assinada do MinIO/S3 para download do arquivo original *(per upload-processing/TD-08)*, com `response-content-disposition=attachment`

**Error responses:**
- 404 VIDEO_NOT_FOUND: quando `publicId` não corresponde a nenhum vídeo
- 409 VIDEO_NOT_READY: quando o vídeo ainda está em `processing` ou falhou (`failed`)

---

### Authorization Matrix

| Endpoint | Anonymous | Authenticated | Owner |
|----------|-----------|----------------|-------|
| POST /videos/upload | ✗ | ✗ | ✓ |
| GET /videos/:publicId | ✗ | ✗ | ✓ |
| GET /videos/:publicId/stream | ✓ | ✓ | ✓ |
| GET /videos/:publicId/download | ✓ | ✓ | ✓ |

_Streaming/download são anônimos por padrão, consistente com a visão geral do produto ("usuários anônimos podem assistir livremente"); a Fase 03 ainda não modela visibilidade pública/unlisted (isso chega na Fase 04) — todo vídeo com status `ready` é acessível por qualquer um que tenha a URL pública._

### Error Catalog

| errorCode | HTTP | Trigger |
|-----------|------|---------|
| VIDEO_NOT_FOUND | 404 | `publicId` não corresponde a nenhum vídeo cadastrado |
| VIDEO_NOT_READY | 409 | Tentativa de streaming/download enquanto `status` é `processing` ou `failed` |
| FORBIDDEN | 403 | Usuário autenticado tenta acessar/gerenciar um vídeo de um canal que não é o seu |
| UPLOAD_FILE_TOO_LARGE | 400 | `Upload-Length` da sessão tus excede o limite de 10GB |

### Events/Messages

#### video.processing

**Payload:**

```json
{ "videoId": "uuid", "storageBucket": "string", "storageKey": "string" }
```

**Producer:** `VideosService` (hook `onUploadFinish` do servidor tus) (per `upload-processing/TD-02`, `upload-processing/TD-03`)
**Consumer:** Video Worker — processo dedicado que consome a fila BullMQ (per `upload-processing/TD-02`)
**Trigger:** sessão de upload tus concluída (todos os bytes recebidos e reconciliados)
**Delivery semantics:** at-least-once, com retries automáticos do BullMQ (per `upload-processing/TD-02`)

---

<!-- phase-a-complete -->

## Dependency Map

```
SI-03.1 (root — infra: MinIO, Redis, Video Worker, dependências)
├── SI-03.2 — depends on SI-03.1 (entidade Video + config)
├── SI-03.3 — depends on SI-03.1 (StorageService)
└── SI-03.4 — depends on SI-03.1 (QueueModule)

SI-03.5 — depends on SI-03.2 + SI-03.3 + SI-03.4 (endpoint de upload precisa da entidade, do storage e da fila)
SI-03.6 — depends on SI-03.2 + SI-03.3 (endpoints de leitura/stream/download precisam da entidade e do storage)
SI-03.7 — depends on SI-03.2 + SI-03.3 + SI-03.4 (worker precisa da entidade, do storage e da fila)

SI-03.8 (cross-layer) — depends on SI-03.5 + SI-03.6 (tela de upload consome os endpoints de upload e de leitura)
```

---

## Deliverables

- [ ] SI-03.1 — Infra: MinIO, Redis e Video Worker no Docker Compose
- [ ] SI-03.2 — Entidade Video + migration + config de storage/fila
- [ ] SI-03.3 — StorageService (MinIO)
- [ ] SI-03.4 — QueueModule (BullMQ)
- [ ] SI-03.5 — Endpoint de upload resumível (tus) com pré-cadastro do rascunho
- [ ] SI-03.6 — Endpoints de leitura, streaming e download do vídeo
- [ ] SI-03.7 — Video Worker: extração de metadados e geração de thumbnail
- [ ] SI-03.8 — Fluxo de upload com progresso e feedback de processamento (cross-layer)

**Full test suites:**

- [ ] Backend tests pass (`docker compose exec nestjs-api npm test -- --runInBand`)
- [ ] Backend E2E tests pass (`docker compose exec nestjs-api npm run test:e2e`)
- [ ] Backend type-check passes (`docker compose exec nestjs-api npx tsc --noEmit`)
- [ ] Frontend tests pass (`docker compose exec next-frontend npm test`)
- [ ] Frontend type-check passes (`docker compose exec next-frontend npx tsc --noEmit`)
- [ ] Frontend lint passes (`docker compose exec next-frontend npm run lint`)
