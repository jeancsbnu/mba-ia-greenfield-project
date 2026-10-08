---
scope_type: ad-hoc
related_phases: []
status: decided
date: 2026-10-08
scope_description: "Identificação do visitante real atrás do BFF para o rate limit (de onde vem o IP, como ele chega ao Nest e qual é a chave do rastreador) e orçamento das rotas públicas de leitura"
---

# Technical Decisions — Identidade do visitante no rate limit e orçamento das leituras públicas

_Subprojects in scope:_

- `nestjs-project/` — guard e rastreador do `@nestjs/throttler`, regra de confiança no IP repassado e organização dos orçamentos por rota. Coberto por TD-02, TD-03 e TD-04.
- `next-frontend/` — o BFF passa a repassar a identidade do visitante em toda chamada ao upstream. O ponto único de saída é `lib/api/upstream.ts`. Coberto por TD-02.
- **Repo-wide (compose)** — onde o IP real do visitante é estabelecido: a primeira hop que conversa com a internet. Coberto por TD-01.

**Por que existe este documento.** A Revision de 2026-10-08 em `phase-02-auth/TD-08` registrou um defeito confirmado em runtime. Todo request chega ao Nest com o mesmo `req.ip` (`::ffff:172.19.0.1`, gateway da rede do compose), porque é o servidor Next que chama a API (`API_URL=http://host.docker.internal:3000`). O resultado é que o default global de 10/60 s e os orçamentos "por IP" de `video-watch-page/TD-05` e `social-interactions/TD-09` viram **um balde único para o site inteiro**. Na prova, dois visitantes tomaram 429 na 11ª requisição somada.

**Decisões herdadas que restringem esta pesquisa** (não reabrir):

- `phase-02-auth/TD-08` — a biblioteca é o `@nestjs/throttler` (6.5.0 instalado), com `ThrottlerGuard` global via `APP_GUARD`.
- `video-watch-page/TD-05` — `@Throttle` dedicado por rota, **storage em memória**. Redis fica declarado como caminho para mais de uma instância. A troca de storage **não** é decidida aqui.
- `social-interactions/TD-09` — orçamentos de escrita social: 60/60 s para reações e inscrição, 5/60 s para comentários. Declarou a "Option C (throttler nomeado com `getTracker` por usuário)" como Revision barata para quando houvesse evidência de colisão por IP. **Essa evidência agora existe.**
- `next-frontend-config-base/TD-03` — BFF estrito: só o servidor Next fala com o Nest, com `API_URL` server-only.
- `phase-02-auth-frontend/TD-03` — o BFF faz refresh transparente quando o upstream responde 401, então `POST /auth/refresh` é chamado pelo próprio BFF.

**Fatos verificados no disco em 2026-10-08:**

- `auth.module.ts` registra `JwtAuthGuard` **antes** do `ThrottlerGuard` em `APP_GUARD`. O `JwtAuthGuard` anexa `req.user` inclusive em rota `@Public` quando há Bearer válido (comentário do TD-02 do anonymous-gate em `jwt-auth.guard.ts`). Portanto o rastreador do throttler já enxerga o usuário autenticado.
- `ThrottlerGuard.getTracker(req)` é `protected` e sobrescrevível, e `getTracker` também existe como opção do módulo (`throttler-module-options.interface.d.ts`).
- Next 16.2.6: o `base-server.js` faz `req.headers['x-forwarded-for'] ??= socket.remoteAddress`. Um `X-Forwarded-For` enviado pelo próprio visitante passa **intacto**. `NextRequest.ip` foi removido na v15 ("these values are provided by your hosting provider", guia de upgrade).
- O guia de self-hosting do Next recomenda um proxy reverso na frente do servidor, citando inclusive rate limiting. O guia de custom server avisa que ele remove otimizações e **não pode ser usado junto com `output: 'standalone'`**.
- As rotas de autenticação (`register`, `resend-confirmation`, `login`, `refresh`, `forgot-password`, `reset-password`, `logout`) **não** têm `@Throttle` próprio. O aperto de 10/60 s delas é simplesmente o default global, o mesmo que toda leitura pública herda hoje.

> **Nota de método.** O MCP **context7 não estava disponível nesta sessão**, como nas pesquisas das Fases 04, 05 e 07. As APIs foram conferidas nas fontes instaladas: `node_modules/@nestjs/throttler/dist/*.d.ts` (6.5.0) e os docs embarcados do Next 16.2.6 (`node_modules/next/dist/docs/`, guias de self-hosting, custom server e upgrade para a v15). O comportamento de `req.ip` e do `X-Forwarded-For` vem do experimento de runtime registrado na Revision de 2026-10-08 de `phase-02-auth/TD-08`, não de leitura de documentação.

