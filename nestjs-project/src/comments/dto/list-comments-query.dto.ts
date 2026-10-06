import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Query de `GET /videos/{publicId}/comments`. O default de 10 raízes por página
 * vem de `social-interactions/TD-05`. Os valores chegam da query string como
 * texto, daí o `@Type(() => Number)`.
 */
export class ListCommentsQueryDto {
  /** Quantos comentários-raiz pular. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  /** Quantos comentários-raiz retornar. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
