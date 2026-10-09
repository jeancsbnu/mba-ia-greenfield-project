import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { env } from "@/lib/env";
import { server } from "@/mocks/server";

const requestHeaders = vi.fn<() => Promise<Headers>>();

vi.mock("next/headers", () => ({ headers: () => requestHeaders() }));

// Importado depois de o MSW trocar o fetch global, como nas demais suítes de
// BFF — senão a chamada escapa para a rede de verdade.
let upstream: typeof import("@/lib/api/upstream").upstream;

beforeAll(async () => {
  ({ upstream } = await import("@/lib/api/upstream"));
});

beforeEach(() => {
  requestHeaders.mockReset();
});

/** Captura os headers com que a chamada chegou ao upstream (Nest). */
function captureMeChannelHeaders(): { seen: Headers | null } {
  const capture: { seen: Headers | null } = { seen: null };
  server.use(
    http.get(`${env.API_URL}/me/channel`, ({ request }) => {
      capture.seen = request.headers;
      return HttpResponse.json({
        name: "Joana Cria",
        nickname: "joana_cria",
        description: null,
      });
    })
  );
  return capture;
}

describe("upstream client — visitor identity", () => {
  it("sends the visitor IP and the internal token to the API", async () => {
    requestHeaders.mockResolvedValue(
      new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" })
    );
    const capture = captureMeChannelHeaders();

    await upstream.GET("/me/channel");

    expect(capture.seen?.get("x-client-ip")).toBe("203.0.113.7");
    expect(capture.seen?.get("x-internal-token")).toBe(env.INTERNAL_API_SECRET);
  });

  it("sends no X-Client-IP when the visitor request has none", async () => {
    requestHeaders.mockResolvedValue(new Headers());
    const capture = captureMeChannelHeaders();

    await upstream.GET("/me/channel");

    expect(capture.seen?.has("x-client-ip")).toBe(false);
    expect(capture.seen?.get("x-internal-token")).toBe(env.INTERNAL_API_SECRET);
  });

  it("keeps the caller's Authorization header untouched", async () => {
    requestHeaders.mockResolvedValue(
      new Headers({ "x-forwarded-for": "203.0.113.7" })
    );
    const capture = captureMeChannelHeaders();

    await upstream.GET("/me/channel", {
      headers: { Authorization: "Bearer access-token" },
    });

    expect(capture.seen?.get("authorization")).toBe("Bearer access-token");
    expect(capture.seen?.get("x-client-ip")).toBe("203.0.113.7");
  });
});
