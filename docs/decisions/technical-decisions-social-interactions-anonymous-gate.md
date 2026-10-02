---
scope_type: ad-hoc
related_phases: [6]
status: pending
date: 2026-10-01
scope_description: "O gate anônimo x autenticado das interações sociais (like, comentário, inscrição) na página pública de vídeo"
---

# Technical Decisions — Gate anônimo x autenticado das interações sociais

_Subprojects in scope:_

- `nestjs-project/` — expõe os endpoints de leitura e de ação das interações sociais; participa do TD-01 (que rotas exigem token) e do TD-02 (como o estado pessoal do chamador entra na resposta).
- `next-frontend/` — renderiza a página pública de vídeo e decide o que o anônimo vê; participa dos três TDs.

> **Contexto que motivou esta pesquisa.** O `/plan-validate social-interactions` emitiu `MD-1`: três das oito capabilities da Fase 06 qualificam o ator como "(usuários autenticados)", mas a superfície onde elas aparecem — `/videos/[publicId]`, entregue na Fase 05 — é anônima por construção. Nenhum TD, desta fase ou herdado, decide o que o visitante anônimo vê e o que acontece quando ele age.

> **Nota sobre documentação de bibliotecas.** O `context7` não está disponível nesta sessão (não há tool `mcp__context7__*` carregada nem diferida). Nenhum dos TDs abaixo introduz biblioteca nova — todos usam APIs já instaladas (`next@16.2.6`, `react@19.2.4`, `@nestjs/common@^11.0.1`, `@nestjs/jwt@^11.0.2`, `iron-session`). As afirmações sobre o comportamento atual do repositório foram verificadas lendo o código em disco, não a memória; os arquivos estão citados em cada `**Context:**`. Reconfirmar via `context7` antes do `/implement`.

---

## TD-01: O que o visitante anônimo vê e o que acontece quando ele age

**Scope:** Cross-layer

**Capability:** Transversal — covers: "Like e dislike em vídeos (usuários autenticados)", "Comentários em vídeos (usuários autenticados)", "Like e dislike em comentários (usuários autenticados)", "Inscrição em canais (seguir/deixar de seguir)", "Interface completa de comentários, likes e inscrições"

**Context:** A premissa do produto, no `CLAUDE.md` raiz, é "Anonymous users can watch freely; social features (comments, subscriptions, likes) require authentication". Isso resolve quem pode **agir**, mas não quem pode **ler**: ninguém decidiu se o anônimo vê a lista de comentários e as contagens, nem o que acontece no clique. A decisão amarra os dois lados: o backend precisa saber quais rotas de leitura são `@Public()` e quais exigem token, e o frontend precisa saber se renderiza o controle, esconde, ou desabilita. Decidir só de um lado produz a falha clássica — o botão aparece, o usuário clica, e o 401 chega como erro genérico. Verificado em disco: `next-frontend/app/videos/[publicId]/page.tsx` hoje nem lê a sessão (o botão "Entrar" da navbar está fixo no JSX), então qualquer uma das opções exige tornar a página consciente de sessão.

**Options:**

### Option A: Leitura pública, ação com convite ao login
- Comentários, contagens e o estado agregado são servidos a todo mundo; os controles de like/dislike, inscrever e a caixa de comentário renderizam para o anônimo e, no clique, levam ao login em vez de disparar a mutação.
- **Pros:** o conteúdo social é o que dá valor à página para quem chega de link externo, e deixá-lo visível é o comportamento de toda plataforma do gênero; o controle visível é o próprio convite ao cadastro, que é a conversão que a plataforma quer; um único layout para anônimo e autenticado, sem ramificação de composição.
- **Cons:** exige um caminho de retorno pós-login para a ação não se perder (TD-03), senão o usuário loga e cai em outro lugar; o clique que "não faz o que diz" é frustrante se o convite não for explícito no rótulo ou no destino.

