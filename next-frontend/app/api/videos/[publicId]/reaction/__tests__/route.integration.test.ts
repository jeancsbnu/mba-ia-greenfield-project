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

type Handler = (req: Request, ctx: { params: Promise<{ publicId: string }> }) => Promise<Response>;
let PUT: Handler;
let DELETE: Handler;
let setSession: (typeof import("@/lib/auth/session"))["setSession"];

beforeAll(async () => {
  ({ PUT, DELETE } = await import("@/app/api/videos/[publicId]/reaction/route"));
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

const ctx = { params: Promise.resolve({ publicId: "abc123" }) };
const UPSTREAM = `${env.API_URL}/videos/abc123/reaction`;

function putRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/videos/abc123/reaction", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function deleteRequest(): Request {
  return new Request("http://localhost/api/videos/abc123/reaction", {
    method: "DELETE",
  });
}

function envelope(statusCode: number, error: string) {
  return { statusCode, error, message: error, code: null };
}

describe("PUT /api/videos/{publicId}/reaction", () => {
  it("forwards the body with the session bearer and passes the state through", async () => {
    let seenAuthorization: string | null = null;
    let seenBody: unknown = null;
    server.use(
      http.put(UPSTREAM, async ({ request }) => {
        seenAuthorization = request.headers.get("authorization");
        seenBody = await request.json();
        return HttpResponse.json({ viewerReaction: "like", likesCount: 129 });
      })
    );

    const res = await PUT(putRequest({ type: "like" }), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ viewerReaction: "like", likesCount: 129 });
    expect(seenAuthorization).toBe("Bearer access-token");
    expect(seenBody).toEqual({ type: "like" });
    expect(res.headers.get("authorization")).toBeNull();
  });

  it.each([
    [400, "VALIDATION_ERROR"],
    [404, "VIDEO_NOT_FOUND"],
    [429, "RATE_LIMIT_EXCEEDED"],
  ])("passes a %i through unchanged", async (status, error) => {
    server.use(
      http.put(UPSTREAM, () => HttpResponse.json(envelope(status, error), { status }))
    );

    const res = await PUT(putRequest({ type: "like" }), ctx);

    expect(res.status).toBe(status);
    expect(((await res.json()) as { error: string }).error).toBe(error);
  });

  it("refreshes once on 401 and retries the mutation", async () => {
    let calls = 0;
    server.use(
      http.put(UPSTREAM, () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json(envelope(401, "UNAUTHORIZED"), { status: 401 })
          : HttpResponse.json({ viewerReaction: "like", likesCount: 1 });
      }),
      http.post(`${env.API_URL}/auth/refresh`, () =>
        HttpResponse.json({ access_token: "new-access", refresh_token: "new-refresh" })
      )
    );

    const res = await PUT(putRequest({ type: "like" }), ctx);

    expect(res.status).toBe(200);
    expect(calls).toBe(2);
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

    const res = await PUT(putRequest({ type: "like" }), ctx);

    expect(res.status).toBe(401);
    expect(((await res.json()) as { error: string }).error).toBe("UNAUTHORIZED");
  });
});

describe("DELETE /api/videos/{publicId}/reaction", () => {
  it("forwards to the upstream DELETE with the session bearer", async () => {
    let seenAuthorization: string | null = null;
    server.use(
      http.delete(UPSTREAM, ({ request }) => {
        seenAuthorization = request.headers.get("authorization");
        return HttpResponse.json({ viewerReaction: null, likesCount: 127 });
      })
    );

    const res = await DELETE(deleteRequest(), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ viewerReaction: null, likesCount: 127 });
    expect(seenAuthorization).toBe("Bearer access-token");
  });
});
