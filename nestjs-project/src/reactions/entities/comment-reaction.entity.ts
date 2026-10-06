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
import { Comment } from '../../comments/entities/comment.entity';
import { User } from '../../users/entities/user.entity';
import { REACTION_TYPE_ENUM_NAME, ReactionType } from '../reaction-type.enum';

// Mesmo desenho de `video_reactions`, com FK real para o comentário
// (social-interactions/TD-01): apagar o comentário leva as reações junto.
@Entity('comment_reactions')
export class CommentReaction {
  @PrimaryColumn({ type: 'uuid' })
  user_id: string;

  @Index()
  @PrimaryColumn({ type: 'uuid' })
  comment_id: string;

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

  @ManyToOne(() => Comment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;
}
