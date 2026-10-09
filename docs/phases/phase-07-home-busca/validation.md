---
kind: phase
name: phase-07-home-busca
status: dirty
issue_count: 19
sources_mtime:
  docs/phases/phase-07-home-busca/context.md: "2026-10-08T22:33:11-03:00"
  docs/decisions/technical-decisions-home-busca.md: "2026-10-08T14:26:59-03:00"
sources_hash:
  docs/phases/phase-07-home-busca/context.md: "fb1b9ab95f95"
  docs/decisions/technical-decisions-home-busca.md: "5d62495359b9"
issues:
  - id: IC-1
    status: open
    summary: "Rate limit herdado em três versões: 10/60 s por IP, por IP nas rotas, 120/60 s por visitante"
  - id: AMB-1
    status: open
    summary: "Navbar completa vale só para o chrome público ou também para a SiteNavbar do studio?"
  - id: OQ-1
    status: open
    summary: "home-busca/TD-01 pending — Superfície de rotas e contrato da listagem global"
  - id: OQ-2
    status: open
    summary: "home-busca/TD-02 pending — Paginação da home e da busca"
  - id: OQ-3
    status: open
    summary: "home-busca/TD-03 pending — Ordenação da home"
  - id: OQ-4
    status: open
    summary: "home-busca/TD-04 pending — Mecanismo de busca textual (título e canal)"
  - id: OQ-5
    status: open
    summary: "home-busca/TD-05 pending — Forma do resultado quando o termo casa com um canal"
  - id: OQ-6
    status: open
    summary: "home-busca/TD-06 pending — Modelo de interação da barra de busca"
  - id: OQ-7
    status: open
    summary: "home-busca/TD-07 pending — Estrutura da navegação global e chrome no mobile"
  - id: OQ-8
    status: open
    summary: "home-busca/TD-08 pending — Estratégia de responsividade e alcance do retrofit"
  - id: OQ-9
    status: open
    summary: "home-busca/TD-09 pending — Rate limit da home e da busca (alinhar a rate-limit/TD-04)"
  - id: OQ-10
    status: open
    summary: "Inventário — as 6 telas seguem Recommendations ainda pending"
  - id: OQ-11
    status: open
    summary: "Inventário — variante anônima do menu mobile não desenhada"
  - id: OQ-12
    status: open
    summary: "Inventário — destinos da navegação divergem do home-busca/TD-07"
  - id: OQ-13
    status: open
    summary: "Inventário — Pagination do DS diverge do desenho no mobile"
  - id: OQ-14
    status: open
    summary: "Inventário — estados sem desenho (loading, erro, vazios, termo curto)"
  - id: OQ-15
    status: open
    summary: "Inventário — logout com dois pontos de entrada (UserMenu e NavigationSheet)"
  - id: OQ-16
    status: open
    summary: "Inventário — falta o primitivo de sheet em components/ui"
  - id: OQ-17
    status: open
    summary: "Inventário — VideoCard estendido muda de contrato (canal, size, sizes, destinos)"
advisories: []
---

# phase-07-home-busca — Validation

## Findings

### Inconsistencies

