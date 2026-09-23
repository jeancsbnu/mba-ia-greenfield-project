# phase-04-video-channel-management — Screen Inventory

> **Phase:** 04 — Gerenciamento de Vídeos e Canal
> **Status:** Validated
> **Date:** 2026-09-20
> **Screens in scope:** 4

---

## Screen: Painel de gerenciamento de vídeos do canal

**Route:** `/channel/videos`
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=39-2 (node `FetKyb1V02WS5D6VCatK6t:39:2`)
**Purpose (from project-plan.md):** "Painel de gerenciamento de vídeos do canal (thumbnail, título, visualizações, likes, comentários, tempo de publicação e status)".

### Component inventory

| Component (Figma node)                          | Type              | In DS? | Reuse?                                              | Notes |
|-------------------------------------------------|-------------------|--------|-----------------------------------------------------|-------|
| SiteNavbar (39:4)                               | Presentational    | ✗      | `components/layout/site-navbar.tsx (new)`           | Chrome autenticado: BrandLogo à esquerda, UserMenu à direita; sem estado próprio nem busca/links no Figma; reutilizado nas demais telas da Fase 04 |
| BrandLogo (39:5)                                | Presentational    | ✓      | `components/auth/brand-logo.tsx`                    | Herdado da fase 02 (source: phase-02); Figma mostra wordmark "EstúdioCriador" (ver Observations) |
| StreamtubeIcon (39:7)                           | Presentational    | ✓      | `components/icons/streamtube-icon.tsx`              | Herdado da fase 02; Figma renderiza glifo play como `<img>` dentro do logo-box (39:6) — reusar o componente DS, não o asset |
| UserMenu (39:11)                                | Server-connected  | ✗      | `components/layout/user-menu.tsx (new)`             | Composição Avatar + botão "Sair"; unidade dona da ação de logout (mesmo critério de Form + SubmitButton da fase 02) |
| Avatar (39:12)                                  | Presentational    | ✗      | `components/ui/avatar.tsx (new)`                    | Imagem circular 36px com borda; sem affordance de menu/dropdown no Figma |
| SairButton "Sair" (39:13)                       | Server-connected  | ✓      | `components/ui/button.tsx`                          | Herdado da fase 02 (variante outline/secundária); dispara encerramento de sessão (mutation via Route Handler, BFF estrito) |
| Heading "SEUS VÍDEOS" (39:17)                   | Presentational    | ✗      | new                                                 | `<h1>` puro-DOM; texto já escrito em caixa alta no Figma |
| CreateVideoButton "Criar novo vídeo" (39:18)    | Local-interactive | ✓      | `components/ui/button.tsx`                          | Herdado da fase 02; navegação client-side (Next.js `<Link>`) para `/upload` (rota da Fase 03 já implementada); não dispara mutation |
| PlusIcon (39:19)                                | Presentational    | ✗      | `components/icons/plus-icon.tsx (new)`              | Ícone "+" 14px; Figma renderiza como `<img>` (39:20) |
| VideoTable (39:23)                              | Server-connected  | ✗      | `components/videos/video-table.tsx (new)`           | Lista de vídeos do canal com dados vindos do servidor (offset/limit, TD-06); cabeçalho + linhas; última coluna de ações com o botão "Editar" por linha (EditVideoButton) |
| TableHead (39:24)                               | Presentational    | ✗      | new                                                 | Cabeçalhos estáticos: VÍDEO, VISIBILIDADE, STATUS, VIEWS, LIKES, COMENT., PUBLICAÇÃO; sem affordance de ordenação; sub-parte de VideoTable |
| VideoRow (39:32, 39:48, 39:64)                  | Presentational    | ✗      | new                                                 | Sub-componente interno de VideoTable (3 instâncias: publicado/público, publicado/indisponível, rascunho); recebe props do pai; o título não é link — a affordance de edição é o botão "Editar" da última coluna |
| VideoThumbnail (39:34, 39:50, 39:66)            | Presentational    | ✗      | new                                                 | `<img>` 100x56 com cantos 8px |
| VideoTitle (39:36, 39:52, 39:68)                | Presentational    | ✗      | new                                                 | Texto em negrito com ellipsis (truncado); não é link no Figma |
| VideoDuration (39:37, 39:53, 39:69)             | Presentational    | ✗      | new                                                 | Texto `m:ss` sob o título (8:12, 14:47, 5:30) |
| Badge / pill (39:39, 39:42, 39:55, 39:58, 39:71, 39:74) | Presentational | ✗  | `components/ui/badge.tsx (new)`                     | Primitive pill 100px de raio, usada pelos badges de visibilidade e status |
| VideoVisibilityBadge (39:38)                    | Presentational    | ✗      | `components/videos/video-visibility-badge.tsx (new)`| Valores no Figma: "Público" (muted), "Indisponível" (warning), "—" (muted, linha de rascunho); rótulo de `unlisted` = "Indisponível" (TD-02) |
| VideoStatusBadge (39:41)                        | Presentational    | ✗      | `components/videos/video-status-badge.tsx (new)`    | Valores no Figma: "Publicado" (success), "Rascunho" (muted); apenas exibição |
| VideoMetricCells (39:44, 39:45, 39:46)          | Presentational    | ✗      | new                                                 | Views, likes e comentários alinhados à direita (formato pt-BR "1.284"); "—" em rascunho; contadores denormalizados (TD-05), zeros até Fases 05/06 |
| PublishedAtCell (39:47)                         | Presentational    | ✗      | new                                                 | Data absoluta "28 jul 2026"; "—" em rascunho (`published_at` nulo, TD-02) |
| EditVideoButton "Editar" (62:42, 62:44, 62:46)  | Local-interactive | ✓      | `components/ui/button.tsx`                          | Botão outline pequeno (70×32) na última coluna de cada linha, adicionado em 2026-09-20 para cobrir "Edição de vídeos a partir do painel"; navegação client-side (Next.js `<Link>`) para `/videos/{publicId}/edit` (TD-09), sem mutation. A coluna não tem rótulo de cabeçalho: o nome acessível deve incluir o título ("Editar {título}") |
| Pagination (39:81)                              | Local-interactive | ✗      | `components/ui/pagination.tsx (new)`                | "Anterior", página "1", "Próxima"; navegação por URL (Next.js `<Link>`/search param, TD-06 offset/limit com total) sem I/O próprio — a busca do recorte é feita por quem renderiza a listagem (VideoTable). Classificação alinhada com a Página pública do canal |

