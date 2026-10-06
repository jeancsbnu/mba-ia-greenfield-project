import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Query de `GET /comments/{commentId}/replies`. O default de 10 respostas
 * é premissa do plano da Fase 06 (o TD-05 fixa só as 3 pré-carregadas). Os valores chegam da query string como
 * texto, daí o `@Type(() => Number)`.
 */
export class ListRepliesQueryDto {
  /** Quantas respostas pular — o cliente começa em 3, depois das pré-carregadas. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  /** Quantas respostas retornar. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
