---
subproject: backend
runner: jest+supertest
scope: phase-07-testes-producao
si: SI-07.16
target_file: test/health.e2e-spec.ts
---

# GET /health — Test Plan

## Application Overview

Rota nova da Fase 07, fatia testes-producao: o health simples da API (`testes-producao/TD-10` B). O compose de produção a usa como `healthcheck` do serviço `api` e como condição de subida dos serviços dependentes (`depends_on: condition: service_healthy`).

A rota é `@Public()` e responde `200` com `{ "status": "ok" }`. Ela significa apenas que o processo subiu e atende HTTP: não consulta banco, fila nem storage, porque o Terminus fica para quando houver agregador de logs. Fica no default global de rate limit, 120 requisições por 60 s por visitante (`rate-limit-visitor-identity/TD-04`).

É infraestrutura, não contrato do front, então fica fora do Swagger (`@ApiExcludeController()`). Assim o `openapi.json` e o `types.gen.ts` da cadeia de contrato não mudam (`next-frontend-openapi-typing/TD-03`).

## Test Scenarios

### 1. Saúde da API

**Setup:** `beforeAll` sobe o `AppModule` com os pipes e filtros globais do `main.ts`, como os demais e2e (`Test.createTestingModule({ imports: [AppModule] })`). Não há `beforeEach` de limpeza nem seed: a rota não lê dados, e os cenários precisam valer com o banco de teste sem contas nem vídeos.

#### 1.1. responde-ok-sem-autenticacao-e-sem-dados

**Covers AC:** #1, #2
**Source:** auto
**Last sync:** 2026-10-13T00:01:16Z

**Steps:**
  1. `GET /health` sem `Authorization` e sem cookie, com o banco de teste sem nenhuma conta nem vídeo
    - expect: status `200`
    - expect: corpo exatamente `{ "status": "ok" }`

#### 1.2. token-invalido-nao-bloqueia-a-rota-publica

**Covers AC:** #1
**Source:** auto
**Last sync:** 2026-10-13T00:01:16Z

**Steps:**
  1. `GET /health` com `Authorization: Bearer token-invalido`
    - expect: status `200`, e não `401` — a rota é `@Public()`, então o guard global de autenticação não a bloqueia
    - expect: corpo `{ "status": "ok" }`

### 2. Fora do contrato OpenAPI

**Setup:** o mesmo app do grupo 1. O documento é montado com `SwaggerModule.createDocument(app, buildSwaggerConfig())`, como em `test/swagger.e2e-spec.ts`.

#### 2.1. documento-swagger-nao-contem-health

**Covers AC:** #3
**Source:** auto
**Last sync:** 2026-10-13T00:01:16Z

**Steps:**
  1. Montar o documento Swagger a partir do app de teste
    - expect: `document.paths` não tem a chave `/health`
    - expect: `document.paths` continua com os paths existentes (ex.: `/auth/login`), o que mostra que o documento foi montado de fato
