# phase-07-testes-producao — Progress

**Status:** completed
**SIs:** 14/14 completed

### SI-07.16 — Endpoint GET /health
- **Status:** completed
- **Tests:** 3 passing (test/health.e2e-spec.ts)
- **Observations:**
  - `HealthController` usa `@ApiExcludeController()` em vez dos decorators de Swagger que `.claude/rules/nestjs-controllers.md` exige em todo controller: a exclusão é decisão do plano (o health é infraestrutura, não contrato do front, e assim o `openapi.json` não muda). A regra pode ganhar uma exceção explícita para controllers de infraestrutura — fora do escopo deste SI.
  - Diferente do `AppController` (`@SkipThrottle()`), o health fica no default global de rate limit, como o plano fixa.

### SI-07.17 — Ligar o encerramento gracioso da API e do worker
- **Status:** completed
- **Tests:** no tests (tsc --noEmit ok)
- **Observations:**
  - Conferido no `@nestjs/bullmq` 11.0.4 instalado: o `BullExplorer.onApplicationShutdown` chama `worker.close()`, que espera o job ativo. Os critérios de parada (API e worker) são observados na stack de produção, em SI-07.26.

### SI-07.18 — Tornar idempotente a confirmação de e-mail
- **Status:** completed
- **Tests:** 75 passing (auth.service.spec.ts 29/29, auth.e2e-spec.ts 46/46)
- **Observations:**
  - O e2e existente `returns 401 with INVALID_TOKEN on an already-used token` foi reescrito para o novo contrato (segunda visita responde 204 e a conta segue confirmada), e ganhou um caso de token inexistente para manter a cobertura de `INVALID_TOKEN`. O reuso do token de reset já tinha e2e (`returns 401 with INVALID_TOKEN on a reused token`), que cobre o AC #5 sem mudança.
  - A cadeia OpenAPI foi regenerada (openapi:export → sync → openapi:types): muda só a descrição do 204 nos três arquivos; o `/health` do SI-07.16 não entrou. O `nest build` do export apagou o `dist/` do worker, que foi reiniciado.

### SI-07.19 — Assinar URLs de mídia com um endpoint público separado
- **Status:** completed
- **Tests:** 11 passing (storage.service.spec.ts 2, env.validation.integration-spec.ts 9); tsc --noEmit ok
- **Observations:**
  - O exemplo de `MINIO_PUBLIC_URL` no `.env.example` usa a porta `9100`, o default do storage no compose de produção (SI-07.25).
  - A validação Joi recusa `MINIO_PUBLIC_URL=` vazio (string vazia não é URI): no dev a chave fica comentada, não em branco.

### SI-07.20 — Infra: rodar as migrations a partir do build compilado
- **Status:** completed
- **Tests:** no tests (verificação direta dos ACs no container)
- **Observations:**
  - Desvio do plano: o glob `*.{ts,js}` sugerido carregaria os `.d.ts` que o build emite (`declaration: true` no tsconfig) como migrations. O `data-source.ts` usa só a extensão do próprio arquivo (`.ts` no ts-node, `.js` no dist).
  - Verificado no container: `migration:run:prod` e `migration:run` respondem "No migrations are pending"; um diretório só com `dist/`, `package.json` e `node_modules` (sem `src/`) também; os DataSources de dist e de src carregam 6 migrations e 9 entidades cada (6 arquivos em `src/database/migrations`).
  - O `npm run build` apagou o `dist/` do worker, que foi reiniciado.

### SI-07.21 — Infra: imagem de produção do nestjs-project
- **Status:** completed
- **Tests:** no tests (verificação direta dos ACs com a imagem)
- **Observations:**
  - Verificado com a imagem `streamtube-api:check` na rede `streamtube_default` e o `.env` de dev: `docker build` ok a partir do checkout; a imagem roda como `node`, sem `src/`, `test/` nem `.env`, sem dependências de dev, e com os `.hbs` em `dist/mail/templates`; `npm run migration:run:prod` → "No migrations are pending"; `node dist/main` → `GET /health` 200 e `docker stop` com exit 0; `node dist/worker.main` sobe e para com exit 0.
  - O teste do worker conectou por ~15 s na fila de dev (`REDIS_DB` do `.env`), que estava vazia; nada foi processado.
  - O `npm ci --omit=dev` no estágio final roda de novo o postinstall do ffmpeg-static/ffprobe-static, que baixa os binários: o build precisa de rede.

