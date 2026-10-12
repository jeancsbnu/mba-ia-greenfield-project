---
kind: phase
name: phase-07-testes-producao
test_specs_aware: true
sources_mtime:
  docs/phases/phase-07-testes-producao/context.md: "2026-10-12T20:37:30-03:00"
  docs/decisions/technical-decisions-testes-producao.md: "2026-10-12T20:37:30-03:00"
  docs/decisions/technical-decisions-next-frontend-config-base.md: "2026-06-29T19:03:26-03:00"
  docs/decisions/technical-decisions-next-frontend-msw-foundation.md: "2026-06-29T19:03:26-03:00"
  docs/decisions/technical-decisions-rate-limit-visitor-identity.md: "2026-10-08T19:04:24-03:00"
  docs/decisions/technical-decisions-next-frontend-openapi-typing.md: "2026-10-03T21:48:21-03:00"
sources_hash:
  docs/phases/phase-07-testes-producao/context.md: "481c505d2d1c"
  docs/decisions/technical-decisions-testes-producao.md: "951d54352361"
  docs/decisions/technical-decisions-next-frontend-config-base.md: "8d27d591df0e"
  docs/decisions/technical-decisions-next-frontend-msw-foundation.md: "a53ada59d6a6"
  docs/decisions/technical-decisions-rate-limit-visitor-identity.md: "0d1493a08793"
  docs/decisions/technical-decisions-next-frontend-openapi-typing.md: "371ec55c2f2a"
---

# Phase 07 — Página Inicial, Busca e Finalização (fatia testes-producao)

## Objective

Entregar a fatia testes-producao da Fase 07: os "Testes dos fluxos principais da plataforma" — uma suíte de fumaça full-stack que percorre os cinco fluxos entregues contra a stack real — e o "Ambiente de produção e deploy", entendido como o ambiente de produção configurado e validado só no Docker local (compose de produção na raiz, imagens de produção, Caddy, migrations, e-mail, saúde e CI), sem servidor externo; as seis primeiras capabilities da fase ficam com a fatia irmã home-busca.

---

## Step Implementations

### SI-07.16 — Endpoint GET /health

**Description:** Expor o health simples da API, que o compose de produção usa como `healthcheck` e como condição de subida dos serviços dependentes (per `testes-producao/TD-10`).

**Route:** GET /health
**Test Specs:** _pending /plan-test-specs_
**Authorization:** Anonymous (`@Public()`)

**Technical actions:**

1. Criar `nestjs-project/src/health/health.controller.ts` — `@Controller('health')` com `@Get()` público (`@Public()`) que responde `200` com `{ status: 'ok' }`, sem consultar banco, fila nem storage (per `### API Contracts → GET /health`; health simples da Option B de `testes-producao/TD-10`)
2. Marcar o controller com `@ApiExcludeController()` — o endpoint não entra no Swagger, então o `openapi.json` e o `types.gen.ts` da cadeia de contrato não mudam (`next-frontend-openapi-typing/TD-03`)
3. Criar `nestjs-project/src/health/health.module.ts` e registrar `HealthModule` em `AppModule`

**Tests:** _(empty — controller wiring: E2E vive no spec de /plan-test-specs; nenhuma lógica além do wiring)_

**Dependencies:** none

**Acceptance criteria:**

- `GET /health` sem cookie nem token retorna `200` com `{ "status": "ok" }`
- `GET /health` responde `200` mesmo sem nenhuma conta, vídeo ou fila populada (não depende de dados)
- O `openapi.json` exportado por `npm run openapi:export` não contém o path `/health`

---

### SI-07.17 — Ligar o encerramento gracioso da API e do worker

**Description:** Fazer API e `video-worker` reagirem ao `SIGTERM` do `docker compose stop` fechando conexões e o worker do BullMQ, para um vídeo em processamento não ser cortado no meio (per `testes-producao/TD-10`).

**Technical actions:**

1. Chamar `app.enableShutdownHooks()` em `nestjs-project/src/main.ts`, antes do `app.listen(port)` — o `SIGTERM` passa a disparar os hooks de encerramento dos módulos (TypeORM, BullMQ, mailer) (per `testes-producao/TD-10`)
2. Guardar o contexto criado em `nestjs-project/src/worker.main.ts` e chamar `enableShutdownHooks()` nele — o `VideoProcessingConsumer` (`WorkerHost` do `@nestjs/bullmq`) fecha o worker no encerramento da aplicação, esperando o job em andamento em vez de abandoná-lo

**Tests:** _(empty — wiring de bootstrap; observado no AC de parada da stack de produção em SI-07.26)_

**Dependencies:** none

**Acceptance criteria:**

- `docker compose stop` no serviço da API encerra o processo com código `0` dentro do prazo de parada do compose, sem `SIGKILL`
- `docker compose stop` no `video-worker` durante um processamento encerra só depois que o job em andamento termina, dentro do `stop_grace_period` do worker (SI-07.25); o vídeo não fica preso em `processing`
- O dev server (`npm run start:dev`) continua subindo e recarregando normalmente

---

### SI-07.18 — Tornar idempotente a confirmação de e-mail

**Description:** Fazer `GET /auth/confirm-email` responder `204` também quando o token já foi usado por uma conta já confirmada, pré-requisito da rota-ponte do BFF que confirma a cada visita ao link (per `testes-producao/TD-07`, Revision "Rota de confirmação como ponte"; `phase-02-auth-frontend/TD-07` já pressupunha a confirmação idempotente).

