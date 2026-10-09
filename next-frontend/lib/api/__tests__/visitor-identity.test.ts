import { beforeEach, describe, expect, it, vi } from "vitest";

const requestHeaders = vi.fn<() => Promise<Headers>>();

vi.mock("next/headers", () => ({ headers: () => requestHeaders() }));

const { visitorIdentityHeaders } = await import("@/lib/api/visitor-identity");
const { env } = await import("@/lib/env");

const withForwardedFor = (value: string) =>
  requestHeaders.mockResolvedValue(new Headers({ "x-forwarded-for": value }));

beforeEach(() => {
  requestHeaders.mockReset();
});

describe("visitorIdentityHeaders", () => {
  it("sends the visitor IP and the internal token", async () => {
    withForwardedFor("203.0.113.7");

    expect(await visitorIdentityHeaders()).toEqual({
      "X-Client-IP": "203.0.113.7",
      "X-Internal-Token": env.INTERNAL_API_SECRET,
    });
  });

  it("takes the first, trimmed value of a multi-hop x-forwarded-for", async () => {
    withForwardedFor(" 203.0.113.7 , 10.0.0.1, 172.19.0.1");

    const identity = await visitorIdentityHeaders();

    expect(identity["X-Client-IP"]).toBe("203.0.113.7");
  });

  it("omits X-Client-IP when the request has no x-forwarded-for", async () => {
    requestHeaders.mockResolvedValue(new Headers());

    expect(await visitorIdentityHeaders()).toEqual({
      "X-Internal-Token": env.INTERNAL_API_SECRET,
    });
  });

  it("degrades without throwing outside a request scope", async () => {
    requestHeaders.mockRejectedValue(
      new Error("`headers` was called outside a request scope.")
    );

    expect(await visitorIdentityHeaders()).toEqual({
      "X-Internal-Token": env.INTERNAL_API_SECRET,
    });
  });
});
