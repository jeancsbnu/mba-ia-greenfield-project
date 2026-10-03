# phase-06-social-interactions — Screen Inventory Progress

**Status:** completed
**Screens:** 3/3 completed

## Reconciled screen list

| # | Screen name | URL (fileKey:nodeId) | Status |
|---|-------------|----------------------|--------|
| 1 | Página de visualização do vídeo — interações sociais | FetKyb1V02WS5D6VCatK6t:77:64 | completed |
| 2 | Área de canais seguidos | FetKyb1V02WS5D6VCatK6t:75:62 | completed |
| 3 | Página pública do canal | FetKyb1V02WS5D6VCatK6t:59:2 | completed |

## Screens removed as out-of-scope

- ~~`canal-publico` (`77:190`)~~ — era duplicata da rota `/@{nickname}`, que já é a `59:2` da Fase 04. Removida do Figma em 2026-10-03 (PR #37); a `59:2` foi estendida no lugar.

## Decisions log

- ✓ [DECISION: a área de canais seguidos tem qual rota? O TD-07 decidiu o conteúdo sem nomear o endereço] — resolvido 2026-10-03 pelo usuário: `/channel/subscriptions`, seguindo a convenção de `/channel/videos` e `/channel/settings`.
- ✓ [DECISION: a watch page da Fase 06 é tela nova ou variante da `66:42`?] — resolvido: **variante autenticada da mesma rota** `/videos/{publicId}`. Mesmo precedente do `68:62` (estado not-found) no inventário da Fase 05: múltiplos frames numa rota quando são estados distintos.
- ✓ [DECISION: `ReplyButton` é Local-interactive ou Server-connected?] — resolvido 2026-10-03: **Local-interactive**; só abre o compositor, e quem publica é um `ReplyForm` à parte. O `ReplyForm` não está desenhado, então virou Open question em vez de linha inventada.
- ✓ [DECISION: `nav-link-canais-seguidos` (`75:74`) vira arquivo próprio?] — resolvido 2026-10-03: **não**; `<Link>` inline em `components/layout/site-navbar.tsx` (`Reuse? = new`). Um arquivo para um link único é abstração antes da necessidade; a Fase 07 traz o navbar completo.
- ✓ [DECISION: o verbo "Exibir a contagem de inscritos de cada canal seguido" mapeia para qual capability?] — resolvido 2026-10-03: **"Área de canais seguidos com acesso rápido aos vídeos"**. Mantém "Contagem de inscritos na página do canal" significando literalmente a página do canal e evita duas telas reivindicando a mesma capability.
