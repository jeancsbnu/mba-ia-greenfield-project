import {
  resolveTestBucket,
  resolveTestRedisDb,
} from './test-queue-and-storage';

describe('resolveTestRedisDb', () => {
  it('defaults to index 1 when the dev uses the default index 0', () => {
    expect(resolveTestRedisDb({})).toBe(1);
  });

  it('accepts an explicit index different from the dev one', () => {
    expect(resolveTestRedisDb({ REDIS_DB: '0', REDIS_TEST_DB: '7' })).toBe(7);
  });

  it('rejects the same index the dev uses', () => {
    expect(() => resolveTestRedisDb({ REDIS_DB: '1' })).toThrow(
      /REDIS_TEST_DB/,
    );
    expect(() =>
      resolveTestRedisDb({ REDIS_DB: '3', REDIS_TEST_DB: '3' }),
    ).toThrow(/REDIS_TEST_DB/);
  });

  it('rejects an index outside 0..15 or not an integer', () => {
    expect(() => resolveTestRedisDb({ REDIS_TEST_DB: '16' })).toThrow();
    expect(() => resolveTestRedisDb({ REDIS_TEST_DB: '1.5' })).toThrow();
    expect(() => resolveTestRedisDb({ REDIS_TEST_DB: 'abc' })).toThrow();
  });
});

describe('resolveTestBucket', () => {
  it('defaults to videos-test', () => {
    expect(resolveTestBucket({ MINIO_BUCKET: 'videos' })).toBe('videos-test');
  });

  it('accepts an explicit bucket ending in -test', () => {
    expect(resolveTestBucket({ MINIO_TEST_BUCKET: 'media-ci-test' })).toBe(
      'media-ci-test',
    );
  });

  it('rejects the dev bucket or a name without the -test suffix', () => {
    expect(() =>
      resolveTestBucket({
        MINIO_BUCKET: 'videos',
        MINIO_TEST_BUCKET: 'videos',
      }),
    ).toThrow(/MINIO_TEST_BUCKET/);
    expect(() =>
      resolveTestBucket({
        MINIO_BUCKET: 'shared-test',
        MINIO_TEST_BUCKET: 'shared-test',
      }),
    ).toThrow(/MINIO_TEST_BUCKET/);
    expect(() =>
      resolveTestBucket({ MINIO_TEST_BUCKET: 'Videos_Test' }),
    ).toThrow();
  });
});
