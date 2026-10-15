import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { DataSource } from 'typeorm';
import {
  AvatarNotFoundException,
  ChannelNotFoundException,
} from '../common/exceptions/domain.exception';
import storageConfig from '../config/storage.config';
import { StorageService } from '../storage/storage.service';
import { Channel } from './entities/channel.entity';

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_MIME = /^image\/(jpeg|png|webp)$/;

/**
 * Foto de perfil do canal. Separado do ChannelsService para não puxar o
 * storage para quem só lê e grava o canal.
 */
@Injectable()
export class ChannelAvatarService {
  private readonly logger = new Logger(ChannelAvatarService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly storageService: StorageService,
    @Inject(storageConfig.KEY)
    private readonly storageCfg: ConfigType<typeof storageConfig>,
  ) {}

  /** Grava a foto nova e só então apaga a anterior. */
  async setAvatar(userId: string, file: Express.Multer.File): Promise<void> {
    const channel = await this.findOwnChannel(userId);
    const extension = file.mimetype.split('/')[1];
    // Chave nova a cada envio: a URL assinada muda junto com a foto.
    const key = `avatars/${channel.id}-${Date.now()}.${extension}`;

    await this.storageService.putObject(
      this.storageCfg.minioBucket,
      key,
      file.buffer,
      file.mimetype,
    );

    const previous = channel.avatar_key;
    channel.avatar_key = key;
    await this.dataSource.getRepository(Channel).save(channel);
    if (previous) {
      await this.deleteQuietly(previous);
    }
  }

  async removeAvatar(userId: string): Promise<void> {
    const channel = await this.findOwnChannel(userId);
    const previous = channel.avatar_key;
    if (!previous) {
      return;
    }
    channel.avatar_key = null;
    await this.dataSource.getRepository(Channel).save(channel);
    await this.deleteQuietly(previous);
  }

  /** URL assinada da foto do canal; 404 se o canal não existe ou não tem foto. */
  async getAvatarUrl(nickname: string): Promise<string> {
    const channel = await this.dataSource
      .getRepository(Channel)
      .findOne({ where: { nickname } });
    if (!channel) {
      throw new ChannelNotFoundException();
    }
    if (!channel.avatar_key) {
      throw new AvatarNotFoundException();
    }
    return this.storageService.getPresignedUrl(
      this.storageCfg.minioBucket,
      channel.avatar_key,
    );
  }

  private async findOwnChannel(userId: string): Promise<Channel> {
    const channel = await this.dataSource
      .getRepository(Channel)
      .findOne({ where: { user_id: userId } });
    if (!channel) {
      throw new ChannelNotFoundException();
    }
    return channel;
  }

  // A foto antiga já não é referenciada: falhar ao apagá-la só deixa lixo no
  // bucket, não pode desfazer a troca que o usuário pediu.
  private async deleteQuietly(key: string): Promise<void> {
    try {
      await this.storageService.deleteObject(this.storageCfg.minioBucket, key);
    } catch (err) {
      this.logger.warn(`Could not delete old avatar ${key}: ${String(err)}`);
    }
  }
}
