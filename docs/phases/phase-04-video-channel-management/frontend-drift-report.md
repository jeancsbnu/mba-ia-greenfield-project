---
kind: drift-report
phase: phase-04-video-channel-management
plan_mtime: "2026-09-21T22:48:21Z"
---

# phase-04-video-channel-management — Drift Report

## Screen: painel-videos — audited at SI-04.11.0 (2026-09-22)

**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=39-2

**Quick scan:** 12 components (2 alinhado, 5 drift menor, 5 drift relevante, 0 ausente)

**TOC:**
- `components/layout/site-navbar.tsx` — SiteNavbar — drift menor → auto-Edit (1 specific)
- `components/auth/brand-logo.tsx` — BrandLogo — drift relevante → exception
- `components/icons/streamtube-icon.tsx` — StreamTubeIcon — alinhado → skip
- `components/layout/user-menu.tsx` — UserMenu — drift menor → auto-Edit (1 specific)
- `components/ui/avatar.tsx` — Avatar — drift menor → exception
- `components/ui/button.tsx` — Button — alinhado → skip
- `components/icons/plus-icon.tsx` — PlusIcon — drift menor → exception
- `components/videos/video-table.tsx` — VideoTable — drift relevante → auto-Edit (4 specifics)
- `components/ui/badge.tsx` — Badge — drift relevante → auto-Edit (3 specifics)
- `components/videos/video-visibility-badge.tsx` — VideoVisibilityBadge — drift relevante → auto-Edit (2 specifics)
- `components/videos/video-status-badge.tsx` — VideoStatusBadge — drift relevante → auto-Edit (1 specific)
- `components/ui/pagination.tsx` — Pagination — drift menor → auto-Edit (1 specific)

**Nota de leitura do nó.** O frame traz artefatos de diagramação que **não** são UI: a faixa
`top-decorative-strip` e as caixas tracejadas azuis (`main-dashed-container`,
`pagination-dashed-box`, borda `#3f72af` dashed). São marcações do arquivo de design, não
elementos a implementar, e por isso não geram linha de drift.

---

### components/layout/site-navbar.tsx — SiteNavbar

- **Status:** `drift menor`
- **Decision:** `auto-Edit`
- **Prior:** _(none)_
- **Specifics:**
  1. Padding do header: Figma `px-[48px] py-[20px]`; em disco `px-6 py-3` (24/12) → `px-12 py-5`.

A borda inferior usa `border-border` (`#c6c6c6`) contra `#e2e8f0` do Figma — tratado na linha
do token global abaixo, não aqui.

---

### components/auth/brand-logo.tsx — BrandLogo

- **Status:** `drift relevante`
- **Decision:** `exception`
- **Prior:** phase-02 signup/login — `alinhado` → `skip` (sem CONFLICT: ambas as decisões não editam o arquivo)
- **Justificativa:** o mock usa outra marca — caixa azul `#3f72af` com glifo de play e o nome
  "EstúdioCriador", contra o ícone vermelho e o nome "StreamTube" em disco. Isso é a lacuna de
  design já registrada como Open Question no inventário, não drift de implementação. Trocar a
  marca real do produto para casar com um placeholder seria o erro oposto.

---

### components/icons/streamtube-icon.tsx — StreamTubeIcon

- **Status:** `alinhado`
- **Decision:** `skip`
- **Prior:** _(none)_

A caixa arredondada e a cor pertencem ao `BrandLogo`, não ao ícone; sem drift próprio.

---

### components/layout/user-menu.tsx — UserMenu

- **Status:** `drift menor`
- **Decision:** `auto-Edit`
- **Prior:** _(none)_
- **Specifics:**
  1. Espaçamento entre avatar e botão: Figma `gap-[16px]`; em disco `gap-3` (12px) → `gap-4`.

O botão "Sair" (`px-[16px] py-[8px]`, raio 10px, 14px semibold) já corresponde ao
`Button variant="outline" size="sm"` dentro da tolerância do DS (raio 12px contra 10px).

