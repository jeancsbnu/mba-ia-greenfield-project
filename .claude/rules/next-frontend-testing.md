---
paths:
  - 'next-frontend/**/__tests__/**'
  - 'next-frontend/tests/**'
  - 'next-frontend/**/*.test.ts'
  - 'next-frontend/**/*.test.tsx'
  - 'next-frontend/**/*.integration.test.ts'
  - 'next-frontend/**/*.integration.test.tsx'
  - 'next-frontend/**/*.e2e-spec.ts'
description: 'Test type routing, file placement, forbidden patterns (no real-network Vitest tests)'
---

# next-frontend — Testing Rules

## Forbidden pattern — never hit the upstream API directly

A test file that opens a network connection to the real upstream API **MUST NOT** exist in this project. If you find yourself wanting one, the right tool is:

- **`*.e2e-spec.ts`** (Playwright) — drives the running app, which talks to whatever upstream the running environment is wired to.
- **`*.integration.test.ts`** (Vitest + MSW) — with hand-written handlers under `mocks/handlers.ts` or per-test overrides via `server.use(...)`.

Never write a Vitest test that opens a real `fetch` to the upstream host. The contract for integration tests is "BFF as functions, MSW as fake upstream" — see the MSW rule for the 4-step pattern.

## File placement summary

- **Unit / Integration tests live next to the code they exercise**, in a `__tests__/` directory:
  - `components/<feature>/__tests__/*.test.tsx` for component unit tests.
  - `app/api/<route>/__tests__/*.integration.test.ts` for Route Handler integration tests.
  - `lib/__tests__/*.test.ts` for util unit tests.
- **E2E tests live at the project root**: `next-frontend/tests/*.e2e-spec.ts`.

## Nunca consultar `role="alert"` sem escopo

O Next renderiza `#__next-route-announcer__` com `role="alert"` em toda página, permanentemente e quase sempre vazio. Logo `getByRole("alert")` nunca é uma consulta limpa: `toBeVisible()` passa na hora contra o elemento errado, e `toHaveCount(0)` falha numa página que não mostra erro nenhum.

Escopar sempre — no slot da própria aplicação (`page.locator("[data-slot='upload-error']")`) ou na região de conteúdo (`page.locator("main [role='alert']")`).

## E2E: reiniciar o dev server depois de mexer em `mocks/`

Vitest reimporta `mocks/` a cada execução, então unit e integração sempre veem a edição. **E2E não:** o `instrumentation.ts` importa `mocks/server.ts` uma única vez, no boot. Editar `mocks/` e rodar o Playwright exercita em silêncio os handlers do boot anterior.

Isso e as demais armadilhas silenciosas de reinício estão em `next-frontend/CLAUDE.md` → "Restarting the dev server"; os gotchas de corrida de hidratação e de `waitForRequest` estão em `testing-guide-next-frontend/references/gotchas.md`.

## DOM rendering opt-in

**DOM rendering opt-in:** o ambiente default `node` não renderiza componentes/páginas. Testes que renderizam JSX/TSX (componentes, páginas — linhas da tabela "Test type selection") devem optar pelo DOM **por arquivo** com o docblock `// @vitest-environment jsdom` no topo do arquivo (`jsdom` e `@testing-library/react` já estão instalados). Sem esse docblock, apenas lógica pura/hooks/utils rodam sob `node`.