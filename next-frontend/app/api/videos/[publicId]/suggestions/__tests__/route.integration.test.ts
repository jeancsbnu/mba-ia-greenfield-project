import { beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";

import { env } from "@/lib/env";
import { server } from "@/mocks/server";

let GET: (
  req: Request,
  ctx: { params: Promise<{ publicId: string }> }
) => Promise<Response>;

beforeAll(async () => {
  ({ GET } = await import("@/app/api/videos/[publicId]/suggestions/route"));
});

function makeRequest(publicId: string, query = "") {
  return {
    request: new Request(
      `http://localhost/api/videos/${publicId}/suggestions${query}`
    ),
    ctx: { params: Promise.resolve({ publicId }) },
  };
}

describe("GET /api/videos/[publicId]/suggestions", () => {
  it("passes { items, total } through on the default page", async () => {
    const { request, ctx } = makeRequest("watch-video");
    const res = await GET(request, ctx);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: unknown[]; total: number };
    expect(body.items).toHaveLength(4);
    expect(body.total).toBe(6);
  });

  it("forwards offset and limit to the upstream query string", async () => {
    let seenOffset: string | null = null;
    let seenLimit: string | null = null;

    server.use(
      http.get(`${env.API_URL}/videos/:publicId/suggestions`, ({ request }) => {
        const url = new URL(request.url);
        seenOffset = url.searchParams.get("offset");
        seenLimit = url.searchParams.get("limit");
        return HttpResponse.json({ items: [], total: 6 });
      })
    );

    const { request, ctx } = makeRequest("watch-video", "?offset=4&limit=4");
    await GET(request, ctx);

    expect(seenOffset).toBe("4");
    expect(seenLimit).toBe("4");
  });

  it("omits offset and limit upstream when the browser sent none", async () => {
    let seenQuery: string | null = null;

    server.use(
      http.get(`${env.API_URL}/videos/:publicId/suggestions`, ({ request }) => {
        seenQuery = new URL(request.url).search;
        return HttpResponse.json({ items: [], total: 0 });
      })
    );

    const { request, ctx } = makeRequest("watch-video");
    await GET(request, ctx);

    // Sem parâmetros vazios no fio: o default de 4 é do upstream, e mandar
    // offset= ou limit= em branco faria a validação dele recusar.
    expect(seenQuery).toBe("");
  });

  it("treats an empty suggestions list as a success, not an error", async () => {
    const { request, ctx } = makeRequest("trigger-empty-suggestions");
    const res = await GET(request, ctx);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: unknown[]; total: number };
    expect(body.items).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("passes an upstream 404 through unchanged", async () => {
    server.use(
      http.get(`${env.API_URL}/videos/:publicId/suggestions`, () =>
        HttpResponse.json(
          {
            statusCode: 404,
            error: "VIDEO_NOT_FOUND",
            message: "Video not found",
            code: null,
          },
          { status: 404 }
        )
      )
    );

    const { request, ctx } = makeRequest("missing-video");
    const res = await GET(request, ctx);

    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("VIDEO_NOT_FOUND");
  });
});
