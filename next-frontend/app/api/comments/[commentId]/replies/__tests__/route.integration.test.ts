import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { env } from "@/lib/env";
import { server } from "@/mocks/server";

// Cookie store mock for iron-session (same pattern as session.test.ts).
const cookieMap = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: (name: string) =>
      cookieMap.has(name) ? { name, value: cookieMap.get(name)! } : undefined,
    set: (name: string, value: string) => {
      cookieMap.set(name, value);
    },
    delete: (name: string) => {
      cookieMap.delete(name);
    },
  }),
}));

type Ctx = { params: Promise<{ commentId: string }> };
let GET: (req: NextRequest, ctx: Ctx) => Promise<Response>;

beforeAll(async () => {
  ({ GET } = await import("@/app/api/comments/[commentId]/replies/route"));
});

beforeEach(() => {
  cookieMap.clear();
});

const COMMENT_ID = "11111111-1111-4111-8111-111111111111";
const ctx: Ctx = { params: Promise.resolve({ commentId: COMMENT_ID }) };
const UPSTREAM = `${env.API_URL}/comments/${COMMENT_ID}/replies`;

describe("GET /api/comments/{commentId}/replies", () => {
  it("forwards offset/limit and passes the page through", async () => {
    let seenUrl = "";
    const body = {
      items: [
        {
          id: "r-4",
          parentId: COMMENT_ID,
          body: "Resposta 4",
          createdAt: "2026-10-05T11:00:00.000Z",
          likesCount: 0,
          viewerReaction: null,
          author: { name: "Ana Costa", nickname: "ana_costa" },
        },
      ],
      total: 7,
      offset: 3,
      limit: 4,
    };
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        seenUrl = request.url;
        return HttpResponse.json(body);
      })
    );

    const res = await GET(
      new NextRequest(
        `http://localhost/api/comments/${COMMENT_ID}/replies?offset=3&limit=4`
      ),
      ctx
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(body);
    expect(new URL(seenUrl).searchParams.get("offset")).toBe("3");
    expect(new URL(seenUrl).searchParams.get("limit")).toBe("4");
  });

  it("passes a 404 COMMENT_NOT_FOUND through unchanged", async () => {
    server.use(
      http.get(UPSTREAM, () =>
        HttpResponse.json(
          {
            statusCode: 404,
            error: "COMMENT_NOT_FOUND",
            message: "Comment not found",
            code: null,
          },
          { status: 404 }
        )
      )
    );

    const res = await GET(
      new NextRequest(`http://localhost/api/comments/${COMMENT_ID}/replies`),
      ctx
    );

    expect(res.status).toBe(404);
    expect(((await res.json()) as { error: string }).error).toBe(
      "COMMENT_NOT_FOUND"
    );
  });
});
