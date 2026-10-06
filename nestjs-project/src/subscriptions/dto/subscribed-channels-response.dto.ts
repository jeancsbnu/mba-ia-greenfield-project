import { ApiProperty } from '@nestjs/swagger';

/** Um canal da área de canais seguidos (social-interactions/TD-07). */
export class SubscribedChannel {
  @ApiProperty()
  name: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty({ description: 'Contagem de inscritos do canal.' })
  subscribersCount: number;

  @ApiProperty({ description: 'Conta apenas vídeos publicados e públicos.' })
  videosCount: number;
}

/** Corpo de `GET /me/subscriptions`, inscrição mais recente primeiro. */
export class SubscribedChannelsPage {
  @ApiProperty({ type: [SubscribedChannel] })
  items: SubscribedChannel[];

  @ApiProperty({ description: 'Total de canais seguidos.' })
  total: number;

  @ApiProperty()
  offset: number;

  @ApiProperty()
  limit: number;
}
