// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

// O "Sair" do sheet usa o mesmo useLogout da barra desktop, entregue pela
// SiteNavbar (home-busca/TD-07, Revision de 2026-10-11).
describe("NavigationSheet wired through the SiteNavbar", () => {
  const viewer = { name: "Joana Cria", nickname: "joana_cria" };

  async function sheetSignOutButton() {
    const user = userEvent.setup();
    render(<SiteNavbar viewer={viewer} />);
    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    const dialog = await screen.findByRole("dialog", { name: "Menu" });
    return { user, button: within(dialog).getByRole("button", { name: "Sair" }) };
  }

  it("posts to the logout route and goes to /login", async () => {
    const { user, button } = await sheetSignOutButton();

    await user.click(button);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
      });
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
  });

  it("disables Sair while the logout request is in flight", async () => {
    let releaseLogout: (value: Response) => void = () => {};
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        releaseLogout = resolve;
      })
    );
    const { user, button } = await sheetSignOutButton();

    await user.click(button);

    await waitFor(() => expect(button).toBeDisabled());
    releaseLogout(new Response(null, { status: 204 }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
  });
});