**Technical actions:**

1. Em `nestjs-project/src/auth/auth.service.ts`, fazer `confirm(token)` tratar primeiro o caso idempotente: buscar o `VerificationToken` de tipo `EMAIL_CONFIRMATION` pelo `token_hash` **sem** filtrar `used_at`, com a relação `user`; se `used_at` estiver preenchido e `user.is_confirmed` for `true`, retornar sem escrever nada. Qualquer outro caso segue para o `consumeVerificationToken` atual, que mantém `INVALID_TOKEN` e `TOKEN_EXPIRED` (per `### API Contracts → GET /auth/confirm-email`)
2. Não alterar `consumeVerificationToken` — o `resetPassword` continua de uso único
3. Atualizar a descrição do `@ApiResponse({ status: 204 })` de `confirmEmail` em `nestjs-project/src/auth/auth.controller.ts` para dizer que um link já usado de uma conta confirmada também responde 204
4. Regenerar a cadeia de contrato: `npm run openapi:export` no container do Nest, `bash scripts/sync-openapi.sh` na raiz e `npm run openapi:types` no container do front; commitar `nestjs-project/openapi.json`, `next-frontend/openapi.json` e `next-frontend/lib/api/types.gen.ts` (`next-frontend-openapi-typing/TD-03` — o workflow `freshness` reprova o PR sem isso)

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `AuthService.confirm` | Unit: token já usado + conta confirmada retorna sem salvar; token já usado + conta não confirmada lança `INVALID_TOKEN`; token válido segue confirmando | `nestjs-project/src/auth/auth.service.spec.ts` |
| `GET /auth/confirm-email` | E2E: segunda chamada com o mesmo token responde `204`; `reset-password` com token já usado continua `401` | `nestjs-project/test/auth.e2e-spec.ts` |

**Dependencies:** none

**Acceptance criteria:**

- `GET /auth/confirm-email?token=<válido>` retorna `204` e a conta passa a `is_confirmed = true`
- Repetir `GET /auth/confirm-email` com o mesmo token retorna `204`, sem nova escrita em `verification_tokens` nem em `users`
- `GET /auth/confirm-email?token=<inexistente>` retorna `401` com `error: "INVALID_TOKEN"`
- `GET /auth/confirm-email` com token não usado e expirado retorna `401` com `error: "TOKEN_EXPIRED"`
- `POST /auth/reset-password` com um token de redefinição já usado continua retornando `401` com `error: "INVALID_TOKEN"`

---

### SI-07.19 — Assinar URLs de mídia com um endpoint público separado

**Description:** Separar o endpoint usado para **assinar** as URLs pré-assinadas do endpoint interno de leitura e escrita, para o navegador receber um host que ele alcança (o endereço do storage no Caddy) enquanto a API continua falando com `minio:9000` pela rede do compose (per `testes-producao/TD-05`; `upload-processing/TD-08` mantém o navegador buscando a mídia direto no storage).

**Technical actions:**

1. Acrescentar a env opcional `MINIO_PUBLIC_URL` (URL absoluta, ex.: `http://localhost:9001`) em `nestjs-project/src/config/env.validation.ts` (`Joi.string().uri()`, sem default) e em `nestjs-project/src/config/storage.config.ts` (`publicUrl`)
2. Em `nestjs-project/src/storage/storage.service.ts`, criar um segundo `S3Client` só de assinatura quando `publicUrl` estiver definido — mesmo `forcePathStyle`, região e credenciais, com `endpoint: publicUrl` — e fazer `getPresignedUrl` assinar com ele; sem `publicUrl`, assina com o client atual (dev inalterado). Leitura, escrita, `HeadBucket` e `CreateBucket` continuam no client interno (per `testes-producao/TD-05`)
3. Documentar `MINIO_PUBLIC_URL` em `nestjs-project/.env.example`, comentada, explicando que só a stack de produção a define

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `StorageService.getPresignedUrl` | Unit: com `publicUrl` a URL assinada usa o host e a porta dele; sem `publicUrl` usa `minioEndpoint:minioPort` (a assinatura é local, sem rede) | `nestjs-project/src/storage/storage.service.spec.ts` |
| `env.validation` | Integration: `MINIO_PUBLIC_URL` ausente é aceito; valor que não é URI é rejeitado no boot | `nestjs-project/src/config/env.validation.integration-spec.ts` |

**Dependencies:** none

**Acceptance criteria:**

- Com `MINIO_PUBLIC_URL=http://localhost:9001`, a URL de vídeo e a de thumbnail devolvidas pela API começam com `http://localhost:9001/`
- Sem `MINIO_PUBLIC_URL`, as URLs continuam saindo com o host interno, como hoje no dev
- A API sobe sem `MINIO_PUBLIC_URL` e recusa subir com um valor que não é URI
- Upload, processamento e criação do bucket continuam usando o endpoint interno mesmo com `MINIO_PUBLIC_URL` definido

---

### SI-07.20 — Infra: rodar as migrations a partir do build compilado

**Description:** Fazer o `DataSource` do TypeORM achar migrations e entidades tanto em `src/` (ts-node, dev) quanto em `dist/` (imagem de produção, sem `src/`), e expor o comando que o serviço one-off `migrate` vai rodar (per `testes-producao/TD-06`).

**Technical actions:**

