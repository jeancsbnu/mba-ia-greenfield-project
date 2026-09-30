---
scope_type: phase
related_phases: [5]
status: decided
date: 2026-09-23
scope_description: "Página de visualização do vídeo: player, contagem de visualizações, sugestões e entrega do arquivo ao player"
---

# Technical Decisions — Página de Visualização do Vídeo

_Subprojects in scope:_

- `nestjs-project/` — expõe a contagem de visualização e a listagem de sugestões; a entrega do arquivo já existe desde a Fase 03 e é revisitada aqui só quanto à validade da URL.
- `next-frontend/` — hospeda o player e a composição da página.

**Nota de método.** O `CLAUDE.md` exige consulta de documentação via **context7** antes de avaliar bibliotecas. O MCP do context7 **não está disponível nesta sessão**, então as opções de player foram fundamentadas em busca web sobre o estado das bibliotecas em 2026. Vale reconferir as versões via context7 antes de implementar o TD-01.

**Decisões herdadas que restringem esta fase** (não reabrir):

- `upload-processing/TD-08` — entrega por URL pré-assinada direto ao storage, sem proxy pela API.
- `video-channel-management/TD-02` — status, publicação e visibilidade são eixos independentes; `unlisted` é publicado e acessível por link, apenas fora das listagens.
- `video-channel-management/TD-05` — `views_count` é contador desnormalizado na tabela `videos`, **criado sem incremento** na Fase 04. Esta fase é a dona do incremento.
- `video-channel-management/TD-01` e `TD-10` — categoria é enum Postgres com oito valores; é a chave das sugestões.
- `video-channel-management/TD-06` — paginação offset/limit nas listagens.

**Capacidades cobertas por decisão herdada ou sem escolha técnica** (registradas para não parecerem omissão):

| Capacidade | Onde se resolve |
|---|---|
| Layout da página: vídeo + informações + sidebar | Composição de primitivos já existentes; sai do `screen-inventory` e do `plan-build`, não é escolha técnica |
| Descrição com expansão/recolhimento | Comportamento de UI sem alternativa relevante |
| Acesso anônimo à visualização | `video-channel-management/TD-02` + `assertServable` (SI-04.7), já implementado |
| Botão de download do vídeo | `upload-processing/TD-08` + SI-04.7; a validade da URL é tratada no TD-02 abaixo |
| Unlisted acessível apenas via link direto | `video-channel-management/TD-02`; a exclusão da sidebar entra como regra no TD-04 |

---

## TD-01: Implementação do player de vídeo

**Scope:** Frontend

**Capability:** "Player de vídeo com controles: play/pause, volume e barra de progresso"

**Context:** A página precisa reproduzir um MP4 entregue por URL pré-assinada (`upload-processing/TD-08`). A capacidade pede três controles — play/pause, volume e barra de progresso —, que é exatamente o conjunto que o elemento nativo já oferece. A escolha define quanto peso de JavaScript entra no bundle e quanto controle se tem sobre a aparência.

**Options:**

### Option A: `<video controls>` nativo
- Usa o elemento HTML, com os controles do próprio navegador. O `src` recebe a URL pré-assinada.
- **Pros:** zero dependência e zero JavaScript adicional; acessibilidade e atalhos de teclado vêm prontos do navegador; suporte a Range e buffering é do próprio agente; nada para manter quando o React muda de major.
- **Cons:** a aparência dos controles varia entre navegadores e não acompanha os tokens do design system; personalizar exige reimplementar os controles à mão.

### Option B: Vidstack (`@vidstack/react`)
- Biblioteca de componentes de player com controles próprios, estilizáveis com os tokens do projeto.
- **Pros:** ~53 kB gzipped com tree-shaking e carregamento tardio das partes pesadas; MIT; sucessora declarada do Plyr; caminho pronto caso apareça HLS, legendas ou DRM.
- **Cons:** acrescenta dependência e superfície de manutenção para entregar controles que o navegador já tem; a fase não pede streaming adaptativo nem legendas.

