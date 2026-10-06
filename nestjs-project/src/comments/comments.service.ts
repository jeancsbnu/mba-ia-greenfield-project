import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelsService } from '../channels/channels.service';
import {
  CommentNotFoundException,
  VideoNotFoundException,
} from '../common/exceptions/domain.exception';
import { ReactionStateResponse } from '../reactions/dto/reaction-state-response.dto';
import { likesDelta } from '../reactions/reaction-delta';
import { ReactionType } from '../reactions/reaction-type.enum';
import { ReactionsService } from '../reactions/reactions.service';
import { Video } from '../videos/entities/video.entity';
import { VideosService } from '../videos/videos.service';
import {
  CommentResponse,
  CommentsPage,
  CommentThreadResponse,
  RepliesPage,
} from './dto/comment-response.dto';
import { Comment } from './entities/comment.entity';

/** Respostas pré-carregadas por raiz (social-interactions/TD-05, Option B). */
export const PRELOADED_REPLIES = 3;

interface CommentRow {
  id: string;
  parent_id: string | null;
  body: string;
  created_at: Date;
  likes_count: number;
  author_name: string;
  author_nickname: string;
}

interface ReplyRow extends CommentRow {
  replies_count: string;
}

// Colunas comuns às leituras: o autor é o canal do usuário que comentou
// (channels.user_id é único — um canal por usuário).
const COMMENT_COLUMNS = `
  c.id, c.parent_id, c.body, c.created_at, c.likes_count,
  ch.name AS author_name, ch.nickname AS author_nickname`;

/**
 * Comentários e respostas (social-interactions/TD-04 e TD-05). Dono de
 * `comments.likes_count`; é quem abre a transação de um novo comentário e pede
 * ao `VideosService` — dono da coluna — o delta de `videos.comments_count`.
 */
