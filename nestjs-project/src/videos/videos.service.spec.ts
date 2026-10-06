import { Test } from '@nestjs/testing';
import {
  VideoNotFoundException,
  VideoNotPublishableException,
} from '../common/exceptions/domain.exception';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelsService } from '../channels/channels.service';
import { StorageService } from '../storage/storage.service';
import { Video, VideoCategory, VideoStatus } from './entities/video.entity';
import { ReactionsService } from '../reactions/reactions.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { VideosService } from './videos.service';
import { PLAYBACK_URL_TTL_SECONDS } from './videos.constants';

describe('VideosService (unit)', () => {
  let service: VideosService;
  let getPresignedUrl: jest.Mock;
  let putObject: jest.Mock;
  let save: jest.Mock;
  let findByUserId: jest.Mock;
  let findByIdOrFail: jest.Mock;
  let findVideoReaction: jest.Mock;
  let isSubscribed: jest.Mock;

  beforeEach(async () => {
    getPresignedUrl = jest.fn().mockResolvedValue('https://signed.example/url');
    putObject = jest.fn().mockResolvedValue(undefined);
    // save devolve o próprio objeto, como o TypeORM faz.
    save = jest.fn((video: Video) => Promise.resolve(video));
    findByUserId = jest.fn();
    findByIdOrFail = jest.fn().mockResolvedValue({
      id: 'channel-1',
      nickname: 'canal-do-dono',
      name: 'Canal do Dono',
      subscribers_count: 3,
    });
    findVideoReaction = jest.fn().mockResolvedValue('like');
    isSubscribed = jest.fn().mockResolvedValue(true);

    const moduleRef = await Test.createTestingModule({
      providers: [
        VideosService,

        { provide: ReactionsService, useValue: { findVideoReaction } },
        { provide: SubscriptionsService, useValue: { isSubscribed } },
        {
          provide: getRepositoryToken(Video),
          useValue: { save } as unknown as Repository<Video>,
        },
        {
          provide: ChannelsService,
          useValue: { findByUserId, findByIdOrFail },
        },
        { provide: StorageService, useValue: { getPresignedUrl, putObject } },
      ],
    }).compile();

    service = moduleRef.get(VideosService);
  });

  function buildVideo(overrides: Partial<Video> = {}): Video {
    return {
      storage_bucket: 'videos',
      published_at: null,
      thumbnail_key: null,
      custom_thumbnail_key: null,
      ...overrides,
    } as Video;
  }

  // SI-04.7 — rascunho só é servível para o dono; qualquer outro vê 404.
  describe('assertServable', () => {
    const OWNER_ID = 'owner-1';
    const draft = () =>
      buildVideo({ channel_id: 'channel-1', published_at: null });
    const published = () =>
      buildVideo({ channel_id: 'channel-1', published_at: new Date() });

    it('allows a published video for an anonymous caller', async () => {
      await expect(
        service.assertServable(published(), undefined),
      ).resolves.toBeUndefined();
      // Publicado nem consulta o canal.
      expect(findByUserId).not.toHaveBeenCalled();
    });

    it('allows a draft for the channel owner', async () => {
      findByUserId.mockResolvedValue({ id: 'channel-1' });

      await expect(
        service.assertServable(draft(), OWNER_ID),
      ).resolves.toBeUndefined();
    });

    it('hides a draft from an anonymous caller', async () => {
      await expect(service.assertServable(draft(), undefined)).rejects.toThrow(
        VideoNotFoundException,
      );
    });

    it('hides a draft from a different authenticated user', async () => {
      findByUserId.mockResolvedValue({ id: 'other-channel' });

      // 404 e não 403: a existência do rascunho não é revelada.
      await expect(
        service.assertServable(draft(), 'someone-else'),
      ).rejects.toThrow(VideoNotFoundException);
    });

    it('hides a draft from an authenticated user who has no channel', async () => {
      findByUserId.mockResolvedValue(null);

      await expect(
        service.assertServable(draft(), 'channel-less'),
      ).rejects.toThrow(VideoNotFoundException);
    });
  });

  describe('resolveThumbnailUrl', () => {
    it('prefers the custom thumbnail over the worker-generated one (TD-04)', async () => {
      const video = buildVideo({
        thumbnail_key: 'auto/key.jpg',
        custom_thumbnail_key: 'custom/key.png',
      });

      const url = await service.resolveThumbnailUrl(video);

      expect(url).toBe('https://signed.example/url');
      expect(getPresignedUrl).toHaveBeenCalledWith('videos', 'custom/key.png');
    });

    it('falls back to the worker-generated thumbnail when there is no custom one', async () => {
      const video = buildVideo({ thumbnail_key: 'auto/key.jpg' });

      await service.resolveThumbnailUrl(video);

      expect(getPresignedUrl).toHaveBeenCalledWith('videos', 'auto/key.jpg');
    });

    it('returns null when the video has no thumbnail at all', async () => {
      const url = await service.resolveThumbnailUrl(buildVideo());

      expect(url).toBeNull();
      expect(getPresignedUrl).not.toHaveBeenCalled();
    });

    it('returns null when the video has a key but no storage bucket', async () => {
      const video = buildVideo({
        storage_bucket: null,
        thumbnail_key: 'auto/key.jpg',
      });

      const url = await service.resolveThumbnailUrl(video);

      expect(url).toBeNull();
      expect(getPresignedUrl).not.toHaveBeenCalled();
    });
  });

  // SI-05.1 — o player recebe URLs de 6 h (TD-02); o default de 300 s do
  // StorageService continua valendo para os demais contextos.
  describe('presigned playback URLs', () => {
    const ready = (overrides: Partial<Video> = {}) =>
      buildVideo({
        status: VideoStatus.READY,
        storage_bucket: 'videos',
        storage_key: 'videos/abc123/original.mp4',
        title: 'Minha aula de POO',
        public_id: 'abc123',
        ...overrides,
      });

    it('signs the stream URL with the 6 h playback TTL', async () => {
      await service.getStreamUrl(ready());

      expect(PLAYBACK_URL_TTL_SECONDS).toBe(21600);
      expect(getPresignedUrl).toHaveBeenCalledWith(
        'videos',
        'videos/abc123/original.mp4',
        { expiresInSeconds: PLAYBACK_URL_TTL_SECONDS },
      );
    });

    it('signs the download URL with the same TTL and a filename from the title', async () => {
      await service.getDownloadUrl(ready());

      expect(getPresignedUrl).toHaveBeenCalledWith(
        'videos',
        'videos/abc123/original.mp4',
        {
          expiresInSeconds: PLAYBACK_URL_TTL_SECONDS,
          responseContentDisposition:
            'attachment; filename="minha-aula-de-poo.mp4"',
        },
      );
    });

    it('strips accents and punctuation from the title when building the filename', async () => {
      await service.getDownloadUrl(
        ready({ title: 'Ação & Reação: o "vídeo"!', storage_key: 'k/v.webm' }),
      );

      expect(getPresignedUrl).toHaveBeenCalledWith(
        'videos',
        'k/v.webm',
        expect.objectContaining({
          responseContentDisposition:
            'attachment; filename="acao-reacao-o-video.webm"',
        }),
      );
    });

    it('falls back to the publicId when the title has no usable characters', async () => {
      await service.getDownloadUrl(
        ready({ title: '???', public_id: 'xyz789' }),
      );

      expect(getPresignedUrl).toHaveBeenCalledWith(
        'videos',
        'videos/abc123/original.mp4',
        expect.objectContaining({
          responseContentDisposition: 'attachment; filename="xyz789.mp4"',
        }),
      );
    });
  });

  // SI-05.2 — a projeção pública é montada campo a campo; um spread da
  // entidade faria qualquer coluna de operação vazar ao visitante anônimo.
  describe('toPublicDetail', () => {
    it('exposes only the public surface, never the owner operation fields', async () => {
      const video = buildVideo({
        status: VideoStatus.READY,
        public_id: 'abc123',
        channel_id: 'channel-1',
        title: 'Aula de POO',
        description: 'Uma introducao',
        duration_seconds: 420,
        category: VideoCategory.EDUCACAO,
        published_at: new Date('2026-09-01T00:00:00Z'),
        views_count: 7,
        storage_key: 'videos/abc123/original.mp4',
        upload_id: 'upload-xyz',
        processing_error: 'algo falhou antes',
      });

      const detail = await service.toPublicDetail(video);

      expect(Object.keys(detail).sort()).toEqual(
        [
          'category',
          'channel',
          'commentsCount',
          'description',
          'downloadUrl',
          'durationSeconds',
          'likesCount',
          'publicId',
          'publishedAt',
          'streamUrl',
          'thumbnailUrl',
          'title',
          'viewerReaction',
          'viewsCount',
          'visibility',
        ].sort(),
      );
      expect(detail.viewsCount).toBe(7);
      expect(detail.channel).toEqual({
        nickname: 'canal-do-dono',
        name: 'Canal do Dono',
        subscribersCount: 3,
        viewerSubscribed: false,
      });
      expect(findByIdOrFail).toHaveBeenCalledWith('channel-1');
    });

    // SI-06.5 — sem visitante, o estado pessoal é neutro e nada é consultado.
    it('returns a neutral personal state without querying when there is no viewer', async () => {
      const video = buildVideo({
        status: VideoStatus.READY,
        channel_id: 'channel-1',
        title: 'Aula',
      });

      const detail = await service.toPublicDetail(video);

      expect(detail.viewerReaction).toBeNull();
      expect(detail.channel.viewerSubscribed).toBe(false);
      expect(findVideoReaction).not.toHaveBeenCalled();
      expect(isSubscribed).not.toHaveBeenCalled();
    });

    it('fills the personal state from reactions and subscriptions for a viewer', async () => {
      const video = buildVideo({
        id: 'video-1',
        status: VideoStatus.READY,
        channel_id: 'channel-1',
        title: 'Aula',
      });

      const detail = await service.toPublicDetail(video, 'viewer-1');

      expect(detail.viewerReaction).toBe('like');
      expect(detail.channel.viewerSubscribed).toBe(true);
      expect(findVideoReaction).toHaveBeenCalledWith('video-1', 'viewer-1');
      expect(isSubscribed).toHaveBeenCalledWith('viewer-1', 'channel-1');
    });
  });

  describe('updateVideo', () => {
    function buildReadyVideo(overrides: Partial<Video> = {}): Video {
      return buildVideo({
        public_id: 'vid123',
        title: 'Título antigo',
        description: 'Descrição antiga',
        status: VideoStatus.READY,
        published_at: null,
        ...overrides,
      });
    }

    it('applies the text fields that were sent and leaves the others untouched', async () => {
      const video = buildReadyVideo();

      const updated = await service.updateVideo(video, {
        title: 'Título novo',
        category: VideoCategory.EDUCACAO,
      });

      expect(updated.title).toBe('Título novo');
      expect(updated.category).toBe(VideoCategory.EDUCACAO);
      expect(updated.description).toBe('Descrição antiga');
      expect(save).toHaveBeenCalledWith(video);
    });

    it('stores an empty description as null', async () => {
      const video = buildReadyVideo();

      const updated = await service.updateVideo(video, { description: '' });

      expect(updated.description).toBeNull();
    });

    it('publishes a ready video by setting published_at', async () => {
      const video = buildReadyVideo();

      const updated = await service.updateVideo(video, { published: true });

      expect(updated.published_at).toBeInstanceOf(Date);
    });

    it('keeps the original published_at when publishing again (idempotent)', async () => {
      const originalDate = new Date('2026-07-28T12:00:00.000Z');
      const video = buildReadyVideo({ published_at: originalDate });

      const updated = await service.updateVideo(video, { published: true });

      expect(updated.published_at).toBe(originalDate);
    });

    it('refuses to publish a video that is not ready (TD-02)', async () => {
      const video = buildReadyVideo({ status: VideoStatus.PROCESSING });

      await expect(
        service.updateVideo(video, { published: true }),
      ).rejects.toBeInstanceOf(VideoNotPublishableException);

      expect(video.published_at).toBeNull();
      expect(save).not.toHaveBeenCalled();
    });

    it('unpublishes whatever the status is', async () => {
      const video = buildReadyVideo({
        status: VideoStatus.FAILED,
        published_at: new Date(),
      });

      const updated = await service.updateVideo(video, { published: false });

      expect(updated.published_at).toBeNull();
    });

    it('leaves published_at alone when published was not sent', async () => {
      const originalDate = new Date('2026-07-28T12:00:00.000Z');
      const video = buildReadyVideo({ published_at: originalDate });

      const updated = await service.updateVideo(video, {
        title: 'Só o título',
      });

      expect(updated.published_at).toBe(originalDate);
    });

    it('stores the thumbnail under custom_thumbnail_key, never touching thumbnail_key', async () => {
      const video = buildReadyVideo({ thumbnail_key: 'auto/key.jpg' });
      const thumbnail = {
        buffer: Buffer.from('imagem'),
        mimetype: 'image/png',
      } as Express.Multer.File;

      const updated = await service.updateVideo(video, {}, thumbnail);

      expect(updated.thumbnail_key).toBe('auto/key.jpg');
      expect(updated.custom_thumbnail_key).toMatch(
        /^thumbnails\/vid123-\d+\.png$/,
      );
      expect(putObject).toHaveBeenCalledWith(
        'videos',
        updated.custom_thumbnail_key,
        thumbnail.buffer,
        'image/png',
      );
    });
  });
});