1. Em `nestjs-project/src/database/data-source.ts`, trocar os globs fixos `src/database/migrations/*.ts` e `src/**/*.entity.ts` por caminhos relativos a `__dirname` que aceitem `.ts` e `.js` (`migrations/*.{ts,js}` e `../**/*.entity.{ts,js}`), mantendo `synchronize: false` e a leitura de `databaseConfig()` (convenção herdada da Fase 01)
2. Acrescentar em `nestjs-project/package.json` o script `migration:run:prod` = `typeorm migration:run -d dist/database/data-source.js` — usa o CLI do `typeorm` em JS, sem `ts-node`
3. Confirmar que `npm run migration:run` (ts-node, dev) continua aplicando as mesmas migrations

**Tests:** _(empty — Infra; o `globalSetup` das suítes já aplica todas as migrations por `ALL_MIGRATIONS`, e o serviço `migrate` é exercitado em SI-07.26)_

**Dependencies:** none

**Acceptance criteria:**

- Depois de `npm run build`, `npm run migration:run:prod` contra o banco de dev termina com "No migrations are pending" e código `0`
- `npm run migration:run` (dev) continua funcionando e lista as mesmas migrations em `SELECT name FROM migrations`
- `npm run migration:run:prod` funciona num diretório que contém `dist/` e `node_modules/` mas não `src/`

---

### SI-07.21 — Infra: imagem de produção do nestjs-project

**Description:** Criar a imagem multi-stage que roda a API, o `video-worker` e o one-off `migrate` a partir do mesmo build compilado, construída localmente pelo compose da raiz, sem registry (per `testes-producao/TD-09`, Option B, e `testes-producao/TD-06`).

**Technical actions:**

1. Criar `nestjs-project/Dockerfile` multi-stage sobre a mesma base do `Dockerfile.dev` (`node:25.6.0-slim`): estágio `build` com `npm ci` + `npm run build` (o `nest build` já copia os templates `.hbs` declarados em `nest-cli.json`); estágio final com `npm ci --omit=dev`, só `dist/`, `package.json` e `package-lock.json`, `NODE_ENV=production` e `USER node` (per `testes-producao/TD-09`)
2. Definir o `CMD` padrão como `node dist/main`; o compose da raiz troca o comando para `node dist/worker.main` no worker e para `npm run migration:run:prod` no `migrate` (per `testes-producao/TD-06`)
3. Criar `nestjs-project/.dockerignore` excluindo `node_modules`, `dist`, `.env*`, `test`, `specs` e `coverage`, para o contexto de build não levar segredos nem artefatos locais

**Tests:** _(empty — Infra; a imagem é exercitada pela stack de produção em SI-07.26)_

**Dependencies:** SI-07.20 (o `migrate` depende do script `migration:run:prod`)

**Acceptance criteria:**

- `docker build nestjs-project` termina com sucesso a partir de um checkout limpo
- A imagem final não contém `src/`, `test/`, `.env` nem dependências de desenvolvimento (`docker run --rm <img> ls` e `npm ls --omit=dev` confirmam)
- O processo do container roda como o usuário `node`, não como `root`
- O mesmo `<img>` executa `node dist/main`, `node dist/worker.main` e `npm run migration:run:prod` só trocando o comando

---

### SI-07.22 — Rota-ponte GET /auth/confirm-email no BFF

**Description:** Dar destino ao link de confirmação do e-mail sem expor a API: uma Route Handler do BFF no mesmo path do link repassa a confirmação ao Nest com a identidade do visitante e redireciona para o login. É uma **ponte** até a tela RSC de confirmação, adiada em `phase-02-auth-frontend`, ocupar o mesmo path (per `testes-producao/TD-07`, Revisions "Superfície pública revista" e "Rota de confirmação como ponte").

**Technical actions:**

1. Criar `next-frontend/app/auth/confirm-email/route.ts` com `GET` — fora de `app/api/` porque o path tem de ser o do link que `nestjs-project/src/mail/mail.service.ts` já monta (`${APP_URL}/auth/confirm-email?token=`), sem mudar o e-mail (per `testes-producao/TD-07`)
2. Ler `token` dos `searchParams` e chamar `upstream.GET("/auth/confirm-email", { params: { query: { token } } })` pelo client de `@/lib/api/upstream`, que já anexa `X-Client-IP` e `X-Internal-Token` (`rate-limit-visitor-identity/TD-02`); sem `token`, não chama o upstream
3. Responder `303` com `Location: /login` em todos os desfechos (`204`, `400`, `401`, `429` ou token ausente): a ponte não tem tela para mostrar erro, e o login já recusa conta não confirmada com `403 EMAIL_NOT_CONFIRMED`
4. Acrescentar em `next-frontend/mocks/handlers/auth.ts` o handler `GET ${env.API_URL}/auth/confirm-email` — `204` por padrão e `401 INVALID_TOKEN` para um token de gatilho reservado, que não colida com valores de fixture do Vitest (`next-frontend-msw-foundation/TD-04`)

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `GET /auth/confirm-email` (Route Handler) | Integration (MSW): `204` do upstream → `303 /login`; `401` → `303 /login`; sem `token` → `303 /login` sem chamar o upstream; o upstream recebe `X-Client-IP` e `X-Internal-Token` | `next-frontend/app/auth/confirm-email/__tests__/route.integration.test.ts` |

