---
scope_type: phase
related_phases: [6]
status: pending
date: 2026-10-01
scope_description: "Likes/dislikes em vídeos e comentários, comentários com respostas aninhadas, inscrição em canais e a área de canais seguidos"
---

# Technical Decisions — Interações Sociais

_Subprojects in scope:_

- `nestjs-project/` — três entidades novas (reações, comentários, inscrições), a manutenção dos contadores desnormalizados que a Fase 04 deixou em zero, e as rotas que as expõem. Cobertas por TD-01 a TD-07.
- `next-frontend/` — a interface completa de comentários, likes e inscrições, e a área de canais seguidos. Coberta por TD-07 (metade frontend) e TD-08.

**Nota de método.** O `context7` não estava disponível nesta sessão. As versões foram verificadas diretamente contra os pacotes instalados em disco, que são a fonte exata do que roda: TypeORM `0.3.28`, NestJS `11`, `pg` `8.20`, React `19.2.4`, Next `16.2.6`. Onde a API da biblioteca é load-bearing para a recomendação — a superfície de árvore do TypeORM e o `useOptimistic` do React — os achados estão citados no corpo do TD com o arquivo de origem. **Antes de implementar, reconfira via `context7`**, conforme o `CLAUDE.md` da raiz.

**Herança que não se reabre.** `video-channel-management/TD-05` já decidiu que `likes_count` e `comments_count` existem em `videos` como colunas desnormalizadas desde a Fase 04, hoje em zero, e — textualmente — que "o incremento futuro ocorra na mesma transação do evento que o origina". Esta fase é quem produz esse incremento. `video-channel-management/TD-06` fixou offset/limit como padrão de paginação; `phase-02-auth/TD-02` e `/TD-08` fixaram guards próprios com `@nestjs/jwt` e `@nestjs/throttler`; `phase-02-auth-frontend/TD-05` fixou Route Handler + `fetch` como caminho de mutação no frontend.

---

## TD-01: Modelagem das reações (like/dislike em vídeos e em comentários)

**Scope:** Backend

**Capability:** Transversal — covers: "Like e dislike em vídeos (usuários autenticados)", "Like e dislike em comentários (usuários autenticados)"

**Context:** A mesma interação — um usuário reage positiva ou negativamente — incide sobre dois alvos de tabelas diferentes. A escolha define se o Postgres consegue garantir integridade referencial por FK, se o `ON DELETE CASCADE` limpa as reações quando um vídeo ou comentário some, e quantas consultas distintas o serviço precisa manter. A unicidade "uma reação por usuário por alvo" é índice único em qualquer das opções e não discrimina entre elas.

**Options:**

### Option A: Duas tabelas dedicadas — `video_reactions` e `comment_reactions`
- Cada uma com `user_id` + `video_id`/`comment_id` + `value` (enum `like | dislike`), FK real para os dois lados e índice único no par.
- **Pros:** integridade referencial garantida pelo banco; `ON DELETE CASCADE` resolve a limpeza sem código; índices simples e seletivos; a consulta "qual a minha reação a este vídeo" é um lookup direto.
- **Cons:** duas tabelas quase idênticas e dois caminhos de serviço com a mesma forma; acrescentar um terceiro alvo no futuro (playlist, canal) significa uma terceira tabela.

### Option B: Tabela única polimórfica — `reactions(user_id, target_type, target_id, value)`
- Um só lugar para toda reação, discriminado por `target_type`.
- **Pros:** uma tabela, um serviço, um conjunto de rotas parametrizado; acrescentar alvo novo é um valor de enum.
- **Cons:** **o Postgres não consegue impor FK sobre `target_id`** — a integridade vira responsabilidade da aplicação, e uma reação órfã a um vídeo apagado só aparece quando alguém a lê; o índice único precisa incluir `target_type`, e toda consulta carrega um predicado a mais; deletar um vídeo exige limpeza explícita no código, que é exatamente o tipo de passo que se esquece.

### Option C: Tabela única com FKs nuláveis e `CHECK` de exclusividade
- `reactions(user_id, video_id NULL, comment_id NULL, value)` com `CHECK (num_nonnulls(video_id, comment_id) = 1)`.
- **Pros:** mantém FK real e `CASCADE` nos dois alvos; uma tabela só; o `CHECK` é declarativo e o banco o impõe.
- **Cons:** precisa de dois índices únicos parciais (um por alvo), não um; a tabela ganha uma coluna nula por alvo futuro, e o `CHECK` cresce junto; a forma é menos óbvia para quem lê o schema pela primeira vez do que duas tabelas nomeadas pelo que guardam.

