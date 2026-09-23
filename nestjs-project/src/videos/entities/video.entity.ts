import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Channel } from '../../channels/entities/channel.entity';

export enum VideoStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

// Valores byte-verbatim do TD-10: são os próprios rótulos em pt-BR, com acento.
// O frontend consome essa lista via openapi.json, sem mapa de rótulos separado.
export enum VideoCategory {
  MUSICA = 'Música',
  JOGOS = 'Jogos',
  EDUCACAO = 'Educação',
  ENTRETENIMENTO = 'Entretenimento',
  NOTICIAS = 'Notícias',
  ESPORTES = 'Esportes',
  TECNOLOGIA = 'Tecnologia',
  OUTROS = 'Outros',
}

// Eixo independente de `status` (TD-02). `unlisted` é rotulado como
// "Indisponível" na UI; o valor gravado continua em inglês.
export enum VideoVisibility {
  PUBLIC = 'public',
  UNLISTED = 'unlisted',
}

@Entity('videos')
@Index(['channel_id', 'published_at'])
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  public_id: string;

  @Index()
  @Column({ type: 'uuid' })
  channel_id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index()
  @Column({ type: 'enum', enum: VideoStatus, default: VideoStatus.DRAFT })
  status: VideoStatus;

  @Column({ type: 'varchar', nullable: true })
  upload_id: string | null;

  @Column({ type: 'varchar', nullable: true })
  storage_bucket: string | null;

  @Column({ type: 'varchar', nullable: true })
  storage_key: string | null;

  @Column({ type: 'varchar', nullable: true })
  thumbnail_key: string | null;

  @Column({ type: 'int', nullable: true })
  duration_seconds: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mime_type: string | null;

  @Column({
    type: 'bigint',
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) =>
        value === null ? null : parseInt(value, 10),
    },
  })
  file_size_bytes: number | null;

  @Column({ type: 'text', nullable: true })
  processing_error: string | null;

  @Column({
    type: 'enum',
    enum: VideoCategory,
    default: VideoCategory.OUTROS,
  })
  category: VideoCategory;

  @Column({
    type: 'enum',
    enum: VideoVisibility,
    default: VideoVisibility.PUBLIC,
  })
  visibility: VideoVisibility;

  // Nulo = rascunho. Escrito apenas pela API em nome do dono; o worker nunca
  // toca nesta coluna (TD-02).
  @Column({ type: 'timestamptz', nullable: true })
  published_at: Date | null;

  // Thumbnail enviada pelo dono. Tem precedência sobre `thumbnail_key`, que é
  // gerada pelo worker (TD-04); a API expõe uma única URL já resolvida.
  @Column({ type: 'varchar', nullable: true })
  custom_thumbnail_key: string | null;

  // Contadores desnormalizados (TD-05). Permanecem 0 nesta fase: o incremento
  // é escopo das Fases 05/06.
  @Column({ type: 'int', default: 0 })
  views_count: number;

  @Column({ type: 'int', default: 0 })
  likes_count: number;

  @Column({ type: 'int', default: 0 })
  comments_count: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => Channel, (channel) => channel.videos)
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;
}
