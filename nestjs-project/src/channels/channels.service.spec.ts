import { DataSource, EntityManager, QueryFailedError } from 'typeorm';
import {
  ChannelNotFoundException,
  NicknameAlreadyExistsException,
} from '../common/exceptions/domain.exception';
import { ChannelsService } from './channels.service';
import { Channel } from './entities/channel.entity';

/** Dublê do EntityManager com apenas os métodos que o serviço usa. */
type MockManager = Record<string, jest.Mock>;

function makeManager(overrides: MockManager = {}): MockManager {
  return {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    ...overrides,
  };
}

function makeChannel(nickname: string): Channel {
  const c = new Channel();
  c.id = 'uuid';
  c.nickname = nickname;
  c.name = nickname;
  c.user_id = 'user-id';
  c.description = null;
  c.created_at = new Date();
  c.updated_at = new Date();
  return c;
}

function makeUniqueError(): QueryFailedError {
  // O TypeORM copia os campos do driver para o erro sem declará-los; tipar
  // só os que o serviço lê mantém a checagem de pé.
  const err = new QueryFailedError(
    'INSERT',
    [],
    new Error(),
  ) as QueryFailedError & { code: string; detail: string };
  err.code = '23505';
  err.detail = 'Key (nickname)=(abc) already exists.';
  return err;
}

// O serviço só chama `transaction`; o cast é feito uma vez aqui, e não em
// cada teste, para que os acessos ao dublê sigam checados.
function makeDataSource(manager: MockManager): DataSource {
  return {
    transaction: jest.fn((cb: (manager: EntityManager) => Promise<unknown>) =>
      cb(manager as unknown as EntityManager),
    ),
  } as unknown as DataSource;
}

