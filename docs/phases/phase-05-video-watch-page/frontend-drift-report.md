---
kind: drift-report
phase: phase-05-video-watch-page
plan_mtime: "2026-10-01T11:40:00-03:00"
---

# phase-05-video-watch-page — Drift Report

## Screen: video-watch-page — audited at SI-05.6.0 (2026-10-01)

**Quick scan:** 7 componentes (3 alinhado, 0 drift menor, 4 drift relevante, 0 ausente)

**Fonte do contexto Figma:** `docs/figma-cache/FetKyb1V02WS5D6VCatK6t/66-42.json`, colhido em 2026-09-29 pelo `figma-batch` (74 nós, `maxDepth: 6`, com `size`, `layout`, `fills`, `strokes`, `radius`, `font`, `fontSize`). **Nenhuma chamada nova ao MCP do Figma foi gasta nesta auditoria** — o cache carrega os valores que o diff precisa.

**Nota sistêmica — a paleta do Figma não é a paleta do DS, e isso já foi decidido.** O frame desenha em `#3f72af` / `#1e293b` / `#e2e8f0` / `#f8fafc` / `#7a6e65` (família slate/azul); o `globals.css` implementa em `#0f0f0f` / `#c6c6c6` / `#535353` com `--link: #1976d2` (família neutra, `baseColor: neutral` do shadcn). Isso **não** é achado desta auditoria: o arquivo Figma não tem Variables nem text styles (`localVariableCollections: 0`, registrado no inventário da Fase 05 e no da Fase 04), e a Fase 04 já estabeleceu que "as cores foram aplicadas como hex direto, alinhadas manualmente aos tokens de `globals.css`". As divergências de **cor pura** abaixo seguem esse precedente e não geram edição. O que geram edição são **superfícies ausentes** e **valores que não cabem na caixa desenhada**.

**Deltas de escala que ficam de fora das decisões, por serem sistêmicos e de 1–2 passos:** o Figma usa `radius: 10` em todos os botões, e a escala do DS tem 8 (`--radius-2`) e 12 (`--radius-3`), sem 10 — manter 12 preserva a escala, introduzir um 10 avulso a fragmentaria. O Figma rotula em `Inter Semi Bold` (600) onde o DS usa peso 500 em `--text-label-md`, e o título do `VideoCard` em 15px/700 onde o DS usa `--text-label-lg` 16px/500. São um passo de peso e 1px; retunar esses tokens afetaria a aplicação inteira para alinhar uma tela.

- `components/layout/site-navbar.tsx` — SiteNavbar — alinhado, skip
- `components/auth/brand-logo.tsx` — BrandLogo — drift relevante, exception
- `components/icons/streamtube-icon.tsx` — StreamTubeIcon — drift relevante, exception
- `components/ui/button.tsx` — Button — drift relevante, auto-Edit (1 dimensão)
- `components/ui/avatar.tsx` — Avatar — alinhado, skip
- `components/icons/chevron-down-icon.tsx` — ChevronDownIcon — alinhado, skip
- `components/videos/video-card.tsx` — VideoCard — drift relevante, auto-Edit (2 dimensões)

### components/layout/site-navbar.tsx — SiteNavbar

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

O `navbar` (`66:44`) pede `padding: [20, 48, 20, 48]` e uma borda inferior; o DS entrega `px-12 py-5` (48px / 20px) e `border-b border-border`. A altura de 76 do frame fecha com 20 + 36 + 20. A cor da borda cai na nota sistêmica de paleta.

### components/auth/brand-logo.tsx — BrandLogo

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: o `brand-logo` (`66:45`) do frame é de **outra marca** — wordmark "EstúdioCriador" em Inter Extra Bold 18px, e um `logo-box` 36×36 `#3f72af` com glifo de play. A marca implementada é "StreamTube". Reusar o componente do DS, não o texto nem a forma do frame, conforme o `SI-05.6.0` já antecipava. Ficam cobertos pela mesma exceção os deltas dimensionais que só existem por ser outra marca: `gap` 12 no Figma contra `gap-2` (8px) no DS, e ícone 36 contra `size-8` (32px) na variante `md`.
- **Prior:** _(none)_

### components/icons/streamtube-icon.tsx — StreamTubeIcon

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: o que o frame desenha nessa posição (`66:46`–`66:49`) é um quadrado arredondado `#3f72af` com um glifo de play vazado em branco — a marca "EstúdioCriador", não a do StreamTube. Mesma razão do `BrandLogo`: o ícone do DS é a marca correta do produto e não deve ser redesenhado a partir deste frame.
- **Prior:** _(none)_

### components/ui/button.tsx — Button

- **Status:** drift relevante
- **Decision:** `auto-Edit`
  - retune variant: secondary — `bg-secondary` → `bg-card` per Figma `sair-button` (`66:52`), `download-button` (`67:66`) e `sidebar-load-more` (`72:62`), que pedem fundo branco com borda sutil