### Option B: Leitura pública, controles de ação ocultos para o anônimo
- O anônimo vê comentários e contagens, mas os botões de ação e a caixa de comentário simplesmente não são renderizados.
- **Pros:** nenhum clique engana o usuário, porque não há o que clicar; nenhuma necessidade de retorno pós-login; menos superfície a testar no caminho anônimo.
- **Cons:** some o gatilho de conversão — o anônimo não descobre que existe a possibilidade de interagir; o layout muda de forma entre anônimo e autenticado (a barra de ações colapsa), o que exige dois desenhos em vez de um; a descoberta do login fica só na navbar.

### Option C: Leitura pública, controles visíveis e desabilitados
- Os controles renderizam em estado `disabled` com rótulo acessível explicando que é preciso entrar.
- **Pros:** preserva o layout único e sinaliza a existência da ação sem prometer o que não entrega.
- **Cons:** um controle `disabled` não recebe clique nem foco de teclado por padrão, então o anônimo não tem caminho para o login a partir dali — sinaliza a porta e a tranca; exige `aria-disabled` com handler em vez de `disabled` real para continuar acessível, que é mais código do que a Option A; é a pior das três em conversão, porque mostra o valor e nega o acesso sem oferecer saída.

**Recommendation:** Option A (leitura pública, ação com convite ao login) — é a única das três em que o controle visível tem uma consequência útil para quem não está logado, e a conversão de visitante anônimo em cadastrado é justamente o que a página pública existe para fazer num produto cujo conteúdo é aberto. A Option B é defensável e mais barata, mas joga fora o ponto de conversão mais natural da plataforma em troca de evitar um redirecionamento. A Option C tem o pior perfil: paga o custo de renderizar o controle e não entrega nem a ação nem o caminho para obtê-la. O preço da A é a dependência do TD-03 — sem retorno pós-login a decisão fica pela metade, e por isso os dois devem ser decididos juntos.

**Decision:** A (leitura pública; os controles de ação renderizam para o anônimo e o clique leva ao login)

---

## TD-02: Como o estado pessoal do visitante chega à página

**Scope:** Cross-layer

**Capability:** Transversal — covers: "Like e dislike em vídeos (usuários autenticados)", "Like e dislike em comentários (usuários autenticados)", "Inscrição em canais (seguir/deixar de seguir)", "Interface completa de comentários, likes e inscrições"

**Context:** O `social-interactions/TD-03` decidiu expor "só o estado do usuário" para o dislike, e o botão de inscrever precisa nascer sabendo se o visitante já é inscrito. Isso é informação **por usuário** sobre um recurso **público**, e hoje não há caminho para ela: `next-frontend/app/videos/[publicId]/page.tsx` chama `upstream.GET` direto, sem Bearer; a rota BFF irmã `app/api/videos/[publicId]/public/route.ts` também é anônima; e o helper autenticado de Server Component, `lib/api/server-upstream.ts`, **não serve** aqui porque faz `redirect("/login")` quando a sessão não existe — exatamente o oposto do necessário numa página pública. Do lado do backend o caminho já está aberto: `src/auth/guards/jwt-auth.guard.ts` anexa `request.user` numa rota `@Public()` quando há Bearer válido, e ignora token ausente ou inválido sem erro — o padrão que o `video-channel-management/TD-02` já usa para o dono ver o próprio rascunho. A decisão é sobre **onde** esse estado entra, e o custo real está no cache: o payload público deixa de ser o mesmo para todo mundo no momento em que carrega "meu like".

**Options:**

### Option A: Endpoint público com auth opcional — um payload só
- As rotas de leitura continuam `@Public()`; o RSC anexa o Bearer quando a sessão existe e o handler devolve os campos pessoais (`myReaction`, `isSubscribed`) preenchidos ou nulos. Exige um helper novo no frontend, irmão do `fetchFromUpstream`, que anexa o token quando há e segue anônimo quando não há.
- **Pros:** uma requisição, estado correto na primeira pintura, sem piscar de "não curtido" para "curtido"; reusa o comportamento de auth opcional que o `JwtAuthGuard` já implementa e que a Fase 04 já exerce; o frontend não precisa casar duas respostas.
- **Cons:** o payload passa a variar por usuário, então a resposta deixa de ser cacheável de forma compartilhada — o que hoje é um custo teórico (não há camada de cache) mas fecha a porta barata da Fase 07; o RSC precisa de um segundo helper de leitura, e o `401` por token expirado tem de degradar para anônimo em vez de redirecionar.

