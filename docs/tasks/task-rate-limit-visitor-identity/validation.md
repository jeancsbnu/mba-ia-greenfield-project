---
kind: task
name: task-rate-limit-visitor-identity
status: clean
issue_count: 0
sources_mtime:
  docs/tasks/task-rate-limit-visitor-identity/context.md: "2026-10-08 17:50:36.838669700 -0300"
  docs/decisions/technical-decisions-rate-limit-visitor-identity.md: "2026-10-08 17:49:24.831258700 -0300"
sources_hash:
  docs/tasks/task-rate-limit-visitor-identity/context.md: "40ade04f9fb5"
  docs/decisions/technical-decisions-rate-limit-visitor-identity.md: "0d1493a08793"
issues:
  - id: AMB-1
    status: resolved
    summary: "Escopo não diz se a task entrega a borda que escreve o IP ou adia à Fase 07"
    resolved_by: rate-limit-visitor-identity/TD-01
  - id: AMB-2
    status: resolved
    summary: "Escopo cobre 'leituras públicas', mas inverter o default move também escritas de dono"
    resolved_by: rate-limit-visitor-identity/TD-04
  - id: OQ-1
    status: resolved
    summary: "TD-01 pending — onde o IP real do visitante é estabelecido"
    resolved_by: rate-limit-visitor-identity/TD-01
  - id: OQ-2
    status: resolved
    summary: "TD-02 pending — contrato do header de identidade BFF → Nest"
    resolved_by: rate-limit-visitor-identity/TD-02
  - id: OQ-3
    status: resolved
    summary: "TD-03 pending — chave do rastreador (IP ou usuário)"
    resolved_by: rate-limit-visitor-identity/TD-03
  - id: OQ-4
    status: resolved
    summary: "TD-04 pending — orçamento das leituras públicas e direção do default"
    resolved_by: rate-limit-visitor-identity/TD-04
  - id: IC-1
    status: resolved
    summary: "TD-04: prosa da Recommendation (7 rotas, 120 premissa) contradiz a Decision"
    resolved_by: rate-limit-visitor-identity/TD-04
  - id: IC-2
    status: resolved
    summary: "TD-01: recorte 'só o lado do app' está só na Decision, fora do Decisions Detail"
    resolved_by: rate-limit-visitor-identity/TD-01
advisories: []
---

# task-rate-limit-visitor-identity — Validation

## Findings

### Inconsistencies

_None._

### Ambiguities

_None._

### Missing Decisions

_None._

### Inherited Constraint Conflicts

_None._

### Unresolved Open Questions

_None._

### UI Coverage Gaps

_None._

## Resolved Issues

- **AMB-1** _(resolved_by rate-limit-visitor-identity/TD-01)_ — Escopo não diz se a task entrega a borda que escreve o IP ou adia à Fase 07. Resolvido em 2026-10-08: **só o lado do app** entra nesta task (repasse com segredo + `getTracker`); o BFF lê o `x-forwarded-for` como o Next o entrega, confiável com uma borda que o sobrescreve e forjável enquanto ela não existir. Proxy e TLS ficam para a pesquisa de produção da Fase 07.
- **AMB-2** _(resolved_by rate-limit-visitor-identity/TD-04)_ — Escopo cobre 'leituras públicas', mas inverter o default move também escritas de dono. Resolvido em 2026-10-08: escritas autenticadas de dono sem decorator (`PATCH /videos/:publicId`, `PATCH` do canal) **aceitam o default de leitura**, contadas por usuário (TD-03). `AUTH_THROTTLE` 10/60 s vai nos **6 handlers sensíveis**: `register`, `confirm-email`, `resend-confirmation`, `login`, `forgot-password` e `reset-password`. `refresh`, `logout` e `me` ficam no default.
- **OQ-1** _(resolved_by rate-limit-visitor-identity/TD-01)_ — TD-01 decidido: **A** (proxy de borda que sobrescreve o header de IP; nesta task, só o lado do app).
- **OQ-2** _(resolved_by rate-limit-visitor-identity/TD-02)_ — TD-02 decidido: **A** (`X-Client-IP` + `INTERNAL_API_SECRET`; sem segredo válido, `req.ip`).
- **OQ-3** _(resolved_by rate-limit-visitor-identity/TD-03)_ — TD-03 decidido: **B** (`user:<sub>` autenticado, `ip:<ip>` anônimo). Registrado como **Revision** em `social-interactions/TD-09`, que mantém a Option B e os orçamentos de 60/60 s e 5/60 s.
- **OQ-4** _(resolved_by rate-limit-visitor-identity/TD-04)_ — TD-04 decidido: **B** com **120/60 s** confirmado (o número deixa de ser premissa). Registrado como **Revision** em `phase-02-auth/TD-08`, que mantém a Option A e passa a registrar o default invertido.
- **IC-1** _(resolved_by rate-limit-visitor-identity/TD-04)_ — TD-04: prosa da Recommendation (7 rotas, 120 premissa) contradizia a Decision. Resolvido em 2026-10-08 por **Append revision** no TD-04 (mesma Option B): 120/60 s confirmado, `AUTH_THROTTLE` 10/60 s nos 6 handlers nomeados, `refresh`/`logout`/`me` e escritas de dono no default, e o registro de que este default substitui o "10/60 s para a aplicação inteira" de `phase-02-auth/TD-08`. A Revision chega ao `## Decisions Detail` do context.md.
- **IC-2** _(resolved_by rate-limit-visitor-identity/TD-01)_ — TD-01: recorte "só o lado do app" estava só na Decision. Resolvido em 2026-10-08 por **Append revision** no TD-01 (mesma Option A): só o lado do app nesta task, BFF lê o `x-forwarded-for` do Next (forjável sem borda), nenhum SI de proxy ou compose; proxy e TLS na fatia de deploy da Fase 07.