- **Prior:** _(none)_

**Superfície ausente, não divergência de cor.** Os três botões da tela pedem a mesma combinação: fundo `#ffffff` (que é exatamente `--card`) com borda `#e2e8f0` (o papel de `--border`) e rótulo escuro. Nenhuma variante do DS declara isso: `outline` é `bg-transparent` com `border-foreground` (borda escura, não sutil), e `secondary` é `bg-secondary`, que é `#e3e3e3` — cinza, não branco. A variante `secondary` é o slot semântico certo e já traz `border-border` e `text-secondary-foreground`; só o fundo está fora.

**Por que um retune e não um aditivo.** A regra das 3 formas manda, no fallback, nomear a variante nova pelo nome byte-literal da propriedade no Figma. Este arquivo **não tem componentes nem variáveis** — os nós são frames soltos (`sair-button`, `download-button`), que são nomes de *instância na tela*, não nomes de variante. Inventar um nome a partir do contexto da tela é proibido pela própria regra, então a saída honesta é retunar a variante que já ocupa esse papel. Se você preferir uma variante nova, troque esta decisão aqui no arquivo antes do `SI-05.6a`.

**Varredura de conflito de variante:** os únicos utilitários de `bg` sob prefixo no arquivo são `hover:bg-muted/40` (na `outline`) e `hover:bg-muted` (na `ghost`) — outras variantes, não irmãos do `bg` da `secondary`. Nenhum `dark:bg-*`. Nada a derrubar ou retunar.

### components/ui/avatar.tsx — Avatar

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

O `channel-avatar` (`67:102`) é 40×40 com borda. O DS entrega exatamente isso em `data-[size=lg]:size-10` mais a borda de `after:border-border`. A chamada usa `size="lg"`. Sem upload de avatar nesta fase, o `AvatarFallback` com iniciais já existe e cobre o caso.

### components/icons/chevron-down-icon.tsx — ChevronDownIcon

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

O `chevron-down` (`67:74`) é 12×12 com traço em `#3f72af`. O ícone do DS é `stroke="currentColor"` e não fixa tamanho — ambos vêm do call site, que é onde devem vir. Nada a ajustar no componente.

### components/videos/video-card.tsx — VideoCard

- **Status:** drift relevante
- **Decision:** `auto-Edit`
  - retune type token: `--text-overlay` em `app/globals.css` — `16px / 20px / 400` → `11px / 16px / 700` per Figma `duration-text` (`I67:78;59:91`)
  - retune color token: `--overlay` em `app/globals.css` — `#00000080` → `#0f0f0f` per Figma `duration-badge` (`I67:78;59:90`)
- **Prior:** _(none)_

**O tipo não cabe na caixa desenhada — é por isso que esta é a única divergência de valor que vira edição.** O Figma desenha a `duration-badge` com 18px de altura e texto de 11px. O card implementa a badge com `text-overlay`, que é 16px com line-height 20px; somados os `py-0.5` (4px), o conteúdo pede 24px dentro de uma caixa de 18px. Não é preferência estética: do jeito atual a badge não pode render como desenhada.

**Os dois tokens têm um único consumidor.** `grep` por `text-overlay` e `bg-overlay` no projeto inteiro retorna só `app/globals.css` (a definição) e a linha 60 de `components/videos/video-card.tsx`. Retunar os tokens é a correção certa no nível do DS, com raio de alcance zero fora deste card — por isso a edição é em `globals.css` e não no `className` do card, que seria um override de call-site sobre identidade visual intrínseca.

**O que ficou de fora:** o `title` do card é `text-label-lg` (16px/500) contra 15px/700 no Figma. Entra na nota sistêmica de escala: 1px e um passo de peso, e `--text-label-lg` é consumido em toda a aplicação.

**Varredura de conflito de variante:** `video-card.tsx` não tem nenhum utilitário de `bg`, `text`, `rounded`, `p*` ou `gap` sob prefixo de variante — nem conciso (`dark:`, `hover:`) nem entre colchetes. As edições são em tokens de `globals.css`, cujas resoluções de modo claro e escuro são as mesmas para `--overlay` (`#00000080` nos dois) e inexistentes para `--text-overlay` (tipografia não tem override de modo). Nada a derrubar.

---

## Screen: video-not-found — audited at SI-05.7.0 (2026-10-01)

**Quick scan:** 6 componentes (3 alinhado, 1 drift menor, 2 drift relevante, 0 ausente)

**Fonte do contexto Figma:** `docs/figma-cache/FetKyb1V02WS5D6VCatK6t/68-62.json`, mesma colheita de 2026-09-29. **Nenhuma chamada nova ao MCP do Figma.**

