---
scope_type: phase
related_phases: [4]
status: decided
date: 2026-07-30
scope_description: "Modelagem de categorias, estados de publicação/visibilidade, thumbnail customizada, painel de gerenciamento e página pública do canal"
---

# Technical Decisions — Gerenciamento de Vídeos e Canal

_Subprojects in scope:_

- `nestjs-project/` — schema de `videos` e `channels` (categoria, visibilidade, publicação, contadores), endpoints de edição, listagens paginadas e resolução do canal público. Coberto por TD-01 a TD-07.
- `next-frontend/` — formulário de edição de vídeo, painel de gerenciamento do canal, formulário de edição do canal e página pública do canal. Coberto por TD-01, TD-02, TD-03, TD-05, TD-06, TD-07, TD-08 e TD-09.

**Constraints herdados relevantes** (não reabrir): `status` de `videos` é escrito pelo Video Worker (`upload-processing/TD-04`, `upload-processing/TD-06`); entrega de mídia via URL pré-assinada (`upload-processing/TD-08`); `public_id` via nanoid (`upload-processing/TD-07`); DTOs com class-validator (`phase-02-auth/TD-06`); envelope de erro único (`phase-02-auth/TD-07`); allowlist de nickname `[a-z0-9_]` (`phase-02-auth/TD-10`); BFF estrito com `API_URL` server-only (`next-frontend-config-base/TD-03`); mutação via Route Handler + `fetch` do cliente (`phase-02-auth-frontend/TD-05`); formulários com react-hook-form + Zod (`phase-02-auth-frontend/TD-04`); contrato tipado a partir de `openapi.json` (`next-frontend-openapi-typing/TD-01`, `/TD-04`).

> **Nota de método:** o MCP **context7 não estava disponível** nesta sessão. As verificações de API foram feitas em fontes primárias equivalentes: os docs do Next.js embarcados na versão instalada (`next-frontend/node_modules/next/dist/docs/`, Next 16.2.6 — confirmados `intercepting-routes` e `route-groups`) e os manifests instalados de ambos os subprojetos. Recomendo revalidar via context7 antes de implementar as TDs que envolvem biblioteca (TD-03, TD-09).

---

## TD-01: Modelagem das categorias de vídeo

**Scope:** Cross-layer

**Capability:** Categorias de vídeo disponíveis na plataforma

**Context:** A plataforma precisa de um conjunto de categorias para classificar vídeos. A escolha define como o frontend popula o `select` de categoria no formulário de edição e como as Fases 05 ("Sugestões de vídeos da mesma categoria") e 07 ("Filtro de vídeos por categoria na home") consultam. Afeta ambos os lados: com enum, os valores chegam ao frontend estaticamente tipados pelo `openapi.json`; com tabela, exigem uma chamada em runtime.

**Options:**

### Option A: Enum Postgres via coluna `enum` do TypeORM
- Coluna `category` com `@Column({ type: 'enum', enum: VideoCategory })`, mesmo padrão já usado por `VideoStatus`.
- **Pros:** valores entram no `openapi.json` como `enum` de string e viram união tipada em `types.gen.ts` automaticamente — sem endpoint extra e sem fetch no cliente; integridade garantida pelo banco; zero JOIN nas listagens.
- **Cons:** incluir/renomear categoria exige migration; remover valor de enum no Postgres é operação custosa; o rótulo de exibição precisa de um mapa em código.

### Option B: Tabela `categories` com seed + FK
- Tabela dedicada (`id`, `slug`, `name`), FK em `videos.category_id`, populada pelo mecanismo de seed já existente da Fase 01.
- **Pros:** categorias gerenciáveis por dados (sem deploy); separa `slug` de `name` para exibição; permite metadados futuros (ícone, ordem).
- **Cons:** exige endpoint `GET /categories` + fetch no frontend, perdendo a tipagem estática do contrato; JOIN ou segunda query em toda listagem; complexidade sem consumidor real — nenhuma fase prevê CRUD de categorias.

### Option C: Constante TypeScript + coluna `varchar` validada
- Lista `as const` no código, validada por `class-validator` na entrada e persistida como texto.
- **Pros:** mudança de lista sem migration; simples.
- **Cons:** nenhuma integridade no banco (dado inválido entra por qualquer outro caminho de escrita); o contrato não expressa os valores válidos a menos que anotado à mão.

