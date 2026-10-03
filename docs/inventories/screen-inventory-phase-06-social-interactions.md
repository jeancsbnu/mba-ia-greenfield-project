# phase-06-social-interactions — Screen Inventory

> **Phase:** Fase 06 — Interações Sociais (Likes, Comentários, Inscrições)
> **Status:** Validated
> **Date:** 2026-10-03
> **Screens in scope:** 3
> **Figma source:** cache `docs/figma-cache/FetKyb1V02WS5D6VCatK6t/` (harvested 2026-10-01 / 2026-10-03), 0 MCP calls

---

## Screen: Página de visualização do vídeo — interações sociais

**Route:** `/videos/{publicId}` — variante autenticada da rota entregue na Fase 05
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=77-64 (node `FetKyb1V02WS5D6VCatK6t:77:64`)
**Purpose (from project-plan.md):** "Interface completa de comentários, likes e inscrições"

### Component inventory

| Component (Figma node) | Type | In DS? | Reuse? | Notes |
|---|---|---|---|---|
| VideoWatchPage (77:64) | Server-connected | ✓ | `app/videos/[publicId]/page.tsx` | see screen: Página de visualização do vídeo (phase-05). Mesma rota, estado autenticado; por anonymous-gate/TD-02 o payload é um só, com os campos pessoais (meu like, meu dislike, minha inscrição) preenchidos quando há Bearer válido |
| top-decorative-strip (77:65) | Presentational | ✗ | new | see screen: Página de visualização do vídeo (phase-05) |
| SiteNavbar (77:66) | Presentational | ✓ | `components/layout/site-navbar.tsx` | see screen: Página de visualização do vídeo (phase-05). Nesta frame é a variante **autenticada** (avatar + "Sair"), não a anônima |
| BrandLogo (77:67) | Presentational | ✓ | `components/auth/brand-logo.tsx` | see screen: Página de visualização do vídeo (phase-05) |
| StreamtubeIcon (77:69, `play-icon`) | Presentational | ✓ | `components/icons/streamtube-icon.tsx` | see screen: Página de visualização do vídeo (phase-05). Glyph dentro de BrandLogo/logo-box (77:68) — linha própria por regra de granularidade |
| UserMenu (77:73) | Presentational | ✓ | `components/layout/user-menu.tsx` | see screen: Página de visualização do vídeo (phase-05). Avatar (78:82) + botão "Sair" (77:74) |
| Avatar (78:82) | Presentational | ✓ | `components/ui/avatar.tsx` | see screen: Página de visualização do vídeo (phase-05). Iniciais "JC" (78:83) são conteúdo do próprio Avatar |
| main-dashed-container (77:76) | Presentational | ✗ | new | see screen: Página de visualização do vídeo (phase-05) |
| watch-column (77:77) | Presentational | ✗ | new | see screen: Página de visualização do vídeo (phase-05) |
| VideoPlayer (77:78) | Server-connected | ✓ | `components/videos/video-player.tsx` | see screen: Página de visualização do vídeo (phase-05) |
| player-controls (77:79) | Presentational | ✗ | new | see screen: Página de visualização do vídeo (phase-05). Por video-watch-page/TD-01 o browser fornece os controles; o nó existe só para comunicar a área do player — não vira arquivo |
| play-icon (77:80) | Presentational | ✗ | new | see screen: Página de visualização do vídeo (phase-05). Glyph dentro de player-controls; **não será implementado** — controle nativo do `<video>` por video-watch-page/TD-01. Linha emitida para que "decidimos não construir" não se pareça com "esquecemos" |
| progress-track (77:82) | Presentational | ✗ | new | see screen: Página de visualização do vídeo (phase-05). Controle nativo, não implementado |
| progress-played (77:83) | Presentational | ✗ | new | see screen: Página de visualização do vídeo (phase-05). Controle nativo, não implementado |
| volume-icon (77:84) | Presentational | ✗ | new | see screen: Página de visualização do vídeo (phase-05). Glyph dentro de player-controls; **não será implementado** — controle nativo por video-watch-page/TD-01 |
| time-text (77:87) | Presentational | ✗ | new | see screen: Página de visualização do vídeo (phase-05). Controle nativo, não implementado |
| play-affordance (77:88) | Presentational | ✗ | new | see screen: Página de visualização do vídeo (phase-05). Controle nativo, não implementado |
| play-glyph (77:89) | Presentational | ✗ | new | see screen: Página de visualização do vídeo (phase-05). Glyph do overlay central; controle nativo, não implementado |
| video-heading (77:91) | Presentational | ✗ | new | see screen: Página de visualização do vídeo (phase-05) |
| video-title (77:92) | Presentational | ✗ | new | see screen: Página de visualização do vídeo (phase-05) |
| video-meta (77:93) | Presentational | ✗ | new | see screen: Página de visualização do vídeo (phase-05) |
| channel-row (77:94) | Presentational | ✗ | new | see screen: Página de visualização do vídeo (phase-05). Na Fase 06 passa a hospedar subscribe-button, like-button e dislike-button além do download |
| channel-identity (77:95) | Presentational | ✗ | new | Frame de layout que agrupa avatar + textos do canal; na Fase 05 o agrupamento equivalente não tinha nó próprio |
| channel-avatar (77:96) | Presentational | ✓ | `components/ui/avatar.tsx` | ELLIPSE placeholder do avatar do canal; reusa o Avatar do DS |
| ChannelLink (77:97, `channel-text` → channel-name 77:98 + channel-nickname 77:99) | Presentational | ✗ | new | see screen: Página de visualização do vídeo (phase-05). Na Fase 06 o mesmo bloco ganha a terceira linha `subscribers-count` (77:118) |
| subscribers-count (77:118) | Presentational | ✗ | `components/channels/subscriber-count.tsx (new)` | **Novo na Fase 06.** Renderiza `subscribers_count` (social-interactions/TD-06, desnormalizado em `channels`) vindo do mesmo payload da página (anonymous-gate/TD-02) — não faz I/O próprio. Precisa receber a contagem otimista do SubscribeButton (social-interactions/TD-08) para que "1,2 mil inscritos" acompanhe o clique; por isso ganha arquivo próprio em vez de `<p>` solto, e o mesmo arquivo serve a página de canal. Ver Observations sobre o encaixe de capability |
| SubscribeButton (77:119) | Server-connected | ✗ | `components/channels/subscribe-button.tsx (new)` | **Novo na Fase 06.** Label "Inscrever-se" (77:120) é conteúdo do próprio botão. `"use client"` por social-interactions/TD-08 (`useOptimistic`). Estado inicial (inscrito ou não) chega no payload da página por anonymous-gate/TD-02; o componente não busca o próprio estado, só muta. Esta frame é o estado autenticado (anonymous-gate/TD-01) |
| DownloadButton (77:100) | Local-interactive | ✓ | `components/ui/button.tsx` | see screen: Página de visualização do vídeo (phase-05) |
| DownloadIcon (77:101, `download-icon`) | Presentational | ✓ | `components/icons/download-icon.tsx` | see screen: Página de visualização do vídeo (phase-05). Glyph dentro de DownloadButton — linha própria (foi exatamente esta a linha perdida na Fase 05) |
| LikeButton (77:121) | Server-connected | ✗ | `components/videos/like-button.tsx (new)` | **Novo na Fase 06.** Label "Gostei · 128" (77:122): o controle carrega a contagem de likes. `"use client"` por social-interactions/TD-08; estado pessoal do like vem do payload da página (anonymous-gate/TD-02) |
| DislikeButton (77:123) | Server-connected | ✗ | `components/videos/dislike-button.tsx (new)` | **Novo na Fase 06.** Label "Não gostei" (77:124) **sem número** — a ausência da contagem é a decisão social-interactions/TD-03 (API não expõe contagem de dislikes, só o estado do próprio usuário), não uma omissão do desenho |
| VideoDescription (77:104, `description-collapsed`) | Local-interactive | ✓ | `components/videos/video-description.tsx` | see screen: Página de visualização do vídeo (phase-05) |
| description-text (77:105) | Presentational | ✗ | new | see screen: Página de visualização do vídeo (phase-05) |
| description-toggle (77:106) | Local-interactive | ✗ | new | see screen: Página de visualização do vídeo (phase-05). Label "Mostrar mais" (77:107) é conteúdo próprio |
| ChevronDownIcon (77:108, `chevron-down`) | Presentational | ✓ | `components/icons/chevron-down-icon.tsx` | see screen: Página de visualização do vídeo (phase-05). Glyph dentro de description-toggle |
| CommentsSection (77:125) | Server-connected | ✗ | `components/comments/comments-section.tsx (new)` | **Novo na Fase 06.** Dono da lista de comentários e da paginação: 10 raízes por página, mais recentes primeiro, até 3 respostas pré-carregadas por raiz (social-interactions/TD-05). A primeira página chega no payload da página (anonymous-gate/TD-02); as seguintes são buscadas por este componente |
| comments-heading (77:126) | Presentational | ✗ | new | Faixa com contagem + rótulo de ordenação |
| comments-count (77:127) | Presentational | ✗ | new | "12 comentários" — número vem do payload |
| comments-sort (77:128) | Presentational | ✗ | new | "Mais recentes primeiro" é **rótulo estático**, não dropdown: social-interactions/TD-05 fixa a ordenação, e o nó é um TEXT sem afordância de clique na árvore nem no screenshot |
| NewCommentForm (77:129, `new-comment-box`) | Server-connected | ✗ | `components/comments/new-comment-form.tsx (new)` | **Novo na Fase 06.** Formulário = validação local + submissão ao servidor → Server-connected domina. Só renderiza neste estado autenticado nesta frame; para o anônimo o clique leva ao login com `returnTo` (anonymous-gate/TD-01 e TD-03) |
| Avatar (77:130) | Presentational | ✓ | `components/ui/avatar.tsx` | Avatar do usuário logado dentro do NewCommentForm; iniciais "JC" (77:131) são conteúdo do Avatar |
| new-comment-input (77:132, `new-comment-placeholder`) | Local-interactive | ✓ | `components/ui/textarea.tsx` | Campo de rascunho do comentário; o texto no Figma é o placeholder. Estado do rascunho é local — o I/O é do NewCommentForm |
| new-comment-submit (77:133) | Local-interactive | ✓ | `components/ui/button.tsx` | Botão "Comentar" (label 77:134); dispara o submit do NewCommentForm, que é a unidade server-connected |
| comment-list (77:135) | Presentational | ✗ | `components/comments/comment-list.tsx (new)` | Renderiza as threads que recebe da CommentsSection; não busca nada por conta própria |
| CommentThread (77:136, 77:175) | Presentational | ✗ | `components/comments/comment-thread.tsx (new)` | Agrupa uma raiz + sua reply-list. Duas instâncias na frame: a primeira (77:136) com respostas, a segunda (77:175) sem |
| CommentItem (77:137, 77:176 — `comment-root`) | Presentational | ✗ | `components/comments/comment-item.tsx (new)` | **Nó depth-limited (maxDepth 6): filhos não estão no cache; a sub-estrutura abaixo foi lida do screenshot.** Exibe avatar, autor, timestamp e corpo que recebe da seção; todo o I/O vive nos controles de ação, que têm linhas próprias |
| comment-avatar (sem id — depth-limited, lido do screenshot) | Presentational | ✓ | `components/ui/avatar.tsx` | Avatar com iniciais ("MR", "AC") de cada comentarista |
| comment-author-line (sem id — depth-limited, lido do screenshot) | Presentational | ✗ | new | Nome do autor + timestamp relativo ("Maria Rocha · há 2 horas") |
| comment-body (sem id — depth-limited, lido do screenshot) | Presentational | ✗ | new | Texto do comentário |
| comment-actions (sem id — depth-limited, lido do screenshot) | Presentational | ✗ | new | Linha que agrupa "Gostei · N", "Não gostei" e "Responder" |
| CommentLikeButton (sem id — depth-limited, lido do screenshot) | Server-connected | ✗ | `components/comments/comment-like-button.tsx (new)` | **Novo na Fase 06.** "Gostei · 14" / "Gostei · 3" / "Gostei · 0" — carrega a contagem de likes do comentário. `"use client"` por social-interactions/TD-08. Mesmo componente reusado nas respostas |
| CommentDislikeButton (sem id — depth-limited, lido do screenshot) | Server-connected | ✗ | `components/comments/comment-dislike-button.tsx (new)` | **Novo na Fase 06.** "Não gostei" **sem número**, coerente com social-interactions/TD-03 (sem contagem de dislikes na API). Mesmo componente reusado nas respostas |
| ReplyButton (sem id — depth-limited, lido do screenshot) | Local-interactive | ✗ | `components/comments/reply-button.tsx (new)` | **Novo na Fase 06.** Aparece na raiz e em cada resposta. **Resolvido 2026-10-03:** o botão só abre o compositor; quem publica é um `ReplyForm` à parte, irmão do `NewCommentForm` — mesma separação que a tela já usa entre o botão "Comentar" (Local-interactive) e o `NewCommentForm` (Server-connected). O `ReplyForm` **não está desenhado em nenhuma frame**, então não tem linha aqui; ver `## Open questions`. Por social-interactions/TD-04 a profundidade é 1: responder a uma resposta ainda cria um filho da mesma raiz |
| ReplyList (77:149, `reply-list`) | Presentational | ✗ | `components/comments/reply-list.tsx (new)` | **Nó depth-limited (maxDepth 6): filhos não estão no cache; a sub-estrutura abaixo foi lida do screenshot.** Mostra até 3 respostas pré-carregadas por raiz (social-interactions/TD-05) |
| CommentReply (sem id — depth-limited, lido do screenshot) | Presentational | ✗ | `components/comments/comment-reply.tsx (new)` | Item de resposta recuado (avatar, autor, timestamp, corpo e a mesma linha de ações). Duas instâncias visíveis na thread de 77:136 |
| RepliesLoadMore (sem id — depth-limited, lido do screenshot) | Server-connected | ✗ | `components/comments/replies-load-more.tsx (new)` | **Novo na Fase 06.** "Ver mais 4 respostas" dentro da thread — é o "ver mais" que social-interactions/TD-05 coloca acima das 3 respostas pré-carregadas |
| CommentsLoadMore (77:188, `comments-load-more`) | Server-connected | ✗ | `components/comments/comments-load-more.tsx (new)` | **Novo na Fase 06.** "Carregar mais comentários" (label 77:189) — próxima página de 10 comentários-raiz (social-interactions/TD-05) |
| suggestions-sidebar (77:110) | Presentational | ✗ | new | see screen: Página de visualização do vídeo (phase-05) |
| sidebar-heading (77:111) | Presentational | ✗ | new | see screen: Página de visualização do vídeo (phase-05) |
| VideoCard (77:112, 77:113, 77:114, 77:115) | Server-connected | ✓ | `components/videos/video-card.tsx` | see screen: Página de visualização do vídeo (phase-05). Quatro INSTANCEs do mesmo componente |
| SidebarLoadMore (77:116) | Server-connected | ✓ | `components/videos/sidebar-load-more.tsx` | see screen: Página de visualização do vídeo (phase-05) |
| load-more-label (77:117) | Presentational | ✗ | new | see screen: Página de visualização do vídeo (phase-05) |

