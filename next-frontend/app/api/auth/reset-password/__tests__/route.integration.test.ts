import { describe, it, expect, beforeAll } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { env } from "@/lib/env";

let POST: (req: Request) => Promise<Response>;

beforeAll(async () => {
  ({ POST } = await import("@/app/api/auth/reset-password/route"));
});

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/auth/reset-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/reset-password", () => {
  it("forwards token and new_password and returns 204 with no body and no cookie", async () => {
    const received: Record<string, unknown>[] = [];
    server.use(
      http.post(`${env.API_URL}/auth/reset-password`, async ({ request }) => {
        received.push((await request.json()) as Record<string, unknown>);
        return new HttpResponse(null, { status: 204 });
      })
    );

    const res = await POST(
      makeRequest({ token: "valid-reset-token", new_password: "novaSenha123" })
    );

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(received).toEqual([
      { token: "valid-reset-token", new_password: "novaSenha123" },
    ]);
  });

  it("passes the 401 envelope through for invalid-reset-token (reserved trigger)", async () => {
    const res = await POST(
      makeRequest({ token: "invalid-reset-token", new_password: "novaSenha123" })
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toMatchObject({ statusCode: 401, error: "INVALID_TOKEN" });
  });

  it("passes a 400 validation envelope through", async () => {
    server.use(
      http.post(`${env.API_URL}/auth/reset-password`, () =>
        HttpResponse.json(
          {
            statusCode: 400,
            error: "VALIDATION_FAILED",
            message: ["new_password must be longer than or equal to 8 characters"],
            code: null,
          },
          { status: 400 }
        )
      )
    );

    const res = await POST(makeRequest({ token: "t", new_password: "curta" }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({ statusCode: 400, error: "VALIDATION_FAILED" });
  });
});