**Recommendation:** Option A (duas tabelas dedicadas) — o fator decisivo é que a Option B abre mão de FK justamente num projeto onde vídeos e comentários serão apagados, e a limpeza manual de órfãos é dívida silenciosa. Entre A e C, as duas preservam integridade; A ganha por legibilidade e por índices mais simples, e o custo que ela cobra — duplicação de duas colunas e de um serviço pequeno — é baixo e visível, ao contrário do custo de C, que é um `CHECK` e dois índices parciais que crescem a cada alvo novo. O ganho de B só se realizaria com muitos alvos, e esta fase tem exatamente dois.

**Decision:** A (duas tabelas dedicadas — `video_reactions` e `comment_reactions`, cada uma com FK real)

---

## TD-02: Mecanismo de manutenção dos contadores desnormalizados

**Scope:** Backend

**Capability:** Transversal — covers: "Like e dislike em vídeos (usuários autenticados)", "Like e dislike em comentários (usuários autenticados)", "Comentários em vídeos (usuários autenticados)"

**Context:** `videos.likes_count` e `videos.comments_count` existem desde a Fase 04 e estão em zero: `video-channel-management/TD-05` criou as colunas e delegou o incremento a esta fase, exigindo que ele ocorra "na mesma transação do evento que o origina". O caso é mais difícil que o da Fase 05: lá a contagem de visualização era um incremento monotônico (`+1`), aqui é um **toggle de três estados** — sem reação, like, dislike — em que uma única ação do usuário pode mover dois contadores ao mesmo tempo (trocar dislike por like é `likes +1` e `dislikes −1`). A escolha é onde essa aritmética vive.

**Options:**

### Option A: Delta calculado no serviço, dentro de uma transação
- O serviço lê a reação anterior, calcula o delta de cada contador e aplica `UPDATE … SET likes_count = likes_count + :d` junto com o upsert da reação, tudo em `dataSource.transaction`.
- **Pros:** a regra fica em TypeScript, legível e testável sem banco; o teste unitário consegue afirmar a tabela de transições (nada→like, like→dislike, like→nada) com repositório mockado; nenhuma lógica escondida do ORM.
- **Cons:** qualquer caminho que escreva na tabela de reações sem passar pelo serviço — uma migração, um seed, um script de correção — deixa o contador errado; a corretude depende de disciplina, não de garantia.

### Option B: Trigger no Postgres sobre a tabela de reações
- `AFTER INSERT/UPDATE/DELETE` recalcula o delta e aplica ao contador do alvo.
- **Pros:** impossível divergir — qualquer escrita, de qualquer origem, mantém o contador correto; a transação é a do próprio comando, então a exigência do TD-05 é satisfeita por construção.
- **Cons:** a regra fica invisível para o ORM e para quem lê só o código TypeScript; testá-la exige banco real (vira `*.integration-spec.ts`); migrações de trigger são mais difíceis de revisar; o projeto **não tem nenhum trigger hoje**, então isto introduz uma categoria nova de artefato e de teste.

### Option C: Contador derivado por `COUNT`, abandonando a coluna
- A leitura agrega em tempo de consulta; as colunas desnormalizadas ficam sem uso.
- **Pros:** nunca diverge, porque não há segunda cópia da verdade.
- **Cons:** **contraria o TD-05 herdado**, que já pesou isto e escolheu desnormalizar porque a Fase 07 pagina listagens sobre esses mesmos campos; reabrir aqui custaria mudar contrato, tipos gerados e painel — o retrabalho que o TD-05 existiu para evitar.

**Recommendation:** Option A (delta no serviço, em transação) — a Option C está fora por contrariar decisão herdada que já ponderou o mesmo trade-off. Entre A e B, o argumento de B é real e é o mais forte em corretude; o que decide contra ele neste projeto é que a Fase 05 **já mostrou o custo de testar concorrência aqui**: o teste de duas chamadas simultâneas passou, mas o aviso do driver `pg` revelou que as queries foram serializadas no mesmo client, de modo que a atomicidade veio do SQL e não da observação do teste. Trigger moveria mais lógica para essa zona difícil de observar. A Option A mantém a aritmética do toggle — que é a parte com ramificação de verdade — em código testável sem banco, e o `UPDATE … SET x = x + :d` continua atômico no nível do SQL exatamente como o `views_count` da Fase 05. O risco que A aceita é escrita fora do serviço; mitiga-se mantendo a tabela de reações sem nenhum outro produtor.

**Decision:** A (delta calculado no serviço, dentro da mesma transação do evento que o origina)

