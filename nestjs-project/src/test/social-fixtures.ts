import { DataSource } from 'typeorm';
import { Channel } from '../channels/entities/channel.entity';
import { User } from '../users/entities/user.entity';
import { Video } from '../videos/entities/video.entity';

// Fixtures mínimos das suítes de integração da Fase 06: usuário com canal e
// vídeo, gravados direto pelo repositório. Cada chamada gera valores únicos
// para não colidir com as restrições `unique` de e-mail, nickname e public_id.
let sequence = 0;

export async function createUserWithChannel(
  dataSource: DataSource,
): Promise<{ user: User; channel: Channel }> {
  const n = ++sequence;
  const user = await dataSource.getRepository(User).save(
    dataSource.getRepository(User).create({
      email: `social_${n}_${Date.now()}@example.com`,
      password: 'hashed',
    }),
  );
  const channel = await dataSource.getRepository(Channel).save(
    dataSource.getRepository(Channel).create({
      name: `Canal ${n}`,
      nickname: `social_${n}_${Date.now() % 100000}`,
      user_id: user.id,
    }),
  );
  return { user, channel };
}

export async function createVideo(
  dataSource: DataSource,
  channelId: string,
  overrides: Partial<Video> = {},
): Promise<Video> {
  const n = ++sequence;
  const repository = dataSource.getRepository(Video);
  return repository.save(
    repository.create({
      public_id: `v${n}${Date.now() % 100000}`.slice(0, 10),
      channel_id: channelId,
      title: `Vídeo ${n}`,
      ...overrides,
    }),
  );
}
