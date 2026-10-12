// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CategoryFilter } from "../category-filter";

function chips() {
  return within(screen.getByRole("navigation", { name: "Categorias" })).getAllByRole(
    "link"
  );
}

describe("CategoryFilter", () => {
  it("offers Todos and the 8 categories in the enum order", () => {
    render(<CategoryFilter current={null} />);

    expect(chips().map((chip) => chip.textContent)).toEqual([
      "Todos",
      "Música",
      "Jogos",
      "Educação",
      "Entretenimento",
      "Notícias",
      "Esportes",
      "Tecnologia",
      "Outros",
    ]);
  });

  it("points each chip at the raw enum value, percent-encoded", () => {
    render(<CategoryFilter current={null} />);

    expect(screen.getByRole("link", { name: "Todos" })).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByRole("link", { name: "Música" })).toHaveAttribute(
      "href",
      "/?category=M%C3%BAsica"
    );
    expect(screen.getByRole("link", { name: "Jogos" })).toHaveAttribute(
      "href",
      "/?category=Jogos"
    );
  });

  it("selects Todos when there is no category", () => {
    render(<CategoryFilter current={null} />);

    const selected = chips().filter(
      (chip) => chip.getAttribute("aria-current") === "page"
    );
    expect(selected.map((chip) => chip.textContent)).toEqual(["Todos"]);
  });

  it("selects the current category", () => {
    render(<CategoryFilter current="Educação" />);

    const selected = chips().filter(
      (chip) => chip.getAttribute("aria-current") === "page"
    );
    expect(selected.map((chip) => chip.textContent)).toEqual(["Educação"]);
  });
});
