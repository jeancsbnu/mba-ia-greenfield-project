import { http, HttpResponse } from "msw";
import { vi, describe, it, expect, beforeAll, beforeEach } from "vitest";

import { env } from "@/lib/env";
import { server } from "@/mocks/server";

// Cookie store compartilhado para a sessão real — mesmo padrão de
// lib/api/__tests__/server-upstream.test.ts.
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

const redirect = vi.fn((to: string) => {
  throw new Error(`NEXT_REDIRECT:${to}`);
});

vi.mock("next/navigation", () => ({
  redirect: (to: string) => redirect(to),
}));

// Importados depois do MSW trocar o fetch global, como nas demais suítes.
let fetchWithOptionalAuth: typeof import("@/lib/api/optional-auth").fetchWithOptionalAuth;
let upstream: typeof import("@/lib/api/upstream").upstream;
let setSession: typeof import("@/lib/auth/session").setSession;

beforeAll(async () => {
  ({ fetchWithOptionalAuth } = await import("@/lib/api/optional-auth"));
  ({ upstream } = await import("@/lib/api/upstream"));
  ({ setSession } = await import("@/lib/auth/session"));
});

const SEED_SESSION = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  userId: "user-1",
  email: "alice@example.com",
  channelSlug: "",
};

const PUBLIC_PATH = `${env.API_URL}/channels/:nickname`;

const readChannel = () =>
  fetchWithOptionalAuth((init) =>
    upstream.GET("/channels/{nickname}", {
      params: { path: { nickname: "joana_cria" } },
      ...init,
    })
  );

// Captura o Authorization de cada chamada ao upstream, na ordem.
function recordAuthorization(status: (auth: string | null) => number) {
  const seen: (string | null)[] = [];
  server.use(
    http.get(PUBLIC_PATH, ({ request }) => {
      const auth = request.headers.get("authorization");
      seen.push(auth);
      const code = status(auth);
      return code === 200
        ? HttpResponse.json({
            name: "Joana Cria",
            nickname: "joana_cria",
            description: null,
            videosCount: 0,
            subscribersCount: 3,
            viewerSubscribed: auth !== null,
          })
        : HttpResponse.json(
            { statusCode: code, error: "UNAUTHORIZED", message: "Unauthorized" },
            { status: code }
          );
    })
  );
  return seen;
}

describe("fetchWithOptionalAuth", () => {
  beforeEach(() => {
    cookieMap.clear();
    redirect.mockClear();
  });

  it("calls the upstream without Authorization when there is no session", async () => {
    const seen = recordAuthorization(() => 200);

    const { data } = await readChannel();

    expect(seen).toEqual([null]);
    expect(data?.viewerSubscribed).toBe(false);
  });

  it("attaches the session bearer when there is a session", async () => {
    await setSession(SEED_SESSION);
    const seen = recordAuthorization(() => 200);

    const { data } = await readChannel();

    expect(seen).toEqual(["Bearer access-token"]);
    expect(data?.viewerSubscribed).toBe(true);
  });

  it("repeats the call anonymously when the upstream rejects the token", async () => {
    await setSession(SEED_SESSION);
    const seen = recordAuthorization((auth) => (auth ? 401 : 200));

    const { data, response } = await readChannel();

    expect(seen).toEqual(["Bearer access-token", null]);
    expect(response.status).toBe(200);
    expect(data?.viewerSubscribed).toBe(false);
  });

  it("never redirects and never touches the session cookie", async () => {
    await setSession(SEED_SESSION);
    const cookiesBefore = new Map(cookieMap);
    recordAuthorization((auth) => (auth ? 401 : 200));

    await readChannel();

    expect(redirect).not.toHaveBeenCalled();
    expect(cookieMap).toEqual(cookiesBefore);
  });
});