**Recommendation:** Option A (enum Postgres) — a capability descreve categorias "disponíveis na plataforma", isto é, um conjunto fixo definido pelo produto, e nenhuma fase do plano prevê gestão de categorias pelo usuário. Nesse cenário o enum entrega o que a arquitetura contract-first do projeto mais valoriza: os valores válidos atravessam `openapi.json` → `types.gen.ts` → `contracts.ts` sem endpoint nem fetch, mantendo o `select` do formulário estaticamente tipado. A Option B passa a ser a escolha correta no dia em que categorias virarem dado administrável — o custo de migrar enum → tabela é uma migration localizada.

**Decision:** A (enum Postgres)

---

## TD-02: Modelo de estados — lifecycle de processamento × publicação × visibilidade

**Scope:** Cross-layer

**Capability:** Transversal — covers: `Visibilidade do vídeo: público (aparece para todos) ou unlisted (somente via link)`; `Fluxo de rascunho → publicação`

**Context:** Hoje `videos.status` é um enum de lifecycle de processamento (`draft | processing | ready | failed`) **escrito pelo Video Worker** (`upload-processing/TD-04` e `/TD-06`). A Fase 04 introduz dois conceitos novos e ortogonais: estado de publicação (rascunho vs publicado) e visibilidade (público vs unlisted). Um vídeo `ready` não é automaticamente publicado — o usuário ainda decide publicar. A modelagem define a cláusula `WHERE` de toda listagem (aqui, na Fase 05 e na Fase 07) e o que o frontend renderiza como badge e como toggle.

**Options:**

### Option A: Três eixos independentes
- Mantém `status` (lifecycle, do worker); adiciona `visibility` enum (`public | unlisted`) e `published_at timestamptz NULL` (nulo = rascunho).
- **Pros:** eixos ortogonais representam qualquer combinação real ("publicado mas reprocessando", "ready porém ainda rascunho"); worker e usuário escrevem em campos distintos, sem escrita concorrente; `published_at` entrega diretamente o "tempo de publicação" exigido pela capability do painel.
- **Cons:** três campos para consultar; toda query de listagem precisa lembrar de filtrar dois deles.

### Option B: Enum único expandido
- Expande `status` para `draft | processing | ready | published | unlisted`.
- **Pros:** um único campo, um único índice, badge trivial no frontend.
- **Cons:** conflata lifecycle com publicação e visibilidade — não representa "publicado e unlisted" simultaneamente, nem "publicado sofrendo reprocessamento"; coloca worker e usuário escrevendo no mesmo campo, criando corrida entre `ready` (worker) e `published` (usuário); perde a data de publicação.

### Option C: `status` de lifecycle + `visibility` com três valores
- Mantém `status`; adiciona `visibility` (`draft | public | unlisted`), sem `published_at`.
- **Pros:** dois campos apenas; separa a escrita do worker da do usuário.
- **Cons:** ainda conflata "não publicado" com visibilidade, então despublicar perde a informação de qual era a visibilidade anterior; sem `published_at`, o "tempo de publicação" do painel teria que usar `updated_at`, que muda a cada edição — dado errado.

**Recommendation:** Option A (três eixos) — decisiva é a propriedade de ownership de escrita: `status` já pertence ao Video Worker, e as Options B e C fariam o usuário escrever no mesmo campo que um processo assíncrono, criando uma corrida real (publicar durante reprocessamento). Além disso a capability do painel pede explicitamente "tempo de publicação", que só `published_at` fornece corretamente — `updated_at` é invalidado por qualquer edição de título. O custo (uma coluna extra) é pago uma vez; a conflação seria desfeita com migration de dados.

**Decision:** A (três eixos independentes)

**Clarification (resolved AMB-1 during /plan-resolve):** apenas vídeos com `status: ready` são elegíveis para a transição rascunho → publicação (isto é, `published_at` só pode ser definido quando `status = ready`). Vídeos `draft`, `processing` ou `failed` não podem ser publicados — o backend deve rejeitar a tentativa com um erro de domínio dedicado. Despublicar (`published_at = null`) não tem essa restrição de status.

**Revisions:**