---

### components/ui/avatar.tsx — Avatar

- **Status:** `drift menor`
- **Decision:** `exception`
- **Prior:** _(none)_
- **Justificativa:** o Figma pede 36px e a escala do DS oferece 24/32/40. Criar um degrau de
  36px fragmentaria a escala inteira por uma diferença de 4px, que não é perceptível ao lado
  de um botão de 36px de altura.

---

### components/ui/button.tsx — Button

- **Status:** `alinhado`
- **Decision:** `skip`
- **Prior:** phase-02 signup/login — `alinhado` → `skip` (sem CONFLICT)

O botão "Criar novo vídeo" do Figma (`bg-[#0f0f0f]`, `px-[24px] py-[12px]`, raio 12px, gap 8px)
é o `variant="default"` com `--primary: #0f0f0f`; a diferença de padding é escolha de `size` na
página, não drift do componente.

---

### components/icons/plus-icon.tsx — PlusIcon

- **Status:** `drift menor`
- **Decision:** `exception`
- **Prior:** _(none)_
- **Justificativa:** o Figma fixa 14px, mas o tamanho de ícone dentro de `Button` é governado
  pela escala do próprio botão (`[&_svg]:size-5`). Pinar 14px no ícone passaria por cima dessa
  regra e faria o ícone divergir dos demais botões do app.

---

### components/videos/video-table.tsx — VideoTable

- **Status:** `drift relevante`
- **Decision:** `auto-Edit`
- **Prior:** _(none)_
- **Specifics:**
  1. Falta a casca de cartão em volta da tabela: Figma `bg-white`, borda, raio 16px e
     `shadow-[0px_8px_24px_0px_rgba(0,0,0,0.02)]`; em disco a `<table>` é solta.
  2. Cabeçalho: Figma `bg-[#f8fafc]` com `px-[24px] py-[14px]`; em disco sem fundo e `py-2`.
  3. Linhas: Figma `h-[88px]` com `px-[24px] py-[16px]`; em disco `py-3` e sem padding lateral.
  4. Título do vídeo: Figma `text-[15px]` bold com elipse em `w-[154px]`; em disco `text-label-md`
     sem largura fixa.

---

### components/ui/badge.tsx — Badge

- **Status:** `drift relevante`
- **Decision:** `auto-Edit`
- **Prior:** _(none)_
- **Specifics:**
  1. Faltam as variantes `success` e `warning`, exigidas pelos chips de status e visibilidade.
     Os tokens já existem em `globals.css` (`--success`/`--success-text`,
     `--warning`/`--warning-text`), então é só expor as variantes — nenhum token novo.
  2. Padding: Figma `px-[10px] py-[4px]`; em disco `px-2 py-0.5` (8/2) → `px-2.5 py-1`.
  3. Peso da fonte: Figma `font-semibold`; em disco `font-medium`.

O alpha do fundo diverge (Figma 16% no verde e 28% no âmbar; os tokens `--color-success-alpha-10`
e `--color-warning-alpha-10` são 10%). Uso os tokens existentes: a diferença de opacidade é
imperceptível num chip desse tamanho e criar tokens de alpha por tela inflaria o registro.

---

### components/videos/video-visibility-badge.tsx — VideoVisibilityBadge

- **Status:** `drift relevante`
- **Decision:** `auto-Edit`
- **Prior:** _(none)_
- **Specifics:**
  1. "Indisponível" é âmbar no Figma (`bg-[rgba(255,219,67,0.28)]`, texto `#b45309`), mas em
     disco usa `variant="outline"`, que só desenha borda → passar para `variant="warning"`.
  2. "Público" e "—" têm texto `#535353` no Figma, que é `--muted-foreground`; `variant="secondary"`
     entrega `--secondary-foreground` (`#0f0f0f`) → acrescentar `text-muted-foreground`.