---

## TD-01: Onde o IP real do visitante é estabelecido

**Scope:** Repo-wide

**Trigger:** O Nest nunca vê o visitante, só o servidor Next. E o Next não oferece um IP confiável: `request.ip` não existe e um `X-Forwarded-For` mandado pelo visitante passa direto. Algo antes do Next precisa ser a fonte da verdade sobre quem está do outro lado da conexão.

**Context:** Sem uma fonte confiável, qualquer limite "por IP" é ou um balde único (hoje) ou um limite que o abusador contorna trocando o header a cada requisição. A escolha também decide a forma do ambiente de produção, que é a bullet "Ambiente de produção e deploy" da fatia irmã da Fase 07, ainda sem pesquisa. Por isso o recorte aqui é o **contrato** ("quem escreve o IP e o app confia em quem"), não a escolha do produto de proxy.

**Options:**

### Option A: Proxy reverso de borda que sobrescreve o header de IP
- Um serviço no compose (nginx ou Caddy), na frente do Next em dev e em produção, que **sobrescreve** `X-Forwarded-For`/`X-Real-IP` com o IP do socket. Ele nunca acrescenta ao valor que o cliente mandou. O Next deixa de ter porta publicada e só a borda fala com a internet.
- **Pros:** é o desenho que a doc do Next recomenda para self-hosting; o header forjado pelo visitante é descartado na entrada; a mesma peça é a candidata natural a TLS e a limites de borda quando a Fase 07 tratar de produção; config de poucas linhas, sem código do app.
- **Cons:** um container a mais no dev e uma mudança na porta/URL de acesso ao front. No Docker Desktop do dev o proxy também vê o gateway da rede, então o dev continua "um visitante só", o que é esperado, mas **não prova o mecanismo localmente** sem um segundo cliente. Antecipa uma peça da fatia de deploy.

### Option B: Custom server do Next que reescreve o header
- Um `server.ts` próprio cria o servidor HTTP, apaga o `x-forwarded-for` recebido e o preenche com `socket.remoteAddress` antes de entregar a requisição ao Next.
- **Pros:** nenhum serviço novo; o IP vem do socket, sem depender de configuração externa.
- **Cons:** a doc do Next diz que o custom server remove otimizações (Automatic Static Optimization) e **não pode ser usado com `output: 'standalone'`**, que é o formato natural da imagem de produção; vira código de infraestrutura que o projeto passa a manter; atrás de qualquer proxy futuro o socket volta a ser o do proxy e a regra precisa mudar.

### Option C: Confiar no `X-Forwarded-For` como o Next entrega
- O BFF usa o valor mais à esquerda do `x-forwarded-for` que o Next já monta.
- **Pros:** custo zero e nenhuma peça nova; funciona para o cliente honesto.
- **Cons:** é forjável por definição. Um laço que manda um IP falso diferente a cada requisição ganha orçamento infinito, e o limite vira cortesia para quem se comporta bem. Só faz sentido se o limite de verdade existir em outro lugar.

**Recommendation:** Option A, fixando nesta decisão só o contrato: **o IP do visitante é escrito pela borda e o app nunca confia em `X-Forwarded-For` vindo do cliente**. O produto (nginx ou Caddy) e a parte de TLS ficam para a pesquisa de produção da Fase 07, que vai precisar dessa peça de qualquer forma. A Option B só se pagaria se não houvesse proxy em produção, e o próprio Next recomenda que haja; ela ainda bloqueia o `standalone`. A Option C mantém o defeito de hoje, trocando o balde único por um limite que o abusador escolhe contornar.

**Decision:** A (proxy de borda que sobrescreve o header de IP) — **nesta task entra só o lado do app**: o BFF lê o `x-forwarded-for` como o Next o entrega, confiável quando uma borda o sobrescreve e forjável enquanto ela não existir; o produto do proxy e o TLS ficam para a pesquisa de produção da Fase 07, e o código do app não muda quando a borda chegar. (resolve OQ-1 e AMB-1 do /plan-validate)

**Revisions:**
- 2026-10-08 — Recorte de entrega desta task: **só o lado do app** — repasse de `X-Client-IP` com `INTERNAL_API_SECRET` (TD-02) e `getTracker` (TD-03). O BFF lê o `x-forwarded-for` como o Next 16 o
  entrega: confiável quando uma borda o sobrescreve, **forjável enquanto ela não existir** (o Next só o preenche quando ausente). **Nenhum SI de proxy nem de compose nesta task**; produto do proxy e TLS
  ficam para a fatia de deploy da Fase 07, e o código do app não muda quando a borda chegar. Mesma Option A. Rationale: recorte de entrega fixado no /plan-resolve (AMB-1), registrado aqui porque
  o `**Decision:**` não chega ao `context.md` e o `/plan-build` lê esta prosa (resolve IC-2 do /plan-validate).

