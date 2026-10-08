---
kind: task
name: task-rate-limit-visitor-identity
sources_mtime:
  docs/decisions/technical-decisions-rate-limit-visitor-identity.md: "2026-10-08 17:49:24.831258700 -0300"
  docs/decisions/technical-decisions-phase-02-auth.md: "2026-10-08 17:15:36.637194400 -0300"
  docs/decisions/technical-decisions-phase-02-auth-frontend.md: "2026-06-29 19:03:26.326787900 -0300"
  docs/decisions/technical-decisions-phase-01-configuracao-base.md: "2026-06-29 19:03:26.324780000 -0300"
  docs/decisions/technical-decisions-home-busca.md: "2026-10-08 14:26:59.559714000 -0300"
  docs/phases/phase-06-social-interactions/context.md: "2026-10-04 20:51:04.057909500 -0300"
  .claude/skills/testing-guide-nestjs-project/SKILL.md: "2026-10-08 09:21:00.084453800 -0300"
  .claude/skills/testing-guide-next-frontend/SKILL.md: "2026-06-29 19:03:26.177896400 -0300"
sources_hash:
  docs/decisions/technical-decisions-rate-limit-visitor-identity.md: "0d1493a08793"
  docs/decisions/technical-decisions-phase-02-auth.md: "5035089bc4c6"
  docs/decisions/technical-decisions-phase-02-auth-frontend.md: "db21f0e40476"
  docs/decisions/technical-decisions-phase-01-configuracao-base.md: "60d0c41981c7"
  docs/decisions/technical-decisions-home-busca.md: "5d62495359b9"
  docs/phases/phase-06-social-interactions/context.md: "8732f61e249e"
  .claude/skills/testing-guide-nestjs-project/SKILL.md: "f0b3a8582444"
  .claude/skills/testing-guide-next-frontend/SKILL.md: "9942ebfdb06d"
---

# task-rate-limit-visitor-identity — Context

## Scope

> Identificação do visitante real atrás do BFF para o rate limit (de onde vem o IP, como ele chega ao Nest e qual é a chave do rastreador) e orçamento das rotas públicas de leitura

## Decisions Index