### Verbs of intent

| Verb                                                                                                                         | Component                          | Capability (project-plan.md)                                                                                                        |
|------------------------------------------------------------------------------------------------------------------------------|------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| Exibir lista paginada de vídeos do canal com thumbnail, título, duração, visibilidade, status, contadores e data de publicação | VideoTable (39:23) + Pagination (39:81) | "Painel de gerenciamento de vídeos do canal (thumbnail, título, visualizações, likes, comentários, tempo de publicação e status)"   |
| Encerrar a sessão do usuário autenticado                                                                                     | UserMenu (39:11) + SairButton (39:13) | "Logout" (capability herdada da Fase 02, diferida para este chrome autenticado; fora das 8 capabilities da Fase 04) |

### Observations

- **Edição de vídeos a partir do painel (gap resolvido em 2026-09-20):** a extração original não tinha nenhuma affordance para abrir a tela de edição (linhas, título e thumbnail eram estáticos). O usuário pediu e o Figma recebeu um botão outline "Editar" na última coluna de cada linha (nós 62:42, 62:44, 62:46), com as demais colunas redistribuídas para abrir espaço. O componente foi inventariado manualmente na tabela acima, sem redespachar sub-agent. Continuam sem desenho: estado hover/foco do botão e cabeçalho da coluna.
- **Gap de design (Fluxo de rascunho → publicação):** a linha de rascunho (39:64) mostra o badge "Rascunho", mas não há ação de publicar. Confirmar se a publicação fica só na tela de edição; TD-02 só permite publicar com `status = ready`.
- **Gap de design (estados de `status`):** o Figma só mostra "Publicado" e "Rascunho" (derivados de `published_at`). O eixo `status` de ciclo de vida do worker (por exemplo em processamento, falha) não tem variant no painel. Falta definir como um vídeo em processamento ou com falha aparece (badge próprio, ou coluna/linha desabilitada).
- **Gap de design (visibilidade em rascunho):** o badge de visibilidade da linha de rascunho mostra "—" (39:72) em pill muted. Como `visibility` é um eixo independente (TD-02), confirmar se rascunho oculta a visibilidade ou se existe um valor padrão a exibir.
- **Gap de design (estados vazio/erro/carregando):** não há empty state ("nenhum vídeo ainda"), loading nem erro de listagem. Também falta o estado de Pagination com uma única página ou com Anterior/Próxima desabilitados (no Figma só aparece "1" ativo).
- **Colunas vs. capability:** a coluna "PUBLICAÇÃO" mostra data absoluta ("28 jul 2026"), enquanto a capability diz "tempo de publicação". Confirmar se o formato é absoluto ou relativo ("há 2 dias").
- **Drift de marca:** o wordmark do BrandLogo no Figma é "EstúdioCriador", diferente da marca já implementada em `components/auth/brand-logo.tsx` (herdado da fase 02). Reusar o componente DS existente e confirmar o nome da marca com o design (ver `docs/design-identity.md`).
- **Origem da imagem do Avatar:** o avatar (39:12) mostra uma foto, mas nenhuma capability da Fase 04 cobre avatar de usuário/canal (só nickname, nome e descrição). Confirmar a fonte da imagem (placeholder, iniciais ou upload futuro).
- **Logout (39:13):** "Sair" pertence à capability "Logout" da Fase 02, diferida para o chrome autenticado (já registrada como pendência no inventário `phase-02-auth-frontend`). Decisão do usuário (2026-09-20): manter o verbo nesta tela citando essa capability como **herdada**; a rota BFF `POST /api/auth/logout` já existe e só falta ligar o botão. O `plan-validate` deve tratar o verbo como pendência herdada, não como capability da Fase 04.
- **Reuso cross-tela:** SiteNavbar, UserMenu, Avatar, Badge, VideoStatusBadge, VideoVisibilityBadge e Pagination seguem a tabela canônica de paths e são idênticos nos demais inventários da Fase 04.
- **Elementos de mock, não inventariados:** `top-decorative-strip` (39:3), `main-dashed-container` (39:15, borda tracejada azul com fundo translúcido) e `pagination-dashed-box` (39:81). Este último tem o mesmo estilo tracejado azul do container principal, então provavelmente é um destaque do mock e não borda de produto. Apenas o conteúdo (Anterior / 1 / Próxima) foi inventariado. Nenhum browser-chrome, window-dots, url-bar ou `figma-header` aparece neste node.
- **Conteúdo de exemplo:** títulos, contadores e datas são dados de exemplo do mock, não copy fixa.
- **Texto e ícones:** os textos exibidos já estão em pt-BR, consistente com a decisão D-04 de `docs/design-identity.md`. Os assets de ícone (play, plus) e as thumbnails vêm como `<img>` remoto do Figma e devem ser trocados por componentes de ícone e pela URL real da thumbnail.
- **Screenshot vs. `get_design_context`:** nenhum componente visível no screenshot está ausente de `get_design_context`.
- **Cobertura da Fase 04 nesta tela:** só o "Painel de gerenciamento de vídeos do canal" (exibição, paginação) tem entrada na tabela de verbs. As demais capabilities da fase são cobertas por outras telas.

---

## Screen: Tela de edição de vídeo

