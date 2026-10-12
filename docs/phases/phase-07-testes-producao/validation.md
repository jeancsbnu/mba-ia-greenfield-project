---
kind: phase
name: phase-07-testes-producao
status: dirty
issue_count: 4
sources_mtime:
  docs/phases/phase-07-testes-producao/context.md: "2026-10-12T19:50:53-03:00"
  docs/decisions/technical-decisions-testes-producao.md: "2026-10-12T19:50:53-03:00"
  docs/project-plan.md: "2026-06-29T19:03:26-03:00"
  docs/decisions/technical-decisions-home-busca.md: "2026-10-11T17:47:13-03:00"
sources_hash:
  docs/phases/phase-07-testes-producao/context.md: "cc5d7077756d"
  docs/decisions/technical-decisions-testes-producao.md: "1f2a4e4f9a78"
  docs/project-plan.md: "18d6466649bb"
  docs/decisions/technical-decisions-home-busca.md: "feda55ba3eed"
issues:
  - id: AMB-1
    status: resolved
    summary: "Lista fechada dos fluxos principais da suíte full-stack"
    resolved_by: testes-producao/TD-01
  - id: AMB-2
    status: resolved
    summary: "Deploy real ou artefatos de produção validados localmente"
    resolved_by: testes-producao/TD-04
  - id: AMB-3
    status: resolved
    summary: "Instância única ou multi-instância (throttler em memória)"
    resolved_by: testes-producao/TD-04
  - id: AMB-4
    status: resolved
    summary: "Topologia de rede entre os dois stacks em prod e na suíte"
    resolved_by: testes-producao/TD-04
  - id: DG-1
    status: resolved
    summary: "Links de e-mail de confirmação e reset sem destino em produção"
    resolved_by: testes-producao/TD-07
  - id: OQ-1
    status: resolved
    summary: "TD-01 pending — camada dos testes ponta a ponta"
    resolved_by: testes-producao/TD-01
  - id: OQ-2
    status: resolved
    summary: "TD-02 pending — dados e estado da suíte full-stack"
    resolved_by: testes-producao/TD-02
  - id: OQ-3
    status: resolved
    summary: "TD-03 pending — pipeline de CI"
    resolved_by: testes-producao/TD-03
  - id: OQ-4
    status: resolved
    summary: "TD-04 pending — plataforma de hospedagem"
    resolved_by: testes-producao/TD-04
  - id: OQ-5
    status: resolved
    summary: "TD-05 pending — armazenamento de objetos em produção"
    resolved_by: testes-producao/TD-05
  - id: OQ-6
    status: resolved
    summary: "TD-06 pending — execução das migrations em produção"
    resolved_by: testes-producao/TD-06
  - id: OQ-7
    status: resolved
    summary: "TD-07 pending — proxy reverso, TLS e superfície pública"
    resolved_by: testes-producao/TD-07
  - id: OQ-8
    status: resolved
    summary: "TD-08 pending — e-mail transacional em produção"
    resolved_by: testes-producao/TD-08
  - id: OQ-9
    status: resolved
    summary: "TD-09 pending — build das imagens, entrega e segredos"
    resolved_by: testes-producao/TD-09
  - id: OQ-10
    status: resolved
    summary: "TD-10 pending — saúde, logs e encerramento"
    resolved_by: testes-producao/TD-10
  - id: OQ-11
    status: resolved
    summary: "TD-11 pending — backup e recuperação dos dados"
    resolved_by: testes-producao/TD-11
  - id: IC-1
    status: open
    summary: "Storage inalcançável pelo navegador: Caddy único publicado e URL assinada com minio:9000"
  - id: IC-2
    status: open
    summary: "Mailpit da stack de produção sem caminho de acesso (UI e API da suíte)"
  - id: IC-3
    status: open
    summary: "Suíte com ambiente zerado sobe sobre o compose de produção e apaga seus dados"
  - id: ICC-1
    status: open
    summary: "confirm-email direto do Caddy cai no balde ip:<caddy> de 10/60 s para todos"
advisories: []
---

# phase-07-testes-producao — Validation

## Findings

### Inconsistencies

