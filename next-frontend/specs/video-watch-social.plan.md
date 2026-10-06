---
subproject: frontend
runner: playwright
scope: phase-06-social-interactions
si: SI-06.21b
target_file: tests/video-watch-social.e2e-spec.ts
---

# Página de visualização do vídeo — interações sociais — Test Plan

## Application Overview

A Fase 06 estende a watch page (`/videos/{publicId}`) com like, dislike, inscrição no canal e a seção de comentários. A página continua pública: o visitante anônimo lê tudo, e os controles de ação **renderizam para ele também** — o clique leva a `/login?returnTo=…` e, depois do login, de volta ao mesmo ponto (`social-interactions-anonymous-gate/TD-01` e `TD-03`).

O Server Component busca em paralelo, com autenticação opcional, o detalhe público, as sugestões e a primeira página de comentários, de modo que o **estado pessoal** (meu like, meu dislike, minha inscrição) chega **na primeira pintura** — sem piscar do estado neutro para o real (`social-interactions-anonymous-gate/TD-02`, coerente com `phase-02-auth-frontend/TD-06`). O feedback das ações é otimista, com `useOptimistic` do React 19 (`social-interactions/TD-08`): like e dislike são mutuamente exclusivos, o like carrega a contagem "Gostei · N" e o dislike **não tem número** (`social-interactions/TD-03`).

**Fronteira de interceptação — load-bearing.** Nenhum `page.route()` sobre `/api/**`: o upstream NestJS é falseado server-side via `instrumentation.ts` + `mocks/`, e cenários de erro usam triggers reservados nos handlers, não `server.use()`.

**Escopo do grupo 3.** O SI-06.21c (comentários) é auto-split do 21b e não pode carregar `**Test Specs:**` próprio. O E2E da seção de comentários vive aqui, no grupo 3, com `Source: manual` e sem `Covers AC` — o campo só pode apontar para ACs do `si:` desta spec. São autorados pelo `/plan-test-specs` e cobrem as ACs #1 a #4 do SI-06.21c.

## Test Scenarios

### 1. Reações e inscrição

**Setup:** `next-frontend/tests/fixtures.ts` (MSW network fixture auto-applied; upstream faked server-side via `instrumentation.ts`, sem `page.route()` de `/api/**`). Triggers reservados por `publicId` nos handlers MSW (`SI-06.13`, `SI-06.16`, `SI-06.17`, `SI-06.18`), sem colidir com os das specs das Fases 02–05: `social-video` → vídeo do canal `maria_rocha` ("Maria Rocha", `subscribersCount` 1200) com `likesCount` 128, `commentsCount` 12 e estado pessoal neutro mesmo com sessão; `liked-video` → mesmo vídeo, mas com sessão o upstream devolve `viewerReaction: "like"` e `channel.viewerSubscribed: true`; `reaction-fails-video` → `PUT /videos/reaction-fails-video/reaction` responde `429` `RATE_LIMIT_EXCEEDED`. As respostas de `PUT`/`DELETE` de reação e inscrição devolvem a contagem do fixture aplicada ao delta. Cenários com sessão autenticam antes pela UI de `/login` com `user@example.com`.

#### 1.1. estado-pessoal-na-primeira-pintura

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Usuário autentica com `user@example.com` e navega para `/videos/liked-video`
    - expect: o botão "Gostei · 128" está com `aria-pressed="true"` já no HTML servido — nenhum frame mostra o estado neutro antes
    - expect: o botão "Não gostei" está com `aria-pressed="false"` e não exibe número
    - expect: o botão de inscrição mostra "Inscrito"
    - expect: a navbar mostra avatar, "Sair" e o link "Canais seguidos"

#### 1.2. dislike-troca-o-like

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Usuário autenticado abre `/videos/liked-video`
    - expect: "Gostei · 128" pressionado
  2. Usuário clica em "Não gostei"
    - expect: imediatamente, "Não gostei" fica pressionado e o like despressiona
    - expect: o rótulo do like passa a "Gostei · 127"
    - expect: "Não gostei" continua sem número
  3. Aguardar a resposta de `PUT /api/videos/liked-video/reaction`
    - expect: o estado da tela permanece o mesmo — a reconciliação confirma o otimista

