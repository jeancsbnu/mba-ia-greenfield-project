---
subproject: backend
runner: jest+supertest
scope: phase-06-social-interactions
si: SI-06.3
target_file: test/channels-subscription.e2e-spec.ts
---

# PUT / DELETE /channels/{nickname}/subscription — Test Plan

## Application Overview

Par de rotas novo da Fase 06: seguir e deixar de seguir um canal. A inscrição é uma linha em `subscriptions` (PK composta `user_id` + `channel_id`), e `channels.subscribers_count` é mantido **na mesma transação** que cria ou apaga a linha (`social-interactions/TD-06`, Option B, com o mecanismo do `TD-02`). As duas rotas são **idempotentes**: repetir o `PUT` de quem já segue, ou o `DELETE` de quem não segue, devolve `200` com o estado atual e não mexe no contador.

Exigem Bearer. Têm orçamento de throttle próprio de **60 requisições por 60 s por IP** (`social-interactions/TD-09`, Option B — o orçamento de reações e inscrição), sobrepondo o default global de 10/60 s do `ThrottlerModule`.

Auto-inscrição não é bloqueada — nenhum TD pede; esta spec não testa nem um caminho nem outro.

**Nota de cobertura.** O desvio do contador sob falha no meio da transação e o incremento atômico sob concorrência não são observáveis por uma sequência de chamadas `supertest`; ficam com as linhas de Integration do SI (`src/subscriptions/subscriptions.service.integration-spec.ts`, `src/channels/channels.service.integration-spec.ts`).

## Test Scenarios

### 1. Inscrever e cancelar

**Setup:** `beforeAll` sobe o `AppModule` com os pipes e filtros globais do `main.ts`, como as demais specs de `test/`; `beforeEach` limpa `subscriptions`, `videos`, `channels` e `users` com `dataSource.query('DELETE FROM …')`; cria o dono do canal `joana_cria` e um segundo usuário (o seguidor), cada um com seu canal, e emite um Bearer válido para o seguidor.

#### 1.1. inscrever-soma-um-ao-contador

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Consultar `channels.subscribers_count` de `joana_cria` no banco
    - expect: `0` (a leitura por `GET /channels/{nickname}` só ganha o campo no SI-06.6)
  2. `PUT /channels/joana_cria/subscription` com o Bearer do seguidor, sem corpo
    - expect: status `200`
    - expect: corpo `{ subscribed: true, subscribersCount: 1 }`
  3. Consultar `subscriptions` no banco
    - expect: existe exatamente uma linha para o par (seguidor, `joana_cria`)

#### 1.2. repetir-inscricao-nao-soma-de-novo

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `PUT /channels/joana_cria/subscription` com o Bearer do seguidor
    - expect: `subscribersCount` é `1`
  2. Repetir o mesmo `PUT`
    - expect: status `200`
    - expect: `subscribed: true` e `subscribersCount` continua `1`
  3. Consultar `channels.subscribers_count` de `joana_cria` no banco
    - expect: `1`

#### 1.3. cancelar-subtrai-e-e-idempotente

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `PUT /channels/joana_cria/subscription` com o Bearer do seguidor
    - expect: `subscribersCount` é `1`
  2. `DELETE /channels/joana_cria/subscription` com o mesmo Bearer
    - expect: status `200`
    - expect: corpo `{ subscribed: false, subscribersCount: 0 }`
  3. Repetir o mesmo `DELETE`
    - expect: status `200`
    - expect: `subscribersCount` continua `0` — o contador não fica negativo

#### 1.4. sem-token-e-canal-inexistente

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. `PUT /channels/joana_cria/subscription` sem `Authorization`
    - expect: status `401`
  2. `DELETE /channels/joana_cria/subscription` sem `Authorization`
    - expect: status `401`
  3. `PUT /channels/nao_existe/subscription` com o Bearer do seguidor
    - expect: status `404`
    - expect: `error` é `CHANNEL_NOT_FOUND`
  4. Consultar `subscriptions` no banco
    - expect: nenhuma linha foi criada pelas três chamadas

### 2. Orçamento de rate limit próprio

**Setup:** o mesmo do grupo 1. O cenário roda isolado, para que o contador em memória do throttler não vaze entre testes — `beforeEach` limpa o `ThrottlerStorage`. O contador do `@nestjs/throttler` é por handler (rota + método): `PUT` e `DELETE` têm orçamentos próprios de 60/60 s cada.

#### 2.1. limite-de-60-por-60s-e-auth-independente

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-10-06T01:01:38Z

**Steps:**
  1. Emitir 60 `PUT /channels/joana_cria/subscription` com o Bearer do seguidor, do mesmo IP, dentro de 60 s
    - expect: as 60 respostas são `200` — a operação é idempotente
  2. Emitir o 61º `PUT` na mesma janela
    - expect: status `429`
    - expect: `error` é `RATE_LIMIT_EXCEEDED`
  3. Emitir 11 `POST /auth/login` com credenciais inválidas, do mesmo IP, numa janela nova
    - expect: a 11ª retorna `429` — o default global de 10/60 s das rotas de autenticação continua valendo