### Verbs of intent

| Verb | Component | Capability (project-plan.md) |
|---|---|---|
| Inscrever-se no canal do vídeo e cancelar a inscrição a partir da própria página de assistir | SubscribeButton | "Inscrição em canais (seguir/deixar de seguir)" |
| Registrar ou retirar o like do usuário no vídeo, exibindo a contagem resultante | LikeButton | "Like e dislike em vídeos (usuários autenticados)" |
| Registrar ou retirar o dislike do usuário no vídeo, sem exibir contagem | DislikeButton | "Like e dislike em vídeos (usuários autenticados)" |
| Exibir os comentários do vídeo com as respostas pré-carregadas, dos mais recentes para os mais antigos | CommentsSection | "Interface completa de comentários, likes e inscrições" |
| Carregar a próxima página de comentários-raiz | CommentsLoadMore | "Interface completa de comentários, likes e inscrições" |
| Publicar um novo comentário no vídeo | NewCommentForm | "Comentários em vídeos (usuários autenticados)" |
| Carregar as respostas restantes de uma thread, além das pré-carregadas | RepliesLoadMore | "Respostas a comentários (comentários aninhados)" |
| Registrar ou retirar o like do usuário em um comentário ou resposta | CommentLikeButton | "Like e dislike em comentários (usuários autenticados)" |
| Registrar ou retirar o dislike do usuário em um comentário ou resposta | CommentDislikeButton | "Like e dislike em comentários (usuários autenticados)" |

