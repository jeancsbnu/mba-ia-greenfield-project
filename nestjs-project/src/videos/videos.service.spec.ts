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
import { VideosService } from './videos.service';

describe('VideosService (unit)', () => {
  let service: VideosService;
  let getPresignedUrl: jest.Mock;
  let putObject: jest.Mock;
  let save: jest.Mock;
  let findByUserId: jest.Mock;

  beforeEach(async () => {
    getPresignedUrl = jest.fn().mockResolvedValue('https://signed.example/url');
    putObject = jest.fn().mockResolvedValue(undefined);
    // save devolve o próprio objeto, como o TypeORM faz.
    save = jest.fn((video: Video) => Promise.resolve(video));
    findByUserId = jest.fn();

    const moduleRef = await Test.createTestingModule({
      providers: [
        VideosService,
        {
          provide: getRepositoryToken(Video),
          useValue: { save } as unknown as Repository<Video>,
        },
        { provide: ChannelsService, useValue: { findByUserId } },
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
