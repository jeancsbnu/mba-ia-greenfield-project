import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelsModule } from '../channels/channels.module';
import { QueueModule } from '../queue/queue.module';
import { ReactionsModule } from '../reactions/reactions.module';
import { StorageModule } from '../storage/storage.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { Video } from './entities/video.entity';
import { VideoProcessingProducer } from './video-processing.producer';
import { ChannelVideosController } from './channel-videos.controller';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video]),
    StorageModule,
    QueueModule,
    ChannelsModule,
    ReactionsModule,
    SubscriptionsModule,
  ],
  controllers: [VideosController, ChannelVideosController],
  providers: [VideoProcessingProducer, VideosService],
  exports: [TypeOrmModule, VideoProcessingProducer, VideosService],
})
export class VideosModule {}