### Observations

- **Provenance.** Classificação feita sobre o cache committado `docs/figma-cache/FetKyb1V02WS5D6VCatK6t/77-64.json` (`_envelope.fetched_at` 2026-10-01, `maxDepth` 6) e sobre `77-64.png`. Nenhuma chamada ao MCP do Figma foi feita.
- **Nós depth-limited.** `comment-root` (`77:137` e `77:176`) e `reply-list` (`77:149`) aparecem **sem filhos** na colheita porque batem no `maxDepth` 6 — o próprio `_envelope.note` registra isso. Os filhos existem no arquivo. Toda a sub-estrutura de comentário listada acima sem node id (`comment-avatar`, `comment-author-line`, `comment-body`, `comment-actions`, `CommentLikeButton`, `CommentDislikeButton`, `ReplyButton`, `CommentReply`, `RepliesLoadMore`) foi **lida do screenshot**, não da árvore. Se o pipeline precisar dos ids reais desses nós, é uma colheita com `maxDepth` maior — uma chamada, cobrindo `77:137`, `77:149` e `77:176` de uma vez.
- **Herança da Fase 05.** As linhas marcadas `see screen: Página de visualização do vídeo (phase-05)` repetem a frame `66:42` (variante anônima da mesma rota) e herdam classificação verbatim. Os verbos dos componentes server-connected herdados (VideoWatchPage, VideoPlayer, VideoCard, SidebarLoadMore) estão no inventário da Fase 05 e **não** foram remapeados aqui: nenhuma capability da Fase 06 os descreve, e remapeá-los vazaria verbos entre fatias.
- **Estado autenticado.** Esta frame é o estado acionável: navbar com avatar + "Sair", caixa de novo comentário renderizada e controles de reação ativos. Por anonymous-gate/TD-01 os mesmos controles também renderizam para o anônimo (frame `66:42`), onde o clique leva a `/login` com `returnTo` (anonymous-gate/TD-03). O desenho da Fase 06 **não** traz a variante anônima dos novos controles — ela terá de ser derivada por argumento, não observada.
- **Dislike sem número é desenho, não lacuna.** `dislike-button-label` (77:124) diz só "Não gostei" e as ações de comentário no screenshot mostram "Não gostei" sem contador, enquanto o like mostra "Gostei · N". Isso é social-interactions/TD-03 (decidido A: a API expõe só o estado do próprio usuário no dislike). Quem implementar não deve "consertar" acrescentando contagem.
- **`subscribers-count` não encaixa em capability desta tela.** A única bullet que fala em contagem de inscritos é "Contagem de inscritos na página do canal" — que nomeia a **página do canal**, não a de assistir. Aqui o número é exibição derivada do payload da página, por isso a linha ficou Presentational e **sem verbo**. Se o escopo pretendia que a contagem na watch page também fosse coberta, a bullet precisa ser ampliada ou o inventário da página de canal precisa reusar o mesmo componente. Questão para `plan-validate`.
- **Não há desenho para o compositor de resposta.** O controle "Responder" existe nas raízes e nas respostas, mas nenhuma frame da Fase 06 desenha o estado com o campo de resposta aberto. Decidido em 2026-10-03 que o `ReplyButton` é **Local-interactive** — só abre o compositor — e que quem publica é um `ReplyForm` à parte, irmão do `NewCommentForm`. Como esse `ReplyForm` não existe em nenhuma frame, ele **não tem linha neste inventário**: inventar um componente ausente do desenho é exatamente o que esta skill proíbe. Consequência direta: a capability "Respostas a comentários (comentários aninhados)" está coberta aqui **apenas pelo lado de leitura** (RepliesLoadMore); o verbo de *publicar* uma resposta não tem componente observado. É lacuna de design, e está em `## Open questions`.
- **Nenhum outro estado de comentário foi desenhado:** lista vazia (zero comentários), erro de envio, comentário sendo enviado (pendente do `useOptimistic` de social-interactions/TD-08) e o estado "inscrito" do SubscribeButton (o botão só aparece como "Inscrever-se", nunca como "Inscrito"). Quatro estados que a implementação vai precisar inventar se não forem desenhados antes.
- **Fronteira de cliente.** Por social-interactions/TD-08 (`useOptimistic` do React 19), SubscribeButton, LikeButton, DislikeButton, CommentLikeButton, CommentDislikeButton e NewCommentForm são obrigatoriamente `"use client"`. `subscribers-count` e o rótulo de contagem do like só mudam junto se estiverem dentro dessa fronteira — não podem ser renderizados como texto estático do RSC pai.
- **`comments-sort` é rótulo, não controle.** O nó 77:128 é TEXT e social-interactions/TD-05 fixa "mais recentes primeiro"; qualquer leitura como dropdown de ordenação seria invenção. Se a ordenação virar escolha do usuário, é mudança de TD, não de inventário.
- **Profundidade 1 (social-interactions/TD-04).** O desenho é consistente com ela: `comment-thread` tem exatamente uma `reply-list`, e as respostas no screenshot não têm respostas aninhadas sob si — mas todas exibem "Responder", o que significa que responder a uma resposta precisa criar um irmão na mesma lista, não um neto. Vale como nota de interação para o UI Contract.
- **Granularidade de ícones.** Os quatro nós que casam com o padrão de ícone na árvore têm linha própria: `77:69` (StreamtubeIcon, implementado), `77:80` e `77:84` (glyphs de controle do player, **não** implementados por video-watch-page/TD-01) e `77:101` (DownloadIcon, implementado). As seções novas da Fase 06 não introduzem nenhum glyph — todos os controles sociais são textuais no desenho.

