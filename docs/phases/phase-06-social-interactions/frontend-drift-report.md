---
kind: drift-report
phase: phase-06-social-interactions
plan_mtime: "2026-10-06T01:01:38Z"
---

# phase-06-social-interactions — Drift Report

## Screen: video-watch-social — audited at SI-06.21.0 (2026-10-06)

**Quick scan:** 17 componentes (11 alinhado, 4 drift menor, 2 drift relevante, 0 ausente)

**Fonte do contexto Figma:** `docs/figma-cache/FetKyb1V02WS5D6VCatK6t/77-64.json` (frame `77:64`, colhido pelo `figma-batch` em 2026-10-01) e os nós colhidos isolados em 2026-10-04 — `77-137.json`, `77-176.json`, `77-149.json` (sub-estrutura de comentário e de resposta). **Nenhuma chamada ao MCP do Figma** — mesmo desenho cache-first da Fase 05.

**Nota sistêmica, herdada da Fase 05 e não reaberta:** o frame desenha na família slate/azul (`#3f72af`, `#1e293b`, `#7a6e65`, `#f8fafc`) e o DS na neutra; o arquivo Figma não tem Variables, e as cores são mapeadas à mão para os papéis do `globals.css` (`#3f72af` preenchido → `bg-primary`; texto `#7a6e65` → `text-muted-foreground`; `#1e293b` → `text-foreground`). Também seguem como sistêmicos os rótulos de botão em 12px Bold contra `--text-label-md` e o raio 10 dos botões contra a escala 8/12 — retunar esses tokens mexeria na aplicação inteira por uma tela.

**Como os controles novos mapeiam nas variantes existentes, sem edição:** `subscribe-button` (`77:119`) e `new-comment-submit` (`77:133`) são preenchidos com a cor da marca — variante `default` do `Button`; `like-button` (`77:121`), `dislike-button` (`77:123`) e `comments-load-more` (`77:188`) são brancos com borda sutil — exatamente a variante `secondary` depois do retune da Fase 05 (`bg-card` + `border-border`). As ações de comentário (`77:146`–`77:148`) são texto sem caixa — ver `ReplyButton` abaixo.

- `components/layout/site-navbar.tsx` — SiteNavbar — alinhado, skip
- `components/auth/brand-logo.tsx` — BrandLogo — drift relevante, exception
- `components/icons/streamtube-icon.tsx` — StreamTubeIcon — drift relevante, exception
- `components/layout/user-menu.tsx` — UserMenu — alinhado, skip
- `components/ui/avatar.tsx` — Avatar — drift menor, exception
- `components/ui/button.tsx` — Button — alinhado, skip
- `components/icons/download-icon.tsx` — DownloadIcon — alinhado, skip
- `components/ui/textarea.tsx` — Textarea — alinhado, skip
- `components/videos/video-description.tsx` — VideoDescription — alinhado, skip
- `components/icons/chevron-down-icon.tsx` — ChevronDownIcon — alinhado, skip
- `components/channels/subscriber-count.tsx` — SubscriberCount — alinhado, skip
- `components/comments/comment-list.tsx` — CommentList — drift menor, auto-Edit (1 dimensão)
- `components/comments/comment-thread.tsx` — CommentThread — alinhado, skip
- `components/comments/comment-item.tsx` — CommentItem — drift menor, auto-Edit (1 dimensão)
- `components/comments/reply-button.tsx` — ReplyButton — drift menor, auto-Edit (1 dimensão)
- `components/comments/reply-list.tsx` — ReplyList — alinhado, skip
- `components/comments/comment-reply.tsx` — CommentReply — alinhado, skip

### components/layout/site-navbar.tsx — SiteNavbar

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-05.6.0 honored"

O `navbar` (`77:66`) repete o da Fase 05 — `padding [20, 48]`, borda inferior —, agora na variante autenticada (`user-menu` `77:73` no slot da direita). O link "Canais seguidos" acrescentado no `SI-06.20` não aparece neste frame (só no `75:62`); renderiza apenas no chrome autenticado e não altera a caixa do navbar.

### components/auth/brand-logo.tsx — BrandLogo

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: o `brand-logo` do frame é a marca "EstúdioCriador", não "StreamTube" — mesma decisão da Fase 05 (`exception at SI-05.6.0`).
- **Prior:** "exception at SI-05.6.0 — 'wordmark de outra marca'"

### components/icons/streamtube-icon.tsx — StreamTubeIcon

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: o glifo no `logo-box` é o da marca "EstúdioCriador"; o ícone do DS é a marca correta do produto — mesma decisão da Fase 05.
- **Prior:** "exception at SI-05.6.0 — 'glifo de outra marca'"

