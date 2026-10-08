# phase-07-home-busca — Screen Inventory Progress

**Status:** completed
**Screens:** 6/6 completed

## Reconciled screen list

| # | Screen name | URL (fileKey:nodeId) | Status |
|---|-------------|----------------------|--------|
| 1 | Página inicial | FetKyb1V02WS5D6VCatK6t:83:127 | completed |
| 2 | Resultados da busca | FetKyb1V02WS5D6VCatK6t:83:311 | completed |
| 3 | Resultados da busca — sem resultados | FetKyb1V02WS5D6VCatK6t:83:437 | completed |
| 4 | Página inicial — mobile | FetKyb1V02WS5D6VCatK6t:84:299 | completed |
| 5 | Resultados da busca — mobile | FetKyb1V02WS5D6VCatK6t:84:379 | completed |
| 6 | Menu de navegação — mobile | FetKyb1V02WS5D6VCatK6t:84:425 | completed |

## Screens removed as out-of-scope

- ~~Estado de carregamento da home/resultados~~ — não desenhado; segue o padrão `loading.tsx` já usado na página do canal (Fase 04). Registrado como open question, não como tela.
- ~~Home filtrada por categoria~~ — não é tela própria: é a mesma `Página inicial` com outro chip `state=selected`.

## Decisions log

- ✓ [DECISION: rota da busca — `/results` (TD-01 B) ou `/?q=` (TD-01 C)?] — resolvido 2026-10-06 pelo usuário: **`/results`**, seguindo a recomendação ainda pendente de `home-busca/TD-01`.
- ✓ [DECISION: frames mobile como seções próprias ou como variantes da tela desktop?] — resolvido 2026-10-06 pelo usuário: **seções próprias** (mesma rota, rótulo "— mobile"), para que componentes exclusivos do mobile ganhem linha.
- ✓ [DECISION: o menu de navegação aberto no mobile tem frame próprio?] — resolvido 2026-10-06: **sim**, `menu-navegacao-mobile` (`84:425`), desenhado nesta sessão; entra como seção própria.
- ✓ [DECISION: estado vazio da busca é frame próprio?] — resolvido 2026-10-06: **sim**, `resultados-busca-vazio` (`83:437`), seção própria na rota `/results`, no mesmo precedente do `68:62` (estado not-found) da Fase 05.
- ✓ [DECISION: quem é dono do fetch da listagem — a `VideoGrid` (componente) ou a página RSC (`app/page.tsx` / `app/results/page.tsx (new)`)? Levantado em `ResultsPage` (83:311): o total do `ResultsHeading` e os cards da `VideoGrid` saem da mesma resposta, mas são nós irmãos] — resolvido 2026-10-06 pelo usuário: **a página RSC** (`app/page.tsx`, `app/results/page.tsx (new)`) é dona do fetch e repassa itens à VideoGrid e termo/total ao ResultsHeading — padrão de `app/channels/[nickname]/page.tsx` e da VideoWatchPage da Fase 05. Aplicado nas 6 seções: linhas HomePage/ResultsPage (Server-connected) acrescentadas, VideoGrid e SearchEmptyState viraram Presentational, verbos movidos para a página.
- ✓ [DECISION: o "Sair" do menu mobile (`SairButton` 84:510) mapeia para "Header/navbar com logo, barra de busca, botão de login/avatar e navegação" ou fica herdado da Fase 02 sem verbo nesta fatia?] — resolvido 2026-10-06 pelo usuário: **herdado da Fase 02, sem verbo nesta fatia** (mesmo tratamento da Fase 04); verbo removido, linha do SairButton mantida com a nota.