---

## TD-03: Superfície pública do dislike

**Scope:** Cross-layer

**Capability:** Transversal — covers: "Like e dislike em vídeos (usuários autenticados)", "Like e dislike em comentários (usuários autenticados)", "Interface completa de comentários, likes e inscrições"

**Context:** A Fase 04 criou `likes_count`, mas **não existe `dislikes_count`** em lugar nenhum do schema. A capability exige que o dislike seja uma ação possível; ela não diz que a contagem de dislikes seja exibida. São coisas diferentes, e a diferença custa uma coluna, uma migração e um campo no `openapi.json` — que o CI de frescor propaga até os tipos gerados do frontend. Decidir isto depois de a tela existir significa mexer nas duas pontas de novo. O frame do Figma da Fase 06 ainda não foi desenhado, então o design não resolve a questão.

**Options:**

### Option A: Expor só o estado do próprio usuário, sem contagem de dislikes
- O botão de dislike reflete se *você* deu dislike; nenhum número é exibido. Nenhuma coluna nova.
- **Pros:** schema e contrato inalterados; é o comportamento que o YouTube adotou em 2021, com a justificativa pública de reduzir ataques coordenados a criadores; menos uma coluna para manter consistente no toggle do TD-02.
- **Cons:** a assimetria (like tem número, dislike não) precisa estar clara no desenho, ou parece bug; se a contagem for pedida depois, volta o custo de migração + contrato + tipos.

### Option B: Acrescentar `dislikes_count` e exibir
- Coluna nova em `videos` e na tabela de comentários, mantida pelo mesmo mecanismo do TD-02.
- **Pros:** simetria óbvia na interface; o dado fica disponível para qualquer uso futuro (ordenação, moderação, sinal de qualidade).
- **Cons:** migração + mudança de contrato + regeneração de tipos; dobra a aritmética do toggle do TD-02, que passa a mover dois contadores por transição; expõe publicamente um número que a prática recente da indústria recuou de expor.

### Option C: Acrescentar a coluna, não exibir
- O contador existe e é mantido, mas não entra na projeção pública.
- **Pros:** o dado fica registrado desde já para uso interno; a decisão de exibir vira mudança só de contrato, sem migração.
- **Cons:** paga a complexidade do contador em todas as transições sem entregar nada ao usuário agora; é a opção que mais facilmente fica esquecida como coluna inerte, que é exatamente o que `likes_count` foi por duas fases.

**Recommendation:** Option A (só o estado do usuário, sem contagem) — é a que não mexe em schema nem em contrato, e a assimetria que ela introduz é a convenção que o usuário já encontra nas plataformas de vídeo atuais, não uma invenção deste projeto. A Option C é tentadora por "deixar pronto", mas o projeto já tem a lição de colunas inertes: `likes_count` ficou em zero da Fase 04 até esta, e o custo de mantê-las nunca é zero. Se a tela da Fase 06, quando desenhada, mostrar um número de dislikes, a Option B é uma migração pequena e isolada — muito mais barata que carregar uma coluna sem consumidor por fases a fio.

**Decision:** A (expor só o estado do próprio usuário; sem coluna `dislikes_count` e sem contagem de dislikes na API)

---

## TD-04: Profundidade e estratégia de armazenamento dos comentários aninhados

**Scope:** Backend

**Capability:** "Respostas a comentários (comentários aninhados)"

**Context:** A capability diz "aninhados" sem fixar profundidade, e essa é a variável que domina tudo o que vem depois: a forma da tabela, o custo da leitura, a paginação e o que acontece ao apagar um comentário com respostas. Vale registrar um achado verificado na versão instalada, porque ele muda o cálculo: o `TreeRepository` do TypeORM `0.3.28` expõe `findTrees`, `findDescendants` e afins, mas o `FindTreeOptions` que todos recebem tem **apenas `relations` e `depth`** — sem `skip`, `take` ou `order` (`node_modules/typeorm/find-options/FindTreeOptions.d.ts`). Ou seja: a API de árvore do ORM **não pagina nem ordena**, e uma lista de comentários de vídeo popular precisa das duas coisas.

**Options:**

### Option A: Profundidade 1 — comentários e respostas, sem aninhar além disso
- `comments` com `parent_id` nulável e auto-FK; uma resposta a uma resposta é gravada como resposta ao comentário raiz. Duas consultas: raízes paginadas, respostas por raiz.
- **Pros:** paginação e ordenação são SQL comum, sem contornar o ORM; a leitura é previsível (duas queries, não N); o modelo é o que YouTube, Instagram e Twitch usam, então casa com a expectativa do usuário; apagar um raiz tem um só comportamento a definir.
- **Cons:** não suporta discussão profunda; se o produto quiser threads de verdade depois, a migração existe (os dados cabem, mas a UI e as queries mudam).