| Ref | Source | Scope | Topic | Status | Decision | Libraries |
|-----|--------|-------|-------|--------|----------|-----------|
| rate-limit-visitor-identity/TD-01 | ad-hoc | Repo-wide | Onde o IP real do visitante é estabelecido | decided | A (proxy de borda que sobrescreve o header de IP; nesta task só o lado do app) | — |
|     └─ Last revision: 2026-10-08 — Recorte de entrega desta task: **só o lado do app** — repasse de `X-Client-IP`… | | | | | | |
| rate-limit-visitor-identity/TD-02 | ad-hoc | Cross-layer | Como o BFF entrega o IP ao Nest e quando o Nest confia nele | decided | A (`X-Client-IP` + `INTERNAL_API_SECRET`; sem segredo válido, `req.ip`) | — |
| rate-limit-visitor-identity/TD-03 | ad-hoc | Backend | Chave do rastreador — IP ou usuário | decided | B (`user:<sub>` autenticado, `ip:<ip>` anônimo) | — |
| rate-limit-visitor-identity/TD-04 | ad-hoc | Backend | Orçamento das rotas públicas de leitura e organização dos… | decided | B (default global 120/60 s; `AUTH_THROTTLE` 10/60 s em 6 handlers do AuthController) | — |
|     └─ Last revision: 2026-10-08 — Valores firmes: **120 req/60 s por visitante confirmado** (deixa de ser… | | | | | | |

_Source files:_

- rate-limit-visitor-identity — docs/decisions/technical-decisions-rate-limit-visitor-identity.md (scope_type: ad-hoc, related_phases: [])

## Decisions Detail

### rate-limit-visitor-identity/TD-01

**Recommendation:** Option A, fixando nesta decisão só o contrato: **o IP do visitante é escrito pela borda e o app nunca confia em `X-Forwarded-For` vindo do cliente**. O produto (nginx ou Caddy) e a parte de TLS ficam para a pesquisa de produção da Fase 07, que vai precisar dessa peça de qualquer forma. A Option B só se pagaria se não houvesse proxy em produção, e o próprio Next recomenda que haja; ela ainda bloqueia o `standalone`. A Option C mantém o defeito de hoje, trocando o balde único por um limite que o abusador escolhe contornar.
**Libraries:** —

**Revisions:**
- 2026-10-08 — Recorte de entrega desta task: **só o lado do app** — repasse de `X-Client-IP` com `INTERNAL_API_SECRET` (TD-02) e `getTracker` (TD-03). O BFF lê o `x-forwarded-for` como o Next 16 o
  entrega: confiável quando uma borda o sobrescreve, **forjável enquanto ela não existir** (o Next só o preenche quando ausente). **Nenhum SI de proxy nem de compose nesta task**; produto do proxy e TLS
  ficam para a fatia de deploy da Fase 07, e o código do app não muda quando a borda chegar. Mesma Option A. Rationale: recorte de entrega fixado no /plan-resolve (AMB-1), registrado aqui porque
  o `**Decision:**` não chega ao `context.md` e o `/plan-build` lê esta prosa (resolve IC-2 do /plan-validate).

### rate-limit-visitor-identity/TD-02

**Recommendation:** Option A. É a única que funciona sem reorganizar a rede dos dois stacks e que mantém os orçamentos já decididos (`video-watch-page/TD-05`, `social-interactions/TD-09`) onde estão, nos decorators do Nest, mudando só **quem** é a chave. O custo é uma chave de env cross-component, que é o mesmo tipo de contrato que `next-frontend-config-base/TD-03` já gere. A Option B é o caminho mais limpo **se** a Fase 07 de produção unificar as redes de qualquer forma; nesse caso ela pode suceder a A sem tocar nos decorators.
**Libraries:** —

### rate-limit-visitor-identity/TD-03

**Recommendation:** Option B. É a Revision que `social-interactions/TD-09` já tinha deixado pronta, e a evidência que ela esperava agora existe. A conta é a identidade certa onde existe conta, e o IP fica para o anônimo. A Option C só se justifica se aparecer abuso por várias contas no mesmo IP, e a migração de B para C é aditiva.
**Libraries:** —

### rate-limit-visitor-identity/TD-04

**Recommendation:** Option B, com **120/60 s por visitante como premissa a confirmar**. A conta é esta: uma página de vídeo custa cerca de 4 chamadas ao upstream, então 120/min equivale a uns 30 vídeos abertos por minuto, muito acima de navegação humana. Inverter o default troca "toda leitura nova nasce com limite de login" por "toda rota de auth precisa do decorator", que é um conjunto **fechado e pequeno** (7 rotas num controller só) e testável. A Option A tiraria o freio da busca, que é a consulta mais cara da plataforma. Com B, o `home-busca/TD-09` fica resolvido sem caso especial: home e busca caem no default de leitura, e o resolve daquela fatia deve alinhar a letra a esta decisão.
**Libraries:** —

**Revisions:**
- 2026-10-08 — Valores firmes: **120 req/60 s por visitante confirmado** (deixa de ser premissa) como default global. `@Throttle(AUTH_THROTTLE)` com **10/60 s** em **6** handlers do `AuthController`, não 7:
  `register`, `confirm-email`, `resend-confirmation`, `login`, `forgot-password` e `reset-password`; `refresh` (chamado pelo BFF no 401), `logout` e `me` ficam no default. Escritas autenticadas
  de dono sem decorator próprio (`PATCH /videos/:publicId`, `PATCH` do canal) **aceitam o default**, contadas por usuário (TD-03). Este default substitui como vigente o "aplicação inteira, a 10 req/60 s
  por IP" de `phase-02-auth/TD-08` (Revision de 2026-10-08 naquele TD). Mesma Option B. Rationale: premissa substituída por valor firme no /plan-resolve (AMB-2/OQ-4), registrada aqui porque o
  `**Decision:**` não chega ao `context.md` e o `/plan-build` lê esta prosa (resolve IC-1 do /plan-validate).

## Inherited Decisions Detail

### social-interactions/TD-01

**Recommendation:** o fator decisivo é que a Option B abre mão de FK justamente num projeto onde vídeos e comentários serão apagados, e a limpeza manual de órfãos é dívida silenciosa. Entre A e C, as duas preservam integridade; A ganha por legibilidade e por índices mais simples, e o custo que ela cobra — duplicação de duas colunas e de um serviço pequeno — é baixo e visível, ao contrário do custo de C, que é um `CHECK` e dois índices parciais que crescem a cada alvo novo. O ganho de B só se realizaria com muitos alvos, e esta fase tem exatamente dois.
**Libraries:** —

### social-interactions/TD-02

**Recommendation:** a Option C está fora por contrariar decisão herdada que já ponderou o mesmo trade-off. Entre A e B, o argumento de B é real e é o mais forte em corretude; o que decide contra ele neste projeto é que a Fase 05 **já mostrou o custo de testar concorrência aqui**: o teste de duas chamadas simultâneas passou, mas o aviso do driver `pg` revelou que as queries foram serializadas no mesmo client, de modo que a atomicidade veio do SQL e não da observação do teste. Trigger moveria mais lógica para essa zona difícil de observar. A Option A mantém a aritmética do toggle — que é a parte com ramificação de verdade — em código testável sem banco, e o `UPDATE … SET x = x + :d` continua atômico no nível do SQL exatamente como o `views_count` da Fase 05. O risco que A aceita é escrita fora do serviço; mitiga-se mantendo a tabela de reações sem nenhum outro produtor.
**Libraries:** —

### social-interactions/TD-03

**Recommendation:** é a que não mexe em schema nem em contrato, e a assimetria que ela introduz é a convenção que o usuário já encontra nas plataformas de vídeo atuais, não uma invenção deste projeto. A Option C é tentadora por "deixar pronto", mas o projeto já tem a lição de colunas inertes: `likes_count` ficou em zero da Fase 04 até esta, e o custo de mantê-las nunca é zero. Se a tela da Fase 06, quando desenhada, mostrar um número de dislikes, a Option B é uma migração pequena e isolada — muito mais barata que carregar uma coluna sem consumidor por fases a fio.
**Libraries:** —

### social-interactions/TD-04

**Recommendation:** a limitação verificada do `TreeRepository` tira boa parte do apelo de B e C: adotá-las e ainda assim escrever a listagem em query builder cru é pagar a complexidade sem receber a conveniência. Entre A e D, o que decide é que a profundidade ilimitada é uma capacidade que o produto não pediu — a capability diz "respostas a comentários", e respostas a respostas não aparecem em nenhum outro bullet nem no entregável da fase. A Option A entrega o que está escrito com SQL comum, paginável e ordenável, e deixa a porta aberta: `parent_id` nulável é o mesmo schema de D, então aprofundar depois é mudar leitura e UI, não migrar dados.
**Libraries:** —

### social-interactions/TD-05

**Recommendation:** ordenar por data é o que torna o feedback de postagem correto sem nenhum mecanismo extra, e é coerente com o que a Fase 05 já fez na sidebar de sugestões. Entre A e B, B custa uma query a mais na primeira carga e **elimina** o N+1 que A convida; o limite por raiz que B precisa de qualquer forma é o mesmo controle "ver mais" que a Fase 05 já implementou e que o frontend já sabe renderizar. A Option C é a melhor ordenação para leitura madura, mas depende de volume que o produto ainda não tem, e introduz o problema de "cadê meu comentário" que exigiria resolver um segundo modo de ordenação nesta mesma fase.
**Libraries:** —

### social-interactions/TD-06

**Recommendation:** não pelo desempenho, que a Option A entrega igualmente bem no caso de hoje, mas por **consistência de padrão**: esta fase já vai construir e testar o mecanismo de contador transacional do TD-02 para likes e comentários, e ter um terceiro contador seguindo regra diferente significa dois modelos mentais, dois jeitos de testar e uma pergunta a mais em cada revisão futura. O custo marginal de B, tendo o mecanismo do TD-02 pronto, é uma coluna e uma chamada. A Option A é a escolha certa se o TD-02 for decidido como `COUNT` derivado — as duas devem andar juntas.
**Libraries:** —

### social-interactions/TD-07

**Recommendation:** o entregável da fase diz "listagem de canais seguidos", e a Fase 07 tem como bullets próprios a grade de vídeos, a paginação e o scroll infinito. Construir um feed aqui é antecipar o trabalho da 07 num lugar onde ele será reavaliado, e a Option C paga a complexidade do feed sem entregar o feed. Se a intenção do produto for realmente um feed, o lugar natural é a Fase 07, onde a infraestrutura de listagem será construída uma vez e usada pela home e por esta área. **Esta é a recomendação com maior chance de estar errada por leitura de escopo** — se "acesso rápido aos vídeos" significa feed para você, a Option B é defensável e o custo de decidir isso agora é muito menor que o de descobrir depois.
**Libraries:** —

**Revisions:**
- 2026-10-04 — Registrado que o "acesso rápido aos vídeos" da bullet do plano é satisfeito pelo **link para a página pública do canal**: os vídeos ficam a dois cliques, não a um. Mesma Option A, nenhuma mudança de mecanismo nem de escopo. Rationale: resolve IC-5 (/plan-validate) — a bullet do `project-plan.md` promete acesso aos vídeos e este TD entrega lista de canais; das três formas de alinhar as duas fontes, a escolhida foi registrar a leitura por escrito aqui, sem editar o plano e sem antecipar para esta fase o feed que a Fase 07 vai construir. O próprio `**Recommendation:**` acima já marcava esta como a recomendação com maior chance de erro por leitura de escopo; a divergência passa a ser decisão consciente e não omissão.

### social-interactions/TD-08

**Recommendation:** é a única que entrega o feedback imediato sem acrescentar dependência, e a primitiva já está na versão instalada. A Option B é mais simples e seria suficiente para a inscrição, que é clicada uma vez; para like e dislike, que são clicados muito e esperados como instantâneos, ela entrega a pior sensação da fase. A Option C resolve mais do que o problema desta fase e cria um segundo cache ao lado do que o App Router já mantém — se a Fase 07 mostrar necessidade real de cache de cliente, aí é a hora de reabrir, com mais evidência do que botões de like.
**Libraries:** —

### social-interactions/TD-09

**Recommendation:** **Option B**, com a Option C declarada como caminho para quando houver evidência de colisão por NAT ou de abuso que troca de IP — exatamente a forma como o `video-watch-page/TD-05` declarou o Redis para o caso multi-instância. Três razões. (1) A Option D está fora por um argumento verificável e não por gosto: 10/60 s compartilhado entre like, dislike, comentário e inscrição é estourado por leitura normal de uma thread, e o modo de falha é um botão que para de responder sem explicação. (2) Entre A e B, o que decide é que **as duas pontas têm perfis de abuso opostos** e um número único não serve às duas — e o custo de B sobre A é um segundo valor no mesmo decorator, não um mecanismo novo. (3) A Option C acerta no diagnóstico — por IP é mesmo o rastreador errado para rota autenticada — mas paga com alteração no `forRoot` de outra fase e com código custom para resolver um cenário que o projeto ainda não observou; é uma Revision barata de aplicar depois, sem trocar a letra, se a evidência aparecer.

Valores sugeridos para o preenchimento: **60/60 s** para reações e inscrição, **5/60 s** para criação de comentário e de resposta. Cinco comentários por minuto já é digitação humana rápida; sessenta toggles por minuto cobre leitura ativa de uma thread longa com folga. Os dois números são parâmetros e podem ser revisados por `/decide` sem trocar a opção.
**Libraries:** —

### social-interactions-anonymous-gate/TD-01

**Recommendation:** é a única das três em que o controle visível tem uma consequência útil para quem não está logado, e a conversão de visitante anônimo em cadastrado é justamente o que a página pública existe para fazer num produto cujo conteúdo é aberto. A Option B é defensável e mais barata, mas joga fora o ponto de conversão mais natural da plataforma em troca de evitar um redirecionamento. A Option C tem o pior perfil: paga o custo de renderizar o controle e não entrega nem a ação nem o caminho para obtê-la. O preço da A é a dependência do TD-03 — sem retorno pós-login a decisão fica pela metade, e por isso os dois devem ser decididos juntos.
**Libraries:** —

### social-interactions-anonymous-gate/TD-02

**Recommendation:** a Option C está fora porque entrega estado errado no recarregamento, que é o caminho mais comum de quem volta a um vídeo. Entre A e B o fator decisivo é que a B reintroduz exatamente o flicker de primeira pintura que o `phase-02-auth-frontend/TD-06` decidiu evitar no chrome autenticado, e seria incoerente aceitar aqui o que foi rejeitado lá por um ganho de cache que o projeto ainda não coleta — não há CDN nem cache compartilhado em frente à API, e a Fase 07 pode separar os contratos se e quando a home precisar. O custo honesto da A é um helper novo de leitura opcionalmente autenticada em `lib/api/`: o `fetchFromUpstream` não pode ser reaproveitado, porque o `redirect("/login")` dele é incompatível com página pública; ele precisa degradar para anônimo tanto na ausência de sessão quanto num `401` de token expirado, e esse segundo caminho é o que deve ser coberto por teste.
**Libraries:** —

### social-interactions-anonymous-gate/TD-03

**Recommendation:** é a única que fecha o ciclo que a Option A do TD-01 abre, e o faz reusando contrato, validador e vocabulário que já existem no repositório para o retorno pós-refresh, em vez de criar um segundo mecanismo paralelo para o mesmo problema. A Option B resolve o mesmo com estado oculto e ciclo de vida próprio, custo que só se justificaria se houvesse exigência de não expor o destino, que não há. A Option C é coerente apenas se o TD-01 for decidido como Option B ou C — se o anônimo não é convidado a logar a partir da ação, não há para onde voltar; nesse caso este TD inteiro perde objeto e deve ser decidido como C.
**Libraries:** —

### phase-02-auth/TD-01

**Recommendation:** **Argon2id** — For a greenfield project in 2026, Argon2id is the OWASP-recommended choice. The native build dependency is a one-time Docker setup cost. The project has no legacy constraints favoring bcrypt. OWASP minimum: 19MiB memory, 2 iterations.
**Libraries:** —

### phase-02-auth/TD-02

**Recommendation:** The project plan includes only email/password auth for now, but the plugin architecture costs little and future phases may add social login. Aligns with official NestJS docs, making onboarding and maintenance easier.
**Libraries:** —

### phase-02-auth/TD-03

**Recommendation:** Provides the strongest security model with automatic theft detection. The DB write overhead is acceptable for a video platform (auth refresh is infrequent vs. video operations). PostgreSQL is already in the stack, so no new infrastructure needed. Race conditions can be mitigated with a short grace period for the old token.
**Libraries:** —

### phase-02-auth/TD-04

**Recommendation:** Revocability is important: when a user requests a new password reset, previous tokens should be invalidated. The DB table is trivial to implement, and the tokens table can also serve future needs (e.g., API keys). Keeps email tokens decoupled from the JWT auth system.
**Libraries:** —

### phase-02-auth/TD-05

**Recommendation:** Best NestJS integration with minimal boilerplate. Supports SMTP (matching the architecture diagram), works with MailHog/Mailpit for local development without external dependencies, and scales to any SMTP provider in production. Template engine support (Handlebars) simplifies email formatting. No vendor lock-in.
**Libraries:** —

### phase-02-auth/TD-06

**Recommendation:** This is a backend-only project (no shared schemas with frontend), so Zod's single-source-of-truth advantage is less impactful. class-validator is the documented NestJS approach, and the project already uses decorators extensively (TypeORM entities, NestJS DI). Fewer integration surprises with NestJS 11.
**Libraries:** —

### phase-02-auth/TD-07

**Recommendation:** Provides machine-readable error codes that the Next.js frontend can switch on, without the overhead of RFC 9457's URI-based type system. The project is single-consumer (first-party frontend), so a simple `{ statusCode, error, message }` format with domain codes balances clarity and simplicity. The custom filter cost is low — two small files.
**Libraries:** —

### phase-02-auth/TD-08

**Recommendation:** Native NestJS integration is decisive: the guard system allows scoping rate limiting to `AuthModule` only via module-level `APP_GUARD`, with `@SkipThrottle()` for exemptions. The project is single-instance with no distributed requirements, so in-memory storage is sufficient. Using express-rate-limit would bypass NestJS's DI and guard lifecycle for no clear benefit.
**Libraries:** —

**Revisions:**
- 2026-09-26 — Correção do racional, sem mudança de decisão. O texto da Recommendation afirma que o guard permite "scoping rate limiting to `AuthModule` only via module-level `APP_GUARD`". **Isso está errado:** `APP_GUARD` é global independentemente do módulo que o declara — está na doc oficial de Guards do NestJS e no README do `@nestjs/throttler` ("you could do so by adding this provider to **any** module"). O próprio repositório evidencia: `src/app.controller.ts` carrega `@SkipThrottle()`, inócuo se o guard não o alcançasse, já que `AppController` não pertence ao `AuthModule`. O escopo efetivo sempre foi a aplicação inteira, a 10 req/60 s por IP. Mesma Option A — a escolha de biblioteca permanece. Rationale: resolve ICC-1 (/plan-validate da Fase 05) — a frase induziu a MD-1 daquela fase a concluir que o endpoint público de contagem estava desprotegido, quando já nascia coberto.
- 2026-10-08 — A premissa "por IP" não vale atrás do BFF: todo request chega ao Nest com o mesmo `req.ip`, então o limite vira um balde único para o site. Mesma Option A. Rationale: confirmado em runtime em
  2026-10-07. Todo request entrou com `req.ip = ::ffff:172.19.0.1`, o gateway da rede do compose, porque o BFF chama `API_URL=http://host.docker.internal:3000`. Visitante A (6 req) e visitante B
  (4 req, outro IP) somados tomaram 429 na 11ª requisição, e uma chamada direta do host caiu no mesmo balde. Herdam a falha o default global de 10/60 s e os orçamentos `@Throttle` por IP de
  `video-watch-page/TD-05` (30/60 s) e de `social-interactions/TD-09` (60/60 s e 5/60 s), além do default de `GET /videos/:id/public`, stream, download, canais, comentários e `POST /auth/login`/`refresh`.
  Fatos que restringem a correção: (1) `trust proxy` restrito à rede do compose não distingue o BFF de qualquer chamador do host — todos chegam como `172.19.0.1` e poderiam forjar `X-Forwarded-For`;
  (2) o Next 16 só preenche `x-forwarded-for` quando ele está ausente (`??=` em `base-server.js`), então um XFF enviado pelo visitante passa intacto, e o Route Handler não tem `request.ip` —
  repassar o header como está deixa o visitante escolher o IP; (3) a chave do throttler é handler + tracker, então o teto é por rota e compartilhado. O mecanismo de identificação do visitante e o
  orçamento das leituras públicas ainda NÃO estão decididos nesta revisão.

### phase-02-auth/TD-09

**Recommendation:** Since DB lookup is mandatory (TD-03), JWT signature adds no security value. Opaque tokens are shorter, leak no data, and are simpler to generate.
**Libraries:** —

### phase-02-auth/TD-10

**Recommendation:** The platform is a video sharing service with URL-based channel handles. A strict `[a-z0-9_]` allowlist is the simplest and most portable choice: no extra dependencies, no edge cases around hyphen positioning, and the `user_<random>` fallback provides a valid handle even for extreme email prefixes. Hyphens can always be added in a future iteration if user feedback justifies it.
**Libraries:** —

### phase-02-auth-frontend/TD-01

**Recommendation:** **Option A (Custom BFF cookie-based session)**. Three reasons. (1) **Architectural fit.** The strict-BFF model in `next-frontend-config-base/TD-03` already nominates the Route Handler as the only NestJS caller; cookie-based sessions are the natural match, and Auth.js's framework adds layers between the BFF and the cookie that buy nothing because the backend is the auth authority — Auth.js's value (DB adapters, OAuth providers, magic-link, `getServerSession` helpers) is mostly unused in this configuration. (2) **Smaller blast radius.** A ~50-LOC session helper is grep-friendly, debuggable, and test-friendly via the existing MSW+BFF integration test pattern; a misconfigured Auth.js callback is a longer fault-isolation loop. (3) **Compatibility with Next.js 16 / React 19.** Built-in `next/headers` `cookies()` is the canonical primitive both runtimes already use; Auth.js v5 versions track Next.js majors with a lag, adding compatibility risk that Option A does not have. Option C is rejected as unsafe (`localStorage` for refresh tokens) and architecturally regressive (loses RSC personalization).
**Libraries:** —

### phase-02-auth-frontend/TD-02

**Recommendation:** **Option B (`iron-session` encrypted container)**. Three reasons. (1) **Defense in depth on the cookie content** — `httpOnly` blocks JS, encryption blocks accidental log/proxy inspection; the marginal cost is one ~3KB dep. (2) **Single cookie to manage** simplifies logout (one `session.destroy()` call) and avoids the orphan-cookie failure mode of Option A. (3) **Room to carry minimal user metadata** (`userId`, `email`, `channelSlug`) lets `app/layout.tsx` RSC render the authenticated chrome (avatar, channel name) without a per-render `/auth/me` round-trip — Phase 04+ gains compound here. Option A is a viable downgrade if the team rejects `iron-session` for any reason; the migration A→B (or B→A) is a one-Route-Handler refactor with no test changes downstream because the BFF interface is unchanged. Option C is rejected: it solves a problem (server-side revocation) the project does not have at the cost of infrastructure the project does not own.
**Libraries:** iron-session

### phase-02-auth-frontend/TD-03

**Recommendation:** **Option A (Transparent BFF refresh on upstream 401, with per-request single-flight)**. The single-flight detail is non-trivial and goes in the helper from day one — tested by MSW with a "two concurrent intercepted upstream calls; one refresh expected" assertion. Option B's client-driven pattern is rejected because it doesn't replace Option A (RSC still needs server-side refresh) — adopting B means doing both. Option C's pre-emptive timer is rejected because the failure modes (multiple tabs, sleep/wake) outweigh the latency saving and force a `"use client"` shell near the root.
**Libraries:** —

### phase-02-auth-frontend/TD-04

**Recommendation:** **Option A (`react-hook-form` + `@hookform/resolvers/zod`)**. Three reasons. (1) **Decoupled from TD-05** — works with Route Handlers OR Server Actions; the form code does not change if TD-05 is revisited later. (2) **Aligned with shadcn's canonical form primitive** — the project already commits to `radix-nova` shadcn (`components.json`); `npx shadcn@latest add form` produces react-hook-form wrappers; choosing react-hook-form means using the supported primitive instead of hand-rolling around it. (3) **Zod-first developer ergonomics match the rest of the FE foundation** — `next-frontend-config-base/TD-01` chose Zod 4 for env; the same schemas-as-source-of-truth pattern carries to forms with zero new validator paradigm. Option B is rejected for impedance with shadcn's primitive and for over-investing in progressive-enhancement that the strict-BFF model does not require. Option C is rejected for the per-field boilerplate and the loss of client-side feedback on a project that values quick, type-safe form iteration.
**Libraries:** react-hook-form, @hookform/resolvers

### phase-02-auth-frontend/TD-05

**Recommendation:** **Option A (Route Handler POST + client `fetch`)**. Three reasons. (1) **Strict-BFF alignment.** `next-frontend-config-base/TD-03` named Route Handlers as the BFF surface; Option A keeps every mutation visible under `app/api/**`. (2) **Test scaffold already exists** — `next-frontend/CLAUDE.md` § Testing and `next-frontend-msw-foundation` were authored for Route-Handlers-as-functions; Option A reuses them with zero invention. (3) **Single mutation surface** — Phase 02 sets the precedent for Phases 03–07; uniformity beats per-mutation idiom-picking when the cost of inconsistency compounds (Option C). Option B has real ergonomic appeal for the simplest forms but fragments the BFF surface and forces test-pattern reinvention; if the team later wants progressive enhancement for specific forms, the migration A→B is per-form and doesn't require touching unrelated routes — A is the safer default and the cheaper baseline.
**Libraries:** —

### phase-02-auth-frontend/TD-06

**Recommendation:** **Option A (Server-rendered session + Provider rendered in RSC layout)**. Two reinforcing reasons. (1) **No first-render flicker, no round-trip** — the session is delivered in the same response as the page HTML; the Client Provider hydrates with the correct initial state; users never see "Login" briefly turn into their avatar. (2) **No new BFF endpoint** — the cookie is the source of truth, RSC reads it, the Provider broadcasts it; the BFF surface stays minimal. The `router.refresh()` requirement after mid-session mutations is a small price (one line in the relevant mutation handler) for the structural benefits. Option B is rejected for the double-read-and-flicker; Option C is dominated by Option B and rejected.
**Libraries:** —

### phase-02-auth-frontend/TD-07

**Recommendation:** **Option A (RSC processes the token server-side; Client form below for reset's input step)**. Three reasons. (1) **First-paint-correct** — the user sees the right outcome on the first paint, no skeleton, no flicker. (2) **Single integration pattern across both flows** — confirmation is RSC-only; reset is RSC + Client form (TD-04, TD-05 patterns reused) — both share the "RSC owns the token, Client Component owns the input" split. (3) **Email-prefetch behavior** is solved at the backend's idempotent-confirmation level (a small note for `/plan-build` to confirm; not a separate TD). Option B's Route-Handler-as-link-target adds redirects for no clean gain. Option C is dominated.
**Libraries:** —

### phase-01-configuracao-base/TD-01

**Recommendation:** Official, core-team-maintained, guaranteed NestJS 11 compatibility. The `registerAs()` factory pattern solves the TypeORM CLI sharing problem: the factory function can be imported as a plain function by `data-source.ts` while also serving as a DI injection token inside NestJS. Building a custom module recreates solved functionality; third-party packages carry maintenance risk.
**Libraries:** —

### phase-01-configuracao-base/TD-02

**Recommendation:** First-class integration with `@nestjs/config` via `validationSchema`, requiring zero custom wiring. Handles string-to-number coercion natively. Using a different tool for env validation vs. request validation is reasonable — env config is validated once at startup, DTOs are validated per-request. Zod is elegant but adds a third validation paradigm to the project.
**Libraries:** —

### phase-01-configuracao-base/TD-03

**Recommendation:** The project roadmap explicitly calls for auth, email, and storage in upcoming phases. Namespaced configs provide clear file boundaries per domain, typed injection via `ConfigType<typeof databaseConfig>`, and natural scalability. The `registerAs()` factory is dual-purpose: DI token inside NestJS and plain importable function for `data-source.ts`.

Initial files for Phase 01:
- `src/config/database.config.ts` — DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME
- `src/config/app.config.ts` — PORT, NODE_ENV
**Libraries:** —

### phase-01-configuracao-base/TD-04

**Recommendation:** Natural outcome of choosing `@nestjs/config` with `registerAs`. The factory is already callable by design. `data-source.ts` imports it, calls `dotenv.config()`, then calls the factory. Zero duplication, minimal code, no extra abstraction.

```
src/config/database.config.ts  →  registerAs('database', () => ({ host, port, ... }))
                                         |                          |
                                    NestJS loads via           data-source.ts imports
                                    ConfigModule.forRoot()     and calls directly
```
**Libraries:** —

## Inherited Conventions

- Backend config uses `@nestjs/config` with namespaced `registerAs(name, () => ({...}))` factories — one file per domain in `src/config/`. _(from phase 01)_
- Env variables are validated by a Joi schema in `src/config/env.validation.ts`, passed to `ConfigModule.forRoot({ validationSchema, validationOptions:... _(from phase 01)_
- Config is injected into modules via `ConfigType<typeof xxxConfig>` and `@Inject(xxxConfig.KEY)`; the same factory is importable as a plain function fo... _(from phase 01)_
- `data-source.ts` loads `.env` via `import 'dotenv/config'` at the top, then imports `databaseConfig` and calls it as a plain function. _(from phase 01)_
- Database connection parameters (host, port, etc.) are sourced from a single `databaseConfig` factory — never duplicated between `AppModule` and `data-... _(from phase 01)_
- `TypeOrmModule.forRootAsync` is used (not `forRoot`), with `imports: [ConfigModule]`, `inject: [databaseConfig.KEY]`, `useFactory` returning options i... _(from phase 01)_

## Inherited Deferred Capabilities

_No inherited deferred capabilities._

## UI Inventory

_Frontend-runtime only — no screen inventory needed for this phase.
Run /screen-inventory rate-limit-visitor-identity if a UI surface is added in a future revision._

## Non-UI / Deferred Capabilities

_None._

## Testing Requirements

### nestjs-project

| Artifact type | Required layers |
|---------------|-----------------|
| Entity (`*.entity.ts`) | Integration: constraints, defaults, `select: false` |
| Service with branching + DB | Unit (mock repo) + Integration (DB contract) |
| Service with DB only (no branching) | Integration |
| Service with configured lib (JWT, cache) | Unit with the real lib and test config |
| Service with side-effect dep (email, storage) | Integration with real capture service or local adapter |
| Module with configured imports | Compilation test — Integration if it opens a DB connection, Unit otherwise |
| Controller | E2E only (no unit tests) |
| DTO | E2E: one validation wiring test per endpoint |
| Guard with business logic | E2E + Unit if complex internal logic |
| Guard (simple, delegates to Passport) | E2E only |
| Strategy (Passport) | E2E via guard |
| Pipe | Unit |
| Interceptor | Unit and/or E2E |
| Exception Filter | Unit + E2E |
| Middleware | E2E |

_Relevante a esta task: o guia lista **rate limiting** entre as fronteiras de segurança que valem teste, e proíbe mockar `ThrottlerGuard` — configured libs são testadas com instância real e config de teste._

### next-frontend

| Artifact type | Required layers |
|---------------|-----------------|
| Page — sync RSC, static, no logic | None at component level; E2E only if part of a critical flow |
| Page — sync RSC composing client children | Test client children directly; page via E2E |
| Page — async RSC | E2E only (Vitest cannot render it) |
| Layout | None unless it adds logic; else via E2E |
| Client component with state/handlers | Vitest `*.test.tsx` (RTL + jsdom docblock, mock `next/navigation`, MSW for fetch) |
| Feature component (server, composes primitives) | Skip unit; cover via the page's E2E |
| shadcn UI primitive | None |
| Icon | None |
| `lib/` utility / boundary module with branching or shape assumptions | Vitest `*.test.ts` |
| Custom hook | Vitest `*.test.ts(x)` with `renderHook` |
| Route handler (`app/api/**/route.ts`) | `*.integration.test.ts` with MSW (+ `*.test.ts` for extracted pure logic) |

_Relevante a esta task: `lib/api/upstream.ts` é um boundary module (o guia o cita nominalmente) — a mudança que anexa a identidade do visitante a toda chamada é verificada com MSW, nunca com `vi.mock` de `fetch`._
