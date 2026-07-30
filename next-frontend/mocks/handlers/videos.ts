import { http, HttpResponse } from "msw";

import type { paths } from "@/lib/api/types.gen";
import { env } from "@/lib/env";

import { buildVideo } from "../factories/videos";

type ApiErrorEnvelope =
  paths["/videos/{publicId}"]["get"]["responses"][404]["content"]["application/json"];

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
    const uploadId = isFlaky
      ? FLAKY_UPLOAD_ID
      : isPollTransition
        ? POLL_TRANSITION_UPLOAD_ID
        : `fixture-upload-${Date.now()}`;

    return new HttpResponse(null, {
      status: 201,
      headers: {
        "Tus-Resumable": "1.0.0",
        Location: `${env.API_URL}/videos/upload/${uploadId}`,
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

      return new HttpResponse(null, {
        status: 204,
        headers: {
          "Tus-Resumable": "1.0.0",
          "Upload-Offset": String(newOffset),
        },
      });
    }
  ),

  http.head(`${env.API_URL}/videos/upload/:uploadId`, () => {
    return new HttpResponse(null, {
      status: 200,
      headers: {
        "Tus-Resumable": "1.0.0",
        "Upload-Offset": "0",
      },
    });
  }),
];
