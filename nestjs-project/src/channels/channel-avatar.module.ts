import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import storageConfig from '../config/storage.config';
import { StorageModule } from '../storage/storage.module';
import { ChannelAvatarController } from './channel-avatar.controller';
import { ChannelAvatarService } from './channel-avatar.service';
import { Channel } from './entities/channel.entity';

// Foto de perfil num módulo próprio: quem só lê e grava o canal (auth, users,
// inscrições) importa o ChannelsModule sem levar o storage junto.
@Module({
  imports: [
    TypeOrmModule.forFeature([Channel]),
    ConfigModule.forFeature(storageConfig),
    StorageModule,
  ],
  controllers: [ChannelAvatarController],
  providers: [ChannelAvatarService],
})
export class ChannelAvatarModule {}