### Option B: `@Tree("materialized-path")` do TypeORM
- Profundidade arbitrária, caminho materializado numa coluna de string.
- **Pros:** aninhamento ilimitado sem tabela auxiliar; subárvore inteira sai num `LIKE` sobre o path.
- **Cons:** **a API de árvore não pagina nem ordena** (verificado acima), então a listagem principal teria de ser escrita em query builder cru, abrindo mão justamente do que o decorator oferece; mover um comentário exige reescrever o path de toda a subárvore; a coluna de path cresce com a profundidade.

### Option C: `@Tree("closure-table")` do TypeORM
- Tabela auxiliar com todos os pares ancestral-descendente.
- **Pros:** consultas de ancestralidade e descendência são índices puros, sem `LIKE`; a mais robusta das estratégias para árvore profunda.
- **Cons:** a mesma limitação de paginação e ordenação da Option B; uma tabela auxiliar que cresce quadraticamente com a profundidade e precisa ser mantida em sincronia; complexidade desproporcional a um produto que ainda não sabe se quer threads.

### Option D: Adjacency list com profundidade livre, lida recursivamente com `WITH RECURSIVE`
- `parent_id` simples; a leitura usa CTE recursiva escrita à mão.
- **Pros:** schema mínimo, profundidade ilimitada, e a CTE permite paginar e ordenar porque é SQL cru.
- **Cons:** toda leitura é SQL manual fora do ORM, incluindo a montagem da árvore em memória; o custo da CTE cresce com a profundidade; a UI precisa resolver indentação indefinida, que é problema de desenho ainda inexistente.

**Recommendation:** Option A (profundidade 1) — a limitação verificada do `TreeRepository` tira boa parte do apelo de B e C: adotá-las e ainda assim escrever a listagem em query builder cru é pagar a complexidade sem receber a conveniência. Entre A e D, o que decide é que a profundidade ilimitada é uma capacidade que o produto não pediu — a capability diz "respostas a comentários", e respostas a respostas não aparecem em nenhum outro bullet nem no entregável da fase. A Option A entrega o que está escrito com SQL comum, paginável e ordenável, e deixa a porta aberta: `parent_id` nulável é o mesmo schema de D, então aprofundar depois é mudar leitura e UI, não migrar dados.

**Decision:** A (profundidade 1 — `parent_id` nulável; comentários e respostas, sem aninhar além disso)

---

## TD-05: Ordenação e carregamento das respostas

**Scope:** Cross-layer

**Capability:** Transversal — covers: "Comentários em vídeos (usuários autenticados)", "Respostas a comentários (comentários aninhados)", "Interface completa de comentários, likes e inscrições"

**Context:** `video-channel-management/TD-06` já fixou offset/limit como padrão de paginação do projeto, então o mecanismo não se reabre. O que falta decidir é o **critério de ordem** da lista de comentários e **quando as respostas chegam** — duas escolhas que amarram a query do backend ao comportamento da tela e que, erradas, aparecem como N+1 ou como "o comentário que acabei de postar sumiu".

**Options:**

### Option A: Mais recentes primeiro; respostas carregadas sob demanda por raiz
- Raízes por `created_at` desc, paginadas; cada raiz exibe a contagem de respostas e as carrega ao clique.
- **Pros:** o comentário recém-postado aparece no topo, que é o feedback que o autor espera; a primeira renderização é uma query; o custo de respostas só é pago onde o usuário pede.
- **Cons:** uma requisição por raiz expandida; threads ativas exigem vários cliques.

### Option B: Mais recentes primeiro; respostas pré-carregadas junto da página de raízes
- Uma segunda query busca as respostas de todas as raízes da página de uma vez (`WHERE parent_id IN (...)`).
- **Pros:** duas queries no total, independentemente de quantas raízes; nenhuma espera ao expandir; evita o N+1 por construção.
- **Cons:** carrega resposta que talvez ninguém abra; uma raiz com centenas de respostas obriga a um limite por raiz de qualquer forma, o que reintroduz "ver mais" dentro da thread.

### Option C: Mais relevantes primeiro (por likes), respostas sob demanda
- Ordena raízes por `likes_count` desc com desempate por data.
- **Pros:** destaca a discussão de melhor qualidade; é o default do YouTube.
- **Cons:** o comentário recém-postado **não aparece** onde o autor olha, o que é confuso sem tratamento extra; depende do contador de likes de comentário, acoplando esta leitura ao TD-02; exige um segundo modo de ordenação para que o autor ache o próprio comentário.