**Consulta cruzada com `## Screen: video-watch-page`.** Os quatro componentes de chrome (`site-navbar`, `brand-logo`, `streamtube-icon`, `button`) aparecem nas duas telas, e o frame desenha os dois navbars **nó a nó idênticos** — mesmos 76px de altura, mesmo `padding: [20, 48, 20, 48]`, mesmo `sair-button` 74×33 com `r=10`. Nenhum CONFLICT: todas as decisões reproduzem o que já foi registrado.

- `components/layout/site-navbar.tsx` — SiteNavbar — alinhado, skip
- `components/auth/brand-logo.tsx` — BrandLogo — drift relevante, exception
- `components/icons/streamtube-icon.tsx` — StreamTubeIcon — drift relevante, exception
- `components/ui/button.tsx` — Button — alinhado, skip
- `components/ui/card.tsx` — Card — drift menor, auto-Edit (1 dimensão)
- `components/icons/video-off-icon.tsx` — VideoOffIcon — alinhado, skip

### components/layout/site-navbar.tsx — SiteNavbar

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** alinhado/skip em SI-05.6.0, honrado — o `navbar` (`68:64`) é nó a nó idêntico ao `66:44` da watch page

### components/auth/brand-logo.tsx — BrandLogo

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: mesma marca de outro produto do frame anterior — wordmark "EstúdioCriador" (`68:70`) e `logo-box` `#3f72af` com glifo de play. Reusar o componente do DS, não o do frame.
- **Prior:** exception em SI-05.6.0 — "o frame desenha outra marca". Reclassificado do zero, como manda a regra para decisões `exception` (nenhuma edição foi aplicada lá, então o arquivo está no estado original); chegou ao mesmo lugar.

### components/icons/streamtube-icon.tsx — StreamTubeIcon

- **Status:** drift relevante
- **Decision:** `exception`
  - reason: o glifo em `68:66`–`68:69` é a marca "EstúdioCriador", não a do StreamTube. O ícone do DS é a marca correta do produto.
- **Prior:** exception em SI-05.6.0 — mesma razão. Reclassificado do zero; mesmo resultado.

### components/ui/button.tsx — Button

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** auto-Edit em SI-05.6.0 (`retune variant: secondary — bg-secondary → bg-card`), aplicado no SI-05.6a e **honrado aqui**: o `back-home-button` (`68:83`) pede exatamente a mesma combinação já atendida — fundo branco, borda sutil, `padding: [8, 16, 8, 16]`, rótulo Semi Bold 14.

### components/ui/card.tsx — Card

- **Status:** drift menor
- **Decision:** `auto-Edit`
  - +size 'lg' — `gap-5 py-12 rounded-[var(--radius-4)]` no root e `px-12` no header/content, per Figma `not-found-card` (`68:75`): `gap: 20`, `padding: 48`, `r: 16`
- **Prior:** _(none)_

**Aditivo, e não retune, porque o Card tem cinco consumidores.** `app/(auth)/login`, `/signup`, `/forgot-password`, `components/channels/channel-edit-form.tsx` e `components/videos/thumbnail-uploader.tsx` usam o primitivo com a densidade atual (`gap-4`, `py-4`/`px-4`, `rounded-[var(--radius-2)]`). O `not-found-card` é um tratamento de herói — 48px de respiro e 16px de raio — e retunar a base para atendê-lo mudaria aquelas cinco telas. Padding e raio são identidade visual intrínseca, então override no call site está fora de questão pela regra anti-pattern; a saída correta é uma variante de tamanho.

**Sobre o nome `lg`.** A regra das 3 formas manda, no fallback aditivo, usar o nome byte-literal da propriedade no Figma — e este arquivo não tem Variables nem componentes, como já registrado na outra tela. `lg` **não** vem do contexto da tela (não é "not-found", nem "video", nem "hero"): é o degrau que falta na escala que o próprio DS já declara, que hoje tem `sm` e o default. Se preferir outro nome, troque aqui antes do `SI-05.7a`.

**Varredura de conflito de variante:** os utilitários sob prefixo no arquivo são `data-[size=sm]:gap-3`, `data-[size=sm]:py-3`, `group-data-[size=sm]/card:px-3` e as regras `has-*`/`*:[img...]`. São escopos de tamanho e de conteúdo, não de modo — nenhum `dark:` sobre as propriedades tocadas. Como a edição é aditiva num novo escopo `data-[size=lg]`, não há irmão de mesma propriedade a derrubar nem a retunar.

### components/icons/video-off-icon.tsx — VideoOffIcon

- **Status:** alinhado
- **Decision:** `skip`
- **Prior:** _(none)_

Criado no `SI-05.0.1`, como o Dependency Map previa — a auditoria o encontra em disco e não como `componente ausente`. O frame desenha 28×28 com três vetores em traço; o componente é `stroke="currentColor"` sem `width`/`height` fixos, então tamanho e cor vêm do call site, que é a convenção de ícones do projeto. A cor `#7a6e65` do frame cai na nota sistêmica de paleta da seção anterior.
