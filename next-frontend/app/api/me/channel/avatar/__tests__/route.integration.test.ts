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
  headers: () => Promise.resolve(new Headers()),
}));

let PUT: (req: Request) => Promise<Response>;
let DELETE: () => Promise<Response>;
let setSession: (typeof import("@/lib/auth/session"))["setSession"];

beforeAll(async () => {
  ({ PUT, DELETE } = await import("@/app/api/me/channel/avatar/route"));
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

function putRequest(): Request {
  const form = new FormData();
  form.append("avatar", new Blob(["png-bytes"], { type: "image/png" }), "a.png");
  return new Request("http://localhost/api/me/channel/avatar", {
    method: "PUT",
    body: form,
  });
}

describe("PUT /api/me/channel/avatar", () => {
  it("forwards the multipart file with the session bearer and answers 204", async () => {
    let seenAuthorization: string | null = null;
    let seenFile: File | null = null;
    server.use(
      http.put(`${env.API_URL}/me/channel/avatar`, async ({ request }) => {
        seenAuthorization = request.headers.get("authorization");
        seenFile = (await request.formData()).get("avatar") as File;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const res = await PUT(putRequest());

    expect(res.status).toBe(204);
    expect(seenAuthorization).toBe("Bearer access-token");
    expect(seenFile).not.toBeNull();
    expect((seenFile as unknown as File).type).toBe("image/png");
  });

  it("passes a 400 envelope through", async () => {
    server.use(
      http.put(`${env.API_URL}/me/channel/avatar`, () =>
        HttpResponse.json(
          {
            statusCode: 400,
            error: "VALIDATION_FAILED",
            message: "Validation failed (expected type is /^image\\/(jpeg|png|webp)$/)",
            code: null,
          },
          { status: 400 }
        )
      )
    );

    const res = await PUT(putRequest());

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ statusCode: 400 });
  });
});

describe("DELETE /api/me/channel/avatar", () => {
  it("removes with the session bearer and answers 204", async () => {
    let seenAuthorization: string | null = null;
    server.use(
      http.delete(`${env.API_URL}/me/channel/avatar`, ({ request }) => {
        seenAuthorization = request.headers.get("authorization");
        return new HttpResponse(null, { status: 204 });
      })
    );

    const res = await DELETE();

    expect(res.status).toBe(204);
    expect(seenAuthorization).toBe("Bearer access-token");
  });
});