### SI-07.22 — Rota-ponte GET /auth/confirm-email no BFF
- **Status:** completed
- **Tests:** 4 passing (route.integration.test.ts); tsc e eslint ok
- **Observations:**
  - Gatilho reservado novo no mock de auth: `token=invalid-confirmation-token` → 401 `INVALID_TOKEN`; o default é 204, refletindo a confirmação idempotente do Nest (SI-07.18).
  - O warm-up do Playwright (`tests/global-setup.ts`) varre os `route.ts` e vai chamar `/auth/confirm-email` sem token, que responde 303 para `/login` sem tocar o upstream. Como `mocks/` mudou, o dev server com MSW precisa ser reiniciado antes da suíte E2E da verificação final.
  - Corrigido durante o SI-07.23: o redirect era `NextResponse.redirect(new URL("/login", request.url))`, mas no servidor `standalone` o `request.url` usa o HOSTNAME do processo e a imagem respondia `Location: http://0.0.0.0:3000/login`. A rota agora responde `303` com `Location: /login` relativo; o teste passou a esperar `/login` e segue 4/4. Nenhuma outra rota do app usa redirect absoluto.

### SI-07.23 — Infra: imagem de produção do BFF (next-frontend)
- **Status:** completed
- **Tests:** no tests (verificação direta dos ACs com a imagem); tsc e eslint ok
- **Observations:**
  - Verificado com a imagem `streamtube-bff:check`: `docker build` sem nenhum `.env` termina; o container roda como `node`; com `API_URL`/`SESSION_PASSWORD`/`INTERNAL_API_SECRET` a home responde 200 e as chamadas ao upstream saem para `API_URL` (sem MSW: o log mostra `ECONNREFUSED` para `nestjs-api:3000`, cujo container de dev não roda o servidor); sem `API_URL`, a home responde 500 e o log mostra "Invalid environment variables" com `API_URL`.
  - Achado na verificação: o redirect absoluto da ponte (SI-07.22) saía como `http://0.0.0.0:3000/login` no `standalone`; corrigido para `Location: /login` relativo e reverificado na imagem reconstruída (`303 /login`).
  - Não rodei `npm run build` dentro do container de dev para não sobrescrever o `.next` do `next dev`; a parte do AC sobre o build fora do Docker fica coberta pelo estágio de build da própria imagem (mesmo `npm run build`), e a validação sem `SKIP_ENV_VALIDATION` pela execução sem `API_URL`.
  - `fullstack` entrou no `.dockerignore` antecipando a pasta da suíte (SI-07.27).

### SI-07.24 — Infra: configuração do Caddy da stack de produção
- **Status:** completed
- **Tests:** no tests (caddy validate ok)
- **Observations:**
  - `caddy validate` com `caddy:2.10-alpine` → "Valid configuration". A mesma tag deve ser a do compose (SI-07.25).
  - Os ACs de `X-Forwarded-For` sobrescrito, URL assinada abrindo pelo site do storage e nenhum path alcançando o Nest dependem de `bff`, `minio` e `api` na rede do compose; são verificados com a stack de pé em SI-07.26.
  - Nota de ambiente: no Git Bash, `docker run -v ...:/etc/caddy/...` precisa de `MSYS_NO_PATHCONV=1`, senão o caminho do container vira caminho Windows.

