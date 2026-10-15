import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { ChannelAvatarController } from './channel-avatar.controller';
import { ChannelAvatarService } from './channel-avatar.service';
import { Channel } from './entities/channel.entity';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';

@Module({
  imports: [TypeOrmModule.forFeature([Channel]), StorageModule],
  controllers: [ChannelsController, ChannelAvatarController],
  providers: [ChannelsService, ChannelAvatarService],
  exports: [TypeOrmModule, ChannelsService],
})
export class ChannelsModule {}
