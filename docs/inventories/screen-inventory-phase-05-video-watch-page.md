# phase-05-video-watch-page — Screen Inventory

> **Phase:** 05 — Página de Visualização do Vídeo
> **Status:** Validated
> **Date:** 2026-09-23
> **Screens in scope:** 2

> **Proveniência desta extração — leia antes de confiar nas tabelas.** As duas telas **não** foram extraídas por `get_design_context`: a cota de chamadas do MCP do Figma (plano Starter) esgotou, e os dois sub-agentes despachados retornaram bloqueados, corretamente sem inventar nada. As tabelas abaixo foram montadas a partir de uma fonte diferente e verificável: **os dois frames foram criados nesta mesma sessão pelo script `use_figma` do agente**, cuja árvore de nós é conhecida por construção, e ambos foram conferidos em screenshot renderizado. O que falta é a confirmação independente. Consequências práticas: (a) os **node-ids dos filhos não estão registrados** — só os dos dois frames raiz, que o Figma devolveu —, porque atribuí-los de memória produziria referências erradas; (b) o `Status` foi marcado `Validated` em 2026-09-24 por decisão do usuário, porque os **sete campos load-bearing do Output Contract estão presentes e válidos** — rota, URL com `node-id`, `Type` sem célula vazia, `Reuse?` nas três formas canônicas, tabela de verbos, `### Observations` e `## Open questions`. Os node-ids dos filhos não são campo do contrato, e o `/implement` consome a URL da tela, que existe. A re-extração segue registrada como open question. Nenhum componente aqui é suposição: todos existem no frame porque foram escritos nele.

---

## Screen: Página de visualização do vídeo

**Route:** `/videos/{publicId}`
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=66-42 (node `FetKyb1V02WS5D6VCatK6t:66:42`)
**Purpose (from project-plan.md):** "Layout da página: vídeo principal + informações + sidebar com sugestões".

### Component inventory

| Component (Figma node) | Type | In DS? | Reuse? | Notes |
|---|---|---|---|---|
| VideoWatchPage (frame `66:42`) | Server-connected | ✗ | `app/videos/[publicId]/page.tsx (new)` | Server Component dono da busca do detalhe do vídeo e da URL pré-assinada (TD-02). É quem decide entre renderizar a tela e cair no not-found |
| top-decorative-strip | Presentational | ✗ | new | Faixa tracejada de 32px, clonada da `pagina-publica-canal`. Puro DOM |
| SiteNavbar (`navbar`) | Presentational | ✓ | `components/layout/site-navbar.tsx` | Herdado da fase 04 (source: phase-04). Aqui na **variante anônima** — mostra "Entrar", não o UserMenu, porque a página é pública |
| BrandLogo | Presentational | ✓ | `components/auth/brand-logo.tsx` | Herdado da fase 04; sub-parte da navbar |
| StreamtubeIcon | Presentational | ✓ | `components/icons/streamtube-icon.tsx` | Herdado da fase 04; glifo dentro do BrandLogo |
| EntrarButton | Local-interactive | ✓ | `components/ui/button.tsx` | Herdado da fase 04. Navegação client-side (`<Link>`) para `/login`; não dispara mutation |
| main-dashed-container | Presentational | ✗ | new | Container tracejado, padding 48, gap 24; puro DOM de layout |
| watch-column | Presentational | ✗ | new | Coluna esquerda (FILL, 747); puro DOM de layout |
| VideoPlayer (`video-player`) | Server-connected | ✗ | `components/videos/video-player.tsx (new)` | `<video controls>` nativo (TD-01) com `src` na URL pré-assinada (TD-02). É também o dono do disparo da contagem de visualização após 5 s de reprodução efetiva (TD-03), o que exige `"use client"` |
| Controles nativos (`player-controls`, `progress-track`, `progress-played`, `play-affordance`, `play-glyph`, `volume-icon`, `time-text`) | Presentational | ✗ | new | **Não são componentes a autorar.** Por TD-01 os controles são os do navegador; esses nós existem no Figma apenas para comunicar a área do player e ficam fora do DOM da implementação |
| video-heading | Presentational | ✗ | new | Bloco de título + metadados; puro DOM |
| video-title | Presentational | ✗ | new | `<h1>` 22 Extra Bold |
| video-meta | Presentational | ✗ | new | Linha "1.284 visualizações · 28 jul 2026". A contagem vem do `views_count` desnormalizado (TD-05 da fase 04), agora com incremento (TD-03) |
| channel-row | Presentational | ✗ | new | Faixa com bordas top/bottom; puro DOM de layout |
| Avatar | Presentational | ✓ | `components/ui/avatar.tsx` | Herdado da fase 04. Sem upload de avatar nesta fase (OQ-21 da fase 04): renderiza iniciais |
| ChannelLink (`channel-name` + `channel-nickname`) | Presentational | ✗ | new | Nome do canal e `@nickname`; `<Link>` para `/@{nickname}` (TD-08 da fase 04, rota já implementada). Sem I/O próprio |
| DownloadButton | Local-interactive | ✓ | `components/ui/button.tsx` | Herdado da fase 04; clonado do `sair-button` no Figma. Rótulo "Baixar vídeo". Renderiza como `<a download>` sobre a URL de download que já veio com a página (TD-02, clarification) — sem I/O próprio |
| VideoDescription (`description-collapsed`) | Local-interactive | ✗ | `components/videos/video-description.tsx (new)` | Expansão/recolhimento é estado puramente de cliente — sem o backend o componente continua funcionando sobre o texto já carregado |
| description-text | Presentational | ✗ | new | Texto truncado; sub-parte de VideoDescription |
| description-toggle | Local-interactive | ✗ | new | "Mostrar mais" + chevron; sub-parte de VideoDescription |
| ChevronDownIcon | Presentational | ✓ | `components/icons/chevron-down-icon.tsx` | Herdado da fase 04 |
| suggestions-sidebar | Presentational | ✗ | new | Coluna direita FIXED 233; puro DOM de layout |
| sidebar-heading | Presentational | ✗ | new | "MAIS EM EDUCAÇÃO" — o rótulo carrega a categoria do vídeo atual |
| VideoCard (componente `59:88`; 4 instâncias na sidebar) | Server-connected | ✓ | `components/videos/video-card.tsx` | Herdado da fase 04 (source: phase-04), promovido de `(new)` para `✓` — o arquivo já existe em disco. Exibe dados de vídeo vindos do backend |

