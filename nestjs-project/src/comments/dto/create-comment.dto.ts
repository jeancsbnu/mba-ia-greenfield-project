import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Teto do corpo — premissa do plano da Fase 06, ajustável por /decide. */
export const COMMENT_BODY_MAX_LENGTH = 2000;

/**
 * Corpo de `POST /videos/{publicId}/comments`. A mesma rota publica raiz e
 * resposta: o ReplyForm é o NewCommentForm reusado com `parentId` (OQ-12).
 */
export class CreateCommentDto {
  /** Texto do comentário; aparado nas pontas antes de validar. */
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1)
  @MaxLength(COMMENT_BODY_MAX_LENGTH)
  body: string;

  /** Comentário respondido; ausente cria um comentário-raiz. */
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
