import type { paths } from "@/lib/api/types.gen";

export type CommentsPage =
  paths["/videos/{publicId}/comments"]["get"]["responses"][200]["content"]["application/json"];
export type CommentThread = CommentsPage["items"][number];
export type Comment =
  paths["/videos/{publicId}/comments"]["post"]["responses"][201]["content"]["application/json"];

const baseComment: Comment = {
  id: "comment-1",
  parentId: null,
  body: "Ótimo vídeo!",
  createdAt: "2026-10-01T12:00:00.000Z",
  likesCount: 0,
  viewerReaction: null,
  author: { name: "Maria Rocha", nickname: "maria_rocha" },
};

export const buildComment = (overrides: Partial<Comment> = {}): Comment => ({
  ...baseComment,
  ...overrides,
});

export const buildCommentThread = (
  overrides: Partial<CommentThread> = {}
): CommentThread => ({
  ...baseComment,
  replies: [],
  repliesCount: 0,
  ...overrides,
});

// Instante fixo de referência: os createdAt descem a partir dele, minuto a
// minuto, para a ordem "mais recentes primeiro" ser determinística.
const REFERENCE = Date.parse("2026-10-05T12:00:00.000Z");
const minutesAgo = (minutes: number) =>
  new Date(REFERENCE - minutes * 60_000).toISOString();

/** Raiz `index` (0 = mais recente) do vídeo social de fixture. */
export const socialRootId = (index: number) => `social-root-${index + 1}`;

/** Resposta `index` (0 = mais recente) da primeira thread do vídeo social. */
export const socialReplyId = (index: number) => `social-reply-${index + 1}`;

export const SOCIAL_ROOTS_TOTAL = 12;
export const SOCIAL_FIRST_THREAD_REPLIES = 7;
export const PRELOADED_REPLIES = 3;

/** As 7 respostas da primeira thread, mais recentes primeiro. */
export function buildSocialReplies(): Comment[] {
  return Array.from({ length: SOCIAL_FIRST_THREAD_REPLIES }, (_, i) =>
    buildComment({
      id: socialReplyId(i),
      parentId: socialRootId(0),
      body: `Resposta ${SOCIAL_FIRST_THREAD_REPLIES - i}`,
      createdAt: minutesAgo(i + 1),
      author: { name: "Ana Costa", nickname: "ana_costa" },
    })
  );
}

/**
 * As 12 raízes do vídeo social de fixture, mais recentes primeiro: a primeira,
 * de "Maria Rocha", tem 7 respostas (3 pré-carregadas); as demais, nenhuma.
 */
export function buildSocialThreads(): CommentThread[] {
  const replies = buildSocialReplies();
  return Array.from({ length: SOCIAL_ROOTS_TOTAL }, (_, i) =>
    buildCommentThread({
      id: socialRootId(i),
      body: i === 0 ? "Que aula incrível!" : `Comentário ${SOCIAL_ROOTS_TOTAL - i}`,
      createdAt: minutesAgo(10 + i * 10),
      author:
        i === 0
          ? { name: "Maria Rocha", nickname: "maria_rocha" }
          : { name: "Diego Farias", nickname: "diego_farias" },
      replies: i === 0 ? replies.slice(0, PRELOADED_REPLIES) : [],
      repliesCount: i === 0 ? SOCIAL_FIRST_THREAD_REPLIES : 0,
    })
  );
}
