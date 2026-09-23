import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// Paginação offset/limit com total (TD-06). Os valores chegam da query string,
// portanto como texto — daí o @Type(() => Number).
export class ListVideosQueryDto {
  /** Quantos vídeos pular. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  /** Quantos vídeos retornar (máximo 50). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

// A página pública mostra uma grade 4×2, então o padrão é 8 (TD-06, revisão
// 2026-09-20). O teto de 50 é o mesmo da listagem do painel.
export class ListPublicVideosQueryDto {
  /** Quantos vídeos pular. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  /** Quantos vídeos retornar (máximo 50). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 8;
}