### Option B: Leitura pública pura + endpoint autenticado separado para "meu estado nesta página"
- O GET público devolve só conteúdo e contagens, idêntico para todos; um segundo endpoint autenticado devolve o estado do visitante para os ids da página, buscado pelo cliente depois da hidratação.
- **Pros:** o payload público permanece o mesmo para todo mundo e cacheável, que é o que a Fase 07 vai querer para a home; separa com clareza o que é conteúdo do que é personalização; o caminho anônimo não paga nada.
- **Cons:** duas requisições e um estado intermediário visível — os botões nascem neutros e corrigem depois de hidratar, que é exatamente o flicker que o `phase-02-auth-frontend/TD-06` rejeitou para o chrome autenticado; exige um contrato novo "estado do usuário para esta lista de ids" que não existe hoje; mais superfície de teste.

### Option C: Sem personalização na leitura — o estado aparece ao agir
- Nenhuma leitura devolve estado pessoal; os controles nascem neutros e o servidor responde o estado real na primeira ação.
- **Pros:** o menor contrato possível; nada muda nas rotas de leitura.
- **Cons:** está errado no caso comum — quem já curtiu vê o botão como não curtido ao recarregar, e o clique "descurte" o que parecia não curtido; transforma o `useOptimistic` do `social-interactions/TD-08` em palpite sobre estado desconhecido, não em antecipação de estado conhecido; não há como renderizar "Inscrito" versus "Inscrever-se" corretamente.

**Recommendation:** Option A (endpoint público com auth opcional) — a Option C está fora porque entrega estado errado no recarregamento, que é o caminho mais comum de quem volta a um vídeo. Entre A e B o fator decisivo é que a B reintroduz exatamente o flicker de primeira pintura que o `phase-02-auth-frontend/TD-06` decidiu evitar no chrome autenticado, e seria incoerente aceitar aqui o que foi rejeitado lá por um ganho de cache que o projeto ainda não coleta — não há CDN nem cache compartilhado em frente à API, e a Fase 07 pode separar os contratos se e quando a home precisar. O custo honesto da A é um helper novo de leitura opcionalmente autenticada em `lib/api/`: o `fetchFromUpstream` não pode ser reaproveitado, porque o `redirect("/login")` dele é incompatível com página pública; ele precisa degradar para anônimo tanto na ausência de sessão quanto num `401` de token expirado, e esse segundo caminho é o que deve ser coberto por teste.

**Decision:** A (endpoint público com auth opcional — um payload só, com os campos pessoais preenchidos quando há Bearer válido)

---

## TD-03: Retorno ao ponto de interação depois do login

**Scope:** Frontend

**Capability:** "Interface completa de comentários, likes e inscrições"

**Context:** Se o TD-01 for decidido como Option A, o clique do anônimo leva ao login — e hoje o login não sabe voltar. Verificado em disco: `components/auth/login-form.tsx` chama apenas `router.refresh()` no sucesso, sem nenhuma navegação, de modo que o usuário permanece em `/login`; `app/(auth)/login/page.tsx` não lê `searchParams`. Existe um mecanismo de retorno no repositório, mas noutro caminho: `app/api/auth/refresh/route.ts` lê `returnTo`, valida com `safeReturnTo` e usa `DEFAULT_RETURN_TO` como fallback (`lib/auth/refresh-redirect.ts`). A decisão é se o gate do TD-01 reaproveita esse contrato, inventa outro, ou dispensa o retorno. É cross-component: o nome do parâmetro e a validação precisam ser os mesmos nos três lugares (os pontos de chamada do gate, a página de login e o form).