### components/layout/user-menu.tsx — UserMenu

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

O `user-menu` (`77:73`) é avatar 32×32 (`78:82`) + botão "Sair" (`77:74`) com `gap 12`. O componente entrega `Avatar` no tamanho default (32px), `gap-4` (16px) e o `Button` `outline`. O `gap` de 12 contra 16 é de um passo e o botão "Sair" segue a decisão já aplicada pela Fase 04 nesse componente; nada a editar por esta tela.

### components/ui/avatar.tsx — Avatar

- **Status:** drift menor
- **Decision:** `exception`
  - reason: os avatares de comentário pedem 36px (`77:138`, `77:130` no compositor) e os de resposta 28px (`77:151`); a escala do DS é 24/32/40/80 (`sm`/default/`lg`/`xl`). Usar default (32) e `sm` (24) mantém a escala — introduzir 36 e 28 avulsos a fragmentaria pela mesma razão do raio 10 na Fase 05.
- **Prior:** "alinhado at SI-05.6.0 (tamanho lg do canal)"

### components/ui/button.tsx — Button

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "auto-Edit (retune secondary → bg-card) at SI-05.6.0 honored"

Os cinco botões novos com caixa cabem nas variantes que já existem — `default` (preenchido) e `secondary` (branco com borda) —, como descrito no cabeçalho desta seção. O retune da Fase 05 é justamente o que torna `secondary` igual a `like-button`/`dislike-button`/`comments-load-more`. Nenhum utilitário com prefixo de variante conflita (varredura da Fase 05 segue válida).

### components/icons/download-icon.tsx — DownloadIcon

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

`download-icon` (`77:101`) 14×14, traço — o componente é `currentColor` sem tamanho fixo, criado no `SI-05.6a` a partir do mesmo glifo.

### components/ui/textarea.tsx — Textarea

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

O `new-comment-input` (`77:132`) é o placeholder "Adicione um comentário…" em 13px dentro da caixa `new-comment-box` (`77:129`, fundo `#f8fafc`). O fundo e o arranjo horizontal (avatar · campo · "Comentar") são do contêiner do compositor, que é markup do `NewCommentForm`, não do primitivo; o `Textarea` entra sem override de identidade visual.

### components/videos/video-description.tsx — VideoDescription

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-05.6.0 honored"

`description-collapsed` (`77:104`) idêntico ao frame da Fase 05.

### components/icons/chevron-down-icon.tsx — ChevronDownIcon

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-05.6.0 honored"

### components/channels/subscriber-count.tsx — SubscriberCount

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

`subscribers-count` (`77:118`) é texto corrido 12px Regular em cor muted, terceira linha da identidade do canal. O componente não fixa tipografia de propósito: na página do canal ele vive **dentro** da linha de meta (`59:86`), herdando o estilo dela; aqui herda do bloco de texto do canal. Formato "1,2 mil inscritos" confere com a abreviação pt-BR implementada.

### components/comments/comment-list.tsx — CommentList

- **Status:** drift menor
- **Decision:** `auto-Edit`
  - retune gap: list — `gap-6` (24px) → `gap-5` (20px) per Figma `comment-list` (`77:135`, `gap 20`)
- **Prior:** _(none)_

### components/comments/comment-thread.tsx — CommentThread

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

`comment-thread` (`77:136`) é vertical com `gap 12` — o componente usa `gap-3`.

### components/comments/comment-item.tsx — CommentItem

- **Status:** drift menor
- **Decision:** `auto-Edit`
  - retune comment-meta: autor e timestamp lado a lado com `gap-2` (8px), sem o separador " · " — per Figma `comment-meta` (`77:141`, dois TEXT irmãos, `gap 8`)
- **Prior:** _(none)_

O resto confere: `comment-root` (`77:137`) com `gap 12` entre avatar e corpo, `comment-body` (`77:140`) vertical com `gap 4`, ações em linha. O avatar de 36px cai na `exception` do `Avatar` acima.

### components/comments/reply-button.tsx — ReplyButton

- **Status:** drift menor
- **Decision:** `auto-Edit`
  - retune variant: ghost → link per Figma `comment-reply-action` (`77:148`), texto Semi Bold na cor de link, sem caixa
- **Prior:** _(none)_

As ações de comentário são texto puro na linha `comment-actions` (`77:145`, `gap 16`). "Responder" é a única em cor de link (`#3f72af` → `text-link`); "Gostei · N" e "Não gostei" ficam em cor muted e pertencem aos `CommentLikeButton`/`CommentDislikeButton`, criados no `SI-06.21a`.

### components/comments/reply-list.tsx — ReplyList

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