---

## Screen: Área de canais seguidos

**Route:** `/channel/subscriptions`
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=75-62 (node `FetKyb1V02WS5D6VCatK6t:75:62`)
**Purpose (from project-plan.md):** "Área de canais seguidos com acesso rápido aos vídeos"

### Component inventory

| Component (Figma node) | Type | In DS? | Reuse? | Notes |
|---|---|---|---|---|
| top-decorative-strip (75:63) | Presentational | ✗ | new | faixa decorativa no topo do frame; herdado da Fase 05 |
| SiteNavbar (navbar, 75:64) | Presentational | ✓ | `components/layout/site-navbar.tsx` | see screen: Página de visualização do vídeo — interações sociais. Variante **autenticada** (avatar + "Sair"); o defeito registrado em `resolved_defects` — navbar clonada do estado anônimo exibindo "Entrar" — já foi corrigido no Figma |
| BrandLogo (brand-logo, 75:65) | Presentational | ✓ | `components/auth/brand-logo.tsx` | see screen: Página de visualização do vídeo — interações sociais. Dentro da SiteNavbar; `logo-box` (75:66) e o texto `EstúdioCriador` (75:70) são markup interno do próprio componente, sem linha própria |
| StreamtubeIcon (play-icon, 75:67) | Presentational | ✓ | `components/icons/streamtube-icon.tsx` | see screen: Página de visualização do vídeo — interações sociais. Glyph dentro de BrandLogo; `play` (75:68) e `Vector` (75:69) são os vetores internos do ícone |
| nav-link-canais-seguidos (75:74) | Local-interactive | ✗ | new | ponto de entrada de navegação exigido por social-interactions/TD-07; a navbar da Fase 04 hoje não tem link algum. Navegação client-side pura → Local-interactive. **Resolvido 2026-10-03:** `<Link>` do Next.js escrito inline dentro de `components/layout/site-navbar.tsx`, sem arquivo próprio — é o único item de navegação do chrome hoje, e o navbar completo (busca, variante rica) é escopo da Fase 07, que é quando a forma de uma lista de links fica conhecida |
| UserMenu (user-menu, 75:71) | Presentational | ✓ | `components/layout/user-menu.tsx` | see screen: Página de visualização do vídeo — interações sociais. Avatar + botão "Sair"; o texto `sair-label` (75:73) é markup interno do componente, sem linha própria |
| Avatar (avatar, 77:62) | Presentational | ✓ | `components/ui/avatar.tsx` | see screen: Página de visualização do vídeo — interações sociais. Iniciais "JC" dentro do UserMenu |
| main-dashed-container (75:75) | Presentational | ✗ | new | contêiner tracejado que envolve o conteúdo da página; herdado da Fase 05 |
| page-heading (75:76) | Presentational | ✗ | new | `<h1>` "Canais que você segue" + subtítulo "3 canais"; o contador é derivado da lista já carregada, não é uma leitura adicional do servidor |
| channel-list (75:79) | Server-connected | ✗ | `components/channels/subscribed-channel-list.tsx (new)` | lista dos canais que o usuário segue; é uma lista de canais com link para a página pública de cada um, **não** um feed de vídeos (social-interactions/TD-07, opção A) |
| channel-row (75:80, 75:88, 75:96) | Server-connected | ✗ | `components/channels/subscribed-channel-card.tsx (new)` | três instâncias no design. Cada linha renderiza, pela screenshot: avatar de iniciais, nome do canal, "N inscritos · N vídeos" e o botão "Inscrito". O nome é o link para a página pública do canal (navegação client-side, markup da própria linha). A contagem de inscritos vem de `subscribers_count` desnormalizado (social-interactions/TD-06, opção B) |
| Avatar dentro de channel-row (id desconhecido) | Presentational | ✓ | `components/ui/avatar.tsx` | avatar de iniciais ("MR", "DF", "AC") visível na screenshot; id ausente do `known_child_ids` porque o harvest foi parcial |
| SubscriptionToggleButton ("Inscrito", id desconhecido) | Server-connected | ✗ | `components/channels/subscription-button.tsx (new)` | botão "Inscrito" em cada linha; desinscreve ao ser acionado, com feedback via `useOptimistic` do React 19 (social-interactions/TD-08, opção A). Id ausente do `known_child_ids` porque o harvest foi parcial |

