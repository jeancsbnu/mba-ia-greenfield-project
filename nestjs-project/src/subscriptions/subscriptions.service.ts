import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChannelsService } from '../channels/channels.service';
import { Channel } from '../channels/entities/channel.entity';
import { Subscription } from './entities/subscription.entity';

export interface SubscriptionState {
  subscribed: boolean;
  subscribersCount: number;
}

export interface SubscribedChannelsResult {
  items: Channel[];
  total: number;
}

/**
 * Seguir e deixar de seguir canais (social-interactions/TD-06). É o dono do
 * evento: abre a transação, cria ou apaga a inscrição e pede ao
 * `ChannelsService` — dono da coluna — o delta de `subscribers_count`. As duas
 * operações são idempotentes: repetir não desvia o contador.
 */
@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly channelsService: ChannelsService,
  ) {}

  async subscribe(
    userId: string,
    channel: Channel,
  ): Promise<SubscriptionState> {
    return this.dataSource.transaction(async (manager) => {
      // ON CONFLICT DO NOTHING: uma inscrição já existente não falha nem soma
      // — o RETURNING vazio é o sinal de que nada foi criado.
      const result = await manager
        .createQueryBuilder()
        .insert()
        .into(Subscription)
        .values({ user_id: userId, channel_id: channel.id })
        .orIgnore()
        .returning(['user_id'])
        .execute();
      const created = (result.raw as unknown[]).length;

      await this.channelsService.adjustSubscribersCount(
        manager,
        channel.id,
        created,
      );

      return {
        subscribed: true,
        subscribersCount: await this.channelsService.readSubscribersCount(
          manager,
          channel.id,
        ),
      };
    });
  }

  async unsubscribe(
    userId: string,
    channel: Channel,
  ): Promise<SubscriptionState> {
    return this.dataSource.transaction(async (manager) => {
      const result = await manager.delete(Subscription, {
        user_id: userId,
        channel_id: channel.id,
      });

      await this.channelsService.adjustSubscribersCount(
        manager,
        channel.id,
        -(result.affected ?? 0),
      );

      return {
        subscribed: false,
        subscribersCount: await this.channelsService.readSubscribersCount(
          manager,
          channel.id,
        ),
      };
    });
  }

  async isSubscribed(userId: string, channelId: string): Promise<boolean> {
    return this.dataSource
      .getRepository(Subscription)
      .exists({ where: { user_id: userId, channel_id: channelId } });
  }

  /**
   * Canais que o usuário segue, inscrição mais recente primeiro — a leitura da
   * área de canais seguidos (social-interactions/TD-07).
   */
  async listByUser(
    userId: string,
    offset: number,
    limit: number,
  ): Promise<SubscribedChannelsResult> {
    const [subscriptions, total] = await this.dataSource
      .getRepository(Subscription)
      .findAndCount({
        where: { user_id: userId },
        relations: { channel: true },
        order: { created_at: 'DESC' },
        skip: offset,
        take: limit,
      });

    return { items: subscriptions.map((s) => s.channel), total };
  }
}