**Dependencies:** SI-07.18 (a ponte confirma a cada visita, então a confirmação no backend precisa ser idempotente)

**Acceptance criteria:**

- Abrir `/auth/confirm-email?token=<válido>` no navegador confirma a conta e termina em `/login`
- Abrir o mesmo link uma segunda vez também termina em `/login`, e o login da conta funciona
- Abrir `/auth/confirm-email` com token inválido ou sem token termina em `/login`, e a conta continua sem confirmar (o login responde `403 EMAIL_NOT_CONFIRMED`)
- Nenhuma rota do Nest precisa ficar acessível ao navegador para a confirmação funcionar

---

### SI-07.23 — Infra: imagem de produção do BFF (next-frontend)

**Description:** Criar a imagem de produção do Next com saída `standalone`, construída localmente pelo compose da raiz, com os segredos lidos só em tempo de execução (per `testes-producao/TD-09`, Option B).

**Technical actions:**

1. Em `next-frontend/next.config.ts`, acrescentar `output: "standalone"`, mantendo `serverExternalPackages` e o rewrite `/@:nickname` como estão
2. Em `next-frontend/lib/env.ts`, acrescentar `skipValidation: !!process.env.SKIP_ENV_VALIDATION` ao `createEnv` — permite o `next build` da imagem sem `API_URL`, `SESSION_PASSWORD` e `INTERNAL_API_SECRET`; em execução a variável não existe e a validação continua valendo (`next-frontend-config-base/TD-02`)
3. Criar `next-frontend/Dockerfile` multi-stage sobre a base do `Dockerfile.dev` (`node:22.16.0-slim`): estágio de build com `npm ci` e `SKIP_ENV_VALIDATION=1 npm run build`; estágio final com `.next/standalone`, `.next/static` e `public/`, `NODE_ENV=production`, `HOSTNAME=0.0.0.0`, `PORT=3000`, `USER node` e `CMD ["node", "server.js"]`
4. Criar `next-frontend/.dockerignore` excluindo `node_modules`, `.next`, `.env*`, `tests`, `playwright-report`, `test-results` e `specs`

**Tests:** _(empty — Infra; a imagem é exercitada pela stack de produção em SI-07.26)_

**Dependencies:** none

**Acceptance criteria:**

- `docker build next-frontend` termina com sucesso sem nenhum `.env` presente
- O container sobe com `API_URL`, `SESSION_PASSWORD` e `INTERNAL_API_SECRET` definidos e responde `200` em `/`; sem `API_URL`, falha na primeira leitura de env com a mensagem de validação
- Sem `MSW_ENABLED`, o servidor de produção não registra o MSW: as chamadas ao upstream saem para `API_URL`
- `npm run build` e `npm run dev` fora do Docker continuam funcionando, e a validação de env continua acusando chave ausente quando `SKIP_ENV_VALIDATION` não está definida
- O processo do container roda como o usuário `node`

---

### SI-07.24 — Infra: configuração do Caddy da stack de produção

**Description:** Escrever o `Caddyfile` da borda: HTTP em `localhost`, todo o site para o BFF com o `X-Forwarded-For` sobrescrito, e o storage num endereço próprio; nenhuma rota do Nest exposta (per `testes-producao/TD-07` e as Revisions "Superfície pública revista" e "Sem TLS na stack local").

**Technical actions:**

1. Criar `deploy/Caddyfile` com `auto_https off` nas opções globais — sem TLS e sem CA interna, servindo `http://` (per `testes-producao/TD-07`, Revision "Sem TLS na stack local")
2. Site do app (porta interna `:80`): `reverse_proxy bff:3000` com `header_up X-Forwarded-For {remote_host}`, para a borda **sobrescrever** o valor vindo do cliente (`rate-limit-visitor-identity/TD-01`); sem limite de corpo, para o upload tus atravessar a borda inteiro
3. Site do storage (porta interna própria, ex.: `:9001`): `reverse_proxy minio:9000` preservando o `Host` recebido, que é o mesmo host com que a API assinou a URL (`MINIO_PUBLIC_URL`, SI-07.19); não é um path da mesma origem, porque o bucket `videos` em path-style colidiria com `/videos/{publicId}` do front (per `testes-producao/TD-07`)
4. Nenhum site nem rota aponta para o serviço da API: o link de confirmação é atendido pela rota-ponte do BFF (SI-07.22)

**Tests:** _(empty — Infra; o roteamento é exercitado pela stack de produção em SI-07.26 e pela suíte full-stack)_

**Dependencies:** none

**Acceptance criteria:**

- `caddy validate --config deploy/Caddyfile` (dentro da imagem oficial do Caddy) termina sem erro
- Uma requisição ao site do app com `X-Forwarded-For: 203.0.113.9` forjado chega ao BFF com o IP real do cliente, não com o forjado
- Uma URL assinada com `MINIO_PUBLIC_URL` abre a mídia pelo site do storage sem `SignatureDoesNotMatch`
- Nenhum path servido pelo Caddy alcança o Nest diretamente (`/health`, `/auth/login` e `/api/docs` respondem pelo BFF ou dão `404` dele)

---

### SI-07.25 — Infra: compose de produção na raiz e env de produção

**Description:** Descrever a stack de produção local inteira num compose na raiz, com uma rede só e instância única de cada processo, que sobe só no Docker local (per `testes-producao/TD-04` e suas Revisions de host, instância única e topologia; `testes-producao/TD-05`, `TD-06`, `TD-08`, `TD-09`, `TD-10` e `TD-11`).