### Verbs of intent

| Verb | Component | Capability (project-plan.md) |
|---|---|---|
| Listar os canais que o usuário segue, com acesso rápido à página de cada um | channel-list | "Área de canais seguidos com acesso rápido aos vídeos" |
| Exibir a contagem de inscritos de cada canal seguido | channel-row | "Área de canais seguidos com acesso rápido aos vídeos" |
| Deixar de seguir um canal a partir da lista | SubscriptionToggleButton em channel-row | "Inscrição em canais (seguir/deixar de seguir)" |

### Observations

- **Proveniência: este cache NÃO é um harvest completo.** O `_envelope.provenance` registra que o frame foi criado por um script de autoria em 2026-10-01 e corrigido no mesmo dia; uma colheita de árvore foi pedida na chamada de correção, mas a resposta truncou antes de terminar este nó. Por isso o arquivo carrega um mapa `known_child_ids` (lista parcial, por construção) em vez de uma árvore `children` aninhada. **Uma colheita completa deste nó ainda não foi feita.** Nenhuma chamada ao MCP do Figma foi feita por este sub-agente.
- **Estrutura abaixo dos ids conhecidos veio da screenshot** (`docs/figma-cache/FetKyb1V02WS5D6VCatK6t/75-62.png`), que para esta tela é a fonte primária de estrutura. Duas linhas do inventário — o `Avatar` dentro de `channel-row` e o `SubscriptionToggleButton` ("Inscrito") — são visíveis na screenshot mas **não têm id no `known_child_ids`**; os ids são desconhecidos porque o harvest foi parcial, e não foram inventados. O mesmo vale para o link do nome do canal e para a linha "N inscritos · N vídeos" dentro de cada `channel-row`, descritos nas Notes da linha do pai.
- **Correção da varredura de ícones do pai.** O pai informou a este sub-agente que a varredura por nomes com padrão de ícone neste frame encontrou **zero** ocorrências; o sub-agente apontou que o `known_child_ids` traz `play-icon` (`75:67`) e emitiu a linha mesmo assim. O sub-agente estava certo: o scanner do pai percorre a chave `children`, que este arquivo não tem por ser harvest parcial, e por isso retornou vazio em vez de falhar. Como a lista de ids é parcial, **outros glyphs podem existir no nó sem aparecer nem no mapa nem na screenshot em resolução legível** — uma colheita completa resolveria isso.
- **Rota inexistente:** `/channel/subscriptions` ainda não existe no repositório. As rotas irmãs do grupo autenticado (`/channel/videos`, `/channel/settings`) vivem em `next-frontend/app/(studio)/`, que é onde esta deve nascer.
- **TD-07 (Cross-layer, decidido A)** governa duas coisas nesta tela: a área é uma lista de canais com link para a página pública de cada um (não um feed de vídeos), e o ponto de entrada de navegação `nav-link-canais-seguidos` (`75:74`) é acrescentado ao chrome autenticado da Fase 04 — a `SiteNavbar`/`UserMenu` entregues lá não têm link algum hoje, então a implementação desta tela necessariamente altera `components/layout/site-navbar.tsx`.
- **TD-06 (Backend, decidido B)** é a origem da contagem de inscritos exibida em cada linha (`subscribers_count` desnormalizado em `channels`).
- **TD-08 (Frontend, decidido A)** aplica-se ao botão "Inscrito" de cada linha: o feedback da desinscrição usa `useOptimistic` do React 19.
- **anonymous-gate/TD-01 não se aplica** — esta é área autenticada, atrás de sessão; a navbar mostra avatar + "Sair".
- **Estado vazio não desenhado.** A screenshot mostra apenas o estado povoado (3 canais). Não há no frame nenhum desenho para "o usuário não segue nenhum canal", nem para carregamento ou erro da lista. A implementação precisará de uma decisão de design para o estado vazio.

