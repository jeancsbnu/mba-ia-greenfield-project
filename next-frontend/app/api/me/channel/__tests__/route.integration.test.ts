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

let PATCH: (req: Request) => Promise<Response>;
let setSession: (typeof import("@/lib/auth/session"))["setSession"];

beforeAll(async () => {
  ({ PATCH } = await import("@/app/api/me/channel/route"));
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

function patchRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/me/channel", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/me/channel", () => {
  it("forwards the body and the session bearer to the upstream", async () => {
    let seenBody: unknown = null;
    let seenAuthorization: string | null = null;

    server.use(
      http.patch(`${env.API_URL}/me/channel`, async ({ request }) => {
        seenAuthorization = request.headers.get("authorization");
        seenBody = await request.json();
        return HttpResponse.json({
          name: "Joana Nova",
          nickname: "joana_nova",
          description: null,
        });
      })
    );

    const res = await PATCH(patchRequest({ nickname: "joana_nova" }));

    expect(res.status).toBe(200);
    expect(seenAuthorization).toBe("Bearer access-token");
    expect(seenBody).toEqual({ nickname: "joana_nova" });
  });

  it("passes a 409 status and body through unchanged", async () => {
    server.use(
      http.patch(`${env.API_URL}/me/channel`, () =>
        HttpResponse.json(
          {
            statusCode: 409,
            error: "NICKNAME_ALREADY_EXISTS",
            message: "Nickname já usado",
            code: null,
          },
          { status: 409 }
        )
      )
    );

    const res = await PATCH(patchRequest({ nickname: "ocupado" }));

    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("NICKNAME_ALREADY_EXISTS");
  });

  it("refreshes the session on a 401 and retries", async () => {
    let attempts = 0;

    server.use(
      http.patch(`${env.API_URL}/me/channel`, () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json({}, { status: 401 })
          : HttpResponse.json({
              name: "Joana",
              nickname: "joana",
              description: null,
            });
      }),
      http.post(`${env.API_URL}/auth/refresh`, () =>
        HttpResponse.json({
          access_token: "new-access-token",
          refresh_token: "new-refresh-token",
        })
      )
    );

    const res = await PATCH(patchRequest({ name: "Joana" }));

    // O corpo é lido antes do fetcher justamente para sobreviver ao retry.
    expect(attempts).toBe(2);
    expect(res.status).toBe(200);
  });

  it("gives up with 401 when the refresh itself fails", async () => {
    server.use(
      http.patch(`${env.API_URL}/me/channel`, () =>
        HttpResponse.json({}, { status: 401 })
      ),
      http.post(`${env.API_URL}/auth/refresh`, () =>
        HttpResponse.json({}, { status: 401 })
      )
    );

    const res = await PATCH(patchRequest({ name: "Joana" }));
    expect(res.status).toBe(401);
  });
});