- **IC-1** — O `## Inherited Decisions Detail` traz três versões incompatíveis do rate limit. Elas vêm de três TDs:
  - `phase-02-auth/TD-08` diz "scoping rate limiting to `AuthModule` only via module-level `APP_GUARD`, with `@SkipThrottle()` for exemptions". Na prática isso é o default global de 10/60 s por IP.
  - `video-watch-page/TD-05` diz "30 requisições por 60 s por IP".
  - `social-interactions/TD-09` diz que o rastreador por usuário fica "declarado como caminho" para depois.

  `rate-limit-visitor-identity/TD-03` e `TD-04` trazem o estado vigente: rastreador `user:<sub>` / `ip:<ip>` e default global de 120 req/60 s por visitante. A Revision de 2026-10-08 do `TD-04` diz que ela "substitui como vigente" o default de `phase-02-auth/TD-08`. As Revisions correspondentes em `phase-02-auth/TD-08` e `social-interactions/TD-09` existem nos docs de decisão, mas não chegaram a este `context.md`, porque os `context.md` das Fases 02 e 06 são anteriores a elas.

  Um `/plan-build` que leia os blocos herdados na ordem pode aplicar `@SkipThrottle()` ou "por IP" à home e à busca.

  Explicit choice:
  - (a) Registrar no resolve, como clarificação, que `rate-limit-visitor-identity/TD-03` e `TD-04` prevalecem sobre a prosa herdada de `phase-02-auth/TD-08`, `video-watch-page/TD-05` (o número 30/60 s continua, o rastreador muda) e `social-interactions/TD-09`.
  - (b) Regenerar os `context.md` das Fases 02 e 06 para que carreguem as Revisions, e então rodar de novo `/plan-context home-busca`.

### Ambiguities

- **AMB-1** — A bullet "Header/navbar com logo, barra de busca, botão de login/avatar e navegação" não diz em qual chrome a navbar completa entra. O projeto tem dois:
  - **público:** a `PublicSiteNavbar`, única coberta pelo `## UI Inventory`;
  - **autenticado:** o do route group do studio. Pela Revision de 2026-09-20 de `video-channel-management/TD-09`, ele compartilha `SiteNavbar` e `UserMenu` entre `/channel/videos`, `/videos/{publicId}/edit` e `/channel/settings`.

  O inventário só desenha a variante pública. A open question de navegação (OQ-12) cita destinos que levam a rotas do studio, então o usuário logado transita entre os dois chromes.

  Explicit choice:
  - (a) A busca e a navegação entram só na `PublicSiteNavbar`, e a `SiteNavbar` do studio fica como está.
  - (b) As duas navbars ganham busca e navegação. Nesse caso a `SiteNavbar` precisa de verbo no inventário, via extension run do `/screen-inventory`, ou de uma decisão explícita de unificar os dois componentes.

### Missing Decisions

_None._ As seis bullets da fatia têm TD que as cobre (`## Capability Coverage`).

