import * as argon2 from 'argon2';
import { DataSource, EntityManager, In } from 'typeorm';
import { Channel } from '../../channels/entities/channel.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { CommentReaction } from '../../reactions/entities/comment-reaction.entity';
import { VideoReaction } from '../../reactions/entities/video-reaction.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { User } from '../../users/entities/user.entity';
import { Video, VideoStatus } from '../../videos/entities/video.entity';
import {
  SEED_COMMENT_REACTIONS,
  SEED_COMMENTS,
  SEED_PASSWORD,
  SEED_SUBSCRIPTIONS,
  SEED_USERS,
  SEED_VIDEO_REACTIONS,
  SEED_VIDEOS,
} from './dev-seed.data';
import type { MediaRenderer } from './dev-seed-media';

const HOUR_MS = 60 * 60 * 1000;

// O StorageService satisfaz esta interface; o seed só precisa gravar objetos.
export interface SeedStorage {
  putObject(
    bucket: string,
    key: string,
    body: Buffer,
    contentType?: string,
  ): Promise<void>;
}

export interface DevSeedOptions {
  bucket: string;
  renderMedia: MediaRenderer;
  now?: Date;
  log?: (message: string) => void;
}

export type DevSeedResult =
  | { status: 'skipped' }
  | {
      status: 'seeded';
      users: number;
      videos: number;
      comments: number;
      subscriptions: number;
    };

export function seedStorageKey(publicId: string): string {
  return `seed/${publicId}.mp4`;
}

export function seedThumbnailKey(publicId: string): string {
  // Mesmo formato da thumbnail gerada pelo worker: `${storage_key}-thumbnail.jpg`.
  return `${seedStorageKey(publicId)}-thumbnail.jpg`;
}

/**
 * Popula o banco de desenvolvimento com contas, canais, vídeos tocáveis e
 * interações. Não apaga nada: se alguma conta do seed já existe, não faz
 * nada (`skipped`). A mídia sobe antes da transação; as chaves são fixas, então
 * uma execução interrompida só sobrescreve os mesmos objetos na próxima.
 */