**Recommendation:** Option B (recentes primeiro, respostas da página pré-carregadas com limite por raiz) — ordenar por data é o que torna o feedback de postagem correto sem nenhum mecanismo extra, e é coerente com o que a Fase 05 já fez na sidebar de sugestões. Entre A e B, B custa uma query a mais na primeira carga e **elimina** o N+1 que A convida; o limite por raiz que B precisa de qualquer forma é o mesmo controle "ver mais" que a Fase 05 já implementou e que o frontend já sabe renderizar. A Option C é a melhor ordenação para leitura madura, mas depende de volume que o produto ainda não tem, e introduz o problema de "cadê meu comentário" que exigiria resolver um segundo modo de ordenação nesta mesma fase.

**Decision:** B (mais recentes primeiro, respostas pré-carregadas junto da página de raízes) — **10 comentários-raiz por página e até 3 respostas pré-carregadas por raiz**, com "ver mais" dentro da thread acima disso. A paginação por offset/limit é decisão **desta** fase, não herança: o `**Context:**` acima afirma que `video-channel-management/TD-06` fixou offset/limit como padrão do projeto, e isso é falso — aquele TD declara que "vincula apenas as listagens desta fase" e reserva cursor para listas de alta cardinalidade com inserção por muitos autores, que é o perfil de uma thread de comentários. O trade-off fica assumido por escrito: sob concorrência, um comentário novo desloca a página. (resolve IC-2 e AMB-2 do /plan-validate)

---

## TD-06: Modelagem da inscrição e origem da contagem de inscritos

**Scope:** Backend

**Capability:** Transversal — covers: "Inscrição em canais (seguir/deixar de seguir)", "Contagem de inscritos na página do canal"

**Context:** A inscrição em si é uma tabela de junção sem mistério (`user_id` + `channel_id`, único). O que precisa de decisão é a **origem da contagem**: `channels` não tem coluna de contador hoje. O precedente do `video-channel-management/TD-05` desnormalizou os contadores de vídeo, mas o argumento decisivo lá foi que a Fase 07 pagina **listagens** sobre aqueles campos — e a contagem de inscritos é lida na página de um canal, uma linha por vez. O argumento não transfere automaticamente, então a escolha é real.

**Options:**

### Option A: `COUNT` na leitura, sem coluna
- A página do canal agrega `SELECT COUNT(*) FROM subscriptions WHERE channel_id = …`.
- **Pros:** impossível divergir; nenhuma migração de coluna; a consulta é um índice sobre `channel_id`, barata para uma linha.
- **Cons:** se a Fase 07 passar a exibir inscritos numa **listagem** de canais, vira agregação por linha — exatamente o padrão que o TD-05 recusou; o `COUNT` precisaria então virar coluna, pagando a migração depois.

### Option B: `subscribers_count` desnormalizado em `channels`, mantido na mesma transação
- Mesma mecânica escolhida no TD-02 para os contadores de vídeo.
- **Pros:** consistente com o precedente do projeto, um só padrão de contador para manter e testar; leitura O(1) e pronta para qualquer listagem futura; o toggle de inscrição é mais simples que o de reação (dois estados, não três).
- **Cons:** segunda cópia da verdade, com o risco de divergência que o TD-02 discute; migração nova numa tabela que já existe.

### Option C: Coluna desnormalizada com reconciliação periódica
- Como B, mais um job que recalcula a partir da verdade.
- **Pros:** corrige divergência sem intervenção.
- **Cons:** introduz job agendado, que o projeto não tem; resolve um problema que ainda não se observou; o `BullMQ` existe para processamento de vídeo, e usá-lo para isto amplia escopo de infraestrutura sem demanda.

**Recommendation:** Option B (coluna desnormalizada) — não pelo desempenho, que a Option A entrega igualmente bem no caso de hoje, mas por **consistência de padrão**: esta fase já vai construir e testar o mecanismo de contador transacional do TD-02 para likes e comentários, e ter um terceiro contador seguindo regra diferente significa dois modelos mentais, dois jeitos de testar e uma pergunta a mais em cada revisão futura. O custo marginal de B, tendo o mecanismo do TD-02 pronto, é uma coluna e uma chamada. A Option A é a escolha certa se o TD-02 for decidido como `COUNT` derivado — as duas devem andar juntas.

