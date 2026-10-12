// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

import { SiteNavbar } from "../site-navbar";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh, prefetch: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// O logout é same-origin (/api/auth/logout), então não passa pelo MSW, que só
// finge a API upstream. Aqui o alvo é o fetch do próprio Route Handler.
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

// O UserMenu recebe o logout da SiteNavbar, que o tira do useLogout
// (home-busca/TD-07, Revision de 2026-10-11).
describe("UserMenu wired through the SiteNavbar", () => {
  const viewer = { name: "Joana Cria", nickname: "joana_cria" };

  it("calls POST /api/auth/logout and navigates to /login on sign out", async () => {
    const user = userEvent.setup();
    render(<SiteNavbar viewer={viewer} />);

    await user.click(screen.getByRole("button", { name: "Sair" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
      });
    });
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/login");
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("disables the button while the logout request is in flight", async () => {
    const user = userEvent.setup();
    let releaseLogout: (value: Response) => void = () => {};
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        releaseLogout = resolve;
      })
    );

    render(<SiteNavbar viewer={viewer} />);
    const button = screen.getByRole("button", { name: "Sair" });

    await user.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });

    releaseLogout(new Response(null, { status: 204 }));
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/login");
    });
  });
});
