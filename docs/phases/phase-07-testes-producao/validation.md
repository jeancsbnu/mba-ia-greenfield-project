---
kind: phase
name: phase-07-testes-producao
status: dirty
issue_count: 16
sources_mtime:
  docs/phases/phase-07-testes-producao/context.md: "2026-10-12T19:19:06-03:00"
  docs/decisions/technical-decisions-testes-producao.md: "2026-10-12T19:19:06-03:00"
  docs/project-plan.md: "2026-06-29T19:03:26-03:00"
  docs/decisions/technical-decisions-home-busca.md: "2026-10-11T17:47:13-03:00"
sources_hash:
  docs/phases/phase-07-testes-producao/context.md: "006b432a8959"
  docs/decisions/technical-decisions-testes-producao.md: "349b5b293339"
  docs/project-plan.md: "18d6466649bb"
  docs/decisions/technical-decisions-home-busca.md: "feda55ba3eed"
issues:
  - id: AMB-1
    status: open
    summary: "Lista fechada dos fluxos principais da suíte full-stack"
  - id: AMB-2
    status: open
    summary: "Deploy real ou artefatos de produção validados localmente"
  - id: AMB-3
    status: open
    summary: "Instância única ou multi-instância (throttler em memória)"
  - id: AMB-4
    status: open
    summary: "Topologia de rede entre os dois stacks em prod e na suíte"
  - id: DG-1
    status: open
    summary: "Links de e-mail de confirmação e reset sem destino em produção"
  - id: OQ-1
    status: open
    summary: "TD-01 pending — camada dos testes ponta a ponta"
  - id: OQ-2
    status: open
    summary: "TD-02 pending — dados e estado da suíte full-stack"
  - id: OQ-3
    status: open
    summary: "TD-03 pending — pipeline de CI"
  - id: OQ-4
    status: open
    summary: "TD-04 pending — plataforma de hospedagem"
  - id: OQ-5
    status: open
    summary: "TD-05 pending — armazenamento de objetos em produção"
  - id: OQ-6
    status: open
    summary: "TD-06 pending — execução das migrations em produção"
  - id: OQ-7
    status: open
    summary: "TD-07 pending — proxy reverso, TLS e superfície pública"
  - id: OQ-8
    status: open
    summary: "TD-08 pending — e-mail transacional em produção"
  - id: OQ-9
    status: open
    summary: "TD-09 pending — build das imagens, entrega e segredos"
  - id: OQ-10
    status: open
    summary: "TD-10 pending — saúde, logs e encerramento"
  - id: OQ-11
    status: open
    summary: "TD-11 pending — backup e recuperação dos dados"
advisories: []
---

# phase-07-testes-producao — Validation

## Findings

### Inconsistencies

_None._

### Ambiguities

- **AMB-1** — "Testes dos fluxos principais da plataforma" não diz **quais** fluxos são os principais. A suíte full-stack (TD-01/TD-02) precisa de uma lista fechada para virar SIs e cenários. Os candidatos, um por fase entregue, são:
  - cadastro → confirmação por e-mail → login/logout;
  - upload tus → processamento no worker → publicação;
  - assistir com URL pré-assinada e contagem de view;
  - like, comentário e inscrição;
  - home, busca e categoria.

  Dois pontos herdados mudam o que é testável pela UI. `## Inherited Deferred Capabilities` registra como adiadas a tela de confirmação de conta e a tela de definir nova senha (`phase-02-auth-frontend`), e o `next-frontend/app` de hoje só tem `signup`, `login` e `forgot-password`. Explicit choice: fixar a lista de fluxos da suíte e, para confirmação e recuperação de senha, dizer se o cenário segue o link do e-mail lido no Mailpit até a API, se fica fora da suíte ou se depende do DG-1.
