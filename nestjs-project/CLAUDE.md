# CLAUDE.md

## Environment Startup Verification

**Default behavior:** starting the environment means starting **only infrastructure services** (database, mail, etc.) — **never** start the NestJS application server unless the user explicitly asks to run/serve the project (e.g., "rode o projeto", "suba o servidor", "run the app").

After starting infrastructure, always confirm the containers are up before proceeding:

```bash
docker compose ps   # all services must show status "running"
```

Then verify each infrastructure service is actually ready to accept connections — not just running:

- **PostgreSQL:** `docker compose exec db pg_isready -U streamtube` — expect `accepting connections`

Only start the NestJS dev server (`npm run start:dev`) when the user **explicitly** asks to run the application — never as part of "start the environment".

## Development Environment

This project runs inside Docker. Always use the container for development:

```bash
# Start containers
docker compose up -d

# Install dependencies into the node_modules volume (see "node_modules volume" below)
docker compose exec nestjs-api npm ci
docker compose restart video-worker

# Run the dev server (watch mode)
docker compose exec nestjs-api npm run start:dev
```

### node_modules volume

`node_modules` is **not** read from the bind mount: `compose.yaml` mounts the named volume `nestjs_node_modules` over `/home/node/app/node_modules` in both `nestjs-api` and `video-worker` (one install serves both). It lives on the WSL2 ext4 disk; through the Windows→Linux bind mount every Jest file, `tsc` and `ts-node` run re-read thousands of files and the processes sat in I/O wait.

- The volume starts **empty** — on a new machine, after `docker compose down -v`, or after recreating it. Run `npm ci` inside the container (~1 min), then restart `video-worker`, which crash-loops with `Cannot find module '@nestjs/core'` until the install exists.
- Installing on the host has no effect on the containers; the host `node_modules` only serves the editor.
- After changing dependencies (`package.json` / `package-lock.json`, including after a pull), run `npm ci` in the container again.
- `Dockerfile.dev` creates `node_modules` owned by `node`, so Docker initializes the volume with that owner; without it the volume is `root:root` and `npm ci` fails with `EACCES`. After changing `Dockerfile.dev`, rebuild with `docker compose build nestjs-api video-worker`.

Services:
- `nestjs-api` — NestJS API, port `3000`
- `db` — PostgreSQL 17, port `5432`, user/password `streamtube`. Two databases:
  - `streamtube` (`DB_NAME`) — development. Its schema changes **only** through `npm run migration:run`.
  - `streamtube_test` (`DB_TEST_NAME`) — owned by the test suites; created and rebuilt automatically on every Jest run (see "Test execution").

All verification and teardown commands run on the **host machine**:

```bash
# Verify NestJS is running (expect 200 + "Hello World!")
curl http://localhost:3000

# Verify PostgreSQL is ready (runs inside the db container)
docker compose exec db pg_isready -U streamtube

# Check container logs
docker compose logs nestjs-api
docker compose logs db

# Tear down the entire environment
docker compose down
```

## Video Worker

The `video-worker` service runs the **compiled** worker (`npm run start:worker` → `node dist/worker.main`), with no watch mode and `restart: on-failure`. It does not compile anything itself: it reuses the `dist/` that shares the bind mount with `nestjs-api` (design from Phase 03 — two `tsc --watch` processes with `deleteOutDir` would fight over the same `dist/`). That `dist/` is only produced by `npm run start:dev` (or `npm run build`) inside `nestjs-api`.

Since the dev server is **not** started by default (see "Environment Startup Verification") — and a local `compose.override.yaml` may replace the `nestjs-api` command with `tail -f /dev/null` — `dist/` is usually missing or stale. Symptoms:

- `dist/` missing → the worker crash-loops with `Error: Cannot find module '/home/node/app/dist/worker.main'` (`docker compose ps` shows `Restarting`).
- `dist/` stale → the worker runs old code; uploads stay in `processing` or fail with errors that no longer match `src/`.

After any change that affects the worker (and after pulling such changes), rebuild and restart it (the build takes ~15 s):

```bash
docker compose exec nestjs-api npm run build
docker compose restart video-worker
docker compose logs --tail 20 video-worker
```

The worker boots with `NestFactory.createApplicationContext`, which does **not** print "Nest application successfully started". It is healthy when the log ends with the `... dependencies initialized` lines and no error, and `docker compose ps video-worker` stays `Up` (no restarts) — the TypeORM connection retries for ~30 s before giving up, so check again after that.

Pitfalls:

- `dist/` existing is not a build: `npx tsc --noEmit` (incremental) leaves only `dist/tsconfig.tsbuildinfo`. Check for `dist/worker.main.js`.
- `nest build` deletes `dist/` first (`deleteOutDir`). Restart the worker only **after** the build finishes, or it crashes on a half-written `dist/`.
- The worker only consumes the dev queue (`REDIS_DB`); test suites use their own index (see "Test execution"), so their jobs never reach it.

## Commands