---

### components/videos/video-status-badge.tsx — VideoStatusBadge

- **Status:** `drift relevante`
- **Decision:** `auto-Edit`
- **Prior:** _(none)_
- **Specifics:**
  1. "Publicado" é verde no Figma (`bg-[rgba(31,193,107,0.16)]`, texto `#15803d`), mas em disco
     usa `variant="default"`, que com `--primary: #0f0f0f` sai **preto** → passar para
     `variant="success"`. É o drift mais visível da tela: o chip de maior destaque está na cor
     errada, não apenas fora de medida.

---

### components/ui/pagination.tsx — Pagination

- **Status:** `drift menor`
- **Decision:** `auto-Edit`
- **Prior:** _(none)_
- **Specifics:**
  1. `aria-label` fixo em inglês ("Go to previous page" / "Go to next page") num app inteiramente
     pt-BR → derivar do `text` recebido, que a página já passa como "Anterior"/"Próxima".

O rótulo visível já é parametrizável via `text`, então não há drift de conteúdo.

---

## Token global observado (fora do escopo deste SI)

`--border` é `#c6c6c6` em `globals.css`, enquanto o Figma desenha todas as bordas com `#e2e8f0`.
Não abri linha de drift porque o alvo não é um componente: mudar o token atingiria todas as
superfícies com borda do app, inclusive as telas da Fase 02 já entregues e auditadas. Fica
registrado aqui para uma decisão de design system própria.

---

## Screen: edicao-video — audited at SI-04.12.0 (2026-09-22)

**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=41-90

**Quick scan:** 12 componentes (3 alinhado, 7 drift menor, 2 drift relevante, 0 ausente)

**TOC:**
- `components/auth/back-link.tsx` — BackLink — drift menor → exception
- `components/icons/chevron-left-icon.tsx` — ChevronLeftIcon — alinhado → skip
- `components/videos/video-edit-form.tsx` — VideoEditForm — drift menor → exception
- `components/videos/thumbnail-uploader.tsx` — ThumbnailUploader — drift menor → auto-Edit (2 specifics)
- `components/ui/card.tsx` — Card — drift menor → exception
- `components/ui/button.tsx` — Button — alinhado → skip
- `components/ui/label.tsx` — Label — drift menor → exception
- `components/ui/input.tsx` — Input — drift menor → exception
- `components/ui/textarea.tsx` — Textarea — drift relevante → auto-Edit (4 specifics)
- `components/ui/select.tsx` — Select — drift relevante → auto-Edit (4 specifics)
- `components/icons/chevron-down-icon.tsx` — ChevronDownIcon — alinhado → skip
- `components/ui/radio-group.tsx` — RadioGroup — drift menor → auto-Edit (2 specifics)

**Nota de leitura do nó.** O topo do frame (`browser-chrome`: bolinhas de janela e barra de URL
com `streamtube.app/videos/8f2c/edit`) é moldura de apresentação do mock, não UI da aplicação —
não gera linha de drift. Igualmente, a fonte `Manrope` que aparece só no back-link não existe no
projeto (Inter + Geist Mono) e é artefato do arquivo de design, não um alvo a implementar.

**Achado transversal.** `textarea.tsx`, `select.tsx` e `radio-group.tsx` foram instalados na
SI-04.0.1 e **nunca reconciliados** com os tokens do projeto, ao contrário de `input.tsx` e
`button.tsx`, que vieram da Fase 02 já ajustados. `next-frontend-ui.md` § Shadcn primitives exige
essa reconciliação no momento do install: "rewrite the base classes to use this project's tokens
… Drop `dark:` overrides that the semantic tokens already cover". É dívida minha da SI-04.0.1, e
as duas linhas `drift relevante` abaixo são consequência dela.

---

### components/auth/back-link.tsx — BackLink

