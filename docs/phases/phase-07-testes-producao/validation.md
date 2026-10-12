---
kind: phase
name: phase-07-testes-producao
status: dirty
issue_count: 0
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
    status: resolved
    summary: "Storage inalcançável pelo navegador: Caddy único publicado e URL assinada com minio:9000"
    resolved_by: testes-producao/TD-05
  - id: IC-2
    status: resolved
    summary: "Mailpit da stack de produção sem caminho de acesso (UI e API da suíte)"
    resolved_by: testes-producao/TD-08
  - id: IC-3
    status: resolved
    summary: "Suíte com ambiente zerado sobe sobre o compose de produção e apaga seus dados"
    resolved_by: testes-producao/TD-02
  - id: ICC-1
    status: resolved
    summary: "confirm-email direto do Caddy cai no balde ip:<caddy> de 10/60 s para todos"
    resolved_by: testes-producao/TD-07
advisories: []
---

# phase-07-testes-producao — Validation

## Findings

### Inconsistencies

_None._

### Ambiguities

_None._

### Missing Decisions

_None._

### Dependency Gaps

_None._

### Inherited Constraint Conflicts

_None._

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
- **IC-1** _(resolved_by testes-producao/TD-05)_ — Storage inalcançável pelo navegador: Caddy único publicado e URL assinada com minio:9000. Opção (a): o Caddy serve o storage num endereço próprio (host ou porta, não um path, por causa da colisão do bucket `videos` com `/videos/{publicId}`), e a API ganha um endpoint público só para assinar, separado do interno (Revisions do TD-05 e do TD-07).
- **IC-2** _(resolved_by testes-producao/TD-08)_ — Mailpit da stack de produção sem caminho de acesso (UI e API da suíte). Opção (a): a UI e a API HTTP do Mailpit ficam publicadas no host, fora do Caddy, como no dev; o SMTP fica só na rede interna (Revisions do TD-08 e do TD-07).
- **IC-3** _(resolved_by testes-producao/TD-02)_ — Suíte com ambiente zerado sobe sobre o compose de produção e apaga seus dados. Opção (a): a suíte sobe o mesmo compose de produção com outro nome de projeto (`-p`), com volumes e portas próprios, e o derruba ao fim; a stack de produção nunca é tocada (Revision do TD-02).
- **ICC-1** _(resolved_by testes-producao/TD-07)_ — confirm-email direto do Caddy cai no balde ip:<caddy> de 10/60 s para todos. Opção (a): o link de confirmação aponta para uma rota `GET` do BFF no mesmo path `/auth/confirm-email`, que repassa à API com `X-Client-IP` e o token e redireciona para `/login`; o Caddy não expõe nenhuma rota da API (Revision do TD-07).
