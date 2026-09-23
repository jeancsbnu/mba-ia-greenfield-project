import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { VideoCategory, VideoVisibility } from '../entities/video.entity';

// Todos os campos chegam como partes de um multipart/form-data, portanto como
// string — daí os @Transform. Todos são opcionais; o controller rejeita o corpo
// que não traz nenhum campo nem arquivo.
export class UpdateVideoDto {
  /** Título exibido do vídeo. */
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  /** Descrição do vídeo. String vazia grava null. */
  @IsOptional()
  @IsString()
  description?: string;

  /** Categoria entre as disponíveis na plataforma. */
  @IsOptional()
  @IsEnum(VideoCategory)
  category?: VideoCategory;

  /** Público (aparece para todos) ou unlisted (somente via link). */
  @IsOptional()
  @IsEnum(VideoVisibility)
  visibility?: VideoVisibility;

  /** true publica (exige status ready); false despublica, sem restrição de status. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  published?: boolean;
}
