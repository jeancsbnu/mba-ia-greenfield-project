---
libs:
  "@aws-sdk/client-s3":
    version: "^3.700.0"
    context7_id: "N/A — context7 not configured in this project (.mcp.json has no context7 server)"
    fetched_at: "2026-07-02T21:29:29-03:00"
  "bullmq":
    version: "^5.x"
    context7_id: "N/A — context7 not configured in this project"
    fetched_at: "2026-07-02T21:29:29-03:00"
  "@nestjs/bullmq":
    version: "^10.x (NestJS 11-compatible)"
    context7_id: "N/A — context7 not configured in this project"
    fetched_at: "2026-07-02T21:29:29-03:00"
  "ioredis":
    version: "^5.x"
    context7_id: "N/A — context7 not configured in this project"
    fetched_at: "2026-07-02T21:29:29-03:00"
  "@tus/server":
    version: "^1.x"
    context7_id: "N/A — context7 not configured in this project"
    fetched_at: "2026-07-02T21:29:29-03:00"
  "@tus/s3-store":
    version: "^1.x"
    context7_id: "N/A — context7 not configured in this project"
    fetched_at: "2026-07-02T21:29:29-03:00"
  "tus-js-client":
    version: "^4.x"
    context7_id: "N/A — context7 not configured in this project"
    fetched_at: "2026-07-02T21:29:29-03:00"
  "ffmpeg-static":
    version: "^5.x"
    context7_id: "N/A — context7 not configured in this project"
    fetched_at: "2026-07-02T21:29:29-03:00"
  "ffprobe-static":
    version: "^3.x"
    context7_id: "N/A — context7 not configured in this project"
    fetched_at: "2026-07-02T21:29:29-03:00"
  "nanoid":
    version: "^3.3.x (pinned — see gotcha below)"
    context7_id: "N/A — context7 not configured in this project"
    fetched_at: "2026-07-02T21:29:29-03:00"
sources_mtime:
  docs/decisions/technical-decisions-upload-processing.md: "2026-07-02T21:21:48.795000200-03:00"
---

# library-refs — Fase 03 (upload-processing)

> **Nota:** este cache foi escrito manualmente (não via fetch ao vivo do context7 — o MCP não está configurado em `.mcp.json` neste projeto). Sinalizar se as versões abaixo divergirem do que for de fato instalado; recomenda-se rodar `npm view <pkg> version` no momento da implementação para confirmar.

### @aws-sdk/client-s3 _(TD-01, TD-08)_

Cliente S3 modular (AWS SDK v3). Aponta para o MinIO trocando `endpoint` e `forcePathStyle: true`:

```ts
new S3Client({
  endpoint: `http://${config.minioEndpoint}:${config.minioPort}`,
  forcePathStyle: true,
  region: 'us-east-1', // exigido pelo SDK mesmo sem uso real com MinIO
  credentials: { accessKeyId: config.minioAccessKey, secretAccessKey: config.minioSecretKey },
});
```

Usa `PutObjectCommand`/`GetObjectCommand` para armazenar vídeo/thumbnail (TD-01) e `getSignedUrl` (de `@aws-sdk/s3-request-presigner` — **dependência adicional necessária**, não listada nas TDs originais) para gerar URLs pré-assinadas de streaming/download (TD-08).

**Gotcha:** `@aws-sdk/s3-request-presigner` precisa ser instalado junto — sem ele não há como gerar a URL assinada da TD-08.

### bullmq _(TD-02)_

Motor de fila baseado em Redis. Exposto ao NestJS via `@nestjs/bullmq` (ver seção abaixo). Eventos de progresso (`job.updateProgress()`) alimentam o polling da TD-09.

### @nestjs/bullmq _(TD-02)_

Expõe `BullModule.forRootAsync()` (config de conexão Redis) e `BullModule.registerQueue()` (fila `'video-processing'`). O worker consome via `@Processor('video-processing')` decorando uma classe que estende `WorkerHost`.

### ioredis _(TD-02, dependência transitiva)_

BullMQ usa `ioredis` como cliente Redis por baixo dos panos — normalmente não é preciso instanciar diretamente, só configurar `connection: { host, port }` no `BullModule.forRootAsync`.

### tus-node-server _(TD-03)_

**Nota de nomenclatura:** o pacote histórico `tus-node-server` foi descontinuado/renomeado — a implementação atual mantida vive no escopo `@tus/*` (`@tus/server` como core, `@tus/s3-store` como adapter de storage compatível com S3/MinIO). Ao instalar, usar esses nomes (`@tus/server`, `@tus/s3-store`), não o nome antigo `tus-node-server`.

`@tus/server` expõe um `Server` que pode ser montado como middleware Express dentro do NestJS (via `app.use()` no `main.ts` ou um middleware dedicado), com hooks `onUploadCreate` (usado pela TD-04 para criar o rascunho do vídeo) e `onUploadFinish` (para publicar o job de processamento, TD-02). `@tus/s3-store` faz o storage dos chunks recebidos direto no MinIO configurado na TD-01.

### tus-js-client _(TD-03, frontend)_

Cliente para `next-frontend`. Uso básico:

```ts
new tus.Upload(file, {
  endpoint: '/api/videos/upload', // rota BFF, que faz proxy ao endpoint tus do backend
  chunkSize: 5 * 1024 * 1024,
  retryDelays: [0, 1000, 3000, 5000],
  onProgress: (bytesUploaded, bytesTotal) => { /* progress bar */ },
  onSuccess: () => { /* redireciona ou mostra status de processamento */ },
});
```

**Atenção ao modelo BFF:** o `endpoint` do tus precisa ser uma rota same-origin (`app/api/videos/upload`) que faça proxy para o servidor tus do NestJS — não apontar direto para a API, para não violar o modelo BFF estrito do `next-frontend`.

### ffmpeg-static + ffprobe-static _(TD-06)_

Ambos resolvem o caminho do binário via `require('ffmpeg-static')` / `require('ffprobe-static').path` — sem precisar instalar FFmpeg no host/imagem manualmente. Uso com `child_process.spawn`:

```ts
import ffmpegPath from 'ffmpeg-static';
import { path as ffprobePath } from 'ffprobe-static';
import { spawn } from 'node:child_process';

// metadados (duração):
spawn(ffprobePath, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', inputPath]);

// thumbnail:
spawn(ffmpegPath, ['-ss', '00:00:03', '-i', inputPath, '-vframes', '1', outputPath]);
```

**Gotcha:** ambos os pacotes baixam binários pré-compilados no `postinstall` — confirmar que a imagem Docker do worker permite esse download (ou usar uma imagem base com FFmpeg já instalado como alternativa, se o `postinstall` falhar em ambiente restrito).

### nanoid _(TD-07)_

**Gotcha crítico:** a partir da v4, `nanoid` é **ESM-only** — quebra `require()` em um projeto NestJS padrão (CommonJS). Duas opções: (a) fixar `nanoid@^3.3.x` (última major CJS-compatível), ou (b) usar `import()` dinâmico se o projeto for migrado para ESM. **Recomendação para este projeto:** opção (a), já que `nestjs-project` não está configurado como ESM (`tsconfig`/`package.json` não têm `"type": "module"`).

```ts
import { nanoid } from 'nanoid'; // v3.x — CJS-compatível
const publicId = nanoid(10); // 10 caracteres, coluna indexada `public_id`
```
