// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { ChevronLeftIcon } from "@/components/icons/chevron-left-icon";

import { BackLink } from "../back-link";

describe("BackLink", () => {
  it("renders a link with the given href", () => {
    render(<BackLink href="/login" />);
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/login");
  });

  it("renders default label 'Voltar'", () => {
    render(<BackLink href="/login" />);
    expect(screen.getByRole("link", { name: /voltar/i })).toBeInTheDocument();
  });

  it("renders custom children", () => {
    render(<BackLink href="/home">Return home</BackLink>);
    expect(screen.getByRole("link", { name: "Return home" })).toBeInTheDocument();
  });

  it("sets data-slot=back-link", () => {
    render(<BackLink href="/login" />);
    expect(screen.getByRole("link")).toHaveAttribute("data-slot", "back-link");
  });

  it("renders the icon before the text, inside the same link", () => {
    render(
      <BackLink href="/me/videos" icon={<ChevronLeftIcon data-testid="icon" />}>
        Voltar para o painel
      </BackLink>
    );

    const link = screen.getByRole("link");
    const icon = screen.getByTestId("icon");

    expect(link).toContainElement(icon);
    expect(link).toHaveAttribute("href", "/me/videos");
    // compareDocumentPosition: o ícone precede o texto no mesmo link.
    expect(
      icon.compareDocumentPosition(link.lastChild as Node) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("keeps the accessible name limited to the text", () => {
    render(
      <BackLink href="/me/videos" icon={<ChevronLeftIcon />}>
        Voltar para o painel
      </BackLink>
    );

    expect(
      screen.getByRole("link", { name: "Voltar para o painel" })
    ).toBeInTheDocument();
  });

  it("renders no icon wrapper when icon is omitted", () => {
    const { container } = render(<BackLink href="/login" />);

    // Sem icon a saída é a da Fase 02: só o texto dentro do link.
    expect(
      container.querySelector('[data-slot="back-link-icon"]')
    ).toBeNull();
  });
});