---

## Screen: Página pública do canal

**Route:** `/@{nickname}`
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=59-2 (node `FetKyb1V02WS5D6VCatK6t:59:2`)
**Purpose (from project-plan.md):** "Contagem de inscritos na página do canal" — tela existente da Fase 04 ("Página pública do canal com informações e listagem de vídeos") que a Fase 06 estende com inscrição e contagem de inscritos.

### Component inventory

| Component (Figma node) | Type | In DS? | Reuse? | Notes |
|---|---|---|---|---|
| SiteNavbar (59:4) | Presentational | ✓ | `components/layout/site-navbar.tsx` | see screen: Página de visualização do vídeo — interações sociais; herdado da Fase 04. Aqui em estado anônimo (BrandLogo + "Entrar"). Navbar completo (busca, variante autenticada) é escopo da Fase 07; ver Observations |
| BrandLogo (59:5) | Presentational | ✓ | `components/auth/brand-logo.tsx` | see screen: Página de visualização do vídeo — interações sociais; herdado da Fase 04. No Figma é um frame comum "brand-logo", não uma instância do DS |
| StreamtubeIcon (59:6, logo-box + play 59:7/59:8) | Presentational | ✓ | `components/icons/streamtube-icon.tsx` | see screen: Página de visualização do vídeo — interações sociais; herdado da Fase 04. Único nó com padrão de ícone neste frame (`play-icon` 59:7); glifo dentro do BrandLogo, mas com arquivo próprio |
| LoginButton "Entrar" (59:13) | Local-interactive | ✓ | `components/ui/button.tsx` | Herdado da Fase 04. Renderizado como Next.js `<Link>` para `/login` com aparência outline. Não dispara mutation. Layer chama-se "sair-button" (herdada de outra tela) |
| ChannelHeader (59:16 nome, 59:85 avatar, 59:86 meta, 59:87 divider, 79:82 botão de inscrição) | Server-connected | ✓ | `components/channels/channel-header.tsx` | Herdado da Fase 04, **estendido na Fase 06**: além de nome/nickname/avatar/total de vídeos, agora também fornece `subscribers_count` (channels, TD-06) e hospeda o `subscribe-button`. Não existe um frame único no Figma: os elementos são irmãos absolutos dentro de `main-dashed-container` |
| Avatar "channel-avatar" (59:85) | Presentational | ✓ | `components/ui/avatar.tsx` | see screen: Página de visualização do vídeo — interações sociais; herdado da Fase 04. Aqui 80×80, sem variante de fallback (iniciais) no Figma |
| Heading "Joana Cria" (59:17) | Presentational | ✗ | new | Herdado da Fase 04. `<h1>` puro-DOM com o nome do canal (32px extra-bold) |
| ChannelMeta "@joana.cria · 1,2 mil inscritos · 42 vídeos" (59:86) | Presentational | ✗ | new | **MUTADO na Fase 06**: era `@joana.cria · 42 vídeos`, agora `@{nickname} · {subscribers_count} inscritos · {total} vídeos`. `<p>` puro-DOM; o número vem da coluna desnormalizada `subscribers_count` (TD-06), recebido por props de ChannelHeader — por isso continua Presentational |
| Divider (59:87) | Presentational | ✗ | new | Herdado da Fase 04. Linha de 1px (`<hr>`/borda) |
| SubscribeButton "Inscrever-se" (79:82, label 79:83) | Server-connected | ✗ | `components/channels/subscribe-button.tsx (new)` | see screen: Página de visualização do vídeo — interações sociais (nó `77:119`): **é o mesmo componente**, um arquivo só servindo as duas telas — um único SI de bootstrap, não dois. **NOVO na Fase 06.** Pill azul 123×37 em `#3f72af`, label branco 14px bold. Alterna inscrever/desinscrever e atualiza `subscribers_count` na mesma transação (TD-06); precisa de `"use client"` para o `useOptimistic` do React 19 (TD-08). No estado anônimo desta tela ele renderiza mesmo assim e o clique leva a `/login?returnTo=…` validado por `safeReturnTo` (anonymous-gate/TD-01 e TD-03). O label 79:83 é camada de texto interna ao botão, não vira arquivo próprio |
| VideoCard (59:88 componente principal; instâncias 59:94, 59:100, 59:106, 59:112, 59:118, 59:124, 59:130, 59:136) | Server-connected | ✓ | `components/videos/video-card.tsx` | see screen: Página de visualização do vídeo — interações sociais; herdado da Fase 04. Classificado uma vez; as 8 instâncias referenciam esta linha. Exibe dados de vídeo vindos do backend |
| Thumbnail (I59:94;59:89) | Presentational | ✗ | new | Herdado da Fase 04. Imagem 233×131, raio 8px, dentro do VideoCard (`next/image`). Idêntica nas 8 instâncias |
| DurationBadge (I59:94;59:90 fundo + I59:94;59:91 texto "8:12") | Presentational | ✓ | `components/ui/badge.tsx` | Herdado da Fase 04. Variante overlay escuro sobre a thumbnail. Fundo e texto são nós irmãos no Figma; implementar como um único elemento |
| VideoTitle (I59:94;59:92) | Presentational | ✗ | new | Herdado da Fase 04. `<p>`/`<h3>` puro-DOM, 15px bold, uma linha com `text-ellipsis` |
| VideoMeta "visualizações · há X" (I59:94;59:93) | Presentational | ✗ | new | Herdado da Fase 04. `<p>` puro-DOM, 12px, com ellipsis |
| Pagination (59:80 wrapper, 59:81 caixa) | Local-interactive | ✓ | `components/ui/pagination.tsx` | Herdado da Fase 04. "Anterior 1 Próxima" alinhada à direita, navega por URL |