- 2026-08-08 — Copy e cor do frontend (mesma Option A; nada muda no modelo de dados). O enum `visibility` (`public | unlisted`) continua igual no banco; só a exibição na UI muda: o valor `unlisted` é rotulado como **"Indisponível"** e os chips do painel e da edição de vídeo usam os tokens de tema já existentes em `globals.css`, sem cor nova — `Publicado` (status) → `success`; `Rascunho` (status) → `muted`; `Público` (visibilidade) → `muted`; `Indisponível` (visibilidade) → `warning`, sinalizando alcance restrito. Rationale: manter a UI 100% pt-BR (nunca o termo em inglês "Unlisted") e não introduzir cor fora do design system.
- 2026-09-20 — Assinatura de URL de vídeo passa a respeitar rascunho e visibilidade (mesma Option A; nenhuma coluna nova). O endpoint de assinatura criado na Fase 03 (`upload-processing/TD-08`) só assina vídeo com `published_at` nulo (rascunho) para o dono do canal; vídeo publicado — `public` ou `unlisted` — é assinado para qualquer chamador que tenha o `publicId` (`unlisted` continua "somente via link"). O plan-build deve emitir SI para essa alteração no módulo de vídeos do `nestjs-project/`. Rationale: resolve AMB-2 (/plan-validate) — a Fase 04 introduz os estados; deixar a checagem para a Fase 05 manteria o rascunho assistível por quem tiver o `publicId`.

---

## TD-03: Mecanismo de upload da thumbnail customizada

**Scope:** Cross-layer

**Capability:** Edição das informações do vídeo: título, descrição, categoria e thumbnail customizada

**Context:** O usuário pode substituir a thumbnail gerada automaticamente por uma própria. O caminho dos bytes precisa ser definido nos dois lados: o cliente escolhe o arquivo e o backend precisa validá-lo e persistir no MinIO. A infraestrutura de upload existente (`@tus/server`, decidida em `upload-processing/TD-03`) foi dimensionada para vídeos de até 10GB — uma imagem é 4 a 5 ordens de magnitude menor, então a premissa que justificou tus não se aplica aqui.

**Options:**

### Option A: Multipart via `FileInterceptor` na própria API
- `PATCH`/`POST` multipart no endpoint de vídeo, com `FileInterceptor` do `@nestjs/platform-express`, validando mime-type e tamanho antes de chamar `StorageService.putObject`.
- **Pros:** uma única requisição; validação de tipo e tamanho acontece no servidor, onde é confiável; reusa `putObject`, já existente; erro volta no envelope padrão da API.
- **Cons:** os bytes atravessam o processo da API (irrelevante nessa ordem de grandeza, mas não é zero); exige adicionar `@types/multer` (não instalado hoje).

### Option B: Reutilizar o servidor tus já montado
- Aponta o `tus-js-client` para uma nova rota de thumbnail.
- **Pros:** reaproveita infraestrutura e o cliente já presentes; retomada de upload de graça.
- **Cons:** handshake de 3+ requisições (POST create → PATCH → HEAD) para um arquivo de centenas de KB, puro overhead; o servidor tus atual roda como middleware Express cru, fora do pipeline do Nest — sem `ValidationPipe` nem filtro de exceção — e o hook `onUploadCreate` hoje cria um `Video`, exigindo desvio condicional num caminho já delicado.

### Option C: URL pré-assinada PUT direto ao MinIO
- API devolve uma URL PUT assinada (`@aws-sdk/s3-request-presigner`, já instalado); o browser envia direto ao storage e confirma depois.
- **Pros:** bytes não passam pela API; simétrico à entrega já decidida em `upload-processing/TD-08`.
- **Cons:** validação real de conteúdo fica impossível antes da gravação — o servidor assina sem ver o arquivo, então mime-type e dimensão só podem ser checados depois (ou confiando no cliente); exige round-trip extra de confirmação e tratar o caso do objeto gravado e nunca confirmado (lixo no bucket).

**Recommendation:** Option A (multipart com validação no servidor) — thumbnail é um arquivo pequeno, e o que domina a decisão aqui não é banda, é onde a validação acontece. Multipart é o único dos três em que o servidor inspeciona o arquivo **antes** de persistir, o que importa porque a thumbnail é conteúdo exibido publicamente. A Option B aplica a solução de um problema (arquivo gigante, conexão instável) a um caso que não o tem, e o faz no trecho de código mais frágil da Fase 03; a Option C troca validação confiável por uma economia de banda irrelevante nessa escala.

**Decision:** A (multipart via FileInterceptor)
**Libraries:** multer

**Revisions:**

