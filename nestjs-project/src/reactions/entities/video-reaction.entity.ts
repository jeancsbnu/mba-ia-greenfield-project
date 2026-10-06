import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Video } from '../../videos/entities/video.entity';
import { REACTION_TYPE_ENUM_NAME, ReactionType } from '../reaction-type.enum';

// Uma reação por usuário por vídeo: a PK composta torna like e dislike
// mutuamente exclusivos por construção (social-interactions/TD-01). Tabela
// dedicada com FK real, para que apagar o vídeo leve as reações junto.
@Entity('video_reactions')
export class VideoReaction {
  @PrimaryColumn({ type: 'uuid' })
  user_id: string;

  @Index()
  @PrimaryColumn({ type: 'uuid' })
  video_id: string;

  @Column({
    type: 'enum',
    enum: ReactionType,
    enumName: REACTION_TYPE_ENUM_NAME,
  })
  type: ReactionType;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Video, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_id' })
  video: Video;
}