### Verbs of intent

| Verb | Component | Capability (project-plan.md) |
|---|---|---|
| Exibir informações públicas do canal (nome, nickname, avatar e total de vídeos) | ChannelHeader (59:16) | — (coberta na Fase 04: "Página pública do canal com informações e listagem de vídeos") |
| Exibir lista paginada de vídeos publicados e públicos do canal | VideoCard (59:88) | — (coberta na Fase 04: "Página pública do canal com informações e listagem de vídeos") |
| Exibir a contagem de inscritos do canal | ChannelHeader (59:16), renderizada dentro de ChannelMeta (59:86) | "Contagem de inscritos na página do canal" |
| Inscrever-se no canal e cancelar a inscrição | SubscribeButton (79:82) | "Inscrição em canais (seguir/deixar de seguir)" |

### Observations

- **Proveniência do tree.** Classificação feita sobre o cache committado `docs/figma-cache/FetKyb1V02WS5D6VCatK6t/59-2.json` (`_envelope.fetched_at` 2026-10-03, `maxDepth` 5), mais o screenshot `59-2.png`. Nenhuma chamada ao MCP do Figma. Nenhum nó do tree traz contagem `truncated`.
- **Herança da Fase 04.** Todas as linhas exceto `SubscribeButton` vêm verbatim da seção `## Screen: Página pública do canal` de `docs/inventories/screen-inventory-phase-04-video-channel-management.md`; as seis que estavam com sufixo `(new)` (site-navbar, channel-header, avatar, video-card, badge, pagination) foram promovidas para `In DS? ✓` por existirem hoje no disco. Nenhuma classificação da Fase 04 foi alterada.
- **O botão de inscrição no estado anônimo é intencional (anonymous-gate/TD-01).** A navbar exibe "Entrar" — a tela está desenhada no estado anônimo de propósito — e o `subscribe-button` (79:82) aparece mesmo assim. Isso é exatamente a decisão de leitura pública com controles de ação renderizados para o anônimo, não um defeito do design. O clique do anônimo navega para `/login` carregando `returnTo` validado por `safeReturnTo` (anonymous-gate/TD-03).
- **Estados do SubscribeButton não desenhados.** O Figma traz só o estado "Inscrever-se" (não inscrito). Faltam a variante "Inscrito"/"Cancelar inscrição", hover, foco, desabilitado e o estado intermediário do `useOptimistic` (TD-08), além do tratamento de erro quando a mutation falha e o optimistic reverte. O implement precisará inferi-los ou o designer produzi-los.
- **Fonte da contagem (TD-06).** "1,2 mil inscritos" é formatação abreviada pt-BR de um inteiro; a coluna desnormalizada `subscribers_count` em `channels` é a origem, mantida na mesma transação do inscrever/desinscrever. O número exibido deve refletir o resultado otimista imediatamente após o clique e reconciliar com o servidor.
- **Layout sem auto-layout — confirmado, e vale para o nó novo.** `59:15` (`main-dashed-container`) reporta `layoutMode: VERTICAL`, mas **todos** os seus 14 filhos são `layoutPositioning: ABSOLUTE` com x/y próprios: não há auto-layout real e a grade precisa ser reimplementada em CSS. O `subscribe-button` novo segue a mesma convenção absoluta (x 929, y 70), alinhado à direita na faixa do cabeçalho, na mesma altura do nome do canal. Só o desktop foi desenhado.
- **Acessibilidade do controle novo.** O nó 79:82 é um FRAME com um TEXT dentro, sem semântica de botão no export: o implement precisa de `<button>` real, rótulo acessível que mude com o estado (`aria-pressed` ou texto alternado) e anúncio da mudança de contagem para leitores de tela. A contagem em 59:86 é texto corrido junto com nickname e total de vídeos — separar em elementos próprios ajuda a leitura.
- **Nada visível apenas no screenshot.** Todos os elementos do screenshot — inclusive o pill "Inscrever-se" — estão presentes no tree cacheado; e nada no tree falta no screenshot.
- **Frame duplicado já resolvido.** O `_envelope` registra que o frame `77:190` ("canal-publico"), criado por engano em 2026-10-01 como se fosse tela nova desta rota, foi removido do arquivo em 2026-10-03. A tela da rota `/@{nickname}` é esta, `59:2`; nenhum nó de 77:190 entra neste inventário.
- **Pendências da Fase 04 que continuam abertas nesta tela** (não reabertas aqui, apenas registradas como ainda válidas): ausência de estados vazio/loading/not-found, descrição do canal fora do cabeçalho, inconsistência do mock de paginação (42 vídeos × 8 por página × só a página "1"), caixa tracejada da paginação como provável marcação de mock, wordmark "EstúdioCriador" divergente da marca do projeto, e o nickname de exemplo "joana.cria" com ponto fora da allowlist.

