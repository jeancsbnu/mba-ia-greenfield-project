import { ApiProperty } from '@nestjs/swagger';

/** Resposta de `PUT` e `DELETE /channels/{nickname}/subscription`. */
export class SubscriptionStateResponse {
  @ApiProperty({ description: 'Se o usuário segue o canal após a operação.' })
  subscribed: boolean;

  @ApiProperty({
    description:
      'Contagem de inscritos do canal após a operação, lida na mesma transação.',
  })
  subscribersCount: number;
}