**Decision:** B (`subscribers_count` desnormalizado em `channels`, mantido na mesma transação do inscrever/desinscrever)

---

## TD-07: O que é a "área de canais seguidos"

**Scope:** Cross-layer

**Capability:** "Área de canais seguidos com acesso rápido aos vídeos"

**Context:** "Acesso rápido aos vídeos" admite duas leituras muito diferentes de custo. Uma lista de canais com link para cada página é uma query trivial. Um feed cronológico dos vídeos de todos os canais seguidos é uma consulta sobre a junção de inscrições e vídeos, ordenada por data, paginada — e é o tipo de query que degrada com o número de inscrições. O entregável da fase diz "listagem de canais seguidos", o que puxa para a leitura barata, mas o bullet fala em acesso aos vídeos. Decidir agora evita construir a tela duas vezes.

**Options:**

### Option A: Lista de canais seguidos, com link para a página pública de cada um
- A área mostra avatar, nome e contagem de vídeos; o "acesso rápido" é o link para `/@{nickname}`, que já existe desde a Fase 04.
- **Pros:** uma query simples sobre `subscriptions` com join em `channels`; reusa a página pública de canal já construída e testada; é o que o entregável da fase descreve literalmente.
- **Cons:** "acesso rápido aos vídeos" fica a um clique de distância, não imediato; se a intenção era um feed, a tela será refeita na Fase 07.

### Option B: Feed cronológico dos vídeos dos canais seguidos
- Junção `subscriptions × videos` filtrada por publicado, ordenada por `published_at` desc, paginada.
- **Pros:** entrega literalmente "acesso rápido aos vídeos"; é o valor real de seguir um canal; antecipa parte do trabalho de listagem da Fase 07.
- **Cons:** a query mais cara da fase, e a única cujo custo cresce com o comportamento do usuário; precisa de índice composto pensado; sobrepõe-se ao escopo de listagem/paginação que a Fase 07 já tem como bullet próprio, com risco de construir duas vezes.

### Option C: Lista de canais com prévia dos vídeos recentes de cada um
- Para cada canal seguido, os N vídeos mais recentes, em carrossel ou linha.
- **Pros:** meio-termo visível; mantém a identidade do canal e mostra vídeo.
- **Cons:** é um "top-N por grupo", a consulta mais difícil das três de escrever e indexar bem no Postgres; e entrega menos que o feed cobrando quase a mesma complexidade.

**Recommendation:** Option A (lista de canais) — o entregável da fase diz "listagem de canais seguidos", e a Fase 07 tem como bullets próprios a grade de vídeos, a paginação e o scroll infinito. Construir um feed aqui é antecipar o trabalho da 07 num lugar onde ele será reavaliado, e a Option C paga a complexidade do feed sem entregar o feed. Se a intenção do produto for realmente um feed, o lugar natural é a Fase 07, onde a infraestrutura de listagem será construída uma vez e usada pela home e por esta área. **Esta é a recomendação com maior chance de estar errada por leitura de escopo** — se "acesso rápido aos vídeos" significa feed para você, a Option B é defensável e o custo de decidir isso agora é muito menor que o de descobrir depois.

**Decision:** A (lista de canais seguidos, com link para a página pública de cada um) — inclui o **ponto de entrada de navegação** para a área, acrescentado ao chrome autenticado entregue na Fase 04 (`SiteNavbar` / `UserMenu`), que hoje não tem link algum. (resolve DG-1 do /plan-validate)

---

## TD-08: Feedback da interação na interface

**Scope:** Frontend

**Capability:** "Interface completa de comentários, likes e inscrições"

**Context:** Like, dislike e inscrição são as primeiras mutações do projeto cujo resultado é um estado visual pequeno, imediato e muito repetido — diferente dos formulários das Fases 02 e 04, onde a submissão navega ou recarrega. Esperar o round-trip para pintar o botão é perceptível; e o projeto ainda não tem precedente de atualização otimista nem biblioteca de estado de servidor. `phase-02-auth-frontend/TD-05` já fixou que a mutação sai por Route Handler + `fetch` do cliente, então o que se decide aqui é só o feedback.

**Options:**

### Option A: `useOptimistic` do React 19
- Verificado no `@types/react` instalado (`19.2.4`): duas sobrecargas, a de reducer permitindo `(state, action) => state` — adequada ao toggle de três estados do like.
- **Pros:** é a primitiva da versão de React que o projeto já roda, sem dependência nova; o reverte em caso de erro é automático quando a transição termina; mantém o componente pequeno e o estado onde ele é usado.
- **Cons:** exige `"use client"` no botão e uma transição ao redor da mutação; o estado otimista não sobrevive a navegação, então a lista do servidor precisa estar correta no próximo render.

