// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VideoDescription } from "../video-description";

const DESCRIPTION =
  "Neste vídeo mostro todos os detalhes do estúdio: iluminação, tratamento acústico, câmeras e a mesa de edição.";

// jsdom não faz layout: scrollHeight e clientHeight são 0. Cada caso diz se
// o texto recolhido transborda as duas linhas.
function mockTextOverflow(overflowing: boolean) {
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(40);
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(
    overflowing ? 120 : 40
  );
}

describe("VideoDescription", () => {
  beforeEach(() => {
    mockTextOverflow(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("hides the toggle when the text fits in the collapsed box", () => {
    mockTextOverflow(false);
    render(<VideoDescription description="Descrição curta de uma linha." />);

    expect(screen.getByText("Descrição curta de uma linha.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mostrar mais" })
    ).not.toBeInTheDocument();
  });

  it("starts collapsed and announces it through aria-expanded", () => {
    render(<VideoDescription description={DESCRIPTION} />);

    const toggle = screen.getByRole("button", { name: "Mostrar mais" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    // O botão tem de controlar a região da descrição para o leitor de tela
    // saber o que foi expandido.
    const controlled = toggle.getAttribute("aria-controls");
    expect(controlled).not.toBeNull();
    expect(document.getElementById(controlled as string)).toHaveTextContent(
      DESCRIPTION
    );
  });

  it("expands and collapses on click, flipping the label and aria-expanded", async () => {
    const user = userEvent.setup();
    render(<VideoDescription description={DESCRIPTION} />);

    await user.click(screen.getByRole("button", { name: "Mostrar mais" }));

    const expanded = screen.getByRole("button", { name: "Mostrar menos" });
    expect(expanded).toHaveAttribute("aria-expanded", "true");

    await user.click(expanded);

    expect(
      screen.getByRole("button", { name: "Mostrar mais" })
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("renders nothing when there is no description", () => {
    const { container } = render(<VideoDescription description={null} />);

    // Uma caixa vazia com um "Mostrar mais" que nada revela seria pior do que
    // ausência: o vídeo simplesmente não tem descrição.
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the description is only whitespace", () => {
    // Atributo JSX entre aspas não interpreta escapes — ali "\n" seria barra
    // invertida literal. A expressão é o que produz a quebra de linha.
    const { container } = render(<VideoDescription description={"   \n  "} />);

    expect(container).toBeEmptyDOMElement();
  });
});