---

## TD-02: Como o BFF entrega o IP ao Nest e quando o Nest confia nele (contrato do header)

**Scope:** Cross-layer

**Trigger:** Mesmo com o IP real conhecido no BFF, o Nest só recebe o socket do servidor Next. É preciso um contrato entre os dois lados que diga **qual** header carrega o visitante e **por que** o Nest pode acreditar nele.

**Context:** O experimento de runtime mostrou que `trust proxy` restrito à rede do compose não resolve no topo atual. O BFF e qualquer processo no host (Swagger, curl, testes) chegam ao Nest pelo mesmo gateway `172.19.0.1`, então a rede não distingue o BFF de um chamador qualquer, e qualquer um deles poderia forjar o header. Os dois lados mudam: o BFF passa a anexar a identidade em toda chamada (ponto único: o `fetch` de `lib/api/upstream.ts`) e o Nest passa a decidir o rastreador a partir dela (sobrescrevendo `getTracker`). Depende do TD-01, que diz de onde o BFF tira o IP.

**Options:**

### Option A: Header dedicado autenticado por segredo compartilhado
- O BFF envia `X-Client-IP` (o IP escrito pela borda) junto de um segredo de serviço (`X-Internal-Token`, ou um HMAC do IP com o segredo). O Nest só usa `X-Client-IP` como rastreador quando o segredo confere; sem segredo, cai no `req.ip`. Uma chave de env nova, `INTERNAL_API_SECRET`, entra no schema Joi do Nest, no `@t3-oss/env-nextjs` do Next e nos dois `compose.yaml`/`.env.example`.
- **Pros:** funciona na topologia atual de dois stacks via `host.docker.internal`, sem mudar rede; quem não tem o segredo (Swagger, curl, outro container) volta ao IP do socket e não consegue se passar por visitante; o lado do BFF é uma linha num ponto só.
- **Cons:** um segredo novo para gerir e rotacionar, e um contrato de env atravessando quatro arquivos; se o segredo vazar, o forjamento volta; os testes de integração do Nest precisam montar o header.

### Option B: Confiança por rede (`trust proxy`) com o Nest isolado atrás do Next
- Unificar a rede dos dois stacks: o BFF passa a chamar `nestjs-api:3000` pelo nome do serviço, como pede o `CLAUDE.md`, e o Nest deixa de publicar porta em produção. O Express recebe `trust proxy` com o endereço do container do Next, e o BFF repassa o `X-Forwarded-For` padrão.
- **Pros:** mecanismo padrão do Express (`req.ip` passa a ser o visitante sem guard customizado); nenhum segredo novo; alinha com a regra de nomes de serviço do repositório.
- **Cons:** exige reorganizar os dois `compose.yaml` numa rede comum, o que muda como os stacks sobem hoje. Em dev a porta do Nest continua publicada para Swagger e testes, então dev e produção passam a confiar de formas diferentes. A confiança depende de o isolamento de rede nunca regredir.

### Option C: Tirar o limite por IP do Nest e deixá-lo na borda
- O proxy do TD-01 aplica os limites por IP (`limit_req` do nginx, por exemplo). O throttler do Nest fica só com limites por usuário autenticado.
- **Pros:** sem contrato BFF↔Nest; o limite por IP acontece onde o IP é verdadeiro.
- **Cons:** limites de borda são por caminho de URL, sem a semântica de rota que hoje está nos decorators (`SOCIAL_THROTTLE`, os 30/60 s da view); o brute force de login por IP sai do código e vai para config de proxy, fora dos testes do Nest; os orçamentos decididos em três TDs teriam de ser reescritos como config.

**Recommendation:** Option A. É a única que funciona sem reorganizar a rede dos dois stacks e que mantém os orçamentos já decididos (`video-watch-page/TD-05`, `social-interactions/TD-09`) onde estão, nos decorators do Nest, mudando só **quem** é a chave. O custo é uma chave de env cross-component, que é o mesmo tipo de contrato que `next-frontend-config-base/TD-03` já gere. A Option B é o caminho mais limpo **se** a Fase 07 de produção unificar as redes de qualquer forma; nesse caso ela pode suceder a A sem tocar nos decorators.

