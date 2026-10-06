import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentReaction } from './entities/comment-reaction.entity';
import { VideoReaction } from './entities/video-reaction.entity';
import { ReactionsService } from './reactions.service';

// Não importa nenhum módulo de domínio: VideosModule e CommentsModule é que o
// importam, e o grafo de módulos fica sem ciclo (§Data Model do plano da Fase 06).
@Module({
  imports: [TypeOrmModule.forFeature([VideoReaction, CommentReaction])],
  providers: [ReactionsService],
  exports: [ReactionsService],
})
export class ReactionsModule {}
