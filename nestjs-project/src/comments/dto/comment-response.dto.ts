import { ApiProperty } from '@nestjs/swagger';
import { ReactionType } from '../../reactions/reaction-type.enum';

/** Identidade pública de quem comentou: o canal do usuário. */
export class CommentAuthor {
  @ApiProperty({ description: 'Nome de exibição do canal de quem comentou.' })
  name: string;

  @ApiProperty()
  nickname: string;
}

/**
 * Um comentário ou resposta. Sem contagem de dislikes — só o estado do próprio
 * visitante (social-interactions/TD-03).
 */
export class CommentResponse {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    format: 'uuid',
    nullable: true,
    type: String,
    description:
      'Nulo para comentário-raiz; o id da raiz para resposta (profundidade 1).',
  })
  parentId: string | null;

  @ApiProperty()
  body: string;

  @ApiProperty({ format: 'date-time', type: String })
  createdAt: Date;

  @ApiProperty()
  likesCount: number;

  @ApiProperty({
    enum: ReactionType,
    enumName: 'ReactionType',
    nullable: true,
    description: 'Reação de quem pede; null para o visitante anônimo.',
  })
  viewerReaction: ReactionType | null;

  @ApiProperty({ type: CommentAuthor })
  author: CommentAuthor;
}

/** Comentário-raiz com até 3 respostas pré-carregadas (social-interactions/TD-05). */
export class CommentThreadResponse extends CommentResponse {
  @ApiProperty({
    type: [CommentResponse],
    description: 'Até 3 respostas, das mais recentes para as mais antigas.',
  })
  replies: CommentResponse[];

  @ApiProperty({ description: 'Total de respostas da thread.' })
  repliesCount: number;
}

/** Corpo de `GET /videos/{publicId}/comments`. */
export class CommentsPage {
  @ApiProperty({ type: [CommentThreadResponse] })
  items: CommentThreadResponse[];

  @ApiProperty({ description: 'Total de comentários-raiz do vídeo.' })
  total: number;

  @ApiProperty()
  offset: number;

  @ApiProperty()
  limit: number;
}

/** Corpo de `GET /comments/{commentId}/replies`. */
export class RepliesPage {
  @ApiProperty({ type: [CommentResponse] })
  items: CommentResponse[];

  @ApiProperty({ description: 'Total de respostas da raiz.' })
  total: number;

  @ApiProperty()
  offset: number;

  @ApiProperty()
  limit: number;
}