**Decision:** A (`X-Client-IP` + segredo compartilhado `INTERNAL_API_SECRET`; sem segredo válido, o Nest usa `req.ip`). (resolve OQ-2 do /plan-validate)

---

## TD-03: Chave do rastreador — IP ou usuário

**Scope:** Backend

**Trigger:** Com o IP real disponível (TD-01 e TD-02), ainda é preciso decidir se usuários autenticados são contados pelo IP ou pela conta. `social-interactions/TD-09` deixou o rastreador por usuário declarado como Revision para quando houvesse evidência de colisão por IP, e ela agora existe.

**Context:** Visitantes atrás do mesmo NAT (universidade, operadora móvel, escritório) compartilham IP. Para quem está logado, a conta é uma identidade melhor que o IP, e o `req.user` já está disponível no `ThrottlerGuard` porque o `JwtAuthGuard` roda antes, inclusive em rota pública com Bearer. Para anônimos, incluindo `login`, `register` e `forgot-password`, só existe o IP.

**Options:**

### Option A: IP para todos
- O rastreador é sempre o IP do visitante (TD-02).
- **Pros:** uma regra só; não depende do token.
- **Cons:** pessoas legítimas sob o mesmo NAT continuam dividindo o balde nas rotas de escrita social, justamente o caso que o `social-interactions/TD-09` previu.

### Option B: Usuário quando autenticado, IP quando anônimo
- `getTracker` devolve `user:<sub>` quando há `req.user` e `ip:<ip>` caso contrário.
- **Pros:** resolve a colisão por NAT para quem está logado, que são todas as rotas de escrita social; é exatamente a Revision que o `social-interactions/TD-09` já previa; o anônimo continua contido por IP.
- **Cons:** um token roubado ganha um balde próprio, separado do IP; a chave muda de forma no meio da sessão (antes e depois do login), o que é aceitável para janelas de 60 s.

### Option C: Dois throttlers nomeados (por IP e por usuário) aplicados juntos
- Cada requisição autenticada consome dos dois baldes, e o 429 vem do primeiro que estourar.
- **Pros:** contém tanto a conta abusiva quanto o IP abusivo com várias contas.
- **Cons:** dobra os números a calibrar em cada rota; reintroduz o problema de NAT pelo balde de IP; complexidade sem caso concreto que a justifique hoje.

**Recommendation:** Option B. É a Revision que `social-interactions/TD-09` já tinha deixado pronta, e a evidência que ela esperava agora existe. A conta é a identidade certa onde existe conta, e o IP fica para o anônimo. A Option C só se justifica se aparecer abuso por várias contas no mesmo IP, e a migração de B para C é aditiva.

**Decision:** B (`user:<sub>` quando há `req.user`, `ip:<ip>` para anônimo) — registrado como Revision em `social-interactions/TD-09`, que já previa esse rastreador sem trocar a própria letra. (resolve OQ-3 do /plan-validate)

---

## TD-04: Orçamento das rotas públicas de leitura e organização dos orçamentos

**Scope:** Backend

**Trigger:** Toda rota sem decorator herda o default de 10/60 s, que foi calibrado para login. Com a identidade corrigida, o limite deixa de ser global, mas continua errado para navegação: a página de um vídeo sozinha faz várias chamadas ao upstream (detalhe, sugestões, comentários e a view).

**Context:** Hoje o default global **é** o orçamento de autenticação. As rotas de auth não têm `@Throttle` próprio, e toda leitura pública nova (canal, vídeo, sugestões, comentários e, em breve, home e busca da Fase 07) nasce com o limite de login. Foi esse arranjo que levou `home-busca/TD-09` a recomendar isentar home e busca. A decisão aqui é a direção do default e o número das leituras. Depende do TD-03, que define a chave por visitante.

**Options:**

### Option A: Isentar as leituras públicas (`@SkipThrottle()`)
- GETs públicos ficam fora do throttler, e a contenção depende da borda (TD-01) e de limites de contrato (`limit` máximo, tamanho de termo).
- **Pros:** zero números para calibrar; nenhum 429 em navegação legítima.
- **Cons:** a busca (`ILIKE` sem índice para termos curtos) e as listagens ficam sem freio no app; scraping ilimitado; a proteção passa a depender de configuração fora do código.

