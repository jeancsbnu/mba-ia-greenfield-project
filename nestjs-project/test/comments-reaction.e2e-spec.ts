import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { Comment } from '../src/comments/entities/comment.entity';
import { cleanAllTables } from '../src/test/create-test-data-source';
import { Video } from '../src/videos/entities/video.entity';
import {
  bearer,
  createPublishedVideo,
  createSocialApp,
  registerConfirmAndLogin,
  type AuthenticatedUser,
  type SocialE2eContext,
} from './social-e2e.helpers';

interface ThreadBody {
  id: string;
  likesCount: number;
  viewerReaction: string | null;
  replies: { id: string; likesCount: number }[];
}

// Spec: nestjs-project/specs/comments-reaction.plan.md (SI-06.11)
// Mesmo contrato das reações em vídeo, aplicado a comentário e resposta, com
// comments.likes_count na mesma transação (social-interactions/TD-02).
describe('comments-reaction', () => {
  let ctx: SocialE2eContext;
  let viewer: AuthenticatedUser;
  let video: Video;
  let root: Comment;
  let reply: Comment;

  beforeAll(async () => {
    ctx = await createSocialApp();
  }, 30000);

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await cleanAllTables(ctx.dataSource);
    ctx.throttlerStorage.storage.clear();

    const owner = await registerConfirmAndLogin(ctx.app, 'creact_owner');
    viewer = await registerConfirmAndLogin(ctx.app, 'creact_viewer');
    video = await createPublishedVideo(ctx.dataSource, owner.channel.id);
    const comments = ctx.dataSource.getRepository(Comment);
    root = await comments.save(
      comments.create({
        video_id: video.id,
        user_id: owner.userId,
        body: 'Raiz',
      }),
    );
    reply = await comments.save(
      comments.create({
        video_id: video.id,
        user_id: owner.userId,
        parent_id: root.id,
        body: 'Resposta',
      }),
    );
  }, 30000);

  const http = () => request(ctx.app.getHttpServer());
  const reactionUrl = (comment: Comment | string) =>
    `/comments/${typeof comment === 'string' ? comment : comment.id}/reaction`;

  // Cenário 1.1 do spec — AC #1, #2
  it('liking a comment adds one and shows up in the listing', async () => {
    const res = await http()
      .put(reactionUrl(root))
      .set(bearer(viewer))
      .send({ type: 'like' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ viewerReaction: 'like', likesCount: 1 });

    const page = (
      await http()
        .get(`/videos/${video.public_id}/comments`)
        .set(bearer(viewer))
    ).body as { items: ThreadBody[] };
    const thread = page.items.find((t) => t.id === root.id);
    expect(thread?.likesCount).toBe(1);
    expect(thread?.viewerReaction).toBe('like');
    expect(thread?.replies.find((r) => r.id === reply.id)?.likesCount).toBe(0);
  });

  // Cenário 1.2 do spec — AC #3
  it('removing is idempotent', async () => {
    await http()
      .put(reactionUrl(reply))
      .set(bearer(viewer))
      .send({ type: 'like' });

    const removed = await http().delete(reactionUrl(reply)).set(bearer(viewer));
    expect(removed.status).toBe(200);
    expect(removed.body).toEqual({ viewerReaction: null, likesCount: 0 });

    const again = await http().delete(reactionUrl(reply)).set(bearer(viewer));
    expect(again.status).toBe(200);
    expect((again.body as { likesCount: number }).likesCount).toBe(0);
  });

  // Cenário 1.3 do spec — AC #4
  it('rejects anonymous calls and unknown comments', async () => {
    const anonymous = await http()
      .put(reactionUrl(root))
      .send({ type: 'like' });
    expect(anonymous.status).toBe(401);

    const unknown = await http()
      .put(reactionUrl(randomUUID()))
      .set(bearer(viewer))
      .send({ type: 'like' });
    expect(unknown.status).toBe(404);
    expect((unknown.body as { error: string }).error).toBe('COMMENT_NOT_FOUND');
  });

  // Cenário 1.4 do spec — AC #5
  it('does not touch the like count of the video', async () => {
    await http()
      .put(reactionUrl(root))
      .set(bearer(viewer))
      .send({ type: 'like' });

    const detail = await http().get(`/videos/${video.public_id}/public`);
    expect((detail.body as { likesCount: number }).likesCount).toBe(0);
  });
});
