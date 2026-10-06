import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelsModule } from '../channels/channels.module';
import { ReactionsModule } from '../reactions/reactions.module';
import { VideosModule } from '../videos/videos.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';

// Importa VideosModule, ReactionsModule e ChannelsModule; nenhum deles importa
// este — o grafo de módulos fica sem ciclo (§Data Model do plano da Fase 06).
@Module({
  imports: [
    TypeOrmModule.forFeature([Comment]),
    VideosModule,
    ReactionsModule,
    ChannelsModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
