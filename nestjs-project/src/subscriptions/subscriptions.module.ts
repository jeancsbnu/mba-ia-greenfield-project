import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelsModule } from '../channels/channels.module';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

// Importa só ChannelsModule: VideosModule é que importa este módulo (para o
// estado pessoal das leituras públicas), e o grafo fica sem ciclo.
@Module({
  imports: [TypeOrmModule.forFeature([Subscription]), ChannelsModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
