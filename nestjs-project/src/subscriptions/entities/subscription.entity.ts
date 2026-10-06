import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Channel } from '../../channels/entities/channel.entity';
import { User } from '../../users/entities/user.entity';

// Uma inscrição por par (usuário, canal) — a PK composta é o que torna o
// PUT idempotente sem desviar `channels.subscribers_count`
// (social-interactions/TD-06). O índice (user_id, created_at) serve a área de
// canais seguidos, inscrição mais recente primeiro.
@Entity('subscriptions')
@Index(['user_id', 'created_at'])
export class Subscription {
  @PrimaryColumn({ type: 'uuid' })
  user_id: string;

  @Index()
  @PrimaryColumn({ type: 'uuid' })
  channel_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Channel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;
}