### Verbs of intent

| Verb | Component | Capability (project-plan.md) |
|---|---|---|
| Exibir o vídeo publicado e seus dados a qualquer visitante, sem exigir autenticação | VideoWatchPage (`66:42`) | "Acesso anônimo à visualização de vídeos" |
| Compor a página com o vídeo principal, suas informações e a sidebar de sugestões | VideoWatchPage (`66:42`) | "Layout da página: vídeo principal + informações + sidebar com sugestões" |
| Servir um vídeo `unlisted` quando acessado pelo link direto, mantendo-o fora das listagens | VideoWatchPage (`66:42`) | "Vídeos unlisted acessíveis apenas via link direto (sem aparecer em listagens)" |
| Reproduzir o arquivo do vídeo a partir da URL pré-assinada | VideoPlayer | "Player de vídeo com controles: play/pause, volume e barra de progresso" |
| Registrar uma visualização após 5 s de reprodução efetiva | VideoPlayer | "Contagem de visualizações" |
| Exibir sugestões de vídeos da mesma categoria, excluindo o vídeo atual, rascunhos e `unlisted` | VideoCard na suggestions-sidebar | "Sugestões de vídeos da mesma categoria na sidebar" |
| Emitir a URL pré-assinada de download do arquivo, assinada para forçar o salvamento com o nome correto | VideoWatchPage (`66:42`) | "Botão de download do vídeo" |

### Observations