- **IC-1** — A superfície pública do TD-07 deixa o storage inalcançável para o navegador, e o TD-05 supõe um endpoint público que o código não tem. Os pontos em conflito:
  - a Revision do TD-07 diz "Caddy como único serviço publicado" e "todo o tráfego vai para o BFF, exceto `GET /auth/confirm-email`";
  - pelo `upload-processing/TD-08`, o navegador busca vídeo e thumbnail **direto no storage** por URL pré-assinada;
  - a Revision do TD-05 diz que "o endpoint público usado nas URLs pré-assinadas e nas thumbnails continua parametrizado por env, como no dev".

  O código não confirma essa premissa. `nestjs-project/src/config/storage.config.ts` tem um só `MINIO_ENDPOINT`/`MINIO_PORT`, e `src/storage/storage.service.ts` assina com o mesmo client que a API usa internamente (`endpoint: http://${minioEndpoint}:${minioPort}`, `forcePathStyle`). Em produção isso gera URLs `http://minio:9000/…`, que o navegador não resolve, e nenhum serviço além do Caddy publica porta. Explicit choice:
  - (a) o Caddy também serve o storage (um site ou path próprio na mesma origem), e a API ganha um endpoint público **só para assinar**, separado do endpoint interno. É uma mudança pequena no `StorageService`, registrada como Revision no TD-05 e no TD-07;
  - (b) o MinIO publica a própria porta no host, ao lado do Caddy, e a API assina com esse endereço público (`localhost:9000`). Também exige o endpoint de assinatura separado, porque o container da API não alcança `localhost` do host. O "único serviço publicado" do TD-07 deixa de valer;
  - (c) a mídia passa a ser servida pelo BFF, o que contraria `upload-processing/TD-08` e exige `/research` para um TD novo.
- **IC-2** — O Mailpit da stack de produção não tem caminho de acesso. A Revision do TD-08 diz que os e-mails "são lidos na UI dele", e o TD-02 diz que a suíte confirma o cadastro "pelo link lido na API do Mailpit". Mas o TD-07 publica só o Caddy, e a superfície dele não inclui o Mailpit. Explicit choice:
  - (a) o Mailpit publica a própria porta (UI e API) no host, fora do Caddy, como no dev;
  - (b) o Caddy roteia a UI e a API do Mailpit num site ou path próprio;
  - (c) a suíte roda num container dentro da rede do compose e lê o Mailpit pelo nome do serviço, e a UI fica acessível só por `docker compose port`/exec, sem publicação.
- **IC-3** — Rodar a suíte zera a stack de produção. O TD-02 decide "ambiente zerado por execução", e a Revision do TD-04 diz que "a suíte full-stack do TD-01 sobe sobre esse mesmo compose". Executar a suíte apaga os dados da stack de produção local: banco, vídeos no MinIO e e-mails. O TD-11 C aceita a perda acidental dos volumes, mas não uma limpeza a cada execução da suíte. Explicit choice:
  - (a) a suíte usa o mesmo arquivo de compose num **projeto Compose separado** (`-p`, com volumes e portas próprios), e a stack de produção fica intacta. É uma Revision no TD-02;
  - (b) aceitar que a suíte recria a stack de produção do zero, já que ela é só local e não guarda dados que importam. É uma Revision no TD-11;
  - (c) a suíte sobe a mesma topologia num compose de teste à parte, derivado do de produção. É uma Revision no TD-04.

### Ambiguities

_None._

### Missing Decisions

_None._

### Dependency Gaps

_None._

### Inherited Constraint Conflicts

- **ICC-1** — A rota `GET /auth/confirm-email`, que vai direto do Caddy para a API (Revision do TD-07, DG-1 a), faz todos os visitantes dividirem um único balde de rate limit:
  - `rate-limit-visitor-identity/TD-02` diz que o IP real do visitante só chega ao Nest pelo BFF, no `X-Client-IP` com `INTERNAL_API_SECRET`;
  - sem esse par, `VisitorThrottlerGuard.resolveIp` usa `req.ip`, e `main.ts` não liga `trust proxy`. Toda requisição vinda do Caddy é contada como `ip:<IP do container do Caddy>`;
  - `confirm-email` está sob `@Throttle(AUTH_THROTTLE)`, de **10/60 s** (`rate-limit-visitor-identity/TD-04`, Revision de 2026-10-08).

  Resultado: a plataforma inteira confirma no máximo 10 contas por minuto, e o `X-Forwarded-For` que o Caddy sobrescreve é ignorado. Explicit choice:
  - (a) o link do e-mail aponta para uma rota do **BFF** que repassa a confirmação à API com `X-Client-IP` e o token, e o Caddy deixa de expor qualquer rota da API. A rota pode redirecionar para `/login` em vez de devolver o 204 em branco. É uma Revision no TD-07;
  - (b) o Caddy injeta `X-Client-IP` e `X-Internal-Token` nessa rota, o que põe o segredo também na configuração do proxy. É uma Revision no TD-07 e no TD-09;
  - (c) aceitar o balde compartilhado, já que a stack é só local, com volume de cadastro irrelevante. É uma Revision no TD-07 registrando o limite.

