# phase-04-video-channel-management — Screen Inventory Progress

**Status:** completed
**Screens:** 4/4 completed

## Reconciled screen list

| # | Screen name                                   | URL (fileKey:nodeId)              | Status    |
|---|-----------------------------------------------|-----------------------------------|-----------|
| 1 | Painel de gerenciamento de vídeos do canal    | FetKyb1V02WS5D6VCatK6t:39:2       | completed |
| 2 | Tela de edição de vídeo                       | FetKyb1V02WS5D6VCatK6t:41:90      | completed |
| 3 | Tela de edição do canal                       | FetKyb1V02WS5D6VCatK6t:41:141     | completed |
| 4 | Página pública do canal                       | FetKyb1V02WS5D6VCatK6t:59:2       | completed |

## Screens removed as out-of-scope

- ~~Tela de redefinição de senha (Figma 41:177)~~ — cobre a capability de recuperação de senha da Fase 02, não uma da Fase 04; candidata a extension run do inventário `phase-02-auth-frontend`.
- ~~Tela de conta confirmada (Figma 41:195)~~ — cobre a capability de confirmação de conta da Fase 02 (de-scoped em 2026-05-14), não uma da Fase 04.

## Decisions log

- ✓ [DECISION: rota do Painel de gerenciamento — /channel/videos | /studio | /dashboard] — resolved: `/channel/videos` (user, 2026-09-20; coerente com `/channel/settings`)
- ✓ [DECISION: verbo "Encerrar a sessão do usuário autenticado" (UserMenu 39:11 + SairButton 39:13, tela Painel) — mapear para a capability "Logout" da Fase 02 | não inventariar verbo aqui] — resolved: mapear para "Logout" (Fase 02), citada como capability herdada (user, 2026-09-20)
- ✓ [VALIDATION: capability "Edição de vídeos a partir do painel" sem verbo em nenhuma tela — o painel não tem affordance de edição (design gap) e a navegação é Local-interactive] — resolved: verbo "Exibir informações atuais do vídeo … para edição" (Tela de edição de vídeo) remapeado para essa capability; o gap do link "Editar" no painel foi para Open questions (user, 2026-09-20)
- Consolidação aplicada: `see screen:` em SiteNavbar/BrandLogo/StreamtubeIcon/Avatar/Badge/Pagination (Página pública → Painel) e FormLabel/Textarea (Edição de canal → Edição de vídeo). Classificação de Pagination alinhada para Local-interactive nas duas telas (navegação por URL, TD-06; a busca do recorte é do componente que renderiza a lista) e SiteNavbar como Presentational nas duas (o botão "Entrar" é linha própria, Local-interactive). O verbo "Navegar entre as páginas" do Painel foi absorvido no verbo de VideoTable.
- Pós-validação (2026-09-20): a pedido do usuário, o Figma do Painel (39:2) recebeu o botão "Editar" por linha (62:42, 62:44, 62:46) com colunas redistribuídas; o inventário foi atualizado manualmente (linha EditVideoButton, Observations, Reconciliation, Open questions), sem novo extract do Figma. `Status: Validated` mantido.
- Rotas herdadas do Figma (barra de URL): edição de vídeo `/videos/{publicId}/edit` (TD-09 Option A, rota dedicada), edição do canal `/channel/settings`; página pública `/@{nickname}` (TD-08).
- Token drift (advisory, não bloqueante): o arquivo Figma `Videos` não tem Figma Variables (`get_variable_defs` em 39:2 retornou `{}`), então não há tokens para comparar com `globals.css`; as cores foram aplicadas como hex direto, alinhadas manualmente aos tokens de `globals.css`. Usuário orientou prosseguir. Não rodar `figma-audit-tokens` (pressupõe variáveis).
