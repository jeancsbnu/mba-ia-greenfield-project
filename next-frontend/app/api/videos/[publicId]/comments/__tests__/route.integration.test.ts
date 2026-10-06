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

type Ctx = { params: Promise<{ publicId: string }> };
let GET: (req: NextRequest, ctx: Ctx) => Promise<Response>;
let POST: (req: Request, ctx: Ctx) => Promise<Response>;
let setSession: (typeof import("@/lib/auth/session"))["setSession"];

beforeAll(async () => {
  ({ GET, POST } = await import("@/app/api/videos/[publicId]/comments/route"));
  ({ setSession } = await import("@/lib/auth/session"));
});

const SESSION = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  userId: "user-1",
  email: "alice@example.com",
  channelSlug: "",
};

beforeEach(() => {
  cookieMap.clear();
});

const ctx: Ctx = { params: Promise.resolve({ publicId: "abc123" }) };
const UPSTREAM = `${env.API_URL}/videos/abc123/comments`;

function page(viewerReaction: "like" | null) {
  return {
    items: [
      {
        id: "c-1",
        parentId: null,
        body: "Oi",
        createdAt: "2026-10-05T12:00:00.000Z",
        likesCount: 1,
        viewerReaction,
        author: { name: "Maria Rocha", nickname: "maria_rocha" },
        replies: [],
        repliesCount: 0,
      },
    ],
    total: 11,
    offset: 10,
    limit: 10,
  };
}

function envelope(statusCode: number, error: string) {
  return { statusCode, error, message: error, code: null };
}

describe("GET /api/videos/{publicId}/comments", () => {
  it("forwards offset/limit anonymously when there is no session", async () => {
    let seenUrl = "";
    let seenAuthorization: string | null = "unset";
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        seenUrl = request.url;
        seenAuthorization = request.headers.get("authorization");
        return HttpResponse.json(page(null));
      })
    );

    const res = await GET(
      new NextRequest("http://localhost/api/videos/abc123/comments?offset=10&limit=10"),
      ctx
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(page(null));
    expect(new URL(seenUrl).searchParams.get("offset")).toBe("10");
    expect(new URL(seenUrl).searchParams.get("limit")).toBe("10");
    expect(seenAuthorization).toBeNull();
  });

  it("attaches the session bearer when there is a session", async () => {
    await setSession(SESSION);
    let seenAuthorization: string | null = null;
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        seenAuthorization = request.headers.get("authorization");
        return HttpResponse.json(page("like"));
      })
    );

    const res = await GET(
      new NextRequest("http://localhost/api/videos/abc123/comments"),
      ctx
    );

    expect(seenAuthorization).toBe("Bearer access-token");
    expect(((await res.json()) as ReturnType<typeof page>).items[0].viewerReaction).toBe(
      "like"
    );
  });

  it("answers anonymously instead of passing an upstream 401 to the browser", async () => {
    await setSession(SESSION);
    server.use(
      http.get(UPSTREAM, ({ request }) =>
        request.headers.get("authorization")
          ? HttpResponse.json(envelope(401, "UNAUTHORIZED"), { status: 401 })
          : HttpResponse.json(page(null))
      )
    );

    const res = await GET(
      new NextRequest("http://localhost/api/videos/abc123/comments"),
      ctx
    );

    expect(res.status).toBe(200);
  });

  it("passes a 404 through unchanged", async () => {
    server.use(
      http.get(UPSTREAM, () =>
        HttpResponse.json(envelope(404, "VIDEO_NOT_FOUND"), { status: 404 })
      )
    );

    const res = await GET(
      new NextRequest("http://localhost/api/videos/abc123/comments"),
      ctx
    );

    expect(res.status).toBe(404);
  });
});

describe("POST /api/videos/{publicId}/comments", () => {
  function postRequest(body: Record<string, unknown>): Request {
    return new Request("http://localhost/api/videos/abc123/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  beforeEach(async () => {
    await setSession(SESSION);
  });

  it("creates the comment with the session bearer and passes the 201 through", async () => {
    let seenAuthorization: string | null = null;
    let seenBody: unknown = null;
    server.use(
      http.post(UPSTREAM, async ({ request }) => {
        seenAuthorization = request.headers.get("authorization");
        seenBody = await request.json();
        return HttpResponse.json(
          { ...page(null).items[0], replies: undefined, repliesCount: undefined },
          { status: 201 }
        );
      })
    );

    const res = await POST(postRequest({ body: "Oi", parentId: "c-9" }), ctx);

    expect(res.status).toBe(201);
    expect(seenAuthorization).toBe("Bearer access-token");
    expect(seenBody).toEqual({ body: "Oi", parentId: "c-9" });
  });

  it.each([
    [400, "VALIDATION_ERROR"],
    [404, "COMMENT_NOT_FOUND"],
    [429, "RATE_LIMIT_EXCEEDED"],
  ])("passes a %i through unchanged", async (status, error) => {
    server.use(
      http.post(UPSTREAM, () => HttpResponse.json(envelope(status, error), { status }))
    );

    const res = await POST(postRequest({ body: "Oi" }), ctx);

    expect(res.status).toBe(status);
    expect(((await res.json()) as { error: string }).error).toBe(error);
  });

  it("refreshes once on 401 and retries the post", async () => {
    let calls = 0;
    server.use(
      http.post(UPSTREAM, () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json(envelope(401, "UNAUTHORIZED"), { status: 401 })
          : HttpResponse.json(page(null).items[0], { status: 201 });
      }),
      http.post(`${env.API_URL}/auth/refresh`, () =>
        HttpResponse.json({ access_token: "new-access", refresh_token: "new-refresh" })
      )
    );

    const res = await POST(postRequest({ body: "Oi" }), ctx);

    expect(res.status).toBe(201);
    expect(calls).toBe(2);
  });
});
