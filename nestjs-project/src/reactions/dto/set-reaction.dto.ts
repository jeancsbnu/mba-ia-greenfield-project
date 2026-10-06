import { IsEnum } from 'class-validator';
import { ReactionType } from '../reaction-type.enum';

/** Corpo de `PUT /videos/{publicId}/reaction` e `PUT /comments/{commentId}/reaction`. */
export class SetReactionDto {
  /** Reação do usuário: like ou dislike. */
  @IsEnum(ReactionType)
  type: ReactionType;
}