- **Status:** `drift menor`
- **Decision:** `exception`
- **Prior:** phase-02 signup — `alinhado` → `skip`
- **Justificativa:** o Figma pinta o link de azul (`#3f72af`) e em disco ele é
  `text-muted-foreground`; aplicar a cor aqui mudaria também as telas de auth da Fase 02, que já
  foram auditadas e entregues com o cinza. É decisão de design system, não drift desta tela.

---

### components/icons/chevron-left-icon.tsx — ChevronLeftIcon

- **Status:** `alinhado`
- **Decision:** `skip`
- **Prior:** _(none)_

O tamanho (14px no Figma) é governado pelo consumidor via `size-*`, conforme a regra de ícones.

---

### components/videos/video-edit-form.tsx — VideoEditForm

- **Status:** `drift menor`
- **Decision:** `exception`
- **Prior:** _(none)_
- **Justificativa:** o título "DETALHES DO VÍDEO" é 18px ExtraBold no Figma e em disco usa
  `text-label-lg`; casar o valor exato exigiria um token tipográfico novo para uma única tela,
  enquanto a escala existente já entrega a hierarquia pretendida.

A estrutura bate: rótulos em caixa alta, ordem dos campos, radios "Público"/"Indisponível" e a
linha de ações com `gap-4`. A categoria "Tutoriais" que aparece no mock **não** pertence ao enum
do TD-10 — é a lacuna de design já registrada como Open Question no inventário, não drift.

---

### components/videos/thumbnail-uploader.tsx — ThumbnailUploader

- **Status:** `drift menor`
- **Decision:** `auto-Edit`
- **Prior:** _(none)_
- **Specifics:**
  1. O botão "Alterar thumbnail" ocupa a largura do cartão no Figma; em disco é `w-fit` → `w-full`.
  2. Espaçamento interno do cartão: Figma `gap-[16px]`; em disco `gap-3` (12px) → `gap-4`.

Mantive `aspect-video` em vez da altura fixa de 160px do mock: a proporção é o que o texto de
apoio promete ("16:9 recomendada"), e ela se adapta à largura da coluna.

---

### components/ui/card.tsx — Card

- **Status:** `drift menor`
- **Decision:** `exception`
- **Prior:** phase-02 signup — `alinhado` → `skip`
- **Justificativa:** o Figma usa raio 16px (`--radius-4`) e o Card do DS usa 8px (`--radius-2`);
  trocar o raio base atingiria todos os cartões do app, incluindo os da Fase 02 já auditados.

---

### components/ui/button.tsx — Button

- **Status:** `alinhado`
- **Decision:** `skip`
- **Prior:** phase-02 signup/login — `alinhado` → `skip` (sem CONFLICT)

"Publicar" é `bg-[#0f0f0f]` = `--primary`; "Salvar rascunho" é o `variant="outline"`. As medidas
(`px-24 py-12`) são escolha de `size` na tela.

---

### components/ui/label.tsx — Label

- **Status:** `drift menor`
- **Decision:** `exception`
- **Prior:** phase-02 signup — `alinhado` → `skip`
- **Justificativa:** o Figma pede 13px bold em caixa alta; o `uppercase` já é aplicado no call
  site do formulário, e mudar o peso base do Label mexeria em todos os formulários de auth.

---

### components/ui/input.tsx — Input

- **Status:** `drift menor`
- **Decision:** `exception`
- **Prior:** phase-02 signup/login — `alinhado` → `skip`
- **Justificativa:** o Figma usa raio 10px e `p-12`, contra `--radius-1` (4px) e `px-4 py-1.5` em
  disco. Não há token de 10px e o campo é o mesmo das telas de auth já entregues; alinhar só esta
  tela quebraria a consistência entre formulários.

---

### components/ui/textarea.tsx — Textarea

