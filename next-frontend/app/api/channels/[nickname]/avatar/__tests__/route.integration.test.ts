import { describe, it, expect, beforeAll, vi } from "vitest";
import { http, HttpResponse } from "msw";

import { env } from "@/lib/env";
import { server } from "@/mocks/server";

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(new Headers()),
}));

let GET: (
  request: Request,
  ctx: { params: Promise<{ nickname: string }> }
) => Promise<Response>;

beforeAll(async () => {
  ({ GET } = await import("@/app/api/channels/[nickname]/avatar/route"));
});

function call(nickname: string) {
  return GET(new Request(`http://localhost/api/channels/${nickname}/avatar`), {
    params: Promise.resolve({ nickname }),
  });
}

describe("GET /api/channels/[nickname]/avatar", () => {
  it("passes the upstream 302 through without following it", async () => {
    server.use(
      http.get(`${env.API_URL}/channels/:nickname/avatar`, () =>
        new HttpResponse(null, {
          status: 302,
          headers: { Location: "https://storage.example/avatars/a.png?sig=1" },
        })
      )
    );

    const res = await call("joana_cria");

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "https://storage.example/avatars/a.png?sig=1"
    );
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("answers 404 when the channel has no avatar", async () => {
    const res = await call("sem_foto");

    expect(res.status).toBe(404);
    expect(res.headers.get("location")).toBeNull();
  });
});
