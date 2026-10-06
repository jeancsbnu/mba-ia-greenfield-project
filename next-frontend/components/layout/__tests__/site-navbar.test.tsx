// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { SiteNavbar } from "../site-navbar";

const { pathnameMock } = vi.hoisted(() => ({
  pathnameMock: vi.fn(() => "/"),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

// O navbar é o mesmo nas telas autenticadas e na página pública; o que muda é o
// slot da direita (UserMenu ou botão "Entrar").
describe("SiteNavbar", () => {
  it("renders the brand logo linking to the home page", () => {
    render(<SiteNavbar />);
    const link = screen.getByRole("link", { name: "StreamTube" });
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders the anonymous slot (Entrar)", () => {
    render(
      <SiteNavbar>
        <a href="/login">Entrar</a>
      </SiteNavbar>
    );
    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute(
      "href",
      "/login"
    );
  });

  it("renders the authenticated slot in place of the anonymous one", () => {
    render(
      <SiteNavbar>
        <div data-testid="user-menu-slot">menu</div>
      </SiteNavbar>
    );
    expect(screen.getByTestId("user-menu-slot")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Entrar" })).not.toBeInTheDocument();
  });

  it("renders as a banner landmark with data-slot", () => {
    render(<SiteNavbar />);
    const header = screen.getByRole("banner");
    expect(header).toHaveAttribute("data-slot", "site-navbar");
  });

  it("does not render search or extra navigation (Fase 07 scope)", () => {
    render(<SiteNavbar />);
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  // Fase 06 — ponto de entrada da área de canais seguidos (social-interactions/TD-07).
  describe("subscriptions link", () => {
    it("is absent by default, as in the anonymous chrome", () => {
      render(<SiteNavbar />);
      expect(
        screen.queryByRole("link", { name: "Canais seguidos" })
      ).not.toBeInTheDocument();
    });

    it("points to /channel/subscriptions when enabled", () => {
      pathnameMock.mockReturnValue("/channel/videos");
      render(<SiteNavbar showSubscriptionsLink />);
      const link = screen.getByRole("link", { name: "Canais seguidos" });
      expect(link).toHaveAttribute("href", "/channel/subscriptions");
      expect(link).not.toHaveAttribute("aria-current");
    });

    it("marks itself as the current page on the subscriptions route", () => {
      pathnameMock.mockReturnValue("/channel/subscriptions");
      render(<SiteNavbar showSubscriptionsLink />);
      expect(
        screen.getByRole("link", { name: "Canais seguidos" })
      ).toHaveAttribute("aria-current", "page");
    });
  });
});
