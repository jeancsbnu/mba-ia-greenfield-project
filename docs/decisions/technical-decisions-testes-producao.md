---
scope_type: phase
related_phases: [7]
status: decided
date: 2026-10-11
scope_description: "Fatia testes-producao da Fase 07: testes ponta a ponta dos fluxos principais contra a stack real, pipeline de CI e o ambiente de produção (hospedagem, storage, proxy/TLS, e-mail, migrations, entrega, saúde e backup)"
covers_capabilities:
  - "Testes dos fluxos principais da plataforma"
  - "Ambiente de produção e deploy"
depends_on_slices: [home-busca]
---

# Technical Decisions — Fase 07, fatia testes-producao

_Subprojects in scope:_

- `nestjs-project/` — recebe:
  - o que a produção exige da API e do worker: migrations compiladas, healthcheck, encerramento gracioso, transporte SMTP autenticado e o endpoint público do storage;
  - a stack real que a suíte ponta a ponta exercita.

  Coberto por TD-01, TD-02, TD-05, TD-06, TD-08 e TD-10.
- `next-frontend/` — recebe:
  - a suíte Playwright que roda contra o backend real;
  - a imagem de produção do BFF, atrás do proxy;
  - o host público do storage nas thumbnails.

  Coberto por TD-01, TD-02, TD-05 e TD-09.
- Repositório (CI, compose de produção, proxy, entrega) — coberto por TD-03, TD-04, TD-07, TD-09 e TD-11.