**Route:** `/videos/{publicId}/edit`
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=41-90 (node `FetKyb1V02WS5D6VCatK6t:41:90`)
**Purpose (from project-plan.md):** "Edição das informações do vídeo: título, descrição, categoria e thumbnail customizada" (com o "Fluxo de rascunho → publicação" acionado pelos botões "Salvar rascunho" e "Publicar").

### Component inventory

| Component (Figma node)                          | Type              | In DS? | Reuse?                                          | Notes |
|-------------------------------------------------|-------------------|--------|-------------------------------------------------|-------|
| VideoEditForm (41:111)                          | Server-connected  | ✗      | `components/videos/video-edit-form.tsx (new)`   | Form como unidade (react-hook-form + Zod): recebe valores atuais do vídeo e submete edição/publicação; wrapper "right-column" do Figma. Sem validação de campos desenhada (ver Observations) |
| BackLink "Voltar para o painel" (41:99)         | Local-interactive | ✓      | `components/auth/back-link.tsx`                 | Navegação client-side (Next.js `<Link>`) de volta ao painel; reuso da fase 02 (source: phase-02) |
| ChevronLeftIcon (41:100 / 41:215)               | Presentational    | ✗      | `components/icons/chevron-left-icon.tsx (new)`  | Ícone interno do BackLink; difere do `arrow-back-icon.tsx` existente (chevron vs seta) |
| ThumbnailUploader (41:104)                      | Server-connected  | ✗      | `components/videos/thumbnail-uploader.tsx (new)`| Coluna esquerda: preview + botão "Alterar thumbnail" + helper; envia thumbnail customizada como multipart (TD-03); exibe a URL única já resolvida (TD-04), sem lógica auto-vs-custom no front |
| ThumbnailCard (41:105)                          | Presentational    | ✓      | `components/ui/card.tsx`                        | Container do card "Thumbnail atual"; reuso da fase 02 (source: phase-02) |
| Heading "Thumbnail atual" (41:106)              | Presentational    | ✗      | new                                             | Título de card puro-DOM |
| ThumbnailPreview (41:107)                       | Presentational    | ✗      | new                                             | `<img>` 16:9 (160px de altura) alimentado pela URL de thumbnail resolvida pela API (TD-04) |
| Button "Alterar thumbnail" (41:108)             | Local-interactive | ✓      | `components/ui/button.tsx`                      | Variante outline; apenas abre o seletor de arquivo. O envio da imagem é despachado pelo ThumbnailUploader, não pelo botão |
| Helper text thumbnail (41:110)                  | Presentational    | ✗      | new                                             | `<p>` puro-DOM: "Auto-gerada ou personalizada - 16:9 recomendada" (texto estático) |
| Heading "DETALHES DO VÍDEO" (41:112)            | Presentational    | ✗      | new                                             | Título da seção do form, puro-DOM |
| TitleField (41:113)                             | Presentational    | ✗      | new                                             | Composição FormLabel + Input |
| FormLabel "TÍTULO" (41:114)                     | Presentational    | ✓      | `components/ui/label.tsx`                       | Reuso da fase 02 (source: phase-02) |
| Input "Título" (41:115)                         | Local-interactive | ✓      | `components/ui/input.tsx`                       | Controlado via react-hook-form; pré-preenchido com o título atual |
| DescriptionField (41:117)                       | Presentational    | ✗      | new                                             | Composição FormLabel + Textarea |
| FormLabel "DESCRIÇÃO" (41:118)                  | Presentational    | ✓      | `components/ui/label.tsx`                       | Reuso da fase 02 (source: phase-02) |
| Textarea "Descrição" (41:119)                   | Local-interactive | ✗      | `components/ui/textarea.tsx (new)`              | Campo multilinha (120px) controlado via react-hook-form; primitive DS ainda não autorada |
| CategoryField (41:121)                          | Presentational    | ✗      | new                                             | Composição FormLabel + Select |
| FormLabel "CATEGORIA" (41:122)                  | Presentational    | ✓      | `components/ui/label.tsx`                       | Reuso da fase 02 (source: phase-02) |
| Select "Categoria" (41:123)                     | Local-interactive | ✗      | `components/ui/select.tsx (new)`                | Opções vêm de enum estático tipado via openapi (TD-01/TD-10), sem fetch em runtime: sem backend ele continuaria funcionando |
| ChevronDownIcon (41:218)                        | Presentational    | ✗      | `components/icons/chevron-down-icon.tsx (new)`  | Ícone decorativo interno do Select |
| VisibilityField (41:126)                        | Presentational    | ✗      | new                                             | Composição FormLabel + RadioGroup |
| FormLabel "VISIBILIDADE" (41:127)               | Presentational    | ✓      | `components/ui/label.tsx`                       | Reuso da fase 02 (source: phase-02); rotula o grupo de radios |
| RadioGroup (41:128)                             | Local-interactive | ✗      | `components/ui/radio-group.tsx (new)`           | Estado local do form; dois itens (`public` \| `unlisted`, TD-02) |
| RadioItem "Público" (41:129)                    | Local-interactive | ✗      | `components/ui/radio-group.tsx (new)`           | Item do RadioGroup; ícone Ellipse 41:130 é só a renderização do estado selecionado no mock |
| RadioItem "Indisponível" (41:132)               | Local-interactive | ✗      | `components/ui/radio-group.tsx (new)`           | Item do RadioGroup; label "Indisponível" = UI label de `unlisted` (TD-02, Revision 2026-08-08); Ellipse 41:133 |
| ActionsRow (41:135)                             | Presentational    | ✗      | new                                             | Wrapper de layout flex dos três controles de ação |
| Button "Salvar rascunho" (41:136)               | Server-connected  | ✓      | `components/ui/button.tsx`                      | Variante secondary/outline; submit do form que persiste as edições mantendo o vídeo como rascunho |
| Button "Publicar" (41:138)                      | Server-connected  | ✓      | `components/ui/button.tsx`                      | Variante primary; submit do form que publica o vídeo (só permitido com status = ready; backend rejeita caso contrário, TD-02) |
| Link "Cancelar" (41:140)                        | Local-interactive | ✗      | new                                             | Link inline sublinhado; navegação client-side (Next.js `<Link>`) para o painel, sem mutation |