`reply-list` (`77:149`) tem `padding-left 48` e `gap 12` — o componente usa `pl-12` e `gap-3`. Os três filhos observados (`77:150`, `77:162`, `77:174`) batem com respostas + slot do "ver mais".

### components/comments/comment-reply.tsx — CommentReply

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

`comment-reply` (`77:150`) tem a mesma estrutura do `comment-root`, com avatar menor (28px → `sm`, coberto pela `exception` do `Avatar`); compõe o `CommentItem` e herda o ajuste de `comment-meta` acima.

## Screen: channel-subscriptions — audited at SI-06.22.0 (2026-10-06)

**Quick scan:** 6 componentes (3 alinhado, 1 drift menor, 2 drift relevante, 0 ausente)

**Fonte do contexto Figma:** `docs/figma-cache/FetKyb1V02WS5D6VCatK6t/75-62.json` (frame `75:62`, colhido pelo `figma-batch` em 2026-10-01). **Nenhuma chamada ao MCP do Figma.** A nota sistêmica de cor e tipografia da seção `video-watch-social` vale aqui sem mudança.

**Decisões de chrome:** coincidem com as de `video-watch-social` — nenhuma linha `CONFLICT`.

**Server-connected, fora da lista Reused DS (contexto para o 22a):** `channel-row` (`75:80`) é caixa branca com borda `#e2e8f0`, raio 12, `padding [16, 20]`, `gap 16`, itens centralizados — `rounded-[var(--radius-4)] border border-border bg-card px-5 py-4 gap-4`; `channel-list` (`75:79`) empilha as linhas com `gap 12`; `page-heading` (`75:76`) é título 24 + contagem 13 muted com `gap 6`. O `unsubscribe-button` (`75:86`) é preenchido em `#e2e8f0`, `padding [8, 16]`, raio 8, rótulo 12 Bold — a caixa da variante `sm` do `Button`; o preenchimento cinza não tem variante no DS e o estado "Inscrito" segue a `secondary` já decidida para o `SubscribeButton` (OQ-13), para o mesmo estado ter o mesmo aspecto nas três telas.

- `components/layout/site-navbar.tsx` — SiteNavbar — alinhado, skip
- `components/auth/brand-logo.tsx` — BrandLogo — drift relevante, exception
- `components/icons/streamtube-icon.tsx` — StreamTubeIcon — drift relevante, exception
- `components/layout/user-menu.tsx` — UserMenu — alinhado, skip
- `components/ui/avatar.tsx` — Avatar — drift menor, exception
- `components/channels/subscriber-count.tsx` — SubscriberCount — alinhado, skip

### components/layout/site-navbar.tsx — SiteNavbar

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-06.21.0 honored"

Com o `SI-06.20` aplicado, o `nav-link-canais-seguidos` (`75:74`, 13px na cor da marca) está no disco como `<Link>` inline entre a marca e o `user-menu`, com `aria-current="page"` nesta rota. A caixa do navbar é a mesma do `77:66`.

### components/auth/brand-logo.tsx — BrandLogo

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: wordmark "EstúdioCriador" (`75:70`), outra marca — mesma decisão da Fase 05 e do `SI-06.21.0`.
- **Prior:** "exception at SI-06.21.0 — 'wordmark de outra marca'"

### components/icons/streamtube-icon.tsx — StreamTubeIcon

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: glifo do `logo-box` (`75:66`) é o da outra marca — mesma decisão do `SI-06.21.0`.
- **Prior:** "exception at SI-06.21.0 — 'glifo de outra marca'"

### components/layout/user-menu.tsx — UserMenu

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-06.21.0 honored"

`user-menu` (`75:71`) repete o do `77:73`: avatar de iniciais (`77:62`) + "Sair" (`75:72`).

### components/ui/avatar.tsx — Avatar

- **Status:** drift menor
- **Decision:** `exception`
  - reason: o `channel-avatar` das linhas (`75:81`, `75:89`, `75:97`) é 48px; a escala do DS é 24/32/40/80. A linha usa `lg` (40), o passo mais próximo — mesmo critério do `SI-06.21.0` para os avatares de 36 e 28.
- **Prior:** "exception at SI-06.21.0 — 'escala 24/32/40/80'"

### components/channels/subscriber-count.tsx — SubscriberCount

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-06.21.0 honored"

A contagem vive **dentro** da `channel-meta` (`75:85`, "12,4 mil inscritos · 48 vídeos", 12px Regular muted) e herda o estilo dela, como na página do canal. O formato abreviado confere.

## Screen: channel-public-social — audited at SI-06.23.0 (2026-10-06)