- 2026-09-20 — A thumbnail customizada é enviada no mesmo multipart do envio do formulário de edição do vídeo (mesma Option A). O `ThumbnailUploader` não tem mutation própria: escolher o arquivo só gera preview local e a gravação acontece no submit ("Salvar rascunho", "Publicar" ou "Salvar alterações"); cancelar a edição não altera a thumbnail. O endpoint de edição do vídeo passa a aceitar `multipart/form-data` com `FileInterceptor`, e os campos de texto chegam como partes do formulário. Rationale: resolve OQ-14 (/plan-validate) — uma única operação de salvar, sem thumbnail trocada antes de o usuário confirmar.

---

## TD-04: Precedência entre thumbnail auto-gerada e customizada

**Scope:** Backend

**Capability:** Edição das informações do vídeo: título, descrição, categoria e thumbnail customizada

**Context:** A Fase 03 já grava uma thumbnail automática em `videos.thumbnail_key`, extraída de um frame pelo worker. Quando o usuário envia a própria, é preciso decidir se a automática é preservada. Isso determina o schema e onde a resolução "qual thumbnail exibir" acontece.

**Options:**

### Option A: Sobrescrever `thumbnail_key` in place
- O upload customizado substitui o objeto/chave existente.
- **Pros:** schema inalterado; leitura trivial — há sempre um único campo.
- **Cons:** a automática é perdida definitivamente; "restaurar a thumbnail padrão" passa a exigir reprocessar o vídeo (re-enfileirar job, baixar o arquivo original do storage, rodar ffmpeg de novo) — caro e desnecessário.

### Option B: Coluna `custom_thumbnail_key` separada + precedência na leitura
- Mantém `thumbnail_key` (auto) e adiciona `custom_thumbnail_key` (nullable); a resolução prefere a customizada quando presente.
- **Pros:** permite restaurar a padrão instantaneamente (basta anular a coluna); a origem da imagem fica explícita no dado; o worker continua dono exclusivo de `thumbnail_key`, sem conflito de escrita.
- **Cons:** uma coluna extra e um ponto de resolução a manter no serviço.

### Option C: Sobrescrever, guardando a automática por convenção de nome
- Substitui a chave mas mantém o objeto original sob um sufixo previsível no bucket.
- **Pros:** permite restaurar sem coluna nova.
- **Cons:** o "estado" passa a viver numa convenção implícita de nomenclatura de objeto, não no schema — frágil, invisível para quem lê a entidade e impossível de consultar via SQL.

**Recommendation:** Option B (coluna separada com precedência) — o argumento decisivo é o custo da operação inversa: com a Option A, desfazer uma troca de thumbnail exige reprocessamento completo do vídeo no worker, enquanto na B é `UPDATE ... SET custom_thumbnail_key = NULL`. Preserva também a separação de ownership que a TD-02 estabelece: o worker escreve apenas seus próprios campos. A API deve expor uma única URL já resolvida, de modo que o frontend nunca implemente a precedência.

**Decision:** B (coluna separada + precedência)

---

## TD-05: Origem dos contadores do painel (visualizações, likes, comentários)

**Scope:** Cross-layer

**Capability:** Painel de gerenciamento de vídeos do canal (thumbnail, título, visualizações, likes, comentários, tempo de publicação e status)

**Context:** A capability exige que o painel exiba visualizações, likes e comentários — mas nenhuma dessas fontes existe nesta fase: contagem de visualizações é entregue na Fase 05 e likes/comentários na Fase 06. É preciso decidir agora o que o contrato do painel expõe, porque a alternativa é refazer contrato, BFF e painel duas vezes nas fases seguintes.

**Options:**

### Option A: Colunas contadoras desnormalizadas em `videos` desde já
- `view_count`, `like_count`, `comment_count` com default `0`; o incremento é implementado por quem cria a fonte (Fases 05 e 06).
- **Pros:** contrato `openapi.json` estável desde esta fase — painel e tipos gerados não mudam nas Fases 05/06; leitura O(1) na listagem, sem JOIN; `0` é semanticamente correto para vídeo sem interação.
- **Cons:** cria colunas cujo produtor só chega depois (ficam legitimamente em zero até lá); contador desnormalizado pode divergir da verdade se o incremento futuro não for transacional.

### Option B: Omitir os campos do contrato agora
- O painel desta fase exibe apenas o que existe; Fases 05/06 adicionam os campos.
- **Pros:** o contrato só descreve dado real, sem campos inertes.
- **Cons:** contraria a capability, que lista as três colunas explicitamente; força mudança de contrato + regeneração de tipos + retrabalho do painel em duas fases futuras — exatamente o custo que o CI de freshness do `openapi.json` torna visível.

