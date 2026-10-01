import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

/**
 * Query da sidebar de sugestões. O default de 4 vem de
 * `video-watch-page/TD-04` (Revisions de 2026-09-26): 4 por página, com
 * "ver mais" carregando as próximas. Os valores chegam da query string como
 * texto, daí o `@Type(() => Number)`.
 */
export class SuggestionsQueryDto {
  /** Quantas sugestões pular. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  /** Quantas sugestões retornar. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 4;
}
