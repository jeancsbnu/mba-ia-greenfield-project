import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";

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

let GET: (
  req: Request,
  ctx: { params: Promise<{ publicId: string }> }
) => Promise<Response>;
let PATCH: (
  req: Request,
  ctx: { params: Promise<{ publicId: string }> }
) => Promise<Response>;
let setSession: (typeof import("@/lib/auth/session"))["setSession"];

beforeAll(async () => {
  ({ GET, PATCH } = await import("@/app/api/videos/[publicId]/route"));
  ({ setSession } = await import("@/lib/auth/session"));
});

beforeEach(async () => {
  cookieMap.clear();
  await setSession({
    accessToken: "at-abc",
    refreshToken: "rt-xyz",
    userId: "user-1",
    email: "alice@example.com",
    channelSlug: "alice-channel",
  });
});

function makeRequest(publicId: string) {
  return {
    request: new Request(`http://localhost/api/videos/${publicId}`),
    ctx: { params: Promise.resolve({ publicId }) },
  };
}

describe("GET /api/videos/[publicId]", () => {
  it("proxies the upstream video status on success", async () => {
    const { request, ctx } = makeRequest("ready-video");
    const res = await GET(request, ctx);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ publicId: "ready-video", status: "ready" });
  });

  it("maps an upstream 404 to a 404 BFF response", async () => {
    const { request, ctx } = makeRequest("missing-video");
    const res = await GET(request, ctx);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("VIDEO_NOT_FOUND");
  });

  it("maps an upstream 403 to a 403 BFF response", async () => {
    server.use(
      http.get(`${env.API_URL}/videos/:publicId`, () =>
        HttpResponse.json(
          { statusCode: 403, error: "FORBIDDEN", message: "Forbidden", code: null },
          { status: 403 }
        )
      )
    );

    const { request, ctx } = makeRequest("someone-elses-video");
    const res = await GET(request, ctx);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("FORBIDDEN");
  });
});

describe("PATCH /api/videos/[publicId]", () => {
  const PUBLIC_ID = "abc123";

  function patchRequest(body: FormData): Request {
    return new Request(`http://localhost/api/videos/${PUBLIC_ID}`, {
      method: "PATCH",
      body,
    });
  }

  function ctx() {
    return { params: Promise.resolve({ publicId: PUBLIC_ID }) };
  }

  function formWith(entries: Record<string, string>): FormData {
    const body = new FormData();
    for (const [key, value] of Object.entries(entries)) body.set(key, value);
    return body;
  }

  it("forwards the multipart fields to the upstream", async () => {
    let seenTitle: FormDataEntryValue | null = null;
    let seenContentType: string | null = null;
    let seenAuthorization: string | null = null;

    server.use(
      http.patch(`${env.API_URL}/videos/:publicId`, async ({ request }) => {
        seenContentType = request.headers.get("content-type");
        seenAuthorization = request.headers.get("authorization");
        seenTitle = (await request.formData()).get("title");
        return HttpResponse.json({ publicId: PUBLIC_ID, title: "Novo" });
      })
    );

    const res = await PATCH(
      patchRequest(formWith({ title: "Novo", published: "true" })),
      ctx()
    );

    expect(res.status).toBe(200);
    expect(seenTitle).toBe("Novo");
    expect(seenAuthorization).toContain("Bearer ");
    // O boundary tem de ser gerado pelo fetch: defini-lo à mão quebraria o
    // parsing do multipart no upstream.
    expect(seenContentType).toContain("multipart/form-data; boundary=");
  });

  it("passes the upstream error status and body through unchanged", async () => {
    server.use(
      http.patch(`${env.API_URL}/videos/:publicId`, () =>
        HttpResponse.json(
          {
            statusCode: 409,
            error: "VIDEO_NOT_PUBLISHABLE",
            message: "Ainda processando",
            code: null,
          },
          { status: 409 }
        )
      )
    );

    const res = await PATCH(
      patchRequest(formWith({ published: "true" })),
      ctx()
    );

    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe("VIDEO_NOT_PUBLISHABLE");
    expect(body.message).toBe("Ainda processando");
  });

  it("refreshes the session on a 401 and retries the request", async () => {
    let attempts = 0;

    server.use(
      http.patch(`${env.API_URL}/videos/:publicId`, () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json({}, { status: 401 })
          : HttpResponse.json({ publicId: PUBLIC_ID });
      }),
      http.post(`${env.API_URL}/auth/refresh`, () =>
        HttpResponse.json({
          access_token: "new-access-token",
          refresh_token: "new-refresh-token",
        })
      )
    );

    const res = await PATCH(patchRequest(formWith({ title: "Novo" })), ctx());

    // O corpo é lido antes do fetcher justamente para sobreviver ao retry:
    // um Request já consumido não pode ser lido de novo.
    expect(attempts).toBe(2);
    expect(res.status).toBe(200);
  });

  it("gives up with 401 when the refresh itself fails", async () => {
    server.use(
      http.patch(`${env.API_URL}/videos/:publicId`, () =>
        HttpResponse.json({}, { status: 401 })
      ),
      http.post(`${env.API_URL}/auth/refresh`, () =>
        HttpResponse.json({}, { status: 401 })
      )
    );

    const res = await PATCH(patchRequest(formWith({ title: "Novo" })), ctx());
    expect(res.status).toBe(401);
  });
});
