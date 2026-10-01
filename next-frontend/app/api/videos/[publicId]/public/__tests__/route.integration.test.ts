import { beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";

import { env } from "@/lib/env";
import { server } from "@/mocks/server";

// Sem mock de next/headers: esta rota é anônima por construção — não lê
// sessão, ao contrário do GET irmão em ../../route.ts, que serve o dono.
let GET: (
  req: Request,
  ctx: { params: Promise<{ publicId: string }> }
) => Promise<Response>;

beforeAll(async () => {
  ({ GET } = await import("@/app/api/videos/[publicId]/public/route"));
});

function makeRequest(publicId: string) {
  return {
    request: new Request(`http://localhost/api/videos/${publicId}/public`),
    ctx: { params: Promise.resolve({ publicId }) },
  };
}

describe("GET /api/videos/[publicId]/public", () => {
  it("passes the public projection through, both presigned URLs included", async () => {
    const { request, ctx } = makeRequest("watch-video");
    const res = await GET(request, ctx);

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({
      publicId: "watch-video",
      channel: { nickname: expect.any(String) as unknown },
    });
    // As duas URLs vêm juntas com a página — nenhuma chamada extra em tempo
    // de clique (TD-02, Clarification de 2026-09-24).
    expect(body.streamUrl).toEqual(expect.any(String));
    expect(body.downloadUrl).toEqual(expect.any(String));
    expect(body.downloadUrl).not.toBe(body.streamUrl);
  });

  it("sends no Authorization header upstream", async () => {
    let seenAuthorization: string | null = "unset";

    server.use(
      http.get(`${env.API_URL}/videos/:publicId/public`, ({ request }) => {
        seenAuthorization = request.headers.get("authorization");
        return HttpResponse.json({ publicId: "watch-video" });
      })
    );

    const { request, ctx } = makeRequest("watch-video");
    await GET(request, ctx);

    expect(seenAuthorization).toBeNull();
  });

  it("passes an upstream 404 through unchanged", async () => {
    const { request, ctx } = makeRequest("missing-video");
    const res = await GET(request, ctx);

    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("VIDEO_NOT_FOUND");
  });

  it("passes an upstream 409 through unchanged", async () => {
    server.use(
      http.get(`${env.API_URL}/videos/:publicId/public`, () =>
        HttpResponse.json(
          {
            statusCode: 409,
            error: "VIDEO_NOT_READY",
            message: "Video is not ready",
            code: null,
          },
          { status: 409 }
        )
      )
    );

    const { request, ctx } = makeRequest("processing-video");
    const res = await GET(request, ctx);

    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("VIDEO_NOT_READY");
  });
});
