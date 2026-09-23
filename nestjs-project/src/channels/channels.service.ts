import { Injectable } from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import {
  ChannelNotFoundException,
  NicknameAlreadyExistsException,
} from '../common/exceptions/domain.exception';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { appendRandomSuffix, sanitizeNickname } from './nickname.util';
import { Channel } from './entities/channel.entity';

const PG_UNIQUE_VIOLATION = '23505';
const NICKNAME_COLUMN = 'nickname';
const MAX_RETRIES = 5;

function isPgUniqueViolationOnColumn(err: unknown, column: string): boolean {
  if (!(err instanceof QueryFailedError)) return false;
  // O TypeORM copia os campos do driver para o próprio erro, mas não os
  // declara. Tipar só o que se lê mantém a checagem honesta — `as any`
  // apagaria o tipo e contaminaria todas as linhas abaixo.
  const e = err as QueryFailedError & { code?: unknown; detail?: unknown };
  return (
    e.code === PG_UNIQUE_VIOLATION &&
    typeof e.detail === 'string' &&
    e.detail.includes(column)
  );
}

@Injectable()
export class ChannelsService {
  constructor(private readonly dataSource: DataSource) {}

  async createChannel(userId: string, email: string): Promise<Channel> {
    const baseNickname = sanitizeNickname(email.split('@')[0]);

    return this.dataSource.transaction(async (manager) => {
      let nickname = baseNickname;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const existing = await manager.findOne(Channel, {
          where: { nickname },
        });
        if (existing) {
          nickname = appendRandomSuffix(baseNickname);
          continue;
        }

        try {
          return await manager.save(
            manager.create(Channel, {
              name: baseNickname,
              nickname,
              user_id: userId,
            }),
          );
        } catch (err) {
          if (isPgUniqueViolationOnColumn(err, NICKNAME_COLUMN)) {
            // Concurrent insert between pre-check and save — retry with new suffix
            nickname = appendRandomSuffix(baseNickname);
          } else {
            throw err;
          }
        }
      }

      throw new Error(
        'Nickname conflict could not be resolved after max retries',
      );
    });
  }

  // Alteração livre de nickname, com unicidade garantida pelo índice único
  // (TD-07). A troca muda a URL pública /@{nickname} (TD-08), o que é esperado.
  async updateChannel(userId: string, dto: UpdateChannelDto): Promise<Channel> {
    const channel = await this.findByUserId(userId);
    if (!channel) {
      throw new ChannelNotFoundException();
    }

    if (dto.nickname !== undefined) {
      channel.nickname = dto.nickname;
    }
    if (dto.name !== undefined) {
      channel.name = dto.name;
    }
    if (dto.description !== undefined) {
      // String vazia significa "sem descrição", não descrição vazia.
      channel.description = dto.description === '' ? null : dto.description;
    }

    try {
      return await this.dataSource.getRepository(Channel).save(channel);
    } catch (err) {
      if (isPgUniqueViolationOnColumn(err, NICKNAME_COLUMN)) {
        throw new NicknameAlreadyExistsException();
      }
      throw err;
    }
  }

  // Resolve a página pública /@{nickname} (TD-08). Nickname inexistente é 404,
  // não lista vazia: o canal simplesmente não existe.
  async findByNicknameOrFail(nickname: string): Promise<Channel> {
    const channel = await this.dataSource
      .getRepository(Channel)
      .findOne({ where: { nickname } });
    if (!channel) {
      throw new ChannelNotFoundException();
    }
    return channel;
  }

  async findByUserId(userId: string): Promise<Channel | null> {
    return this.dataSource
      .getRepository(Channel)
      .findOne({ where: { user_id: userId } });
  }
}
