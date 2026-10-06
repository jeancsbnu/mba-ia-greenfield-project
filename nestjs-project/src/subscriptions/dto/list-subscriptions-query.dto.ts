import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Query de `GET /me/subscriptions`. Default de 50 e teto de 100 são premissa
 * do plano da Fase 06: a tela não tem paginação, que fica com a Fase 07.
 */
export class ListSubscriptionsQueryDto {
  /** Quantos canais pular. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  /** Quantos canais retornar (máximo 100). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