export async function seedDevData(
  dataSource: DataSource,
  storage: SeedStorage,
  { bucket, renderMedia, now = new Date(), log = () => {} }: DevSeedOptions,
): Promise<DevSeedResult> {
  const alreadySeeded = await dataSource.getRepository(User).count({
    where: { email: In(SEED_USERS.map((user) => user.email)) },
  });
  if (alreadySeeded > 0) {
    return { status: 'skipped' };
  }

  const fileSizes = new Map<string, number>();
  for (const video of SEED_VIDEOS) {
    log(`Gerando mídia de ${video.publicId}...`);
    const media = await renderMedia(video.media, video.durationSeconds);
    await storage.putObject(
      bucket,
      seedStorageKey(video.publicId),
      media.video,
      'video/mp4',
    );
    await storage.putObject(
      bucket,
      seedThumbnailKey(video.publicId),
      media.thumbnail,
      'image/jpeg',
    );
    fileSizes.set(video.publicId, media.video.length);
  }

  const passwordHash = await argon2.hash(SEED_PASSWORD);
  const hoursAgo = (hours: number): Date =>
    new Date(now.getTime() - hours * HOUR_MS);

  await dataSource.transaction(async (manager) => {
    const userIds = new Map<string, string>();
    const channelIdsByEmail = new Map<string, string>();
    const channelIdsByNickname = new Map<string, string>();
    for (const seedUser of SEED_USERS) {
      const user = await manager.save(
        manager.create(User, {
          email: seedUser.email,
          password: passwordHash,
          is_confirmed: true,
        }),
      );
      const channel = await manager.save(
        manager.create(Channel, { ...seedUser.channel, user_id: user.id }),
      );
      userIds.set(seedUser.email, user.id);
      channelIdsByEmail.set(seedUser.email, channel.id);
      channelIdsByNickname.set(seedUser.channel.nickname, channel.id);
    }

    const videoIds = new Map<string, string>();
    for (const video of SEED_VIDEOS) {
      const publishedAt =
        video.publishedHoursAgo === null
          ? null
          : hoursAgo(video.publishedHoursAgo);
      const saved = await manager.save(
        manager.create(Video, {
          public_id: video.publicId,
          channel_id: lookup(channelIdsByEmail, video.ownerEmail),
          title: video.title,
          description: video.description,
          status: VideoStatus.READY,
          storage_bucket: bucket,
          storage_key: seedStorageKey(video.publicId),
          thumbnail_key: seedThumbnailKey(video.publicId),
          duration_seconds: video.durationSeconds,
          mime_type: 'video/mp4',
          file_size_bytes: lookup(fileSizes, video.publicId),
          category: video.category,
          visibility: video.visibility,
          published_at: publishedAt,
          views_count: video.viewsCount,
          created_at: publishedAt ?? hoursAgo(1),
        }),
      );
      videoIds.set(video.publicId, saved.id);
    }

    await manager.insert(
      Subscription,
      SEED_SUBSCRIPTIONS.map((subscription) => ({
        user_id: lookup(userIds, subscription.userEmail),
        channel_id: lookup(channelIdsByNickname, subscription.channel),
      })),
    );

    await manager.insert(
      VideoReaction,
      SEED_VIDEO_REACTIONS.map((reaction) => ({
        user_id: lookup(userIds, reaction.userEmail),
        video_id: lookup(videoIds, reaction.video),
        type: reaction.type,
      })),
    );

    // Em ordem: SEED_COMMENTS lista cada raiz antes das respostas dela.
    const commentIds = new Map<string, string>();
    for (const comment of SEED_COMMENTS) {
      const saved = await manager.save(
        manager.create(Comment, {
          video_id: lookup(videoIds, comment.video),
          user_id: lookup(userIds, comment.authorEmail),
          parent_id: comment.parent ? lookup(commentIds, comment.parent) : null,
          body: comment.body,
          created_at: hoursAgo(comment.hoursAgo),
        }),
      );
      commentIds.set(comment.key, saved.id);
    }

    await manager.insert(
      CommentReaction,
      SEED_COMMENT_REACTIONS.map((reaction) => ({
        user_id: lookup(userIds, reaction.userEmail),
        comment_id: lookup(commentIds, reaction.comment),
        type: reaction.type,
      })),
    );

    await recomputeCounters(manager, {
      channelIds: [...channelIdsByEmail.values()],
      videoIds: [...videoIds.values()],
      commentIds: [...commentIds.values()],
    });
  });

  return {
    status: 'seeded',
    users: SEED_USERS.length,
    videos: SEED_VIDEOS.length,
    comments: SEED_COMMENTS.length,
    subscriptions: SEED_SUBSCRIPTIONS.length,
  };
}

// Os contadores desnormalizados saem das linhas recém-inseridas, nunca de
// números escritos à mão: assim eles batem com o que a API mantém ao vivo
// (likes contam só `like`; comments_count inclui respostas).
async function recomputeCounters(
  manager: EntityManager,
  ids: { channelIds: string[]; videoIds: string[]; commentIds: string[] },
): Promise<void> {
  await manager.query(
    `UPDATE "channels" c SET "subscribers_count" =
       (SELECT count(*) FROM "subscriptions" s WHERE s."channel_id" = c."id")
     WHERE c."id" = ANY($1::uuid[])`,
    [ids.channelIds],
  );
  await manager.query(
    `UPDATE "videos" v SET
       "likes_count" = (SELECT count(*) FROM "video_reactions" r
                        WHERE r."video_id" = v."id" AND r."type" = 'like'),
       "comments_count" = (SELECT count(*) FROM "comments" cm
                           WHERE cm."video_id" = v."id")
     WHERE v."id" = ANY($1::uuid[])`,
    [ids.videoIds],
  );
  await manager.query(
    `UPDATE "comments" c SET "likes_count" =
       (SELECT count(*) FROM "comment_reactions" r
        WHERE r."comment_id" = c."id" AND r."type" = 'like')
     WHERE c."id" = ANY($1::uuid[])`,
    [ids.commentIds],
  );
}

function lookup<T>(map: Map<string, T>, key: string): T {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(`Seed inconsistente: chave "${key}" não encontrada`);
  }
  return value;
}