- **Extração não confirmada.** Ver a nota de proveniência no topo do arquivo. Os node-ids dos filhos estão ausentes de propósito.
- **Lacuna de design — descrição expandida.** O frame só desenha o estado recolhido. A capability "Descrição do vídeo com expansão/recolhimento" pressupõe os dois estados, e o expandido não tem desenho: falta definir se a caixa cresce empurrando a sidebar, se ganha scroll próprio, e qual é o rótulo do estado aberto ("Mostrar menos").
- **Lacuna de design — sidebar vazia.** Não há desenho para um vídeo cuja categoria não tem outros publicados. Por TD-04 a consulta exclui o vídeo atual, rascunhos e `unlisted`, o que torna o resultado vazio perfeitamente alcançável — não é caso de borda raro.
- **Lacuna de design — loading e erro.** Não há skeleton do player nem estado de falha ao carregar o detalhe do vídeo ou as sugestões. Mesma omissão que a fase 04 teve e que virou OQ.
- **TD-01 e os controles desenhados.** Os sete nós de controle listados na tabela são ilustrativos. Implementá-los contrariaria a decisão: `<video controls>` entrega play/pause, volume e progresso pelo navegador, e a aparência varia entre Chrome, Firefox e Safari. A parity visual com o Figma **não** se aplica a essa faixa.
- **TD-02 emite duas URLs (resolvido em 2026-09-24).** A ambiguidade do DownloadButton foi fechada no próprio TD-02: a resposta de detalhe do vídeo traz **duas** URLs pré-assinadas de 6 h — uma de stream para o `src` do `<video>` e uma de download assinada com `response-content-disposition: attachment`. O motivo é que o atributo `download` do HTML é ignorado em cross-origin, e o arquivo vem do storage, que é outra origem. Por isso o botão é Local-interactive e o verbo de emissão pertence ao VideoWatchPage.
- **TD-03 força `"use client"` no player.** O disparo da contagem depende do evento `timeupdate` do elemento, então o VideoPlayer não pode ser Server Component — é a única fronteira de cliente obrigatória desta tela.
- **Drift de marca persiste.** O wordmark no Figma continua "EstúdioCriador", diferente da marca implementada em `components/auth/brand-logo.tsx`. Mesma observação registrada na fase 04; reusar o componente do DS.
- **Sem tokens do Figma.** O arquivo não tem Variables nem text styles (`localVariableCollections: 0`, verificado nesta sessão), então a detecção de drift de tokens foi dispensada por ausência de objeto de comparação, não por omissão.

---

## Screen: Vídeo não encontrado

**Route:** `/videos/{publicId}` — estado not-found da rota de visualização (`not-found.tsx`), não uma rota própria
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=68-62 (node `FetKyb1V02WS5D6VCatK6t:68:62`)
**Purpose (from project-plan.md):** estado de erro de "Acesso anônimo à visualização de vídeos" — o que o visitante vê quando o vídeo pedido não pode ser mostrado.

### Component inventory

| Component (Figma node) | Type | In DS? | Reuse? | Notes |
|---|---|---|---|---|
| VideoNotFound (frame `68:62`) | Presentational | ✗ | `app/videos/[publicId]/not-found.tsx (new)` | Renderizado pelo `notFound()` do segmento pai; não faz I/O próprio |
| top-decorative-strip | Presentational | ✗ | new | see screen: Página de visualização do vídeo |
| SiteNavbar (`navbar`) | Presentational | ✓ | `components/layout/site-navbar.tsx` | see screen: Página de visualização do vídeo — mesma variante anônima |
| BrandLogo | Presentational | ✓ | `components/auth/brand-logo.tsx` | see screen: Página de visualização do vídeo |
| StreamtubeIcon | Presentational | ✓ | `components/icons/streamtube-icon.tsx` | see screen: Página de visualização do vídeo |
| EntrarButton | Local-interactive | ✓ | `components/ui/button.tsx` | see screen: Página de visualização do vídeo |
| main-dashed-container | Presentational | ✗ | new | Variante centralizada: padding 96 no eixo vertical, conteúdo centrado nos dois eixos |
| not-found-card | Presentational | ✗ | new | Card branco 520, radius 16. Candidato a `components/ui/card.tsx`, que já existe em disco — ver Observations |
| not-found-badge | Presentational | ✗ | new | Círculo 64 em `#e2e8f0` |
| VideoOffIcon (`video-off-icon`) | Presentational | ✗ | `components/icons/video-off-icon.tsx (new)` | Glifo de câmera cortada, 28px. Não existe em `components/icons/` |
| not-found-heading | Presentational | ✗ | new | `<h1>` "VÍDEO NÃO ENCONTRADO" |
| not-found-body | Presentational | ✗ | new | Texto de apoio — o conteúdo é load-bearing, ver Observations |
| BackHomeButton (`back-home-button`) | Local-interactive | ✓ | `components/ui/button.tsx` | "Voltar para o início"; `<Link>` para `/`. Sem mutation |