- **Status:** `drift relevante`
- **Decision:** `auto-Edit`
- **Prior:** _(none)_
- **Specifics:**
  1. `rounded-lg` cru em vez de um token de raio do projeto → `rounded-[var(--radius-2)]`.
  2. `border-input` em vez de `border-border`, e `bg-transparent` em vez de `bg-input-background`
     — é o que `input.tsx` usa.
  3. `text-base` com `md:text-sm` em vez da escala tipográfica do projeto → `text-body-lg`.
  4. Overrides `dark:` (`dark:bg-input/30`, `dark:disabled:bg-input/80`,
     `dark:aria-invalid:border-destructive/50`, `dark:aria-invalid:ring-destructive/40`) que os
     tokens semânticos já resolvem sozinhos → remover.

A altura de 120px do mock vem de `rows`/`min-h` no call site, não do primitivo.

---

### components/ui/select.tsx — Select

- **Status:** `drift relevante`
- **Decision:** `auto-Edit`
- **Prior:** _(none)_
- **Specifics:**
  1. **`min(var(--radius-md),10px)` referencia uma variável que não existe** neste `globals.css`
     (a escala do projeto é `--radius-0-5`…`--radius-6`) → o `min()` cai para o fallback e o raio
     fica indefinido. Trocar por `rounded-[var(--radius-2)]`.
  2. `rounded-lg` cru no trigger e no content → token de raio.
  3. `border-input` / `bg-transparent` → `border-border` / `bg-input-background`.
  4. `text-sm` e os overrides `dark:` → `text-body-lg` e remoção dos `dark:`.

---

### components/icons/chevron-down-icon.tsx — ChevronDownIcon

- **Status:** `alinhado`
- **Decision:** `skip`
- **Prior:** _(none)_

---

### components/ui/radio-group.tsx — RadioGroup

- **Status:** `drift menor`
- **Decision:** `auto-Edit`
- **Prior:** _(none)_
- **Specifics:**
  1. `border-input` → `border-border`, como nos demais campos reconciliados.
  2. Overrides `dark:` (`dark:bg-input/30`, `dark:aria-invalid:border-destructive/50`,
     `dark:data-checked:bg-primary`) que os tokens semânticos já cobrem → remover.

O tamanho bate: `size-4` (16px) é exatamente o círculo do Figma, e o espaçamento horizontal de
24px entre as opções é responsabilidade do formulário.

---

## Screen: edicao-canal — audited at SI-04.13.0 (2026-09-22)

**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=41-141

**Quick scan:** 6 componentes (2 alinhado, 3 drift menor, 1 drift relevante, 0 ausente)

**TOC:**
- `components/channels/channel-edit-form.tsx` — ChannelEditForm — drift relevante → auto-Edit (3 specifics)
- `components/ui/card.tsx` — Card — drift menor → exception
- `components/ui/label.tsx` — Label — drift menor → exception
- `components/ui/input.tsx` — Input — drift menor → exception
- `components/ui/textarea.tsx` — Textarea — alinhado → skip
- `components/ui/button.tsx` — Button — alinhado → skip

**Nota de leitura do nó.** Duas faixas do frame são moldura de apresentação e não UI da
aplicação: o cabeçalho "EDIÇÃO DE CANAL / configurações básicas públicas / ativo" (rótulo do
próprio arquivo de design) e a barra de navegador com `streamtube.app/channel/settings`. Nenhuma
gera linha de drift. O nickname de exemplo `joana.cria` contém ponto e **viola** o allowlist
`^[a-z0-9_]+$` do backend (SI-04.5) — é Open Question já registrada no inventário, não drift.

---

### components/channels/channel-edit-form.tsx — ChannelEditForm

- **Status:** `drift relevante`
- **Decision:** `auto-Edit`
- **Prior:** _(none)_
- **Specifics:**
  1. O `@` do nickname fica **dentro** da caixa com borda no Figma, formando um campo único; em
     disco ele é um `<span>` irmão do `Input`, fora da borda. É diferença estrutural visível, não
     de medida: hoje aparecem duas caixas onde o design mostra uma.
  2. Padding do cartão: Figma `p-[32px]`; em disco `p-6` (24px) → `p-8`.
  3. Espaçamento entre campos: Figma `gap-[20px]`; em disco `gap-6` (24px) → `gap-5`.