### Option B: Mutação seguida de `router.refresh()`
- O clique chama o Route Handler e, no sucesso, revalida o segmento.
- **Pros:** uma só fonte de verdade — o servidor; nenhum estado duplicado no cliente; é o padrão que o projeto já usa nos formulários.
- **Cons:** o botão fica inerte até o servidor responder e o RSC re-renderizar, o que num like é a diferença entre parecer instantâneo e parecer travado; `refresh()` revalida o segmento inteiro para mudar um número.

### Option C: Introduzir TanStack Query com cache e mutação otimista
- Biblioteca de estado de servidor no cliente, com invalidação por chave.
- **Pros:** resolve otimismo, cache e revalidação de forma uniforme; escala para a Fase 07.
- **Cons:** dependência nova e um segundo modelo de cache ao lado do cache do App Router, que é exatamente a duplicação que o `next-frontend-config-base/TD-03` evitou ao manter o modelo strict-BFF enxuto; o projeto hoje não tem **nenhum** estado global de cliente, e introduzir isto por causa de botões de like é desproporcional.

**Recommendation:** Option A (`useOptimistic`) — é a única que entrega o feedback imediato sem acrescentar dependência, e a primitiva já está na versão instalada. A Option B é mais simples e seria suficiente para a inscrição, que é clicada uma vez; para like e dislike, que são clicados muito e esperados como instantâneos, ela entrega a pior sensação da fase. A Option C resolve mais do que o problema desta fase e cria um segundo cache ao lado do que o App Router já mantém — se a Fase 07 mostrar necessidade real de cache de cliente, aí é a hora de reabrir, com mais evidência do que botões de like.

**Decision:** A (`useOptimistic` do React 19)

---

## TD-09: Orçamento de rate limit das rotas sociais de escrita

**Scope:** Backend

**Capability:** Transversal — covers: "Like e dislike em vídeos (usuários autenticados)", "Comentários em vídeos (usuários autenticados)", "Respostas a comentários (comentários aninhados)", "Like e dislike em comentários (usuários autenticados)", "Inscrição em canais (seguir/deixar de seguir)"

**Context:** Esta fase cria quatro grupos de rotas de **escrita**: reagir a vídeo, reagir a comentário, criar comentário (incluindo resposta) e inscrever-se/desinscrever-se. Hoje nenhuma delas tem orçamento próprio, e todas herdam o default global — verificado no disco, não suposto: `nestjs-project/src/auth/auth.module.ts:29` registra `ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])` e a linha 35 provê `ThrottlerGuard` como `APP_GUARD`. Herdar não é decidir: **esse número foi escolhido para o fluxo de autenticação**, e o próprio `forRoot` vive dentro do `AuthModule`. Um usuário lendo uma thread e curtindo 11 comentários em um minuto é bloqueado — comportamento legítimo tratado como abuso.

O projeto já tratou exatamente esse erro como digno de TD: `video-watch-page/TD-05` deu `@Throttle({ default: { limit: 30, ttl: 60000 } })` dedicado à rota de contagem de visualização (hoje em `videos.controller.ts:224`) justamente porque o orçamento de navegação não é o de login. Aquele TD também decidiu o **storage em memória**, deixando Redis declarado como caminho para quando houver mais de uma instância — isso é herança e **não se reabre aqui**.

Dois fatos da API da versão instalada (`@nestjs/throttler` 6.5.0) condicionam as opções: `@Throttle()` **substitui** a configuração global da rota, não mescla; e o rastreador padrão é o **IP**, não o usuário — ainda que todas estas rotas sejam autenticadas.

**Options:**

### Option A: Um orçamento único para todas as quatro rotas

Um mesmo `@Throttle({ default: { limit: N, ttl: 60000 } })` em cada rota de escrita social, mantendo o rastreador por IP.

- **Pros:** menor peça móvel; segue literalmente a forma do `video-watch-page/TD-05`; nenhum código além do decorator. Um número só para justificar e revisar.
- **Cons:** trata com o mesmo orçamento duas coisas de perfil oposto — curtir é clique rápido, repetido e legítimo; publicar comentário é o alvo clássico de spam. O número acaba frouxo para um e apertado para o outro.

### Option B: Dois orçamentos, separados por perfil de abuso

Reações e inscrição (toggles, alta frequência legítima, não produzem conteúdo) com limite alto; criação de comentário e de resposta com limite baixo. Ambos via `@Throttle({ default: ... })` por rota, rastreador por IP.

