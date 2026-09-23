// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { SiteNavbar } from "../site-navbar";

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
});
