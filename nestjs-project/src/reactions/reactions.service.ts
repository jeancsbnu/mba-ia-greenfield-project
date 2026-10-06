import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  In,
  Repository,
  type EntityTarget,
  type ObjectLiteral,
} from 'typeorm';
import { CommentReaction } from './entities/comment-reaction.entity';
import { VideoReaction } from './entities/video-reaction.entity';
import { ReactionType } from './reaction-type.enum';

/**
 * Único produtor das tabelas `video_reactions` e `comment_reactions` — a
 * mitigação que o social-interactions/TD-02 exige para o risco que a Option A
 * aceita (escrita fora do serviço). Os contadores NÃO são escritos aqui: cada
 * coluna `likes_count` pertence ao serviço dono da entidade, que abre a
 * transação, chama `apply*` com o mesmo `EntityManager` e aplica o delta.
 */
@Injectable()
export class ReactionsService {
  constructor(
    @InjectRepository(VideoReaction)
    private readonly videoReactions: Repository<VideoReaction>,
    @InjectRepository(CommentReaction)
    private readonly commentReactions: Repository<CommentReaction>,
  ) {}

  /**
   * Grava, troca ou apaga (`next = null`) a reação do usuário no vídeo dentro
   * da transação recebida e devolve a reação anterior.
   */
  async applyVideoReaction(
    manager: EntityManager,
    videoId: string,
    userId: string,
    next: ReactionType | null,
  ): Promise<ReactionType | null> {
    return this.apply(
      manager,
      VideoReaction,
      { user_id: userId, video_id: videoId },
      next,
    );
  }

  /** Mesmo contrato de `applyVideoReaction`, para comentário ou resposta. */
  async applyCommentReaction(
    manager: EntityManager,
    commentId: string,
    userId: string,
    next: ReactionType | null,
  ): Promise<ReactionType | null> {
    return this.apply(
      manager,
      CommentReaction,
      { user_id: userId, comment_id: commentId },
      next,
    );
  }

  async findVideoReaction(
    videoId: string,
    userId: string,
  ): Promise<ReactionType | null> {
    const reaction = await this.videoReactions.findOne({
      where: { user_id: userId, video_id: videoId },
    });
    return reaction?.type ?? null;
  }

  /**
   * Reações do usuário para um conjunto de comentários, numa query só — é o
   * que mantém a listagem de comentários sem N+1 (social-interactions/TD-05).
   * Só os pares com reação entram no mapa.
   */
  async findCommentReactions(
    commentIds: string[],
    userId: string,
  ): Promise<Map<string, ReactionType>> {
    if (commentIds.length === 0) {
      return new Map();
    }
    const rows = await this.commentReactions.find({
      where: { user_id: userId, comment_id: In(commentIds) },
    });
    return new Map(rows.map((row) => [row.comment_id, row.type]));
  }

  private async apply(
    manager: EntityManager,
    target: EntityTarget<ObjectLiteral>,
    key: Record<string, string>,
    next: ReactionType | null,
  ): Promise<ReactionType | null> {
    // FOR UPDATE: a leitura do estado anterior e a escrita ficam na mesma
    // transação e serializadas por linha — o delta é calculado sobre o valor
    // que de fato foi trocado.
    const current = (await manager.findOne(target, {
      where: key,
      lock: { mode: 'pessimistic_write' },
    })) as { type: ReactionType } | null;
    const previous = current?.type ?? null;

    if (next === null) {
      if (current) {
        await manager.delete(target, key);
      }
    } else if (!current) {
      await manager.insert(target, { ...key, type: next });
    } else if (current.type !== next) {
      await manager.update(target, key, { type: next });
    }

    return previous;
  }
}
