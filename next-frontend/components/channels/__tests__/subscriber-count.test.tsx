// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { SubscriberCount } from "../subscriber-count";

// A contagem de inscritos usa a forma abreviada pt-BR do design e anuncia a
// mudança para leitor de tela — é o elemento que acompanha o clique otimista.
describe("SubscriberCount", () => {
  it("abbreviates thousands in pt-BR", () => {
    render(<SubscriberCount count={1234} />);
    // O Intl pode separar "1,2" de "mil" com espaço comum ou não separável.
    expect(screen.getByText(/^1,2\smil inscritos$/)).toBeInTheDocument();
  });

  it("uses the singular for exactly one subscriber", () => {
    render(<SubscriberCount count={1} />);
    expect(screen.getByText("1 inscrito")).toBeInTheDocument();
  });

  it("keeps small counts unabbreviated and plural", () => {
    render(<SubscriberCount count={0} />);
    expect(screen.getByText("0 inscritos")).toBeInTheDocument();
  });

  it("announces changes politely to assistive technology", () => {
    render(<SubscriberCount count={42} />);
    expect(screen.getByText("42 inscritos")).toHaveAttribute(
      "aria-live",
      "polite"
    );
  });

  it("re-renders with the new value it receives", () => {
    const { rerender } = render(<SubscriberCount count={1199} />);
    rerender(<SubscriberCount count={1200} />);
    expect(screen.getByText(/^1,2\smil inscritos$/)).toBeInTheDocument();
  });
});