describe('ChannelsService', () => {
  describe('createChannel', () => {
    it('derives nickname from email prefix and saves when no collision', async () => {
      const channel = makeChannel('test');
      const manager = makeManager({
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue(channel),
        save: jest.fn().mockResolvedValue(channel),
      });
      const service = new ChannelsService(makeDataSource(manager));

      const result = await service.createChannel('user-id', 'test@example.com');

      expect(manager.findOne).toHaveBeenCalledWith(Channel, {
        where: { nickname: 'test' },
      });
      expect(manager.save).toHaveBeenCalledTimes(1);
      expect(result.nickname).toBe('test');
    });

    it('retries with suffix when pre-check finds existing nickname', async () => {
      const colliding = makeChannel('john');
      const resolved = makeChannel('john_abc');
      const manager = makeManager({
        findOne: jest
          .fn()
          .mockResolvedValueOnce(colliding)
          .mockResolvedValueOnce(null),
        create: jest.fn().mockReturnValue(resolved),
        save: jest.fn().mockResolvedValue(resolved),
      });
      const service = new ChannelsService(makeDataSource(manager));

      const result = await service.createChannel('user-id', 'john@example.com');

      expect(manager.findOne).toHaveBeenCalledTimes(2);
      expect(manager.save).toHaveBeenCalledTimes(1);
      expect(result.nickname).toMatch(/^john_[a-z0-9]{3}$/);
    });

    it('retries with suffix on concurrent unique constraint violation', async () => {
      const resolved = makeChannel('alice_abc');
      const manager = makeManager({
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null),
        create: jest.fn().mockReturnValue(resolved),
        save: jest
          .fn()
          .mockRejectedValueOnce(makeUniqueError())
          .mockResolvedValueOnce(resolved),
      });
      const service = new ChannelsService(makeDataSource(manager));

      const result = await service.createChannel(
        'user-id',
        'alice@example.com',
      );

      expect(manager.save).toHaveBeenCalledTimes(2);
      expect(result.nickname).toMatch(/^alice/);
    });

    it('throws after exhausting max retries', async () => {
      const existing = makeChannel('bob');
      const manager = makeManager({
        findOne: jest.fn().mockResolvedValue(existing),
        create: jest.fn(),
        save: jest.fn(),
      });
      const service = new ChannelsService(makeDataSource(manager));

      await expect(
        service.createChannel('user-id', 'bob@example.com'),
      ).rejects.toThrow(
        'Nickname conflict could not be resolved after max retries',
      );
    });

    it('re-throws non-unique-constraint errors immediately', async () => {
      const unexpectedError = new Error('Connection lost');
      const channel = makeChannel('carol');
      const manager = makeManager({
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue(channel),
        save: jest.fn().mockRejectedValue(unexpectedError),
      });
      const service = new ChannelsService(makeDataSource(manager));

      await expect(
        service.createChannel('user-id', 'carol@example.com'),
      ).rejects.toThrow('Connection lost');
      expect(manager.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateChannel', () => {
    function makeServiceWith(channel: Channel | null, save: jest.Mock) {
      const repository = {
        findOne: jest.fn().mockResolvedValue(channel),
        save,
      };
      const dataSource = {
        getRepository: jest.fn().mockReturnValue(repository),
        transaction: jest.fn(),
      } as unknown as DataSource;
      return {
        service: new ChannelsService(dataSource),
        repository,
      };
    }

    it('applies only the fields that were sent', async () => {
      const channel = makeChannel('joana_cria');
      channel.name = 'Joana Cria';
      const save = jest.fn((c: Channel) => Promise.resolve(c));
      const { service } = makeServiceWith(channel, save);

      const updated = await service.updateChannel('user-id', {
        name: 'Joana Nova',
      });

      expect(updated.name).toBe('Joana Nova');
      expect(updated.nickname).toBe('joana_cria');
    });

    it('stores an empty description as null', async () => {
      const channel = makeChannel('joana_cria');
      channel.description = 'Tinha descrição';
      const save = jest.fn((c: Channel) => Promise.resolve(c));
      const { service } = makeServiceWith(channel, save);

      const updated = await service.updateChannel('user-id', {
        description: '',
      });

      expect(updated.description).toBeNull();
    });

    it('maps the unique violation on nickname to NicknameAlreadyExistsException', async () => {
      const channel = makeChannel('joana_cria');
      const save = jest.fn().mockRejectedValue(makeUniqueError());
      const { service } = makeServiceWith(channel, save);

      await expect(
        service.updateChannel('user-id', { nickname: 'ja_existe' }),
      ).rejects.toBeInstanceOf(NicknameAlreadyExistsException);
    });

    it('re-throws errors that are not a nickname unique violation', async () => {
      const channel = makeChannel('joana_cria');
      const boom = new Error('connection lost');
      const save = jest.fn().mockRejectedValue(boom);
      const { service } = makeServiceWith(channel, save);

      await expect(
        service.updateChannel('user-id', { name: 'Qualquer' }),
      ).rejects.toBe(boom);
    });

    it('throws ChannelNotFoundException when the user has no channel', async () => {
      const { service } = makeServiceWith(null, jest.fn());

      await expect(
        service.updateChannel('user-id', { name: 'Qualquer' }),
      ).rejects.toBeInstanceOf(ChannelNotFoundException);
    });
  });

  describe('findByNicknameOrFail', () => {
    it('returns the channel when the nickname exists', async () => {
      const channel = makeChannel('joana_cria');
      const repository = { findOne: jest.fn().mockResolvedValue(channel) };
      const dataSource = {
        getRepository: jest.fn().mockReturnValue(repository),
      } as unknown as DataSource;
      const service = new ChannelsService(dataSource);

      await expect(service.findByNicknameOrFail('joana_cria')).resolves.toBe(
        channel,
      );
    });

    it('throws ChannelNotFoundException when the nickname does not exist', async () => {
      const repository = { findOne: jest.fn().mockResolvedValue(null) };
      const dataSource = {
        getRepository: jest.fn().mockReturnValue(repository),
      } as unknown as DataSource;
      const service = new ChannelsService(dataSource);

      await expect(
        service.findByNicknameOrFail('nao_existe'),
      ).rejects.toBeInstanceOf(ChannelNotFoundException);
    });
  });
});