### Option C: Video.js
- Player veterano, com tema padrão e ecossistema grande de plugins.
- **Pros:** maduro, muito material disponível, e passou a concentrar o esforço que antes estava espalhado entre Plyr, Vidstack e Media Chrome.
- **Cons:** ~195 kB gzipped, quase quatro vezes o Vidstack, para um caso que não usa quase nada do que justifica esse peso.

**Recommendation:** **Option A** — a capacidade descreve exatamente os controles nativos, e a entrega é MP4 progressivo por URL pré-assinada, sem streaming adaptativo, legendas ou DRM que justifiquem uma biblioteca. Trocar 53 kB ou 195 kB por controles que o navegador já fornece é custo sem contrapartida nesta fase. O caminho de saída é claro: se a Fase 07 trouxer HLS, legendas ou telemetria de reprodução, o TD é superseded por Vidstack, que é a opção com melhor relação peso/recursos entre as duas bibliotecas — o Plyr está sendo descontinuado e absorvido pelo Video.js, então não entrou como opção.

**Decision:** A (`<video controls>` nativo)

---

## TD-02: Validade da URL pré-assinada diante da duração da reprodução

**Scope:** Cross-layer

**Capability:** Transversal — covers: "Player de vídeo com controles: play/pause, volume e barra de progresso"; "Botão de download do vídeo"

**Context:** `upload-processing/TD-08` decidiu **o mecanismo** de entrega — URL pré-assinada direto ao storage — mas não a validade. Hoje `StorageService.getPresignedUrl` usa **300 segundos**. Isso não apareceu antes porque nenhuma tela reproduzia vídeo: um arquivo com mais de cinco minutos teria a URL expirada no meio da reprodução, e um download longo seria interrompido. A decisão afeta os dois lados: o backend define o prazo, o frontend precisa saber se tem de lidar com expiração durante o uso.

**Options:**

### Option A: Prazo longo o bastante para cobrir a reprodução
- A URL de stream passa a ser emitida com validade folgada (ordem de horas), separada do prazo curto usado em outros contextos.
- **Pros:** o player não precisa saber de expiração; nada muda no frontend; uma única chamada por sessão de reprodução.
- **Cons:** uma URL vazada vale pelo prazo inteiro; revogar antes disso exige trocar a chave do objeto.

### Option B: Endpoint de renovação acionado na expiração
- O frontend detecta o erro de reprodução, pede uma URL nova e retoma do ponto em que parou.
- **Pros:** mantém o prazo curto, limitando a janela de um link vazado.
- **Cons:** com `<video>` nativo, retomar exige reatribuir o `src` e restaurar `currentTime` na mão, com risco de engasgo visível; acrescenta um caminho de erro que precisa de teste próprio.

### Option C: Proxy de streaming pela API
- A API lê do storage e repassa ao cliente, com suporte a Range.
- **Pros:** controle total de acesso, sem URL exposta.
- **Cons:** contraria diretamente o motivo de `TD-08` — todo o tráfego de vídeo voltaria a passar pela API, que é o custo que aquela decisão evitou.

**Recommendation:** **Option A** — o trade-off de expor um link temporário já foi aceito em `TD-08`; o que falta é dimensionar o prazo para o uso real. A Option C reverte uma decisão vigente e sai de escopo. A Option B resolve um risco que hoje é hipotético, ao custo de um caminho de erro difícil de testar com o player nativo do TD-01; ela é o caminho natural se algum dia surgir requisito de revogação imediata.

**Decision:** A (prazo longo cobrindo a reprodução)

**Clarification (resolvida durante /screen-inventory, 2026-09-24): duas URLs, não uma.** A emissão gera **duas** URLs pré-assinadas, ambas com a validade de 6 h acima e ambas entregues **juntas, na mesma resposta de detalhe do vídeo** — nenhuma chamada extra em tempo de clique:

- **URL de stream** — consumida pelo `src` do `<video>`, entrega inline.
- **URL de download** — a mesma chave de objeto, assinada com `response-content-disposition: attachment; filename="..."`.

O motivo é uma restrição do navegador, não preferência: o atributo `download` do HTML **é ignorado em cross-origin**. Como `upload-processing/TD-08` entrega o arquivo direto do storage, que é outra origem, um `<a download>` apontando para a URL de stream faria o navegador abrir o vídeo em vez de baixá-lo, e o arquivo salvo herdaria o nome da chave de objeto em vez do título. Só o `content-disposition` no lado do storage resolve — e como a assinatura cobre os query params, isso obriga a uma URL distinta.