A ação "Cancelar" é passada como `children` pela página, então não é drift do componente.

---

### components/ui/card.tsx — Card

- **Status:** `drift menor`
- **Decision:** `exception`
- **Prior:** phase-02 signup — `alinhado` → `skip`; SI-04.12.0 edicao-video — `drift menor` → `exception`
- **Justificativa:** mesma razão registrada na tela de edição de vídeo — o Figma usa raio 16px e
  o Card do DS usa 8px; trocar o raio base atingiria todos os cartões do app.

---

### components/ui/label.tsx — Label

- **Status:** `drift menor`
- **Decision:** `exception`
- **Prior:** phase-02 signup — `alinhado` → `skip`; SI-04.12.0 edicao-video — `drift menor` → `exception`
- **Justificativa:** 13px bold em caixa alta no Figma; o `uppercase` já vem do call site e mudar
  o peso base afetaria todos os formulários de auth.

---

### components/ui/input.tsx — Input

- **Status:** `drift menor`
- **Decision:** `exception`
- **Prior:** phase-02 signup/login — `alinhado` → `skip`; SI-04.12.0 edicao-video — `drift menor` → `exception`
- **Justificativa:** raio 10px e `p-12` no Figma contra `--radius-1` (4px) e `px-4 py-1.5` em
  disco; não há token de 10px e o campo é compartilhado com as telas de auth já entregues.

---

### components/ui/textarea.tsx — Textarea

- **Status:** `alinhado`
- **Decision:** `skip`
- **Prior:** SI-04.12.0 edicao-video — `drift relevante` → `auto-Edit` (**aplicado na SI-04.12a**)

Já reconciliado com os tokens do projeto (`rounded-[var(--radius-2)]`, `border-border`,
`bg-input-background`, `text-body-lg`, sem overrides `dark:`). A altura de 100px do mock vem do
call site, não do primitivo.

---

### components/ui/button.tsx — Button

- **Status:** `alinhado`
- **Decision:** `skip`
- **Prior:** phase-02 signup/login — `alinhado` → `skip`; SI-04.12.0 edicao-video — `alinhado` → `skip` (sem CONFLICT)

"Salvar alterações" é `bg-[#0f0f0f]` = `--primary` com `px-24 py-8`, dentro da escala de `size`.

---

## Screen: pagina-publica-canal — audited at SI-04.14.0 (2026-09-22)

**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=59-2

**Quick scan:** 8 componentes (4 alinhado, 2 drift menor, 2 drift relevante, 0 ausente)

**TOC:**
- `components/layout/site-navbar.tsx` — SiteNavbar — alinhado → skip
- `components/auth/brand-logo.tsx` — BrandLogo — drift relevante → exception
- `components/icons/streamtube-icon.tsx` — StreamTubeIcon — alinhado → skip
- `components/ui/button.tsx` — Button — alinhado → skip
- `components/channels/channel-header.tsx` — ChannelHeader — drift menor → auto-Edit (1 specific)
- `components/ui/avatar.tsx` — Avatar — drift relevante → auto-Edit (1 specific)
- `components/videos/video-card.tsx` — VideoCard — drift menor → auto-Edit (1 specific)
- `components/ui/pagination.tsx` — Pagination — alinhado → skip

**Nota de leitura do nó.** Como no painel, as caixas tracejadas azuis
(`top-decorative-strip`, `main-dashed-container`, `pagination-dashed-box`) são marcação do
arquivo de design, não UI. O nickname `joana.cria` de novo viola o allowlist `^[a-z0-9_]+$` —
Open Question já registrada. O lado direito do navbar traz "Entrar" no lugar do `UserMenu`, o
que o slot `children` do `SiteNavbar` já cobre sem alteração no componente.

