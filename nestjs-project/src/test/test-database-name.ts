// Banco exclusivo das suítes de integração e e2e. Nunca é o banco de
// desenvolvimento (DB_NAME): o globalSetup apaga e recria o schema dele a cada
// execução do Jest, e o synchronize das suítes de integração o altera por fora
// das migrations.
const DEFAULT_TEST_DATABASE = 'streamtube_test';

// O nome vira identificador em CREATE DATABASE, que não aceita parâmetro.
const SAFE_IDENTIFIER = /^[a-z0-9_]+$/;

export function resolveTestDatabaseName(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const name = env.DB_TEST_NAME || DEFAULT_TEST_DATABASE;
  if (!name.endsWith('_test') || !SAFE_IDENTIFIER.test(name)) {
    throw new Error(
      `DB_TEST_NAME="${name}" inválido: use só [a-z0-9_] e termine em "_test". ` +
        'As suítes recriam o schema desse banco, então ele nunca pode ser o de desenvolvimento.',
    );
  }
  return name;
}