### Verbs of intent

| Verb                                                                                           | Component                                     | Capability (project-plan.md)                                                                                   |
|------------------------------------------------------------------------------------------------|-----------------------------------------------|----------------------------------------------------------------------------------------------------------------|
| Exibir informações atuais do vídeo (título, descrição, categoria, visibilidade e thumbnail) para edição | VideoEditForm (41:111) + ThumbnailUploader (41:104) | "Edição de vídeos a partir do painel"                                                                          |
| Atualizar título e descrição do vídeo                                                          | VideoEditForm (41:111)                        | "Edição das informações do vídeo: título, descrição, categoria e thumbnail customizada"                        |
| Selecionar a categoria do vídeo entre as categorias disponíveis                                | VideoEditForm (Select 41:123)                 | "Categorias de vídeo disponíveis na plataforma"                                                                |
| Definir a visibilidade do vídeo como público ou indisponível (unlisted)                        | VideoEditForm (RadioGroup 41:128)             | "Visibilidade do vídeo: público (aparece para todos) ou unlisted (somente via link)"                           |
| Substituir a thumbnail do vídeo por uma imagem personalizada                                   | ThumbnailUploader (41:104)                    | "Edição das informações do vídeo: título, descrição, categoria e thumbnail customizada"                        |
| Salvar as alterações do vídeo mantendo-o como rascunho                                         | Button "Salvar rascunho" (41:136)             | "Fluxo de rascunho → publicação"                                                                               |
| Publicar o vídeo                                                                               | Button "Publicar" (41:138)                    | "Fluxo de rascunho → publicação"                                                                               |

### Observations

- Elementos de mock, não inventariados: `browser-chrome` (41:91), `window-dots` (41:92) e `url-bar` (41:96) são scaffolding do frame de design. A url-bar mostra `streamtube.app/videos/8f2c/edit`, o que confirma a rota (o `8f2c` é só um `publicId` ilustrativo).
- Form como unidade: `VideoEditForm` é Server-connected por combinar validação local e submissão (regra da skill); `Salvar rascunho` e `Publicar` também são Server-connected porque despacham a mutation. `Alterar thumbnail` é Local-interactive (só abre o seletor de arquivo; o envio fica no ThumbnailUploader), na mesma lógica do "confirm dialog que envolve a server action sem executá-la".
- Select de categoria classificado como Local-interactive com base em TD-01/TD-10 (enum estático tipado via openapi, sem fetch em runtime). O verb de categoria é atribuído ao form porque o valor escolhido é submetido junto com ele.
- **Drift de dados no mock:** o Select exibe "Tutoriais" (41:124), que não pertence ao enum decidido em TD-01/TD-10 (Música, Jogos, Educação, Entretenimento, Notícias, Esportes, Tecnologia, Outros). Tratar como valor ilustrativo; atualizar o Figma ou confirmar se o enum precisa ser revisto.
- Interação (open question): o Figma não mostra o momento do upload da thumbnail. Pode ser envio imediato ao escolher o arquivo ou envio junto com o submit do form (multipart, TD-03). Também não há estado de preview do arquivo recém-escolhido, progresso ou erro de tipo/tamanho/proporção. Isso decide se o ThumbnailUploader tem mutation própria ou só alimenta o form.
- Open question (ciclo de vida): só o estado de rascunho está desenhado (`Salvar rascunho` + `Publicar`). Faltam variantes para vídeo já publicado (por exemplo "Salvar alterações" ou "Despublicar") e para vídeo com status ≠ ready, onde `Publicar` deve ficar bloqueado (TD-02). Não há indicador do estado atual (rascunho/publicado, processando/falhou) nem estado disabled do botão.
- Design gap: não há superfície de erro, loading nem feedback (erros de validação de título/descrição, falha de mutation, confirmação de "salvo/publicado", botão em progresso). Mesmo gap já registrado nas telas de auth da fase 02.
- A11y: os radios são renderizados como imagens (Ellipse 41:130 e 41:133), então a implementação precisa de semântica nativa de radio (`role="radiogroup"` rotulado por "VISIBILIDADE", navegação por setas). Os `input`/`select` do Figma são `div` com texto, então labels e `for`/`id` precisam ser ligados no código. Os chevrons (41:100 e 41:218) são decorativos (`alt=""`).
- Interação: o `Cancelar` e o BackLink "Voltar para o painel" levam ao mesmo destino (painel). Não há desenho de confirmação para alterações não salvas.
- Reuso: `BackLink` é herdado da fase 02 e vive em `components/auth/`. Aqui ele aparece com ícone chevron-left e destino no painel, então ícone e destino precisam ser parametrizáveis. Mover para um diretório compartilhado fica como tarefa separada. Tipografia e caixa dos labels (Inter bold em caixa alta, 13px) diferem dos `FormLabel` da fase 02, o que pode exigir uma variante ou classe.
- Reuso: `Textarea`, `Select` e `RadioGroup` são primitives planejadas em `components/ui/` (ver a tabela de caminhos canônicos). Os ícones `chevron-left-icon` e `chevron-down-icon` são novos; `arrow-back-icon.tsx` não os cobre.
- Escopo da capability "Edição de vídeos a partir do painel": esta tela é o destino da rota dedicada (TD-09) e o primeiro verbo da tabela (carregar o vídeo escolhido no painel para edição) foi remapeado para essa capability por decisão do usuário (2026-09-20), já que navegação (`<Link>`) é Local-interactive e não gera verbo. O ponto de entrada no painel é o botão "Editar" de cada linha (EditVideoButton, adicionado ao Figma em 2026-09-20; ver Painel).
- Nenhum chrome global (SiteNavbar/UserMenu) aparece no frame nem no `get_design_context`. Se o layout autenticado deve envolver esta rota, o design é omisso.
- Nenhum componente visível no screenshot está ausente de `get_design_context`.