### Option C: Expor no contrato e computar por `COUNT`/JOIN quando as tabelas existirem
- Campos presentes no contrato, resolvidos por agregação nas fases futuras.
- **Pros:** contrato estável sem colunas desnormalizadas; nunca divergem da verdade.
- **Cons:** `COUNT` por linha em listagem é N+1 ou JOIN agregado caro, e a Fase 07 (paginação/scroll infinito sobre listagens maiores) tornaria isso o gargalo; na prática viraria contador desnormalizado depois de qualquer forma, pagando a migração duas vezes.

**Recommendation:** Option A (contadores desnormalizados, sem lógica de incremento nesta fase) — a capability obriga a expor os três números, então a Option B está fora; entre A e C, o fator decisivo é que a Fase 07 introduz paginação sobre essas mesmas listagens, e agregação por linha é justamente o padrão que não escala ali. Adotar A agora fixa o contrato uma única vez e deixa para as Fases 05/06 apenas a responsabilidade de incrementar — que é o escopo natural delas. O risco de divergência se mitiga exigindo que o incremento futuro ocorra na mesma transação do evento que o origina.

**Decision:** A (contadores desnormalizados, sem incremento nesta fase)

---

## TD-06: Estratégia de paginação das listagens introduzidas nesta fase

**Scope:** Cross-layer

**Capability:** Transversal — covers: `Painel de gerenciamento de vídeos do canal (thumbnail, título, visualizações, likes, comentários, tempo de publicação e status)`; `Página pública do canal com informações e listagem de vídeos`

**Context:** Esta fase cria duas listagens (painel do canal e listagem pública do canal). Paginação é um contrato entre back e front — o formato do parâmetro e o shape da resposta constrangem os dois lados. A Fase 07 pede "Paginação ou scroll infinito nas listagens de vídeos"; decidir agora evita que ela seja uma mudança quebrada no contrato.

**Options:**

### Option A: Offset/limit (`?page=&limit=`)
- Resposta com `items` + metadados (`total`, `page`, `limit`).
- **Pros:** permite salto para página arbitrária e controles numerados, que é o que um painel de gerenciamento tipicamente oferece; trivial de implementar e de consumir; atende tanto "paginação" quanto "scroll infinito" da Fase 07.
- **Cons:** `COUNT` total custa em tabelas grandes; sob inserção concorrente, itens podem repetir ou ser pulados entre páginas.

### Option B: Cursor keyset (`?cursor=&limit=`)
- Cursor opaco sobre `(created_at, id)`.
- **Pros:** estável sob inserção concorrente; custo constante por página com índice composto.
- **Cons:** não permite ir para "página 7" — inviabiliza controles numerados no painel; exige índice composto e codificação/decodificação de cursor; sem `total`, o painel não mostra "N vídeos".

### Option C: Sem paginação nesta fase
- Retorna a coleção inteira; paginar na Fase 07.
- **Pros:** nada a construir agora; conjuntos por canal são pequenos no início.
- **Cons:** a Fase 07 vira breaking change atravessando backend, `openapi.json`, BFF e componentes; e uma listagem sem limite é um risco de payload aberto para um canal com muitos vídeos.

**Recommendation:** Option A (offset/limit) — as duas listagens desta fase são escopadas por canal, portanto de baixa cardinalidade, e o painel de gerenciamento se beneficia de "página N" e de um total visível, que o cursor não oferece. A instabilidade sob concorrência do offset é irrelevante aqui, já que só o próprio dono insere vídeos no seu canal. Cursor permanece a escolha certa para o feed global da home (Fase 07), de alta cardinalidade e inserção por muitos autores — as duas estratégias podem coexistir, cada uma na superfície onde suas propriedades importam; esta TD vincula apenas as listagens desta fase.

**Decision:** A (offset/limit)

**Revisions:**

- 2026-09-20 — A listagem da página pública do canal usa `limit` padrão de 8 vídeos por página (grade 4×2 do design); a contagem "N vídeos" e o total da paginação consideram apenas vídeos publicados e públicos. O tamanho de página do painel não é fixado por esta TD (mesma Option A). Rationale: resolve OQ-19 (/plan-validate) — confirma o tamanho de página do mock contra a paginação offset/limit.

---

## TD-07: Política de alteração do nickname do canal

**Scope:** Cross-layer

**Capability:** Edição das informações do canal: nickname, nome e descrição