### Verbs of intent

| Verb | Component | Capability (project-plan.md) |
|---|---|---|
| _No server-connected components in this screen._ | — | — |

### Observations

- **Extração não confirmada.** Ver a nota de proveniência no topo do arquivo.
- **Por que a tabela de verbos está vazia.** A decisão que leva o visitante até aqui é tomada pelo segmento de rota pai, não por um componente desta tela. Nenhum elemento aqui lê ou escreve no backend, então não há verbo a registrar — e inventar um para preencher a tabela criaria um contrato falso no `plan-build`.
- **O texto do corpo é uma regra de segurança, não copy.** Por `video-channel-management/TD-09`, o 404 (vídeo inexistente) e o 403 (rascunho de outro canal) precisam ser indistinguíveis: um erro específico revelaria que o vídeo existe em outro canal. O texto desenhado cobre as três causas — não existe, foi removido, ainda não publicado — sem dizer qual se aplica. **Não criar variante por causa**, e não trocar o texto por "vídeo não existe".
- **Reuso do Card a confirmar.** O `not-found-card` tem a forma de um card do DS e `components/ui/card.tsx` já existe, mas o desenho não foi feito a partir dele. Confirmar se vira instância do primitivo ou markup próprio; se for o primitivo, a linha passa a `✓` com o path.
- **Ícone novo.** `VideoOffIcon` é o único ícone desta fase que não existe em `components/icons/`. O projeto não usa biblioteca de ícones — o SVG vira componente ali, conforme a regra do `next-frontend/CLAUDE.md`.

---

## Reconciliation summary

| Capability (project-plan.md) | Covered by | Screens |
|---|---|---|
| "Player de vídeo com controles: play/pause, volume e barra de progresso" | VideoPlayer | /videos/{publicId} |
| "Layout da página: vídeo principal + informações + sidebar com sugestões" | VideoWatchPage | /videos/{publicId} |
| "Descrição do vídeo com expansão/recolhimento" | VideoDescription — **sem verbo**, ver Open questions | /videos/{publicId} |
| "Contagem de visualizações" | VideoPlayer (disparo) + video-meta (exibição) | /videos/{publicId} |
| "Sugestões de vídeos da mesma categoria na sidebar" | VideoCard na suggestions-sidebar | /videos/{publicId} |
| "Acesso anônimo à visualização de vídeos" | VideoWatchPage; SiteNavbar na variante anônima; VideoNotFound no caminho de erro | /videos/{publicId} |
| "Botão de download do vídeo" | VideoWatchPage (emite a URL) + DownloadButton (aciona) | /videos/{publicId} |
| "Vídeos unlisted acessíveis apenas via link direto (sem aparecer em listagens)" | VideoWatchPage | /videos/{publicId} |

## Open questions

- **Re-extração pendente.** Confirmar as duas tabelas contra `get_design_context` quando a cota do MCP do Figma voltar, e preencher os node-ids dos filhos. O `Status` foi marcado `Validated` porque os sete campos do Output Contract estão presentes e válidos — os node-ids dos filhos não são campo do contrato —, mas a confirmação independente segue devendo.
- **Capability coberta sem verbo.** "Descrição do vídeo com expansão/recolhimento" é atendida por um componente Local-interactive, então não gera verbo de intenção. A regra de validação deste skill espera que toda capability tenha ao menos um verbo — aqui a ausência é correta, não uma lacuna. O `plan-validate` precisa aceitar cobertura por componente local, ou a regra precisa ser afrouxada.
- **Estados sem desenho.** Descrição expandida, sidebar vazia, loading do player e erro de carregamento. Os dois primeiros são exigidos por capability e por TD-04; os dois últimos repetem a omissão da fase 04.
- **Reuso do `components/ui/card.tsx`** no `not-found-card` — instância do primitivo ou markup próprio?
- **Rótulo da categoria na sidebar.** O heading desenhado é "MAIS EM EDUCAÇÃO", com a categoria interpolada. Confirmar o texto para as oito categorias do TD-10 da fase 04 e o que aparece quando a categoria é "Outros".
