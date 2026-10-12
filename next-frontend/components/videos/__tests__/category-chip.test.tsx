// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CategoryChip } from "../category-chip";

describe("CategoryChip", () => {
  it("renders a link with the label and the destination", () => {
    render(<CategoryChip label="Música" href="/?category=M%C3%BAsica" />);

    expect(screen.getByRole("link", { name: "Música" })).toHaveAttribute(
      "href",
      "/?category=M%C3%BAsica"
    );
  });

  it("announces only the selected chip as the current page", () => {
    render(<CategoryChip label="Todos" href="/" selected />);

    const chip = screen.getByRole("link", { name: "Todos" });
    expect(chip).toHaveAttribute("aria-current", "page");
    expect(chip).toHaveAttribute("data-state", "selected");
  });

  it("leaves a default chip without aria-current", () => {
    render(<CategoryChip label="Jogos" href="/?category=Jogos" />);

    const chip = screen.getByRole("link", { name: "Jogos" });
    expect(chip).not.toHaveAttribute("aria-current");
    expect(chip).toHaveAttribute("data-state", "default");
  });
});
