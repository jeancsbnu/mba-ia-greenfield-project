import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exportSpec } from './openapi-export';

describe('exportSpec (integration)', () => {
  let outputPath: string;
  let document: Record<string, unknown>;

  beforeAll(async () => {
    outputPath = join(tmpdir(), `openapi-test-${Date.now()}.json`);
    await exportSpec(outputPath);
    document = JSON.parse(readFileSync(outputPath, 'utf-8')) as Record<
      string,
      unknown
    >;
  }, 30_000);

  it('exports a valid OpenAPI 3.x document', () => {
    expect(document.openapi).toMatch(/^3\./);
  });

  it('sets info.title to "StreamTube API"', () => {
    const info = document.info as Record<string, unknown>;
    expect(info.title).toBe('StreamTube API');
  });

  it('sets info.version to "1.0"', () => {
    const info = document.info as Record<string, unknown>;
    expect(info.version).toBe('1.0');
  });

  it('includes access-token Bearer security scheme', () => {
    const components = document.components as Record<string, unknown>;
    const schemes = components.securitySchemes as Record<
      string,
      Record<string, unknown>
    >;
    expect(schemes['access-token']).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
  });

  // Atenção: exportSpec roda aqui em processo, sob ts-jest, e o plugin do
  // Swagger é um transformador de compilação declarado no nest-cli.json — ele
  // NÃO atua nesta execução. Logo este bloco só pode afirmar o que independe
  // do plugin; a inferência a partir dos DTOs é verificada no describe abaixo,
  // contra o openapi.json commitado.
  it('includes components.schemas', () => {
    const components = document.components as Record<string, unknown>;
    const schemas = components.schemas as Record<string, unknown>;
    expect(Object.keys(schemas).length).toBeGreaterThan(0);
  });

  it('includes ApiErrorEnvelope schema with expected properties', () => {
    const components = document.components as Record<string, unknown>;
    const schemas = components.schemas as Record<
      string,
      Record<string, unknown>
    >;
    expect(schemas['ApiErrorEnvelope']).toBeDefined();
    const props = schemas['ApiErrorEnvelope'].properties as Record<
      string,
      unknown
    >;
    expect(props).toHaveProperty('statusCode');
    expect(props).toHaveProperty('error');
    expect(props).toHaveProperty('message');
    expect(props).toHaveProperty('code');
  });

  it('has at least one path with a 401 response referencing ApiErrorEnvelope', () => {
    const paths = document.paths as Record<
      string,
      Record<string, Record<string, unknown>>
    >;
    const apiErrorRef = '#/components/schemas/ApiErrorEnvelope';

    const hasRef = Object.values(paths).some((methods) =>
      Object.values(methods).some((operation) => {
        const responses = operation.responses as Record<
          string,
          Record<string, unknown>
        >;
        const r401 = responses?.['401'];
        if (!r401) return false;
        const content = r401.content as Record<string, Record<string, unknown>>;
        const jsonContent = content?.['application/json'];
        const schema = jsonContent?.schema as Record<string, unknown>;
        return schema?.['$ref'] === apiErrorRef;
      }),
    );

    expect(hasRef).toBe(true);
  });

  it('protected auth endpoints include access-token security requirement', () => {
    const paths = document.paths as Record<
      string,
      Record<string, Record<string, unknown>>
    >;
    const protectedPaths = [
      { path: '/auth/logout', method: 'post' },
      { path: '/auth/me', method: 'get' },
    ];

    for (const { path, method } of protectedPaths) {
      const operation = paths[path]?.[method];
      expect(operation).toBeDefined();
      const security = operation?.security as Array<Record<string, unknown>>;
      expect(security).toBeDefined();
      expect(security.some((req) => 'access-token' in req)).toBe(true);
    }
  });

  it('all auth endpoints have a non-empty summary', () => {
    const paths = document.paths as Record<
      string,
      Record<string, Record<string, unknown>>
    >;
    const authPaths = Object.entries(paths).filter(([p]) =>
      p.startsWith('/auth/'),
    );

    expect(authPaths.length).toBeGreaterThan(0);

    for (const [, methods] of authPaths) {
      for (const operation of Object.values(methods)) {
        expect(typeof operation.summary).toBe('string');
        expect((operation.summary as string).length).toBeGreaterThan(0);
      }
    }
  });
});

// O openapi.json commitado é o artefato que o next-frontend consome para gerar
// types.gen.ts. Ele só sai correto quando `npm run openapi:export` roda via
// `nest build` — com `ts-node` o plugin do Swagger não atua e TODO DTO de
// requisição sai sem propriedades, além de os @Query() sumirem. Isso passou
// despercebido até a SI-04.11b porque a asserção anterior só contava schemas.
describe('openapi.json commitado', () => {
  let document: Record<string, unknown>;

  beforeAll(() => {
    const committed = join(__dirname, '..', 'openapi.json');
    document = JSON.parse(readFileSync(committed, 'utf-8')) as Record<
      string,
      unknown
    >;
  });

  function schemaProps(name: string): Record<string, unknown> {
    const components = document.components as Record<string, unknown>;
    const schemas = components.schemas as Record<
      string,
      Record<string, unknown>
    >;
    expect(schemas[name]).toBeDefined();
    return (schemas[name].properties ?? {}) as Record<string, unknown>;
  }

  it.each(['RegisterDto', 'LoginDto', 'UpdateChannelDto'])(
    'has the plugin-inferred properties of %s',
    (name) => {
      expect(Object.keys(schemaProps(name)).length).toBeGreaterThan(0);
    },
  );

  it('declares the offset/limit query parameters of GET /me/videos', () => {
    const paths = document.paths as Record<
      string,
      Record<string, Record<string, unknown>>
    >;
    const parameters = paths['/me/videos'].get.parameters as Array<{
      name: string;
      in: string;
    }>;
    const queryNames = parameters
      .filter((parameter) => parameter.in === 'query')
      .map((parameter) => parameter.name);

    expect(queryNames).toEqual(expect.arrayContaining(['offset', 'limit']));
  });
});
