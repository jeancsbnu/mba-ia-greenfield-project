import { ApiProperty } from '@nestjs/swagger';
import { PublicVideoChannel } from './public-video-detail-response.dto';

/**
 * Item da sidebar de sugestões.
 *
 * Difere de `PublicVideoListItem` por carregar o canal: a vitrine pública
 * já está dentro de um canal e não precisa repeti-lo, enquanto a sidebar
 * mistura canais e precisa creditar cada sugestão.
 */
export class SuggestedVideoListItem {
  @ApiProperty()
  publicId: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true, type: String })
  thumbnailUrl: string | null;

  @ApiProperty({ nullable: true, type: Number })
  durationSeconds: number | null;

  @ApiProperty()
  viewsCount: number;

  @ApiProperty({ format: 'date-time' })
  publishedAt: Date;

  @ApiProperty({ type: PublicVideoChannel })
  channel: PublicVideoChannel;
}

/**
 * Página de sugestões. Sem `offset`/`limit` no corpo, ao contrário das outras
 * páginas do projeto: o contrato desta rota pede só `items` e `total`, que é
 * o bastante para o controle "ver mais" saber quando parar.
 */
export class SuggestedVideosPage {
  @ApiProperty({ type: [SuggestedVideoListItem] })
  items: SuggestedVideoListItem[];

  @ApiProperty({
    description: 'Total de sugestões elegíveis, ignorando a página.',
  })
  total: number;
}
