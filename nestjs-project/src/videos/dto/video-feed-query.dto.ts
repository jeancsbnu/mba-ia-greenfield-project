import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { VideoCategory } from '../entities/video.entity';

/**
 * Query da listagem global (home-busca/TD-01): filtros opcionais e
 * combináveis. O mínimo de 3 caracteres do termo vem da Revision de
 * 2026-10-11 de home-busca/TD-04, e a página padrão de 12 da de TD-02. O
 * máximo de 100 é premissa do build: limita o tamanho do padrão do LIKE.
 */
export class VideoFeedQueryDto {
  /** Termo de busca por título, nome do canal ou nickname; aparado nas pontas. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(3, 100)
  q?: string;

  /** Categoria, com o valor do enum como está (sem mapa de slugs). */
  @IsOptional()
  @IsEnum(VideoCategory)
  category?: VideoCategory;

  /** Quantos vídeos pular. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  /** Quantos vídeos retornar. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 12;
}
