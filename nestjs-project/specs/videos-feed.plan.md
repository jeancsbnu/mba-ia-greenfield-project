---
subproject: backend
runner: jest+supertest
scope: phase-07-home-busca
si: SI-07.3
target_file: test/videos-feed.e2e-spec.ts
---

# GET /videos — Test Plan

## Application Overview

Rota nova da Fase 07, fatia home-busca: a listagem global que alimenta a home, o filtro por categoria e a busca. É um endpoint só, com `q` e `category` opcionais e combináveis (`home-busca/TD-01` B). A ordem é sempre por recência, `published_at DESC, id DESC`, com ou sem `q` (`home-busca/TD-03` A e `home-busca/TD-04` A).

Só entram vídeos listáveis: publicados (`published_at IS NOT NULL`) e `public`. `unlisted` e rascunho nunca aparecem (`video-channel-management/TD-02`).

A busca devolve só vídeos (`home-busca/TD-05` A). O termo casa com o título, o nome do canal ou o nickname, sem acento e sem caixa, por `pg_trgm` + `unaccent`. O termo mínimo é de 3 caracteres e o máximo de 100. A página padrão é de 12 itens.

A rota é `@Public()` e fica no default global de rate limit, 120 requisições por 60 s por visitante (`home-busca/TD-09` C, `rate-limit-visitor-identity/TD-04` B).

## Test Scenarios

### 1. Listagem, ordenação e filtros

**Setup:** `beforeAll` sobe o `AppModule` com os pipes e filtros globais do `main.ts`. O `beforeEach` limpa `videos`, `channels` e `users` e cria três donos com seus canais:
- "Joana Cria" (`joana_cria`);
- "Docker Brasil" (`docker_brasil`);
- "Tech com Nina" (`tech_com_nina`).

Depois grava vídeos `ready` com `published_at` escalonado, do mais novo ao mais antigo:
- **14 listáveis**, em `Música`, `Educação` e `Tecnologia`, entre eles:
  - "Música ao vivo" (Música, `joana_cria`);
  - três de `docker_brasil` com títulos sem "docker";
  - "Docker na prática" (`tech_com_nina`);
- **fora da listagem:** um `unlisted` publicado com título "Docker escondido" e um rascunho com título "Docker rascunho".

#### 1.1. sem-query-devolve-primeira-pagina-por-recencia

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. `GET /videos` sem parâmetros e sem `Authorization`
    - expect: status `200`
    - expect: `items` tem exatamente `12` elementos (o default de `limit`) e `total` é `14`
    - expect: os `publishedAt` vêm em ordem estritamente decrescente, e o primeiro item é o vídeo listável mais recente
    - expect: cada item traz `publicId`, `title`, `thumbnailUrl`, `durationSeconds`, `viewsCount`, `publishedAt` e `channel` com `nickname` e `name`
  2. `GET /videos?offset=12`
    - expect: status `200`, `items` com os `2` restantes e nenhum `publicId` repetido da página anterior

#### 1.2. nunca-lista-unlisted-nem-rascunho

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. `GET /videos?limit=50`
    - expect: nenhum item corresponde ao vídeo `unlisted` nem ao rascunho
  2. `GET /videos?q=escondido` e `GET /videos?q=rascunho`
    - expect: os dois respondem `200` com `items` vazio e `total` `0`

#### 1.3. filtra-por-categoria

**Covers AC:** #2
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. `GET /videos?category=Música` (valor do enum, percent-encoded na query)
    - expect: status `200`
    - expect: todos os itens pertencem à categoria `Música`, e `total` é o número de listáveis dessa categoria
  2. `GET /videos?category=Música&q=musica`
    - expect: status `200` com "Música ao vivo" entre os itens: categoria e busca se combinam

### 2. Busca por título e canal

**Setup:** o mesmo do grupo 1.

#### 2.1. busca-casa-titulo-canal-e-nickname

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. `GET /videos?q=docker`
    - expect: status `200`
    - expect: os itens incluem "Docker na prática", que casa pelo título, e os três vídeos de `docker_brasil`, que casam pelo canal
    - expect: `total` é `4`; o `unlisted` "Docker escondido" e o rascunho "Docker rascunho" não aparecem
    - expect: os itens vêm em ordem decrescente de `publishedAt`
  2. `GET /videos?q=MUSICA`
    - expect: "Música ao vivo" aparece: o casamento ignora acento e caixa
  3. `GET /videos?q=tech_com`
    - expect: os vídeos de `tech_com_nina` aparecem, pelo nickname

#### 2.2. curinga-do-like-e-literal

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Gravar um vídeo listável com título "aXbYc" e chamar `GET /videos?q=a_b`
    - expect: status `200` e "aXbYc" não aparece: o `_` do termo é literal, não curinga
  2. `GET /videos?q=100%25` (termo `100%`)
    - expect: status `200`, sem erro de SQL, e só casam títulos que contêm literalmente `100%`

### 3. Validação da query

**Setup:** o mesmo do grupo 1.

#### 3.1. termo-curto-retorna-400

**Covers AC:** #4
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. `GET /videos?q=ab`
    - expect: status `400` com envelope `{ statusCode: 400, error: "VALIDATION_ERROR", message }`
  2. `GET /videos?q=%20%20ab%20` (termo `  ab ` com espaços)
    - expect: status `400` — o termo é aparado antes da validação
  3. `GET /videos?q=` seguido de 101 caracteres
    - expect: status `400` com `error: "VALIDATION_ERROR"`

#### 3.2. categoria-fora-do-enum-retorna-400

**Covers AC:** #5
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. `GET /videos?category=Culinária`
    - expect: status `400` com `error: "VALIDATION_ERROR"`

#### 3.3. limit-e-offset-fora-da-faixa-retornam-400

**Covers AC:** #6
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. `GET /videos?limit=51`
    - expect: status `400` com `error: "VALIDATION_ERROR"`
  2. `GET /videos?limit=0` e `GET /videos?offset=-1`
    - expect: os dois respondem `400` com `error: "VALIDATION_ERROR"`

### 4. Rate limit

**Setup:** o `AppModule` com o throttler real, como em `test/throttle-visitor-identity.e2e-spec.ts`; o storage do throttler é limpo antes do cenário.

#### 4.1. default-global-de-120-por-visitante

**Covers AC:** #7
**Source:** auto
**Last sync:** 2026-10-11T21:24:20Z

**Steps:**
  1. Do mesmo visitante, 120 chamadas a `GET /videos`
    - expect: todas respondem `200`; a rota não tem `@SkipThrottle` nem orçamento próprio
  2. A 121ª chamada do mesmo visitante
    - expect: status `429` com `error: "RATE_LIMIT_EXCEEDED"`
