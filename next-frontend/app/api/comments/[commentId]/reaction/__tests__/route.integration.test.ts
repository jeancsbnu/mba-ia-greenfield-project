import { http, HttpResponse } from "msw";
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

type Handler = (req: Request, ctx: { params: Promise<{ commentId: string }> }) => Promise<Response>;
let PUT: Handler;
let DELETE: Handler;
let setSession: (typeof import("@/lib/auth/session"))["setSession"];

beforeAll(async () => {
  ({ PUT, DELETE } = await import("@/app/api/comments/[commentId]/reaction/route"));
  ({ setSession } = await import("@/lib/auth/session"));
});

beforeEach(async () => {
  cookieMap.clear();
  await setSession({
    accessToken: "access-token",
    refreshToken: "refresh-token",
    userId: "user-1",
    email: "alice@example.com",
    channelSlug: "",
  });
});

const COMMENT_ID = "11111111-1111-4111-8111-111111111111";
const ctx = { params: Promise.resolve({ commentId: COMMENT_ID }) };
const UPSTREAM = `${env.API_URL}/comments/${COMMENT_ID}/reaction`;

function envelope(statusCode: number, error: string) {
  return { statusCode, error, message: error, code: null };
}

describe("PUT /api/comments/{commentId}/reaction", () => {
  it("forwards to the comment route with the session bearer", async () => {
    let seenAuthorization: string | null = null;
    let seenBody: unknown = null;
    server.use(
      http.put(UPSTREAM, async ({ request }) => {
        seenAuthorization = request.headers.get("authorization");
        seenBody = await request.json();
        return HttpResponse.json({ viewerReaction: "dislike", likesCount: 3 });
      })
    );

    const res = await PUT(
      new Request(`http://localhost/api/comments/${COMMENT_ID}/reaction`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "dislike" }),
      }),
      ctx
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ viewerReaction: "dislike", likesCount: 3 });
    expect(seenAuthorization).toBe("Bearer access-token");
    expect(seenBody).toEqual({ type: "dislike" });
  });

  it("returns 401 UNAUTHORIZED when the refresh fails", async () => {
    server.use(
      http.put(UPSTREAM, () =>
        HttpResponse.json(envelope(401, "UNAUTHORIZED"), { status: 401 })
      ),
      http.post(`${env.API_URL}/auth/refresh`, () =>
        HttpResponse.json(envelope(401, "INVALID_TOKEN"), { status: 401 })
      )
    );

    const res = await PUT(
      new Request(`http://localhost/api/comments/${COMMENT_ID}/reaction`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "like" }),
      }),
      ctx
    );

    expect(res.status).toBe(401);
    expect(((await res.json()) as { error: string }).error).toBe("UNAUTHORIZED");
  });
});

describe("DELETE /api/comments/{commentId}/reaction", () => {
  it("passes a 404 COMMENT_NOT_FOUND through unchanged", async () => {
    server.use(
      http.delete(UPSTREAM, () =>
        HttpResponse.json(envelope(404, "COMMENT_NOT_FOUND"), { status: 404 })
      )
    );

    const res = await DELETE(
      new Request(`http://localhost/api/comments/${COMMENT_ID}/reaction`, {
        method: "DELETE",
      }),
      ctx
    );

    expect(res.status).toBe(404);
    expect(((await res.json()) as { error: string }).error).toBe(
      "COMMENT_NOT_FOUND"
    );
  });

  it.each([400, 429])("passes a %i through unchanged", async (status) => {
    server.use(
      http.delete(UPSTREAM, () =>
        HttpResponse.json(envelope(status, "ERR"), { status })
      )
    );

    const res = await DELETE(
      new Request(`http://localhost/api/comments/${COMMENT_ID}/reaction`, {
        method: "DELETE",
      }),
      ctx
    );

    expect(res.status).toBe(status);
  });
});
