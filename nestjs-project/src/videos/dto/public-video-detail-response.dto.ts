import { ApiProperty } from '@nestjs/swagger';
import { VideoCategory, VideoVisibility } from '../entities/video.entity';

/**
 * Canal dono, na forma reduzida que a watch page precisa para creditar o vídeo.
 */
export class PublicVideoChannel {
  @ApiProperty()
  nickname: string;

  @ApiProperty({ description: 'Nome de exibição do canal.' })
  name: string;
}

/**
 * Corpo de resposta de `GET /videos/{publicId}/public`.
 *
 * É deliberadamente uma classe separada de `VideoDetailResponse`: aquela serve
 * o dono e carrega campos de operação; esta serve visitante anônimo. Unificar
 * as duas faria um campo acrescentado no painel do dono vazar na página
 * pública no dia em que alguém o acrescentasse num lugar só.
 */
export class PublicVideoDetailResponse {
  @ApiProperty()
  publicId: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true, type: String })
  description: string | null;

  @ApiProperty({ nullable: true, type: Number })
  durationSeconds: number | null;

  @ApiProperty({ enum: VideoCategory })
  category: VideoCategory;

  @ApiProperty({ enum: VideoVisibility })
  visibility: VideoVisibility;

  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  publishedAt: Date | null;

  @ApiProperty()
  viewsCount: number;

  @ApiProperty({ nullable: true, type: String })
  thumbnailUrl: string | null;

  @ApiProperty({ type: PublicVideoChannel })
  channel: PublicVideoChannel;

  @ApiProperty({
    description:
      'URL pré-assinada de 6 h entregue inline; consumida pelo src do <video>.',
  })
  streamUrl: string;

  @ApiProperty({
    description:
      'URL pré-assinada de 6 h sobre a mesma chave, assinada com content-disposition attachment e filename. Vem junto com a página porque o atributo download do HTML é ignorado cross-origin.',
  })
  downloadUrl: string;
}
