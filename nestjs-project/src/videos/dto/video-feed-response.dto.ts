import { ApiProperty } from '@nestjs/swagger';
import { SuggestedVideoListItem } from './suggested-videos-response.dto';

/**
 * Página da listagem global (home, filtro por categoria e busca). O item
 * reusa `SuggestedVideoListItem`, que já credita o canal (home-busca/TD-01).
 */
export class VideoFeedPage {
  @ApiProperty({ type: [SuggestedVideoListItem] })
  items: SuggestedVideoListItem[];

  @ApiProperty({
    description:
      'Total de vídeos que satisfazem os filtros, ignorando a página.',
  })
  total: number;
}