**Context:** O `nickname` é `unique` e é a identidade pública do canal — a URL da página pública (TD-08) se resolve por ele. `phase-02-auth/TD-10` decidiu como o nickname é **gerado** a partir do prefixo do e-mail, mas não o que acontece quando o usuário o **altera**. A decisão afeta unicidade no backend, o formulário no frontend e a resolução da rota pública.

**Options:**

### Option A: Alteração livre com checagem de unicidade
- Valida allowlist + unicidade e troca; o nickname antigo volta ao pool.
- **Pros:** simples, sem tabela nova e sem resolução em duas etapas; atende a capability diretamente.
- **Cons:** links já compartilhados passam a 404 silenciosamente; o nickname antigo fica imediatamente disponível para outra pessoa ocupar (squatting), o que pode redirecionar audiência alheia.

### Option B: Alteração livre + histórico com redirect
- Tabela `channel_nickname_history`; a resolução do canal tenta o atual e cai no histórico, respondendo redirect permanente.
- **Pros:** preserva todo link já publicado; impede squatting por construção, já que o antigo continua vinculado ao canal.
- **Cons:** adiciona tabela e uma segunda consulta no caminho de toda requisição de canal público; introduz a pergunta de expiração do histórico.

### Option C: Alteração com cooldown
- Permite trocar, limitado a uma vez por período.
- **Pros:** reduz churn e uso abusivo sem estrutura nova.
- **Cons:** ainda quebra links existentes; introduz estado temporal (`nickname_changed_at`) e uma regra que o produto não pediu.

### Option D: Nickname imutável
- Apenas `name` e `description` editáveis.
- **Pros:** elimina o problema inteiro.
- **Cons:** contraria a capability, que lista `nickname` explicitamente como editável.

**Recommendation:** Option A (alteração livre com unicidade) — a Option D está excluída pela capability, e entre A, B e C o critério é se o custo permanente da B se justifica agora. A plataforma ainda não tem links externos de entrada nem audiência acumulada, então preservação de link é um problema que ela não possui hoje, enquanto a segunda consulta no caminho de leitura de canal seria paga em toda requisição para sempre. Recomendo A registrando explicitamente o trade-off: se e quando houver tráfego externo relevante, migrar para B é aditivo (criar a tabela e passar a alimentá-la), não uma reescrita. Vale reservar `nickname_changed_at` na modelagem apenas se o produto sinalizar preocupação com squatting.

**Decision:** A (alteração livre com unicidade)

---

## TD-08: Esquema de URL da página pública do canal

**Scope:** Cross-layer

**Capability:** Página pública do canal com informações e listagem de vídeos

**Context:** A página pública do canal é endereçada pelo nickname. As rotas top-level já ocupadas hoje são `/login`, `/signup`, `/forgot-password` e `/upload`, e as Fases 05 e 07 adicionarão mais (página do vídeo, busca). O ponto crítico: o allowlist de nickname de `phase-02-auth/TD-10` é `[a-z0-9_]`, portanto `upload` e `login` são nicknames **válidos** — um esquema na raiz colidiria com rotas reais.

**Options:**

### Option A: `/@{nickname}`
- Segmento dinâmico prefixado pelo sigil `@`.
- **Pros:** imune a colisão por construção, já que `@` não pertence ao allowlist de nickname — nenhuma rota da aplicação pode ser confundida com um canal, agora ou nas fases futuras; curto; convenção que usuários já reconhecem de outras plataformas.
- **Cons:** exige atenção ao encoding do `@` no segmento dinâmico e na geração de links.

### Option B: `/channel/{nickname}`
- Segmento explícito antes do nickname.
- **Pros:** zero ambiguidade; roteamento e leitura triviais; nenhum caractere especial.
- **Cons:** mais verboso e menos idiomático para um perfil público.

### Option C: `/{nickname}` na raiz
- Nickname como primeiro segmento.
- **Pros:** URL mais curta possível.
- **Cons:** colide diretamente com toda rota top-level existente e futura; obriga a manter à mão uma blocklist de nicknames reservados, sincronizada a cada nova rota adicionada nas Fases 05 e 07 — uma classe de bug silenciosa (um usuário chamado `search` quebra a busca, ou vice-versa).

**Recommendation:** Option A (`/@{nickname}`) — elimina a colisão por construção em vez de administrá-la: a Option C exigiria uma blocklist que precisa ser lembrada a cada rota nova das próximas três fases, e esquecer de atualizá-la produz um bug difícil de atribuir. Entre A e B a diferença é sobretudo idiomática, e A mantém a URL curta sem reintroduzir ambiguidade, dado que o `@` está fora do allowlist `[a-z0-9_]` já decidido.

