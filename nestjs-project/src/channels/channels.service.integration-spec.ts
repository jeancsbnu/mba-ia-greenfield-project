import { DataSource, Repository } from 'typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { VerificationToken } from '../auth/entities/verification-token.entity';
import {
  cleanAllTables,
  createTestDataSource,
} from '../test/create-test-data-source';
import { User } from '../users/entities/user.entity';
import { NicknameAlreadyExistsException } from '../common/exceptions/domain.exception';
import { ChannelsService } from './channels.service';
import { Channel } from './entities/channel.entity';
import { Video } from '../videos/entities/video.entity';

const ALL_ENTITIES = [User, Channel, RefreshToken, VerificationToken, Video];

describe('ChannelsService (integration)', () => {
  let dataSource: DataSource;
  let channelsService: ChannelsService;
  let userRepository: Repository<User>;
  let channelRepository: Repository<Channel>;

  beforeAll(async () => {
    dataSource = createTestDataSource(ALL_ENTITIES);
    await dataSource.initialize();
    userRepository = dataSource.getRepository(User);
    channelRepository = dataSource.getRepository(Channel);
    channelsService = new ChannelsService(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await cleanAllTables(dataSource);
  });

  let userCounter = 0;
  async function createUser(): Promise<User> {
    return userRepository.save(
      userRepository.create({
        email: `ch_svc_${++userCounter}@example.com`,
        password: 'hashed',
      }),
    );
  }

  describe('createChannel', () => {
    it('persists a channel derived from email', async () => {
      const user = await createUser();

      const channel = await channelsService.createChannel(
        user.id,
        'mynick@example.com',
      );

      expect(channel.id).toBeDefined();
      expect(channel.nickname).toBe('mynick');
      expect(channel.name).toBe('mynick');
      expect(channel.user_id).toBe(user.id);

      const persisted = await channelRepository.findOneBy({ user_id: user.id });
      expect(persisted).not.toBeNull();
      expect(persisted!.nickname).toBe('mynick');
    });

    it('derives nickname from email prefix', async () => {
      const user = await createUser();

      const channel = await channelsService.createChannel(
        user.id,
        'John.Doe+tag@example.com',
      );

      expect(channel.nickname).toBe('johndoetag');
    });

    it('resolves nickname collision by appending a suffix', async () => {
      const user1 = await createUser();
      const user2 = await createUser();

      await channelsService.createChannel(user1.id, 'shared@example.com');
      const channel2 = await channelsService.createChannel(
        user2.id,
        'shared@example.com',
      );

      expect(channel2.nickname).toMatch(/^shared_[a-z0-9]{3}$/);

      const channels = await channelRepository.find();
      expect(channels).toHaveLength(2);
    });
  });

  describe('updateChannel', () => {
    it('persists nickname, name and description', async () => {
      const user = await createUser();
      await channelsService.createChannel(user.id, 'joana@example.com');

      const updated = await channelsService.updateChannel(user.id, {
        nickname: 'joana_nova',
        name: 'Joana Nova',
        description: 'Vídeos de culinária',
      });

      expect(updated.nickname).toBe('joana_nova');

      const stored = await channelRepository.findOneByOrFail({
        user_id: user.id,
      });
      expect(stored.nickname).toBe('joana_nova');
      expect(stored.name).toBe('Joana Nova');
      expect(stored.description).toBe('Vídeos de culinária');
    });

    it('persists an empty description as null', async () => {
      const user = await createUser();
      await channelsService.createChannel(user.id, 'joana@example.com');
      await channelsService.updateChannel(user.id, {
        description: 'Tinha descrição',
      });

      await channelsService.updateChannel(user.id, { description: '' });

      const stored = await channelRepository.findOneByOrFail({
        user_id: user.id,
      });
      expect(stored.description).toBeNull();
    });

    it('rejects a nickname that already belongs to another channel', async () => {
      const first = await createUser();
      const second = await createUser();
      const firstChannel = await channelsService.createChannel(
        first.id,
        'primeiro@example.com',
      );
      await channelsService.createChannel(second.id, 'segundo@example.com');

      // O índice único da coluna é quem barra: a checagem é do banco, não do código.
      await expect(
        channelsService.updateChannel(second.id, {
          nickname: firstChannel.nickname,
        }),
      ).rejects.toBeInstanceOf(NicknameAlreadyExistsException);

      const stored = await channelRepository.findOneByOrFail({
        user_id: second.id,
      });
      expect(stored.nickname).not.toBe(firstChannel.nickname);
    });

    it('allows saving the same nickname the channel already has', async () => {
      const user = await createUser();
      const channel = await channelsService.createChannel(
        user.id,
        'joana@example.com',
      );

      const updated = await channelsService.updateChannel(user.id, {
        nickname: channel.nickname,
        name: 'Outro nome',
      });

      expect(updated.nickname).toBe(channel.nickname);
      expect(updated.name).toBe('Outro nome');
    });
  });
});
