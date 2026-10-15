import { describe, it, expect, beforeAll } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { env } from "@/lib/env";

let POST: (req: Request) => Promise<Response>;

beforeAll(async () => {
  ({ POST } = await import("@/app/api/auth/resend-confirmation/route"));
});

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/auth/resend-confirmation", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/resend-confirmation", () => {
  it("forwards the email and returns 204 with no body and no cookie", async () => {
    const received: Record<string, unknown>[] = [];
    server.use(
      http.post(`${env.API_URL}/auth/resend-confirmation`, async ({ request }) => {
        received.push((await request.json()) as Record<string, unknown>);
        return new HttpResponse(null, { status: 204 });
      })
    );

    const res = await POST(makeRequest({ email: "alice@example.com" }));

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(received).toEqual([{ email: "alice@example.com" }]);
  });

  it("returns 400 with ApiErrorEnvelope for badrequest@example.com (reserved trigger)", async () => {
    const res = await POST(makeRequest({ email: "badrequest@example.com" }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({ statusCode: 400, error: "VALIDATION_FAILED" });
  });
});
