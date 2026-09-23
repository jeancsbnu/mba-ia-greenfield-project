import { ApiProperty } from '@nestjs/swagger';
import {
  VideoCategory,
  VideoStatus,
  VideoVisibility,
} from '../entities/video.entity';

/**
 * Corpo de resposta de `GET /videos/{publicId}` e de `PATCH /videos/{publicId}`.
 *
 * Existe como DTO — e não como schema inline no controller — porque as duas
 * rotas devolvem exatamente a mesma forma: duplicar o schema faria a resposta
 * do PATCH divergir da do GET no dia em que alguém acrescentasse um campo só
 * num dos lugares. Os campos são anotados à mão porque um DTO de resposta não
 * tem decorators de `class-validator` para o plugin do Swagger introspectar.
 */
export class VideoDetailResponse {
  @ApiProperty()
  publicId: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true, type: String })
  description: string | null;

  @ApiProperty({ enum: VideoStatus })
  status: VideoStatus;

  @ApiProperty({ nullable: true, type: Number })
  durationSeconds: number | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ enum: VideoCategory })
  category: VideoCategory;

  @ApiProperty({ enum: VideoVisibility })
  visibility: VideoVisibility;

  @ApiProperty({
    format: 'date-time',
    nullable: true,
    type: String,
    description: 'Nulo quando o vídeo ainda é rascunho.',
  })
  publishedAt: Date | null;

  @ApiProperty({
    nullable: true,
    type: String,
    description:
      'URL única já resolvida: a thumbnail customizada quando existe, senão a gerada pelo worker.',
  })
  thumbnailUrl: string | null;
}
