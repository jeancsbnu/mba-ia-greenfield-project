import request from 'supertest';
import { Repository } from 'typeorm';
import { Channel } from '../src/channels/entities/channel.entity';
import { cleanAllTables } from '../src/test/create-test-data-source';
import { User } from '../src/users/entities/user.entity';
import {
  Video,
  VideoCategory,
  VideoStatus,
  VideoVisibility,
} from '../src/videos/entities/video.entity';
import { createSocialApp, SocialE2eContext } from './social-e2e.helpers';

interface FeedItem {
  publicId: string;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  viewsCount: number;
  publishedAt: string;
  channel: { nickname: string; name: string };
}

interface FeedPage {
  items: FeedItem[];
  total: number;
}

interface ErrorEnvelope {
  statusCode: number;
  error: string;
  message: unknown;
}

const BASE = Date.UTC(2026, 9, 1, 12, 0, 0);
const HOUR = 3_600_000;

// Spec: nestjs-project/specs/videos-feed.plan.md (SI-07.3)
// Listagem global da home, do filtro por categoria e da busca
// (home-busca/TD-01, TD-03, TD-04, TD-05), no default global de rate limit
// (home-busca/TD-09).
describe('videos-feed', () => {
  let ctx: SocialE2eContext;
  let users: Repository<User>;
  let channels: Repository<Channel>;
  let videos: Repository<Video>;

  const server = () => ctx.app.getHttpServer();
  const getFeed = (query = '') => request(server()).get(`/videos${query}`);

  beforeAll(async () => {
    ctx = await createSocialApp();
    users = ctx.dataSource.getRepository(User);
    channels = ctx.dataSource.getRepository(Channel);
    videos = ctx.dataSource.getRepository(Video);
  }, 30000);

  afterAll(async () => {
    await ctx.app.close();
  });

  let counter = 0;
  let order = 0;

  async function createChannel(name: string, nickname: string) {
    const user = await users.save(
      users.create({
        email: `feed_${++counter}@example.com`,
        password: 'hashed',
      }),
    );
    return channels.save(channels.create({ name, nickname, user_id: user.id }));
  }

  // Cada chamada grava um vídeo uma hora mais antigo que o anterior, então a
  // ordem de criação é a ordem esperada da listagem.
  async function createVideo(
    channel: Channel,
    title: string,
    category: VideoCategory,
    overrides: Partial<Video> = {},
  ): Promise<Video> {
    return videos.save(
      videos.create({
        public_id: `fd${++counter}`,
        channel_id: channel.id,
        title,
        category,
        status: VideoStatus.READY,
        visibility: VideoVisibility.PUBLIC,
        published_at: new Date(BASE - order++ * HOUR),
        duration_seconds: 120,
        storage_bucket: 'videos',
        ...overrides,
      }),
    );
  }

  let joana: Channel;
  let dockerBrasil: Channel;
  let nina: Channel;
  let listable: Video[];
  let unlisted: Video;
  let draft: Video;

  beforeEach(async () => {
    await cleanAllTables(ctx.dataSource);
    ctx.throttlerStorage.storage.clear();
    order = 0;

    joana = await createChannel('Joana Cria', 'joana_cria');
    dockerBrasil = await createChannel('Docker Brasil', 'docker_brasil');
    nina = await createChannel('Tech com Nina', 'tech_com_nina');

    listable = [
      await createVideo(joana, 'Música ao vivo', VideoCategory.MUSICA),
      await createVideo(dockerBrasil, 'Containers 1', VideoCategory.TECNOLOGIA),
      await createVideo(nina, 'Docker na prática', VideoCategory.TECNOLOGIA),
      await createVideo(joana, 'Show acústico', VideoCategory.MUSICA),
      await createVideo(dockerBrasil, 'Containers 2', VideoCategory.TECNOLOGIA),
      await createVideo(joana, 'Aula de frações', VideoCategory.EDUCACAO),
      await createVideo(nina, 'Aula de redes', VideoCategory.EDUCACAO),
      await createVideo(dockerBrasil, 'Containers 3', VideoCategory.TECNOLOGIA),
      await createVideo(joana, 'Aula de história', VideoCategory.EDUCACAO),
      await createVideo(joana, 'Playlist da semana', VideoCategory.MUSICA),
      await createVideo(nina, 'Aula de lógica', VideoCategory.EDUCACAO),
      await createVideo(joana, 'Aula de química', VideoCategory.EDUCACAO),
      await createVideo(nina, 'Aula de física', VideoCategory.EDUCACAO),
      await createVideo(joana, 'Aula de inglês', VideoCategory.EDUCACAO),
    ];
    unlisted = await createVideo(
      joana,
      'Docker escondido',
      VideoCategory.TECNOLOGIA,
      { visibility: VideoVisibility.UNLISTED, published_at: new Date(BASE) },
    );
    draft = await createVideo(
      joana,
      'Docker rascunho',
      VideoCategory.TECNOLOGIA,
      { published_at: null },
    );
  });

  function body(res: request.Response): FeedPage {
    return res.body as FeedPage;
  }

  function titles(res: request.Response): string[] {
    return body(res).items.map((item) => item.title);
  }

  function expectNewestFirst(page: FeedPage): void {
    const times = page.items.map((item) => Date.parse(item.publishedAt));
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeLessThan(times[i - 1]);
    }
  }

  function expectValidationError(res: request.Response): void {
    expect(res.status).toBe(400);
    const envelope = res.body as ErrorEnvelope;
    expect(envelope.statusCode).toBe(400);
    expect(envelope.error).toBe('VALIDATION_ERROR');
    expect(envelope.message).toBeDefined();
  }

  // 1. Listagem, ordenação e filtros

  it('sem-query-devolve-primeira-pagina-por-recencia', async () => {
    const first = await getFeed();

    expect(first.status).toBe(200);
    expect(body(first).items).toHaveLength(12);
    expect(body(first).total).toBe(14);
    expectNewestFirst(body(first));
    expect(body(first).items[0].publicId).toBe(listable[0].public_id);
    expect(body(first).items[0]).toEqual({
      publicId: listable[0].public_id,
      title: 'Música ao vivo',
      thumbnailUrl: null,
      durationSeconds: 120,
      viewsCount: 0,
      publishedAt: listable[0].published_at?.toISOString(),
      channel: { nickname: 'joana_cria', name: 'Joana Cria' },
    });

    const second = await getFeed('?offset=12');

    expect(second.status).toBe(200);
    expect(body(second).items).toHaveLength(2);
    const firstIds = new Set(body(first).items.map((item) => item.publicId));
    for (const item of body(second).items) {
      expect(firstIds.has(item.publicId)).toBe(false);
    }
  });

  it('nunca-lista-unlisted-nem-rascunho', async () => {
    const all = await getFeed('?limit=50');
    const ids = body(all).items.map((item) => item.publicId);

    expect(ids).not.toContain(unlisted.public_id);
    expect(ids).not.toContain(draft.public_id);

    for (const term of ['escondido', 'rascunho']) {
      const res = await getFeed(`?q=${term}`);
      expect(res.status).toBe(200);
      expect(body(res)).toEqual({ items: [], total: 0 });
    }
  });

  it('filtra-por-categoria', async () => {
    const music = await getFeed(`?category=${encodeURIComponent('Música')}`);

    expect(music.status).toBe(200);
    expect(titles(music)).toEqual([
      'Música ao vivo',
      'Show acústico',
      'Playlist da semana',
    ]);
    expect(body(music).total).toBe(3);

    const combined = await getFeed(
      `?category=${encodeURIComponent('Música')}&q=musica`,
    );

    expect(combined.status).toBe(200);
    expect(titles(combined)).toContain('Música ao vivo');
  });

  // 2. Busca por título e canal

  it('busca-casa-titulo-canal-e-nickname', async () => {
    const docker = await getFeed('?q=docker');

    expect(docker.status).toBe(200);
    expect(titles(docker)).toEqual([
      'Containers 1',
      'Docker na prática',
      'Containers 2',
      'Containers 3',
    ]);
    expect(body(docker).total).toBe(4);
    expectNewestFirst(body(docker));

    const upper = await getFeed('?q=MUSICA');
    expect(titles(upper)).toContain('Música ao vivo');

    const nickname = await getFeed('?q=tech_com');
    expect(titles(nickname)).toEqual([
      'Docker na prática',
      'Aula de redes',
      'Aula de lógica',
      'Aula de física',
    ]);
    for (const item of body(nickname).items) {
      expect(item.channel.nickname).toBe(nina.nickname);
    }
  });

  it('curinga-do-like-e-literal', async () => {
    await createVideo(joana, 'aXbYc', VideoCategory.OUTROS);
    await createVideo(joana, 'Desconto de 100% hoje', VideoCategory.OUTROS);
    await createVideo(joana, 'Os 1000 melhores', VideoCategory.OUTROS);

    const underscore = await getFeed('?q=a_b');
    expect(underscore.status).toBe(200);
    expect(titles(underscore)).not.toContain('aXbYc');

    const percent = await getFeed('?q=100%25');
    expect(percent.status).toBe(200);
    expect(titles(percent)).toEqual(['Desconto de 100% hoje']);
  });

  // 3. Validação da query

  it('termo-curto-retorna-400', async () => {
    expectValidationError(await getFeed('?q=ab'));
    expectValidationError(await getFeed('?q=%20%20ab%20'));
    expectValidationError(await getFeed(`?q=${'a'.repeat(101)}`));
  });

  it('categoria-fora-do-enum-retorna-400', async () => {
    expectValidationError(
      await getFeed(`?category=${encodeURIComponent('Culinária')}`),
    );
  });

  it('limit-e-offset-fora-da-faixa-retornam-400', async () => {
    expectValidationError(await getFeed('?limit=51'));
    expectValidationError(await getFeed('?limit=0'));
    expectValidationError(await getFeed('?offset=-1'));
  });

  // 4. Rate limit

  it('default-global-de-120-por-visitante', async () => {
    for (let i = 0; i < 120; i++) {
      const res = await getFeed();
      expect(res.status).toBe(200);
    }

    const blocked = await getFeed();

    expect(blocked.status).toBe(429);
    expect((blocked.body as ErrorEnvelope).error).toBe('RATE_LIMIT_EXCEEDED');
  }, 60000);
});
