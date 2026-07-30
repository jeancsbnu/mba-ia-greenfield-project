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
let setSession: (typeof import("@/lib/auth/session"))["setSession"];

beforeAll(async () => {
  ({ GET } = await import("@/app/api/videos/[publicId]/route"));
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
