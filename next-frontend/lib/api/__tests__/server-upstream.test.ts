import { http, HttpResponse } from "msw";
import { vi, describe, it, expect, beforeAll, beforeEach } from "vitest";

import { env } from "@/lib/env";
import { server } from "@/mocks/server";

// Cookie store compartilhado para a sessão real — mesmo padrão de
// lib/auth/__tests__/refresh.integration.test.ts.
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

// redirect() do Next interrompe a execução lançando. Reproduzimos isso para que
// o teste veja o mesmo fluxo de controle do runtime real.
class RedirectError extends Error {
  constructor(public readonly to: string) {
    super(`NEXT_REDIRECT:${to}`);
  }
}

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new RedirectError(to);
  },
}));

// Importados dentro de beforeAll, como nas demais suítes de BFF: o cliente
// openapi-fetch captura globalThis.fetch ao ser criado, então precisa nascer
// depois de o MSW ter substituído o fetch global — caso contrário a chamada
// escapa para a rede de verdade.
let fetchFromUpstream: typeof import("@/lib/api/server-upstream").fetchFromUpstream;
let upstream: typeof import("@/lib/api/upstream").upstream;
let setSession: typeof import("@/lib/auth/session").setSession;

beforeAll(async () => {
  ({ fetchFromUpstream } = await import("@/lib/api/server-upstream"));
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

const readChannel = (returnTo: string) =>
  fetchFromUpstream((init) => upstream.GET("/me/channel", init), returnTo);

beforeEach(() => {
  cookieMap.clear();
});

describe("fetchFromUpstream", () => {
  it("redirects to /login when there is no session", async () => {
    await expect(readChannel("/channel/videos")).rejects.toMatchObject({
      to: "/login",
    });
  });

  it("returns the upstream data and sends the session bearer", async () => {
    await setSession(SEED_SESSION);
    let seenAuthorization: string | null = null;

    server.use(
      http.get(`${env.API_URL}/me/channel`, ({ request }) => {
        seenAuthorization = request.headers.get("authorization");
        return HttpResponse.json({
          name: "Joana Cria",
          nickname: "joana_cria",
          description: null,
        });
      })
    );

    const channel = await readChannel("/channel/videos");

    expect(channel.name).toBe("Joana Cria");
    expect(seenAuthorization).toBe(`Bearer ${SEED_SESSION.accessToken}`);
  });

  it("redirects a 401 to the refresh route carrying returnTo", async () => {
    await setSession(SEED_SESSION);
    server.use(
      http.get(`${env.API_URL}/me/channel`, () =>
        HttpResponse.json({}, { status: 401 })
      )
    );

    await expect(readChannel("/channel/settings")).rejects.toMatchObject({
      to: "/api/auth/refresh?returnTo=%2Fchannel%2Fsettings",
    });
  });

  it("redirects a second 401 to /login instead of looping", async () => {
    await setSession(SEED_SESSION);
    server.use(
      http.get(`${env.API_URL}/me/channel`, () =>
        HttpResponse.json({}, { status: 401 })
      )
    );

    // A URL já carrega a marca posta pela rota de refresh: renovar não resolveu.
    await expect(
      readChannel("/channel/settings?session_refreshed=1")
    ).rejects.toMatchObject({ to: "/login" });
  });

  it("throws on a non-auth upstream failure instead of redirecting", async () => {
    await setSession(SEED_SESSION);
    server.use(
      http.get(`${env.API_URL}/me/channel`, () =>
        HttpResponse.json({}, { status: 500 })
      )
    );

    const error = await readChannel("/channel/videos").catch(
      (caught: unknown) => caught
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(RedirectError);
    expect((error as Error).message).toContain("500");
  });
});