**Technical actions:**

1. Criar `compose.prod.yaml` na raiz com os serviços de infraestrutura numa rede única: `db` (Postgres 17, volume próprio, `healthcheck` com `pg_isready`), `redis`, `minio` (volume próprio, MinIO como storage de produção — per `testes-producao/TD-05`) e `mailpit` (SMTP só na rede interna; UI e API HTTP publicadas no host — per `testes-producao/TD-08`). Nenhum serviço de backup (per `testes-producao/TD-11`, Option C)
2. Acrescentar os serviços de aplicação, uma instância de cada: `migrate` (imagem de SI-07.21, `command: npm run migration:run:prod`, `depends_on: db: service_healthy`, `restart: "no"`); `api` (mesma imagem, sem porta publicada, `depends_on: migrate: service_completed_successfully`, `healthcheck` chamando `GET /health` com `node -e "fetch(...)"`, já que a imagem slim não tem `curl`); `worker` (mesma imagem, `command: node dist/worker.main`, `depends_on: migrate`, `stop_grace_period` folgado para terminar o job em andamento — SI-07.17); `bff` (imagem de SI-07.23, `API_URL=http://api:3000` pelo nome do serviço, `depends_on: api: service_healthy`) (per `testes-producao/TD-04`, `TD-06`, `TD-10`)
3. Acrescentar o serviço `caddy` (imagem oficial, monta `deploy/Caddyfile`), o único que publica as portas do app e do storage; todas as portas publicadas (Caddy app, Caddy storage, UI do Mailpit) vêm de variáveis com default que não colide com o dev (ex.: `8080`, `9100`, `8125`) (per `testes-producao/TD-07`)
4. Criar `.env.production.example` na raiz com todas as chaves que a API, o worker e o BFF exigem (as de `nestjs-project/.env.example` e de `next-frontend/lib/env.ts`), um único `INTERNAL_API_SECRET` lido por `api` e `bff` (`rate-limit-visitor-identity/TD-02`), `APP_URL=http://localhost:<porta do app>` e `MINIO_PUBLIC_URL=http://localhost:<porta do storage>`; acrescentar `.env.production` ao `.gitignore` da raiz (per `testes-producao/TD-09`)
5. `restart: unless-stopped` nos serviços de longa duração (`db`, `redis`, `minio`, `mailpit`, `api`, `worker`, `bff`, `caddy`)

**Tests:** _(empty — Infra; a stack é subida e verificada em SI-07.26)_

**Dependencies:** SI-07.16 (`healthcheck` da API), SI-07.19 (`MINIO_PUBLIC_URL`), SI-07.21 (imagem do Nest), SI-07.23 (imagem do BFF), SI-07.24 (`Caddyfile`)

**Acceptance criteria:**

- `docker compose -f compose.prod.yaml --env-file .env.production.example config` termina sem erro
- Só `caddy` e `mailpit` publicam portas no host; `api`, `db`, `redis`, `minio` e `bff` não aparecem em `docker compose ps` com porta publicada
- `api` e `worker` só iniciam depois que `migrate` termina com código `0`; uma migration com erro impede a subida dos dois
- `.env.production` não é rastreado pelo git (`git check-ignore .env.production` confirma)
- A stack de produção sobe ao mesmo tempo que os compose de dev dos dois subprojetos, sem conflito de porta

---

### SI-07.26 — Subir, validar e documentar a stack de produção local

**Description:** Fechar o "ambiente de produção configurado": subir a stack do compose da raiz, percorrer à mão os fluxos que dependem da borda, do storage e do e-mail, e documentar como operá-la. É o gate de conclusão do ambiente, já que não há servidor externo nem roteiro de deploy (per `testes-producao/TD-04`, Revision de host).

**Technical actions:**

1. Subir a stack com `docker compose -f compose.prod.yaml --env-file .env.production up -d --build` a partir de um `.env.production` copiado do exemplo, e confirmar que todos os serviços de longa duração ficam `healthy`/`running` e que o `migrate` saiu com `0` (per `testes-producao/TD-06`, `TD-10`)
2. Percorrer pelo navegador, na porta do app: cadastro → e-mail na UI do Mailpit → link de confirmação → `/login` → login; upload de um vídeo curto → processamento → página do vídeo tocando pela URL do storage (per `testes-producao/TD-05`, `TD-07`, `TD-08`)
3. Parar o `worker` durante um processamento e conferir que ele termina o job antes de sair (SI-07.17)
4. Acrescentar ao `README.md` da raiz a seção "Stack de produção local": como criar o `.env.production`, subir, derrubar e ver logs; as portas (app, storage, UI do Mailpit); e os limites assumidos — uso só a partir da própria máquina (`testes-producao/TD-07`), sem backup (`testes-producao/TD-11`), e-mails capturados pelo Mailpit e não entregues (`testes-producao/TD-08`), recuperação de senha sem destino como lacuna conhecida (`testes-producao/TD-07`)

**Tests:** _(empty — verificação manual da stack; a cobertura automatizada dos fluxos é a suíte full-stack de SI-07.27 e SI-07.28)_

**Dependencies:** SI-07.25 (compose), SI-07.17 (encerramento gracioso), SI-07.22 (rota-ponte de confirmação)

**Acceptance criteria:**