### Option B: Inverter o default — leitura no global, autenticação explícita
- O default do `ThrottlerModule` passa a ser o orçamento de leitura, com premissa de **120 requisições por 60 s por visitante**. As rotas de autenticação recebem `@Throttle(AUTH_THROTTLE)` explícito, mantendo 10/60 s, numa constante no mesmo padrão de `SOCIAL_THROTTLE`. Os decorators de view e social não mudam.
- **Pros:** uma rota pública nova nasce com o orçamento certo, e o arranjo que produziu o `home-busca/TD-09` deixa de existir; o aperto de login fica escrito onde importa, em vez de ser um efeito colateral do default; não exige decorator em cada leitura.
- **Cons:** uma rota de autenticação nova sem o decorator nasce frouxa, então o risco migra para o lado oposto e precisa de um teste que verifique o decorator no `AuthController`; o número 120 é premissa a confirmar.

### Option C: Manter o default de 10/60 s e anotar cada leitura com `@Throttle(READ_THROTTLE)`
- O default continua sendo o de autenticação, e cada GET público recebe o decorator de leitura.
- **Pros:** o que for esquecido fica apertado, o lado seguro para escrita; mudança local por rota.
- **Cons:** toda leitura nova precisa lembrar do decorator, e foi o esquecimento desse padrão que produziu o problema da home; são muitas rotas para anotar agora (canal, vídeo, sugestões, comentários, home, busca).

**Recommendation:** Option B, com **120/60 s por visitante como premissa a confirmar**. A conta é esta: uma página de vídeo custa cerca de 4 chamadas ao upstream, então 120/min equivale a uns 30 vídeos abertos por minuto, muito acima de navegação humana. Inverter o default troca "toda leitura nova nasce com limite de login" por "toda rota de auth precisa do decorator", que é um conjunto **fechado e pequeno** (7 rotas num controller só) e testável. A Option A tiraria o freio da busca, que é a consulta mais cara da plataforma. Com B, o `home-busca/TD-09` fica resolvido sem caso especial: home e busca caem no default de leitura, e o resolve daquela fatia deve alinhar a letra a esta decisão.

**Decision:** B (o default global vira o orçamento de leitura: **120 req/60 s por visitante**; `@Throttle(AUTH_THROTTLE)` com **10/60 s** nos 6 handlers sensíveis do `AuthController` — `register`, `confirm-email`, `resend-confirmation`, `login`, `forgot-password` e `reset-password`; `refresh`, `logout` e `me` ficam no default) — escritas autenticadas de dono sem decorator próprio (`PATCH /videos/:publicId`, `PATCH` do canal) **aceitam o default**, contadas por usuário pelo TD-03. Registrado como Revision em `phase-02-auth/TD-08`. (resolve OQ-4 e AMB-2 do /plan-validate)

**Revisions:**
- 2026-10-08 — Valores firmes: **120 req/60 s por visitante confirmado** (deixa de ser premissa) como default global. `@Throttle(AUTH_THROTTLE)` com **10/60 s** em **6** handlers do `AuthController`, não 7:
  `register`, `confirm-email`, `resend-confirmation`, `login`, `forgot-password` e `reset-password`; `refresh` (chamado pelo BFF no 401), `logout` e `me` ficam no default. Escritas autenticadas
  de dono sem decorator próprio (`PATCH /videos/:publicId`, `PATCH` do canal) **aceitam o default**, contadas por usuário (TD-03). Este default substitui como vigente o "aplicação inteira, a 10 req/60 s
  por IP" de `phase-02-auth/TD-08` (Revision de 2026-10-08 naquele TD). Mesma Option B. Rationale: premissa substituída por valor firme no /plan-resolve (AMB-2/OQ-4), registrada aqui porque o
  `**Decision:**` não chega ao `context.md` e o `/plan-build` lê esta prosa (resolve IC-1 do /plan-validate).

---

## Decisions Summary

| ID | Scope | Decision | Recommendation | Choice |
|----|-------|----------|---------------|--------|
| TD-01 | Repo-wide | Onde o IP real do visitante é estabelecido | A (proxy de borda sobrescreve o header; produto e TLS ficam para a pesquisa de produção da Fase 07) | A — só o lado do app nesta task; borda na pesquisa de produção da Fase 07 |
| TD-02 | Cross-layer | Contrato do header de identidade BFF → Nest | A (`X-Client-IP` + segredo compartilhado `INTERNAL_API_SECRET`; sem segredo, `req.ip`) | A |
| TD-03 | Backend | Chave do rastreador | B (usuário quando autenticado, IP quando anônimo) | B |
| TD-04 | Backend | Orçamento das leituras públicas | B (default global vira leitura, 120/60 s premissa; auth com `@Throttle(AUTH_THROTTLE)` 10/60 s explícito) | B — 120/60 s; AUTH_THROTTLE 10/60 s em 6 handlers |
