import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { env } from "@/lib/env";
import { server } from "@/mocks/server";

const requestHeaders = vi.fn<() => Promise<Headers>>();

vi.mock("next/headers", () => ({ headers: () => requestHeaders() }));

let GET: (request: Request) => Promise<Response>;

beforeAll(async () => {
  ({ GET } = await import("@/app/auth/confirm-email/route"));
});

beforeEach(() => {
  requestHeaders.mockReset();
  requestHeaders.mockResolvedValue(new Headers());
});

function makeRequest(query = "") {
  return new Request(`http://localhost:8080/auth/confirm-email${query}`);
}

function expectRedirectToLogin(response: Response, outcome: string) {
  expect(response.status).toBe(303);
  // Relativo: não depende do host com que o servidor montou `request.url`.
  expect(response.headers.get("location")).toBe(
    `/login?confirmation=${outcome}`
  );
}

describe("GET /auth/confirm-email (ponte do BFF)", () => {
  it("confirms upstream and redirects to /login?confirmation=confirmed on 204", async () => {
    const response = await GET(makeRequest("?token=valid-token"));

    expectRedirectToLogin(response, "confirmed");
  });

  it("redirects with confirmation=invalid when the API rejects the token (401)", async () => {
    const response = await GET(
      makeRequest("?token=invalid-confirmation-token")
    );

    expectRedirectToLogin(response, "invalid");
  });

  it("redirects with confirmation=error on any other upstream failure", async () => {
    server.use(
      http.get(`${env.API_URL}/auth/confirm-email`, () =>
        HttpResponse.json(
          { statusCode: 429, error: "RATE_LIMIT_EXCEEDED", message: "Too many requests", code: null },
          { status: 429 }
        )
      )
    );

    const response = await GET(makeRequest("?token=valid-token"));

    expectRedirectToLogin(response, "error");
  });

  it("redirects with confirmation=invalid without calling the API when there is no token", async () => {
    const upstreamCall = vi.fn();
    server.use(
      http.get(`${env.API_URL}/auth/confirm-email`, () => {
        upstreamCall();
        return new HttpResponse(null, { status: 204 });
      })
    );

    const response = await GET(makeRequest());

    expectRedirectToLogin(response, "invalid");
    expect(upstreamCall).not.toHaveBeenCalled();
  });

  it("forwards the token with the visitor IP and the internal token", async () => {
    requestHeaders.mockResolvedValue(
      new Headers({ "x-forwarded-for": "203.0.113.9" })
    );
    const seen: { url: URL | null; headers: Headers | null } = {
      url: null,
      headers: null,
    };
    server.use(
      http.get(`${env.API_URL}/auth/confirm-email`, ({ request }) => {
        seen.url = new URL(request.url);
        seen.headers = request.headers;
        return new HttpResponse(null, { status: 204 });
      })
    );

    await GET(makeRequest("?token=abc123"));

    expect(seen.url?.searchParams.get("token")).toBe("abc123");
    expect(seen.headers?.get("x-client-ip")).toBe("203.0.113.9");
    expect(seen.headers?.get("x-internal-token")).toBe(env.INTERNAL_API_SECRET);
  });
});