- Depois do `up`, `docker compose -f compose.prod.yaml ps` mostra `api` `healthy`, `migrate` `exited (0)` e os demais serviços de longa duração em execução
- `http://localhost:<porta do app>/` responde `200` com a home renderizada pelo BFF de produção
- Uma conta criada pelo site recebe o e-mail na UI do Mailpit; o link do e-mail leva a `/login`, e o login dessa conta funciona
- Um vídeo enviado pelo site chega a publicado, e a página dele toca o vídeo e mostra a thumbnail por URLs em `http://localhost:<porta do storage>/`
- `docker compose -f compose.prod.yaml stop worker` durante um processamento não deixa o vídeo preso em `processing`
- O `README.md` da raiz documenta subir, derrubar, portas e os quatro limites assumidos da stack local

---

### SI-07.27 — Infra: harness da suíte full-stack

**Description:** Montar a infraestrutura da suíte de fumaça que roda o Playwright contra a stack real: um projeto Compose próprio, zerado a cada execução, sobre o mesmo `compose.prod.yaml`, sem tocar a stack de produção nem as suítes MSW atuais (per `testes-producao/TD-01`, Option A; `testes-producao/TD-02`, Option A e Revision de isolamento).

**Technical actions:**

1. Criar `next-frontend/playwright.fullstack.config.ts`: `testDir: "./fullstack"`, `testMatch: "**/*.e2e-spec.ts"`, `baseURL` da porta do app do projeto da suíte, `workers: 1`, sem `webServer` (a stack é Docker) e com `globalSetup`/`globalTeardown` próprios; a config atual (`testDir: "./tests"`) continua sem enxergar esses arquivos (per `testes-producao/TD-01`)
2. Criar `next-frontend/fullstack/global-setup.ts` e `global-teardown.ts`: o setup roda `docker compose -p streamtube-fullstack -f ../compose.prod.yaml --env-file fullstack/fullstack.env up -d --build --wait`; o teardown roda `down -v`, apagando os volumes do projeto da suíte (per `testes-producao/TD-02`, Revision de isolamento)
3. Criar `next-frontend/fullstack/fullstack.env` com valores só de teste e portas próprias (app, storage e UI do Mailpit), distintas das da stack de produção e das do dev. O nome não começa com `.env` porque o `.gitignore` do `next-frontend` ignora `.env*`
4. Criar `next-frontend/fullstack/helpers.ts`: e-mail único por execução; leitura do link de confirmação pela API do Mailpit (`GET /api/v1/search?query=to:<email>` e depois `GET /api/v1/message/{ID}`); um helper que cadastra e confirma uma conta. Versionar `next-frontend/fullstack/fixtures/sample.mp4`, um vídeo de cerca de 8 s — curto para o processamento, mas acima do limiar de 5 s de reprodução que conta a view (`video-watch-page/TD-03`) (per `testes-producao/TD-02`)
5. Acrescentar em `next-frontend/package.json` o script `test:fullstack` = `playwright test -c playwright.fullstack.config.ts`, para rodar no host como o Playwright atual

**Tests:** _(empty — harness; exercitado pelas jornadas de SI-07.28)_

**Dependencies:** SI-07.25 (compose de produção), SI-07.26 (stack validada)

**Acceptance criteria:**

- `npm run test:fullstack` sem nenhum spec sobe o projeto `streamtube-fullstack`, espera os serviços ficarem saudáveis, termina e derruba o projeto com os volumes
- Rodar a suíte com a stack de produção local de pé não altera nenhum dado dela (contas, vídeos e e-mails da produção continuam os mesmos)
- `npx playwright test` (a suíte MSW atual) não coleta nenhum arquivo de `fullstack/`, e o Vitest também não
- `git status` depois de criar os arquivos lista `fullstack/fullstack.env` como rastreável

---

### SI-07.28 — Jornadas da suíte full-stack: os cinco fluxos principais

**Description:** Escrever as cinco jornadas que provam a integração BFF ↔ API ↔ worker ↔ storage ↔ e-mail contra a stack real, uma por fase entregue; a recuperação de senha fica fora (per `testes-producao/TD-01`, Option A e Revision dos fluxos; `testes-producao/TD-02`).

**Technical actions:**

1. Estender `next-frontend/fullstack/helpers.ts` com um helper que entra com uma conta confirmada, envia `fixtures/sample.mp4` pelas rotas do BFF que o site usa e espera o vídeo chegar a publicado — para as jornadas 3 a 5 criarem os próprios dados sem depender da ordem dos arquivos (per `testes-producao/TD-02`)
2. Criar `next-frontend/fullstack/cadastro-confirmacao-login.e2e-spec.ts` — fluxo 1: cadastro em `/signup` → link lido no Mailpit → visita ao link (rota-ponte, SI-07.22) → `/login` → login → logout
3. Criar `next-frontend/fullstack/upload-publicacao.e2e-spec.ts` — fluxo 2: envio do vídeo pela tela de upload (tus atravessando BFF e Caddy) → processamento no worker → publicação
4. Criar `next-frontend/fullstack/assistir-video.e2e-spec.ts` — fluxo 3: a página do vídeo carrega a mídia pela URL assinada no host do storage e conta a view depois de 5 s de reprodução; e `next-frontend/fullstack/interacoes-sociais.e2e-spec.ts` — fluxo 4: like, comentário e inscrição de uma segunda conta
5. Criar `next-frontend/fullstack/home-busca-categoria.e2e-spec.ts` — fluxo 5: o vídeo publicado aparece na home, na busca pelo título e no filtro da sua categoria; e documentar a suíte full-stack no `next-frontend/CLAUDE.md` (o que cobre, como rodar `npm run test:fullstack`, e que ela é distinta da suíte MSW)

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| Fluxo 1 — cadastro, confirmação e login | E2E full-stack (Playwright contra a stack real) | `next-frontend/fullstack/cadastro-confirmacao-login.e2e-spec.ts` |
| Fluxo 2 — upload, processamento e publicação | E2E full-stack | `next-frontend/fullstack/upload-publicacao.e2e-spec.ts` |
| Fluxo 3 — assistir e contar view | E2E full-stack | `next-frontend/fullstack/assistir-video.e2e-spec.ts` |
| Fluxo 4 — like, comentário e inscrição | E2E full-stack | `next-frontend/fullstack/interacoes-sociais.e2e-spec.ts` |
| Fluxo 5 — home, busca e categoria | E2E full-stack | `next-frontend/fullstack/home-busca-categoria.e2e-spec.ts` |

