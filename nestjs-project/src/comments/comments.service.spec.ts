import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChannelsService } from '../channels/channels.service';
import {
  CommentNotFoundException,
  VideoNotFoundException,
} from '../common/exceptions/domain.exception';
import { ReactionsService } from '../reactions/reactions.service';
import type { Video } from '../videos/entities/video.entity';
import { VideosService } from '../videos/videos.service';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';

// Resolução do pai na criação (social-interactions/TD-04, profundidade 1): a
// regra é de serviço, porque uma CHECK não alcança outra linha.
describe('CommentsService (unit)', () => {
  let service: CommentsService;
  let findOne: jest.Mock;
  let save: jest.Mock;
  let adjustCommentsCount: jest.Mock;
  let repoFindOne: jest.Mock;
  let assertServable: jest.Mock;

  const video = { id: 'video-1' } as Video;

  beforeEach(async () => {
    findOne = jest.fn();
    save = jest.fn((comment: Partial<Comment>) =>
      Promise.resolve({
        id: 'new-comment',
        created_at: new Date('2026-10-05T12:00:00Z'),
        ...comment,
      }),
    );
    adjustCommentsCount = jest.fn().mockResolvedValue(undefined);
    repoFindOne = jest.fn();
    assertServable = jest.fn().mockResolvedValue(undefined);
    const manager = {
      findOne,
      save,
      create: jest.fn((_entity: unknown, data: Partial<Comment>) => data),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getRepositoryToken(Comment),
          useValue: {
            findOne: repoFindOne,
            manager: {
              transaction: jest.fn((cb: (m: typeof manager) => unknown) =>
                cb(manager),
              ),
            },
          },
        },
        {
          provide: VideosService,
          useValue: { adjustCommentsCount, assertServable },
        },
        {
          provide: ChannelsService,
          useValue: {
            findByUserId: jest.fn().mockResolvedValue({
              name: 'Maria Rocha',
              nickname: 'maria_rocha',
            }),
          },
        },
        { provide: ReactionsService, useValue: {} },
      ],
    }).compile();

    service = moduleRef.get(CommentsService);
  });

  it('should create a root comment when no parent is given', async () => {
    const created = await service.create(video, 'user-1', 'Oi');

    expect(findOne).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ parent_id: null, video_id: 'video-1' }),
    );
    expect(created.parentId).toBeNull();
    expect(created.author).toEqual({
      name: 'Maria Rocha',
      nickname: 'maria_rocha',
    });
    expect(adjustCommentsCount).toHaveBeenCalledWith(
      expect.anything(),
      'video-1',
      1,
    );
  });

  it('should attach a reply to the root it points at', async () => {
    findOne.mockResolvedValue({
      id: 'root-1',
      video_id: 'video-1',
      parent_id: null,
    });

    const created = await service.create(video, 'user-1', 'Oi', 'root-1');

    expect(created.parentId).toBe('root-1');
  });

  it('should attach a reply to a reply as a sibling under the same root', async () => {
    findOne.mockResolvedValue({
      id: 'reply-1',
      video_id: 'video-1',
      parent_id: 'root-1',
    });

    const created = await service.create(video, 'user-1', 'Oi', 'reply-1');

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ parent_id: 'root-1' }),
    );
    expect(created.parentId).toBe('root-1');
  });

  it('should reject a parent that does not exist', async () => {
    findOne.mockResolvedValue(null);

    await expect(
      service.create(video, 'user-1', 'Oi', 'missing'),
    ).rejects.toThrow(CommentNotFoundException);
    expect(save).not.toHaveBeenCalled();
    expect(adjustCommentsCount).not.toHaveBeenCalled();
  });

  it('should reject a parent from another video', async () => {
    findOne.mockResolvedValue({
      id: 'root-9',
      video_id: 'video-9',
      parent_id: null,
    });

    await expect(
      service.create(video, 'user-1', 'Oi', 'root-9'),
    ).rejects.toThrow(CommentNotFoundException);
    expect(adjustCommentsCount).not.toHaveBeenCalled();
  });

  describe('findAccessible', () => {
    it('should return the comment when its video is servable', async () => {
      const comment = { id: 'c-1', video: { id: 'video-1' } };
      repoFindOne.mockResolvedValue(comment);

      await expect(service.findAccessible('c-1', 'viewer-1')).resolves.toBe(
        comment,
      );
      expect(assertServable).toHaveBeenCalledWith(comment.video, 'viewer-1');
    });

    it('should report a missing comment as COMMENT_NOT_FOUND', async () => {
      repoFindOne.mockResolvedValue(null);

      await expect(service.findAccessible('missing')).rejects.toThrow(
        CommentNotFoundException,
      );
    });

    it('should turn a draft of another channel into COMMENT_NOT_FOUND, not VIDEO_NOT_FOUND', async () => {
      repoFindOne.mockResolvedValue({ id: 'c-1', video: { id: 'draft' } });
      assertServable.mockRejectedValue(new VideoNotFoundException());

      await expect(service.findAccessible('c-1', 'viewer-1')).rejects.toThrow(
        CommentNotFoundException,
      );
    });

    it('should let unexpected errors propagate unchanged', async () => {
      repoFindOne.mockResolvedValue({ id: 'c-1', video: { id: 'v' } });
      assertServable.mockRejectedValue(new Error('database down'));

      await expect(service.findAccessible('c-1')).rejects.toThrow(
        'database down',
      );
    });
  });
});