@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly comments: Repository<Comment>,
    private readonly videosService: VideosService,
    private readonly channelsService: ChannelsService,
    private readonly reactionsService: ReactionsService,
  ) {}

  /**
   * Publica um comentário-raiz ou uma resposta. Profundidade 1: um `parentId`
   * que aponta para uma resposta grava o filho na raiz dela — respostas a
   * respostas nunca existem no banco.
   */
  async create(
    video: Video,
    userId: string,
    body: string,
    parentId?: string,
  ): Promise<CommentResponse> {
    const saved = await this.comments.manager.transaction(async (manager) => {
      let rootId: string | null = null;
      if (parentId) {
        const parent = await manager.findOne(Comment, {
          where: { id: parentId },
          select: { id: true, video_id: true, parent_id: true },
        });
        if (!parent || parent.video_id !== video.id) {
          throw new CommentNotFoundException();
        }
        rootId = parent.parent_id ?? parent.id;
      }

      const comment = await manager.save(
        manager.create(Comment, {
          video_id: video.id,
          user_id: userId,
          parent_id: rootId,
          body,
        }),
      );
      await this.videosService.adjustCommentsCount(manager, video.id, 1);
      return comment;
    });

    const author = await this.channelsService.findByUserId(userId);
    return {
      id: saved.id,
      parentId: saved.parent_id,
      body: saved.body,
      createdAt: saved.created_at,
      likesCount: 0,
      viewerReaction: null,
      author: { name: author?.name ?? '', nickname: author?.nickname ?? '' },
    };
  }

  /**
   * Página de comentários-raiz, mais recentes primeiro, com até 3 respostas
   * por raiz. Número de queries constante por página: raízes, total, respostas
   * de todas as raízes (recortadas por função de janela, com o total de cada
   * thread no mesmo passo) e, com visitante, as reações dele.
   */
  async listThreads(
    videoId: string,
    offset: number,
    limit: number,
    viewerId?: string,
  ): Promise<CommentsPage> {
    const [roots, totalRows] = await Promise.all([
      this.comments.manager.query<CommentRow[]>(
        `SELECT ${COMMENT_COLUMNS}
           FROM comments c JOIN channels ch ON ch.user_id = c.user_id
          WHERE c.video_id = $1 AND c.parent_id IS NULL
          ORDER BY c.created_at DESC, c.id DESC
          OFFSET $2 LIMIT $3`,
        [videoId, offset, limit],
      ),
      this.comments.manager.query<{ count: string }[]>(
        'SELECT COUNT(*) AS count FROM comments WHERE video_id = $1 AND parent_id IS NULL',
        [videoId],
      ),
    ]);

    const replies =
      roots.length === 0
        ? []
        : await this.comments.manager.query<ReplyRow[]>(
            `SELECT * FROM (
               SELECT ${COMMENT_COLUMNS},
                      ROW_NUMBER() OVER (PARTITION BY c.parent_id ORDER BY c.created_at DESC, c.id DESC) AS rn,
                      COUNT(*) OVER (PARTITION BY c.parent_id) AS replies_count
                 FROM comments c JOIN channels ch ON ch.user_id = c.user_id
                WHERE c.parent_id = ANY($1)
             ) r
             WHERE r.rn <= $2
             ORDER BY r.parent_id, r.rn`,
            [roots.map((root) => root.id), PRELOADED_REPLIES],
          );

    const reactions = await this.viewerReactions(
      [...roots, ...replies].map((row) => row.id),
      viewerId,
    );

    const repliesByRoot = new Map<string, ReplyRow[]>();
    for (const reply of replies) {
      const list = repliesByRoot.get(reply.parent_id as string) ?? [];
      list.push(reply);
      repliesByRoot.set(reply.parent_id as string, list);
    }

    const items: CommentThreadResponse[] = roots.map((root) => {
      const threadReplies = repliesByRoot.get(root.id) ?? [];
      return {
        ...toResponse(root, reactions),
        replies: threadReplies.map((reply) => toResponse(reply, reactions)),
        repliesCount:
          threadReplies.length === 0
            ? 0
            : Number(threadReplies[0].replies_count),
      };
    });

    return { items, total: Number(totalRows[0].count), offset, limit };
  }

  /** Respostas de uma raiz, mesma ordenação e paginação das raízes. */
  async listReplies(
    rootId: string,
    offset: number,
    limit: number,
    viewerId?: string,
  ): Promise<RepliesPage> {
    const [rows, totalRows] = await Promise.all([
      this.comments.manager.query<CommentRow[]>(
        `SELECT ${COMMENT_COLUMNS}
           FROM comments c JOIN channels ch ON ch.user_id = c.user_id
          WHERE c.parent_id = $1
          ORDER BY c.created_at DESC, c.id DESC
          OFFSET $2 LIMIT $3`,
        [rootId, offset, limit],
      ),
      this.comments.manager.query<{ count: string }[]>(
        'SELECT COUNT(*) AS count FROM comments WHERE parent_id = $1',
        [rootId],
      ),
    ]);

    const reactions = await this.viewerReactions(
      rows.map((row) => row.id),
      viewerId,
    );

    return {
      items: rows.map((row) => toResponse(row, reactions)),
      total: Number(totalRows[0].count),
      offset,
      limit,
    };
  }

  /**
   * Carrega um comentário (raiz ou resposta) aplicando a regra de rascunho ao
   * vídeo dele: comentário de rascunho de outro canal é tratado como
   * inexistente — o caminho lateral não revela que o vídeo existe.
   */
  async findAccessible(commentId: string, viewerId?: string): Promise<Comment> {
    const comment = await this.comments.findOne({
      where: { id: commentId },
      relations: { video: true },
    });
    if (!comment) {
      throw new CommentNotFoundException();
    }
    try {
      await this.videosService.assertServable(comment.video, viewerId);
    } catch (error) {
      if (error instanceof VideoNotFoundException) {
        throw new CommentNotFoundException();
      }
      throw error;
    }
    return comment;
  }

  /**
   * Registra, troca ou retira (`next = null`) a reação do usuário num
   * comentário ou resposta, mantendo `comments.likes_count` na mesma transação
   * (social-interactions/TD-02). `CommentsService` é o único que escreve
   * `comments.likes_count`.
   */
  async setReaction(
    comment: Comment,
    userId: string,
    next: ReactionType | null,
  ): Promise<ReactionStateResponse> {
    return this.comments.manager.transaction(async (manager) => {
      const previous = await this.reactionsService.applyCommentReaction(
        manager,
        comment.id,
        userId,
        next,
      );
      const delta = likesDelta(previous, next);
      if (delta !== 0) {
        await manager.increment(
          Comment,
          { id: comment.id },
          'likes_count',
          delta,
        );
      }
      const updated = await manager.findOneOrFail(Comment, {
        where: { id: comment.id },
        select: { id: true, likes_count: true },
      });
      return { viewerReaction: next, likesCount: updated.likes_count };
    });
  }

  private async viewerReactions(
    commentIds: string[],
    viewerId?: string,
  ): Promise<Map<string, ReactionType>> {
    if (!viewerId) {
      return new Map();
    }
    return this.reactionsService.findCommentReactions(commentIds, viewerId);
  }
}

function toResponse(
  row: CommentRow,
  reactions: Map<string, ReactionType>,
): CommentResponse {
  return {
    id: row.id,
    parentId: row.parent_id,
    body: row.body,
    createdAt: row.created_at,
    likesCount: Number(row.likes_count),
    viewerReaction: reactions.get(row.id) ?? null,
    author: { name: row.author_name, nickname: row.author_nickname },
  };
}