**Dependencies:** SI-07.27 (harness), SI-07.22 (rota-ponte de confirmação), SI-07.19 (URLs de mídia alcançáveis)

**Acceptance criteria:**

- `npm run test:fullstack` executa as cinco jornadas e todas passam contra uma stack zerada
- Uma conta nova só consegue entrar depois de visitar o link lido no Mailpit; antes disso o login responde `403 EMAIL_NOT_CONFIRMED`
- Um vídeo enviado pela tela de upload chega a publicado sem intervenção manual, processado pelo `worker`
- A requisição de mídia da página do vídeo vai para o host do storage e responde `200` ou `206`, e o contador de views aumenta em 1 depois de 5 s de reprodução
- Like, comentário e inscrição feitos por uma segunda conta aparecem para ela depois de recarregar a página
- A busca pelo título exato e o filtro pela categoria do vídeo enviado o listam
- Rodar a suíte duas vezes seguidas dá o mesmo resultado (cada execução começa de volumes vazios)

---

### SI-07.29 — Infra: pipeline de CI como portão do PR

**Description:** Pôr na CI as suítes de cada subprojeto, `tsc`, lint e a suíte full-stack, dirigindo os próprios compose do projeto, ao lado do workflow `freshness` que já existe. Sem deploy, a CI é o portão do PR e não alimenta entrega (per `testes-producao/TD-03`, Option B e Revision; `next-frontend-openapi-typing/TD-03`).

**Technical actions:**

1. Criar `.github/workflows/ci.yml`, disparado em `pull_request` e em `push` na `main` como o `openapi-freshness.yml`, que fica como está (a checagem de frescor do contrato continua no job `freshness` existente) (per `testes-producao/TD-03`)
2. Job `backend`: gerar `nestjs-project/.env` a partir do `.env.example`, `docker compose up -d` em `nestjs-project/`, `npm ci` no container e rodar `npm test -- --runInBand`, `npm run test:e2e`, `npx tsc --noEmit` e o ESLint **sem** `--fix` (o `npm run lint` corrige arquivos, o que na CI esconderia o erro) — os mesmos comandos da Definition of Done, no mesmo Node do dev
3. Job `frontend`: gerar o `.env.local` do `next-frontend` com valores só de CI (o `.gitignore` do subprojeto ignora `.env*`, então não há exemplo versionado para copiar), `docker compose up -d`, `npm ci` no container e rodar `npm test`, `npx tsc --noEmit` e `npm run lint`
4. Job `frontend-e2e`: subir o `next dev` no container com `MSW_ENABLED=true` (em comando separado, como manda o `next-frontend/CLAUDE.md`), instalar o Chromium do Playwright no runner e rodar `npx playwright test`
5. Job `fullstack`: instalar as dependências e o Chromium do Playwright no runner e rodar `npm run test:fullstack` em `next-frontend/`, que sobe e derruba o projeto Compose da suíte (SI-07.27); publicar o relatório do Playwright como artefato quando falhar

**Tests:** _(empty — Infra; o próprio workflow é o teste e é verificado no PR que o introduz)_

**Dependencies:** SI-07.28 (a suíte full-stack que o job `fullstack` roda)

**Acceptance criteria:**

- Um PR mostra as checagens `backend`, `frontend`, `frontend-e2e`, `fullstack` e `freshness`, todas verdes no PR que introduz o workflow
- Um teste quebrado em qualquer subprojeto reprova a checagem correspondente
- Um erro de lint ou de tipo reprova a checagem do subprojeto, sem que a CI corrija e esconda o erro
- O job `fullstack` derruba o projeto Compose da suíte mesmo quando uma jornada falha

---

## Technical Specifications

### API Contracts

#### GET /health (SI-07.16)

Endpoint novo de saúde da API, consumido pelo `healthcheck` do compose de produção, pela ordem de subida (`depends_on: condition: service_healthy`) e pela verificação da stack (testes-producao/TD-10, Option B — health simples, sem dependência nova).

**Request headers:**
- nenhum obrigatório — rota pública (`@Public()`), sem autenticação

**Response 200:**
- status: string — sempre `"ok"`; a resposta significa "o processo da API subiu e atende HTTP". Não consulta banco, fila nem storage (é o health simples da Option B; o Terminus fica para quando houver agregador de logs, conforme a Recommendation do TD-10)

