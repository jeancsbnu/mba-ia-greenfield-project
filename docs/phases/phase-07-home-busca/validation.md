---
kind: phase
name: phase-07-home-busca
status: dirty
issue_count: 0
sources_mtime:
  docs/phases/phase-07-home-busca/context.md: "2026-10-08T22:33:11-03:00"
  docs/decisions/technical-decisions-home-busca.md: "2026-10-08T14:26:59-03:00"
sources_hash:
  docs/phases/phase-07-home-busca/context.md: "fb1b9ab95f95"
  docs/decisions/technical-decisions-home-busca.md: "5d62495359b9"
issues:
  - id: IC-1
    status: resolved
    summary: "Rate limit herdado em três versões: 10/60 s por IP, por IP nas rotas, 120/60 s por visitante"
    resolved_by: home-busca/TD-09
  - id: AMB-1
    status: resolved
    summary: "Navbar completa vale só para o chrome público ou também para a SiteNavbar do studio?"
    resolved_by: home-busca/TD-07
  - id: OQ-1
    status: resolved
    summary: "home-busca/TD-01 pending — Superfície de rotas e contrato da listagem global"
    resolved_by: home-busca/TD-01
  - id: OQ-2
    status: resolved
    summary: "home-busca/TD-02 pending — Paginação da home e da busca"
    resolved_by: home-busca/TD-02
  - id: OQ-3
    status: resolved
    summary: "home-busca/TD-03 pending — Ordenação da home"
    resolved_by: home-busca/TD-03
  - id: OQ-4
    status: resolved
    summary: "home-busca/TD-04 pending — Mecanismo de busca textual (título e canal)"
    resolved_by: home-busca/TD-04
  - id: OQ-5
    status: resolved
    summary: "home-busca/TD-05 pending — Forma do resultado quando o termo casa com um canal"
    resolved_by: home-busca/TD-05
  - id: OQ-6
    status: resolved
    summary: "home-busca/TD-06 pending — Modelo de interação da barra de busca"
    resolved_by: home-busca/TD-06
  - id: OQ-7
    status: resolved
    summary: "home-busca/TD-07 pending — Estrutura da navegação global e chrome no mobile"
    resolved_by: home-busca/TD-07
  - id: OQ-8
    status: resolved
    summary: "home-busca/TD-08 pending — Estratégia de responsividade e alcance do retrofit"
    resolved_by: home-busca/TD-08
  - id: OQ-9
    status: resolved
    summary: "home-busca/TD-09 pending — Rate limit da home e da busca (alinhar a rate-limit/TD-04)"
    resolved_by: home-busca/TD-09
  - id: OQ-10
    status: resolved
    summary: "Inventário — as 6 telas seguem Recommendations ainda pending"
    resolved_by: clarification
  - id: OQ-11
    status: resolved
    summary: "Inventário — variante anônima do menu mobile não desenhada"
    resolved_by: home-busca/TD-07
  - id: OQ-12
    status: resolved
    summary: "Inventário — destinos da navegação divergem do home-busca/TD-07"
    resolved_by: home-busca/TD-07
  - id: OQ-13
    status: resolved
    summary: "Inventário — Pagination do DS diverge do desenho no mobile"
    resolved_by: home-busca/TD-02
  - id: OQ-14
    status: resolved
    summary: "Inventário — estados sem desenho (loading, erro, vazios, termo curto)"
    resolved_by: home-busca/TD-01
  - id: OQ-15
    status: resolved
    summary: "Inventário — logout com dois pontos de entrada (UserMenu e NavigationSheet)"
    resolved_by: home-busca/TD-07
  - id: OQ-16
    status: resolved
    summary: "Inventário — falta o primitivo de sheet em components/ui"
    resolved_by: home-busca/TD-07
  - id: OQ-17
    status: resolved
    summary: "Inventário — VideoCard estendido muda de contrato (canal, size, sizes, destinos)"
    resolved_by: home-busca/TD-01
advisories: []
---

# phase-07-home-busca — Validation

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

_None._

## Resolved Issues

