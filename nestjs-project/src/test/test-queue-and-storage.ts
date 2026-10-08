// Fila (Redis) e bucket (MinIO) exclusivos das suítes de teste, no mesmo
// espírito do banco de teste (test-database-name.ts): os testes enfileiram e
// drenam a fila `video-processing` e gravam e apagam objetos, e nada disso
// pode alcançar o worker nem a mídia do ambiente de desenvolvimento.
//
// Os dois resolvedores comparam com REDIS_DB e MINIO_BUCKET do dev, então
// devem rodar sobre o ambiente original — antes de use-test-environment.ts
// sobrescrever essas variáveis.
const DEFAULT_TEST_REDIS_DB = 1;
const DEFAULT_TEST_BUCKET = 'videos-test';

// O Redis padrão expõe os índices 0..15.
const MAX_REDIS_DB = 15;

// Regras de nome de bucket S3: 3-63 caracteres, minúsculas, dígitos, ponto e
// hífen, começando e terminando com letra ou dígito.
const BUCKET_NAME = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;

export function resolveTestRedisDb(
  env: NodeJS.ProcessEnv = process.env,
): number {
  const devDb = Number(env.REDIS_DB || 0);
  const testDb = Number(env.REDIS_TEST_DB || DEFAULT_TEST_REDIS_DB);
  if (
    !Number.isInteger(testDb) ||
    testDb < 0 ||
    testDb > MAX_REDIS_DB ||
    testDb === devDb
  ) {
    throw new Error(
      `REDIS_TEST_DB="${env.REDIS_TEST_DB ?? DEFAULT_TEST_REDIS_DB}" inválido: use um índice de 0 a ${MAX_REDIS_DB} ` +
        `diferente do REDIS_DB do dev (${devDb}). As suítes drenam a fila desse índice.`,
    );
  }
  return testDb;
}

export function resolveTestBucket(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const devBucket = env.MINIO_BUCKET || 'videos';
  const bucket = env.MINIO_TEST_BUCKET || DEFAULT_TEST_BUCKET;
  if (
    !bucket.endsWith('-test') ||
    bucket === devBucket ||
    !BUCKET_NAME.test(bucket)
  ) {
    throw new Error(
      `MINIO_TEST_BUCKET="${bucket}" inválido: precisa ser um nome de bucket válido terminado em "-test" ` +
        `e diferente do MINIO_BUCKET do dev ("${devBucket}"). As suítes apagam objetos desse bucket.`,
    );
  }
  return bucket;
}