Consequência para o frontend, registrada no inventário da fase: o botão de download é **Local-interactive** — um `<a>` sobre uma URL que já veio com a página —, e o verbo de emissão pertence ao Server Component da página, não ao botão.

**Dimensionamento (confirmado — ver Revisions):** a validade da URL de stream/download passa a ser de **6 horas**, substituindo os 300 s atuais de `StorageService.getPresignedUrl`. O critério é cobrir com folga a reprodução ou o download de um arquivo longo sem que o link expire no meio do uso; 6 h cobre qualquer duração plausível nesta fase e ainda limita a janela de um link vazado a um mesmo dia. O prazo curto de 300 s continua valendo para os demais contextos de URL pré-assinada — o prazo longo é específico da entrega ao player.

**Revisions:**
- 2026-09-26 — Validade de 6 h confirmada; deixa de ser premissa e passa a valor firme. Mesma Option A, nenhuma mudança de mecanismo. Rationale: resolve OQ-6 (/plan-validate) — o número foi fixado por premissa na redação original e o usuário o confirmou explicitamente no /plan-resolve.

---

## TD-03: Momento e critério de contagem de uma visualização

**Scope:** Cross-layer

**Capability:** "Contagem de visualizações"

**Context:** `video-channel-management/TD-05` criou `views_count` como contador desnormalizado e adiou explicitamente o incremento. Esta fase precisa decidir **o que conta como uma visualização** e **quem dispara a contagem** — a resposta define um contrato entre o backend e o player, e determina o quanto o número resiste a recarga de página e a robô.

**Options:**

### Option A: Incrementa no carregamento da página
- O Server Component que busca o vídeo incrementa o contador na mesma requisição.
- **Pros:** o mais simples; nenhum endpoint novo e nenhum código de cliente.
- **Cons:** conta abrir a página, não assistir; recarregar infla o número, e qualquer rastreador ou pré-carregamento conta como visualização. O número vira métrica de acesso, não de audiência.

### Option B: Endpoint dedicado, disparado pelo player após um limiar
- `POST /videos/{publicId}/view`, chamado pelo player depois de alguns segundos de reprodução efetiva.
- **Pros:** conta reprodução, não visita; imune a pré-carregamento e a robô que não executa mídia; o limiar fica explícito e ajustável.
- **Cons:** um endpoint a mais e um disparo no cliente; sem deduplicação, recarregar e assistir de novo ainda soma.

### Option C: Option B com deduplicação por janela de tempo
- Igual à B, com a contagem ignorada quando a mesma origem repete a visualização dentro de uma janela.
- **Pros:** o número mais próximo de audiência real.
- **Cons:** exige guardar estado por origem — cookie, ou chave em Redis —, o que traz questão de privacidade e uma dependência de infraestrutura para um contador que a fase trata como informativo.

**Recommendation:** **Option B** — separa "abriu a página" de "assistiu", que é a distinção que dá sentido ao número, sem introduzir armazenamento de estado por visitante. A Option A é barata mas entrega uma métrica que engana. A Option C é o destino provável quando a contagem passar a ter peso — em ranking ou recomendação —, e aí o custo de privacidade e infraestrutura se justifica; hoje não.

**Decision:** B (endpoint dedicado após limiar de reprodução)

**Limiar (revertido em 2026-09-29 — ver Revisions):** `POST /videos/{publicId}/view` é disparado pelo player após **5 segundos contínuos de reprodução efetiva** (tempo de mídia avançado, não tempo de página aberta). O valor é baixo o bastante para não perder visualizações legítimas curtas e alto o bastante para descartar pré-carregamento, robô que não executa mídia e abertura acidental. Sem deduplicação nesta fase, conforme a opção escolhida.