**Decision:** A (`/@{nickname}`)

**Revisions:**

- 2026-07-31 — Scope reclassificado de Frontend para Cross-layer. Rationale: resolve IC-1 (/plan-validate) — o esquema de URL depende do allowlist de nickname (`[a-z0-9_]`, phase-02-auth/TD-10), que também condiciona como o backend expõe a busca de canal por nickname; classificar como Cross-layer permite que a decisão renderize nas seções voltadas a backend do artefato de build mesmo com o UI Inventory ainda diferido.

---

## TD-09: Padrão de roteamento da edição de vídeo a partir do painel

**Scope:** Frontend

**Capability:** Edição de vídeos a partir do painel

**Context:** Do painel de gerenciamento, o usuário abre a edição de um vídeo. O formulário reúne título, descrição longa, categoria, visibilidade e upload de thumbnail (TD-03) — não é edição de campo único. O App Router do Next 16.2.6 oferece rota dedicada, ou modal via intercepting + parallel routes (ambos confirmados nos docs da versão instalada).

**Options:**

### Option A: Rota dedicada (`.../videos/{publicId}/edit`)
- Página própria, Server Component carregando o vídeo e formulário cliente para submissão.
- **Pros:** URL compartilhável e deep-linkable sem trabalho extra; encaixa direto no padrão de mutação já decidido (Route Handler + `fetch`, `phase-02-auth-frontend/TD-05`); acomoda formulário grande e upload sem restrição de espaço.
- **Cons:** perde o contexto visual do painel durante a edição.

### Option B: Modal via intercepting + parallel routes
- `(.)edit` interceptado dentro de um slot `@modal`, com `default.tsx` para o hard-load.
- **Pros:** mantém o painel visível ao editar; ainda compartilhável, pois o acesso direto renderiza a página inteira.
- **Cons:** é o padrão mais complexo do App Router (slot + interceptação + fallback), e um formulário com upload de arquivo dentro de modal aumenta o risco de estado perdido ao fechar acidentalmente.

### Option C: Edição inline na linha da tabela
- Campos editáveis na própria linha do painel.
- **Pros:** sem navegação alguma.
- **Cons:** não acomoda descrição longa nem upload de thumbnail; não é deep-linkable; degrada muito em telas pequenas, o que conflita com o requisito de responsividade da Fase 07.

**Recommendation:** Option A (rota dedicada) — o formulário desta fase é substancial e inclui upload, o que exclui a Option C por capacidade e desaconselha a B por risco de perda de estado. Além disso a Option B é **aditiva sobre a A**: a interceptação se sobrepõe a uma rota que precisa existir de todo modo, então escolher A agora não fecha a porta para o modal depois — o contrário não é verdade. Começar por A entrega a capability com o padrão de rota e de mutação já estabelecidos no projeto.

**Decision:** A (rota dedicada)

**Revisions:**

- 2026-09-20 — As três rotas do canal autenticado (`/channel/videos`, `/videos/{publicId}/edit`, `/channel/settings`) compartilham um layout de route group autenticado com `SiteNavbar` e `UserMenu`; a rota dedicada da edição de vídeo continua a mesma (mesma Option A). O "Cancelar" da edição do canal navega para `/channel/videos`. Rationale: resolve OQ-17 e OQ-18 (/plan-validate) — o Figma só mostra o chrome no painel; o layout compartilhado evita duplicar a navbar e dá acesso ao logout nas telas de edição.

---

## TD-10: Lista concreta de categorias de vídeo

**Scope:** Cross-layer

**Capability:** Categorias de vídeo disponíveis na plataforma

**Context:** `TD-01` decide **como** as categorias são modeladas (enum Postgres), mas não **quais** categorias existem de fato — e nenhum código do projeto tem qualquer sinal prévio disso (busca por "categor" no backend e no frontend não retornou nada). A escolha da lista concreta é uma decisão de produto com efeito cross-layer real: os valores do enum (migration), as opções do `<select>` de categoria no formulário de edição (TD-03/TD-09) e, mais adiante, o filtro por categoria da Fase 07 e as sugestões por categoria da Fase 05 — todos consomem o mesmo conjunto fechado de valores. Nenhuma fase do projeto prevê uma tela de administração de categorias (CRUD), então a lista, uma vez decidida, só muda via nova migration.

**Options:**

