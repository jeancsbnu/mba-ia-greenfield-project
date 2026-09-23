import { http, HttpResponse } from "msw";

import type { paths } from "@/lib/api/types.gen";
import { env } from "@/lib/env";

import { buildOwnerVideoListItem, buildVideo } from "../factories/videos";
import { emailFromAuthHeader } from "./auth";

type ApiErrorEnvelope =
  paths["/videos/{publicId}"]["get"]["responses"][404]["content"]["application/json"];
type VideoOk =
  paths["/videos/{publicId}"]["get"]["responses"][200]["content"]["application/json"];
type OwnerVideosOk =
  paths["/me/videos"]["get"]["responses"][200]["content"]["application/json"];

// Reserved trigger table (shared with E2E — trigger values must not collide across test suites).
const NOT_FOUND_PUBLIC_ID = "missing-video";
const PROCESSING_PUBLIC_ID = "processing-video";
const FAILED_PUBLIC_ID = "failed-video";
const FLAKY_UPLOAD_TITLE = "flaky-upload";
const FLAKY_UPLOAD_ID = "flaky-upload-session";
// E2E cannot practically construct a real >10GB File in a browser context —
// this title trigger exercises the same backend error deterministically,
// without allocating 10GB in the test runner.
const TOO_LARGE_UPLOAD_TITLE = "trigger-upload-too-large";
// Reports "processing" for the first two polls, then "ready" — lets the E2E
// spec observe a real processing → ready transition across multiple polls.
const POLL_TRANSITION_TITLE = "trigger-poll-then-ready";
const POLL_TRANSITION_UPLOAD_ID = "poll-transition-upload";
const POLL_TRANSITION_PROCESSING_POLLS = 2;
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024 * 1024;
// Publicar um vídeo que ainda não terminou de processar devolve 409.
const NOT_PUBLISHABLE_TITLE = "trigger-not-publishable";
// Triggers dos specs da Fase 04 (next-frontend/specs/).
const DRAFT_PUBLIC_ID = "draft-video";
const PUBLISHED_PUBLIC_ID = "published-video";
const FOREIGN_PUBLIC_ID = "foreign-video";
const EMPTY_CHANNEL_EMAIL = "empty-channel@example.com";
const PANEL_ERROR_EMAIL = "panel-error@example.com";
const OWNER_VIDEOS_TOTAL = 12;
const DEFAULT_OWNER_LIMIT = 10;

function errorEnvelope(
  statusCode: number,
  error: string,
  message: string
): ApiErrorEnvelope {
  return { statusCode, error, message, code: null };
}

// Tracks whether the flaky-upload session's first PATCH has already been
// failed once — the second attempt (tus-js-client's retry) succeeds.
let flakyPatchHasFailedOnce = false;

// Tracks how many times the poll-transition video's status has been polled.
let pollTransitionCallCount = 0;

/**
 * Estado por upload do mock tus.
 *
 * O protocolo exige que a resposta de HEAD informe `Upload-Offset` **e**
 * `Upload-Length`: é assim que o cliente valida de onde retomar. Devolver um
 * offset fixo e omitir o length faz o tus repetir HEAD e desistir, que era o
 * que acontecia no cenário de queda de conexão.
 */
const uploads = new Map<string, { length: number; offset: number }>();

