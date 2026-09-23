// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";

import { Textarea } from "../textarea";

// O Textarea é o campo de descrição do vídeo e do canal. O que a Fase 04 usa dele
// é o básico de um campo de formulário: digitar, refletir valor controlado, ficar
// desabilitado e sinalizar erro de validação via aria-invalid.
describe("Textarea", () => {
  it("renders a textbox with data-slot=textarea", () => {
    render(<Textarea aria-label="Descrição" />);
    const field = screen.getByRole("textbox", { name: "Descrição" });
    expect(field).toHaveAttribute("data-slot", "textarea");
    expect(field.tagName).toBe("TEXTAREA");
  });

  it("shows the placeholder while empty", () => {
    render(<Textarea aria-label="Descrição" placeholder="Conte sobre o vídeo" />);
    expect(
      screen.getByPlaceholderText("Conte sobre o vídeo")
    ).toBeInTheDocument();
  });

  it("reflects the controlled value", () => {
    render(<Textarea aria-label="Descrição" value="Receita de bolo" readOnly />);
    expect(screen.getByRole("textbox", { name: "Descrição" })).toHaveValue(
      "Receita de bolo"
    );
  });

  it("calls onChange as the user types", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textarea aria-label="Descrição" onChange={onChange} />);

    await user.type(screen.getByRole("textbox", { name: "Descrição" }), "oi");

    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("does not accept typing when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textarea aria-label="Descrição" disabled onChange={onChange} />);

    const field = screen.getByRole("textbox", { name: "Descrição" });
    expect(field).toBeDisabled();
    await user.type(field, "oi");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("exposes aria-invalid so the form can flag a validation error", () => {
    render(<Textarea aria-label="Descrição" aria-invalid />);
    expect(screen.getByRole("textbox", { name: "Descrição" })).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });
});
