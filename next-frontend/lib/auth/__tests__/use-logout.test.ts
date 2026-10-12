// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useLogout } from "../use-logout";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

// O logout é same-origin (/api/auth/logout), então não passa pelo MSW, que só
// finge a API upstream. O alvo aqui é o fetch do próprio Route Handler.
const fetchMock = vi.fn();

beforeEach(() => {
  push.mockClear();
  refresh.mockClear();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useLogout", () => {
  it("posts to the logout route, then navigates to /login and refreshes", async () => {
    const { result } = renderHook(() => useLogout());

    await act(() => result.current.signOut());

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
    });
    expect(push).toHaveBeenCalledWith("/login");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("reports isSigningOut while the request is in flight", async () => {
    let releaseLogout: (value: Response) => void = () => {};
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        releaseLogout = resolve;
      })
    );
    const { result } = renderHook(() => useLogout());
    expect(result.current.isSigningOut).toBe(false);

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.signOut();
    });
    await waitFor(() => expect(result.current.isSigningOut).toBe(true));

    await act(async () => {
      releaseLogout(new Response(null, { status: 204 }));
      await pending;
    });
    expect(result.current.isSigningOut).toBe(false);
  });
});