#### 1.3. inscrever-atualiza-botao-e-contagem

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Usuário autenticado abre `/videos/social-video`
    - expect: a identidade do canal mostra "1,2 mil inscritos" e o botão "Inscrever-se"
  2. Usuário clica em "Inscrever-se"
    - expect: o botão passa a "Inscrito" no mesmo instante
    - expect: a contagem de inscritos é atualizada no mesmo instante, sem esperar a resposta da API
  3. Aguardar a resposta de `PUT /api/channels/maria_rocha/subscription`
    - expect: botão e contagem refletem o valor devolvido

#### 1.4. falha-na-reacao-reverte

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Usuário autenticado abre `/videos/reaction-fails-video`
    - expect: "Gostei · 128" não pressionado
  2. Usuário clica em "Gostei"
    - expect: o botão chega a pressionar e mostrar "Gostei · 129" de forma otimista
  3. Aguardar a resposta `429` de `PUT /api/videos/reaction-fails-video/reaction`
    - expect: o botão volta a "Gostei · 128", não pressionado
    - expect: uma mensagem curta de erro aparece perto do controle
    - expect: o player e o resto da página continuam funcionais

### 2. Visitante anônimo

**Setup:** o mesmo do grupo 1, sem login prévio.

#### 2.1. anonimo-vai-ao-login-e-volta

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Visitante anônimo navega para `/videos/social-video`
    - expect: os botões "Gostei · 128", "Não gostei" e "Inscrever-se" estão visíveis
    - expect: a navbar mostra "Entrar"
  2. Visitante clica em "Gostei"
    - expect: nenhuma requisição a `/api/videos/social-video/reaction` é emitida
    - expect: a URL passa a `/login?returnTo=%2Fvideos%2Fsocial-video`
  3. Visitante preenche "E-mail" com `user@example.com`, "Senha" com a senha dos fixtures e clica em "Entrar"
    - expect: a URL volta a `/videos/social-video`
    - expect: a navbar mostra avatar e "Sair"
    - expect: o like **não** foi aplicado automaticamente — o visitante volta ao ponto, a ação não é repetida

### 3. Fluxo de comentários (cobre as ACs do SI-06.21c)

**Setup:** o mesmo do grupo 1. `social-video` tem 12 raízes (10 na primeira página, 2 na segunda), a mais recente de "Maria Rocha" com 7 respostas (3 pré-carregadas, `repliesCount` 7), e a segunda sem respostas; `quiet-video` não tem comentários. O `POST` de comentário devolve o comentário com o autor do canal do usuário logado.

#### 3.1. publicar-comentario-aparece-no-topo

**Source:** manual
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Usuário autenticado abre `/videos/social-video`
    - expect: o heading mostra "12 comentários" e "Mais recentes primeiro"
  2. Usuário digita "Ótimo vídeo" no compositor e clica em "Comentar"
    - expect: o comentário "Ótimo vídeo" aparece no topo da lista imediatamente
    - expect: o heading passa a "13 comentários"
    - expect: o campo do compositor fica vazio
  3. Usuário digita só espaços no compositor
    - expect: o botão "Comentar" fica desabilitado e nenhuma requisição é emitida

#### 3.2. responder-a-resposta-cria-irma

**Source:** manual
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Usuário autenticado clica em "Responder" numa das respostas pré-carregadas da primeira thread
    - expect: o compositor de resposta abre abaixo da thread
  2. Usuário digita "Concordo" e envia
    - expect: a resposta aparece no topo da lista de respostas da **mesma** thread, no mesmo recuo das demais — nunca sob a resposta clicada

#### 3.3. ver-mais-respostas-e-mais-comentarios

**Source:** manual
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Usuário (anônimo ou autenticado) abre `/videos/social-video`
    - expect: a primeira thread mostra 3 respostas e o controle "Ver mais 4 respostas"
  2. Usuário clica em "Ver mais 4 respostas"
    - expect: 4 respostas são acrescentadas à thread e o controle desaparece
  3. Usuário clica em "Carregar mais comentários"
    - expect: 2 threads são acrescentadas ao fim da lista e o controle desaparece

#### 3.4. video-sem-comentarios

**Source:** manual
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Usuário abre `/videos/quiet-video`
    - expect: o heading mostra "0 comentários"
    - expect: o compositor está presente e um texto de lista vazia ocupa o lugar das threads
    - expect: nenhum controle "Carregar mais comentários" aparece
