> Part of the `testing-guide-nestjs-project` skill (see `../SKILL.md`).

# External System Strategies

How each external system is handled in tests. These strategies were confirmed with the team.

---

## PostgreSQL — Real (Docker)

**Strategy:** Real database via the Docker `db` service (already in `compose.yaml`), but a **dedicated test database** — never the dev database `streamtube`.

**Which database:** `DB_TEST_NAME` (default `streamtube_test`; must end in `_test`). The dev database only changes through `migration:run`.

- `src/test/global-setup.ts` (Jest `globalSetup`, both configs) creates the test database if missing, drops its `public` schema and re-applies **all** migrations — every run starts from the exact schema `migration:run` produces.
- `src/test/use-test-environment.ts` (Jest `setupFiles`) sets `DB_NAME` to the test database (and the queue and bucket below to theirs), so e2e suites that boot `AppModule` hit it too.
- Integration suites build their DataSource with `createTestDataSource(entities)` (`src/test/create-test-data-source.ts`), which already points at the test database. Never hand-roll connection options with `process.env.DB_NAME`/`DB_DATABASE` in a test.

**Connection config for tests:**
```typescript
import { createTestDataSource } from '../test/create-test-data-source';

const dataSource = createTestDataSource([User]); // synchronize: true by default
// or, inside a testing module:
TypeOrmModule.forRoot(createTestDataSource([User]).options);
```

**Test isolation:**
- Use `dataSource.query('DELETE FROM "table_name"')` to clean tables between tests
- Do NOT use `repository.delete({})` — throws `Empty criteria(s) are not allowed`
- Alternative: `repository.clear()` (truncates the table)
- For complex foreign key chains, delete in reverse dependency order or use `TRUNCATE ... CASCADE`
- Use `beforeEach` for cleanup to ensure each test starts with a clean state

**Entity setup:**
- Use `synchronize: true` in test DataSource to auto-create tables from entities
- For integration tests, import only the entities needed by the test — not all entities
- For E2E tests, import `AppModule` which includes all entities via their domain modules

---

## Object Storage — MinIO (Real, Docker)

**Strategy:** Real MinIO via the Docker `minio` service, accessed through `StorageService` (S3 API), but a **dedicated test bucket** — never the dev bucket `videos`.

**Which bucket:** `MINIO_TEST_BUCKET` (default `videos-test`; must end in `-test` and differ from `MINIO_BUCKET`). `src/test/use-test-environment.ts` sets `MINIO_BUCKET` to it, so `storageConfig().minioBucket`, `StorageService` and the tus upload server all use it. `StorageService.onModuleInit` creates the bucket if missing.

**Rules:**
- Read the bucket from `storageConfig().minioBucket` (or the injected config) — never hardcode `'videos'`.
- Prefer random keys per test; a fixed key may only be deleted in a bucket owned by the test (the dev seed spec goes further and uses its own `-seed-test` bucket).
- Clean up the objects a test creates when they could affect other tests.

```typescript
const config = storageConfig(); // MINIO_BUCKET already points at the test bucket
const storageService = new StorageService(config);
await storageService.onModuleInit(); // creates the test bucket if needed
```

---

## Message Queue — BullMQ on Redis (Real, Docker)

**Strategy:** Real Redis via the Docker `redis` service and the real BullMQ queue `video-processing`, but on a **dedicated Redis index** — never the dev index the `video-worker` consumes.

**Which index:** `REDIS_TEST_DB` (default `1`; must differ from `REDIS_DB`, default `0`). `src/test/use-test-environment.ts` sets `REDIS_DB` to it, and `QueueModule` passes it as `connection.db`.

**Rules:**
- Producer tests: `queue.drain(true)` in `beforeEach` is fine — it only drains the test index — then assert the enqueued job's name and data.
- Consumer tests: call the processor directly with a fake `Job` (see `video-processing.consumer.integration-spec.ts`); never `init()` a module with a `@Processor`, which would start a real worker.
- A test that compiles a module with a queue and closes it right away must `await queue.waitUntilReady()` before `module.close()`: closing mid-connect makes BullMQ emit an unhandled "Connection is closed" that fails whichever test file runs next.

```typescript
const queue = module.get<Queue>(getQueueToken('video-processing'));
await queue.drain(true); // test index only
```

---

## Email — Mailpit (Real SMTP Capture)

**Strategy:** Mailpit — a local SMTP server that captures all emails for inspection via its API. No emails are actually delivered.

**Setup:**
- Add Mailpit to `compose.yaml`:
```yaml
mailpit:
  image: axllent/mailpit
  ports:
    - "1025:1025"   # SMTP
    - "8025:8025"   # Web UI / API
```

**NestJS configuration:**
```typescript
// In mail module or config
{
  transport: {
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
  },
}
```

**Integration test:**
```typescript
describe('MailService (integration)', () => {
  beforeEach(async () => {
    // Clear all captured emails via Mailpit API
    await fetch('http://localhost:8025/api/v1/messages', { method: 'DELETE' });
  });

  it('should send confirmation email', async () => {
    await mailService.sendConfirmation('user@test.com', 'token-123');

    // Query Mailpit API for captured emails
    const response = await fetch('http://localhost:8025/api/v1/messages');
    const data = await response.json();

    expect(data.messages).toHaveLength(1);
    expect(data.messages[0].To[0].Address).toBe('user@test.com');
    expect(data.messages[0].Subject).toContain('confirm');
  });
});
```

**Key points:**
- Mailpit captures ALL emails — no mocking, no side effects
- Use Mailpit's REST API (`http://localhost:8025/api/v1/messages`) to inspect sent emails
- Clear captured emails in `beforeEach` to ensure test isolation
- Web UI at `http://localhost:8025` for manual debugging
- Tests the full SMTP transport path — if the SMTP config is wrong, the test fails