---

## Screen: Tela de edição do canal

**Route:** `/channel/settings`
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=41-141 (node `FetKyb1V02WS5D6VCatK6t:41:141`)
**Purpose (from project-plan.md):** "Edição das informações do canal: nickname, nome e descrição".

### Component inventory

| Component (Figma node)                          | Type              | In DS? | Reuse?                                            | Notes |
|-------------------------------------------------|-------------------|--------|---------------------------------------------------|-------|
| ChannelEditForm (41:156 conteúdo: fields 41:158 + actions-row 41:173) | Server-connected | ✗ | `components/channels/channel-edit-form.tsx (new)` | Form como unidade (react-hook-form + Zod, mutation via Route Handler); o Figma não tem um nó `<form>` dedicado, o form agrupa `form-fields` e `actions-row` dentro do card |
| Card "editar-canal-card" (41:156)               | Presentational    | ✓      | `components/ui/card.tsx`                          | Container do formulário (520px); mesmo componente do auth, ver phase-02 |
| Heading "EDITAR CANAL" (41:157)                 | Presentational    | ✗      | new                                               | `<h1>` puro-DOM (texto em caixa alta) |
| NicknameField (41:159)                          | Presentational    | ✗      | new                                               | Composição FormLabel + input com prefixo + helper text |
| FormLabel "NICKNAME" (41:160)                   | Presentational    | ✓      | `components/ui/label.tsx`                         | see screen: Tela de edição de vídeo |
| Input nickname com prefixo (41:161)             | Local-interactive | ✓      | `components/ui/input.tsx`                         | Controlado via react-hook-form; valor de exemplo "joana.cria". Ver Observations sobre o prefixo "@" e a allowlist |
| Prefixo "@" (41:162)                            | Presentational    | ✗      | new                                               | Adorno textual puro-DOM dentro do `input-prefixed`; o DS `Input` não tem variante com prefixo confirmada |
| Helper text "Único e global para o sistema" (41:164) | Presentational | ✗      | new                                               | `<p>` puro-DOM estático |
| NameField (41:165)                              | Presentational    | ✗      | new                                               | Composição FormLabel + Input |
| FormLabel "NOME DO CANAL" (41:166)              | Presentational    | ✓      | `components/ui/label.tsx`                         | see screen: Tela de edição de vídeo |
| Input nome do canal (41:167)                    | Local-interactive | ✓      | `components/ui/input.tsx`                         | Controlado via react-hook-form; valor de exemplo "Joana Cria" |
| DescriptionField (41:169)                       | Presentational    | ✗      | new                                               | Composição FormLabel + Textarea |
| FormLabel "DESCRIÇÃO" (41:170)                  | Presentational    | ✓      | `components/ui/label.tsx`                         | see screen: Tela de edição de vídeo |
| Textarea descrição (41:171)                     | Local-interactive | ✗      | `components/ui/textarea.tsx (new)`                | see screen: Tela de edição de vídeo; altura 100px |
| SaveButton "Salvar alterações" (41:174)         | Server-connected  | ✓      | `components/ui/button.tsx`                        | Submit do form; dispara a mutation de edição do canal |
| Link "Cancelar" (41:176)                        | Local-interactive | ✗      | new                                               | Navegação client-side (Next.js `<Link>`), sem I/O; destino não definido no Figma (ver Observations) |

### Verbs of intent

| Verb                                                                          | Component                                  | Capability (project-plan.md)                                          |
|-------------------------------------------------------------------------------|--------------------------------------------|-----------------------------------------------------------------------|
| Exibir informações atuais do canal (nickname, nome e descrição) para edição   | ChannelEditForm (41:156)                   | "Edição das informações do canal: nickname, nome e descrição"         |
| Salvar alterações de nickname, nome e descrição do canal                      | ChannelEditForm + SaveButton (41:174)      | "Edição das informações do canal: nickname, nome e descrição"         |

### Observations