**Revisions:**
- 2026-09-26 — Limiar de reprodução efetiva alterado de **5 s para 10 s**. Mesma Option B: o mecanismo continua sendo o endpoint dedicado disparado pelo player, só o valor muda. Rationale: resolve OQ-6 (/plan-validate) — os 5 s eram premissa, não recomendação; 10 s exige intenção real de assistir sem penalizar vídeo curto, ao contrário dos 30 s da referência clássica de mercado, que zeraria a contagem de qualquer vídeo mais curto que isso.
- 2026-09-29 — Limiar **revertido de 10 s para 5 s**, desfazendo a revisão acima. Mesma Option B: o mecanismo não muda, só o valor. Rationale: resolve IC-3 (/plan-validate) — o `**Context:**` do `TD-05` e a prosa inteira do `TD-06` nunca acompanharam a mudança para 10 s e seguiam citando 5 s; das duas formas de alinhar as três fontes, a escolhida foi trazer o `TD-03` de volta ao valor que as outras duas já usavam. **Consequência assumida:** o verbo do inventário e o digest do `context.md` passam a dizer 10 s contra os 5 s desta decisão — o `/plan-resolve` não edita inventário, então fechar isso exige um extension run do `/screen-inventory`.

---

## TD-04: Origem e critério das sugestões da sidebar

**Scope:** Cross-layer

**Capability:** "Sugestões de vídeos da mesma categoria na sidebar"

**Context:** A sidebar lista vídeos da mesma categoria do vídeo em exibição. A categoria é enum Postgres (`video-channel-management/TD-01`, `TD-10`). A decisão define o contrato do endpoint e a ordenação — e precisa respeitar a regra de que rascunhos e `unlisted` nunca aparecem em listagem (`TD-02`), inclusive nesta.

**Options:**

### Option A: Mesma categoria, mais recentes primeiro
- Endpoint devolve publicados e públicos da categoria, ordenados por `published_at` desc, excluindo o vídeo atual.
- **Pros:** determinístico, portanto testável e cacheável; aproveita o índice `['channel_id','published_at']` e pede apenas um índice por categoria; o resultado é estável entre recargas.
- **Cons:** um vídeo antigo e bom nunca aparece; a sidebar fica repetitiva para quem navega muito.

### Option B: Mesma categoria, ordem aleatória
- Igual à A, com ordenação aleatória no banco.
- **Pros:** variedade a cada carregamento; dá sobrevida a conteúdo antigo.
- **Cons:** `ORDER BY random()` faz varredura completa e não escala; resultado não determinístico é ruim de testar e impossível de cachear.

### Option C: Mistura de categoria e popularidade
- Combina mesma categoria com ordenação por `views_count`.
- **Pros:** aproxima o comportamento de uma recomendação real.
- **Cons:** depende de `views_count` ter volume e significado, o que só passa a existir com o TD-03 rodando há algum tempo; fixa um viés de "rico fica mais rico" antes de haver dado para justificá-lo.

**Recommendation:** **Option A** — é a única determinística, e determinismo aqui vale mais do que variedade: permite testar a sidebar sem fixar semente e cachear a resposta. A Option C fica natural quando a contagem do TD-03 tiver histórico; a Option B tem um custo de banco que não se paga.

**Decision:** A (mesma categoria, mais recentes primeiro)

**Revisions:**
- 2026-09-26 — Recorte da sidebar fixado: **4 vídeos por página, com "ver mais" carregando as próximas páginas**. Mesma Option A — origem e ordenação inalteradas (mesma categoria, `published_at` desc, excluindo o vídeo atual, rascunhos e `unlisted`); o que se acrescenta é o tamanho do recorte e a paginação, que a decisão original não fixava. O contrato do endpoint expõe offset/limit, seguindo o padrão de `video-channel-management/TD-06`. Rationale: resolve AMB-1 (/plan-validate) — sem o tamanho, o plan-build não escreveria nem o contrato nem o SI da sidebar. Consequência assumida: o estado visual de "ver mais" e o de sidebar carregando não existem no Figma e serão implementados seguindo os padrões da Fase 04 (ver OQ-3).

---

## TD-05: Proteção contra abuso do endpoint público de contagem

**Scope:** Cross-layer

**Capability:** "Contagem de visualizações"

**Context:** O `TD-03` decidiu `POST /videos/{publicId}/view`, disparado pelo player após 5 s, sem deduplicação. Combinado com a capability "Acesso anônimo à visualização de vídeos", é o primeiro endpoint de **escrita público e não autenticado** do projeto.

