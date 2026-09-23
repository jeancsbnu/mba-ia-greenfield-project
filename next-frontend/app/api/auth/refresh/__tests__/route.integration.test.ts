import { http, HttpResponse } from "msw";
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

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

let GET: (req: NextRequestLike) => Promise<Response>;
let setSession: typeof import("@/lib/auth/session").setSession;
let getSession: typeof import("@/lib/auth/session").getSession;

// A rota lê request.nextUrl; o NextRequest real basta ser construído a partir
// de uma Request comum.
type NextRequestLike = import("next/server").NextRequest;

beforeAll(async () => {
  ({ GET } = await import("@/app/api/auth/refresh/route"));
  ({ setSession, getSession } = await import("@/lib/auth/session"));
});

const SEED_SESSION = {
  accessToken: "old-access-token",
  refreshToken: "old-refresh-token",
  userId: "user-1",
  email: "alice@example.com",
  channelSlug: "",
};

async function makeRequest(url: string): Promise<NextRequestLike> {
  const { NextRequest } = await import("next/server");
  return new NextRequest(new Request(`http://localhost${url}`));
}

function upstreamRefreshSucceeds() {
  server.use(
    http.post(`${env.API_URL}/auth/refresh`, () =>
      HttpResponse.json({
        access_token: "new-access-token",
        refresh_token: "new-refresh-token",
      })
    )
  );
}

function upstreamRefreshFails() {
  server.use(
    http.post(`${env.API_URL}/auth/refresh`, () =>
      HttpResponse.json({}, { status: 401 })
    )
  );
}

beforeEach(async () => {
  cookieMap.clear();
  await setSession(SEED_SESSION);
});

describe("GET /api/auth/refresh", () => {
  it("redirects to returnTo with renewed tokens", async () => {
    upstreamRefreshSucceeds();

    const res = await GET(await makeRequest("/api/auth/refresh?returnTo=/channel/videos"));

    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location") as string);
    expect(location.pathname).toBe("/channel/videos");
    // A marca é o que impede o laço de refresh no server-upstream.
    expect(location.searchParams.get("session_refreshed")).toBe("1");

    const session = await getSession();
    expect(session.accessToken).toBe("new-access-token");
    expect(session.refreshToken).toBe("new-refresh-token");
  });

  it("redirects to /login and destroys the session when the refresh token is rejected", async () => {
    upstreamRefreshFails();

    const res = await GET(await makeRequest("/api/auth/refresh?returnTo=/channel/videos"));

    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location") as string).pathname).toBe(
      "/login"
    );

    const session = await getSession();
    expect(session.isLoggedIn).toBeFalsy();
  });

  it("ignores an external returnTo and falls back to the panel", async () => {
    upstreamRefreshSucceeds();

    const res = await GET(
      await makeRequest("/api/auth/refresh?returnTo=https://outro.site")
    );

    const location = new URL(res.headers.get("location") as string);
    expect(location.host).toBe("localhost");
    expect(location.pathname).toBe("/channel/videos");
  });

  it("ignores a protocol-relative returnTo", async () => {
    upstreamRefreshSucceeds();

    // "//outro.site" começa com "/" mas o navegador o trataria como host
    // externo — seria um open redirect se passasse pela checagem ingênua.
    const res = await GET(
      await makeRequest("/api/auth/refresh?returnTo=//outro.site")
    );

    const location = new URL(res.headers.get("location") as string);
    expect(location.host).toBe("localhost");
    expect(location.pathname).toBe("/channel/videos");
  });

  it("falls back to the panel when returnTo is absent", async () => {
    upstreamRefreshSucceeds();

    const res = await GET(await makeRequest("/api/auth/refresh"));

    expect(new URL(res.headers.get("location") as string).pathname).toBe(
      "/channel/videos"
    );
  });
});
