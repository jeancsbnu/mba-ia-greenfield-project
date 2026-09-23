// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { RadioGroup, RadioGroupItem } from "../radio-group";

// O RadioGroup é o campo de visibilidade da edição de vídeo (public | unlisted, TD-02).
// O Figma desenha os radios como imagens, então o ponto aqui é garantir a semântica
// nativa: role radiogroup, seleção por clique e navegação por setas.
function VisibilityGroup(props: React.ComponentProps<typeof RadioGroup>) {
  return (
    <RadioGroup aria-label="Visibilidade" {...props}>
      <label>
        <RadioGroupItem value="public" />
        Público
      </label>
      <label>
        <RadioGroupItem value="unlisted" />
        Indisponível
      </label>
    </RadioGroup>
  );
}

// A navegação por setas (roving focus do Radix) não é asserida aqui: ela depende de
// eventos de foco que o jsdom não reproduz, e o guia de testes do projeto orienta a não
// reafirmar comportamento de biblioteca em components/ui/. Cobertura real fica no E2E
// da tela de edição de vídeo.
describe("RadioGroup", () => {
  it("renders a labelled radiogroup with one radio per item", () => {
    render(<VisibilityGroup />);
    expect(screen.getByRole("radiogroup", { name: "Visibilidade" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("marks the item matching the value as checked", () => {
    render(<VisibilityGroup value="unlisted" />);
    const [publico, indisponivel] = screen.getAllByRole("radio");
    expect(publico).toHaveAttribute("aria-checked", "false");
    expect(indisponivel).toHaveAttribute("aria-checked", "true");
  });

  it("calls onValueChange with the clicked item value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<VisibilityGroup onValueChange={onValueChange} />);

    await user.click(screen.getByRole("radio", { name: "Indisponível" }));

    expect(onValueChange).toHaveBeenCalledWith("unlisted");
  });

  it("does not fire onValueChange when the group is disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<VisibilityGroup disabled onValueChange={onValueChange} />);

    await user.click(screen.getByRole("radio", { name: "Indisponível" }));

    expect(onValueChange).not.toHaveBeenCalled();
  });
});
