import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Video } from '../../videos/entities/video.entity';

// Profundidade 1 (social-interactions/TD-04): `parent_id` nulo é raiz;
// preenchido é resposta e sempre aponta para uma raiz — o serviço resolve o
// pai para a raiz antes de gravar, porque uma CHECK não alcança outra linha.
// Sem `dislikes_count` (social-interactions/TD-03).
@Entity('comments')
@Index(['video_id', 'parent_id', 'created_at'])
@Index(['parent_id', 'created_at'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  video_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid', nullable: true })
  parent_id: string | null;

  @Column({ type: 'text' })
  body: string;

  // Contador desnormalizado, mantido na mesma transação da reação
  // (social-interactions/TD-02); só o CommentsService o escreve.
  @Column({ type: 'int', default: 0 })
  likes_count: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => Video, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_id' })
  video: Video;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Comment, (comment) => comment.replies, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Comment | null;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];
}