- **Elementos de mock (não inventariados como componentes de produto):** a faixa `figma-header` (41:142) com o título "EDIÇÃO DE CANAL" (41:143), o subtítulo "configurações básicas públicas" (41:145) e o badge "ativo" (41:146), e a faixa `browser-chrome` (41:148) com `window-dots` (41:149) e `url-bar` (41:153). O `figma-header` é anotação do mock: repete o título da tela e o badge "ativo" não tem função de produto. O `browser-chrome` é moldura de navegador simulada. A única informação útil do `url-bar` é o texto "streamtube.app/channel/settings", que confirma a rota. O `workspace` (41:155) é só um wrapper de layout do mock.
- **Sem navbar nem navegação de volta:** confirmado. O frame não tem navbar, menu de usuário, breadcrumb nem back-arrow, e o único caminho de saída é o link "Cancelar". O `components/layout/site-navbar.tsx (new)` e o `components/layout/user-menu.tsx (new)` planejados para a fase não aparecem nesta tela. Decidir se `/channel/settings` renderiza o chrome autenticado global ou se o design está incompleto.
- **Destino do "Cancelar" (41:176) indefinido:** o Figma não diz para onde ele navega. As opções plausíveis são a página pública `/@{nickname}` (TD-08), o painel de vídeos do canal ou `router.back()`. Está classificado como Local-interactive por ser só navegação client-side; o destino precisa ser fechado antes do implement.
- **Estados ausentes no Figma:** o frame mostra apenas o estado preenchido/default. Não há erro inline por campo (nickname já em uso, formato inválido, nome vazio), alerta de erro de form, loading/disabled do botão "Salvar alterações", feedback de sucesso, estados de foco e hover, nem contador ou limite de caracteres da descrição. É o mesmo gap registrado no inventário da phase-02. Decidir se o implement infere o padrão de erro/loading/sucesso do DS de auth ou se o designer produz as variants.
- **Inconsistência de dado de exemplo com a allowlist do nickname:** o valor "joana.cria" (41:163) contém ponto, mas a allowlist herdada (TD-07 desta fase, `[a-z0-9_]`, herdada de phase-02-auth/TD-10) não permite ponto. É dado de mock, não regra, mas o design ilustra um valor inválido. Confirmar com o designer trocar o exemplo (por exemplo `joana_cria`) e usar a allowlist como fonte de validação Zod.
- **Impacto da troca de nickname na URL pública (TD-07 + TD-08):** mudar o nickname muda a URL pública `/@{nickname}`. O design só traz o helper "Único e global para o sistema" e não tem aviso nem confirmação sobre a troca do link público. O helper cobre a unicidade, mas não há affordance de checagem de disponibilidade (spinner ou "disponível") no campo. Presume-se que a checagem ocorra no submit, com erro por conflito exibido inline, mas o design não mostra esse erro. Registrar como open question.
- **Prefixo "@" (41:162):** hoje é um `<p>` dentro do container `input-prefixed`, sem componente próprio. Se o DS `Input` (`components/ui/input.tsx`) não suportar adorno de prefixo, o nickname exigirá uma composição local ou uma extensão do `Input`. O implement deve decidir isso sem criar uma primitive nova fora da tabela canônica.
- **Verbo de leitura:** o form já vem preenchido com os dados atuais do canal (nickname, nome e descrição). Isso implica um verbo de leitura, e por isso o "Exibir informações atuais…" foi incluído. Ele mapeia à mesma capability única de edição.
- **Cobertura da capability:** os dois verbos mapeiam apenas para "Edição das informações do canal: nickname, nome e descrição". Não há upload de avatar nem de banner nesta tela, e a capability não os exige.
- **Locale:** os textos do Figma já estão em pt-BR, consistente com a decisão D-04 de `docs/design-identity.md`. Os rótulos em caixa alta ("NICKNAME", "NOME DO CANAL", "DESCRIÇÃO") são estilo de design, não conteúdo.
- **Screenshot vs `get_design_context`:** nenhum componente visível no screenshot está ausente do `get_design_context`.

---

## Screen: Página pública do canal

**Route:** `/@{nickname}`
**Figma:** https://www.figma.com/design/FetKyb1V02WS5D6VCatK6t/Videos?node-id=59-2 (node `FetKyb1V02WS5D6VCatK6t:59:2`)
**Purpose (from project-plan.md):** "Página pública do canal com informações e listagem de vídeos".

### Component inventory

| Component (Figma node) | Type | In DS? | Reuse? | Notes |
|---|---|---|---|---|
| SiteNavbar (59:4) | Presentational | ✗ | `components/layout/site-navbar.tsx (new)` | see screen: Painel de gerenciamento de vídeos do canal; aqui em estado anônimo (BrandLogo + "Entrar"). Navbar completo (busca, variante autenticada) é escopo da Fase 07; ver Observations |
| BrandLogo (59:5) | Presentational | ✓ | `components/auth/brand-logo.tsx` | see screen: Painel de gerenciamento de vídeos do canal; no Figma é um frame comum "brand-logo", não uma instância do DS |
| StreamtubeIcon (59:6, logo-box + play 59:7/59:8) | Presentational | ✓ | `components/icons/streamtube-icon.tsx` | see screen: Painel de gerenciamento de vídeos do canal |
| LoginButton "Entrar" (59:13) | Local-interactive | ✓ | `components/ui/button.tsx` | Renderizado como Next.js `<Link>` para `/login` com aparência outline. Não dispara mutation. Layer chama-se "sair-button" (herdada de outra tela) |
| ChannelHeader (59:16 nome, 59:85 avatar, 59:86 meta, 59:87 divider) | Server-connected | ✗ | `components/channels/channel-header.tsx (new)` | Faixa de cabeçalho do canal. Não existe um frame único no Figma: os elementos são irmãos absolutos dentro de `main-dashed-container`. Renderiza dados do canal buscados no servidor (nome, nickname, avatar, total de vídeos) |
| Avatar "channel-avatar" (59:85) | Presentational | ✗ | `components/ui/avatar.tsx (new)` | see screen: Painel de gerenciamento de vídeos do canal; aqui 80×80, sem variante de fallback (iniciais) no Figma |
| Heading "Joana Cria" (59:17) | Presentational | ✗ | new | `<h1>` puro-DOM com o nome do canal (32px extra-bold) |
| ChannelMeta "@joana.cria · 42 vídeos" (59:86) | Presentational | ✗ | new | `<p>` puro-DOM: `@{nickname} · {total} vídeos` |
| Divider (59:87) | Presentational | ✗ | new | Linha de 1px (`<hr>`/borda) |
| VideoCard (59:88 componente principal; instâncias 59:94, 59:100, 59:106, 59:112, 59:118, 59:124, 59:130, 59:136) | Server-connected | ✗ | `components/videos/video-card.tsx (new)` | Componente Figma real, reutilizável nas Fases 05 (sugestões) e 07 (home/busca). Classificado uma vez; as 8 instâncias referenciam esta linha. Exibe dados de vídeo vindos do backend |
| Thumbnail (I59:94;59:89) | Presentational | ✗ | new | Imagem 233×131, raio 8px, dentro do VideoCard (`next/image`). Idêntica nas 8 instâncias |
| DurationBadge (I59:94;59:90 fundo + I59:94;59:91 texto "8:12") | Presentational | ✗ | `components/ui/badge.tsx (new)` | see screen: Painel de gerenciamento de vídeos do canal; aqui em variante overlay escuro (`rgba(15,15,15,0.82)`) sobre a thumbnail. Fundo e texto são nós irmãos no Figma; implementar como um único elemento |
| VideoTitle (I59:94;59:92) | Presentational | ✗ | new | `<p>`/`<h3>` puro-DOM, 15px bold, uma linha com `text-ellipsis` |
| VideoMeta "visualizações · há X" (I59:94;59:93) | Presentational | ✗ | new | `<p>` puro-DOM, 12px, com ellipsis |
| Pagination (59:80 wrapper, 59:81 caixa) | Local-interactive | ✗ | `components/ui/pagination.tsx (new)` | see screen: Painel de gerenciamento de vídeos do canal; "Anterior 1 Próxima" alinhada à direita, navega por URL (TD-06 offset/limit). Ver Observations |