- **AMB-2** — "Ambiente de produção e deploy", com entregável "ambiente de produção configurado", não diz se a fatia termina num **deploy real** ou em **artefatos de produção reproduzíveis**. Um deploy real tem host público, domínio, conta no storage e no relay SMTP, e esses passos ficam fora do repositório, por conta do usuário. Os artefatos reproduzíveis são compose de produção, Dockerfiles, config do proxy e workflow, validados subindo a stack de produção localmente. Essa resposta define o critério de aceite de TD-04, TD-05, TD-07, TD-08, TD-09 e TD-11 e se o `/implement` pode dar a fatia por concluída sem infraestrutura externa. Explicit choice: (a) deploy real num host público, com os passos externos listados como pré-requisitos manuais; (b) artefatos completos, validados com a stack de produção subindo no Docker local e com o deploy real fora do escopo; (c) os dois, com (b) como gate de conclusão e (a) como passo final documentado.
- **AMB-3** — O escopo não fixa **quantas instâncias** de API e BFF rodam em produção, e decisões herdadas dependem disso:
  - `phase-02-auth/TD-08` escolheu o throttler em memória porque "the project is single-instance";
  - `video-watch-page/TD-05` diz que "o deploy é de instância única até a Fase 07 tratar produção" e declara o storage em Redis como caminho para multi-instância.

  Com mais de uma instância, o orçamento de rate limit passa a valer por instância. Explicit choice: (a) instância única de API, worker e BFF, e o throttler em memória continua; (b) multi-instância, o que exige um TD novo para o storage do throttler (Redis) via `/research`.
- **AMB-4** — O escopo não diz como os **dois stacks se encontram na rede**, em produção e na suíte full-stack. As decisões herdadas preservam stacks independentes:
  - `next-frontend-openapi-typing/TD-02`: "neither subproject's compose file references the other";
  - a nota de `next-frontend-config-base/TD-03` deixou em aberto o valor de `API_URL` entre containers (`host.docker.internal` ou rede compartilhada);
  - `rate-limit-visitor-identity/TD-02` diz que a Option B "é o caminho mais limpo **se** a Fase 07 de produção unificar as redes".

  O BFF precisa alcançar a API pelo nome do serviço, como manda o `CLAUDE.md`, sem a API ficar pública. Explicit choice: (a) um compose de produção na raiz que referencia as duas imagens numa rede só, sem mudar os compose de dev; (b) rede Docker externa compartilhada pelos compose de cada subprojeto; (c) já coberto pela Recommendation de TD-04/TD-09, e então basta registrar isso como Revision ao decidir.

### Missing Decisions

_None._

### Dependency Gaps

- **DG-1** — Os links de e-mail da Fase 02 não têm destino viável em produção. A Fase 02 depende disso para o fluxo de cadastro e a de produção para o de recuperação. Evidência no código:
  - `nestjs-project/src/mail/mail.service.ts` monta `${APP_URL}/auth/confirm-email?token=…` e `${APP_URL}/auth/reset-password?token=…`, rotas da **API**;
  - `GET /auth/confirm-email` existe e responde `204`;
  - `/auth/reset-password` só aceita `POST`, então o link de recuperação dá 404;
  - o login recusa conta não confirmada (`EMAIL_NOT_CONFIRMED`, 403).

  Pelo BFF estrito (`next-frontend-config-base/TD-03`), a API não precisa ser pública, e as telas de destino no front estão adiadas (`## Inherited Deferred Capabilities`). Assim, quem se cadastra em produção fica sem conseguir entrar, a menos que a borda (TD-07) exponha a rota de confirmação ou que o front ganhe as telas. Explicit choice: (a) a superfície pública do TD-07 inclui `GET /auth/confirm-email` roteado para a API, com `APP_URL` apontando para o domínio público, e a recuperação de senha continua lacuna conhecida e documentada; (b) uma task separada de UI entrega as telas de confirmação e de nova senha no front (via `/screen-inventory` + pipeline próprio) antes do deploy, e o link passa a apontar para o front; (c) aceitar os dois fluxos como lacunas conhecidas em produção, com a suíte confirmando a conta pelo link lido no Mailpit.