### Option A: Lista fixa ampla, ao estilo YouTube (~12-15 categorias)
- Taxonomia granular cobrindo os grandes gêneros de conteúdo de vídeo (Música, Jogos, Educação, Entretenimento, Notícias e Política, Esportes, Tecnologia, Ciência, Culinária, Viagem, Comédia, Vlogs, Filmes e Animação, Outros).
- **Pros:** filtro por categoria (Fase 07) e sugestões (Fase 05) ficam expressivos desde o início; cobre a maioria dos casos de uso reais de uma plataforma de vídeo genérica.
- **Cons:** decidida sem nenhum dado real de uso (projeto greenfield, sem conteúdo carregado ainda) — boa parte das ~15 categorias plausivelmente nunca será usada; qualquer erro de julgamento nessa lista larga custa uma migration para corrigir depois.

### Option B: Lista fixa pequena e genérica, com catch-all "Outros"
- Conjunto deliberadamente pequeno (Música, Jogos, Educação, Entretenimento, Notícias, Esportes, Tecnologia, Outros — 8 valores), garantindo que todo vídeo tenha uma categoria plausível mesmo sem cobertura granular.
- **Pros:** minimiza o risco de errar a lista logo na primeira decisão — o catch-all absorve qualquer conteúdo fora das categorias nomeadas, então a lista nunca fica "incompleta" mesmo sendo pequena; superfície pequena para o `<select>` do formulário e para o filtro da Fase 07; expandir depois (adicionar um valor ao enum) é uma migration barata e aditiva, ao contrário de restringir uma lista já grande.
- **Cons:** filtro por categoria (Fase 07) e sugestões (Fase 05) ficam menos expressivos no dia 1 — muito conteúdo pode cair em "Outros" até a lista crescer organicamente.

### Option C: Lista mínima sem catch-all, decidir o resto depois
- Só as 3-4 categorias mais óbvias (Música, Jogos, Educação, Entretenimento), sem valor genérico de fallback.
- **Pros:** menor superfície possível para decidir agora.
- **Cons:** sem catch-all, todo vídeo que não se encaixa literalmente numa das poucas categorias fica sem opção válida no formulário — force o usuário a escolher uma categoria errada só para conseguir publicar. Pior experiência do que A ou B sem reduzir de fato o trabalho de decisão (a pergunta "e o que não é nenhuma dessas?" sempre aparece).

**Recommendation:** Option B (lista pequena e genérica com catch-all) — o fator decisivo é que este é um projeto greenfield sem nenhum dado real de uso para calibrar uma taxonomia ampla como a da Option A; decidir 15 categorias agora é decidir 15 coisas às cegas, e boa parte provavelmente erra. A Option C parece mais simples mas na prática só adia a pergunta que a Option B já resolve com um catch-all. A assimetria de custo também favorece B: crescer um enum pequeno depois (Fase 05/07, quando houver conteúdo real para calibrar contra) é uma migration aditiva barata; a Option A já começa no tamanho que a B só atingiria com evidência real.

**Decision:** B (lista pequena + catch-all "Outros": Música, Jogos, Educação, Entretenimento, Notícias, Esportes, Tecnologia, Outros)

---

## Decisions Summary

| ID | Scope | Decision | Recommendation | Choice |
|----|-------|----------|---------------|--------|
| TD-01 | Cross-layer | Modelagem das categorias de vídeo | A (enum Postgres) | A |
| TD-02 | Cross-layer | Modelo de estados: lifecycle × publicação × visibilidade | A (três eixos independentes) | A |
| TD-03 | Cross-layer | Mecanismo de upload da thumbnail customizada | A (multipart com validação no servidor) | A |
| TD-04 | Backend | Precedência entre thumbnail auto-gerada e customizada | B (coluna separada + precedência) | B |
| TD-05 | Cross-layer | Origem dos contadores do painel | A (contadores desnormalizados, sem incremento nesta fase) | A |
| TD-06 | Cross-layer | Estratégia de paginação das listagens desta fase | A (offset/limit) | A |
| TD-07 | Cross-layer | Política de alteração do nickname do canal | A (alteração livre com unicidade) | A |
| TD-08 | Cross-layer | Esquema de URL da página pública do canal | A (`/@{nickname}`) | A |
| TD-09 | Frontend | Padrão de roteamento da edição a partir do painel | A (rota dedicada) | A |
| TD-10 | Cross-layer | Lista concreta de categorias de vídeo | B (lista pequena + catch-all "Outros") | B |
