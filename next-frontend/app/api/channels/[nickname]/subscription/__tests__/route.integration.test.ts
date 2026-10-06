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

type Handler = (
  req: Request,
  ctx: { params: Promise<{ nickname: string }> }
) => Promise<Response>;
let PUT: Handler;
let DELETE: Handler;
let setSession: (typeof import("@/lib/auth/session"))["setSession"];

beforeAll(async () => {
  ({ PUT, DELETE } = await import("@/app/api/channels/[nickname]/subscription/route"));
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

const ctx = { params: Promise.resolve({ nickname: "joana_cria" }) };
const UPSTREAM = `${env.API_URL}/channels/joana_cria/subscription`;
const request = (method: string) =>
  new Request("http://localhost/api/channels/joana_cria/subscription", { method });

function envelope(statusCode: number, error: string) {
  return { statusCode, error, message: error, code: null };
}

describe("PUT /api/channels/{nickname}/subscription", () => {
  it("subscribes with the session bearer and passes the state through", async () => {
    let seenAuthorization: string | null = null;
    server.use(
      http.put(UPSTREAM, ({ request }) => {
        seenAuthorization = request.headers.get("authorization");
        return HttpResponse.json({ subscribed: true, subscribersCount: 13 });
      })
    );

    const res = await PUT(request("PUT"), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ subscribed: true, subscribersCount: 13 });
    expect(seenAuthorization).toBe("Bearer access-token");
  });

  it.each([
    [404, "CHANNEL_NOT_FOUND"],
    [429, "RATE_LIMIT_EXCEEDED"],
  ])("passes a %i through unchanged", async (status, error) => {
    server.use(
      http.put(UPSTREAM, () => HttpResponse.json(envelope(status, error), { status }))
    );

    const res = await PUT(request("PUT"), ctx);

    expect(res.status).toBe(status);
    expect(((await res.json()) as { error: string }).error).toBe(error);
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

    const res = await PUT(request("PUT"), ctx);

    expect(res.status).toBe(401);
    expect(((await res.json()) as { error: string }).error).toBe("UNAUTHORIZED");
  });
});

describe("DELETE /api/channels/{nickname}/subscription", () => {
  it("unsubscribes and passes the state through", async () => {
    server.use(
      http.delete(UPSTREAM, () =>
        HttpResponse.json({ subscribed: false, subscribersCount: 12 })
      )
    );

    const res = await DELETE(request("DELETE"), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ subscribed: false, subscribersCount: 12 });
  });

  it("returns 401 UNAUTHORIZED when the refresh fails", async () => {
    server.use(
      http.delete(UPSTREAM, () =>
        HttpResponse.json(envelope(401, "UNAUTHORIZED"), { status: 401 })
      ),
      http.post(`${env.API_URL}/auth/refresh`, () =>
        HttpResponse.json(envelope(401, "INVALID_TOKEN"), { status: 401 })
      )
    );

    const res = await DELETE(request("DELETE"), ctx);

    expect(res.status).toBe(401);
  });
});
