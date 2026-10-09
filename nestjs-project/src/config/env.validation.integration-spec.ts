import { envValidationSchema } from './env.validation';

const requiredEnv = {
  DB_USERNAME: 'user',
  DB_PASSWORD: 'pass',
  DB_NAME: 'db',
  JWT_SECRET: 'secret',
  JWT_REFRESH_SECRET: 'refresh-secret',
  INTERNAL_API_SECRET: 'internal-secret',
  MINIO_ACCESS_KEY: 'minio-access-key',
  MINIO_SECRET_KEY: 'minio-secret-key',
};

const validate = (env: Record<string, string>) =>
  envValidationSchema.validate(
    { ...requiredEnv, ...env },
    { allowUnknown: true, abortEarly: false },
  );

describe('envValidationSchema — INTERNAL_API_SECRET', () => {
  it('should reject the environment when INTERNAL_API_SECRET is missing', () => {
    const withoutSecret: Record<string, string> = { ...requiredEnv };
    delete withoutSecret.INTERNAL_API_SECRET;
    const { error } = envValidationSchema.validate(withoutSecret, {
      allowUnknown: true,
      abortEarly: false,
    });
    expect(error).toBeDefined();
    expect(error!.message).toContain('INTERNAL_API_SECRET');
  });

  it('should accept the environment when INTERNAL_API_SECRET is present', () => {
    const { error } = validate({});
    expect(error).toBeUndefined();
  });
});

describe('envValidationSchema — SWAGGER_ENABLED', () => {
  it('should reject SWAGGER_ENABLED with an invalid value', () => {
    const { error } = validate({ SWAGGER_ENABLED: 'invalid' });
    expect(error).toBeDefined();
    expect(error!.message).toContain('SWAGGER_ENABLED');
  });

  it('should accept SWAGGER_ENABLED=true', () => {
    const { error } = validate({ SWAGGER_ENABLED: 'true' });
    expect(error).toBeUndefined();
  });

  it('should accept SWAGGER_ENABLED=false', () => {
    const { error } = validate({ SWAGGER_ENABLED: 'false' });
    expect(error).toBeUndefined();
  });

  it('should apply default false when SWAGGER_ENABLED is not set', () => {
    const { value, error } = validate({}) as {
      value: Record<string, unknown>;
      error?: Error;
    };
    expect(error).toBeUndefined();
    expect(value.SWAGGER_ENABLED).toBe('false');
  });
});
