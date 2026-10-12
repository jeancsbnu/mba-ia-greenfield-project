import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Video } from '../../videos/entities/video.entity';

@Entity('channels')
// Índices de trigramas da busca (migration CreateVideoFeedAndSearchIndexes);
// declarados só para o diff de schema não os tratar como órfãos.
@Index('channels_name_search_idx', { synchronize: false })
@Index('channels_nickname_search_idx', { synchronize: false })
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  nickname: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', unique: true })
  user_id: string;

  // Contagem de inscritos desnormalizada (social-interactions/TD-06, Option
  // B), mantida na mesma transação da inscrição; só o ChannelsService a escreve.
  @Column({ type: 'int', default: 0 })
  subscribers_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => User, (user) => user.channel)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Video, (video) => video.channel)
  videos: Video[];
}