**Strict rule:** every `npm`, `npx`, `node`, `tsc`, and test command runs **inside the container**, never on the host. Running on the host causes env-var divergence (`DB_HOST` resolves to `localhost` instead of the Compose service), uses a different Node version, and produces results that do not reflect what runs in CI/prod.

### Container-only commands (always prefix with `docker compose exec nestjs-api`)

```bash
npm run start:dev                        # Dev server with hot-reload
npm run build                            # Compile to dist/
npm run start:prod                       # Run compiled build

npm test                                 # Unit tests
npm run test:watch                       # Unit tests in watch mode
npm run test:cov                         # Coverage report
npm run test:e2e                         # End-to-end tests (always with --runInBand)

npx tsc --noEmit                         # Type-check (required before declaring a task done)
npm run lint                             # ESLint with auto-fix
npm run format                           # Prettier formatting
```

### Host-only commands (Docker / connectivity probes)

```bash
docker compose ps
docker compose logs nestjs-api
docker compose exec db pg_isready -U streamtube
curl http://localhost:3000
```

### Test execution

Integration and e2e suites run against **dedicated test resources**, never the dev ones:

| Resource | Dev | Tests | Guard |
|---|---|---|---|
| Postgres database | `DB_NAME` = `streamtube` | `DB_TEST_NAME`, default `streamtube_test` | must end in `_test` |
| Redis index (BullMQ queue `video-processing`) | `REDIS_DB` = `0` | `REDIS_TEST_DB`, default `1` | must differ from `REDIS_DB` |
| MinIO bucket | `MINIO_BUCKET` = `videos` | `MINIO_TEST_BUCKET`, default `videos-test` | must end in `-test` and differ from `MINIO_BUCKET` |

The tests enqueue and **drain** the queue and delete objects, so pointing them at the dev resources would drop real processing jobs and dev media; the dev `video-worker` only consumes `REDIS_DB`.

- `src/test/global-setup.ts` (Jest `globalSetup` in both configs) creates the test database if it does not exist, drops its `public` schema and re-applies **all** migrations before any test file runs. No manual setup is needed, and every run starts from the schema `migration:run` produces.
- `src/test/use-test-environment.ts` (Jest `setupFiles`) sets `DB_NAME`, `REDIS_DB` and `MINIO_BUCKET` to the test resources, so suites that boot `AppModule` or read the configs use them too. `globalSetup` validates the queue and bucket guards before any file runs; the test bucket is created on demand by `StorageService.onModuleInit`.
- Integration suites get their DataSource from `createTestDataSource()` (`src/test/create-test-data-source.ts`), which already targets the test database.
- A new migration must be added to `ALL_MIGRATIONS` in `src/test/test-database.ts`; `globalSetup` fails listing any file in `src/database/migrations/` that is missing there.