### SI-07.25 — Infra: compose de produção na raiz e env de produção
- **Status:** completed
- **Tests:** no tests (compose config ok)
- **Observations:**
  - `APP_URL` e `MINIO_PUBLIC_URL` são montados no próprio compose a partir de `APP_PORT`/`STORAGE_PORT`, em vez de duplicados no `.env.production.example` como o plano sugeria: assim não ficam dessincronizados das portas publicadas (e a suíte, que troca as portas, herda o valor certo).
  - Segredos com `${VAR:?}`: a stack não sobe sem eles. `migrate`, `api` e `worker` compartilham a imagem `streamtube-api:local` (anchor `x-nest-image`); o `bff` usa `streamtube-bff:local`; Caddy `caddy:2.10-alpine`, a mesma tag validada em SI-07.24.
  - Verificado: `docker compose -f compose.prod.yaml --env-file .env.production.example config` ok; só `caddy` (8080, 9100) e `mailpit` (8125) publicam portas, sem colisão com as do dev (3000, 3001, 5432, 6379, 9000, 9001, 1025, 8025); `git check-ignore .env.production` confirma. A ordem `migrate` → `api`/`worker` é observada na subida em SI-07.26.

### SI-07.26 — Subir, validar e documentar a stack de produção local
- **Status:** completed
- **Tests:** no tests (verificação manual dos ACs pela borda)
- **Observations:**
  - Três correções no `compose.prod.yaml` saíram da primeira subida: (1) três builds paralelos da mesma tag `streamtube-api:local` colidiam ("already exists") — só a `api` declara o build, `migrate`/`worker` usam a imagem com `pull_policy: never`; (2) o `migrate` levou `ECONNREFUSED` no primeiro boot de um volume novo, porque o `pg_isready` sem `-h` dá "pronto" contra o servidor temporário do initdb (só socket) — o healthcheck do `db` agora testa por TCP (`-h 127.0.0.1`); (3) as portas padrão mudaram de 8080/9100 para **8088/9200**: a 8080 está ocupada por um processo Java desta máquina e a 9100 pelo MinIO do `compose.override.yaml` local de dev (não versionado). O `.env.example` do Nest, o `.env.production.example` e o README usam os valores novos.
  - Verificado com a stack de pé (`localhost:8088`): `migrate` Exited (0), `api` healthy; home 200; `/health`, `/api/docs` e `/auth/login` dão 404 do BFF (o Nest não é alcançável pela borda); cadastro 201 → login 403 `EMAIL_NOT_CONFIRMED` → e-mail na API do Mailpit (`localhost:8125`) com link `http://localhost:8088/auth/confirm-email?token=…` → 303 `/login` (de novo na segunda visita) → login 200.
  - `X-Forwarded-For` forjado é ignorado: 11 `POST /api/auth/forgot-password` com IPs forjados distintos → 10×204 e o 11º 429 (todos no balde do IP real).
  - Upload tus pelo BFF → worker processa até `ready` → `PATCH` publica (200) → `/videos/{publicId}` 200 → `streamUrl` e thumbnail assinadas com host `localhost:9200`: mídia 206, thumbnail 200 `image/jpeg`, sem `SignatureDoesNotMatch`. Fluxo reproduzido por script Node com o `tus-js-client` do front, não pelo navegador.
  - `stop` do worker logo após um upload: 6 s, exit 0, vídeo `ready`. Com o vídeo de 8 s a janela de processamento é curta, então não dá para afirmar que o `stop` caiu no meio do job; o encerramento não deixou nada em `processing`.
  - A mídia é servida com `content-type: binary/octet-stream` (o objeto é gravado sem `ContentType`); os navegadores tocam MP4 assim mesmo, mas gravar o tipo correto no upload/processamento é uma melhoria fora do escopo desta fatia.
  - O fixture `next-frontend/fullstack/fixtures/sample.mp4` (8 s, 93 KB, H.264 + AAC) foi gerado com o `ffmpeg-static` do container do Nest para esta verificação; é o mesmo arquivo que o SI-07.27 versiona.
  - A stack de produção ficou de pé para o AC do SI-07.27 (a suíte não pode tocar os dados dela).

