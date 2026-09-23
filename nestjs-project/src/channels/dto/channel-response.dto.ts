import { ApiProperty } from '@nestjs/swagger';

/**
 * Corpo de resposta de `GET` e `PATCH /me/channel`.
 *
 * DTO e não schema inline: as duas rotas devolvem a mesma forma, e um schema
 * nomeado carrega `required`, o que um `schema: { properties: {...} }` inline
 * não faz — sem isso todo campo chega ao cliente como opcional.
 */
export class ChannelResponse {
  @ApiProperty()
  name: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty({ nullable: true, type: String })
  description: string | null;
}

/**
 * Corpo de resposta de `GET /channels/{nickname}` — a vitrine pública.
 *
 * Não estende `ChannelResponse` para manter os dois contratos independentes:
 * acrescentar um campo ao canal do dono não deve vazar para a rota anônima.
 */
export class PublicChannelResponse {
  @ApiProperty()
  name: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty({ nullable: true, type: String })
  description: string | null;

  @ApiProperty({
    description: 'Conta apenas vídeos publicados e públicos.',
  })
  videosCount: number;
}
