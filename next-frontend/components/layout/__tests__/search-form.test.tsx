// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SearchForm } from "../search-form";

// next/form navega pelo router do App Router, que não existe fora do Next.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
}));

describe("SearchForm", () => {
  it("submits the term as q to /results", () => {
    render(<SearchForm />);

    const form = screen.getByRole("search");
    expect(form).toHaveAttribute("action", "/results");
    expect(
      screen.getByRole("searchbox", { name: "Buscar vídeos ou canais" })
    ).toHaveAttribute("name", "q");
  });

  it("mirrors the 3 to 100 character rule of the API", () => {
    render(<SearchForm />);

    const input = screen.getByRole("searchbox");
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("minLength", "3");
    expect(input).toHaveAttribute("maxLength", "100");
  });

  it("fills the field with the current term", () => {
    render(<SearchForm defaultValue="docker" />);

    expect(screen.getByRole("searchbox")).toHaveValue("docker");
  });

  it("submits through a Buscar button on desktop", () => {
    render(<SearchForm variant="desktop" />);

    expect(screen.getByRole("button", { name: "Buscar" })).toHaveAttribute(
      "type",
      "submit"
    );
  });

  // No mobile o submit é o botão "Buscar" da barra, ligado ao form pelo id.
  it("renders no button of its own on mobile and exposes the form id", () => {
    render(<SearchForm variant="mobile" id="busca" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("search")).toHaveAttribute("id", "busca");
  });
});