**Options:**

### Option A: `returnTo` na query de `/login`, validado pelo mesmo `safeReturnTo`
- O gate navega para `/login?returnTo=<path atual>`; a página de login lê o `searchParams`, e o form navega para o destino validado no sucesso em vez de só dar `refresh()`.
- **Pros:** reusa `safeReturnTo` e a convenção de nome que a rota de refresh já estabeleceu, então existe um único vocabulário de retorno no projeto; o destino é visível na URL, o que torna o comportamento depurável e testável sem estado oculto; a validação contra open redirect já está escrita e testada.
- **Cons:** o `returnTo` fica exposto na URL e precisa continuar passando pelo validador em todo ponto de entrada novo — esquecer disso num futuro ponto de chamada é a porta do open redirect; o form de login ganha uma responsabilidade de navegação que hoje não tem.

### Option B: Cookie de intenção gravado pelo gate
- O gate grava um cookie de curta duração com o destino, e o BFF de login o consome e apaga ao autenticar.
- **Pros:** nada na URL; sobrevive a uma passagem pelo cadastro antes do login, caso o usuário vá por ali.
- **Cons:** estado oculto cujo ciclo de vida precisa ser gerenciado (expiração, limpeza em login falho, duas abas competindo pelo mesmo cookie); exige escrita de cookie a partir de um caminho que hoje não escreve nenhum; muito mais mecanismo do que o problema pede, e num lugar — autenticação — onde mecanismo extra é risco.

### Option C: Sem retorno — o login cai sempre no destino padrão
- O gate leva a `/login` sem parâmetro; depois de autenticar o usuário vai para o destino padrão e volta ao vídeo por conta própria.
- **Pros:** zero código novo; nenhum vetor de open redirect.
- **Cons:** perde o contexto da ação justamente no momento em que o usuário demonstrou intenção, que é o pior ponto possível para perdê-lo; na prática esvazia a Option A do TD-01 — o convite ao login deixa de converter se o caminho de volta é manual.

**Recommendation:** Option A (`returnTo` na query, validado por `safeReturnTo`) — é a única que fecha o ciclo que a Option A do TD-01 abre, e o faz reusando contrato, validador e vocabulário que já existem no repositório para o retorno pós-refresh, em vez de criar um segundo mecanismo paralelo para o mesmo problema. A Option B resolve o mesmo com estado oculto e ciclo de vida próprio, custo que só se justificaria se houvesse exigência de não expor o destino, que não há. A Option C é coerente apenas se o TD-01 for decidido como Option B ou C — se o anônimo não é convidado a logar a partir da ação, não há para onde voltar; nesse caso este TD inteiro perde objeto e deve ser decidido como C.

**Decision:** A (`returnTo` na query de `/login`, validado pelo mesmo `safeReturnTo` da rota de refresh)

---

## Decisions Summary

| ID | Scope | Decision | Recommendation | Choice |
|----|-------|----------|---------------|--------|
| TD-01 | Cross-layer | O que o visitante anônimo vê e o que acontece quando ele age | A — leitura pública, ação com convite ao login | A |
| TD-02 | Cross-layer | Como o estado pessoal do visitante chega à página | A — endpoint público com auth opcional, um payload só | A |
| TD-03 | Frontend | Retorno ao ponto de interação depois do login | A — `returnTo` na query de `/login`, validado por `safeReturnTo` | A |

## Dependências entre TDs

- **TD-03 depende do TD-01.** Só faz sentido decidir o retorno pós-login se o TD-01 for a Option A (o gate navega para o login). Se o TD-01 for B ou C, o TD-03 deve ser decidido como Option C.
- **TD-02 é independente do TD-01.** O estado pessoal precisa chegar à página em qualquer uma das três opções do TD-01 — muda apenas se ele é usado para renderizar um controle ativo, oculto ou desabilitado.