export const handlers = [
  http.get(`${env.API_URL}/videos/:publicId`, ({ params }) => {
    const publicId = params.publicId as string;

    if (publicId === NOT_FOUND_PUBLIC_ID) {
      return HttpResponse.json(
        errorEnvelope(404, "VIDEO_NOT_FOUND", "Video not found"),
        { status: 404 }
      );
    }
    if (publicId === PROCESSING_PUBLIC_ID) {
      return HttpResponse.json(
        buildVideo({ publicId, status: "processing", durationSeconds: null })
      );
    }
    if (publicId === FAILED_PUBLIC_ID) {
      return HttpResponse.json(
        buildVideo({ publicId, status: "failed", durationSeconds: null })
      );
    }
    if (publicId === POLL_TRANSITION_UPLOAD_ID) {
      pollTransitionCallCount += 1;
      const stillProcessing =
        pollTransitionCallCount <= POLL_TRANSITION_PROCESSING_POLLS;
      return HttpResponse.json(
        buildVideo({
          publicId,
          status: stillProcessing ? "processing" : "ready",
          durationSeconds: stillProcessing ? null : 12,
        })
      );
    }
    if (publicId === FOREIGN_PUBLIC_ID) {
      // Vídeo de outro canal: o backend responde 403 e a página cai em
      // not-found sem revelar que ele existe (TD-09).
      return HttpResponse.json(
        errorEnvelope(403, "FORBIDDEN", "Video belongs to another channel"),
        { status: 403 }
      );
    }
    if (publicId === DRAFT_PUBLIC_ID) {
      return HttpResponse.json(
        buildVideo({
          publicId,
          status: "ready",
          title: "Receita de bolo",
          category: "Educação",
          visibility: "public",
          publishedAt: null,
        })
      );
    }
    if (publicId === PUBLISHED_PUBLIC_ID) {
      return HttpResponse.json(
        buildVideo({
          publicId,
          status: "ready",
          title: "Receita de bolo",
          category: "Educação",
          visibility: "public",
          publishedAt: "2026-07-01T00:00:00.000Z",
        })
      );
    }
    return HttpResponse.json(buildVideo({ publicId, status: "ready" }));
  }),

  http.post(`${env.API_URL}/videos/upload`, ({ request }) => {
    const uploadLength = Number(request.headers.get("upload-length") ?? 0);
    const metadataHeader = request.headers.get("upload-metadata") ?? "";
    const isTooLarge =
      uploadLength > MAX_UPLOAD_SIZE_BYTES ||
      metadataHeader.includes(
        Buffer.from(TOO_LARGE_UPLOAD_TITLE).toString("base64")
      );

    if (isTooLarge) {
      return HttpResponse.json(
        errorEnvelope(
          400,
          "UPLOAD_FILE_TOO_LARGE",
          "Upload exceeds the maximum allowed size of 10GB"
        ),
        { status: 400 }
      );
    }

    const isFlaky = metadataHeader.includes(
      Buffer.from(FLAKY_UPLOAD_TITLE).toString("base64")
    );
    const isPollTransition = metadataHeader.includes(
      Buffer.from(POLL_TRANSITION_TITLE).toString("base64")
    );
    // Estes contadores são estado de módulo, e sob o E2E o dev server é um
    // processo de longa duração: sem reiniciá-los a cada novo upload o gatilho
    // só valeria na primeira execução e os testes passariam a depender da
    // ordem — ou do histórico — em que foram rodados.
    if (isFlaky) flakyPatchHasFailedOnce = false;
    if (isPollTransition) pollTransitionCallCount = 0;

    const uploadId = isFlaky
      ? FLAKY_UPLOAD_ID
      : isPollTransition
        ? POLL_TRANSITION_UPLOAD_ID
        : `fixture-upload-${Date.now()}`;

    uploads.set(uploadId, { length: uploadLength, offset: 0 });

    return new HttpResponse(null, {
      status: 201,
      headers: {
        "Tus-Resumable": "1.0.0",
        Location: `${env.API_URL}/videos/upload/${uploadId}`,
        // O formulário lê este header no onAfterResponse do POST para saber
        // qual vídeo consultar depois (`GET /api/videos/{publicId}`). Sem ele
        // o publicId fica vazio e o polling bate em `/api/videos/`, que
        // redireciona para 404 — o upload completa e a tela trava em
        // "enviando". O id é o mesmo do upload para casar com os triggers de
        // status abaixo.
        "X-Video-Public-Id": uploadId,
      },
    });
  }),

  http.patch(
    `${env.API_URL}/videos/upload/:uploadId`,
    async ({ request, params }) => {
      const { uploadId } = params;

      if (uploadId === FLAKY_UPLOAD_ID && !flakyPatchHasFailedOnce) {
        flakyPatchHasFailedOnce = true;
        return HttpResponse.error();
      }

      const startOffset = Number(request.headers.get("upload-offset") ?? 0);
      const chunk = await request.arrayBuffer();
      const newOffset = startOffset + chunk.byteLength;

      const tracked = uploads.get(uploadId as string);
      if (tracked) tracked.offset = newOffset;

      return new HttpResponse(null, {
        status: 204,
        headers: {
          "Tus-Resumable": "1.0.0",
          "Upload-Offset": String(newOffset),
        },
      });
    }
  ),

  http.head(`${env.API_URL}/videos/upload/:uploadId`, ({ params }) => {
    const tracked = uploads.get(params.uploadId as string);

    return new HttpResponse(null, {
      status: 200,
      headers: {
        "Tus-Resumable": "1.0.0",
        "Upload-Offset": String(tracked?.offset ?? 0),
        // Sem Upload-Length o tus não consegue validar a retomada.
        "Upload-Length": String(tracked?.length ?? 0),
      },
    });
  }),

  // Registrado depois do PATCH de upload: o MSW casa na ordem, então
  // /videos/upload/:id continua indo para o handler tus.
  http.patch(`${env.API_URL}/videos/:publicId`, async ({ params, request }) => {
    const publicId = params.publicId as string;

    if (publicId === NOT_FOUND_PUBLIC_ID) {
      return HttpResponse.json(
        errorEnvelope(404, "VIDEO_NOT_FOUND", "Video not found"),
        { status: 404 }
      );
    }

    // multipart porque a rota aceita a thumbnail junto dos campos (TD-03).
    const form = await request.formData();
    const readText = (field: string): string | undefined => {
      const value = form.get(field);
      return typeof value === "string" ? value : undefined;
    };

    const title = readText("title");
    const published = readText("published");

    if (title === NOT_PUBLISHABLE_TITLE && published === "true") {
      return HttpResponse.json(
        errorEnvelope(
          409,
          "VIDEO_NOT_PUBLISHABLE",
          "Video is still processing or failed, so it cannot be published"
        ),
        { status: 409 }
      );
    }

    const category = readText("category") as VideoOk["category"] | undefined;
    const visibility = readText("visibility") as
      | VideoOk["visibility"]
      | undefined;
    const description = readText("description");

    // published governa publishedAt: true carimba a data, false volta a rascunho.
    const publishedAt =
      published === "true"
        ? "2026-07-01T00:00:00.000Z"
        : published === "false"
          ? null
          : undefined;

    return HttpResponse.json<VideoOk>(
      buildVideo({
        publicId,
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(visibility !== undefined ? { visibility } : {}),
        ...(publishedAt !== undefined ? { publishedAt } : {}),
        ...(form.get("thumbnail") !== null
          ? { thumbnailUrl: "https://storage.example/custom-thumb.png" }
          : {}),
      })
    );
  }),

  http.get(`${env.API_URL}/me/videos`, ({ request }) => {
    const email = emailFromAuthHeader(request.headers.get("authorization"));

    if (email === PANEL_ERROR_EMAIL) {
      return HttpResponse.json(
        errorEnvelope(500, "INTERNAL_ERROR", "Unexpected upstream failure"),
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const limit = Number(url.searchParams.get("limit") ?? DEFAULT_OWNER_LIMIT);
    const total = email === EMPTY_CHANNEL_EMAIL ? 0 : OWNER_VIDEOS_TOTAL;

    const items = Array.from(
      { length: Math.max(0, Math.min(limit, total - offset)) },
      (_, index) => {
        const position = offset + index;
        // Primeira linha é o rascunho de referência dos specs; depois alterna
        // entre publicado público e publicado "Indisponível".
        const isDraft = position === 2;
        const isUnlisted = position === 1;
        return buildOwnerVideoListItem({
          publicId: position === 0 ? DRAFT_PUBLIC_ID : `owner-video-${position}`,
          title:
            position === 0 ? "Receita de bolo" : `Video do painel ${position}`,
          visibility: isUnlisted ? "unlisted" : "public",
          publishedAt: isDraft
            ? null
            : new Date(
                Date.UTC(2026, 6, Math.max(1, OWNER_VIDEOS_TOTAL - position))
              ).toISOString(),
        });
      }
    );

    return HttpResponse.json<OwnerVideosOk>({ items, total, offset, limit });
  }),
];