**Error responses:**
- nenhum de domínio — processo fora do ar não responde (conexão recusada), que é o sinal que o `healthcheck` do compose lê
- 429 RATE_LIMIT_EXCEEDED: só se o mesmo visitante passar do default global de 120 req/60 s (rate-limit-visitor-identity/TD-04); o `healthcheck` do compose a cada 10 s consome 6/min

Fica **fora do Swagger** (`@ApiExcludeController()`): é infraestrutura, não contrato do front, e assim não altera o `openapi.json` nem o `types.gen.ts` da cadeia de contrato (next-frontend-openapi-typing/TD-03).

---

#### GET /auth/confirm-email (SI-07.18)

Endpoint existente (Fase 02). Muda só o caso do token já usado, para a confirmação ficar idempotente — pré-requisito da rota-ponte do BFF que confirma a cada visita ao link (testes-producao/TD-07, Revision "Rota de confirmação como ponte").

**Request query parameters:**
- token: string, required — o token bruto do e-mail de confirmação

**Response 204:** No content. Agora em dois casos:
- token válido, não usado e não expirado → marca a conta como confirmada e o token como usado (comportamento atual);
- **novo:** token já usado (`used_at` preenchido) cuja conta já está confirmada (`is_confirmed = true`) → nenhuma escrita, 204.

**Error responses:**
- 401 INVALID_TOKEN: token inexistente, ou já usado de uma conta ainda não confirmada
- 401 TOKEN_EXPIRED: token não usado e expirado (inalterado)
- 400 validation error: `token` ausente ou vazio (inalterado)
- 429 RATE_LIMIT_EXCEEDED: acima de `AUTH_THROTTLE` (10/60 s por visitante — rate-limit-visitor-identity/TD-04, inalterado)

A idempotência vale **só para a confirmação de e-mail**: o `reset-password` continua de uso único (o token usado segue recusado).

---

## Dependency Map

```
SI-07.16 (root) — GET /health
SI-07.17 (root) — encerramento gracioso
SI-07.18 (root) — confirmação idempotente
└── SI-07.22 — depends on SI-07.18 (a ponte confirma a cada visita ao link)
SI-07.19 (root) — endpoint público de assinatura
SI-07.20 (root) — migrations a partir do build
└── SI-07.21 — depends on SI-07.20 (o migrate roda migration:run:prod)
SI-07.23 (root) — imagem do BFF
SI-07.24 (root) — Caddyfile

SI-07.25 — depends on SI-07.16 (healthcheck), SI-07.19 (MINIO_PUBLIC_URL), SI-07.21 (imagem do Nest), SI-07.23 (imagem do BFF), SI-07.24 (Caddyfile)
└── SI-07.26 — depends on SI-07.25, SI-07.17 (parada do worker), SI-07.22 (link de confirmação)
    └── SI-07.27 — depends on SI-07.25, SI-07.26 (harness sobre a stack validada)
        └── SI-07.28 — depends on SI-07.27, SI-07.22, SI-07.19 (jornadas)
            └── SI-07.29 — depends on SI-07.28 (o job fullstack roda a suíte)
```

---

## Deliverables

- [ ] SI-07.16 — Endpoint GET /health
- [ ] SI-07.17 — Ligar o encerramento gracioso da API e do worker
- [ ] SI-07.18 — Tornar idempotente a confirmação de e-mail
- [ ] SI-07.19 — Assinar URLs de mídia com um endpoint público separado
- [ ] SI-07.20 — Infra: rodar as migrations a partir do build compilado
- [ ] SI-07.21 — Infra: imagem de produção do nestjs-project
- [ ] SI-07.22 — Rota-ponte GET /auth/confirm-email no BFF
- [ ] SI-07.23 — Infra: imagem de produção do BFF (next-frontend)
- [ ] SI-07.24 — Infra: configuração do Caddy da stack de produção
- [ ] SI-07.25 — Infra: compose de produção na raiz e env de produção
- [ ] SI-07.26 — Subir, validar e documentar a stack de produção local
- [ ] SI-07.27 — Infra: harness da suíte full-stack
- [ ] SI-07.28 — Jornadas da suíte full-stack: os cinco fluxos principais
- [ ] SI-07.29 — Infra: pipeline de CI como portão do PR

**Full test suites:**

- [ ] Backend tests pass (`cd nestjs-project && docker compose exec nestjs-api npm test -- --runInBand`)
- [ ] Backend E2E tests pass (`cd nestjs-project && docker compose exec nestjs-api npm run test:e2e`)
- [ ] Backend type/compilation checks pass (`cd nestjs-project && docker compose exec nestjs-api npx tsc --noEmit`) and lint passes (`docker compose exec nestjs-api npm run lint`)
- [ ] Frontend tests pass (`cd next-frontend && docker compose exec next-frontend npm test`)
- [ ] Frontend type/compilation checks pass (`cd next-frontend && docker compose exec next-frontend npx tsc --noEmit`) and lint passes (`docker compose exec next-frontend npm run lint`)
- [ ] Frontend E2E (MSW) tests pass (`cd next-frontend && npx playwright test`, on the host, with the dev server running `MSW_ENABLED=true`)
- [ ] Full-stack suite passes (`cd next-frontend && npm run test:fullstack`, on the host)
- [ ] Production stack builds and comes up healthy (`docker compose -f compose.prod.yaml --env-file .env.production up -d --build`)