**Fora desta fatia:** as seis bullets de home, busca, navbar, paginação e responsividade pertencem à fatia `home-busca`, já implementada (PR #80). Os fluxos dela entram aqui só como **alvo** dos testes, e é por isso que `depends_on_slices: [home-busca]`.

**Decisões herdadas que restringem esta fatia** (não reabrir):

- `upload-processing/TD-01`: o storage é S3-compatível, acessado por `@aws-sdk/client-s3`. MinIO foi decidido para o desenvolvimento, e o próprio TD diz que "o mesmo código funcionaria contra AWS S3 real em produção só trocando variáveis de ambiente". O storage **de produção** fica aberto e é decidido no TD-05.
- `upload-processing/TD-02` (BullMQ + Redis), `TD-03` (tus), `TD-05` (worker como entrypoint separado), `TD-06` (`ffmpeg-static`) e `TD-08` (URLs pré-assinadas direto ao storage).
- `next-frontend-config-base/TD-03`: BFF estrito, com `API_URL` server-only. O navegador nunca fala com o Nest, então a API **não precisa ser pública**. O TD deixou a topologia de rede Docker explicitamente em aberto.
- `phase-01-configuracao-base/TD-01` a `TD-04` (`@nestjs/config` + Joi + `registerAs`) e `next-frontend-config-base/TD-01`/`TD-02` (Zod 4 + `@t3-oss/env-nextjs`): toda chave nova de produção entra nesses schemas.
- `next-frontend-msw-foundation/TD-01` a `TD-04`: o upstream fingido por MSW continua sendo a base das suítes Vitest e Playwright atuais.
- `rate-limit-visitor-identity/TD-02`: `INTERNAL_API_SECRET` é o mesmo nos dois lados e o BFF repassa `X-Client-IP`. A produção precisa mantê-lo igual nos dois containers.

**Estado atual relevante** (lido no disco em 2026-10-11):

- **Produção:**
  - Não existe nada de produção: nem Dockerfile de produção, nem compose de produção, nem build multi-stage, nem `.dockerignore`.
  - Os dois `Dockerfile.dev` usam Node diferentes: 25.6 no backend e 22.16 no frontend.
  - `next.config.ts` não tem `output: "standalone"` nem `images.remotePatterns`.
- **Duas stacks Compose separadas, sem rede comum:**
  - o frontend chega ao Nest por `API_URL=http://host.docker.internal:3000`;
  - o Postgres de dev não tem volume de dados.
- **Presigned URLs:** o host é `MINIO_ENDPOINT:MINIO_PORT`, que dentro do Docker é `minio:9000`. Esse host não resolve no navegador. Não há configuração de "origem pública" do storage.
- **Migrations:** rodam por `typeorm-ts-node-commonjs` sobre `src/database/data-source.ts`, ou seja, dependem de `ts-node`.
- **Observabilidade:**
  - não há endpoint de saúde (`GET /` devolve "Hello World!");
  - não há biblioteca de log;
  - não há `enableShutdownHooks` na API nem no worker.
- **E-mail:** o `@nestjs-modules/mailer` usa transporte `{host, port}`, sem autenticação e sem TLS. Só funciona com o Mailpit.
- **CI:** o único workflow é `openapi-freshness.yml`. Nenhum teste, lint ou build roda em CI.
- **Testes:**
  - Backend: 16 arquivos unit, 35 de integração e 26 e2e (supertest), contra Postgres, Redis e MinIO reais com recursos `_test`.
  - Frontend: 89 arquivos Vitest e 19 specs Playwright, todos com o upstream fingido por MSW dentro do `next dev`.
  - **Nenhum teste roda o frontend contra o backend real.** Por isso nunca foram exercitados juntos, por exemplo:
    - o `X-Internal-Token`;
    - o proxy tus do BFF até o `@tus/server`;
    - o redirect para a URL pré-assinada;
    - o worker processando um upload.

> **Nota de método.** O MCP context7 não está disponível nesta sessão, como nas pesquisas anteriores. Os fatos externos foram verificados por busca na web:
> - **MinIO:** a edição community parou de publicar imagens Docker em outubro de 2025 e entrou em modo de manutenção em dezembro de 2025, com distribuição só em código-fonte (fontes: [ayedo — MinIO in Maintenance Mode](https://ayedo.de/en/posts/minio-im-maintenance-mode/), [github.com/minio/minio](https://github.com/minio/MinIO)).
> - **Cloudflare R2:** exige que todas as partes não finais de um multipart tenham o mesmo tamanho e só assina URLs no endpoint `*.r2.cloudflarestorage.com` (fonte: [Cloudflare R2 — error codes](https://developers.cloudflare.com/r2/api/error-codes/)).
> - **GitHub Actions:** `services:` não aceita sobrescrever o `command` da imagem, e o MinIO precisa de `server /data`. Esse é o motivo do TD-03.

---

## TD-01: Camada dos testes ponta a ponta dos fluxos principais

**Scope:** Repo-wide

**Capability:** Testes dos fluxos principais da plataforma

**Context:** As suítes atuais testam cada lado isoladamente: o Playwright usa um Nest fingido por MSW, e o supertest testa o Nest sem frontend. A capability pede os **fluxos principais da plataforma**, e o que nenhum teste prova é a costura entre os containers:
- o BFF assinando chamadas com `X-Internal-Token` e repassando `X-Client-IP`;
- o upload tus atravessando o route handler até o `@tus/server`;
- o worker processando o vídeo;
- o redirect para a URL pré-assinada;
- os cookies do iron-session sobre a API real.

A decisão é onde essa prova mora.

**Options:**

### Option A: Suíte de fumaça full-stack, além das suítes atuais
- Um conjunto pequeno de jornadas Playwright (cadastro, confirmação e login; upload até "pronto" e reprodução; publicar; comentar e reagir; inscrição; home e busca) contra a stack real, subida por um compose de teste com Next em build de produção, Nest, worker, Postgres, Redis, MinIO e Mailpit.
- As suítes MSW e supertest continuam como estão.
- **Pros:** cobre exatamente a costura que falta, sem duplicar os ~100 cenários de tela que o MSW já cobre de forma rápida e determinística. Também exercita o build de produção do Next.
- **Cons:** é mais um ambiente para manter. É lenta (o worker processa vídeo de verdade) e precisa de dados preparados (TD-02).

### Option B: Considerar as suítes atuais suficientes e acrescentar teste de contrato
- Os e2e supertest validam cada resposta do Nest contra o `openapi.json`, que é a mesma fonte dos tipos e dos fixtures MSW do frontend.
- **Pros:** é barato e rápido, e pega divergência de forma entre API e mocks.
- **Cons:** não exercita a integração em tempo de execução (headers internos, tus via BFF, worker, URLs pré-assinadas, sessão). O contrato pode estar certo e o fluxo, quebrado.

### Option C: Migrar o Playwright inteiro para a stack real
- As 19 specs passam a rodar contra o Nest real, e o MSW sai dos E2E.
- **Pros:** um único tipo de E2E, todo realista.
- **Cons:** perde os triggers determinísticos que os specs usam (erros 500, 409, estados de processamento). Torna a suíte inteira lenta e dependente de dados. Contradiz o desenho de `next-frontend-msw-foundation`.

**Recommendation:** Option A — é a única que prova a integração entre BFF, API, worker e storage, que nenhuma suíte cobre hoje, e mantém o MSW onde ele é forte: muitos cenários de tela, rápidos e com erros sob comando.

**Decision:** A (suíte de fumaça full-stack em Playwright contra a stack real, além das suítes MSW e supertest atuais, que ficam como estão). (resolve OQ-1 e AMB-1 do /plan-validate)

**Revisions:**

- 2026-10-12 — Fluxos da suíte fixados no resolve (mesma Option A; resolve AMB-1), um por fase entregue:
  1. cadastro → confirmação pelo link lido no Mailpit → login e logout;
  2. upload tus → processamento no worker → publicação;
  3. assistir com URL pré-assinada e view contada;
  4. like, comentário e inscrição;
  5. home, busca e categoria.

  A recuperação de senha fica fora da suíte: o front não tem tela de nova senha (adiada em `phase-02-auth-frontend`) e o link de reset segue como lacuna conhecida (DG-1, ver TD-07). A suíte roda contra a stack do compose de produção da raiz (TD-04).

---

## TD-02: Dados e estado da suíte full-stack

**Scope:** Repo-wide

**Capability:** Testes dos fluxos principais da plataforma

**Context:** A suíte do TD-01 roda contra um banco, uma fila e um bucket reais. Os fluxos dependem de conta confirmada por e-mail, canal, vídeos processados e outros usuários (para comentar e se inscrever). Como esses dados nascem e se isolam entre execuções decide quanto a suíte é confiável. Depende do TD-01.

**Options:**

### Option A: Ambiente zerado por execução, dados criados pelos próprios cenários
- Antes da suíte, o banco é recriado pelas migrations e o bucket e a fila de teste são esvaziados.
- Cada jornada cria o que precisa pela UI ou pela API: cadastro com confirmação lida na API do Mailpit, upload de um vídeo-fixture de poucos segundos versionado no repositório.
- **Pros:** cada jornada é independente e mostra o fluxo inteiro, inclusive o e-mail. Segue o padrão dos e2e do backend, que já zeram e recriam o banco de teste.
- **Cons:** é mais lenta, porque cada jornada paga cadastro e processamento. Exige helpers de Mailpit e de espera pelo processamento.

### Option B: Seed fixo carregado antes da suíte
- O seed de desenvolvimento (`npm run seed`, 5 contas, 10 vídeos reais no MinIO) é adaptado e carregado no ambiente de teste. Os cenários leem esses dados.
- **Pros:** as jornadas ficam rápidas e os dados ricos (vários canais e categorias).
- **Cons:** os cenários passam a depender uns dos outros por dados compartilhados. Um teste que publica ou apaga altera o próximo. O seed não prova o cadastro nem o processamento.

### Option C: Seed fixo com snapshot e restauração entre cenários
- Um dump do banco semeado é restaurado antes de cada jornada.
- **Pros:** os dados são ricos e isolados.
- **Cons:** o snapshot cobre só o Postgres, e bucket e fila ficam fora. A restauração por cenário é cara e é mais uma peça de infraestrutura.

**Recommendation:** Option A — com uma suíte pequena, como o TD-01 propõe, o custo por jornada é aceitável. Em troca, o isolamento é real e o cadastro e o processamento são exercitados, que são exatamente os fluxos principais que a capability pede.

**Decision:** A (ambiente zerado por execução; cada jornada cria os próprios dados — cadastro confirmado pelo link lido na API do Mailpit e upload de um vídeo-fixture curto versionado no repositório). (resolve OQ-2 do /plan-validate)

**Revisions:**

- 2026-10-12 — Isolamento da suíte fixado no resolve (mesma Option A; resolve IC-3, opção a): a suíte sobe o **mesmo** compose de produção da raiz com outro nome de projeto (`docker compose -p …`), com volumes próprios e portas publicadas próprias (Caddy e Mailpit, por env), e o derruba com os volumes ao terminar. Assim o "ambiente zerado por execução" vale só para o projeto da suíte, e a stack de produção local nunca é tocada; as duas podem rodar ao mesmo tempo.

---

## TD-03: Pipeline de CI

**Scope:** Repo-wide

**Capability:** Transversal — covers: `Testes dos fluxos principais da plataforma`; `Ambiente de produção e deploy`

**Context:** Hoje só a checagem de frescor do OpenAPI roda em CI. Todos os outros portões da Definition of Done (unit, integração, e2e, `tsc`, lint) são locais. O deploy (TD-09) precisa de um portão automático antes de publicar. O backend testa contra Postgres, Redis, MinIO e Mailpit reais, e a regra do projeto é que todo comando roda no container.

**Options:**

### Option A: GitHub Actions no runner, com `services:`
- Jobs por subprojeto rodam Node direto no runner. Postgres, Redis e Mailpit sobem como `services:` do job.
- **Pros:** é o padrão mais comum, com cache de `npm` nativo e jobs rápidos.
- **Cons:** `services:` não aceita sobrescrever o `command`, e o MinIO precisa de `server /data`; teria de subir por um passo `docker run` à parte. Os testes passam a rodar fora do container, contra a regra do projeto, e com Node diferente do de dev.

### Option B: GitHub Actions dirigindo os próprios compose do projeto
- Cada job faz `docker compose up` das stacks do subprojeto e roda `docker compose exec` com os mesmos comandos documentados nos `CLAUDE.md`. O job full-stack (TD-01) sobe o compose de teste. Os jobs são required no PR.
- **Pros:** é a mesma topologia e o mesmo Node do desenvolvimento. O MinIO sobe sem truque, e os comandos são os da Definition of Done.
- **Cons:** os jobs são mais lentos (sobem as imagens e instalam `node_modules` no volume). Depende de manter os compose aptos a rodar sem os `compose.override.yaml` locais.

### Option C: Sem CI de testes, verificação local antes do PR
- Mantém o fluxo atual: quem abre o PR roda as suítes.
- **Pros:** custo zero de infraestrutura.
- **Cons:** não há portão automático antes do deploy. O histórico da Fase 07 já registra suítes que só passavam isoladas.

**Recommendation:** Option B — reaproveita a topologia e os comandos que o projeto já trata como fonte da verdade, resolve o MinIO sem gambiarra e dá ao deploy do TD-09 um portão automático.

**Decision:** B (GitHub Actions dirigindo os próprios compose do projeto, com a checagem de frescor do `openapi.json`/`types.gen.ts` de `next-frontend-openapi-typing/TD-03`). (resolve OQ-3 do /plan-validate)

**Revisions:**

- 2026-10-12 — Sem deploy real (AMB-2 b, ver TD-04), a CI não alimenta nenhuma entrega: a frase da Recommendation sobre dar "ao deploy do TD-09 um portão automático" deixa de valer. A CI é o portão do PR, com as suítes de cada subprojeto, `tsc --noEmit`, lint, a checagem de frescor do contrato OpenAPI e a suíte full-stack do TD-01.

---

## TD-04: Plataforma de hospedagem

**Scope:** Repo-wide

**Capability:** Ambiente de produção e deploy

**Context:** A produção precisa hospedar seis peças: Next (BFF), API Nest, worker FFmpeg, Postgres, Redis e o storage. O worker é pesado em CPU, e o upload tus de até 10 GB mantém conexões longas atravessando o BFF. A escolha condiciona o storage (TD-05), o proxy (TD-07), a entrega (TD-09) e o backup (TD-11).

**Options:**

### Option A: VPS única com Docker Compose de produção
- Uma máquina virtual (Hetzner, DigitalOcean ou equivalente) roda um `compose.prod.yaml` com as imagens de produção, a mesma topologia do desenvolvimento numa rede só.
- **Pros:** reaproveita o modelo Compose que o projeto já usa, e o custo é fixo e baixo. Não há limite de duração de requisição nem de tamanho de corpo imposto por plataforma, e o worker usa toda a CPU da máquina.
- **Cons:** é um ponto único de falha, e patches, disco, backup e TLS ficam por conta do projeto. Escalar significa uma máquina maior.

### Option B: PaaS de containers com serviços gerenciados
- Render, Railway ou Fly.io rodam Next, API e worker como serviços, com Postgres e Redis gerenciados.
- **Pros:** deploy por `git push`, TLS e banco gerenciados, menos operação.
- **Cons:** cobra por serviço e por recurso (o worker com CPU para FFmpeg encarece). Proxies de plataforma impõem tempo máximo de requisição e tamanho de corpo, que precisam ser conferidos contra o tus. O storage continua sendo externo.

### Option C: Nuvem gerenciada (AWS)
- ECS Fargate para Next, API e worker, com RDS, ElastiCache, S3 e SES.
- **Pros:** escala e alta disponibilidade de verdade, tudo gerenciado.
- **Cons:** a complexidade e o custo são desproporcionais para o porte do projeto (VPC, IAM, load balancer, task definitions), e o código de infraestrutura passa a ser um subprojeto à parte.

**Recommendation:** Option A — o projeto já é descrito inteiro em Docker Compose, e uma VPS roda o worker e os uploads longos sem os limites de plataforma, com custo previsível. A operação que sobra (TLS, backup) é coberta pelos TD-07 e TD-11.

**Decision:** A (Docker Compose de produção, instância única, num compose da raiz que une os dois stacks numa rede só — executado só no Docker local, sem servidor externo). (resolve OQ-4, AMB-2, AMB-3 e AMB-4 do /plan-validate)

**Revisions:**

- 2026-10-12 — Host fixado no resolve (resolve AMB-2, opção b): a stack de produção roda **só no Docker local** e não será colocada em servidor externo. A VPS da Option A sai do escopo, e não há domínio, provedor nem roteiro de deploy. A fatia termina com os artefatos de produção completos (compose, Dockerfiles, configuração do proxy, workflow de CI), validados subindo essa stack localmente.
- 2026-10-12 — Instância única de API, worker e BFF (resolve AMB-3, opção a). O throttler em memória de `phase-02-auth/TD-08` continua valendo, e não há TD de storage do throttler em Redis.
- 2026-10-12 — Topologia de rede (resolve AMB-4, opção a): um compose de produção na raiz do repositório referencia as imagens de API, worker e BFF numa rede única. O BFF alcança a API pelo nome do serviço (`API_URL` com o nome do serviço, nunca `localhost`), e a API não publica porta no host. Os compose de desenvolvimento de cada subprojeto ficam como estão (`next-frontend-openapi-typing/TD-02`). A suíte full-stack do TD-01 sobe sobre esse mesmo compose.

---

## TD-05: Armazenamento de objetos em produção

**Scope:** Cross-layer

**Capability:** Ambiente de produção e deploy

**Context:** Vídeos de até 10 GB e as thumbnails vão para um storage S3-compatível. O navegador recebe URLs pré-assinadas desse storage: a reprodução e o download via redirect 302 e as thumbnails no `next/image`. Por isso o host do storage precisa ser **público** e estável, e o Next precisa conhecê-lo em `images.remotePatterns`. Hoje o host assinado é `minio:9000`, que só existe dentro do Docker. O plano do projeto lista o custo de armazenamento como ponto de atenção.

**Options:**

### Option A: MinIO auto-hospedado na VPS
- O mesmo MinIO do desenvolvimento roda em produção, num volume do servidor, exposto num subdomínio público (`media.dominio`) pelo proxy.
- **Pros:** é idêntico ao desenvolvimento e não depende de conta externa.
- **Cons:** a edição community **não publica mais imagens e está em modo de manutenção**: seria preciso compilar a imagem ou usar uma reconstrução de terceiros, sem patches de segurança garantidos. O espaço fica limitado ao disco da VPS, e o tráfego de vídeo sai da mesma máquina que roda tudo.

### Option B: Cloudflare R2
- Serviço S3-compatível acessado pelo mesmo `@aws-sdk/client-s3` e pelo `@tus/s3-store`, só trocando endpoint e credenciais. As URLs são assinadas no endpoint `*.r2.cloudflarestorage.com`.
- **Pros:** **não cobra egress**, o que pesa para streaming de vídeo. É durável, sem operação, e cresce sem disco.
- **Cons:** exige que as partes não finais de um multipart tenham o mesmo tamanho. A configuração de `partSize` do `@tus/s3-store` precisa ser validada contra essa regra, incluindo upload retomado. As URLs assinadas não usam domínio próprio.

### Option C: AWS S3
- O S3 original, com o mesmo cliente.
- **Pros:** é a referência de compatibilidade (o `@tus/s3-store` é escrito para ele) e aceita domínio próprio via CloudFront.
- **Cons:** o **egress é cobrado por GB**, e streaming de vídeo é justamente egress. Também exige conta AWS só para isso.

**Recommendation:** Option B — tira do servidor o volume de vídeo e o tráfego de streaming, sem custo de egress e sem operar um MinIO que deixou de ser mantido. O ponto a validar no build é a regra de partes uniformes com o `@tus/s3-store`, num teste de upload retomado.

**Decision:** A (MinIO na stack de produção do Docker local). (resolve OQ-5 do /plan-validate)

**Revisions:**

- 2026-10-12 — Decisão A, diferente da Recommendation B (Cloudflare R2), por causa do AMB-2 b: sem servidor externo, não há conta de storage em nuvem. O MinIO roda no compose de produção da raiz, com volume próprio, bucket e credenciais por env. O endpoint público usado nas URLs pré-assinadas e nas thumbnails continua parametrizado por env, como no dev. O código S3-compatível de `upload-processing/TD-01` não muda.
- 2026-10-12 — Endpoint público de assinatura (mesma Option A; resolve IC-1, opção a). Hoje o `StorageService` assina com o mesmo client que usa internamente (`MINIO_ENDPOINT`/`MINIO_PORT` → `http://minio:9000`), e o navegador não resolve esse host. A API passa a ter um endpoint público **só para assinar** URLs, separado do endpoint interno usado para ler e gravar. Esse endpoint aponta para o endereço com que o Caddy serve o storage (TD-07), que repassa o `Host` original, o mesmo que foi assinado. Sem o endpoint público configurado, o comportamento de dev continua igual.

---

## TD-06: Execução das migrations em produção

**Scope:** Backend

**Capability:** Ambiente de produção e deploy

**Context:** Hoje as migrations rodam pela CLI do TypeORM sobre TypeScript (`ts-node`), o que não existe numa imagem de produção enxuta. API e worker sobem juntos e dependem do schema. O momento e o responsável pela migração amarram compose, imagem e scripts.

**Options:**

### Option A: Serviço one-off `migrate` no compose de produção
- Um serviço com a imagem da API roda as migrations **compiladas** (`dist`) e termina. API e worker sobem depois, por `depends_on: condition: service_completed_successfully`.
- **Pros:** a migração roda uma vez por deploy, antes de qualquer processo usar o schema. Uma falha impede a subida, e o passo fica visível no log do deploy.
- **Cons:** exige um data source e um script de migração apontando para o `dist`.

### Option B: `migrationsRun: true` no boot da API
- A própria API aplica as migrations pendentes ao iniciar.
- **Pros:** não há passo extra.
- **Cons:** o worker pode subir antes e falhar. Com mais de uma réplica da API, as migrações disputam a execução. Um erro de migração vira uma API em crash-loop.

### Option C: Passo manual no roteiro de deploy
- `docker compose run --rm api node dist/... migration:run` é executado à mão (ou pelo script de deploy) antes de reiniciar os serviços.
- **Pros:** dá controle total do momento.
- **Cons:** depende de alguém lembrar. Esquecer é subir código novo sobre schema velho.

**Recommendation:** Option A — garante a ordem (schema antes de API e worker) dentro do próprio compose, sem depender de pessoa nem de corrida entre processos.

**Decision:** A (serviço one-off `migrate` no compose de produção, rodando as migrations compiladas antes de API e worker subirem). (resolve OQ-6 do /plan-validate)

---

## TD-07: Proxy reverso, TLS e superfície pública

**Scope:** Repo-wide

**Capability:** Ambiente de produção e deploy

**Context:** Pelo BFF estrito (`next-frontend-config-base/TD-03`), só o Next precisa ser público. API, Postgres, Redis e Mailpit ficam internos. O proxy na frente do Next termina TLS e precisa deixar passar o upload tus de até 10 GB, que é um corpo longo atravessando o route handler. Depende do TD-04. Se o storage for o MinIO (TD-05 A), o proxy também expõe o subdomínio de mídia.

**Options:**

### Option A: Caddy
- Um container Caddy na frente do Next, com certificado Let's Encrypt automático e um `Caddyfile` de poucas linhas.
- **Pros:** o TLS é automático, com renovação sem cron. Não limita o tamanho do corpo por padrão e tem HTTP/2 e HTTP/3. A configuração é mínima.
- **Cons:** tem menos material de referência que o Nginx para ajustes finos.

### Option B: Nginx + certbot
- Nginx como proxy, com certbot emitindo e renovando os certificados.
- **Pros:** é o mais conhecido e documentado.
- **Cons:** a renovação é mais uma peça a orquestrar. O `client_max_body_size` e os timeouts precisam ser ajustados para o tus, e o padrão de 1 MB quebra o upload sem erro claro.

### Option C: Traefik
- Proxy configurado por labels nos serviços do compose, com TLS automático.
- **Pros:** o TLS é automático e a configuração fica junto de cada serviço.
- **Cons:** o modelo de labels e de entrypoints é mais complexo do que um único serviço público pede.

**Recommendation:** Option A — com um só serviço público, o Caddy entrega TLS automático e não barra o corpo do upload, com a menor configuração entre as três.

**Decision:** A (Caddy como único serviço publicado da stack de produção local). (resolve OQ-7 e DG-1 do /plan-validate)

**Revisions:**

- 2026-10-12 — Superfície pública fixada no resolve (mesma Option A; resolve DG-1, opção a):
  - todo o tráfego vai para o BFF, exceto `GET /auth/confirm-email`, roteado para a API;
  - o `APP_URL` da API aponta para a origem servida pelo Caddy, para o link de confirmação do e-mail chegar à API;
  - a borda sobrescreve `X-Forwarded-For`, e o app nunca confia no valor vindo do cliente (`rate-limit-visitor-identity/TD-01`);
  - sem domínio público (AMB-2 b), o TLS usa a CA interna do Caddy.

  A recuperação de senha fica como **lacuna conhecida e documentada**: o link de reset (`/auth/reset-password`, que só aceita `POST`) continua sem destino, e a tela de nova senha segue adiada (`phase-02-auth-frontend`).
- 2026-10-12 — Superfície pública revista no resolve (mesma Option A; resolve IC-1, IC-2 e ICC-1), substituindo os dois primeiros itens da Revision anterior:
  - **nenhuma rota da API é exposta.** O link de confirmação aponta para uma rota `GET` do **BFF** no mesmo path `/auth/confirm-email` (assim o `mail.service.ts` e o `APP_URL` na origem do Caddy não mudam). Ela repassa a confirmação à API com `X-Client-IP` e `X-Internal-Token`, como as demais rotas do BFF (`rate-limit-visitor-identity/TD-02`), e redireciona para `/login` em vez de devolver o 204 em branco. O rate limit de 10/60 s volta a contar por visitante, e não mais pelo IP do container do Caddy (ICC-1);
  - **o Caddy também serve o storage** num endereço próprio (host ou porta separados), fazendo proxy para o MinIO e preservando o `Host`. Não é um path da mesma origem: com URLs path-style, o bucket `videos` colidiria com a rota `/videos/{publicId}` do front. É esse endereço que a API usa para assinar (TD-05, IC-1);
  - **o Mailpit publica a própria porta** de UI e API no host, fora do Caddy, como no dev (TD-08, IC-2). O Caddy deixa de ser o único serviço publicado: são ele e o Mailpit.

---

## TD-08: Envio de e-mail transacional em produção

**Scope:** Backend

**Capability:** Ambiente de produção e deploy

**Context:** Confirmação de conta e recuperação de senha dependem de e-mail. O transporte atual é `{host, port}`, sem autenticação nem TLS, e só funciona com o Mailpit. Em produção, a entrega exige um remetente autenticado (SPF e DKIM no domínio) e credenciais, chaves novas no schema Joi e no `mail.config`.

**Options:**

### Option A: Relay SMTP de provedor transacional
- Resend, Postmark ou Brevo, usados por SMTP com usuário, senha e TLS. O `@nestjs-modules/mailer` e os templates Handlebars ficam como estão.
- **Pros:** a mudança é só de configuração (host, porta, `secure`, `auth`). A entregabilidade é cuidada pelo provedor, que tem plano gratuito para o volume do projeto.
- **Cons:** é uma conta externa, e o domínio precisa de registros DNS de verificação.

### Option B: Amazon SES
- O SES por SMTP ou API.
- **Pros:** é o mais barato por mensagem em volume.
- **Cons:** começa em sandbox, e a liberação exige pedido à AWS. Exige conta AWS só para e-mail, se o TD-04 não for AWS.

### Option C: Servidor SMTP próprio na VPS
- Postfix no mesmo servidor.
- **Pros:** não depende de terceiros.
- **Cons:** IPs de VPS costumam estar em listas de bloqueio, e reputação, SPF, DKIM e DMARC ficam por conta do projeto. E-mail de confirmação caindo em spam bloqueia o cadastro.

**Recommendation:** Option A — o código e os templates ficam como estão, a mudança cabe na configuração e a entregabilidade fica com quem a faz bem.

**Decision:** C (Mailpit como servidor SMTP da stack de produção local; transporte inteiro por env). (resolve OQ-8 do /plan-validate)

**Revisions:**

- 2026-10-12 — O usuário escolheu o **Mailpit** na stack de produção, uma opção fora das três do research. Ela foi registrada como C (servidor SMTP próprio no host, sem terceiros) por ser a mais próxima, com uma diferença: o Mailpit **captura e não entrega**, e os e-mails são lidos na UI dele. Sem servidor externo (AMB-2 b), nenhum e-mail sai de verdade. O transporte de `phase-02-auth/TD-05` (host, porta, `secure`, `auth`) fica todo em env, então trocar por um relay real seria só configuração. A Recommendation A (relay de provedor) não se aplica.
- 2026-10-12 — Acesso ao Mailpit fixado no resolve (mesma Option C; resolve IC-2, opção a): a UI e a API HTTP do Mailpit ficam publicadas no host, fora do Caddy, como no dev. O SMTP fica só na rede interna do compose. É por essa API que a suíte do TD-01, rodando no host, lê o link de confirmação; o projeto Compose da suíte usa uma porta própria (TD-02).

---

## TD-09: Build das imagens, entrega e segredos

**Scope:** Repo-wide

**Capability:** Ambiente de produção e deploy

**Context:** Não há imagem de produção. O deploy precisa de três coisas:
- um build reproduzível (multi-stage, com Node fixo e igual nos dois lados);
- um caminho do commit até o servidor;
- um lugar para os segredos.

Os segredos são `JWT_SECRET`, `JWT_REFRESH_SECRET`, `INTERNAL_API_SECRET` (igual nos dois containers), `SESSION_PASSWORD`, `DB_PASSWORD`, as credenciais do storage e as do SMTP. Depende dos TD-03 e TD-04.

**Options:**

### Option A: CI builda e publica imagens no GHCR; deploy por SSH
- No merge para `main`, depois dos testes do TD-03, o GitHub Actions builda as imagens de produção (Next em `output: "standalone"` e Nest com `dist`) e publica no GitHub Container Registry. Em seguida faz SSH no servidor e roda `docker compose pull && docker compose up -d`.
- Os segredos ficam num `.env` de produção no servidor, fora do git e com acesso restrito, lido pelo compose.
- **Pros:** cada versão é uma imagem imutável e versionada, e voltar é subir a tag anterior. O servidor não compila nada, e o deploy só acontece com a CI verde.
- **Cons:** é preciso configurar o registry, a chave SSH e os secrets do Actions. O `.env` do servidor é mantido à mão.

### Option B: Build no servidor
- O servidor faz `git pull` e `docker compose build` com os Dockerfiles de produção, disparado à mão ou por script.
- **Pros:** é a configuração mais simples, sem registry.
- **Cons:** o servidor compila (CPU e disco disputados com o worker), e cada deploy pode gerar uma imagem diferente. Voltar exige recompilar.

### Option C: Ferramenta de deploy (Kamal 2 ou Coolify)
- O Kamal builda e publica as imagens e faz deploy sem downtime com proxy próprio. O Coolify é um PaaS auto-hospedado na VPS.
- **Pros:** deploy sem downtime, segredos e proxy integrados.
- **Cons:** é mais uma ferramenta e um modelo a aprender. O Kamal traz seu próprio proxy, que se sobrepõe ao TD-07, e o Coolify ocupa recursos da mesma máquina.

**Recommendation:** Option A — usa o CI do TD-03 como portão, dá versões imutáveis com rollback trivial e mantém o servidor só executando, com o mínimo de peças novas.

**Decision:** B (build das imagens de produção no próprio host — o Docker local — pelo compose da raiz; segredos num `.env` de produção fora do git). (resolve OQ-9 do /plan-validate)

**Revisions:**

- 2026-10-12 — Decisão B, diferente da Recommendation A (GHCR + deploy por SSH), por causa do AMB-2 b: o "servidor" é a máquina local, e não há registry nem deploy remoto. Dockerfiles multi-stage de produção para API/worker e para o BFF são construídos com `docker compose build` a partir do compose da raiz. Os segredos ficam num `.env.production` fora do git, com um `.env.production.example` versionado, e o mesmo `INTERNAL_API_SECRET` é lido pelos dois containers (`rate-limit-visitor-identity/TD-02`).

---

## TD-10: Saúde, logs e encerramento dos processos

**Scope:** Backend

**Capability:** Ambiente de produção e deploy

**Context:** Em produção, quatro peças dependem de a API e o worker saberem dizer se estão de pé e saberem parar:
- o healthcheck do compose;
- a ordem de subida;
- a verificação pós-deploy do TD-09;
- o `docker compose up -d` que recria containers.

Hoje não há endpoint de saúde nem log estruturado, e nada trata o SIGTERM. O worker pode ser morto no meio de um processamento do FFmpeg e deixar o vídeo em `processing`. O caminho do endpoint é citado pelo compose e pelo deploy.

**Options:**

### Option A: `@nestjs/terminus` + logs JSON (`nestjs-pino`) + shutdown hooks
- `GET /health` checa banco, Redis e storage via Terminus. Os logs saem em JSON com id de requisição. `enableShutdownHooks` na API e no worker, com o worker fechando o consumer BullMQ antes de sair.
- **Pros:** o health tem significado real, e os logs ficam prontos para qualquer agregador.
- **Cons:** são duas dependências novas. Sem agregador na VPS, o log JSON é lido pelo `docker logs`, menos legível.

### Option B: Health simples + Logger nativo + shutdown hooks
- `GET /health` responde quando o processo está de pé e consegue consultar o banco (um `SELECT 1`). O `Logger` do Nest passa a ser usado nos pontos críticos (falha de processamento, erro não tratado). `enableShutdownHooks` na API e no worker, com o worker fechando o consumer.
- **Pros:** não adiciona dependência e cobre o que o compose e o deploy precisam.
- **Cons:** o health não distingue falha de Redis ou de storage, e o log é texto.

### Option C: Só a política de restart do compose
- Não há endpoint nem tratamento de sinal. O compose reinicia o que cair.
- **Pros:** é zero trabalho.
- **Cons:** não há como saber se o deploy subiu saudável, e o worker interrompido deixa vídeo preso em `processing`.

**Recommendation:** Option B — atende ao healthcheck, à ordem de subida e à verificação de deploy, e protege o processamento no encerramento, sem dependências novas. O Terminus e o pino passam a valer quando houver agregador de logs.

**Decision:** B (endpoint de health simples + Logger nativo + `enableShutdownHooks`). (resolve OQ-10 do /plan-validate)

---

## TD-11: Backup e recuperação dos dados

**Scope:** Repo-wide

**Capability:** Ambiente de produção e deploy

**Context:** Numa VPS (TD-04), o Postgres guarda contas, canais, vídeos, comentários e inscrições num único disco. Os arquivos de vídeo ficam no storage do TD-05: se for R2, são duráveis fora da máquina; se for MinIO local, ficam no mesmo disco. Sem backup, perder o disco é perder a plataforma. Depende dos TD-04 e TD-05.

**Options:**

### Option A: `pg_dump` agendado enviado ao object storage
- Um container agendado faz `pg_dump` diário compactado e envia para um bucket separado de backups, com retenção (por exemplo, 7 diários e 4 semanais). A restauração fica documentada e é testada uma vez.
- **Pros:** o backup fica fora da máquina e é portátil entre provedores. Custo quase nulo no mesmo storage do TD-05.
- **Cons:** a granularidade é diária (perde até um dia de dados) e o agendamento é mais uma peça no compose.

### Option B: Snapshots de disco do provedor da VPS
- O backup automático da máquina inteira pelo provedor.
- **Pros:** é um clique, e cobre também um MinIO local, se houver.
- **Cons:** fica preso ao provedor, e o snapshot de um Postgres em execução pode não ser consistente sem parar o banco. Custa um percentual do preço da VPS.

### Option C: Sem backup automatizado
- Dumps manuais esporádicos.
- **Pros:** não há trabalho.
- **Cons:** qualquer perda de disco é irrecuperável.

**Recommendation:** Option A — leva um backup consistente do banco para fora da máquina, independente do provedor e quase sem custo. Os vídeos já ficam duráveis no storage se o TD-05 for R2.

**Decision:** C (sem backup automatizado). (resolve OQ-11 do /plan-validate)

**Revisions:**

- 2026-10-12 — Decisão C, diferente da Recommendation A (`pg_dump` agendado), porque a stack de produção é só local (AMB-2 b) e a perda dos volumes Docker do Postgres e do MinIO é aceita. Não há serviço de backup nem roteiro de restauração.

---

## Decisions Summary

| ID | Scope | Decision | Recommendation | Choice |
|----|-------|----------|---------------|--------|
| TD-01 | Repo-wide | Camada dos testes ponta a ponta dos fluxos principais | A — suíte de fumaça full-stack, além das atuais | A (5 fluxos, sem reset de senha) |
| TD-02 | Repo-wide | Dados e estado da suíte full-stack | A — ambiente zerado, dados criados pelos cenários | A |
| TD-03 | Repo-wide | Pipeline de CI | B — GitHub Actions dirigindo os compose do projeto | B (portão de PR, sem deploy) |
| TD-04 | Repo-wide | Plataforma de hospedagem | A — VPS única com Docker Compose | A (só Docker local, instância única, compose na raiz) |
| TD-05 | Cross-layer | Armazenamento de objetos em produção | B — Cloudflare R2 | A (MinIO local) |
| TD-06 | Backend | Execução das migrations em produção | A — serviço one-off `migrate` | A |
| TD-07 | Repo-wide | Proxy reverso, TLS e superfície pública | A — Caddy | A (expõe `GET /auth/confirm-email`) |
| TD-08 | Backend | Envio de e-mail transacional | A — relay SMTP de provedor transacional | C (Mailpit) |
| TD-09 | Repo-wide | Build das imagens, entrega e segredos | A — GHCR + deploy por SSH | B (build local, sem registry) |
| TD-10 | Backend | Saúde, logs e encerramento | B — health simples + Logger nativo + shutdown hooks | B |
| TD-11 | Repo-wide | Backup e recuperação dos dados | A — `pg_dump` agendado no object storage | C |