---

## Reconciliation summary

| Capability (project-plan.md) | Covered by | Screens |
|---|---|---|
| "Like e dislike em vídeos (usuários autenticados)" | LikeButton (77:121), DislikeButton (77:123) | `/videos/{publicId}` |
| "Comentários em vídeos (usuários autenticados)" | NewCommentForm (77:129) | `/videos/{publicId}` |
| "Respostas a comentários (comentários aninhados)" | RepliesLoadMore (sem id — depth-limited) | `/videos/{publicId}` — **só o lado de leitura**; ver `## Open questions` |
| "Like e dislike em comentários (usuários autenticados)" | CommentLikeButton, CommentDislikeButton (sem id — depth-limited) | `/videos/{publicId}` |
| "Inscrição em canais (seguir/deixar de seguir)" | SubscribeButton (77:119 / 79:82 — mesmo componente), SubscriptionToggleButton (id desconhecido) | `/videos/{publicId}`, `/@{nickname}`, `/channel/subscriptions` |
| "Área de canais seguidos com acesso rápido aos vídeos" | channel-list (75:79), channel-row (75:80, 75:88, 75:96) | `/channel/subscriptions` |
| "Contagem de inscritos na página do canal" | ChannelHeader (59:16), via ChannelMeta (59:86) | `/@{nickname}` |
| "Interface completa de comentários, likes e inscrições" | CommentsSection (77:125), CommentsLoadMore (77:188) | `/videos/{publicId}` |

_As oito capabilities da fase têm ≥1 verbo. A linha de "Respostas a comentários" é a única parcial: o desenho cobre ler respostas, não publicá-las._

## Open questions

- **O compositor de resposta não existe no desenho.** O controle "Responder" aparece na raiz e em cada resposta das duas threads, mas nenhuma frame da Fase 06 desenha o campo de resposta aberto. Decidido que o `ReplyButton` é Local-interactive e que um `ReplyForm` à parte publica — mas esse componente não está em nenhum frame, então não foi inventariado. **"Respostas a comentários (comentários aninhados)" fica coberta só pelo lado de leitura.** Desenhar o estado e rodar uma extension run, ou decidir por argumento no `/plan-resolve` que o `ReplyForm` é o `NewCommentForm` reusado com `parent_id`.
- **Quatro estados sem desenho na watch page:** lista de comentários vazia (zero comentários), erro de envio do comentário, comentário em trânsito (o estado pendente do `useOptimistic` de `social-interactions/TD-08`) e o `SubscribeButton` no estado "Inscrito" — o botão só existe como "Inscrever-se" nas duas telas onde aparece.
- **Estado vazio da área de canais seguidos sem desenho.** A frame mostra só o estado povoado (3 canais); não há desenho para "o usuário não segue nenhum canal", nem para carregamento ou erro da lista.
- **A variante anônima dos controles novos não foi desenhada.** `anonymous-gate/TD-01` decidiu que os controles de ação renderizam para o anônimo e o clique leva ao login. A `59:2` mostra isso para o `SubscribeButton`, mas a watch page da Fase 06 (`77:64`) é só o estado autenticado — como `LikeButton`, `DislikeButton`, `NewCommentForm` e os controles de comentário aparecem para o visitante anônimo terá de ser derivado por argumento, não observado.
- **A contagem de inscritos tem duas formas de render entre telas.** Na watch page ela ganhou arquivo próprio (`components/channels/subscriber-count.tsx (new)`, nó `77:118`) porque precisa acompanhar o valor otimista do `SubscribeButton`; na página de canal ela é texto corrido dentro de `ChannelMeta` (`59:86`, `Reuse? = new`). O mesmo número, dois tratamentos. Decidir no `/plan-resolve` se a página de canal passa a usar o mesmo componente — se sim, a linha de `ChannelMeta` muda de forma 3 para forma 2.
- **A capability "Área de canais seguidos com acesso rápido aos vídeos" fala em vídeos; o `TD-07` entrega canais.** O `TD-07` decidiu (opção A) que a área é uma **lista de canais com link para a página pública de cada um**, não um feed de vídeos — então o "acesso rápido aos vídeos" é indireto, em dois cliques. O verbo foi mapeado para essa bullet por ser a única candidata, mas a divergência entre o texto do plano e a decisão é real e cabe ao `plan-validate` julgar.
- **`75:62` não tem harvest completo.** O frame foi criado por script e a colheita truncou antes de terminar o nó, então o cache traz um `known_child_ids` parcial em vez de árvore. Duas linhas do inventário (`Avatar` dentro de `channel-row`, `SubscriptionToggleButton`) estão **sem node id**, e o `/implement` precisa de id para mirar o `figma-implement-design`. Uma colheita completa desse nó resolve — uma chamada.
- **Três nós da watch page ficaram no limite de profundidade.** `comment-root` (`77:137`, `77:176`) e `reply-list` (`77:149`) foram colhidos a `maxDepth` 6 e vieram sem filhos; toda a sub-estrutura de comentário (avatar, autor, corpo, as três ações e o item de resposta) foi lida do screenshot e está **sem node id**. Mesma consequência para o `/implement`. Uma colheita com `maxDepth` maior cobrindo esses três nós — e o `75:62` acima — resolve tudo em **uma** chamada.
- **`/channel/subscriptions` ainda não existe no repositório.** As irmãs do grupo autenticado (`/channel/videos`, `/channel/settings`) vivem em `next-frontend/app/(studio)/`, que é onde esta rota deve nascer. A implementação desta tela também **altera** `components/layout/site-navbar.tsx`, porque o ponto de entrada de navegação exigido pelo `TD-07` é um `<Link>` inline ali.
