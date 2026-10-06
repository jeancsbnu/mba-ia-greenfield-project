import { http, HttpResponse } from "msw";

import type { paths } from "@/lib/api/types.gen";
import { env } from "@/lib/env";

import {
  buildComment,
  buildSocialReplies,
  buildSocialThreads,
  socialRootId,
} from "../factories/comments";
import { QUIET_VIDEO_PUBLIC_ID } from "../factories/social";

type CommentsOk =
  paths["/videos/{publicId}/comments"]["get"]["responses"][200]["content"]["application/json"];
type CommentCreated =
  paths["/videos/{publicId}/comments"]["post"]["responses"][201]["content"]["application/json"];
type CreateCommentBody =
  paths["/videos/{publicId}/comments"]["post"]["requestBody"]["content"]["application/json"];
type RepliesOk =
  paths["/comments/{commentId}/replies"]["get"]["responses"][200]["content"]["application/json"];

// Triggers reservados em ../factories/social.ts (compartilhados com o E2E):
// `quiet-video` → sem comentários; qualquer outro publicId → as 12 raízes do
// vídeo social de fixture.

const DEFAULT_COMMENTS_LIMIT = 10;
const DEFAULT_REPLIES_LIMIT = 10;

function pageParams(url: URL, defaultLimit: number) {
  return {
    offset: Number(url.searchParams.get("offset") ?? 0),
    limit: Number(url.searchParams.get("limit") ?? defaultLimit),
  };
}

export const handlers = [
  http.get(`${env.API_URL}/videos/:publicId/comments`, ({ params, request }) => {
    const { offset, limit } = pageParams(new URL(request.url), DEFAULT_COMMENTS_LIMIT);
    const threads =
      params.publicId === QUIET_VIDEO_PUBLIC_ID ? [] : buildSocialThreads();
    return HttpResponse.json<CommentsOk>({
      items: threads.slice(offset, offset + limit),
      total: threads.length,
      offset,
      limit,
    });
  }),

  // Ecoa o corpo e resolve o pai para a raiz, como o backend
  // (social-interactions/TD-04): responder a uma resposta da primeira thread
  // vira irmã sob a mesma raiz.
  http.post(`${env.API_URL}/videos/:publicId/comments`, async ({ request }) => {
    const { body, parentId } = (await request.json()) as CreateCommentBody;
    const rootId =
      parentId === undefined
        ? null
        : parentId.startsWith("social-reply-")
          ? socialRootId(0)
          : parentId;
    return HttpResponse.json<CommentCreated>(
      buildComment({
        id: `new-comment-${Date.now()}`,
        parentId: rootId,
        body,
        createdAt: new Date().toISOString(),
        author: { name: "Joana Cria", nickname: "joana_cria" },
      }),
      { status: 201 }
    );
  }),

  http.get(`${env.API_URL}/comments/:commentId/replies`, ({ params, request }) => {
    const { offset, limit } = pageParams(new URL(request.url), DEFAULT_REPLIES_LIMIT);
    const replies =
      params.commentId === socialRootId(0) ? buildSocialReplies() : [];
    return HttpResponse.json<RepliesOk>({
      items: replies.slice(offset, offset + limit),
      total: replies.length,
      offset,
      limit,
    });
  }),
];
