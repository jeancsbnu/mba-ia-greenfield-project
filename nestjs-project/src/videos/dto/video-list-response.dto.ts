import { ApiProperty } from '@nestjs/swagger';
import {
  VideoCategory,
  VideoStatus,
  VideoVisibility,
} from '../entities/video.entity';

/**
 * Item da listagem do painel do dono (`GET /me/videos`).
 *
 * Carrega status, visibilidade e contadores porque o painel precisa deles para
 * montar as colunas; a vitrine pública usa um item mais enxuto.
 */
export class OwnerVideoListItem {
  @ApiProperty()
  publicId: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true, type: Number })
  durationSeconds: number | null;

  @ApiProperty({ nullable: true, type: String })
  thumbnailUrl: string | null;

  @ApiProperty({ enum: VideoStatus })
  status: VideoStatus;

  @ApiProperty({ enum: VideoVisibility })
  visibility: VideoVisibility;

  @ApiProperty({
    format: 'date-time',
    nullable: true,
    type: String,
    description: 'Nulo quando o vídeo ainda é rascunho.',
  })
  publishedAt: Date | null;

  @ApiProperty({ enum: VideoCategory })
  category: VideoCategory;

  @ApiProperty()
  viewsCount: number;

  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  commentsCount: number;
}

/** Página do painel do dono: rascunhos incluídos, do mais recente ao mais antigo. */
export class OwnerVideosPage {
  @ApiProperty({ type: [OwnerVideoListItem] })
  items: OwnerVideoListItem[];

  @ApiProperty({ description: 'Total de vídeos do canal, ignorando a página.' })
  total: number;

  @ApiProperty()
  offset: number;

  @ApiProperty()
  limit: number;
}

/**
 * Item da vitrine pública (`GET /channels/{nickname}/videos`).
 *
 * Sem `status` nem `visibility`: a rota só devolve vídeos publicados e
 * públicos, então esses campos seriam constantes — e expor `visibility` ao
 * anônimo não tem uso legítimo.
 */
export class PublicVideoListItem {
  @ApiProperty()
  publicId: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true, type: Number })
  durationSeconds: number | null;

  @ApiProperty({ nullable: true, type: String })
  thumbnailUrl: string | null;

  @ApiProperty()
  viewsCount: number;

  @ApiProperty({ format: 'date-time' })
  publishedAt: Date;
}

/** Página da vitrine pública: só publicados e públicos, mais recentes primeiro. */
export class PublicVideosPage {
  @ApiProperty({ type: [PublicVideoListItem] })
  items: PublicVideoListItem[];

  @ApiProperty({
    description: 'Total de vídeos publicados e públicos, ignorando a página.',
  })
  total: number;

  @ApiProperty()
  offset: number;

  @ApiProperty()
  limit: number;
}
