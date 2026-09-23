// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { Badge } from "../badge";

// O Badge é a base dos chips de status e visibilidade do painel (SI-04.0.6):
// o que importa é o texto exibido e o data-variant que os componentes de vídeo
// escolhem por estado. As classes em si são responsabilidade do cva/DS.
describe("Badge", () => {
  it("renders its content with data-slot=badge", () => {
    render(<Badge>Publicado</Badge>);
    const badge = screen.getByText("Publicado");
    expect(badge).toHaveAttribute("data-slot", "badge");
  });

  it("exposes the variant as data-variant (default when not given)", () => {
    const { rerender } = render(<Badge>Rascunho</Badge>);
    expect(screen.getByText("Rascunho")).toHaveAttribute(
      "data-variant",
      "default"
    );

    rerender(<Badge variant="outline">Indisponível</Badge>);
    expect(screen.getByText("Indisponível")).toHaveAttribute(
      "data-variant",
      "outline"
    );
  });

  it("renders as a span by default", () => {
    render(<Badge>Público</Badge>);
    expect(screen.getByText("Público").tagName).toBe("SPAN");
  });

  it("renders as the child element when asChild is set", () => {
    render(
      <Badge asChild>
        <a href="/channel/videos">Ver vídeos</a>
      </Badge>
    );
    const link = screen.getByRole("link", { name: "Ver vídeos" });
    expect(link).toHaveAttribute("href", "/channel/videos");
    expect(link).toHaveAttribute("data-slot", "badge");
  });

  it("forwards aria-invalid to the rendered element", () => {
    render(<Badge aria-invalid>Erro</Badge>);
    expect(screen.getByText("Erro")).toHaveAttribute("aria-invalid", "true");
  });
});