---

### components/layout/site-navbar.tsx — SiteNavbar

- **Status:** `alinhado`
- **Decision:** `skip`
- **Prior:** SI-04.11.0 painel-videos — `drift menor` → `auto-Edit` (**aplicado na SI-04.11a**)

O `px-12 py-5` já corresponde ao `px-[48px] py-[20px]` deste frame — é o mesmo navbar.

---

### components/auth/brand-logo.tsx — BrandLogo

- **Status:** `drift relevante`
- **Decision:** `exception`
- **Prior:** phase-02 signup — `alinhado` → `skip`; SI-04.11.0 painel-videos — `drift relevante` → `exception`
- **Justificativa:** mesma marca placeholder do painel ("EstúdioCriador" em caixa azul contra
  "StreamTube"); Open Question de design, não drift de implementação.

---

### components/icons/streamtube-icon.tsx — StreamTubeIcon

- **Status:** `alinhado`
- **Decision:** `skip`
- **Prior:** SI-04.11.0 painel-videos — `alinhado` → `skip` (sem CONFLICT)

---

### components/ui/button.tsx — Button

- **Status:** `alinhado`
- **Decision:** `skip`
- **Prior:** phase-02, SI-04.11.0 e SI-04.12.0 — `alinhado` → `skip` (sem CONFLICT)

"Entrar" é o `variant="outline"` com as mesmas medidas do "Sair" do painel.

---

### components/channels/channel-header.tsx — ChannelHeader

- **Status:** `drift menor`
- **Decision:** `auto-Edit`
- **Prior:** _(none)_
- **Specifics:**
  1. O avatar do canal tem 80px no Figma e o header pede `size="lg"` (40px) — metade do
     tamanho. Passa a `size="xl"`, o degrau acrescentado ao `Avatar` na linha abaixo.

O nome (32px ExtraBold) e a linha `@nickname · N vídeos` (12px) já batem com `text-h2` e
`text-body-md`/`text-caption` dentro da tolerância do DS. O singular "1 vídeo" continua sendo uma
melhoria deliberada sobre o mock, que só mostra o plural.

---

### components/ui/avatar.tsx — Avatar

- **Status:** `drift relevante`
- **Decision:** `auto-Edit`
- **Prior:** SI-04.11.0 painel-videos — `drift menor` → `exception` (36px contra a escala 24/32/40)
- **Specifics:**
  1. Acrescentar o degrau `data-[size=xl]:size-20` (80px) para o avatar-herói do canal.

**Por que aqui eu edito e no painel não:** lá a diferença era de 4px sobre um degrau existente,
e criar um passo de 36px fragmentaria a escala sem ganho perceptível. Aqui o mock pede o dobro do
maior degrau disponível, para um uso estruturalmente diferente — o retrato do canal, não um
adorno de navbar. Não é CONFLICT: as duas decisões tratam de valores e propósitos distintos.

---

### components/videos/video-card.tsx — VideoCard

- **Status:** `drift menor`
- **Decision:** `auto-Edit`
- **Prior:** _(none)_
- **Specifics:**
  1. O Figma escreve as visualizações em notação compacta ("1,2 mil visualizações", "2,4 mil"),
     enquanto em disco o `Intl.NumberFormat("pt-BR")` produz "1.200" → usar
     `notation: "compact"`.

O restante bate: thumbnail `aspect-video` com raio 8px (233×131 é exatamente 16:9), overlay de
duração no canto inferior direito com `bg-overlay` e raio 4px, título 15px com elipse e meta de
12px.

---

### components/ui/pagination.tsx — Pagination

- **Status:** `alinhado`
- **Decision:** `skip`
- **Prior:** SI-04.11.0 painel-videos — `drift menor` → `auto-Edit` (**aplicado na SI-04.11a**)

Mesmo controle do painel, com "Anterior / 1 / Próxima" já em pt-BR.