O contrato FE↔BE (Decisão #29) está coberto por herança. `next-frontend-openapi-typing/TD-04` é `Cross-layer` desde a Revision de 2026-10-03, e `TD-01`/`TD-05` fecham a cadeia `openapi.json` → `types.gen.ts` → `contracts.ts` → handlers MSW. O formato de erro do `nestjs-project` vem de `phase-02-auth/TD-07`.

As bullets "Testes dos fluxos principais da plataforma" e "Ambiente de produção e deploy" estão fora do `covers_capabilities` desta fatia e pertencem à fatia irmã (testes + deploy). Por isso não contam como MD contra home-busca, mesmo precedente de `phase-02-auth-frontend`. Essa fatia ainda não tem `/research`, então nenhum gate cobra essas duas bullets hoje. O Check 8 e o Gate 9.5 do `/plan-build` só rodam com duas ou mais fatias no disco.

### Dependency Gaps

_None._ Tudo o que a fatia consome já foi entregue por fases anteriores:
- sessão renderizada no servidor e propagada por Context (`phase-02-auth-frontend/TD-06`);
- rota BFF de logout (`phase-02-auth-frontend/TD-05`);
- enum de categorias (`video-channel-management/TD-01`, `TD-10`);
- regra de listável, publicado e público (`video-channel-management/TD-02`);
- contadores desnormalizados (`video-channel-management/TD-05`);
- identidade do visitante no throttler (`rate-limit-visitor-identity`).

A borda que torna o `X-Client-IP` confiável (`rate-limit-visitor-identity/TD-01`) é da fatia de deploy e não bloqueia esta.

### Inherited Constraint Conflicts

_None._ Não há TD decidido no escopo corrente. Os nove TDs de home-busca estão pending. O alinhamento do `home-busca/TD-09` ao `rate-limit-visitor-identity/TD-04` está em OQ-9.

### Unresolved Open Questions

- **OQ-1** — `home-busca/TD-01` pending — Superfície de rotas e contrato da listagem global (home, categoria e busca). Resolution: fill the `**Decision:**` field of TD-01 in `docs/decisions/technical-decisions-home-busca.md` via /plan-resolve home-busca, then re-run /plan-validate home-busca.
- **OQ-2** — `home-busca/TD-02` pending — Paginação da home e da busca (contrato e padrão de interface). Lembre que `video-channel-management/TD-06` registra que "Cursor permanece a escolha certa para o feed global da home", e a Recommendation desenhada no inventário é paginação numerada em `?page=N`. Resolution: fill the `**Decision:**` field of TD-02 via /plan-resolve home-busca, then re-run /plan-validate home-busca.
- **OQ-3** — `home-busca/TD-03` pending — Ordenação da home. Resolution: fill the `**Decision:**` field of TD-03 via /plan-resolve home-busca, then re-run /plan-validate home-busca.
- **OQ-4** — `home-busca/TD-04` pending — Mecanismo de busca textual (título e canal). O inventário (OQ-14) lembra que este TD precisa fixar o comprimento mínimo do termo. Resolution: fill the `**Decision:**` field of TD-04 via /plan-resolve home-busca, then re-run /plan-validate home-busca.
- **OQ-5** — `home-busca/TD-05` pending — Forma do resultado quando o termo casa com um canal. Resolution: fill the `**Decision:**` field of TD-05 via /plan-resolve home-busca, then re-run /plan-validate home-busca.
- **OQ-6** — `home-busca/TD-06` pending — Modelo de interação da barra de busca. Resolution: fill the `**Decision:**` field of TD-06 via /plan-resolve home-busca, then re-run /plan-validate home-busca.
- **OQ-7** — `home-busca/TD-07` pending — Estrutura da navegação global e comportamento do chrome no mobile. Depende de OQ-11, OQ-12 e AMB-1. Resolution: fill the `**Decision:**` field of TD-07 via /plan-resolve home-busca, then re-run /plan-validate home-busca.
- **OQ-8** — `home-busca/TD-08` pending — Estratégia de responsividade (origem do layout mobile e alcance do retrofit). Resolution: fill the `**Decision:**` field of TD-08 via /plan-resolve home-busca, then re-run /plan-validate home-busca.
- **OQ-9** — `home-busca/TD-09` pending — Rate limit das listagens públicas de alto tráfego (home e busca). A Recommendation de `rate-limit-visitor-identity/TD-04` (herdada) diz que "o `home-busca/TD-09` fica resolvido sem caso especial: home e busca caem no default de leitura, e o resolve daquela fatia deve alinhar a letra a esta decisão". O default vigente é 120 req/60 s por visitante. Resolution: fill the `**Decision:**` field of TD-09 via /plan-resolve home-busca, choosing the option that leaves home and search on the global default, then re-run /plan-validate home-busca.
- **OQ-10** — **As 6 telas seguem Recommendations de TDs ainda PENDING.** As decisões são `home-busca/TD-01` B (`/results`), TD-02 A (paginação numerada em `?page=N`), TD-03 A (mais recentes primeiro), TD-05 A (só vídeos), TD-06 A (`next/form` com botão "Buscar"), TD-07 A (barra superior e sheet no mobile) e TD-08 B (frames mobile só do que é novo). Se o `/plan-resolve` escolher outra letra em qualquer uma delas, as telas correspondentes precisam ser redesenhadas e reinventariadas. Exemplos: TD-02 C troca a Pagination por scroll infinito; TD-05 B acrescenta um bloco de canais; TD-07 B põe uma sidebar em todas as telas. Resolution: resolve via /plan-resolve home-busca, which will present AskUserQuestion for this item.
- **OQ-11** — **Variante anônima do menu mobile não desenhada.** O frame `84:425` é autenticado. Para o anônimo faltam três definições: o bloco "Entrar" no lugar de `sheet-user` e `sair-button`, quais links aparecem (Canais seguidos e Meus vídeos levam a rotas de `(studio)`), e se a barra mobile fechada do usuário autenticado mostra o avatar ou deixa tudo no sheet. Como a barra mobile anônima (`84:299`) não tem "Entrar", o caminho do anônimo até o login no mobile é **argumentado, não observado**. Resolution: resolve via /plan-resolve home-busca, which will present AskUserQuestion for this item.
- **OQ-12** — **Destinos da navegação divergem do `home-busca/TD-07`.** O desenho tem Início / Canais seguidos / Meus vídeos. O Context do TD-07 lista Início, Canais seguidos, Seu canal e Enviar vídeo: não há "Enviar vídeo" (`/upload` existe) e "Meus vídeos" não está na lista. É preciso confirmar o conjunto antes do plan-build. Resolution: resolve via /plan-resolve home-busca, which will present AskUserQuestion for this item.
- **OQ-13** — **A Pagination do DS diverge do desenho no mobile.** `components/ui/pagination.tsx` esconde o texto de Anterior/Próxima abaixo de `sm` e mostra só os chevrons; os frames de 375px mostram o texto, sem chevrons. Também não estão desenhados o estado desabilitado de Anterior/Próxima nem o que acontece quando há uma página só (esconder a paginação ou não). Resolution: resolve via /plan-resolve home-busca, which will present AskUserQuestion for this item.
- **OQ-14** — **Estados sem desenho.** Não há frame para:
  - carregamento e erro da listagem;
  - home sem vídeos, ou sem vídeos na categoria selecionada;
  - busca vazia no mobile;
  - termo abaixo do comprimento mínimo que `home-busca/TD-04` manda fixar no resolve.

  O plan-build terá de derivar esses estados pelos padrões das Fases 04–06 (`loading.tsx`, estados vazios existentes).

  Resolution: resolve via /plan-resolve home-busca, which will present AskUserQuestion for this item.
- **OQ-15** — **Logout passa a ter dois pontos de entrada.** São o UserMenu no desktop e a NavigationSheet no mobile. Hoje a chamada a `POST /api/auth/logout` vive em `components/layout/channel-user-menu.tsx`. Pelo princípio de responsabilidade única ela precisa ir para um lugar compartilhado, sem duplicar no sheet. O verbo foi registrado como herdado da Fase 02 (Decisions log). Resolution: resolve via /plan-resolve home-busca, which will present AskUserQuestion for this item.
- **OQ-16** — **Falta o primitivo de sheet.** `components/ui` não tem sheet/drawer, mas `radix-ui` está instalado. Fica para o plan-build decidir entre a `NavigationSheet` usar o `Dialog` do Radix direto ou criar antes um `components/ui/sheet.tsx` genérico. Resolution: resolve via /plan-resolve home-busca, which will present AskUserQuestion for this item.
- **OQ-17** — **O `VideoCard` estendido muda de contrato.** Além da linha de canal e da variante `size=desktop|mobile`, o `sizes="233px"` fixo da thumbnail precisa acompanhar a variante mobile (largura cheia), senão o `next/image` serve imagem subdimensionada. O desenho também não mostra destino de clique no card nem no nome do canal (presumivelmente `/videos/{publicId}` e `/@{nickname}`). Resolution: resolve via /plan-resolve home-busca, which will present AskUserQuestion for this item.

### UI Coverage Gaps

_None._ Nenhum TD da fatia está decidido, então nenhuma capability preenche a condição 1 do Check 7. As seis bullets da fatia já têm verbo no `### UI ↔ Capability Join`.

## Resolved Issues

_No issues resolved yet._
