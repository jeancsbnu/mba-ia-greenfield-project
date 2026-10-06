import { http, HttpResponse } from "msw";

import type { paths } from "@/lib/api/types.gen";
import { env } from "@/lib/env";

import {
  LIKED_VIDEO_PUBLIC_ID,
  REACTION_FAILS_PUBLIC_ID,
  SOCIAL_VIDEO_LIKES,
} from "../factories/social";

type ReactionOk =
  paths["/videos/{publicId}/reaction"]["put"]["responses"][200]["content"]["application/json"];
type ReactionBody =
  paths["/videos/{publicId}/reaction"]["put"]["requestBody"]["content"]["application/json"];
type ReactionType = ReactionBody["type"];
type ApiErrorEnvelope =
  paths["/videos/{publicId}/reaction"]["put"]["responses"][429]["content"]["application/json"];

// Triggers reservados em ../factories/social.ts (compartilhados com o E2E).

function errorEnvelope(
  statusCode: number,
  error: string,
  message: string
): ApiErrorEnvelope {
  return { statusCode, error, message, code: null };
}

// Contagem após a operação, sem estado entre requisições: parte da contagem do
// fixture e aplica a mesma tabela de delta do backend (social-interactions/TD-02).
function likesAfter(
  base: number,
  previous: ReactionType | null,
  next: ReactionType | null
): number {
  return base - (previous === "like" ? 1 : 0) + (next === "like" ? 1 : 0);
}

function videoPrevious(publicId: string, authorization: string | null) {
  return publicId === LIKED_VIDEO_PUBLIC_ID && authorization ? "like" : null;
}

export const handlers = [
  http.put(
    `${env.API_URL}/videos/:publicId/reaction`,
    async ({ params, request }) => {
      const publicId = params.publicId as string;
      if (publicId === REACTION_FAILS_PUBLIC_ID) {
        return HttpResponse.json(
          errorEnvelope(429, "RATE_LIMIT_EXCEEDED", "Too many requests"),
          { status: 429 }
        );
      }
      const { type } = (await request.json()) as ReactionBody;
      const previous = videoPrevious(
        publicId,
        request.headers.get("authorization")
      );
      return HttpResponse.json<ReactionOk>({
        viewerReaction: type,
        likesCount: likesAfter(SOCIAL_VIDEO_LIKES, previous, type),
      });
    }
  ),

  http.delete(`${env.API_URL}/videos/:publicId/reaction`, ({ params, request }) => {
    const previous = videoPrevious(
      params.publicId as string,
      request.headers.get("authorization")
    );
    return HttpResponse.json<ReactionOk>({
      viewerReaction: null,
      likesCount: likesAfter(SOCIAL_VIDEO_LIKES, previous, null),
    });
  }),

  http.put(
    `${env.API_URL}/comments/:commentId/reaction`,
    async ({ request }) => {
      const { type } = (await request.json()) as ReactionBody;
      return HttpResponse.json<ReactionOk>({
        viewerReaction: type,
        likesCount: likesAfter(0, null, type),
      });
    }
  ),

  http.delete(`${env.API_URL}/comments/:commentId/reaction`, () =>
    HttpResponse.json<ReactionOk>({ viewerReaction: null, likesCount: 0 })
  ),
];
