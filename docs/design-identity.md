# Identidade Visual — Decisões Aplicadas

Log de decisões de identidade visual do StreamTube, no modelo Revision/Supersede do [Pilar 6](design-system-pillars.md). Complementa — não substitui — os TDs em `docs/decisions/`: decisões que têm consequência de schema, contrato ou biblioteca vivem lá; aqui ficam as de **aparência e copy**, que não mudam nenhuma dessas coisas.

Mantenha leve. Cada entrada: o que ficou decidido, por quê, e onde se aplica.

---

## Fonte única de verdade

**`next-frontend/app/globals.css` é a fonte da verdade de cor, tipografia, forma e espaçamento.** Todo Figma Variable e todo componente deve resolver para um token de lá. Nenhum valor de cor é escolhido no Figma sem existir primeiro no CSS.

Consequência prática: quando Figma e CSS divergem, **o CSS está certo por definição** e o Figma é corrigido — não o contrário. Isso é o Pilar 4 (fonte única alinhada) do guia.

---

## D-01 — A cor primária é monocromática, não azul nem laranja

**Data:** 2026-08-08

**Decisão:** `primary` resolve para `#0f0f0f` em Light e `#ffffff` em Dark. Botões de commit — "Fazer upload", "Publicar", "Salvar", "Redefinir senha", "Entrar" — usam `primary`, nunca uma cor de marca.

**Por quê:** já era assim no `globals.css` desde a Fase 02; a decisão aqui é só **registrar e fazer valer**. As três primeiras telas da Fase 04 montadas no Figma (`painel-videos`, `edicao-video`, `edicao-canal`) tinham inventado duas cores de ação em paralelo — azul no "Fazer upload" e laranja no "Publicar"/"Salvar". As duas estavam erradas, não uma certa e uma errada.

**Regras derivadas:**
- **Azul (`link`) é reservado para navegação** — hiperlink, link inline, voltar. Nunca botão de ação.
- **Vermelho (`destructive`) é reservado para ação destrutiva.** "Publicar" e "Salvar" não são destrutivos.
- Botão secundário — "Salvar rascunho", "Cancelar" — usa `secondary` ou outline sobre `border`.

---

## D-02 — Cores dos chips de status e visibilidade

**Data:** 2026-08-08 · **Registrado também como Revision em** [`video-channel-management/TD-02`](decisions/technical-decisions-video-channel-management.md)

**Decisão:**

| Chip | Eixo (TD-02) | Token |
|---|---|---|
| Publicado | status de publicação | `success` |
| Rascunho | status de publicação | `muted` |
| Público | visibilidade | `muted` |
| Indisponível | visibilidade | `warning` |

**Por quê:** o TD-02 estabeleceu três eixos ortogonais mas não fixou cor por estado — as telas montadas pintaram os quatro chips de rosa/vermelho, o que lê como erro em todos e não distingue nada. `Rascunho` é neutro, não é falha. `Público` é o caso normal, também neutro. `Indisponível` ganha `warning` porque comunica alcance restrito, que é a informação útil ali. Nenhum token novo foi criado.

**Não fazer:** usar `destructive` em chip de status. Nenhum desses estados é erro.

---

## D-03 — "Unlisted" é exibido como "Indisponível"

**Data:** 2026-08-08 · **Registrado também como Revision em** [`video-channel-management/TD-02`](decisions/technical-decisions-video-channel-management.md)

**Decisão:** o enum `visibility` no banco continua `public | unlisted` — sem migration. Muda apenas o rótulo exibido: `unlisted` → **"Indisponível"**.

**Por quê:** manter a UI 100% em português. O termo em inglês era o único resquício estrangeiro nas telas da Fase 04.

---

## D-04 — A UI é em português

**Data:** 2026-08-08

**Decisão:** toda copy de interface em pt-BR. Vale para tela nova, componente novo e qualquer tela existente que for tocada.

**Por quê:** o idioma estava dividido no código e ninguém tinha decidido:

| Fase | Estado hoje | Exemplos |
|---|---|---|
| 02 — auth | **inglês** | `Email address`, `Sign in`, `Create account`, `Forgot password?` |
| 03 — upload | **português** | `Título`, `Arquivo de vídeo`, `Enviar vídeo` |
| 04 — vídeos e canal | português | `Seus vídeos`, `Publicar`, `Indisponível` |

As mensagens de erro vindas do backend sempre foram em português — inclusive dentro das telas em inglês, então hoje o usuário vê tela em inglês com erro em português. O português já era o padrão de facto desde a Fase 03; as telas de auth são a exceção.

**Resolvido em 2026-08-08:** `login-form.tsx`, `signup-form.tsx`, `forgot-password-form.tsx` e os componentes auxiliares (`terms-checkbox`, `password-strength-meter`, `password-visibility-toggle`, `back-link`) traduzidos, junto com os testes que buscavam por texto literal (wiring tests, testes de componente e os três specs e2e de auth) e o helper de login do e2e de upload de vídeo.

**Bug real corrigido no processo:** em `/forgot-password`, o rodapé "Remember your password?" linkava para `/signup` — já sinalizado como inconsistência não resolvida em `docs/inventories/screen-inventory-phase-02-auth-frontend.md` (linha 163) desde 2026-05-14. Corrigido para "Entrar" → `/login`.

**Novo drift em aberto:** o Figma (`FC Tube.fig`) continua em inglês nessas telas — código e Figma agora divergem de idioma. Atualizar o Figma é trabalho futuro, fora do escopo desta tradução.

---

## D-05 — Telas de auth já entregues definem o padrão de formulário

**Data:** 2026-08-08

**Decisão:** formulário novo reusa a composição das telas de auth — `card.tsx` centralizado, `label.tsx` acima do campo, `input.tsx`, `field-error.tsx` abaixo em `destructive-text`, botão `primary` de largura total ao final.

**Por quê:** é o único padrão de formulário que já passou por implementação real e teste no projeto. A tela A-05a (redefinir senha) reusa **7 componentes existentes contra 1 novo** justamente por seguir isso.

---

## D-06 — O card de vídeo nasce com variants

**Data:** 2026-08-08

**Decisão:** `video-card` é desenhado como Component com variants (`size=grid` / `size=list`) desde a primeira tela que o usa, não como quatro cards soltos.

**Por quê:** ele reaparece na sidebar de sugestões (Fase 05), na home e na busca (Fase 07). É o componente de maior alcance ainda não construído. Desenhar solto agora custa três retrabalhos depois — e é exatamente o mecanismo pelo qual a cor volta a divergir.

---

## Pendência estrutural — dois arquivos Figma sem library compartilhada

**Data:** 2026-08-08 · **Não é decisão — é causa raiz a resolver**

As telas de auth vivem em `FC Tube.fig`. As telas da Fase 04 vivem em `Videos` (fileKey `FetKyb1V02WS5D6VCatK6t`), um arquivo **separado**. Se o segundo não estiver consumindo a library publicada do primeiro, os componentes são cópias soltas — e qualquer correção de token deixa de propagar.

Essa é a explicação mais provável para as cores divergentes que originaram D-01 e D-02: não foi escolha errada elemento por elemento, foi ausência de fonte compartilhada.

**A resolver antes de montar as telas restantes:** publicar a library do `FC Tube.fig` e ativá-la dentro do arquivo `Videos`.

---

## Onde estão os desenhos

- [`espoco.html`](../espoco.html) — esboço das 6 telas pendentes (A-01 a A-05) e guia de montagem no Figma.
- [`espoco-telas-restantes.html`](../espoco-telas-restantes.html) — A-04, A-05a e A-05b já especificadas com os tokens reais: elemento por elemento, token de cor, tipografia, componente a reusar ou criar.

Ambos são apoio, não substituem o inventário formal: as telas ainda precisam passar por `/screen-inventory 04` quando o MCP do Figma estiver conectado.