- **Pros:** o orçamento acompanha o risco real. Um toggle idempotente não gera conteúdo visível a terceiros e pode ser generoso; comentário é o que polui a thread dos outros e merece aperto. Nenhuma máquina nova — continua sendo só decorator.
- **Cons:** dois números a justificar e manter em vez de um; a fronteira entre os grupos vira convenção que o próximo autor de rota precisa conhecer.

### Option C: Throttler nomeado dedicado, com rastreador por usuário

Registrar um segundo throttler nomeado (`social`) no `forRoot` e um `getTracker` que use o id do usuário autenticado, caindo para o IP quando não houver sessão.

- **Pros:** é o rastreador correto para rota autenticada. Por IP, usuários atrás de NAT compartilhado — universidade, CGNAT de operadora móvel — dividem um orçamento que não é deles, e quem abusa contorna trocando de IP.
- **Cons:** exige `getTracker` custom e mexe no `forRoot`, que hoje mora dentro do `AuthModule` — alteração de um módulo de outra fase para servir a esta. O ganho é real mas o problema que ele resolve não foi observado no projeto; é otimização contra um cenário previsto, não medido.

### Option D: Aceitar o default global de 10/60 s e registrar por escrito

Nenhum decorator; as rotas novas herdam o orçamento do `AuthModule`, e a decisão fica registrada para que a próxima leitura não reabra a pergunta.

- **Pros:** zero código e zero superfície nova. Honesto quanto ao fato de que o projeto não tem tráfego nem evidência de abuso.
- **Cons:** 10 requisições por minuto cobrindo **todas** as interações sociais somadas é apertado para uso normal — curtir uma thread de comentários estoura sozinho. Repete o erro que o `video-watch-page/TD-05` já corrigiu uma vez, e o sintoma aparece como bug de UI, não como bloqueio legível.

**Recommendation:** **Option B**, com a Option C declarada como caminho para quando houver evidência de colisão por NAT ou de abuso que troca de IP — exatamente a forma como o `video-watch-page/TD-05` declarou o Redis para o caso multi-instância. Três razões. (1) A Option D está fora por um argumento verificável e não por gosto: 10/60 s compartilhado entre like, dislike, comentário e inscrição é estourado por leitura normal de uma thread, e o modo de falha é um botão que para de responder sem explicação. (2) Entre A e B, o que decide é que **as duas pontas têm perfis de abuso opostos** e um número único não serve às duas — e o custo de B sobre A é um segundo valor no mesmo decorator, não um mecanismo novo. (3) A Option C acerta no diagnóstico — por IP é mesmo o rastreador errado para rota autenticada — mas paga com alteração no `forRoot` de outra fase e com código custom para resolver um cenário que o projeto ainda não observou; é uma Revision barata de aplicar depois, sem trocar a letra, se a evidência aparecer.

Valores sugeridos para o preenchimento: **60/60 s** para reações e inscrição, **5/60 s** para criação de comentário e de resposta. Cinco comentários por minuto já é digitação humana rápida; sessenta toggles por minuto cobre leitura ativa de uma thread longa com folga. Os dois números são parâmetros e podem ser revisados por `/decide` sem trocar a opção.

**Decision:** _[pending]_

---

## Decisions Summary

| ID | Scope | Decision | Recommendation | Choice |
|----|-------|----------|---------------|--------|
| TD-01 | Backend | Modelagem das reações (like/dislike em vídeos e comentários) | A (duas tabelas dedicadas, com FK real) | A |
| TD-02 | Backend | Mecanismo de manutenção dos contadores desnormalizados | A (delta no serviço, em transação) | A |
| TD-03 | Cross-layer | Superfície pública do dislike | A (só o estado do usuário, sem contagem) | A |
| TD-04 | Backend | Profundidade e estratégia de armazenamento dos comentários aninhados | A (profundidade 1, `parent_id` nulável) | A |
| TD-05 | Cross-layer | Ordenação e carregamento das respostas | B (recentes primeiro, respostas da página pré-carregadas) | B |
| TD-06 | Backend | Modelagem da inscrição e origem da contagem de inscritos | B (coluna desnormalizada, mesmo padrão do TD-02) | B |
| TD-07 | Cross-layer | O que é a "área de canais seguidos" | A (lista de canais, não feed) | A |
| TD-08 | Frontend | Feedback da interação na interface | A (`useOptimistic` do React 19) | A |
| TD-09 | Backend | Orçamento de rate limit das rotas sociais de escrita | B (dois orçamentos: toggles generoso, comentário apertado) | _[pending]_ |
