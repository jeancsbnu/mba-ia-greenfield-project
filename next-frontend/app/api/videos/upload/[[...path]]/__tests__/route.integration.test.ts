import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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

let POST: (
  req: Request,
  ctx: { params: Promise<{ path?: string[] }> }
) => Promise<Response>;
let PATCH: typeof POST;
let setSession: (typeof import("@/lib/auth/session"))["setSession"];

beforeAll(async () => {
  ({ POST, PATCH } = await import("@/app/api/videos/upload/[[...path]]/route"));
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

function ctxWithPath(path?: string[]) {
  return { params: Promise.resolve({ path }) };
}

describe("POST /api/videos/upload", () => {
  it("proxies session creation and rewrites Location to a same-origin BFF path", async () => {
    const request = new Request("http://localhost/api/videos/upload", {
      method: "POST",
      headers: {
        "Tus-Resumable": "1.0.0",
        "Upload-Length": "1024",
      },
    });

    const res = await POST(request, ctxWithPath(undefined));

    expect(res.status).toBe(201);
    const location = res.headers.get("location");
    expect(location).toBeDefined();
    expect(location).toMatch(/^\/api\/videos\/upload\//);
  });

  it("passes UPLOAD_FILE_TOO_LARGE errors through verbatim", async () => {
    const request = new Request("http://localhost/api/videos/upload", {
      method: "POST",
      headers: {
        "Tus-Resumable": "1.0.0",
        "Upload-Length": String(10 * 1024 * 1024 * 1024 + 1),
      },
    });

    const res = await POST(request, ctxWithPath(undefined));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("UPLOAD_FILE_TOO_LARGE");
  });
});

describe("PATCH /api/videos/upload/[uploadId]", () => {
  it("proxies a chunk upload and returns the new Upload-Offset", async () => {
    const chunk = new Uint8Array([1, 2, 3, 4]);
    const request = new Request(
      "http://localhost/api/videos/upload/fixture-upload-1",
      {
        method: "PATCH",
        headers: {
          "Tus-Resumable": "1.0.0",
          "Upload-Offset": "0",
          "Content-Type": "application/offset+octet-stream",
        },
        body: chunk,
      }
    );

    const res = await PATCH(request, ctxWithPath(["fixture-upload-1"]));

    expect(res.status).toBe(204);
    expect(res.headers.get("upload-offset")).toBe("4");
  });
});