### Verbs of intent

| Verb | Component | Capability (project-plan.md) |
|---|---|---|
| Exibir informações públicas do canal (nome, nickname, avatar e total de vídeos) | ChannelHeader (59:16) | "Página pública do canal com informações e listagem de vídeos" |
| Exibir lista paginada de vídeos publicados e públicos do canal | VideoCard (59:88) | "Página pública do canal com informações e listagem de vídeos" |

### Observations

- **Estados ausentes no design.** O frame mostra só o estado "feliz" e anônimo. Não há estado vazio (canal sem vídeos publicados), loading/skeleton, canal não encontrado (nickname inexistente em `/@{nickname}`, TD-08) nem erro de carregamento. Os estados vazio e not-found precisam ser desenhados ou inferidos no implement.
- **Páginas de vídeo e canal.** O design não mostra affordance de clique ou hover no VideoCard nem destino de navegação. A página de vídeo é escopo da Fase 05, então nenhum verb de navegação foi gerado.
- **Descrição do canal ausente.** A capability "Edição das informações do canal: nickname, nome e descrição" torna a descrição um dado do canal, mas a página pública só exibe avatar, nome, `@nickname` e total de vídeos. Decidir se a descrição aparece na faixa do cabeçalho e ser incluída no design.
- **Paginação (TD-06).** O design mostra apenas "Anterior 1 Próxima", com os itens como texto puro. Não há variantes de página atual, desabilitado (Anterior na página 1), hover ou elipse para muitos números. Também não há total de resultados visível. O meta diz 42 vídeos e a grade mostra 8 por página (4 colunas × 2 linhas), o que daria 6 páginas, mas só existe a "1" (dado de mock inconsistente). Tamanho de página = 8 é inferido do design; confirmar contra TD-06.
- **Caixa tracejada da paginação.** A caixa (59:81) usa o mesmo tracejado azul e fundo tintado do `main-dashed-container`. Provavelmente é marcação de mock (placeholder) e não visual final; confirmar antes de replicar.
- **Contagem "42 vídeos" e TD-02.** A contagem do meta e o total da paginação devem refletir apenas vídeos publicados e públicos, como a listagem. Rascunhos e unlisted/"Indisponível" ficam fora, acessíveis só por link direto.
- **Elementos de mock, não inventariados.** `top-decorative-strip` (59:3) e a borda tracejada externa `main-dashed-container` (59:15, incluindo o fundo tintado) são andaime do mock. O frame (1100×1024, raio 24px) não tem faixa de browser-chrome. Também há espaço vazio abaixo da paginação e nenhum rodapé desenhado.
- **Navbar e escopo (Fase 07).** O Figma mostra só logo + "Entrar". O header/navbar completo (busca, avatar/menu autenticado) é escopo da Fase 07. O nó 59:11 chama-se "user-menu" e o botão "sair-button", mas o conteúdo é "Entrar" (estado anônimo). A variante autenticada `components/layout/user-menu.tsx (new)` não aparece neste frame e não foi inventariada. Também não há estado de dono do canal (por exemplo, atalho para editar o canal), embora `content-header` (59:16) use `justify-between` com um único filho.
- **Wordmark do BrandLogo.** O Figma exibe "EstúdioCriador", enquanto o projeto é StreamTube/FC Tube. Confirmar se é texto placeholder do mock antes de fixar o BrandLogo existente.
- **DurationBadge e o Badge genérico.** O pill de duração é mapeado para a primitiva `components/ui/badge.tsx (new)`, que também serve aos badges de status e visibilidade do painel. Confirmar se vira uma variante "overlay" do Badge ou markup interno do VideoCard; se for interno, o `Reuse?` passa a `new`.
- **Layout do export.** Todos os elementos estão posicionados de forma absoluta (`main-dashed-container` com altura fixa de 660px, grade 4×2 com cards de 233px e gap de 24px). Não há auto-layout nem comportamento responsivo definido; a grade deve ser reimplementada em CSS grid. Só o desktop foi desenhado.
- **Conteúdo de exemplo.** As 8 thumbnails repetem 3 imagens e os títulos de 2 cards aparecem truncados com elipse. Isso confirma o comportamento de uma linha com `text-ellipsis`. Não há fallback para vídeo sem thumbnail.
- **Acessibilidade.** As imagens (avatar e thumbnails) vêm com `alt=""` no export; o avatar deve receber alt com o nome do canal. Os itens da paginação são texto puro, então o implement precisa de `nav`/links/`aria-current` e de estado desabilitado.
- **Sem discrepância screenshot × design context.** Todos os elementos visíveis no screenshot estão presentes na saída de `get_design_context`. O Figma não emitiu Code Connect, então `In DS?`/`Reuse?` seguem a regra de herança do phase-02 e a tabela canônica de caminhos.

---

## Reconciliation summary