Even with the dedicated database, the suites share it among themselves. They **must** be run with `--runInBand`, and never two Jest runs at the same time (each run's `globalSetup` rebuilds the schema):

```bash
docker compose exec nestjs-api npm test -- --runInBand
docker compose exec nestjs-api npm run test:e2e   # already configured
```

Parallel execution causes FK violations, deadlocks, and cross-suite contamination because suites truncate or seed shared tables concurrently.

During active development, run only the tests related to the file being changed (`npm test -- path/to/file.spec.ts`). Before declaring a task done, run the full suite — see the global `CLAUDE.md` → "Definition of Done (Technical)".

### Recovering the dev database

Symptom: `npm run migration:run` fails with `relation "..." already exists` (Postgres `routine: 'heap_create_with_catalog'`), and the `migrations` table lists fewer rows than the tables that exist. Before the dedicated test database existed, the test suites ran against `streamtube`: `synchronize: true` created tables outside the migrations and the migrations suite dropped and partially re-applied the `migrations` table.

Recovery rebuilds the schema from the migrations, which **erases all data in `streamtube`**. Back it up first if anything there matters (all commands from `nestjs-project/` on the host):

```bash
docker compose exec -T db pg_dump -U streamtube -d streamtube --data-only --exclude-table=migrations > streamtube-data-backup.sql
docker compose exec -T db psql -U streamtube -d streamtube -c "DROP SCHEMA public CASCADE" -c "CREATE SCHEMA public"
docker compose exec nestjs-api npm run migration:run
docker compose exec db psql -U streamtube -d streamtube -c "SELECT id, name FROM migrations ORDER BY id"
```

The last command must list every file in `src/database/migrations/`. To restore the data, run `psql` with the backup only if the schema it came from matches the migrated one (data dumped from a `synchronize`-built schema may not load cleanly); otherwise repopulate with `npm run seed` (see "Development seed").

### Development seed

`docker compose exec nestjs-api npm run seed` fills the **dev** database with sample data (`src/database/seeds/dev-seed.data.ts`): 5 confirmed accounts `ana`, `bruno`, `carla`, `diego`, `elisa` `@streamtube.dev` (password `streamtube123`), each with a channel, 10 videos across 7 categories (one unlisted, one draft), subscriptions, reactions, comments and replies.

- Videos are real, playable MP4s with thumbnails: `ffmpeg-static` renders them from built-in test patterns and they are uploaded to MinIO under `seed/<publicId>.mp4`. The seed needs `db` and `minio` up and takes about a minute, mostly ffmpeg rendering.
- Denormalized counters (`likes_count`, `comments_count`, `subscribers_count`) are recomputed from the inserted rows, so they match what the API maintains.
- It never deletes anything: if any seed account already exists it does nothing. To re-seed, recover the dev database first (above).

## Long-running Processes

Commands that never exit (dev server, watch modes) must be run in background in the Bash tool — otherwise the agent blocks indefinitely waiting for the process to return.

This applies to: `start:dev`, `start:prod`, `test:watch`, and any other persistent process.

## Test Type Selection

Choose the suffix by what the test really does, not by where the code under test lives. The suffix is a contract that drives Jest config (`testRegex`, parallelism), CI steps, and reader expectations.

| Suffix                  | Purpose                                                              | DB / external I/O | Location                     |
|-------------------------|----------------------------------------------------------------------|-------------------|------------------------------|
| `*.spec.ts`             | **Unit** — pure logic, all collaborators mocked                      | Forbidden         | Next to the source file      |
| `*.integration-spec.ts` | **Integration** — exercises real DB, real repositories, real modules | Required          | Next to the source file      |
| `*.e2e-spec.ts`         | **End-to-end** — full HTTP cycle via `supertest`                     | Required          | `nestjs-project/test/`       |

A test that constructs a `TypeOrmModule.forRoot`, opens a connection, or hits the `db` service **must** be `*.integration-spec.ts`, never `*.spec.ts`. A test that boots the full Nest application and makes HTTP calls **must** be `*.e2e-spec.ts`.

Conventions for **how to write** each kind of test (mocking patterns, AAA structure, override strategies for global guards, etc.) live in `.claude/rules/nestjs-testing.md` and load when you edit a test file.

## Jest Configuration

These settings are required in `package.json` (jest config) and `test/jest-e2e.json` for the project's tests to work correctly:

- `setupFiles: ["dotenv/config", ".../src/test/use-test-environment.ts"]` — `dotenv/config` loads `.env` inside the Jest process (without it `DB_HOST`, `JWT_SECRET`, etc. fall back to undefined or to the host's `localhost`, breaking container-to-container DNS); `use-test-environment.ts` must come after it and points `DB_NAME`, `REDIS_DB` and `MINIO_BUCKET` at the test resources.
- `globalSetup: ".../src/test/global-setup.ts"` — creates and migrates the test database. Removing it leaves e2e suites without a schema.
- `testRegex: '.*\\.(spec|integration-spec)\\.ts$'` — covers both unit (`*.spec.ts`) and integration (`*.integration-spec.ts`) suffixes.

Do not add new test-file suffixes; if a new test type is needed, update the regex deliberately.

## Environment File Conventions

`.env` is parsed by both Docker Compose and `dotenv` — values containing shell-special characters (`<`, `>`, `|`, `&`, spaces) **must be quoted** or rewritten:

```dotenv
# Wrong — the unquoted angle brackets are shell redirection syntax and break parsing
MAIL_FROM=StreamTube <noreply@streamtube.local>

# Right — quote the value
MAIL_FROM="StreamTube <noreply@streamtube.local>"
```

Whenever possible, prefer storing only the bare address in `.env` and composing display names in code (e.g., in `mail.config.ts`) so the file stays shell-safe.

## Build Assets

`tsc` (and therefore `nest build`) only emits compiled `.ts` files to `dist/`. Any non-TypeScript runtime asset — Handlebars templates (`.hbs`), JSON fixtures, static config files, etc. — must be declared in `nest-cli.json` under `compilerOptions.assets` (with `watchAssets: true` for dev). Without that, the file exists in `src/` but is missing in `dist/` and runtime fails only after build.

## Architecture

NestJS with standard module structure. Source lives in `src/`, compiled output in `dist/`.

- Each domain feature gets its own module (e.g., `UsersModule`, `VideosModule`) registered in `AppModule`
- Controllers handle HTTP routing; Services hold business logic; both are scoped to their module

## Code Conventions

- **TypeScript:** `nodenext` module resolution, `ES2023` target, `strictNullChecks` on, `noImplicitAny` off
- **Decorators:** `emitDecoratorMetadata` + `experimentalDecorators` enabled — required for NestJS DI
- **Prettier:** single quotes, trailing commas everywhere
- **ESLint:** `no-explicit-any` allowed; `no-floating-promises` and `no-unsafe-argument` are warnings

## REST Conventions

This is a RESTful API. All endpoints must follow standard REST conventions — correct HTTP methods, proper status codes, plural resource nouns, and consistent URL structure. Details are enforced via rules on controller files.
