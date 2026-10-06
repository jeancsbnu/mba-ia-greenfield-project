import { ApiProperty } from '@nestjs/swagger';
import { ReactionType } from '../reaction-type.enum';

/**
 * Resposta das rotas de reação (vídeo e comentário). Não há contagem de
 * dislikes — só o estado do próprio usuário (social-interactions/TD-03).
 */
export class ReactionStateResponse {
  @ApiProperty({
    enum: ReactionType,
    enumName: 'ReactionType',
    nullable: true,
    description: 'Reação do usuário após a operação; null quando não há.',
  })
  viewerReaction: ReactionType | null;

  @ApiProperty({
    description:
      'Contagem de likes do alvo após a operação, lida na mesma transação.',
  })
  likesCount: number;
}
