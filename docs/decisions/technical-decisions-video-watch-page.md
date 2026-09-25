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

**Dimensionamento (premissa a confirmar):** a validade da URL de stream/download passa a ser de **6 horas**, substituindo os 300 s atuais de `StorageService.getPresignedUrl`. O critério é cobrir com folga a reprodução ou o download de um arquivo longo sem que o link expire no meio do uso; 6 h cobre qualquer duração plausível nesta fase e ainda limita a janela de um link vazado a um mesmo dia. O prazo curto de 300 s continua valendo para os demais contextos de URL pré-assinada — o prazo longo é específico da entrega ao player.

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

**Limiar (premissa a confirmar):** `POST /videos/{publicId}/view` é disparado pelo player após **5 segundos contínuos de reprodução efetiva** (tempo de mídia avançado, não tempo de página aberta). O valor é baixo o bastante para não perder visualizações legítimas curtas e alto o bastante para descartar pré-carregamento, robô que não executa mídia e abertura acidental. Sem deduplicação nesta fase, conforme a opção escolhida.

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

---

## Decisions Summary

| ID | Scope | Decision | Recommendation | Choice |
|----|-------|----------|---------------|--------|
| TD-01 | Frontend | Implementação do player de vídeo | A (`<video controls>` nativo) | A |
| TD-02 | Cross-layer | Validade da URL pré-assinada diante da duração da reprodução | A (prazo longo cobrindo a reprodução) | A |
| TD-03 | Cross-layer | Momento e critério de contagem de uma visualização | B (endpoint dedicado após limiar de reprodução) | B |
| TD-04 | Cross-layer | Origem e critério das sugestões da sidebar | A (mesma categoria, mais recentes primeiro) | A |
