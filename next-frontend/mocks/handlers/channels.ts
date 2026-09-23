import { http, HttpResponse } from "msw";

import type { paths } from "@/lib/api/types.gen";
import { env } from "@/lib/env";

import { buildChannel, buildPublicChannel } from "../factories/channels";
import { buildPublicVideoListItem } from "../factories/videos";
import { emailFromAuthHeader } from "./auth";

type ApiErrorEnvelope =
  paths["/me/channel"]["get"]["responses"][404]["content"]["application/json"];
type ChannelOk =
  paths["/me/channel"]["get"]["responses"][200]["content"]["application/json"];
type UpdateChannelBody =
  paths["/me/channel"]["patch"]["requestBody"]["content"]["application/json"];
type PublicChannelOk =
  paths["/channels/{nickname}"]["get"]["responses"][200]["content"]["application/json"];
type PublicVideosOk =
  paths["/channels/{nickname}/videos"]["get"]["responses"][200]["content"]["application/json"];

// Reserved trigger table (shared with E2E — os valores vêm dos specs em
// next-frontend/specs/ e não podem colidir com os das specs de auth e upload).
const TAKEN_NICKNAME = "nickname_em_uso";
const UNKNOWN_NICKNAME = "nao_existe";
const EMPTY_SHOWCASE_NICKNAME = "sem_videos";
const OWNER_NICKNAME = "joana_cria";
const EMPTY_CHANNEL_EMAIL = "empty-channel@example.com";

const PUBLIC_VIDEOS_TOTAL = 12;
const DEFAULT_PUBLIC_LIMIT = 8;

function errorEnvelope(
  statusCode: number,
  error: string,
  message: string
): ApiErrorEnvelope {
  return { statusCode, error, message, code: null };
}

export const handlers = [
  http.get(`${env.API_URL}/me/channel`, ({ request }) => {
    const email = emailFromAuthHeader(request.headers.get("authorization"));

    return HttpResponse.json<ChannelOk>(
      buildChannel({
        nickname: email === EMPTY_CHANNEL_EMAIL ? "canal_vazio" : OWNER_NICKNAME,
        name: email === EMPTY_CHANNEL_EMAIL ? "Canal Vazio" : "Joana Cria",
        description:
          email === EMPTY_CHANNEL_EMAIL ? null : "Vídeos de culinária",
      })
    );
  }),

  http.patch(`${env.API_URL}/me/channel`, async ({ request }) => {
    const body = (await request.json()) as UpdateChannelBody;

    if (body.nickname === TAKEN_NICKNAME) {
      return HttpResponse.json(
        errorEnvelope(
          409,
          "NICKNAME_ALREADY_EXISTS",
          "Nickname already belongs to another channel"
        ),
        { status: 409 }
      );
    }

    // O backend normaliza descricao vazia para null (SI-04.5).
    const description =
      body.description === "" ? null : (body.description ?? null);

    return HttpResponse.json<ChannelOk>(
      buildChannel({
        name: body.name ?? "Joana Cria",
        nickname: body.nickname ?? OWNER_NICKNAME,
        description,
      })
    );
  }),

  http.get(`${env.API_URL}/channels/:nickname`, ({ params }) => {
    const nickname = params.nickname as string;

    if (nickname === UNKNOWN_NICKNAME) {
      return HttpResponse.json(
        errorEnvelope(404, "CHANNEL_NOT_FOUND", "Channel not found"),
        { status: 404 }
      );
    }

    const isEmpty = nickname === EMPTY_SHOWCASE_NICKNAME;

    return HttpResponse.json<PublicChannelOk>(
      buildPublicChannel({
        nickname,
        name: isEmpty ? "Canal Sem Vídeos" : "Joana Cria",
        description: isEmpty ? null : "Vídeos de culinária",
        videosCount: isEmpty ? 0 : PUBLIC_VIDEOS_TOTAL,
      })
    );
  }),

  http.get(`${env.API_URL}/channels/:nickname/videos`, ({ params, request }) => {
    const nickname = params.nickname as string;

    if (nickname === UNKNOWN_NICKNAME) {
      return HttpResponse.json(
        errorEnvelope(404, "CHANNEL_NOT_FOUND", "Channel not found"),
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const limit = Number(url.searchParams.get("limit") ?? DEFAULT_PUBLIC_LIMIT);
    const total =
      nickname === EMPTY_SHOWCASE_NICKNAME ? 0 : PUBLIC_VIDEOS_TOTAL;

    const items = Array.from(
      { length: Math.max(0, Math.min(limit, total - offset)) },
      (_, index) => {
        const position = offset + index;
        return buildPublicVideoListItem({
          publicId: `public-video-${position}`,
          title: `Video publico ${position}`,
          // Mais recente primeiro, como a vitrine ordena.
          publishedAt: new Date(
            Date.UTC(2026, 6, Math.max(1, total - position))
          ).toISOString(),
        });
      }
    );

    return HttpResponse.json<PublicVideosOk>({ items, total, offset, limit });
  }),
];
