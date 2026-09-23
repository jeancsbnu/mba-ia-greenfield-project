// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeAll } from "vitest";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";

// O Select é o campo de categoria da edição de vídeo: as opções vêm do enum do
// TD-10, sem fetch em runtime. O contrato observável é abrir a lista, escolher
// uma opção e devolver o valor escolhido.
const CATEGORIES = ["Música", "Jogos", "Educação"];

function CategorySelect(props: React.ComponentProps<typeof Select>) {
  return (
    <Select {...props}>
      <SelectTrigger aria-label="Categoria">
        <SelectValue placeholder="Selecione" />
      </SelectTrigger>
      <SelectContent>
        {CATEGORIES.map((category) => (
          <SelectItem key={category} value={category}>
            {category}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// O Select do Radix usa APIs de ponteiro e scroll que o jsdom não implementa.
// Sem esses stubs a lista nunca abre — limitação do ambiente de teste, não do componente.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});

describe("Select", () => {
  it("renders a combobox trigger showing the placeholder while empty", () => {
    render(<CategorySelect />);
    const trigger = screen.getByRole("combobox", { name: "Categoria" });
    expect(trigger).toHaveAttribute("data-slot", "select-trigger");
    expect(trigger).toHaveTextContent("Selecione");
  });

  it("shows the current value instead of the placeholder", () => {
    render(<CategorySelect value="Jogos" />);
    expect(screen.getByRole("combobox", { name: "Categoria" })).toHaveTextContent(
      "Jogos"
    );
  });

  it("opens the list on click and renders one option per category", async () => {
    const user = userEvent.setup();
    render(<CategorySelect />);

    await user.click(screen.getByRole("combobox", { name: "Categoria" }));

    const options = await screen.findAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual(CATEGORIES);
  });

  it("calls onValueChange with the chosen option", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<CategorySelect onValueChange={onValueChange} />);

    await user.click(screen.getByRole("combobox", { name: "Categoria" }));
    await user.click(await screen.findByRole("option", { name: "Educação" }));

    expect(onValueChange).toHaveBeenCalledWith("Educação");
  });

  it("exposes the trigger size as data-size (default when not given)", () => {
    const { rerender } = render(<CategorySelect />);
    expect(screen.getByRole("combobox", { name: "Categoria" })).toHaveAttribute(
      "data-size",
      "default"
    );

    rerender(
      <Select>
        <SelectTrigger aria-label="Categoria" size="sm">
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent />
      </Select>
    );
    expect(screen.getByRole("combobox", { name: "Categoria" })).toHaveAttribute(
      "data-size",
      "sm"
    );
  });
});