### Unresolved Open Questions

_None._

### UI Coverage Gaps

_None._ _(fatia sem `## UI Inventory` — UI fora do escopo)_

### Capability Consistency (slicing, phase mode only)

_None._ _(as `covers_capabilities` de `home-busca` e `testes-producao` casam verbatim com as bullets da Fase 07 em `project-plan.md`)_

## Cross-slice Advisories

_None._ _(a união das duas fatias cobre as 8 bullets da Fase 07: 6 em `home-busca`, 2 em `testes-producao`)_

## Resolved Issues

- **AMB-1** _(resolved_by testes-producao/TD-01)_ — Lista fechada dos fluxos principais da suíte full-stack. Cinco fluxos, um por fase: cadastro → confirmação pelo link do Mailpit → login/logout; upload → worker → publicação; assistir com view contada; like, comentário e inscrição; home, busca e categoria. A recuperação de senha fica fora (Revision do TD-01).
- **AMB-2** _(resolved_by testes-producao/TD-04)_ — Deploy real ou artefatos de produção validados localmente. Opção (b): artefatos de produção completos, validados subindo a stack de produção no Docker local. Não há servidor externo nem roteiro de deploy (Revision do TD-04).
- **AMB-3** _(resolved_by testes-producao/TD-04)_ — Instância única ou multi-instância (throttler em memória). Opção (a): instância única de API, worker e BFF, e o throttler em memória continua (Revision do TD-04).
- **AMB-4** _(resolved_by testes-producao/TD-04)_ — Topologia de rede entre os dois stacks em prod e na suíte. Opção (a): compose de produção na raiz numa rede única, com o BFF chegando à API pelo nome do serviço. Os compose de dev ficam como estão e a suíte full-stack usa esse compose (Revision do TD-04).
- **DG-1** _(resolved_by testes-producao/TD-07)_ — Links de e-mail de confirmação e reset sem destino em produção. Opção (a): o Caddy roteia `GET /auth/confirm-email` para a API, com `APP_URL` na origem do Caddy. A recuperação de senha fica como lacuna conhecida e documentada (Revision do TD-07).
- **OQ-1** _(resolved_by testes-producao/TD-01)_ — TD-01 pending — camada dos testes ponta a ponta. TD-01 decidido: A (suíte de fumaça full-stack além das atuais).
- **OQ-2** _(resolved_by testes-producao/TD-02)_ — TD-02 pending — dados e estado da suíte full-stack. TD-02 decidido: A (ambiente zerado, dados criados pelos cenários).
- **OQ-3** _(resolved_by testes-producao/TD-03)_ — TD-03 pending — pipeline de CI. TD-03 decidido: B (GitHub Actions dirigindo os compose do projeto; portão de PR, sem deploy — Revision).
- **OQ-4** _(resolved_by testes-producao/TD-04)_ — TD-04 pending — plataforma de hospedagem. TD-04 decidido: A (Docker Compose de produção, só no Docker local — Revision).
- **OQ-5** _(resolved_by testes-producao/TD-05)_ — TD-05 pending — armazenamento de objetos em produção. TD-05 decidido: A (MinIO na stack de produção local — Revision).
- **OQ-6** _(resolved_by testes-producao/TD-06)_ — TD-06 pending — execução das migrations em produção. TD-06 decidido: A (serviço one-off `migrate`).
- **OQ-7** _(resolved_by testes-producao/TD-07)_ — TD-07 pending — proxy reverso, TLS e superfície pública. TD-07 decidido: A (Caddy — Revision com a superfície pública).
- **OQ-8** _(resolved_by testes-producao/TD-08)_ — TD-08 pending — e-mail transacional em produção. TD-08 decidido: C (Mailpit na stack de produção, captura sem entrega — Revision).
- **OQ-9** _(resolved_by testes-producao/TD-09)_ — TD-09 pending — build das imagens, entrega e segredos. TD-09 decidido: B (build local pelo compose da raiz, `.env.production` fora do git — Revision).
- **OQ-10** _(resolved_by testes-producao/TD-10)_ — TD-10 pending — saúde, logs e encerramento. TD-10 decidido: B (health simples + Logger nativo + shutdown hooks).
- **OQ-11** _(resolved_by testes-producao/TD-11)_ — TD-11 pending — backup e recuperação dos dados. TD-11 decidido: C (sem backup automatizado — Revision).