**Correção de uma premissa que circulou na validação:** o `validation.md` da fase afirma que o `phase-02-auth/TD-08` escopou o `@nestjs/throttler` "apenas ao `AuthModule`" e que nada protege o endpoint. **Isso é falso.** `APP_GUARD` no NestJS é global independentemente do módulo que o declara — está na [doc oficial de Guards](https://docs.nestjs.com/guards) e no README do `@nestjs/throttler` 6.5.0 instalado ("If you wanted to bind the guard globally, for example, you could do so by adding this provider to **any** module"). A prova está no código: `src/app.controller.ts` carrega `@SkipThrottle()`, o que seria inócuo se o guard não o alcançasse — `AppController` não pertence ao `AuthModule`.

Estado real hoje, em `src/auth/auth.module.ts`: `ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])` mais `{ provide: APP_GUARD, useClass: ThrottlerGuard }`. **Todo endpoint da aplicação já responde a 10 requisições por 60 s por IP**, inclusive o de view quando existir.

A decisão, portanto, não é "adicionar proteção" — é se o default herdado serve. Dois pontos concretos:

1. **O limite de 10/min foi calibrado para login e reset de senha**, onde é apertado de propósito. Para navegação de vídeos ele é restritivo no sentido errado: um usuário legítimo que abre dez vídeos em um minuto começa a tomar 429, e o 429 cai no meio da reprodução. Ao mesmo tempo é frouxo contra abuso — 10/min por IP são 14.400 inflações por dia por IP, num endpoint sem deduplicação.
2. **O armazenamento é em memória** (README, § Storages: "The built in storage is an in memory cache"). Reinício zera a janela, e o `video-worker` já roda como segundo processo — se a API escalar para mais de uma instância, cada uma conta a sua própria janela e o limite efetivo multiplica.

Depende de `TD-03` (é o endpoint que ele criou) e de `phase-02-auth/TD-08` (é o mecanismo que ele escolheu).

**Options:**

### Option A: Aceitar o default global herdado, sem código novo
- O endpoint nasce coberto pelos 10/60s por IP do `ThrottlerModule` já configurado. Nada é escrito.
- **Pros:** custo zero; não há decisão nova para manter; consistente com o `TD-03`, que já aceitou explicitamente a imprecisão da métrica ao recusar deduplicação.
- **Cons:** aplica a um endpoint de navegação um limite calibrado para autenticação, e o 429 chega ao usuário durante a reprodução; não resolve nem o reinício nem o multi-instância.

### Option B: `@Throttle()` dedicado na rota de view, mantendo o armazenamento em memória
- Sobrepõe o default só nessa rota com um par `ttl`/`limit` próprio, via o decorator que o v6 já expõe. O resto da aplicação segue nos 10/60s.
- **Pros:** separa o orçamento de navegação do de autenticação, que é a confusão real; uma linha de decorator, sem infraestrutura nova; permite afrouxar para o usuário legítimo e apertar a janela contra laço trivial de forma independente.
- **Cons:** continua em memória, então reinício e multi-instância seguem em aberto; exige escolher dois números, que viram premissa a confirmar como já aconteceu no `TD-02` e no `TD-03`.

### Option C: Option B mais armazenamento no Redis
- Igual à B, trocando o storage padrão por um adaptador Redis via a opção `storage` do `ThrottlerModule` (o README documenta o ponto de extensão: "You can drop in your own storage option ... so long as the class implements the `ThrottlerStorage` interface"). O Redis **já está no compose e já é dependência da API** — o `nestjs-api` declara `REDIS_HOST`/`REDIS_PORT` e `depends_on: redis`, por causa do BullMQ da Fase 03.
- **Pros:** a janela sobrevive a reinício e é compartilhada entre instâncias, que é a única forma de o limite significar o que diz; aproveita infraestrutura que já está de pé, sem serviço novo; alinha com o `video-worker` já existir como segundo processo.
- **Cons:** acopla o caminho de request ao Redis — se o Redis cair, é preciso decidir se o endpoint falha ou passa direto, o que hoje não é uma preocupação; adiciona uma dependência (`@nest-lab/throttler-storage-redis` ou equivalente) e a configuração do cliente; é mais do que a fase precisa se o deploy seguir sendo de instância única.

### Option D: Exigir um sinal do cliente ligado à emissão da URL
- A API assina, junto das duas URLs pré-assinadas do `TD-02`, um token de curta duração atrelado ao `publicId`; o `POST /view` só aceita com esse token, que só é emitido a quem buscou o detalhe do vídeo.
- **Pros:** é o único que ataca a causa em vez da taxa — exige que o abusador passe pelo fluxo real antes de contar; não sofre com IP compartilhado (NAT, operadora), que é o ponto cego de qualquer limite por IP.
- **Cons:** trabalho consideravelmente maior, em ambos os lados, para uma métrica que o `TD-03` já declarou não precisar de exatidão; o token viaja para o cliente e é replicável dentro da validade, então ele encarece o abuso sem impedi-lo; conflita com a simplicidade que o `TD-03` escolheu deliberadamente.

**Recommendation:** **Option B**, com C como caminho declarado para quando houver mais de uma instância. Três razões. (1) **O problema real desta fase não é a ausência de limite, é o limite errado** — o default existe e já cobre o endpoint; o que não existe é distinção entre um orçamento de autenticação e um de navegação, e é exatamente isso que o `@Throttle()` resolve, com uma linha. (2) **O Redis resolveria um problema que a fase não tem ainda** — reinício e multi-instância são reais, mas o deploy é de instância única até a Fase 07 tratar produção; acoplar o caminho de request ao Redis agora obriga a decidir o comportamento em caso de queda, uma decisão sem informação hoje. Subir de B para C depois é trocar o `storage` do módulo, sem tocar nas rotas. (3) **A Option D é desproporcional a uma métrica que o próprio `TD-03` decidiu não ser exata** — gastar contrato dos dois lados para encarecer, sem impedir, uma inflação de contador contradiz a escolha já feita. A Option A é defensável se a resposta for "a contagem não importa a ponto de justificar uma linha", mas então o 429 no meio da reprodução do usuário legítimo continua, e esse é um custo de produto, não de métrica.

Sobre os números, e explicitamente como premissa a confirmar no mesmo espírito do `TD-02` e do `TD-03`: sugiro **30 requisições por 60 s por IP** nessa rota. Trinta vídeos iniciados por minuto está muito acima de qualquer navegação humana e ainda assim é um terço do que um laço trivial alcançaria contra o default. O número é discutível; o que não é discutível é que ele deve ser diferente do orçamento de login.

**Decision:** B (`@Throttle()` dedicado na rota, storage em memória)
**Libraries:** —

_Sem biblioteca nova: o `@nestjs/throttler` já está instalado e decidido em `phase-02-auth/TD-08`, e o decorator `@Throttle()` vem dele._

**Parâmetros (confirmados em 2026-09-29 — ver Revisions):** **30 requisições por 60 s por IP** nessa rota, sobrepondo o default global de 10/60 s. O storage permanece em memória; subir para a Option C (Redis) fica declarado como o caminho para quando houver mais de uma instância da API, e é uma troca do `storage` do módulo, sem tocar nas rotas.

**Revisions:**
- 2026-09-29 — **30 requisições por 60 s por IP confirmadas**; deixa de ser premissa e passa a valor firme. Mesma Option B, nenhuma mudança de mecanismo. Rationale: resolve OQ-9 (/plan-validate) — o número foi fixado por premissa na redação original, no mesmo espírito do `TD-02` e do `TD-03`, e o usuário o confirmou explicitamente no /plan-resolve.

---

## TD-06: Como os testes simulam os bytes do vídeo

**Scope:** Frontend

**Capability:** Transversal — covers: "Player de vídeo com controles: play/pause, volume e barra de progresso"; "Contagem de visualizações"

**Context:** Esta é a primeira fase que reproduz mídia, e o `next-frontend/CLAUDE.md` registra o ponto como literalmente "TBD" ("Media streaming will eventually come from Object Storage (S3/MinIO) — TBD"). A fase vence o TBD.

Investigando o que existe hoje, o problema é mais fundo do que "o MSW não cobre o storage". Três fatos do código, todos verificados:

1. **Existem dois setups de MSW, com políticas diferentes.** `mocks/setup.ts` (camada Vitest) roda `onUnhandledRequest: "error"` — é o do `next-frontend-msw-foundation/TD-04`. Já `instrumentation.ts` (servidor de dev que o E2E usa) roda `onUnhandledRequest: "bypass"`. A validação da fase citou o `"error"` como se valesse para o E2E; não vale.
2. **O MSW do E2E roda no Node do Next**, sob `NEXT_RUNTIME === "nodejs"`. Ele intercepta o que o **servidor** busca no upstream. A requisição do `<video src>` é feita pelo **navegador**, direto à URL pré-assinada do `TD-02`. Ela nunca passa pelo processo do Next — o MSW não a veria mesmo que a política fosse outra. O problema não é de configuração, é de camada.
3. **O jsdom não reproduz mídia, e não é questão de bytes.** No `jsdom` 29.1.1 instalado, `HTMLMediaElement-impl.js` define `play()`, `pause()` e `load()` como `notImplementedMethod`. `currentTime`, `duration` e `paused` existem como propriedades inicializadas no construtor, mas nada as move e **nenhum `timeupdate` é disparado**. Ou seja: mesmo com bytes perfeitos, um teste de componente não consegue observar reprodução.

O fato 3 é o que mais importa, porque o `TD-03` conta uma visualização após **5 s de reprodução efetiva** — um critério que depende de `timeupdate`, justamente o que o jsdom não entrega. Há, portanto, duas perguntas sob uma: como o componente testa o gatilho dos 5 s, e a que host o `<video src>` aponta no E2E.

Existe precedente no repositório: `mocks/handlers/videos.ts` já devolve `"https://storage.example/custom-thumb.png"`, um host inexistente. A miniatura quebra silenciosamente no teste e ninguém afirma nada sobre os bytes. A pergunta é se isso continua aceitável quando o player é o **assunto** da fase, e não um detalhe de uma listagem.

**Options:**

### Option A: Host falso mais fachada de mídia injetável; nenhum byte real em lugar nenhum
- Os handlers devolvem uma URL em host inexistente, como já fazem com a miniatura. O componente do player recebe os controles de mídia por trás de uma fachada fina (um hook ou prop) que os testes substituem para emitir `timeupdate` e `play` à vontade. O E2E afirma sobre o que é observável no DOM — o `src` correto, os controles presentes, a chamada de view disparada — e não sobre pixels.
- **Pros:** é o único que torna o gatilho dos 5 s testável de forma determinística e rápida, sem esperar 5 s reais; mantém a fronteira do MSW intacta; segue o precedente da miniatura; não adiciona arquivo binário ao repositório.
- **Cons:** nada prova que um `<video>` real reproduz o que o storage entrega; a fachada é superfície de produção existindo para o teste, e precisa ser fina o bastante para não virar mentira.

### Option B: Fixture MP4 mínimo servido pelo próprio Next em rota de teste
- Um MP4 de poucos KB entra em `public/` ou numa rota só de teste; com `MSW_ENABLED`, o handler devolve uma URL same-origin apontando para ele. O navegador busca bytes reais de vídeo.
- **Pros:** o `<video>` reproduz de verdade no E2E, então `timeupdate` acontece e o gatilho dos 5 s pode ser exercitado ponta a ponta; prova a integração que a Option A assume.
- **Cons:** same-origin não exercita o caminho real, que é cross-origin com assinatura — some justamente a classe de erro mais provável (CORS, `Range`, expiração); adiciona binário ao repositório; o teste do gatilho passa a **esperar 5 s de relógio**, caro em suíte que hoje roda inteira em 80 s; e não resolve nada na camada jsdom, onde nem com bytes há reprodução.

### Option C: Interceptar a origem do storage no Playwright via `page.route()`
- O E2E intercepta a requisição do navegador à URL pré-assinada e responde com um MP4 de fixture. Permitido: a proibição de interceptação no navegador vale para `/api/**`, para não furar o BFF — o storage é outra origem e outro serviço.
- **Pros:** exercita o caminho cross-origin de verdade, incluindo a forma da URL assinada; o controle fica no teste, sem rota de produção inventada; casa com a arquitetura do `upload-processing/TD-08`, em que o navegador realmente fala com o storage.
- **Cons:** cobre só o Playwright — a camada de componente continua sem resposta, e é lá que o gatilho dos 5 s é barato de testar; ainda exige um binário de fixture; e `page.route()` sobre mídia com `Range` é notoriamente chato de acertar, porque o player emite requisições parciais.

### Option D: Declarar o player fora do escopo de asserção automatizada
- Os testes cobrem tudo em volta — rota, metadados, sidebar, botão de download, chamada de view — e a reprodução em si fica para verificação manual.
- **Pros:** honesto sobre o limite das ferramentas; custo zero; evita fachada e binário.
- **Cons:** deixa sem rede justamente a capability que dá nome à fase; e não escapa do problema, porque o gatilho dos 5 s do `TD-03` é lógica de negócio que precisa de teste, esteja o player coberto ou não.

**Recommendation:** **Option A como base, com C aplicada a um único E2E de fumaça.** O raciocínio é que as duas perguntas têm respostas diferentes e tentar uma resposta só é o que trava a decisão.

Para o **gatilho dos 5 s**, que é a regra de negócio real e cara de errar, a Option A é a única viável: o jsdom não reproduz mídia por construção, então nenhuma quantidade de bytes ajuda, e a fachada permite afirmar "aos 4,9 s não chama, aos 5,1 s chama uma vez só" em milissegundos. Depender de relógio real aqui, como a B exige, é lento e instável.

Para a **integração**, um único teste em Playwright com `page.route()` na origem do storage responde a pergunta que a A não responde — o `src` aponta para o lugar certo e o elemento consegue carregar — sem espalhar binário e espera por toda a suíte. Um teste, não uma política.

A Option B é a que menos entrega pelo custo: same-origin apaga a característica que torna o caminho real arriscado. A Option D seria aceitável se o gatilho dos 5 s não existisse, mas ele existe e é lógica, não pixel.

Uma consequência que precisa ser aceita junto: a fachada de mídia da Option A é superfície de produção que existe parcialmente para o teste. Vale enquanto for um ponto fino de indireção sobre o elemento; se começar a reimplementar o player, a decisão estará sendo mal aplicada.

**Decision:** A + C (fachada de mídia injetável, mais um E2E de fumaça com `page.route()`)
**Libraries:** —

_Sem biblioteca nova: o `@playwright/test` já está instalado no `next-frontend`, e `page.route()` vem dele._

**Escopo da composição:** a **fachada** é a base e cobre o gatilho de reprodução do `TD-03` na camada de componente, de forma determinística e sem esperar relógio. O **`page.route()`** se aplica a **um único** E2E de fumaça, que prova que o `src` aponta para o lugar certo e que o elemento carrega — não é política para a suíte inteira. Limite aceito junto com a decisão: a fachada é superfície de produção que existe em parte para o teste, e vale enquanto for um ponto fino de indireção sobre o elemento; se começar a reimplementar o player, a decisão está sendo mal aplicada.

---

## Decisions Summary

| ID | Scope | Decision | Recommendation | Choice |
|----|-------|----------|---------------|--------|
| TD-01 | Frontend | Implementação do player de vídeo | A (`<video controls>` nativo) | A |
| TD-02 | Cross-layer | Validade da URL pré-assinada diante da duração da reprodução | A (prazo longo cobrindo a reprodução) | A |
| TD-03 | Cross-layer | Momento e critério de contagem de uma visualização | B (endpoint dedicado após limiar de reprodução) | B |
| TD-04 | Cross-layer | Origem e critério das sugestões da sidebar | A (mesma categoria, mais recentes primeiro) | A |
| TD-05 | Cross-layer | Proteção contra abuso do endpoint público de contagem | B (`@Throttle()` dedicado na rota, storage em memória) | B |
| TD-06 | Frontend | Como os testes simulam os bytes do vídeo | A + C (fachada de mídia injetável, mais um E2E de fumaça com `page.route()`) | A + C |