**Quick scan:** 10 componentes (8 alinhado, 0 drift menor, 2 drift relevante, 0 ausente)

**Fonte do contexto Figma:** `docs/figma-cache/FetKyb1V02WS5D6VCatK6t/59-2.json` (frame `59:2`). **Nenhuma chamada ao MCP do Figma.** A seção `pagina-publica-canal` da Fase 04 (`docs/phases/phase-04-video-channel-management/frontend-drift-report.md`) continua valendo e não é reescrita; esta seção só cobre o que a Fase 06 acrescenta ao frame.

**Leitura do nó.** O frame é posicionado de forma absoluta, sem auto-layout real no cabeçalho: o `content-header` (`59:16`) é uma faixa horizontal de 1004px com o nome (`59:17`, 32px) e o `subscribe-button` (`79:82`, 123×37, rótulo 14px) na outra ponta — reimplementado em CSS como linha `justify-between` na altura do nome. As pendências da Fase 04 (wordmark, mock de paginação, nickname `joana.cria` com ponto) seguem as decisões registradas lá.

- `components/layout/site-navbar.tsx` — SiteNavbar — alinhado, skip
- `components/auth/brand-logo.tsx` — BrandLogo — drift relevante, exception
- `components/icons/streamtube-icon.tsx` — StreamTubeIcon — alinhado, skip
- `components/ui/button.tsx` — Button — alinhado, skip
- `components/channels/channel-header.tsx` — ChannelHeader — drift relevante, auto-Edit (extensão)
- `components/ui/avatar.tsx` — Avatar — alinhado, skip
- `components/ui/badge.tsx` — Badge — alinhado, skip
- `components/ui/pagination.tsx` — Pagination — alinhado, skip
- `components/videos/video-card.tsx` — VideoCard — alinhado, skip
- `components/channels/subscriber-count.tsx` — SubscriberCount — alinhado, skip

### components/layout/site-navbar.tsx — SiteNavbar

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "skip at SI-04.14.0 honored"

O frame está no estado anônimo ("Entrar", `59:13`). A página passa a usar o `PublicSiteNavbar`, que escolhe o chrome pela sessão — com sessão, o mesmo autenticado da watch page — e mantém o "Entrar" na variante `outline` da Fase 04.

### components/auth/brand-logo.tsx — BrandLogo

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: wordmark de outra marca — mesma decisão da Fase 04 nesta tela e do `SI-06.21.0`.
- **Prior:** "exception at SI-04.14.0 — 'wordmark de outra marca'"

### components/icons/streamtube-icon.tsx — StreamTubeIcon

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "skip at SI-04.14.0 honored"

Mantida a leitura da Fase 04 para este frame. A watch page registrou `exception` para o glifo do `logo-box` dela; as duas decisões levam ao mesmo código (o ícone do DS fica como está), então não há `CONFLICT` a resolver.

### components/ui/button.tsx — Button

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "skip at SI-04.14.0 honored"

O `subscribe-button` (`79:82`) é preenchido na cor da marca com rótulo 14px — a variante `default` no tamanho `md`, a mesma do `77:119` da watch page.

### components/channels/channel-header.tsx — ChannelHeader

- **Status:** drift relevante
- **Decision:** `auto-Edit` (extensão)
  - O cabeçalho em disco não tem a contagem de inscritos nem o botão. Acrescentar: (1) props `subscribersCount`, `viewerSubscribed` e `isAuthenticated`; (2) `ChannelSubscriptionProvider` envolvendo a meta e o botão; (3) `ChannelMeta` (`59:86`) passa a `@{nickname} · <ProvidedSubscriberCount /> · {N} vídeos`; (4) o nome e o `SubscribeButton` numa linha `justify-between`, com o botão alinhado à direita na altura do nome (`59:16`).
- **Prior:** "auto-Edit at SI-04.14.0 (aplicado na SI-04.14a)"

### components/ui/avatar.tsx — Avatar

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "auto-Edit at SI-04.14.0 (aplicado na SI-04.14a)"

`channel-avatar` (`59:85`) é 80×80 — o tamanho `xl` acrescentado pela Fase 04.

### components/ui/badge.tsx — Badge

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

O badge de duração dos cards não muda nesta fase.

### components/ui/pagination.tsx — Pagination

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "skip at SI-04.14.0 honored"

### components/videos/video-card.tsx — VideoCard

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "auto-Edit at SI-04.14.0 (aplicado na SI-04.14a)"

### components/channels/subscriber-count.tsx — SubscriberCount

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** "alinhado at SI-06.21.0 honored"

Vive dentro da `channel-meta` (`59:86`, 12px muted) e herda o estilo dela; "1,2 mil inscritos" confere com o formato abreviado.