- **IC-1** _(resolved_by home-busca/TD-09)_ — Rate limit herdado em três versões: 10/60 s por IP, por IP nas rotas, 120/60 s por visitante. Precedência registrada na Revision de 2026-10-11 do TD-09: para rate limit valem `rate-limit-visitor-identity/TD-03` e `TD-04` sobre a prosa herdada de `phase-02-auth/TD-08`, `video-watch-page/TD-05` (30/60 s da view continua; rastreador por visitante) e `social-interactions/TD-09`. Nenhum artefato de fase anterior foi editado.
- **AMB-1** _(resolved_by home-busca/TD-07)_ — Navbar completa vale só para o chrome público ou também para a SiteNavbar do studio?. Navbar única em todas as telas, inclusive o studio, montada em layout; a `SiteNavbar` sai (Revision do TD-07 e Revision correspondente em `video-channel-management/TD-09`).
- **OQ-1** _(resolved_by home-busca/TD-01)_ — home-busca/TD-01 pending — Superfície de rotas e contrato da listagem global. TD-01 decidido: B (um endpoint `GET /videos?q=&category=`; home em `/` e resultados em `/results`).
- **OQ-2** _(resolved_by home-busca/TD-02)_ — home-busca/TD-02 pending — Paginação da home e da busca. TD-02 decidido: A, com 12 vídeos por página (Revision).
- **OQ-3** _(resolved_by home-busca/TD-03)_ — home-busca/TD-03 pending — Ordenação da home. TD-03 decidido: A (mais recentes primeiro).
- **OQ-4** _(resolved_by home-busca/TD-04)_ — home-busca/TD-04 pending — Mecanismo de busca textual (título e canal). TD-04 decidido: A, com termo mínimo de 3 caracteres (Revision).
- **OQ-5** _(resolved_by home-busca/TD-05)_ — home-busca/TD-05 pending — Forma do resultado quando o termo casa com um canal. TD-05 decidido: A (só vídeos).
- **OQ-6** _(resolved_by home-busca/TD-06)_ — home-busca/TD-06 pending — Modelo de interação da barra de busca. TD-06 decidido: A (`next/form`).
- **OQ-7** _(resolved_by home-busca/TD-07)_ — home-busca/TD-07 pending — Estrutura da navegação global e chrome no mobile. TD-07 decidido: A (barra superior + sheet no mobile; navbar única).
- **OQ-8** _(resolved_by home-busca/TD-08)_ — home-busca/TD-08 pending — Estratégia de responsividade e alcance do retrofit. TD-08 decidido: B (regras escritas + frames mobile só do novo).
- **OQ-9** _(resolved_by home-busca/TD-09)_ — home-busca/TD-09 pending — Rate limit da home e da busca (alinhar a rate-limit/TD-04). TD-09 decidido: C — home e busca no default global de 120/60 s por visitante, sem decorator (Revision explica a divergência da Recommendation A).
- **OQ-10** _(resolved_by clarification)_ — Inventário — as 6 telas seguem Recommendations ainda pending. Confirmado: todas as letras decididas coincidem com as que as 6 telas seguiram; nada a redesenhar nem reinventariar.
- **OQ-11** _(resolved_by home-busca/TD-07)_ — Inventário — variante anônima do menu mobile não desenhada. Sheet anônimo com "Entrar" no lugar do bloco do usuário e só links públicos; barra mobile fechada sem avatar (Revision do TD-07).
- **OQ-12** _(resolved_by home-busca/TD-07)_ — Inventário — destinos da navegação divergem do home-busca/TD-07. Destinos do desenho (Início / Canais seguidos / Meus vídeos) + "Seu canal" no menu do usuário (Revision do TD-07). Pergunta refeita em 2026-10-11 depois de corrigir a premissa de que o menu já tinha esse link.
- **OQ-13** _(resolved_by home-busca/TD-02)_ — Inventário — Pagination do DS diverge do desenho no mobile. Segue o DS sem alteração (chevrons no mobile); desabilitado nas pontas e oculta com página única, como a página do canal (Revision do TD-02).
- **OQ-14** _(resolved_by home-busca/TD-01)_ — Inventário — estados sem desenho (loading, erro, vazios, termo curto). Estados derivados dos padrões das Fases 04–06 (Revision do TD-01); critérios argumentados, não observados.
- **OQ-15** _(resolved_by home-busca/TD-07)_ — Inventário — logout com dois pontos de entrada (UserMenu e NavigationSheet). Logout extraído para um módulo compartilhado em `lib/auth` (Revision do TD-07).
- **OQ-16** _(resolved_by home-busca/TD-07)_ — Inventário — falta o primitivo de sheet em components/ui. Novo `components/ui/sheet.tsx` (Sheet do shadcn) (Revision do TD-07).
- **OQ-17** _(resolved_by home-busca/TD-01)_ — Inventário — VideoCard estendido muda de contrato (canal, size, sizes, destinos). Card leva ao vídeo; avatar e nome do canal a `/@{nickname}`, como links irmãos; `sizes` por variante (Revision do TD-01).