### Inherited Constraint Conflicts

_None._

### Unresolved Open Questions

- **OQ-1** — TD-01 pending: camada dos testes ponta a ponta dos fluxos principais. Resolution: fill the **Decision:** field of TD-01 in `docs/decisions/technical-decisions-testes-producao.md`, then re-run /plan-validate testes-producao.
- **OQ-2** — TD-02 pending: dados e estado da suíte full-stack. Resolution: fill the **Decision:** field of TD-02 in `docs/decisions/technical-decisions-testes-producao.md`, then re-run /plan-validate testes-producao.
- **OQ-3** — TD-03 pending: pipeline de CI. A decisão herdada `next-frontend-openapi-typing/TD-03` já prevê um passo de checagem de frescor do `openapi.json`/`types.gen.ts` na CI. Resolution: fill the **Decision:** field of TD-03 in `docs/decisions/technical-decisions-testes-producao.md`, then re-run /plan-validate testes-producao.
- **OQ-4** — TD-04 pending: plataforma de hospedagem (depende de AMB-2 e AMB-3). Resolution: fill the **Decision:** field of TD-04 in `docs/decisions/technical-decisions-testes-producao.md`, then re-run /plan-validate testes-producao.
- **OQ-5** — TD-05 pending: armazenamento de objetos em produção. O código de acesso é S3-compatível por `upload-processing/TD-01`. Resolution: fill the **Decision:** field of TD-05 in `docs/decisions/technical-decisions-testes-producao.md`, then re-run /plan-validate testes-producao.
- **OQ-6** — TD-06 pending: execução das migrations em produção. Resolution: fill the **Decision:** field of TD-06 in `docs/decisions/technical-decisions-testes-producao.md`, then re-run /plan-validate testes-producao.
- **OQ-7** — TD-07 pending: proxy reverso, TLS e superfície pública. A decisão precisa cumprir o contrato herdado de `rate-limit-visitor-identity/TD-01`, em que a borda sobrescreve `X-Forwarded-For` e o app nunca confia no valor vindo do cliente, e é ela que responde a DG-1(a). Resolution: fill the **Decision:** field of TD-07 in `docs/decisions/technical-decisions-testes-producao.md`, then re-run /plan-validate testes-producao.
- **OQ-8** — TD-08 pending: envio de e-mail transacional em produção. O transporte herdado é SMTP via `@nestjs-modules/mailer` (`phase-02-auth/TD-05`). Resolution: fill the **Decision:** field of TD-08 in `docs/decisions/technical-decisions-testes-producao.md`, then re-run /plan-validate testes-producao.
- **OQ-9** — TD-09 pending: build das imagens, entrega e segredos. `INTERNAL_API_SECRET` precisa ser igual nos dois containers (`rate-limit-visitor-identity/TD-02`). Resolution: fill the **Decision:** field of TD-09 in `docs/decisions/technical-decisions-testes-producao.md`, then re-run /plan-validate testes-producao.
- **OQ-10** — TD-10 pending: saúde, logs e encerramento dos processos. Resolution: fill the **Decision:** field of TD-10 in `docs/decisions/technical-decisions-testes-producao.md`, then re-run /plan-validate testes-producao.
- **OQ-11** — TD-11 pending: backup e recuperação dos dados. Resolution: fill the **Decision:** field of TD-11 in `docs/decisions/technical-decisions-testes-producao.md`, then re-run /plan-validate testes-producao.

### UI Coverage Gaps

_None._ _(fatia sem `## UI Inventory` — UI fora do escopo)_

### Capability Consistency (slicing, phase mode only)

_None._ _(as `covers_capabilities` de `home-busca` e `testes-producao` casam verbatim com as bullets da Fase 07 em `project-plan.md`)_

## Cross-slice Advisories

_None._ _(a união das duas fatias cobre as 8 bullets da Fase 07: 6 em `home-busca`, 2 em `testes-producao`)_

## Resolved Issues

_No issues resolved yet._