### SI-07.27 — Infra: harness da suíte full-stack
- **Status:** completed
- **Tests:** no tests (harness verificado com --pass-with-no-tests)
- **Observations:**
  - Além dos arquivos do plano, o harness ganhou `fullstack/stack.ts` (projeto Compose, caminhos e portas lidos do `fullstack.env`), compartilhado pelo setup, pelo teardown, pelos helpers e pela config. O setup roda `down -v` antes do `up`, para começar vazio mesmo depois de uma execução interrompida.
  - Portas da suíte: app 8180, storage 9280, Mailpit 8181 (livres nesta máquina e distintas das da produção local e do dev).
  - O build da imagem do BFF falhou na primeira tentativa: o `next build` checa tipos de `**/*.ts` e a `playwright.fullstack.config.ts` importa `./fullstack/stack`, que o `.dockerignore` exclui. A config da suíte entrou no `.dockerignore` também.
  - Os relatórios da suíte vão para `playwright-report-fullstack/` e `test-results-fullstack/`, ignorados pelo `.gitignore` do next-frontend (os da suíte MSW, `playwright-report/` e `test-results/`, continuam versionados como antes).
  - Verificado: `npx playwright test -c playwright.fullstack.config.ts --pass-with-no-tests` sobe o projeto `streamtube-fullstack` (o `up --wait` aceita o `migrate` em `Exited (0)`), espera todos os serviços saudáveis e o teardown remove containers e volumes (0 e 0 depois); a stack de produção local seguiu com 1 conta e 2 vídeos antes e depois; `npx playwright test --list` (suíte MSW) não coleta nada de `fullstack/`; `tsc --noEmit` e `eslint` ok; `git status` lista `fullstack/fullstack.env` como rastreável.

### SI-07.28 — Jornadas da suíte full-stack: os cinco fluxos principais
- **Status:** completed
- **Tests:** 5 passing (suíte full-stack, 3,2 min); tsc e eslint ok
- **Observations:**
  - A config da suíte usa `channel: "chrome"` (Google Chrome do host, 155): o Chromium do Playwright não decodifica H.264/AAC e a view nunca seria contada. A CI precisa de `npx playwright install chrome` (SI-07.29).
  - Os dados das jornadas 3 a 5 são criados pelo protocolo tus direto contra `/api/videos/upload` do BFF (POST de criação + PATCH do conteúdo), não pelo `tus-js-client`; a jornada 2 usa a tela de upload de verdade.
  - Primeira execução: 3/5. Duas falhas, ambas do teste: (1) depois do logout a página fica em `/login`, que usa o layout de auth sem navbar — o estado deslogado passou a ser conferido na home; (2) comentário e inscrição são otimistas e o `reload` abortava os POSTs em voo ("0 comentários", "0 inscritos" após recarregar) — cada ação agora espera a resposta do BFF e exige `ok`. Segunda execução das duas: 2/2. Execução completa: 5/5 em 3,2 min.
  - O AC "rodar duas vezes seguidas dá o mesmo resultado" fica com a segunda execução completa na verificação final.
  - Documentado em `next-frontend/CLAUDE.md` → "Suíte full-stack (`fullstack/`)".

### SI-07.29 — Infra: pipeline de CI como portão do PR
- **Status:** completed
- **Tests:** no tests (YAML validado localmente; ACs observáveis só no PR)
- **Observations:**
  - Workflow novo `.github/workflows/ci.yml` com os jobs `backend`, `frontend`, `frontend-e2e` e `fullstack`, disparado em `pull_request` e `push` na `main`; o `openapi-freshness.yml` (job `freshness`) não mudou.
  - Ajustes para o runner Linux: `chmod -R a+rwX` no subprojeto (containers rodam como `node`, uid 1000, e o checkout é do usuário do runner); um `compose.ci.yaml` gerado no job mantém o `nestjs-api` com `tail -f /dev/null`, como o override local, porque o `compose.yaml` sobe `start:dev`, que falha antes do `npm ci`; o `.env.local` do front é escrito no job (o `.gitignore` do subprojeto ignora `.env*`); o job `fullstack` instala o Google Chrome (`npx playwright install --with-deps chrome`) e derruba o projeto da suíte com `if: always()`.
  - **Pendente:** os ACs deste SI (checks visíveis e verdes, falha reprovando) só se observam no PR que introduz o workflow. Verificado localmente apenas que o YAML é válido (4 jobs, 2 gatilhos) e que os heredocs saem bem formados depois da remoção de indentação do YAML.
