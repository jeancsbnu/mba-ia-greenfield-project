// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SiteNavbar } from "../site-navbar";

const { pathnameMock, searchParamsMock } = vi.hoisted(() => ({
  pathnameMock: vi.fn(() => "/"),
  searchParamsMock: vi.fn(() => new URLSearchParams()),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
  useSearchParams: () => searchParamsMock(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));

const VIEWER = { name: "Joana Cria", nickname: "joana_cria" };

function navLinks() {
  return within(
    screen.getByRole("navigation", { name: "Navegação principal" })
  ).getAllByRole("link");
}

beforeEach(() => {
  pathnameMock.mockReturnValue("/");
  searchParamsMock.mockReturnValue(new URLSearchParams());
});

describe("SiteNavbar", () => {
  it("renders the brand logo linking to the home page inside a banner", () => {
    render(<SiteNavbar viewer={null} />);

    expect(screen.getByRole("banner")).toHaveAttribute(
      "data-slot",
      "site-navbar"
    );
    expect(screen.getByRole("link", { name: "StreamTube" })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("offers Início, the search and Entrar to an anonymous visitor, without studio links", () => {
    render(<SiteNavbar viewer={null} />);

    expect(navLinks().map((link) => link.textContent)).toEqual(["Início"]);
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute(
      "href",
      "/login"
    );
    expect(
      screen.queryByRole("button", { name: "Sair" })
    ).not.toBeInTheDocument();
  });

  it("offers the studio links and the user menu to a signed-in viewer", () => {
    render(<SiteNavbar viewer={VIEWER} />);

    expect(
      navLinks().map((link) => [link.textContent, link.getAttribute("href")])
    ).toEqual([
      ["Início", "/"],
      ["Canais seguidos", "/channel/subscriptions"],
      ["Meus vídeos", "/channel/videos"],
    ]);
    expect(screen.getByRole("link", { name: "Seu canal" })).toHaveAttribute(
      "href",
      "/@joana_cria"
    );
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Entrar" })
    ).not.toBeInTheDocument();
  });

  it("marks the link of the current route as the current page", () => {
    pathnameMock.mockReturnValue("/channel/subscriptions");
    render(<SiteNavbar viewer={VIEWER} />);

    const current = navLinks().filter(
      (link) => link.getAttribute("aria-current") === "page"
    );
    expect(current.map((link) => link.textContent)).toEqual([
      "Canais seguidos",
    ]);
  });

  it("marks no link on /results and fills the search with q", () => {
    pathnameMock.mockReturnValue("/results");
    searchParamsMock.mockReturnValue(new URLSearchParams("q=docker"));
    render(<SiteNavbar viewer={VIEWER} />);

    expect(
      navLinks().filter((link) => link.hasAttribute("aria-current"))
    ).toHaveLength(0);
    // A barra desktop e a busca mobile (que nasce aberta em /results).
    for (const searchbox of screen.getAllByRole("searchbox")) {
      expect(searchbox).toHaveValue("docker");
    }
  });

  // Barra fechada do mobile (SI-07.13b): só as ações de busca e de menu.
  describe("mobile bar", () => {
    function actions() {
      return document.querySelector(
        "[data-slot='navbar-actions']"
      ) as HTMLElement;
    }

    it("keeps Entrar and the avatar out of the closed bar", () => {
      const { unmount } = render(<SiteNavbar viewer={null} />);
      expect(
        within(actions()).queryByRole("link", { name: "Entrar" })
      ).not.toBeInTheDocument();
      unmount();

      render(<SiteNavbar viewer={VIEWER} />);
      expect(
        within(actions()).queryByRole("link", { name: "Seu canal" })
      ).not.toBeInTheDocument();
      expect(
        within(actions()).getAllByRole("button").map((b) => b.getAttribute("aria-label"))
      ).toEqual(["Buscar", "Abrir menu"]);
    });

    it("expands the search over the bar and focuses the field", async () => {
      const user = userEvent.setup();
      render(<SiteNavbar viewer={null} />);
      const toggle = within(actions()).getByRole("button", { name: "Buscar" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");

      await user.click(toggle);

      expect(toggle).toHaveAttribute("aria-expanded", "true");
      const form = document.getElementById(
        toggle.getAttribute("aria-controls") ?? ""
      ) as HTMLElement;
      expect(within(form).getByRole("searchbox")).toHaveFocus();
      expect(toggle).toHaveAttribute("type", "submit");
    });

    it("opens the navigation sheet with the viewer", async () => {
      const user = userEvent.setup();
      render(<SiteNavbar viewer={VIEWER} />);

      await user.click(screen.getByRole("button", { name: "Abrir menu" }));

      const dialog = await screen.findByRole("dialog", { name: "Menu" });
      expect(within(dialog).getByText("@joana_cria")).toBeInTheDocument();
    });

    it("starts expanded on /results and closes back to the search button", async () => {
      pathnameMock.mockReturnValue("/results");
      searchParamsMock.mockReturnValue(new URLSearchParams("q=docker"));
      const user = userEvent.setup();
      render(<SiteNavbar viewer={null} />);

      await user.click(screen.getByRole("button", { name: "Fechar busca" }));

      const toggle = within(actions()).getByRole("button", { name: "Buscar" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      await waitFor(() => expect(toggle).toHaveFocus());
      expect(
        screen.getByRole("button", { name: "Abrir menu" })
      ).toBeInTheDocument();
    });
  });
});
