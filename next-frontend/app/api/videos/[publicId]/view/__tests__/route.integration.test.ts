import { beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";

import { env } from "@/lib/env";
import { server } from "@/mocks/server";

let POST: (
  req: Request,
  ctx: { params: Promise<{ publicId: string }> }
) => Promise<Response>;

beforeAll(async () => {
  ({ POST } = await import("@/app/api/videos/[publicId]/view/route"));
});

function makeRequest(publicId: string) {
  return {
    request: new Request(`http://localhost/api/videos/${publicId}/view`, {
      method: "POST",
    }),
    ctx: { params: Promise.resolve({ publicId }) },
  };
}

describe("POST /api/videos/[publicId]/view", () => {
  it("returns 204 with no body on the happy path", async () => {
    const { request, ctx } = makeRequest("watch-video");
    const res = await POST(request, ctx);

    expect(res.status).toBe(204);
    // Um 204 com corpo é rejeitado pelo fetch do browser.
    expect(await res.text()).toBe("");
  });

  it("sends no body and no Authorization header upstream", async () => {
    let seenBody: string | null = null;
    let seenAuthorization: string | null = "unset";

    server.use(
      http.post(`${env.API_URL}/videos/:publicId/view`, async ({ request }) => {
        seenBody = await request.text();
        seenAuthorization = request.headers.get("authorization");
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { request, ctx } = makeRequest("watch-video");
    await POST(request, ctx);

    expect(seenBody).toBe("");
    expect(seenAuthorization).toBeNull();
  });

  it("passes the upstream 429 through without transforming it", async () => {
    const { request, ctx } = makeRequest("trigger-view-rate-limited");
    const res = await POST(request, ctx);

    expect(res.status).toBe(429);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("RATE_LIMIT_EXCEEDED");
  });

  it("passes an upstream 404 through unchanged", async () => {
    const { request, ctx } = makeRequest("missing-video");
    const res = await POST(request, ctx);

    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("VIDEO_NOT_FOUND");
  });
});