| Capability (project-plan.md)                                                                                                       | Covered by                                                     | Screens                                             |
|------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------|-----------------------------------------------------|
| "Categorias de vídeo disponíveis na plataforma"                                                                                    | VideoEditForm (Select 41:123)                                  | /videos/{publicId}/edit                             |
| "Edição das informações do vídeo: título, descrição, categoria e thumbnail customizada"                                            | VideoEditForm, ThumbnailUploader                               | /videos/{publicId}/edit                             |
| "Visibilidade do vídeo: público (aparece para todos) ou unlisted (somente via link)"                                               | VideoEditForm (RadioGroup 41:128); exibição em VideoVisibilityBadge | /videos/{publicId}/edit (edição), /channel/videos (exibição) |
| "Fluxo de rascunho → publicação"                                                                                                   | Button "Salvar rascunho", Button "Publicar"                    | /videos/{publicId}/edit                             |
| "Painel de gerenciamento de vídeos do canal (thumbnail, título, visualizações, likes, comentários, tempo de publicação e status)" | VideoTable, Pagination                                         | /channel/videos                                     |
| "Edição de vídeos a partir do painel"                                                                                              | VideoEditForm (carregamento do vídeo escolhido; rota dedicada TD-09); entrada pelo botão "Editar" de cada linha (EditVideoButton, navegação) | /videos/{publicId}/edit, /channel/videos |
| "Edição das informações do canal: nickname, nome e descrição"                                                                      | ChannelEditForm, SaveButton                                    | /channel/settings                                   |
| "Página pública do canal com informações e listagem de vídeos"                                                                     | ChannelHeader, VideoCard, Pagination                           | /@{nickname}                                        |
| "Logout" _(herdada da Fase 02, fora das 8 capabilities da Fase 04)_                                                                | UserMenu, SairButton                                           | /channel/videos                                     |

## Open questions

- **Botão "Editar" do painel.** O botão foi adicionado ao Figma em 2026-09-20 (nós 62:42, 62:44, 62:46) e a capability "Edição de vídeos a partir do painel" segue coberta pelo verbo remapeado da tela de edição. Falta desenhar hover/foco do botão e decidir se a coluna ganha um cabeçalho visualmente oculto para leitores de tela.
- **Estados de lista e ciclo de vida no painel.** Faltam: empty state, loading e erro; variant para `status` do worker (processando/falhou); ação de publicar direto da linha de rascunho; formato da coluna PUBLICAÇÃO (data absoluta vs. relativa, a capability diz "tempo de publicação"); o que exibir em "visibilidade" de um rascunho (hoje "—").
- **Estados ausentes nas demais telas.** Edição de vídeo, edição de canal e página pública mostram só o estado feliz: sem erro de validação/mutation, loading, sucesso, canal não encontrado nem canal sem vídeos (mesmo gap já registrado nas telas de auth da Fase 02). Decidir se o implement infere o padrão do DS de auth ou se o designer produz as variants.
- **Edição de vídeo — thumbnail e ciclo de vida.** O momento do upload da thumbnail (imediato ao escolher o arquivo vs. junto do submit, TD-03) decide se `ThumbnailUploader` tem mutation própria. Faltam variants para vídeo já publicado ("Salvar alterações"/"Despublicar") e para `status ≠ ready`, onde "Publicar" deve ficar bloqueado (TD-02).
- **Edição de vídeo — dado de mock fora do enum.** O Select exibe "Tutoriais", que não está na lista decidida em TD-10 (Música, Jogos, Educação, Entretenimento, Notícias, Esportes, Tecnologia, Outros). Atualizar o Figma ou revisar o TD.
- **Edição de canal — nickname.** O exemplo "joana.cria" contém ponto, fora da allowlist `[a-z0-9_]`; trocar o exemplo e validar com a allowlist. Trocar o nickname muda a URL pública `/@{nickname}` (TD-07 + TD-08) sem aviso no design. O prefixo "@" exige extensão do `Input` ou composição local.
- **Edição de canal — destino do "Cancelar" e chrome.** O Figma não define para onde "Cancelar" navega (`/@{nickname}`, painel ou `router.back()`), e a tela não mostra navbar nem navegação de volta.
- **Chrome autenticado compartilhado.** `SiteNavbar`/`UserMenu` só aparecem no painel; edição de vídeo e edição de canal não mostram o chrome. Definir se um layout autenticado (route group) envolve as três rotas.
- **Página pública — conteúdo e paginação.** A descrição do canal não aparece na faixa do cabeçalho; o mock mostra 42 vídeos com 8 por página mas só a página "1" (tamanho de página a confirmar contra TD-06); a caixa tracejada da paginação parece marcação de mock; a contagem "N vídeos" e o total devem contar só vídeos publicados e públicos (TD-02). O navbar completo (busca, variante autenticada) é da Fase 07.
- **Badge de duração.** Definir se o overlay de duração do `VideoCard` é uma variante do `Badge` (`components/ui/badge.tsx`) ou markup interno do card; se for interno, `Reuse?` passa a `new`.
- **Marca e avatar.** O wordmark do Figma é "EstúdioCriador", diferente do `BrandLogo` já implementado (StreamTube); confirmar se é placeholder do mock (ver `docs/design-identity.md`). A fonte da imagem do avatar não é coberta por nenhuma capability da Fase 04.
- **Reuso de componentes herdados.** `BackLink` vive em `components/auth/` e precisa de ícone (chevron) e destino parametrizáveis; a tipografia dos labels (caixa alta, 13px) difere do `FormLabel` da Fase 02. Mover/generalizar fica como tarefa separada.
- **Logout herdado da Fase 02.** O verbo "Encerrar a sessão" cita uma capability fora da Fase 04; o `plan-validate` deve tratá-lo como pendência herdada (já registrada em Open questions do inventário `phase-02-auth-frontend`).
- **Telas de auth do Figma (Fase 02).** As telas de redefinição de senha (`41:177`) e conta confirmada (`41:195`) foram removidas do escopo desta fase e são candidatas a uma extension run do inventário `phase-02-auth-frontend`.
